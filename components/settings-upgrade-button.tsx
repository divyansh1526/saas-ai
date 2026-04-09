"use client";

import { Sparkles } from "lucide-react";
import { useProModal } from "@/hooks/use-pro-modal";
import { Button } from "@/components/ui/button";

export default function SettingsUpgradeButton() {
  const { onOpen } = useProModal();

  return (
    <Button onClick={onOpen} variant="premium" className="cursor-pointer">
      <Sparkles className="h-4 w-4" />
      Upgrade Now
    </Button>
  );
}
