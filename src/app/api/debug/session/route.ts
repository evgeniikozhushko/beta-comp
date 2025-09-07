import { auth } from '@/lib/auth';
import { mongoConnect } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Debug session endpoint called');
    
    // Get current session
    const session = await auth();
    console.log('📊 Session result:', session ? 'Found' : 'None');
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No active session',
        sessionExists: false,
        userInDatabase: false
      });
    }
    
    console.log('👤 Session user:', {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      role: session.user.role
    });
    
    // Check if user exists in database
    await mongoConnect();
    console.log('🔌 MongoDB connected, checking user in database...');
    
    const userInDb = await User.findById(session.user.id);
    console.log('💾 User found in database:', userInDb ? 'YES' : 'NO');
    
    if (userInDb) {
      console.log('👤 Database user details:', {
        id: userInDb._id.toString(),
        email: userInDb.email,
        displayName: userInDb.displayName,
        role: userInDb.role,
        googleId: userInDb.googleId
      });
    }
    
    return NextResponse.json({
      success: true,
      sessionExists: true,
      userInDatabase: !!userInDb,
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.displayName,
          role: session.user.role,
          googleId: session.user.googleId
        },
        expires: session.expires
      },
      databaseUser: userInDb ? {
        id: userInDb._id.toString(),
        email: userInDb.email,
        displayName: userInDb.displayName,
        role: userInDb.role,
        googleId: userInDb.googleId,
        createdAt: userInDb.createdAt,
        updatedAt: userInDb.updatedAt
      } : null,
      mismatch: session.user.id !== userInDb?._id.toString()
    });
    
  } catch (error) {
    console.error('❌ Error in session debug endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionExists: false,
      userInDatabase: false
    }, { status: 500 });
  }
}