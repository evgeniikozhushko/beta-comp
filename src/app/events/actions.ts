"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Types } from "mongoose";
import { mongoConnect } from "@/lib/mongodb";
import Event, { IEvent } from "@/lib/models/Event";
import Facility from "@/lib/models/Facility";
import { auth } from "@/lib/auth";
import { hasPermission, canManageEvent } from "@/lib/types/permissions";

// Return shape for useActionState
export type CreateEventState =
  | { pending: false; success: true; id: string; name: string }
  | {
      pending: false;
      success?: false;
      error?: string;
      fieldErrors?: Record<string, string>;
      // NEW: echo back what the user submitted so the client can rehydrate fields
      values?: Record<string, unknown>;
    };

export type UpdateEventState =
  | { pending: false; success: true; id: string; name: string }
  | {
      pending: false;
      success?: false;
      error?: string;
      fieldErrors?: Record<string, string>;
      values?: Record<string, unknown>;
    };

export type DeleteEventState =
  | { pending: false; success: true; id: string; name: string }
  | { pending: false; success?: false; error?: string };

// Zod schema for validating event creation payload
const EventCreateSchema = z.object({
  name: z.string().min(1, "Please enter a name").trim(),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Please select a valid date",
  }),
  durationDays: z.number().min(1, "Duration must be at least 1 day"),
  facility: z.string().min(1, "Please select a facility"),
  discipline: z.enum(["Boulder", "Lead", "Speed"], {
    message: "Choose a discipline",
  }),
  ageCategories: z.array(z.string()).min(1, "Pick at least one category"),
  division: z.enum(["Male", "Female", "Mixed"], {
    message: "Choose a division",
  }),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
  registrationDeadline: z.string().optional(),
  maxParticipants: z.number().min(1).optional(),
  entryFee: z.number().min(0).optional(),
  contactEmail: z.string().email("That doesn't look like an email").optional(),
});

export async function createEventAction(
  _prevState: unknown,
  formData: FormData
): Promise<CreateEventState> {
  // 1. Auth guard (no redirect here—return an error for the form)
  const session = await auth();
  if (!session) {
    return { pending: false, error: "UNAUTHORIZED" };
  }

  // 2. Permission check - user must be able to create events
  if (!hasPermission(session.user.role, 'canCreateEvents')) {
    return { pending: false, error: "PERMISSION_DENIED" };
  }

  // 2. Extract and normalize raw data from FormData
  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    date: formData.get("date"),
    durationDays: Number(formData.get("durationDays")),
    facility: formData.get("facility"),
    discipline: formData.get("discipline"),
    ageCategories: formData.getAll("ageCategories"),
    division: formData.get("division"),
    imageUrl: formData.get("imageUrl") || undefined,
    description: formData.get("description") || undefined,
    registrationDeadline: formData.get("registrationDeadline") || undefined,
    maxParticipants: formData.get("maxParticipants")
      ? Number(formData.get("maxParticipants"))
      : undefined,
    entryFee: formData.get("entryFee")
      ? Number(formData.get("entryFee"))
      : undefined,
    contactEmail: formData.get("contactEmail") || undefined,
  };

  // Remove empty strings → undefined (so Zod optional fields behave)
  for (const [k, v] of Object.entries(raw)) if (v === "") raw[k] = undefined;

  // 3. Zod validation → map to fieldErrors for inline display
  let data: z.infer<typeof EventCreateSchema>;

  try {
    data = EventCreateSchema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const flat = err.flatten();
      const fieldErrors = Object.fromEntries(
        Object.entries(flat.fieldErrors).map(([k, v]) => [
          k,
          (v as string[])?.[0] ?? "Invalid value",
        ])
      );
      return {
        pending: false,
        error: "VALIDATION_REQUIRED",
        fieldErrors,
        values: raw,
      };
    }
    return { pending: false, error: "UNEXPECTED_SERVER", values: raw };
  }

  try {
    // 4. DB: verify facility exists
    await mongoConnect();
    const facilityDoc = await Facility.findById(data.facility);
    if (!facilityDoc) {
      return {
        pending: false,
        error: "INVALID_FACILITY",
        fieldErrors: { facility: "Please select a valid facility." },
        values: raw,
      };
    }

    // 5. Create event (convert string ids → ObjectId)
    const newEvent = await Event.create({
      name: data.name,
      date: new Date(data.date),
      durationDays: data.durationDays,
      facility: new Types.ObjectId(data.facility),
      discipline: data.discipline,
      ageCategories: data.ageCategories,
      division: data.division,
      imageUrl: data.imageUrl,
      description: data.description,
      registrationDeadline: data.registrationDeadline
        ? new Date(data.registrationDeadline)
        : undefined,
      maxParticipants: data.maxParticipants,
      entryFee: data.entryFee,
      contactEmail: data.contactEmail,
      createdBy: new Types.ObjectId(session.user.id),
    } as Partial<IEvent>);

    // 6. Mark the /events route stale (fresh data will be ready)
    revalidatePath("/events");

    // 7. Return success (no redirect) → client decides what to do
    return {
      pending: false,
      success: true,
      id: newEvent._id.toString(),
      name: newEvent.name,
    };
  } catch (err) {
    console.error("Event creation failed:", err);
    return { pending: false, error: "DB_ERROR", values: raw };
  }
}

