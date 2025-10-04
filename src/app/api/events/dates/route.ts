import { NextResponse } from "next/server";
import { mongoConnect } from "@/lib/mongodb";
import Event from "@/lib/models/Event";

/**
 * GET /api/events/dates
 * Returns an array of dates that have events scheduled
 * Optimized to only fetch date fields, not full event data
 */
export async function GET() {
  try {
    await mongoConnect();

    // Fetch only the date and durationDays fields for efficiency
    const events = await Event.find({}, { date: 1, durationDays: 1 }).lean();

    // Create a Set to store unique dates (including multi-day events)
    const dateSet = new Set<string>();

    events.forEach((event) => {
      const startDate = new Date(event.date);
      const duration = event.durationDays || 1;

      // Add each day of the event to the set
      for (let i = 0; i < duration; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        // Format as YYYY-MM-DD
        const dateString = currentDate.toISOString().split('T')[0];
        dateSet.add(dateString);
      }
    });

    // Convert Set to Array
    const dates = Array.from(dateSet).sort();

    return NextResponse.json({ dates });
  } catch (err: unknown) {
    console.error("Events dates GET error:", err);
    const message = err instanceof Error ? err.message : "Unable to load event dates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
