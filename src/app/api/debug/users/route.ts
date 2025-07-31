import { mongoConnect } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await mongoConnect();
    
    const users = await User.find({});
    
    const userData = users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      passwordStart: user.password ? user.password.substring(0, 10) + '...' : 'null',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      users: userData
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 