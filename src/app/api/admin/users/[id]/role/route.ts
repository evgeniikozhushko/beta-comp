import { NextRequest, NextResponse } from "next/server";
import { mongoConnect } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";
import { isAdminRole, UserRole } from "@/lib/types/permissions";

const VALID_ROLES: UserRole[] = ['owner', 'admin', 'athlete', 'official'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Auth check
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Permission check - only owners and admins can update user roles
    if (!isAdminRole(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { 
          error: "Invalid role", 
          details: `Role must be one of: ${VALID_ROLES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Connect to database
    await mongoConnect();

    // Find target user
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent non-owners from changing owner roles
    if (session.user.role === 'admin' && (targetUser.role === 'owner' || role === 'owner')) {
      return NextResponse.json(
        { error: "Only owners can assign or change owner roles" },
        { status: 403 }
      );
    }

    // Prevent users from changing their own role (safety measure)
    if (targetUser._id.toString() === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    const oldRole = targetUser.role;

    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role: role },
      { new: true, select: 'displayName email role updatedAt' }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 }
      );
    }

    // Log the role change for audit purposes
    console.log(`🎭 Role changed by ${session.user.displayName} (${session.user.email}):`);
    console.log(`   Target: ${updatedUser.displayName} (${updatedUser.email})`);
    console.log(`   Role: ${oldRole} → ${role}`);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt,
      },
      changes: {
        field: 'role',
        oldValue: oldRole,
        newValue: role,
        changedBy: {
          id: session.user.id,
          displayName: session.user.displayName,
          email: session.user.email,
        }
      }
    });

  } catch (error) {
    console.error('Update user role API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Auth check
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Permission check - only admins can view user details
    if (!isAdminRole(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Connect to database
    await mongoConnect();

    // Find user
    const user = await User.findById(id)
      .select('displayName email role googleId createdAt updatedAt');

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        hasGoogleId: !!user.googleId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });

  } catch (error) {
    console.error('Get user API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}