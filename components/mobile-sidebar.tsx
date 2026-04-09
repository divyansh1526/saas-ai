import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "@/components/sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle } from "@radix-ui/react-dialog";

export default function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden pr-4">
        <Menu />
      </SheetTrigger>

      <SheetContent className="p-0 bg-secondary pt-10 w-32" side="left">
        <VisuallyHidden>
          <DialogTitle>Mobile navigation</DialogTitle>
        </VisuallyHidden>

        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
