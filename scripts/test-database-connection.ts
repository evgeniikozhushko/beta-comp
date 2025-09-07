#!/usr/bin/env tsx

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { mongoConnect } from '../src/lib/mongodb';
import User from '../src/lib/models/User';
import Event from '../src/lib/models/Event';
import Registration from '../src/lib/models/Registration';
import Facility from '../src/lib/models/Facility';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection and models...');
  
  try {
    // Test connection
    console.log('📡 Connecting to MongoDB...');
    await mongoConnect();
    console.log('✅ MongoDB connection successful');
    
    // Test User model
    console.log('👥 Testing User model...');
    const userCount = await User.countDocuments();
    console.log(`✅ User model working - ${userCount} users found`);
    
    // Test Facility model
    console.log('🏢 Testing Facility model...');
    const facilityCount = await Facility.countDocuments();
    console.log(`✅ Facility model working - ${facilityCount} facilities found`);
    
    // Test Event model
    console.log('📅 Testing Event model...');
    const eventCount = await Event.countDocuments();
    console.log(`✅ Event model working - ${eventCount} events found`);
    
    // Test Registration model
    console.log('📝 Testing Registration model...');
    const registrationCount = await Registration.countDocuments();
    console.log(`✅ Registration model working - ${registrationCount} registrations found`);
    
    // Test complex query
    console.log('🔍 Testing complex query...');
    const events = await Event.find({})
      .populate('facility')
      .populate('createdBy')
      .limit(3);
    
    console.log(`✅ Complex query working - found ${events.length} populated events`);
    
    events.forEach((event, index) => {
      console.log(`   Event ${index + 1}: ${event.name}`);
      console.log(`   - Facility: ${(event.facility as any)?.name || 'N/A'}`);
      console.log(`   - Created by: ${(event.createdBy as any)?.displayName || 'N/A'}`);
      console.log(`   - Registration count: ${event.registrationCount || 0}`);
    });
    
    console.log('🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Check specific error types
    if (error instanceof Error) {
      if (error.message.includes('MONGODB_URI')) {
        console.log('💡 Tip: Check your .env file has MONGODB_URI set correctly');
      }
      if (error.message.includes('authentication failed')) {
        console.log('💡 Tip: Check your MongoDB credentials and network access');
      }
    }
  }
  
  process.exit(0);
}

testDatabaseConnection();