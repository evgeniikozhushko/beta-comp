// src/components/EventForm.tsx
"use client";

import { getErrorMessage } from "@/lib/getErrorMessage";
import { createEventAction } from "@/app/events/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useActionState, useEffect, useRef } from "react";

interface FacilityOption {
  id: string;
  name: string;
}

interface Props {
  facilities: FacilityOption[];
  resetOnSuccess?: boolean;
  onPendingChange?: (pending: boolean) => void;
  onSuccess?: (id: string, name: string) => void;
}


/**
 * EventForm
 *
 * Renders a form for creating new events.
 * Uses server-action createEventAction via useFormState for submission,
 * and displays client-side and server-side validation.
 */
export default function EventForm({ facilities, resetOnSuccess = true, onPendingChange, onSuccess }: Props) {
  // Initialize form state with default values for error and pending
  const [formState, formAction] = useActionState(createEventAction, {
    error: "",
    pending: false,
  });
  
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Handy alias for accessing submitted values on error
  const v = (formState && 'values' in formState ? (formState as any).values : undefined) as
    | Record<string, any>
    | undefined;

  // when pending changes, notify Sheet
  useEffect(() => {
    onPendingChange?.(!!formState?.pending);
  }, [formState?.pending, onPendingChange]);

  // on success: reset + focus + notify Sheet
  useEffect(() => {
    if (formState && "success" in formState && formState.success) {
      onSuccess?.(formState.id, formState.name);
      if (resetOnSuccess && formRef.current) {
        formRef.current.reset();
        nameRef.current?.focus();
      }
    }
  }, [formState, onSuccess, resetOnSuccess]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 max-w-lg" noValidate>
      {/* NAME */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Event Name
        </label>
        <Input
          id="name"
          name="name"
          ref={nameRef}
          placeholder="e.g. Boulder Bash 2025"
          required // client-side required validation
          defaultValue={v?.name ?? ""}
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
          type="datetime-local"
          required // must select a date
          defaultValue={v?.date ?? ""}
        />
      </div>

      {/* DURATION */}
      <div>
        <label
          htmlFor="durationDays"
          className="block text-sm font-medium mb-1"
        >
          Duration (days)
        </label>
        <Input
          id="durationDays"
          name="durationDays"
          type="number"
          min={1}
          required // ensure a duration is provided
          defaultValue={v?.durationDays ?? ""}
        />
      </div>

      {/* FACILITY */}
      <div>
        <label htmlFor="facility" className="block text-sm font-medium mb-1">
          Facility
        </label>
        {facilities.length === 0 ? (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              No facilities available. Please seed facilities or contact an administrator.
            </p>
          </div>
        ) : (
          <select
            id="facility"
            name="facility"
            required // client must choose a facility
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
            defaultValue={v?.facility ?? ""}
          >
            <option value="">Select a facility</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}
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
          defaultValue={v?.discipline ?? ""}
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
          {["YD", "YC", "YB", "YA", "JR", "Open"].map((cat) => (
            <label key={cat} className="inline-flex items-center mr-4">
              <input
                type="checkbox"
                name="ageCategories"
                value={cat}
                className="mr-2"
                defaultChecked={Array.isArray(v?.ageCategories) && v!.ageCategories.includes(cat)}
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
          defaultValue={v?.division ?? ""}
        >
          <option value="">Choose one</option>
          <option value="Mixed">Mixed</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
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
          defaultValue={v?.description ?? ""}
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
          defaultValue={v?.registrationDeadline ?? ""}
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
          defaultValue={v?.maxParticipants ?? ""}
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
          defaultValue={v?.entryFee ?? ""}
        />
      </div>

      <div>
        <label
          htmlFor="contactEmail"
          className="block text-sm font-medium mb-1"
        >
          Contact Email (optional)
        </label>
        <Input id="contactEmail" name="contactEmail" type="email" defaultValue={v?.contactEmail ?? ""} />
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
          Image URL (optional)
        </label>
        <Input id="imageUrl" name="imageUrl" type="url" defaultValue={v?.imageUrl ?? ""} />
      </div>

      {/* SERVER ERROR BANNER */}
      {formState && "error" in formState && formState.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-2" role="alert">
          <p className="text-red-800 text-sm">{getErrorMessage(formState.error)}</p>
        </div>
      )}

      {/* SUCCESS BANNER */}
      {formState && "success" in formState && formState.success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-2" role="status" aria-live="polite">
          <p className="text-green-800 text-sm">✅ Event created successfully! Add another below.</p>
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <Button type="submit" className="w-full" disabled={formState?.pending}>
        {formState?.pending ? "Creating…" : "Create Event"}
      </Button>
    </form>
  );
}
