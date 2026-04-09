import { currentUser} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prismadb from "@/lib/prismadb";
// import { checkSubscription } from "@/lib/subscription";

interface PatchContext {
  params: Promise<{ companionId?: string }>;
}

interface DeleteContext {
  params: Promise<{ companionId?: string }>;
}

export async function PATCH(req: Request, context: PatchContext) {
  try {
    const { companionId } = await context.params;
    if (!companionId) {
      return new NextResponse("Companion ID is required.", { status: 400 });
    }
    const user = await currentUser();
    if (!user || !user.id || !user.firstName) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const body = await req.json();
    const { src, name, description, instructions, seed, categoryId } = body;


    if (
      !src ||
      !name ||
      !description ||
      !instructions ||
      !seed ||
      !categoryId
    ) {
      return new NextResponse("Missing Required Field.", { status: 400 });
    }

    const existing = await prismadb.companion.findUnique({
      where: { id: companionId }
    });

    if (!existing) {
      return new NextResponse("Companion not found.", { status: 404 });
    }

    if (existing.userId !== user.id) {
      return new NextResponse("Forbidden: not the owner.", { status: 403 });
    }

    // const isPro = await checkSubscription();

    // if (!isPro) {
    //   return new NextResponse(
    //     "Pro Subscription is Required to Create New Companion.",
    //     { status: 403 }
    //   );
    // }

    const companion = await prismadb.companion.update({
      where: {
        id: companionId,
        userId: user.id
      },
      data: {
        categoryId,
        userId: user.id,
        userName: user.firstName,
        src,
        name,
        description,
        instructions,
        seed
      }
    });

    return NextResponse.json(companion);
  } catch (error) {
    console.error("[COMPANION_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


export async function DELETE(req: Request, context: DeleteContext) {
  try {
    const { companionId } = await context.params;
    if (!companionId) {
      return new NextResponse("Companion ID is required.", { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const existing = await prismadb.companion.findUnique({
      where: { id: companionId },
    });

    if (!existing) {
      return new NextResponse("Companion not found.", { status: 404 });
    }

    const deleted = await prismadb.companion.delete({
      where: { id: companionId, userId},
    });

    return NextResponse.json(deleted);
  } catch (error) {
    console.error("[COMPANION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
