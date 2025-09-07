// Check registrations in MongoDB
import "dotenv/config";
import { mongoConnect } from "@/lib/mongodb";
import Registration from "@/lib/models/Registration";
import Event from "@/lib/models/Event";
import User from "@/lib/models/User";

async function main() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoConnect();
    
    console.log('📊 Checking all registrations...');
    const allRegistrations = await Registration.find({});
    console.log(`Found ${allRegistrations.length} registrations in total`);
    
    if (allRegistrations.length > 0) {
      console.log('📋 All registrations:');
      for (let i = 0; i < allRegistrations.length; i++) {
        const reg = allRegistrations[i];
        const user = await User.findById(reg.userId);
        const event = await Event.findById(reg.eventId);
        
        console.log(`${i + 1}. ID: ${reg._id}`);
        console.log(`   - User: ${user ? user.displayName + ' (' + user.email + ')' : 'Unknown'} [${reg.userId}]`);
        console.log(`   - Event: ${event ? event.name : 'Unknown'} [${reg.eventId}]`);
        console.log(`   - Status: ${reg.status}`);
        console.log(`   - Registered: ${reg.registeredAt}`);
        console.log('');
      }
    } else {
      console.log('❌ No registrations found');
    }
    
    console.log('\n👤 Checking all users...');
    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} users in total`);
    
    if (allUsers.length > 0) {
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. User: ${user.displayName} (${user.email}) [${user._id}] - Role: ${user.role}`);
      });
    }
    
    console.log('\n📅 Checking all events...');
    const allEvents = await Event.find({});
    console.log(`Found ${allEvents.length} events in total`);
    
    if (allEvents.length > 0) {
      allEvents.forEach((event, index) => {
        console.log(`${index + 1}. Event: ${event.name} (${event._id})`);
        console.log(`   - Registration Count: ${event.registrationCount}`);
        console.log(`   - Waitlist Count: ${event.waitlistCount}`);
        console.log(`   - Max Capacity: ${event.maxCapacity}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

main().catch(console.error);