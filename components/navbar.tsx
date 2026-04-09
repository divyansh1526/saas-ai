"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { UserButton } from "@clerk/nextjs";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import MobileSidebar from "./mobile-sidebar";
import { useProModal } from "@/hooks/use-pro-modal";

const font = Poppins({
  weight: "600",
  subsets: ["latin"],
});

interface NavbarProps {
  isPro: boolean;
}

export default function Navbar({ isPro }: NavbarProps) {
  const { onOpen } = useProModal();

  return (
    <div className="fixed w-full z-50 flex justify-between items-center py-2 px-4 h-16 border-b border-primary/10 bg-secondary">
      <div className="flex items-center">
        <MobileSidebar />
        <Link href="/">
          <h1
            className={cn(
              "hidden md:block text-xl md:text-3xl font-bold text-primary",
              font.className
            )}
          >
            companion.ai
          </h1>
        </Link>
      </div>
      <div className="flex items-center gap-x-3">
        {isPro ? (
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-sky-500 border border-sky-500/30 bg-sky-500/10 rounded-full px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 fill-sky-500" />
            Pro
          </span>
        ) : (
          <Button
            onClick={onOpen}
            className="cursor-pointer"
            size="sm"
            variant="premium"
          >
            Upgrade
            <Sparkles className="h-4 w-4 fill-white text-white ml-2" />
          </Button>
        )}
        <ModeToggle />
        <UserButton />
      </div>
    </div>
  );
}