export async function updateEventAction(
  _prevState: unknown,
  formData: FormData
): Promise<UpdateEventState> {
  // Auth Guard
  const session = await auth();
  if (!session) {
    return { pending: false, error: "UNAUTHORIZED" };
  }
  const eventId = formData.get("eventId") as string;
  if (!eventId) {
    return { pending: false, error: "EVENT_ID_REQUIRED" };
  }

  // 2. Extract and normalize raw data from FormData
  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    date: formData.get("date"),
    durationDays: Number(formData.get("durationDays")),
    facility: formData.get("facility"),
    discipline: formData.get("discipline"),
    ageCategories: formData.getAll("ageCategories"),
    division: formData.get("division"),
    imageUrl: formData.get("imageUrl") || undefined,
    description: formData.get("description") || undefined,
    registrationDeadline: formData.get("registrationDeadline") || undefined,
    maxParticipants: formData.get("maxParticipants")
      ? Number(formData.get("maxParticipants"))
      : undefined,
    entryFee: formData.get("entryFee")
      ? Number(formData.get("entryFee"))
      : undefined,
    contactEmail: formData.get("contactEmail") || undefined,
  };

  // Remove empty strings → undefined
  for (const [k, v] of Object.entries(raw)) {
    if (v === "") raw[k] = undefined;
  }

  // 3. Zod validation
  let data: z.infer<typeof EventCreateSchema>;

  try {
    data = EventCreateSchema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const flat = err.flatten();
      const fieldErrors = Object.fromEntries(
        Object.entries(flat.fieldErrors).map(([k, v]) => [
          k,
          (v as string[])?.[0] ?? "Invalid value",
        ])
      );
      return {
        pending: false,
        error: "VALIDATION_REQUIRED",
        fieldErrors,
        values: raw,
      };
    }
    return { pending: false, error: "UNEXPECTED_SERVER", values: raw };
  }

  try {
    // 4. DB operations
    await mongoConnect();

    // Check if event exists and user owns it
    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      return { pending: false, error: "EVENT_NOT_FOUND", values: raw };
    }

    // Permission check - use role-based permissions
    if (!canManageEvent(session.user.role, existingEvent.createdBy.toString(), session.user.id, 'update')) {
      return { pending: false, error: "NOT_AUTHORIZED", values: raw };
    }

    // Verify facility exists
    const facilityDoc = await Facility.findById(data.facility);
    if (!facilityDoc) {
      return {
        pending: false,
        error: "INVALID_FACILITY",
        fieldErrors: { facility: "Please select a valid facility." },
        values: raw,
      };
    }

    // 5. Update event
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        name: data.name,
        date: new Date(data.date),
        durationDays: data.durationDays,
        facility: new Types.ObjectId(data.facility),
        discipline: data.discipline,
        ageCategories: data.ageCategories,
        division: data.division,
        imageUrl: data.imageUrl,
        description: data.description,
        registrationDeadline: data.registrationDeadline
          ? new Date(data.registrationDeadline)
          : undefined,
        maxParticipants: data.maxParticipants,
        entryFee: data.entryFee,
        contactEmail: data.contactEmail,
      },
      { new: true }
    );

    if (!updatedEvent) {
      return { pending: false, error: "UPDATE_FAILED", values: raw };
    }

    // 6. Mark the /events route stale
    revalidatePath("/events");

    // 7. Return success
    return {
      pending: false,
      success: true,
      id: updatedEvent._id.toString(),
      name: updatedEvent.name,
    };
  } catch (err) {
    console.error("Event update failed:", err);
    return { pending: false, error: "DB_ERROR", values: raw };
  }
}

export async function deleteEventAction(
  _prevState: unknown,
  formData: FormData
): Promise<DeleteEventState> {
  // 1. Auth guard (no redirect here—return an error for the form)
  const session = await auth();
  if (!session) {
    return { pending: false, error: "UNAUTHORIZED" };
  }

  const eventId = formData.get("eventId") as string;

  try {
    // Connect to database
    await mongoConnect();

    // After finding the event, check if user owns it
    const event = await Event.findById(eventId);
    if (!event) {
      return { pending: false, error: "EVENT_NOT_FOUND" };
    }

    // Permission check - use role-based permissions
    if (!canManageEvent(session.user.role, event.createdBy.toString(), session.user.id, 'delete')) {
      return { pending: false, error: "NOT_Authorized" };
    }

    // Delete the event
    await Event.findByIdAndDelete(eventId);

    // Mark the /events route stale
    revalidatePath("/events");

    // Return success
    return { pending: false, success: true, id: eventId, name: event.name };
  } catch (err) {
    console.error("Event deletion failed:", err);
    return { pending: false, error: "DB_ERROR" };
  }
}
