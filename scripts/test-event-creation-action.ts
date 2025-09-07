#!/usr/bin/env tsx

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { createEventAction } from '../src/app/events/actions';
import { mongoConnect } from '../src/lib/mongodb';

async function testEventCreation() {
  console.log('🧪 Testing event creation action directly...');
  
  try {
    await mongoConnect();
    console.log('✅ Database connected');
    
    // Create mock FormData with all required fields
    const formData = new FormData();
    formData.set('name', 'Test Event - Direct Action');
    formData.set('date', '2025-12-25T10:00'); // Christmas 2025
    formData.set('durationDays', '2');
    formData.set('facility', '68bcd0a3fbce4e34034ef0be'); // First facility ID from our list
    formData.set('discipline', 'Boulder');
    formData.set('division', 'Mixed');
    formData.set('description', 'Test event created by direct action call');
    formData.set('maxParticipants', '50');
    formData.set('entryFee', '25.00');
    formData.set('contactEmail', 'test@example.com');
    formData.set('registrationDeadline', '2025-12-20');
    
    // Add age categories
    formData.append('ageCategories', 'YD');
    formData.append('ageCategories', 'YC');
    formData.append('ageCategories', 'Open');
    
    console.log('📝 Form data prepared');
    console.log('🎯 Calling createEventAction...');
    
    // Call the action with empty previous state
    const result = await createEventAction(null, formData);
    
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
    if ('success' in result && result.success) {
      console.log('✅ Event creation successful!');
      console.log('📄 Event ID:', result.id);
      console.log('📄 Event Name:', result.name);
    } else if ('error' in result) {
      console.log('❌ Event creation failed:', result.error);
      if ('fieldErrors' in result && result.fieldErrors) {
        console.log('📝 Field errors:', result.fieldErrors);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
  
  process.exit(0);
}

testEventCreation();