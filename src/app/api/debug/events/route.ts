import { mongoConnect } from '@/lib/mongodb';
import Event from '@/lib/models/Event';
import Registration from '@/lib/models/Registration';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await mongoConnect();
    
    // Get all events with basic info (without population to avoid model issues)
    const events = await Event.find({})
      .sort({ createdAt: -1 });
    
    // Get registration counts
    const eventData = [];
    
    for (const event of events) {
      const registrationCount = await Registration.countDocuments({
        eventId: event._id,
        status: 'registered'
      });
      
      const waitlistCount = await Registration.countDocuments({
        eventId: event._id,
        status: 'waitlisted'
      });
      
      eventData.push({
        id: event._id.toString(),
        name: event.name,
        date: event.date,
        discipline: event.discipline,
        facilityId: event.facility?.toString() || 'N/A',
        createdById: event.createdBy?.toString() || 'N/A',
        registrationCount: registrationCount,
        waitlistCount: waitlistCount,
        maxCapacity: event.maxCapacity || 0,
        allowRegistration: event.allowRegistration,
        createdAt: event.createdAt
      });
    }
    
    return NextResponse.json({
      success: true,
      totalEvents: events.length,
      events: eventData
    });
    
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}