"use client";

import { Companion, Message } from "@prisma/client";
import {
  ChevronLeft,
  Edit,
  MessagesSquare,
  MoreVertical,
  Trash
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

import { Button } from "@/components/ui/button";
import BotAvatar from "@/components/bot-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";

interface ChatHeaderProps {
  companion: Companion & {
    messages: Message[];
    _count: { messages: number };
  };
}

export default function ChatHeader({ companion }: ChatHeaderProps) {
  const router = useRouter();
  const { user } = useUser();

  const onDelete = async () => {
    try {
      await axios.delete(`/api/companion/${companion.id}`);

      toast.success("Companion deleted successfully.");

      router.refresh();
      router.push("/");
    } catch (error) {
      toast.error("Something went wrong while deleting.");
    }
  };

  return (
    <div className="flex w-full justify-between items-center border-b border-primary/10 pb-3">
      <div className="flex mt-3 gap-x-2 items-center">
        <Button className="cursor-pointer" onClick={() => router.back()} size="icon" variant="ghost">
          <ChevronLeft className="h-8 w-8" />
        </Button>
        <BotAvatar src={companion.src} />
        <div className="flex flex-col gap-y-1">
          <div className="flex items-center gap-x-2">
            <p className="font-bold">{companion.name}</p>
            <div className="flex items-center text-xs text-muted-foreground">
              <MessagesSquare className="w-3 h-3 mr-1" />
              {companion._count.messages}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Created by {companion.userName}
          </p>
        </div>
      </div>

      {user?.id === companion.userId && (
        <DropdownMenu >
          <DropdownMenuTrigger className="cursor-pointer" asChild>
            <Button variant="secondary" size="icon">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer"
              onClick={() => router.push(`/companion/${companion.id}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer" onClick={onDelete}>
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
