"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Types } from "mongoose";
import { mongoConnect } from "@/lib/mongodb";
import Event, { IEvent } from "@/lib/models/Event";
import Facility from "@/lib/models/Facility";
import { auth } from "@/lib/auth";

// Zod schema for validating event creation payload
const EventCreateSchema = z.object({
  name: z.string().min(1).trim(),
  date: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: "Invalid date format" }),
  durationMinutes: z.number().min(1),
  facility: z.string().min(1),
  discipline: z.enum(["Boulder", "Lead", "Speed"]),
  ageCategories: z.array(z.string()).min(1),
  division: z.enum(["Male", "Female", "Mixed"]),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
  registrationDeadline: z.string().optional(),
  maxParticipants: z.number().min(1).optional(),
  entryFee: z.number().min(0).optional(),
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
  prevState: any,
  formData: FormData
): Promise<{ error: string; pending: false } | void> {
  // 1. Auth guard
  const session = await auth();
  if (!session) {
    redirect("/sign-in");
    return;
  }

  // 2. Extract raw values from form
  const raw: Record<string, any> = {
    name: formData.get("name") as string,
    date: formData.get("date") as string,
    durationMinutes: Number(formData.get("durationMinutes")),
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
  } catch (err: any) {
    // Return validation error state
    return { error: err.message || "Invalid input", pending: false };
  }

  try {
    // 4. Ensure facility exists
    await mongoConnect();
    const facilityDoc = await Facility.findById(data.facility);
    if (!facilityDoc) {
      return { error: "Invalid facility selected", pending: false };
    }

    // 5. Create event, converting to ObjectId where needed
    await Event.create({
      name: data.name,
      date: new Date(data.date),
      durationMinutes: data.durationMinutes,
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

    // 6. Revalidate and redirect
    revalidatePath("/events");
    redirect("/events");
    return;
  } catch (err: any) {
    // Return any server/database error state
    console.error("Event creation failed:", err);
    return { error: err.message || "Failed to create event", pending: false };
  }
}
