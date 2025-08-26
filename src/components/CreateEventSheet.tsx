// src/components/CreateEventSheet.tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import EventForm from "@/components/EventForm";

type FacilityOption = { id: string; name: string };
type Props = { facilities: FacilityOption[] };

export default function CreateEventSheet({ facilities }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const router = useRouter();

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      // block closing while submitting
      if (pending && nextOpen === false) return;
      setOpen(nextOpen);
    },
    [pending]
  );

  const handleSuccess = useCallback(
    (id: string, name: string) => {
      setCreatedCount((c) => c + 1);
      router.refresh(); // refresh grid behind the sheet
      toast.success(`Event "${name}" created successfully!`);
      // keep the sheet open for rapid entry
    },
    [router]
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button>+ Create Event</Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="max-w-lg w-full overflow-y-auto px-10"
        onEscapeKeyDown={(e) => pending && e.preventDefault()}
        onPointerDownOutside={(e) => pending && e.preventDefault()}
        onInteractOutside={(e) => pending && e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Create event</SheetTitle>
          <SheetDescription>
            {createdCount > 0
              ? `${createdCount} event(s) created this session`
              : "Fill in the fields to add a new event."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <EventForm
            facilities={facilities}
            resetOnSuccess
            onPendingChange={setPending}
            onSuccess={handleSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
