// src/app/events/page.tsx

import EventForm from "@/components/EventForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { mongoConnect } from "@/lib/mongodb";
import Event, { IEvent } from "@/lib/models/Event";
import Facility from "@/lib/models/Facility";

/**
 * EventsPage
 *
 * This server component:
 * 1. Ensures the user is authenticated before access.
 * 2. Connects to MongoDB and fetches all events and facilities.
 * 3. Renders the EventForm for creating new events.
 * 4. Displays the list of existing events with detailed info.
 * 5. Handles database errors gracefully with an error banner.
 */
export default async function EventsPage() {
  // 1. Authentication guard: redirect unauthenticated users
  const session = await auth();
  if (!session) {
    // If no session, send user to sign-in page
    redirect("/sign-in");
  }

  let rawEvents: (IEvent & { facility: any })[], rawFacilities: any[];
  try {
    // 2. Connect to MongoDB
    await mongoConnect();

    // 3. Fetch events (with facility populated) and facilities in parallel
    [rawEvents, rawFacilities] = await Promise.all([
      Event.find()
        .populate("facility") // Replace facility ID with full document
        .sort({ date: 1 }) // Sort events by date ascending
        .lean<(IEvent & { facility: any })[]>(), // Convert Mongoose docs to plain JS objects with proper typing
      Facility.find().lean(), // Fetch all facilities
    ]);
  } catch (error) {
    // 4. Error boundary: if fetching fails, show an error message
    console.error("Database error loading events/facilities:", error);
    return (
      <div className="min-h-screen p-8 sm:p-20">
        <h1 className="text-3xl font-bold mb-6">Events</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">
            Error loading events. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // 5. Map facilities into a simple array for the dropdown in EventForm
  const facilities = rawFacilities.map((f) => ({
    id: f._id.toString(), // Convert ObjectId to string
    name: f.name, // Facility name
  }));

  // 6. Render the page: form + event list
  return (
    <div className="min-h-screen p-8 sm:p-20">
      {/* Page title */}
      <h1 className="text-3xl font-bold mb-6">Events</h1>

      {/* Event creation form */}
      <div className="mb-12">
        <EventForm facilities={facilities} />
      </div>

      {/* Event list or no-data message */}
      {rawEvents.length === 0 ? (
        <p className="text-gray-600">No events found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rawEvents.map((event) => (
            <div
              key={String(event._id)}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              {/* Event title */}
              <h2 className="text-xl font-semibold mb-2">{event.name}</h2>

              {/* Event details */}
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {/* Date and time display */}
                <p>
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(event.date).toLocaleDateString()} at{" "}
                  {new Date(event.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {/* Duration */}
                <p>
                  <span className="font-medium">Duration:</span>{" "}
                  {event.durationMinutes} minutes
                </p>

                {/* Facility name, type-safe check */}
                <p>
                  <span className="font-medium">Facility:</span>{" "}
                  {typeof event.facility === "object" && event.facility?.name
                    ? event.facility.name
                    : "Unknown"}
                </p>

                {/* Discipline */}
                <p>
                  <span className="font-medium">Discipline:</span>{" "}
                  {event.discipline}
                </p>

                {/* Age categories */}
                <p>
                  <span className="font-medium">Categories:</span>{" "}
                  {event.ageCategories.join(", ")}
                </p>

                {/* Division */}
                <p>
                  <span className="font-medium">Division:</span>{" "}
                  {event.division}
                </p>

                {/* Optional description block */}
                {event.description && (
                  <p className="mt-3 text-gray-800 dark:text-gray-200">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
