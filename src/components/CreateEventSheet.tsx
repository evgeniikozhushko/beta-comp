// src/components/CreateEventSheet.tsx
"use client";

import React, { useCallback, useState, useEffect } from "react";
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

interface Props {
  facilities: FacilityOption[];
  // New props for external control
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Optional: hide the trigger button when controlled externally
  hideTrigger?: boolean;
}

/**
 * CreateEventSheet Component
 * 
 * Enhanced to support both internal and external state management.
 * When open/onOpenChange props are provided, the sheet is controlled externally.
 * When not provided, it maintains its original internal state behavior.
 */
export default function CreateEventSheet({ 
  facilities, 
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  hideTrigger = false 
}: Props) {
  // Internal state (used when not controlled externally)
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const router = useRouter();

  // Determine if this is externally controlled
  const isExternallyControlled = externalOpen !== undefined && externalOnOpenChange !== undefined;
  
  // Use external or internal state
  const open = isExternallyControlled ? externalOpen : internalOpen;
  const setOpen = isExternallyControlled ? externalOnOpenChange! : setInternalOpen;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      // Block closing while submitting
      if (pending && nextOpen === false) return;
      setOpen(nextOpen);
    },
    [pending, setOpen]
  );

  const handleSuccess = useCallback(
    (id: string, name: string) => {
      setCreatedCount((c) => c + 1);
      router.refresh(); // refresh grid behind the sheet
      toast.success(`Event "${name}" created successfully!`);
      // Keep the sheet open for rapid entry (original behavior)
    },
    [router]
  );

  // Reset pending state when sheet closes
  useEffect(() => {
    if (!open) {
      setPending(false);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {/* Conditional trigger - only show if not hidden and not externally controlled */}
      {!hideTrigger && !isExternallyControlled && (
        <SheetTrigger asChild>
          <Button>+ Create Event</Button>
        </SheetTrigger>
      )}

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