import { createUserWithCredentials } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Creating test user...');
    
    const user = await createUserWithCredentials(
      'test@example.com',
      'password',
      'Test User'
    );
    
    console.log('Test user created:', user);
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      }
    });
    
  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 