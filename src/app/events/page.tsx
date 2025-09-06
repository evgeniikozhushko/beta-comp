// src/app/events/page.tsx

import dynamic from 'next/dynamic';

// Use conditional rendering instead of client-only wrappers
const CreateEventSheet = dynamic(() => import("@/components/CreateEventSheet"), { 
  loading: () => <div className="mb-6"><div className="animate-pulse bg-gray-200 h-10 rounded"></div></div>
});

const EventRegistrationButton = dynamic(() => import('@/components/EventRegistrationButton'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
});

const UpdateEventSheet = dynamic(() => import("@/components/UpdateEventSheet"), {
  loading: () => <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
});

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { mongoConnect } from "@/lib/mongodb";
import Event from "@/lib/models/Event";
import Facility from "@/lib/models/Facility";
import DeleteEventButton from "@/components/DeleteEventButton";
import { Button } from "@/components/ui/button";
import { hasPermission, canManageEvent } from "@/lib/types/permissions";
import Registration from '@/lib/models/Registration';
import { Types } from 'mongoose';

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

  let rawEvents: unknown[], rawFacilities: unknown[], upcomingEvents: unknown[];
  try {
    // 2. Connect to database
    await mongoConnect();

    // 3. Fetch events (with facility populated), facilities, and upcoming events in parallel
    [rawEvents, rawFacilities, upcomingEvents] = await Promise.all([
      Event.find()
        .populate("facility") // Replace facility ID with full document
        .sort({ date: 1 }) // Sort events by date ascending
        .lean(), // Convert Mongoose docs to plain JS objects
      Facility.find().lean(), // Fetch all facilities
      Event.find()
        .sort({ date: 1 })
        .lean() // Get upcoming events for registration
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

  // 5. Map facilities with location info for the dropdown in EventForm
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const facilities = rawFacilities.map((f: any) => ({
    id: f._id.toString(), // Convert ObjectId to string
    name: f.city
      ? `${f.name} — ${f.city}, ${f.province}`
      : `${f.name} — ${f.province}`, // Include location
  }));

   // Get user's registrations if authenticated
   let userRegistrations: any[] = [];
   if (session) {
     userRegistrations = await Registration.find({
       userId: new Types.ObjectId(session.user.id),
       status: { $in: ['registered', 'waitlisted'] }
     }).lean();
   }

   // Create registration lookup
   const registrationLookup = userRegistrations.reduce((acc, reg) => {
    acc[reg.eventId.toString()] = reg.status;
    return acc;
  }, {});

  // Check if user can register for events
  const userCanRegister = session ? hasPermission(session.user.role, 'canRegisterForEvents') : false;

  // 6. Render the page: form + event list
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page title */}
      <h1 className="text-3xl font-bold mb-6">Events</h1>

      {/* Role info display */}
      <div className="mb-6 p-4 dark:bg-blue-900/20 border border-red-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-black-900 dark:text-blue-100 mb-2">User Info</h3>
        <div className="text-sm text-black-900 dark:text-blue-200 space-y-1">
          <div><strong>User:</strong> {session.user.displayName}</div>
          <div><strong>Role:</strong> {session.user.role ? session.user.role.toUpperCase() : 'NOT SET'}</div>
          <div><strong>Can create events:</strong> {session.user.role && hasPermission(session.user.role, 'canCreateEvents') ? 'Yes' : 'No'}</div>
          {!session.user.role && (
            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Role not set:</strong> Please sign out and sign back in to get your role assigned, or run the migration script.
            </div>
          )}
        </div>
      </div>

      {/* Event creation sheet - only show to users who can create events */}
      {(session.user.role && hasPermission(session.user.role, 'canCreateEvents')) && (
        <div className="mb-6">
          <CreateEventSheet facilities={facilities} />
        </div>
      )}

{/* Upcoming Events with Registration */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
        
        {/* Debug: Show events count */}
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
          <strong>DEBUG:</strong> Found {(upcomingEvents as any[]).length} upcoming events
          {(upcomingEvents as any[]).length === 0 && (
            <div className="mt-2 text-sm">
              <p>No upcoming events found. Check:</p>
              <ul className="list-disc list-inside">
                <li>Database has events with active: true</li>
                <li>Events have dateTime field</li>
                <li>MongoDB connection working</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(upcomingEvents as any[]).map((event: any) => {
            const eventId = event._id.toString();
            const userRegistrationStatus = registrationLookup[eventId] || null;
            
            // Implement registration status logic inline (since lean documents don't have methods)
            const getEventRegistrationStatus = (event: any) => {
              // Default to allowing registration if field doesn't exist
              if (event.allowRegistration === false) return 'closed';
              if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) return 'closed';
              if (event.maxCapacity > 0 && (event.registrationCount || 0) >= event.maxCapacity) return 'full';
              return 'open';
            };
            
            const eventStatus = getEventRegistrationStatus(event);

            return (
              <div key={eventId} className="border rounded-lg p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">{event.title || event.name}</h2>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Time:</strong> {new Date(event.date).toLocaleTimeString()}
                  </div>
                  <div>
                    <strong>Location:</strong> {event.location || (event.facility?.name)}
                  </div>
                  {(event.sport || event.discipline) && (
                    <div>
                      <strong>Sport:</strong> {event.sport || event.discipline}
                    </div>
                  )}
                </div>

                {/* Debug: Show component props */}
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                  <strong>Event {eventId.slice(-6)}:</strong> Status={eventStatus}, 
                  UserStatus={userRegistrationStatus || 'null'}, 
                  Auth={!!session ? 'Yes' : 'No'}, 
                  CanReg={userCanRegister ? 'Yes' : 'No'}
                </div>
                
                {/* Simple test button to verify rendering location */}
                <div className="p-3 bg-green-100 border-2 border-green-400 rounded mb-2">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    TEST: Simple Button Works Here
                  </button>
                </div>
                
                <EventRegistrationButton
                  eventId={eventId}
                  userRegistrationStatus={userRegistrationStatus}
                  eventStatus={eventStatus}
                  registrationCount={event.registrationCount || 0}
                  maxCapacity={event.maxCapacity || 0}
                  registrationDeadline={event.registrationDeadline}
                  isAuthenticated={!!session}
                  userCanRegister={userCanRegister}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Event Management Section */}
      {(session.user.role && hasPermission(session.user.role, 'canCreateEvents')) && (
        <div>
          {rawEvents.length === 0 ? (
            <p className="text-gray-600">No events found.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {rawEvents.map((event: any) => (
            <div
              key={String(event._id)}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 pb-20 hover:shadow-lg transition-shadow relative"
            >
              {/* Action buttons - role-based permissions */}
              {(session.user.role && canManageEvent(session.user.role, event.createdBy.toString(), session.user.id, 'update')) && (
                <div className="absolute bottom-6 left-4 flex gap-2">
                  <UpdateEventSheet 
                    facilities={facilities} 
                    eventId={event._id.toString()}
                  >
                    <Button variant="outline" size="sm">
                      Edit Event
                    </Button>
                  </UpdateEventSheet>
                  {(session.user.role && canManageEvent(session.user.role, event.createdBy.toString(), session.user.id, 'delete')) && (
                    <DeleteEventButton
                      eventId={event._id.toString()}
                      eventName={event.name}
                    />
                  )}
                </div>
              )}

              {/* Debug info */}
              {/* <div className="text-xs text-gray-500 mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <strong>Event Owner ID:</strong> {event.createdBy.toString()}
                <br />
                <strong>Your User ID:</strong> {session.user.id}
                <br />
                <strong>You own this event:</strong>{" "}
                <span className={event.createdBy.toString() === session.user.id ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {event.createdBy.toString() === session.user.id ? "YES" : "NO"}
                </span>
              </div> */}

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
                  {event.durationDays} days
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
      )}
    </div>
  );
}
