import SearchInput from "@/components/search-input";
import Categories from "@/components/categories";
import prismadb from "@/lib/prismadb";
import { Suspense } from "react";
import Companions from "@/components/companions";

interface RootPageProps {
  searchParams: Promise<{ categoryId?: string; name?: string }>;
}

export default async function RootPage({ searchParams }: RootPageProps) {
  const resolved = await searchParams;
  const categoryId = resolved?.categoryId;
  const name = resolved?.name;

  const where: Record<string, any> = {};
  if (categoryId) where.categoryId = categoryId;
  if (name) where.name = { search: name };

  const data = await prismadb.companion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  const categories = await prismadb.category.findMany();

  return (
    <div className="h-full p-4 space-y-2">
      <Suspense fallback={<div>Loading search input...</div>}>
        <SearchInput />
      </Suspense>

      <Suspense fallback={<div>Loading categories...</div>}>
        <Categories data={categories} />
      </Suspense>

      <Suspense fallback={<div>Loading companions...</div>}>
        <Companions data={data} />
      </Suspense>
    </div>
  );
}
