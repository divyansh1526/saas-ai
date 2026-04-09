import Image from "next/image";
import Link from "next/link";
import { Companion } from "@prisma/client";
import { MessagesSquare } from "lucide-react";

import { Card, CardFooter, CardHeader } from "@/components/ui/card";

interface CompanionsProps {
  data: (Companion & {
    _count: {
      messages: number;
    };
  })[];
}

export default function Companions({ data }: CompanionsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="pt-10 flex flex-col items-center justify-center space-y-4">
        <div className="w-44 h-44 relative">
          <Image
            src="/empty.png"
            alt="No companions"
            fill
            className="object-contain grayscale"
            priority
          />
        </div>
        <p className="text-sm text-muted-foreground">No Companions Found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-10">
      {data.map((item) => (
        <Card
          key={item.id}
          className="overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md bg-primary/15"
        >
          <Link
            href={`/chat/${item.id}`}
            className="group block h-full focus:outline-none"
            aria-label={`Open chat with ${item.name}`}
          >
            <CardHeader className="p-3 flex flex-col items-stretch gap-3">
              <div className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-800">
                <Image
                  src={item.src}
                  alt={item.name ?? "Companion image"}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col mt-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-tight truncate">
                    {item.name}
                  </h3>
                  <span className="text-xs text-muted-foreground lowercase truncate">
                    {item.description}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardFooter className="px-3 py-2 flex items-center justify-between text-xs text-muted-foreground border-t">
              <div className="flex items-center gap-2">
                <MessagesSquare className="w-4 h-4" />
                <span className="font-medium">{item._count.messages}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">Chat</div>
            </CardFooter>
          </Link>
        </Card>
      ))}
    </div>
  );
}
