"use client";

import { useCallback, useState, useEffect } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import EventForm from "@/components/EventForm";

interface FacilityOption {
  id: string;
  name: string;
}

interface EventData {
  id: string;
  name: string;
  date: string; // Already formatted for datetime-local
  durationDays: number;
  facility: string;
  discipline: string;
  ageCategories: string[];
  division: string;
  description?: string;
  registrationDeadline: string; // Already formatted for date input
  maxParticipants?: number;
  entryFee?: number;
  contactEmail?: string;
  imageUrl?: string;
}

interface UpdateEventSheetProps {
  facilities: FacilityOption[];
  eventId: string;
  children: React.ReactNode; // The trigger element
}

// State Management Setup

export default function UpdateEventSheet({
  facilities,
  eventId,
  children,
}: UpdateEventSheetProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Event Data Fetching Logic
  // Fetch event data when sheet opens

  const fetchEventData = useCallback(async () => {
    if (!eventId || eventData) return; // Don't refetch if already loaded

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("You must be logged in to edit events");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to edit this event");
        }
        if (response.status === 404) {
          throw new Error("Event not found");
        }
        throw new Error("Failed to load event data");
      }
      const data = await response.json();
      setEventData(data);

    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load event";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [eventId, eventData]);

  // Fetch data when sheet opens
  useEffect(() => {
    if (open && !eventData && !loading) {
      fetchEventData();
    }
  }, [open, eventData, loading, fetchEventData]);

  // Open/Close State Management
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      // Prevent closing while form is submitting
      if (pending && nextOpen === false) return;

      // Clear error when opening
      if (nextOpen && error) {
        setError(null);
      }

      setOpen(nextOpen);
    },
    [pending, error]
  );

  // Form Success/Error Handlers
  const handleSuccess = useCallback((id: string, name: string) => {
    toast.success(`"${name}" updated successfully!`);
    setOpen(false);

    // Clear cached data so it refetches on next open
    setEventData(null);

    // Optional: trigger a page refresh or router refresh
    // router.refresh(); // If using Next.js router
  }, []);

  const handlePendingChange = useCallback((isPending: boolean) => {
    setPending(isPending);
  }, []);

  // Render Logic with Loading States
  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent
        side="left"
        className="max-w-lg w-full overflow-y-auto px-10">
        <SheetHeader>
          <SheetTitle>Edit Event</SheetTitle>
          <SheetDescription>Update the event details below.</SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div
                className="animate-spin h-8 w-8 border-4 border-primary 
    border-t-transparent rounded-full"
              />
              <span className="ml-3 text-sm text-muted-foreground">
                Loading event data...
              </span>
            </div>
          )}

          {error && !loading && (
            <div
              className="bg-destructive/15 text-destructive px-4 py-3 rounded-md 
    mb-4"
            >
              {error}
            </div>
          )}

          {eventData && !loading && !error && (
            <EventForm
              facilities={facilities}
              mode="update"
              eventData={eventData}
              onPendingChange={handlePendingChange}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
