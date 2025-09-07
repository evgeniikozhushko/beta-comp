// Create a test user to fix the registration issue
import "dotenv/config";
import { mongoConnect } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { Types } from "mongoose";

async function main() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoConnect();
    
    // The user ID being referenced in registrations
    const problematicUserId = '68b12e86076a0bb7cd669fd9';
    
    console.log(`🔍 Checking if user ${problematicUserId} exists...`);
    const existingUser = await User.findById(problematicUserId);
    
    if (existingUser) {
      console.log('✅ User already exists:', existingUser.displayName);
      return;
    }
    
    console.log('❌ User does not exist, creating...');
    
    // Create the user with the specific ID and make them the owner
    const newUser = await User.create({
      _id: new Types.ObjectId(problematicUserId),
      displayName: 'Test Owner',
      email: 'evgeniimedium@gmail.com', // This should give owner role
      role: 'owner'
    });
    
    console.log('✅ User created successfully:', newUser.displayName, newUser.email);
    
    // Verify the user was created
    const verifyUser = await User.findById(problematicUserId);
    console.log('🔍 Verification - User exists:', !!verifyUser);
    if (verifyUser) {
      console.log('   - Name:', verifyUser.displayName);
      console.log('   - Email:', verifyUser.email);
      console.log('   - Role:', verifyUser.role);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

main().catch(console.error);