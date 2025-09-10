"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import CreateEventSheet from "@/components/CreateEventSheet";

type FacilityOption = { id: string; name: string };

interface Props {
  facilities: FacilityOption[];
}

/**
 * CreateEventCard Component
 * 
 * A clickable card that triggers the CreateEventSheet when clicked.
 * This component handles the client-side state management for opening/closing
 * the sheet while maintaining the dashboard card styling.
 */
export default function CreateEventCard({ facilities }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleCardClick = () => {
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
  };

  return (
    <>
      {/* Clickable Card */}
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        aria-label="Create new event"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Create Event</CardTitle>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Set up a new competition
          </p>
        </CardContent>
      </Card>

      {/* Create Event Sheet */}
      <CreateEventSheet 
        facilities={facilities} 
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
    </>
  );
}