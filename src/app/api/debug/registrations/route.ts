import { mongoConnect } from '@/lib/mongodb';
import Registration from '@/lib/models/Registration';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await mongoConnect();
    
    // Get all registrations
    const registrations = await Registration.find({})
      .sort({ createdAt: -1 });
    
    const registrationData = registrations.map(reg => ({
      id: reg._id.toString(),
      userId: reg.userId.toString(),
      eventId: reg.eventId.toString(),
      status: reg.status,
      registeredAt: reg.registeredAt,
      createdAt: reg.createdAt,
      updatedAt: reg.updatedAt
    }));
    
    return NextResponse.json({
      success: true,
      totalRegistrations: registrations.length,
      registrations: registrationData
    });
    
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}