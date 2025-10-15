import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mongoConnect } from "@/lib/mongodb";
import Event from "@/lib/models/Event";
import Facility from "@/lib/models/Facility";
import { Types } from "mongoose";
import { z } from "zod";

interface PopulatedEvent {
  _id: Types.ObjectId;
  name: string;
  date: Date;
  durationDays: number;
  facility: {
    _id: Types.ObjectId;
    name: string;
  };
  discipline: string;
  ageCategories: string[];
  division: string;
  description?: string;
  registrationDeadline?: Date;
  maxParticipants?: number;
  entryFee?: number;
  contactEmail?: string;
  imageUrl?: string;
  createdBy: Types.ObjectId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Invalid Event ID" }, { status: 401 });
    }
    
    // 2. Await params and validate event ID format
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Event ID" }, { status: 400 });
    }
    // 3. Connect to database
    await mongoConnect();

    // 4. Find event with populated facility
    const event = (await Event.findById(id)
      .populate("facility")
      .lean()) as PopulatedEvent | null;

    // 5. Handle non-existent event
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 6. Authorization check - only event creator can edit
    if (event.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to edit this event" },
        { status: 403 }
      );
    }
    // 7. Format event data for frontend consumption
    const formattedEvent = {
      id: event._id.toString(),
      name: event.name,
      date: event.date.toISOString().slice(0, 16), // Format for datetime-local input
      durationDays: event.durationDays,
      facility: event.facility._id.toString(),
      discipline: event.discipline,
      ageCategories: event.ageCategories,
      division: event.division,
      description: event.description || "",
      registrationDeadline: event.registrationDeadline
        ? `${event.registrationDeadline.getFullYear()}-${String(event.registrationDeadline.getMonth() + 1).padStart(2, '0')}-${String(event.registrationDeadline.getDate()).padStart(2, '0')}` // Format for date input without UTC conversion
        : "",
      maxParticipants: event.maxParticipants || "",
      entryFee: event.entryFee || "",
      contactEmail: event.contactEmail || "",
      imageUrl: event.imageUrl || "",
    };

    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT handler: update MongoDB Event record
// ─────────────────────────────────────────────────────────────────────────────
// Request Validation & Authentication
// ─────────────────────────────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Authentication check
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // 2. Await params and validate event ID format
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid Event ID" }, { status: 400 });
  }

  // Request Body Processing
  // 3. Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 4. Validate required fields using same schema as server action
  const EventUpdateSchema = z.object({
    name: z.string().min(1, "Please enter a name").trim(),
    date: z.string().refine((d) => !isNaN(Date.parse(d)), {
      message: "Please select a valid date",
    }),
    durationDays: z.number().min(1, "Duration must be at least 1 day"),
    facility: z.string().min(1, "Please select a facility"),
    discipline: z.enum(["Boulder", "Lead", "Speed"]),
    ageCategories: z.array(z.string()).min(1, "Pick at least one category"),
    division: z.enum(["Male", "Female", "Mixed"]),
    // Optional fields
    imageUrl: z.string().url().optional(),
    description: z.string().optional(),
    registrationDeadline: z.string().optional(),
    maxParticipants: z.number().min(1).optional(),
    entryFee: z.number().min(0).optional(),
    contactEmail: z.string().email().optional(),
  });

  let validatedData;
  try {
    validatedData = EventUpdateSchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: err.flatten(),
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Validation error" }, { status: 400 });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Database Operations & Authorization
  // ─────────────────────────────────────────────────────────────────────────────
  try {
    // 5. Connect to database
    await mongoConnect();

    // 6. Check if event exists and get current data
    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 7. Authorization check - only event creator can edit
    if (existingEvent.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to edit this event" },
        { status: 403 }
      );
    }

    // 8. Validate facility exists
    if (validatedData.facility) {
      const facilityDoc = await Facility.findById(validatedData.facility);
      if (!facilityDoc) {
        return NextResponse.json(
          { error: "Invalid facility selected" },
          { status: 400 }
        );
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Update Event & Response
    // ─────────────────────────────────────────────────────────────────────────────
    // Update the event
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        name: validatedData.name,
        date: new Date(validatedData.date),
        durationDays: validatedData.durationDays,
        facility: new Types.ObjectId(validatedData.facility),
        discipline: validatedData.discipline,
        ageCategories: validatedData.ageCategories,
        division: validatedData.division,
        imageUrl: validatedData.imageUrl,
        description: validatedData.description,
        registrationDeadline: validatedData.registrationDeadline
          ? new Date(validatedData.registrationDeadline)
          : undefined,
        maxParticipants: validatedData.maxParticipants,
        entryFee: validatedData.entryFee,
        contactEmail: validatedData.contactEmail,
        updatedAt: new Date(), // Track when it was last updated
      },
      { new: true, runValidators: true }
    ).populate("facility");

    if (!updatedEvent) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    // // 10. Format response data (same format as GET endpoint)
    const formattedEvent = {
      id: updatedEvent._id.toString(),
      name: updatedEvent.name,
      date: updatedEvent.date.toISOString().slice(0, 16),
      durationDays: updatedEvent.durationDays,
      facility: updatedEvent.facility._id.toString(),
      discipline: updatedEvent.discipline,
      ageCategories: updatedEvent.ageCategories,
      division: updatedEvent.division,
      description: updatedEvent.description || "",
      registrationDeadline: updatedEvent.registrationDeadline
        ? `${updatedEvent.registrationDeadline.getFullYear()}-${String(updatedEvent.registrationDeadline.getMonth() + 1).padStart(2, '0')}-${String(updatedEvent.registrationDeadline.getDate()).padStart(2, '0')}`
        : "",
      maxParticipants: updatedEvent.maxParticipants || "",
      entryFee: updatedEvent.entryFee || "",
      contactEmail: updatedEvent.contactEmail || "",
      imageUrl: updatedEvent.imageUrl || "",
    };

    return NextResponse.json(formattedEvent);

  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
