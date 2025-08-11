"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Types } from "mongoose";
import { mongoConnect } from "@/lib/mongodb";
import Event, { IEvent } from "@/lib/models/Event";
import Facility from "@/lib/models/Facility";
import { auth } from "@/lib/auth";

// Put these at the top of the file (below imports)
// "YYYY-MM-DDTHH:mm" from <input type="datetime-local">
function parseLocalDateTime(s: string): Date | null {
  if (!s) return null;
  const parts = s.split(/[-T:]/).map(Number); // [YYYY, MM, DD, HH, mm]
  if (parts.length < 3) return null;
  const [y, m, d, hh = 0, mm = 0] = parts;
  const date = new Date(y, m - 1, d, hh, mm);
  return Number.isNaN(date.getTime()) ? null : date;
}


// "YYYY-MM-DD" from <input type="date">
function parseLocalDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

// Zod schema for validating event creation payload
const EventCreateSchema = z.object({
  name: z.string().min(1, { message: "Please enter an event name." }).trim(),
  date: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: "Invalid date format" }),
  durationDays: z.coerce.number().int().min(1),
  facility: z.string().min(1),
  discipline: z.enum(["Boulder", "Lead", "Speed"]),
  ageCategories: z.array(z.string()).min(1),
  division: z.enum(["Male", "Female", "Mixed"]),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
  registrationDeadline: z.string().optional(),
  maxParticipants: z.coerce.number().int().min(1).optional(),
  entryFee: z.coerce.number().min(0).optional(),
  contactEmail: z.string().email().optional(),
});

type EventCreateInput = z.infer<typeof EventCreateSchema>;

/**
 * Server action compatible with useFormState:
 * - accepts previous state and formData
 * - returns error state object on failure
 * - uses revalidatePath and redirect on success
 */

export async function createEventAction(
  prevState: unknown,
  formData: FormData
): Promise<{ error: string; pending: false } | void> {
  // 1. Auth guard
  const session = await auth();
  if (!session) {
    redirect("/sign-in");
    return;
  }

  // 2. Extract raw values from form
  const raw: Record<string, unknown> = {
    name: formData.get("name") as string,
    date: formData.get("date") as string,
    durationDays: Number(formData.get("durationDays")),
    facility: formData.get("facility") as string,
    discipline: formData.get("discipline") as string,
    ageCategories: formData.getAll("ageCategories") as string[],
    division: formData.get("division") as string,
    imageUrl: (formData.get("imageUrl") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    registrationDeadline:
      (formData.get("registrationDeadline") as string) || undefined,
    maxParticipants: formData.get("maxParticipants")
      ? Number(formData.get("maxParticipants"))
      : undefined,
    entryFee: formData.get("entryFee")
      ? Number(formData.get("entryFee"))
      : undefined,
    contactEmail: (formData.get("contactEmail") as string) || undefined,
  };

  // Remove any empty-string fields to prevent invalid optional data
  Object.entries(raw).forEach(([key, value]) => {
    if (value === "") raw[key] = undefined;
  });

  let data: EventCreateInput;
  try {
    // 3. Validate input with Zod
    data = EventCreateSchema.parse(raw);
  } catch (err: unknown) {
    // Return validation error state
    const message = err instanceof Error ? err.message : "Invalid input";
    return { error: message, pending: false };
  }

  try {
    // 4. Ensure facility exists
    await mongoConnect();
    const facilityDoc = await Facility.findById(data.facility);
    if (!facilityDoc) {
      return { error: "Invalid facility selected", pending: false };
    }

    // 5. Create event, converting to ObjectId where needed

    // Explicitly parse the main event date (expects datetime-local)
    const eventDate = parseLocalDateTime(data.date);
    if (!eventDate) {
      return { error: "Invalid date format.", pending: false };
    }

    // Optional registration deadline (likely <input type='date'>)
    let regDeadline: Date | undefined;
    if (data.registrationDeadline) {
      const parsed = parseLocalDate(data.registrationDeadline);
      if (!parsed)
        return { error: "Invalid registration deadline.", pending: false };
      regDeadline = parsed;
    }

    await Event.create({
      name: data.name,
      date: eventDate,
      durationDays: data.durationDays,
      facility: new Types.ObjectId(data.facility),
      discipline: data.discipline,
      ageCategories: data.ageCategories,
      division: data.division,
      imageUrl: data.imageUrl,
      description: data.description,
      registrationDeadline: regDeadline,
      maxParticipants: data.maxParticipants,
      entryFee: data.entryFee,
      contactEmail: data.contactEmail,
      createdBy: new Types.ObjectId(session.user.id),
    } as Partial<IEvent>);

    // 6. Revalidate and redirect
    revalidatePath("/events");
    redirect("/events");
    return;
  } catch (err: unknown) {
    // Re-throw redirect errors - they're not actually errors
    if (err instanceof Error && err.message?.includes('NEXT_REDIRECT')) {
      throw err;
    }
    
    // Return any server/database error state
    console.error("Event creation failed:", err);
    console.error("Error details:", JSON.stringify(err, null, 2));
    const message = err instanceof Error ? err.message : "Failed to create event";
    return { error: `EVENT_CREATE_ERROR: ${message}`, pending: false };
  }
}
