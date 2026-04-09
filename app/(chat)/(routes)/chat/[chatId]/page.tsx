import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import prismadb from "@/lib/prismadb";
import ChatClient from "./components/client";

interface ChatIdPageProps {
  params: Promise<{ chatId?: string | string[] }>;
}

export default async function ChatIdPage({ params }: ChatIdPageProps) {
  const resolved = await params;
  const rawId = resolved?.chatId;
  const chatId = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!chatId || typeof chatId !== "string") {
    return redirect("/");
  }
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }

  const companion = await prismadb.companion.findUnique({
    where: { id: chatId },
    include: {
      messages: {
        where: { userId },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { messages: true } },
    },
  });

  if (!companion) {
    return redirect("/");
  }
  return <ChatClient companion={companion} />;
}
