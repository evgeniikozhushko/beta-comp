// src/app/api/events/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { mongoConnect } from "@/lib/mongodb";
import Event, { IEvent } from "@/lib/models/Event";
import Facility from "@/lib/models/Facility";
import { auth } from "@/lib/auth";
import { Types } from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣ Define a Zod schema to validate incoming event data
//    This ensures both required and optional fields meet our criteria
// ─────────────────────────────────────────────────────────────────────────────
const EventCreateSchema = z.object({
  name: z.string().min(1).trim(),                          // non-empty string
  date: z.string().refine((d) => !isNaN(Date.parse(d)), {  // parseable date
    message: "Invalid date format",
  }),
  durationMinutes: z.number().min(1),                      // at least 1 minute
  facility: z.string().min(1),                             // facility ObjectId as string
  discipline: z.enum(["Boulder", "Lead", "Speed"]),        // one of three values
  ageCategories: z.array(z.string()).min(1),               // at least one bracket
  division: z.enum(["Male", "Female", "Mixed"]),           // competition division

  // Optional fields—only validated if present
  imageUrl: z.string().url().optional(),                   // must be URL if given
  description: z.string().optional(),
  registrationDeadline: z.string().optional(),
  maxParticipants: z.number().min(1).optional(),
  entryFee: z.number().min(0).optional(),
  contactEmail: z.string().email().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// GET handler: fetch all events from MongoDB
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    // Ensure database connection is ready
    await mongoConnect();

    // Retrieve events, populate the facility reference, sort by date
    const events = await Event.find()
      .populate("facility")
      .sort({ date: 1 })
      .lean();

    // Return the events list and a total count
    return NextResponse.json({ events, total: events.length });
  } catch (err: any) {
    // Log the error server‐side for debugging
    console.error("Events GET error:", err);

    // Return a generic error message to the client
    const message = err instanceof Error ? err.message : "Unable to load events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST handler: create a new event
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // 1) AUTHENTICATION: ensure the user is logged in
  const session = await auth();
  if (!session) {
    // If not authenticated, return 401 Unauthorized
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) VALIDATION: parse and validate the JSON body with Zod
  let data: z.infer<typeof EventCreateSchema>;
  try {
    const body = await request.json();
    data = EventCreateSchema.parse(body);
  } catch (err: any) {
    // If validation fails, send a 400 with the Zod error message
    const msg = err instanceof Error ? err.message : "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 3) FACILITY CHECK: ensure the referenced facility actually exists
  await mongoConnect();
  const facilityExists = await Facility.findById(data.facility);
  if (!facilityExists) {
    // If the facility ID is invalid, return a 400 Bad Request
    return NextResponse.json(
      { error: "Invalid facility selected" },
      { status: 400 }
    );
  }

  // 4) CREATION: insert the new Event document
  try {
    const newEvent = await Event.create({
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

    // 5) POPULATION: fetch the newly created event including populated facility
    const populated = await Event.findById(newEvent._id).populate("facility");

    // Return 201 Created with the new event payload
    return NextResponse.json({ event: populated }, { status: 201 });
  } catch (err: any) {
    // Log and return any creation errors
    console.error("Events POST error:", err);
    const message = err instanceof Error ? err.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
