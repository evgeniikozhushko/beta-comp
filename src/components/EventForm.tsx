// src/components/EventForm.tsx
"use client";

import { useFormState } from "react-dom";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { createEventAction } from "@/app/events/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useActionState } from "react";

interface FacilityOption {
  id: string;
  name: string;
}

interface Props {
  facilities: FacilityOption[];
}

/**
 * EventForm
 *
 * Renders a form for creating new events.
 * Uses server-action createEventAction via useFormState for submission,
 * and displays client-side and server-side validation.
 */
export default function EventForm({ facilities }: Props) {
  // Initialize form state with default values for error and pending
  const [formState, formAction] = useActionState(createEventAction, {
    error: "",
    pending: false,
  });

  return (
    <form action={formAction} className="space-y-6 max-w-lg" noValidate>
      {/* NAME */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Event Name
        </label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Boulder Bash 2025"
          required // client-side required validation
        />
      </div>

      {/* DATE */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium mb-1">
          Date
        </label>
        <Input
          id="date"
          name="date"
          type="date"
          required // must select a date
        />
      </div>

      {/* DURATION */}
      <div>
        <label
          htmlFor="durationMinutes"
          className="block text-sm font-medium mb-1"
        >
          Duration (minutes)
        </label>
        <Input
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          min={1}
          required // ensure a duration is provided
        />
      </div>

      {/* FACILITY */}
      <div>
        <label htmlFor="facility" className="block text-sm font-medium mb-1">
          Facility
        </label>
        <select
          id="facility"
          name="facility"
          required // client must choose a facility
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
        >
          <option value="">Select a facility</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* DISCIPLINE */}
      <div>
        <label htmlFor="discipline" className="block text-sm font-medium mb-1">
          Discipline
        </label>
        <select
          id="discipline"
          name="discipline"
          required
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
        >
          <option value="">Choose one</option>
          <option value="Boulder">Boulder</option>
          <option value="Lead">Lead</option>
          <option value="Speed">Speed</option>
        </select>
      </div>

      {/* AGE CATEGORIES */}
      <div>
        <label className="block text-sm font-medium mb-1">Age Categories</label>
        <div className="space-y-1">
          {/* No client-side required, validated server-side */}
          {["U12", "U18", "Open"].map((cat) => (
            <label key={cat} className="inline-flex items-center mr-4">
              <input
                type="checkbox"
                name="ageCategories"
                value={cat}
                className="mr-2"
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      {/* DIVISION */}
      <div>
        <label htmlFor="division" className="block text-sm font-medium mb-1">
          Division
        </label>
        <select
          id="division"
          name="division"
          required
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
        >
          <option value="">Choose one</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Mixed">Mixed</option>
        </select>
      </div>

      {/* OPTIONAL FIELDS - no "required" attributes */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="registrationDeadline"
          className="block text-sm font-medium mb-1"
        >
          Registration Deadline (optional)
        </label>
        <Input
          id="registrationDeadline"
          name="registrationDeadline"
          type="date"
        />
      </div>

      <div>
        <label
          htmlFor="maxParticipants"
          className="block text-sm font-medium mb-1"
        >
          Max Participants (optional)
        </label>
        <Input
          id="maxParticipants"
          name="maxParticipants"
          type="number"
          min={1}
        />
      </div>

      <div>
        <label htmlFor="entryFee" className="block text-sm font-medium mb-1">
          Entry Fee (optional)
        </label>
        <Input
          id="entryFee"
          name="entryFee"
          type="number"
          min={0}
          step="0.01"
        />
      </div>

      <div>
        <label
          htmlFor="contactEmail"
          className="block text-sm font-medium mb-1"
        >
          Contact Email (optional)
        </label>
        <Input id="contactEmail" name="contactEmail" type="email" />
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
          Image URL (optional)
        </label>
        <Input id="imageUrl" name="imageUrl" type="url" />
      </div>

      {/* SERVER ERROR BANNER */}
      {formState?.error && (
        <p className="text-center text-sm text-red-600">
          {getErrorMessage(formState.error)}
        </p>
      )}

      {/* SUBMIT BUTTON */}
      <Button type="submit" className="w-full" disabled={formState?.pending}>
        {formState?.pending ? "Creating…" : "Create Event"}
      </Button>
    </form>
  );
}
