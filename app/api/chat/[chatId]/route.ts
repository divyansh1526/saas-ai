import { streamText, type ModelMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { MemoryManager } from "@/lib/memory";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";
import {
  checkAiRequestsCount,
  decreaseAiRequestsCount,
} from "@/lib/user-settings";
import { checkSubscription } from "@/lib/subscription";

/**
 * Parses the Redis chat history string into ModelMessage[] for Gemini.
 *
 * History lines look like:
 *   "User: <message>"        ← actual user turns
 *   "Human: <message>"      ← seed conversation user turns
 *   "<CompanionName>: <msg>" ← companion/assistant turns
 *
 * Gemini requires strictly alternating user/assistant turns with no
 * consecutive duplicates, so we merge adjacent same-role entries.
 */
function parseHistoryToMessages(
  history: string,
  companionName: string,
): ModelMessage[] {
  const lines = history.split("\n").filter((l) => l.trim());
  const messages: ModelMessage[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    let role: "user" | "assistant" | null = null;
    let content = "";

    if (trimmed.startsWith("User: ")) {
      role = "user";
      content = trimmed.slice(6).trim();
    } else if (trimmed.startsWith("Human: ")) {
      role = "user";
      content = trimmed.slice(7).trim();
    } else if (trimmed.startsWith(`${companionName}: `)) {
      role = "assistant";
      content = trimmed.slice(companionName.length + 2).trim();
    }

    if (!role || !content) continue;

    // Merge consecutive same-role entries to satisfy Gemini's alternating requirement
    const last = messages[messages.length - 1];
    if (last && last.role === role) {
      // ModelMessage content is string here since we're building plain text messages
      (last as { role: "user" | "assistant"; content: string }).content +=
        "\n" + content;
    } else {
      messages.push({ role, content });
    }
  }

  // Gemini requires the first message to be from the user
  while (messages.length > 0 && messages[0].role !== "user") {
    messages.shift();
  }

  return messages;
}

export async function POST(
  request: Request,
  props: { params: Promise<{ chatId: string }> },
) {
  const params = await props.params;
  try {
    const { prompt } = await request.json();
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const identifier = request.url + "-" + userId;
    const { success } = await rateLimit(identifier);

    if (!success) {
      return new NextResponse("Payment Required", { status: 402 });
    }

    const isPro = await checkSubscription();

    if (!isPro) {
      const checkAiRequestsCountResp = await checkAiRequestsCount();

      if (!checkAiRequestsCountResp) {
        return new NextResponse("Premium subscription is required", {
          status: 402,
        });
      }
    }

    const companion = await prismadb.companion.update({
      where: {
        id: params.chatId,
      },
      data: {
        messages: {
          create: {
            content: prompt,
            role: "user",
            userId: userId,
          },
        },
      },
    });

    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 });
    }

    const companion_file_name = companion.id + ".txt";

    const companionKey = {
      companionId: companion.id,
      userId: userId,
    };

    const memoryManager = await MemoryManager.getInstance();
    const existingRecords = await memoryManager.readLatestHistory(companionKey);

    if (existingRecords.length === 0) {
      await memoryManager.seedChatHistory(companion.seed, "\n\n", companionKey);
    }

    await memoryManager.writeToHistory(`User: ${prompt}\n`, companionKey);

    const recentChatHistory =
      await memoryManager.readLatestHistory(companionKey);

    const similarDocs = await memoryManager.vectorSearch(
      recentChatHistory,
      companion_file_name,
    );

    let relevantHistory = "";
    if (similarDocs && similarDocs.length > 0) {
      relevantHistory = similarDocs.map((doc) => doc.pageContent).join("\n");
    }

    // ─── System prompt ────────────────────────────────────────────────────────
    // This is a privileged, model-level instruction. Gemini treats it as the
    // ground truth about who it is — far stronger than anything in the user turn.
    const systemPrompt = [
      `You are ${companion.name}. ${companion.description}.`,
      "",
      "=== YOUR IDENTITY & PERSONALITY ===",
      companion.instructions,
      "",
      `=== HOW ${companion.name.toUpperCase()} SPEAKS — EXAMPLE CONVERSATIONS ===`,
      "Study these examples carefully. They show your exact vocabulary, tone, and mannerisms.",
      companion.seed,
      relevantHistory
        ? `\n=== RELEVANT CONTEXT FROM YOUR MEMORY ===\n${relevantHistory}`
        : "",
      "",
      "=== ABSOLUTE RULES — NEVER VIOLATE THESE ===",
      `- You ARE ${companion.name}. This is not a roleplay — this is who you are.`,
      `- Respond exactly as ${companion.name} would: use their specific vocabulary, speech patterns, depth of knowledge, and personality quirks.`,
      "- Never say you are an AI, a language model, or a chatbot.",
      "- Never break character for any reason whatsoever.",
      "- Never add disclaimers, meta-commentary, or caveats about the conversation.",
      "- Respond in first person, as yourself, authentically.",
      "- Let your unique personality, expertise, and worldview shape every sentence.",
      "- If asked something outside your knowledge era or domain, respond as the character genuinely would — with curiosity, deflection, or in-character speculation.",
      "",
      "=== RESPONSE LENGTH & STYLE ===",
      "- Keep every reply to 3–4 sentences MAX. This is a chat conversation, not a lecture.",
      "- Be punchy, direct, and in-character — no long paragraphs, no bullet-point lists, no numbered sections.",
      "- Pack personality and depth into short sentences. Less is more.",
      "- If the user asks multiple questions, pick the most interesting one and answer that. Do not answer all of them.",
      "- End with a short follow-up question or a witty in-character remark to keep the conversation alive.",
    ]
      .join("\n")
      .trim();

    // ─── Conversation history ─────────────────────────────────────────────────
    // Parse the Redis history into proper alternating user/assistant turns.
    // The current user message is already at the end of recentChatHistory
    // (written above), so parseHistoryToMessages includes it as the final turn.
    const messages = parseHistoryToMessages(recentChatHistory, companion.name);

    // Safety: if parsing produced nothing or no final user message, fall back
    // to a bare user message so the request always succeeds.
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      messages.push({ role: "user", content: prompt });
    }

    // ─── Gemini call ──────────────────────────────────────────────────────────
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const result = streamText({
      model: google(modelName),
      system: systemPrompt,
      messages,
      async onFinish({ text }) {
        await memoryManager.writeToHistory(
          `${companion.name}: ${text}\n`,
          companionKey,
        );

        await prismadb.companion.update({
          where: {
            id: params.chatId,
          },
          data: {
            messages: {
              create: {
                content: text,
                role: "system",
                userId: userId,
              },
            },
          },
        });

        if (!isPro) {
          await decreaseAiRequestsCount();
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.log("Error in chat route:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
