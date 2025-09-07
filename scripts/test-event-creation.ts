// Test event creation functionality
import "dotenv/config";
import { mongoConnect } from "@/lib/mongodb";
import Event from "@/lib/models/Event";
import Facility from "@/lib/models/Facility";
import User from "@/lib/models/User";

async function main() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoConnect();
    
    // Check current state
    console.log('📊 Checking current state...');
    const eventCount = await Event.countDocuments({});
    const userCount = await User.countDocuments({});
    const facilityCount = await Facility.countDocuments({});
    
    console.log(`Current counts: Events: ${eventCount}, Users: ${userCount}, Facilities: ${facilityCount}`);
    
    if (userCount === 0) {
      console.log('❌ No users found - this will cause event creation to fail');
      return;
    }
    
    if (facilityCount === 0) {
      console.log('❌ No facilities found - this will cause event creation to fail');
      return;
    }
    
    // Get the first user and facility for testing
    const testUser = await User.findOne({});
    const testFacility = await Facility.findOne({});
    
    console.log('🧪 Test data:');
    console.log(`User: ${testUser?.displayName} (${testUser?._id})`);
    console.log(`Facility: ${testFacility?.name} (${testFacility?._id})`);
    
    // Create a test event directly (bypassing server action for testing)
    console.log('\n🚀 Creating test event...');
    const testEventData = {
      name: 'Debug Test Event',
      date: new Date('2025-12-01'),
      durationDays: 2,
      facility: testFacility!._id,
      discipline: 'Boulder' as const,
      ageCategories: ['Open'],
      division: 'Mixed' as const,
      createdBy: testUser!._id,
      registrationDeadline: new Date('2025-11-15'),
      description: 'Test event for debugging event creation issues',
      maxParticipants: 50,
    };
    
    const newEvent = await Event.create(testEventData);
    console.log('✅ Event created successfully!');
    console.log('📄 Event details:', {
      id: newEvent._id,
      name: newEvent.name,
      date: newEvent.date,
      facility: newEvent.facility,
      createdBy: newEvent.createdBy
    });
    
    // Verify the event exists
    const verifyEvent = await Event.findById(newEvent._id);
    console.log('🔍 Verification:', verifyEvent ? 'Event exists in database' : 'Event NOT found in database');
    
    // Count events again
    const finalEventCount = await Event.countDocuments({});
    console.log(`📈 Event count after creation: ${finalEventCount} (was ${eventCount})`);
    
    console.log('\n✅ Test completed successfully!');
    console.log('This confirms that direct event creation works.');
    console.log('If the web form still fails, the issue is likely in the server action validation or form processing.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
  process.exit(0);
}

main().catch(console.error);