import { mongoConnect } from '@/lib/mongodb';
import Event from '@/lib/models/Event';
import Registration from '@/lib/models/Registration';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  const startTime = Date.now();

  try {
    console.log('🔍 Debug /api/debug/events - Starting event fetch...');

    await mongoConnect();
    console.log('✅ MongoDB connected');

    const db = mongoose.connection.db;
    const currentDatabase = db?.databaseName || 'unknown';
    const collectionName = Event.collection.name;

    console.log('📍 Database:', currentDatabase);
    console.log('📦 Collection:', collectionName);

    // Get raw count from MongoDB collection directly
    const rawCount = db ? await db.collection(collectionName).countDocuments() : 0;
    console.log('🔢 Raw document count from MongoDB:', rawCount);

    // Get all events with basic info (without population to avoid model issues)
    const events = await Event.find({})
      .sort({ createdAt: -1 });

    console.log('📊 Events found via Mongoose:', events.length);

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
        registrationDeadline: event.registrationDeadline,
        isArchived: event.isArchived || false,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      });
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('✅ Event fetch completed in', duration, 'ms');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      database: {
        name: currentDatabase,
        collection: collectionName,
        rawCount: rawCount,
        mongooseCount: events.length
      },
      totalEvents: events.length,
      events: eventData,
      diagnostics: {
        countMismatch: rawCount !== events.length,
        recommendation: rawCount === 0
          ? 'No events in database at all. Events are not being created or persisted.'
          : rawCount > events.length
          ? 'Some events exist in database but cannot be read by Mongoose. Check schema validation.'
          : 'Event counts match. All events are accessible.'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching events:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}