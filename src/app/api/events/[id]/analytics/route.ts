import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mongoConnect } from "@/lib/mongodb";
import Event from "@/lib/models/Event";
import Registration from "@/lib/models/Registration";
import { Types } from "mongoose";
import { canManageEvent } from "@/lib/types/permissions";

interface AnalyticsData {
  eventId: string;
  eventName: string;
  eventDate: string;
  summary: {
    totalRegistered: number;
    totalWaitlisted: number;
    totalCancelled: number;
    currentCapacity: number;
    maxCapacity: number;
  };
  participants: {
    userId: string;
    displayName: string;
    email: string;
    status: 'registered' | 'waitlisted' | 'cancelled';
    registeredAt: string;
    cancelledAt?: string;
  }[];
  timeline: {
    date: string;
    registered: number;
    cancelled: number;
  }[];
}

/**
 * GET /api/events/[id]/analytics
 *
 * Returns comprehensive analytics for an event including:
 * - Summary statistics (counts by status)
 * - Full participant list with details
 * - Registration timeline data
 *
 * Access: Event creator or admin/owner roles only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // 3. Connect to database
    await mongoConnect();

    // 4. Find event
    const event = await Event.findById(id).lean();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 5. Authorization check - only event creator or admin/owner can view analytics
    if (!canManageEvent(session.user.role, session.user.id, event.createdBy.toString())) {
      return NextResponse.json(
        { error: "Not authorized to view analytics for this event" },
        { status: 403 }
      );
    }

    // 6. Fetch all registrations for this event (including cancelled)
    const registrations = await Registration.find({
      eventId: new Types.ObjectId(id)
    })
      .populate('userId', 'displayName email picture')
      .sort({ registeredAt: 1 }) // Earliest first
      .lean();

    // 7. Calculate summary statistics
    const registeredCount = registrations.filter(r => r.status === 'registered').length;
    const waitlistedCount = registrations.filter(r => r.status === 'waitlisted').length;
    const cancelledCount = registrations.filter(r => r.status === 'cancelled').length;

    // 8. Format participants data
    const participants = registrations.map((reg: any) => ({
      userId: reg.userId._id.toString(),
      displayName: reg.userId.displayName || 'Unknown',
      email: reg.userId.email || '',
      status: reg.status,
      registeredAt: reg.registeredAt.toISOString(),
      cancelledAt: reg.cancelledAt ? reg.cancelledAt.toISOString() : undefined
    }));

    // 9. Generate timeline data (registrations by day)
    const timelineMap = new Map<string, { registered: number; cancelled: number }>();

    registrations.forEach((reg: any) => {
      // Track registration date
      const regDate = new Date(reg.registeredAt).toISOString().split('T')[0];
      if (!timelineMap.has(regDate)) {
        timelineMap.set(regDate, { registered: 0, cancelled: 0 });
      }
      timelineMap.get(regDate)!.registered += 1;

      // Track cancellation date if exists
      if (reg.cancelledAt) {
        const cancelDate = new Date(reg.cancelledAt).toISOString().split('T')[0];
        if (!timelineMap.has(cancelDate)) {
          timelineMap.set(cancelDate, { registered: 0, cancelled: 0 });
        }
        timelineMap.get(cancelDate)!.cancelled += 1;
      }
    });

    // Convert timeline map to sorted array
    const timeline = Array.from(timelineMap.entries())
      .map(([date, counts]) => ({
        date,
        ...counts
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 10. Build analytics response
    const analyticsData: AnalyticsData = {
      eventId: event._id.toString(),
      eventName: event.name,
      eventDate: event.date.toISOString(),
      summary: {
        totalRegistered: registeredCount,
        totalWaitlisted: waitlistedCount,
        totalCancelled: cancelledCount,
        currentCapacity: registeredCount + waitlistedCount,
        maxCapacity: event.maxCapacity || 0
      },
      participants,
      timeline
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error("Error fetching event analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
