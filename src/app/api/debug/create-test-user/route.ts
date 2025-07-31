import { mongoConnect } from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await mongoConnect();
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Test user already exists',
        user: {
          id: existingUser._id.toString(),
          email: existingUser.email,
          displayName: existingUser.displayName,
          hasPassword: !!existingUser.password
        }
      });
    }
    
    // Create hashed password
    const hashedPassword = await bcrypt.hash('password', 12);
    
    // Create test user
    const testUser = await User.create({
      email: 'test@example.com',
      displayName: 'Test User',
      password: hashedPassword,
      googleId: '',
      picture: ''
    });
    
    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      user: {
        id: testUser._id.toString(),
        email: testUser.email,
        displayName: testUser.displayName,
        hasPassword: !!testUser.password,
        passwordHash: testUser.password.substring(0, 10) + '...'
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