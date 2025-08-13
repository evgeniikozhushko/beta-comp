"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Types } from "mongoose";
import { mongoConnect } from "@/lib/mongodb";
import Event, { IEvent } from "@/lib/models/Event";
import Facility from "@/lib/models/Facility";
import { auth } from "@/lib/auth";

// Return shape for useActionState
export type CreateEventState =
  | { pending: false; success: true; id: string; name: string }
  | {
      pending: false;
      success?: false;
      error?: string;
      fieldErrors?: Record<string, string>;
      // NEW: echo back what the user submitted so the client can rehydrate fields
      values?: Record<string, any>;
    };

// Zod schema for validating event creation payload
const EventCreateSchema = z.object({
  name: z.string().min(1, "Please enter a name").trim(),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), { message: "Please select a valid date" }),
  durationDays: z.number().min(1, "Duration must be at least 1 day"),
  facility: z.string().min(1, "Please select a facility"),
  discipline: z.enum(["Boulder", "Lead", "Speed"], { message: "Choose a discipline" }),
  ageCategories: z.array(z.string()).min(1, "Pick at least one category"),
  division: z.enum(["Male", "Female", "Mixed"], { message: "Choose a division" }),
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

  // 2. Extract and normalize raw data from FormData
  const raw: Record<string, any> = {
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
    entryFee: formData.get("entryFee") ? Number(formData.get("entryFee")) : undefined,
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
        Object.entries(flat.fieldErrors).map(([k, v]) => [k, (v as string[])?.[0] ?? "Invalid value"])
      );
      return { pending: false, error: "VALIDATION_REQUIRED", fieldErrors, values: raw };
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
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : undefined,
      maxParticipants: data.maxParticipants,
      entryFee: data.entryFee,
      contactEmail: data.contactEmail,
      createdBy: new Types.ObjectId(session.user.id),
    } as Partial<IEvent>);

    // 6. Mark the /events route stale (fresh data will be ready)
    revalidatePath("/events");

    // 7. Return success (no redirect) → client decides what to do
    return { pending: false, success: true, id: newEvent._id.toString(), name: newEvent.name };
  } catch (err) {
    console.error("Event creation failed:", err);
    return { pending: false, error: "DB_ERROR", values: raw };
  }
}
