import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/types/permissions';
import { mongoConnect } from '@/lib/mongodb';
import User, { IUser } from '@/lib/models/User';
import { z } from 'zod';
import { Types } from 'mongoose';

interface UserRoleResponse {
    id: string;
    displayName: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
}

interface RoleUpdateRequest {
    role: 'owner' | 'admin' | 'athlete' | 'official';
}

// Define lean user type for better type safety
type LeanUser = Pick<IUser, 'displayName' | 'email' | 'role' | 'createdAt' | 'updatedAt'> & {
    _id: Types.ObjectId;
};

// Schema for role update validation
const RoleUpdateSchema = z.object({
    role: z.enum(['owner', 'admin', 'athlete', 'official'], {
        message: 'Role must be one of: owner, admin, athlete, official'
    })
});

// GET /api/admin/users/[id]/role - Get specific user details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse<UserRoleResponse | { error: string }>> {
    try {
        // 1. Authentication check
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        // 2. Permission check
        if (!hasPermission(session.user.role, 'canManageUsers')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 3. Connect to database
        await mongoConnect()

        // 4. Find User
        const user = await User.findById(params.id).select('displayName email role createdAt updatedAt').lean<LeanUser>()
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // 5. Format response
        const userResponse: UserRoleResponse = {
            id: user._id.toString(),
            displayName: user.displayName,
            email: user.email || '',
            role: user.role,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString()
        };

        return NextResponse.json(userResponse);

    } catch (error) {
        console.error('Get user role error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
  ): Promise<NextResponse<UserRoleResponse | { error: string; details?: string }>> {
    try {
      // 1. Authentication check
      const session = await auth();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 2. Permission check
      if (!hasPermission(session.user.role, 'canManageUsers')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 3. Parse and validate request body
      const body = await request.json() as RoleUpdateRequest;
      const validation = RoleUpdateSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Invalid role',
            details: validation.error.issues.map(e => e.message).join(', ')
          },
          { status: 400 }
        );
      }

      const { role: newRole } = validation.data;

      // 4. Connect to database
      await mongoConnect();

      // 5. Find target user
      const targetUser = await User.findById(params.id);
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // 6. Business logic checks

      // Prevent self-role modification
      if (targetUser._id.toString() === session.user.id) {
        return NextResponse.json(
          { error: 'Cannot modify your own role' },
          { status: 400 }
        );
      }

      // Only owners can assign/remove owner role
      if (newRole === 'owner' && session.user.role !== 'owner') {
        return NextResponse.json(
          { error: 'Only owners can assign owner role' },
          { status: 403 }
        );
      }

      if (targetUser.role === 'owner' && session.user.role !== 'owner') {
        return NextResponse.json(
          { error: 'Only owners can modify owner roles' },
          { status: 403 }
        );
      }

      // 7. Update user role
      const updatedUser = await User.findByIdAndUpdate(
        params.id,
        { role: newRole },
        { new: true, runValidators: true }
      ).select('displayName email role createdAt updatedAt');

      if (!updatedUser) {
        return NextResponse.json(
          { error: 'Failed to update user role' },
          { status: 500 }
        );
      }

      // 8. Log the role change
      console.log(`Role change: ${session.user.displayName} (${session.user.role}) changed 
  ${updatedUser.displayName}'s role to ${newRole}`);

      // 9. Format response
      const userResponse: UserRoleResponse = {
        id: updatedUser._id.toString(),
        displayName: updatedUser.displayName,
        email: updatedUser.email || '',
        role: updatedUser.role,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString()
      };

      return NextResponse.json(userResponse);

    } catch (error) {
      console.error('Update user role error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }