import { notFound } from "next/navigation";
import prismadb from "@/lib/prismadb";
import CompanionForm from "./components/companion-form";
import { auth } from "@clerk/nextjs/server";
import { RedirectToSignIn } from "@clerk/nextjs";

interface CompanionIdPageProps {
  params: Promise<{ companionId?: string | string[] }>;
}

export default async function CompanionIdPage({ params }: CompanionIdPageProps) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.companionId;
  const companionId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { userId } = await auth();

  if (!userId) return <RedirectToSignIn/>;

  if (!companionId || typeof companionId !== "string") {
    console.warn("Missing or invalid companionId:", companionId);
    return notFound();
  }
  
  const companion = await prismadb.companion.findUnique({
    where: { id: companionId, userId },
  });

  const categories = await prismadb.category.findMany();

  return <CompanionForm initialData={companion} categories={categories} />;
}
