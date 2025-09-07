// Clean up orphaned registrations and fix event counts
import "dotenv/config";
import { mongoConnect } from "@/lib/mongodb";
import Registration from "@/lib/models/Registration";
import Event from "@/lib/models/Event";

async function main() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoConnect();
    
    console.log('🧹 Finding orphaned registrations...');
    const allRegistrations = await Registration.find({});
    
    for (const registration of allRegistrations) {
      const event = await Event.findById(registration.eventId);
      if (!event) {
        console.log(`❌ Found orphaned registration ${registration._id} for deleted event ${registration.eventId}`);
        console.log(`   Deleting orphaned registration...`);
        await Registration.findByIdAndDelete(registration._id);
        console.log(`   ✅ Deleted orphaned registration`);
      } else {
        console.log(`✅ Registration ${registration._id} has valid event: ${event.name}`);
      }
    }
    
    console.log('\n🔢 Fixing event registration counts...');
    const allEvents = await Event.find({});
    
    for (const event of allEvents) {
      const actualRegisteredCount = await Registration.countDocuments({
        eventId: event._id,
        status: 'registered'
      });
      
      const actualWaitlistCount = await Registration.countDocuments({
        eventId: event._id,
        status: 'waitlisted'
      });
      
      console.log(`📊 Event: ${event.name}`);
      console.log(`   Current counts - Registered: ${event.registrationCount}, Waitlisted: ${event.waitlistCount}`);
      console.log(`   Actual counts - Registered: ${actualRegisteredCount}, Waitlisted: ${actualWaitlistCount}`);
      
      if (event.registrationCount !== actualRegisteredCount || event.waitlistCount !== actualWaitlistCount) {
        console.log(`   🔧 Updating counts...`);
        await Event.findByIdAndUpdate(event._id, {
          registrationCount: actualRegisteredCount,
          waitlistCount: actualWaitlistCount
        });
        console.log(`   ✅ Updated event counts`);
      } else {
        console.log(`   ✅ Counts are already correct`);
      }
    }
    
    console.log('\n📋 Final verification...');
    const finalRegistrations = await Registration.find({});
    const finalEvents = await Event.find({});
    
    console.log(`✅ Final counts: ${finalRegistrations.length} registrations, ${finalEvents.length} events`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

main().catch(console.error);