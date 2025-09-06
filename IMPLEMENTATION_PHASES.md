Refined Roles & Permissions Implementation Plan                                    │
     │                                                                                    │
     │ Phase 1: Admin API Endpoints (Priority: High, 2-3 hours)                           │
     │                                                                                    │
     │ 1.1 Create Admin API Routes                                                        │
     │                                                                                    │
     │ - GET /api/admin/users - List all users with filtering/pagination                  │
     │ - GET /api/admin/users/[id]/role - Get specific user details                       │
     │ - PATCH /api/admin/users/[id]/role - Update user role                              │
     │                                                                                    │
     │ 1.2 Implementation Details                                                         │
     │                                                                                    │
     │ - Create src/app/api/admin/users/route.ts with proper JWT validation               │
     │ - Create src/app/api/admin/users/[id]/role/route.ts for individual user operations │
     │ - Add permission guards using existing hasPermission() with canManageUsers         │
     │ - Include proper error handling and response formatting                            │
     │ - Add request/response TypeScript interfaces                                       │
     │                                                                                    │
     │ Phase 2: Event Registration System (Priority: High, 4-5 hours)                     │
     │                                                                                    │
     │ 2.1 Database Layer                                                                 │
     │                                                                                    │
     │ - Create Registration model with Event/User relationships                          │
     │ - Add registration methods to existing actions.ts                                  │
     │                                                                                    │
     │ 2.2 Backend Actions                                                                │
     │                                                                                    │
     │ - Add registerForEventAction() and unregisterFromEventAction()                     │
     │ - Include capacity limits, deadline checks, and permission validation              │
     │ - Update Event model to track registration count                                   │
     │                                                                                    │
     │ 2.3 Frontend Components                                                            │
     │                                                                                    │
     │ - Add registration buttons to event cards in events/page.tsx                       │
     │ - Show registration status (registered/full/expired)                               │
     │ - Display participant count and registration deadline                              │
     │ - Handle loading states and error feedback                                         │
     │                                                                                    │
     │ Phase 3: User Management UI (Priority: Medium, 3-4 hours)                          │
     │                                                                                    │
     │ 3.1 Admin Dashboard Structure                                                      │
     │                                                                                    │
     │ - Create src/app/admin/ route group with layout                                    │
     │ - Add admin navigation component with role-based visibility                        │
     │                                                                                    │
     │ 3.2 User Management Pages                                                          │
     │                                                                                    │
     │ - Create src/app/admin/users/page.tsx - User list with role management             │
     │ - Create user management components for role assignment                            │
     │ - Add search/filter functionality for user list                                    │
     │ - Include bulk operations for role changes                                         │
     │                                                                                    │
     │ 3.3 Navigation Integration                                                         │
     │                                                                                    │
     │ - Update main navigation to show admin links for authorized users                  │
     │ - Add breadcrumb navigation for admin sections                                     │
     │                                                                                    │
     │ Phase 4: Testing & Polish (Priority: Medium, 2-3 hours)                            │
     │                                                                                    │
     │ 4.1 Comprehensive Testing                                                          │
     │                                                                                    │
     │ - Test all permission combinations across different roles                          │
     │ - Verify API endpoint security with different auth levels                          │
     │ - Test registration flow end-to-end with capacity limits                           │
     │                                                                                    │
     │ 4.2 UI/UX Improvements                                                             │
     │                                                                                    │
     │ - Add loading states for all async operations                                      │
     │ - Improve error messages and user feedback                                         │
     │ - Add confirmation dialogs for destructive actions                                 │
     │ - Ensure responsive design across all new components                               │
     │                                                                                    │
     │ 4.3 Documentation Updates                                                          │
     │                                                                                    │
     │ - Update ROLE_MANAGEMENT.md with working API examples                              │
     │ - Document new registration and admin features                                     │
     │ - Add troubleshooting guides for common issues                                     │
     │                                                                                    │
     │ Success Criteria                                                                   │
     │                                                                                    │
     │ - ✅ All 3 missing admin API endpoints working and secured                          │
     │ - ✅ Complete event registration system with capacity management                    │
     │ - ✅ Admin UI for user role management                                              │
     │ - ✅ All features properly tested across role levels                                │
     │ - ✅ Documentation updated with working examples                                    │
     │                                                                                    │
     │ Estimated Total Time: 11-15 hours                                                  │
     │ Recommended Order: Phase 1 → Phase 2 → Phase 3 → Phase 4                           │
     ╰────────────────────────────────────────────────────────────────────────────────────╯

> provide a detailed plan with code and descriptions for me to manually implement changes, lets 
  start with Phase 1

⏺ Phase 1: Admin API Endpoints - Detailed Implementation Guide

  Overview

  Create three admin API endpoints with proper JWT validation and role-based permissions. All
  endpoints will be protected by the canManageUsers permission (Owner/Admin only).

  File Structure

  src/app/api/admin/
  ├── users/
  │   ├── route.ts              # GET /api/admin/users
  │   └── [id]/
  │       └── role/
  │           └── route.ts      # GET & PATCH /api/admin/users/[id]/role

  Step 1: Create Admin Users List Endpoint

  File: src/app/api/admin/users/route.ts

  import { NextRequest, NextResponse } from 'next/server';
  import { auth } from '@/lib/auth';
  import { hasPermission } from '@/lib/types/permissions';
  import { mongoConnect } from '@/lib/mongodb';
  import User from '@/lib/models/User';

  interface UserListResponse {
    users: Array<{
      id: string;
      displayName: string;
      email: string;
      role: string;
      createdAt: string;
      picture?: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }

  export async function GET(request: NextRequest): Promise<NextResponse<UserListResponse | {
  error: string }>> {
    try {
      // 1. Authentication check
      const session = await auth();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 2. Permission check - only Owner/Admin can manage users
      if (!hasPermission(session.user.role, 'canManageUsers')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 3. Parse query parameters for pagination
      const { searchParams } = new URL(request.url);
      const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
      const search = searchParams.get('search') || '';
      const roleFilter = searchParams.get('role') || '';

      // 4. Connect to database
      await mongoConnect();

      // 5. Build query filters
      const query: any = {};
      if (search) {
        query.$or = [
          { displayName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (roleFilter && ['owner', 'admin', 'athlete', 'official'].includes(roleFilter)) {
        query.role = roleFilter;
      }

      // 6. Execute queries in parallel
      const [users, total] = await Promise.all([
        User.find(query)
          .select('displayName email role createdAt picture')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);

      // 7. Format response
      const formattedUsers = users.map(user => ({
        id: user._id.toString(),
        displayName: user.displayName,
        email: user.email || '',
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        picture: user.picture
      }));

      return NextResponse.json({
        users: formattedUsers,
        total,
        page,
        limit
      });

    } catch (error) {
      console.error('Admin users list error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  Step 2: Create Individual User Role Management Endpoint

  File: src/app/api/admin/users/[id]/role/route.ts

  import { NextRequest, NextResponse } from 'next/server';
  import { auth } from '@/lib/auth';
  import { hasPermission, isAdminRole } from '@/lib/types/permissions';
  import { mongoConnect } from '@/lib/mongodb';
  import User from '@/lib/models/User';
  import { z } from 'zod';

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
      const session = await auth();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 2. Permission check
      if (!hasPermission(session.user.role, 'canManageUsers')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // 3. Connect to database
      await mongoConnect();

      // 4. Find user
      const user = await User.findById(params.id).select('displayName email role createdAt 
  updatedAt').lean();
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

  // PATCH /api/admin/users/[id]/role - Update user role
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
            details: validation.error.errors.map(e => e.message).join(', ')
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

  Step 3: Create TypeScript Interfaces (Optional but Recommended)

  File: src/lib/types/admin.ts

  export interface AdminUser {
    id: string;
    displayName: string;
    email: string;
    role: 'owner' | 'admin' | 'athlete' | 'official';
    createdAt: string;
    picture?: string;
  }

  export interface AdminUserListResponse {
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
  }

  export interface AdminUserDetailResponse {
    id: string;
    displayName: string;
    email: string;
    role: 'owner' | 'admin' | 'athlete' | 'official';
    createdAt: string;
    updatedAt: string;
  }

  export interface AdminRoleUpdateRequest {
    role: 'owner' | 'admin' | 'athlete' | 'official';
  }

  export interface AdminErrorResponse {
    error: string;
    details?: string;
  }

  Step 4: Testing the Endpoints

  Test Authentication Required

  # Should return 401
  curl -X GET "http://localhost:3000/api/admin/users"

  Test User List (with proper JWT token)

  # Get all users
  curl -H "Authorization: Bearer <your-jwt-token>" \
    "http://localhost:3000/api/admin/users"

  # Get users with pagination
  curl -H "Authorization: Bearer <your-jwt-token>" \
    "http://localhost:3000/api/admin/users?page=1&limit=10"

  # Search users
  curl -H "Authorization: Bearer <your-jwt-token>" \
    "http://localhost:3000/api/admin/users?search=john&role=athlete"

  Test Individual User Operations

  # Get specific user
  curl -H "Authorization: Bearer <your-jwt-token>" \
    "http://localhost:3000/api/admin/users/<user-id>/role"

  # Update user role
  curl -X PATCH \
    -H "Authorization: Bearer <your-jwt-token>" \
    -H "Content-Type: application/json" \
    -d '{"role": "admin"}' \
    "http://localhost:3000/api/admin/users/<user-id>/role"

  Step 5: Update Documentation

  Update ROLE_MANAGEMENT.md - Replace the Admin API section:

  ### Method 2: Admin API Endpoints

  #### List all users (Admin/Owner only):
  ```bash
  curl -H "Authorization: Bearer <your-jwt-token>" \
    "http://localhost:3000/api/admin/users?page=1&limit=20"

  # With search and role filter
  curl -H "Authorization: Bearer <your-jwt-token>" \
    "http://localhost:3000/api/admin/users?search=john&role=athlete&page=1&limit=10"

  Get specific user details:

  curl -H "Authorization: Bearer <your-jwt-token>" \
    "http://localhost:3000/api/admin/users/<user-id>/role"

  Change user role:

  curl -X PATCH \
    -H "Authorization: Bearer <your-jwt-token>" \
    -H "Content-Type: application/json" \
    -d '{"role": "admin"}' \
    "http://localhost:3000/api/admin/users/<user-id>/role"

  Response Format:
  {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "displayName": "John Doe",
        "email": "john@example.com",
        "role": "athlete",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "picture": "https://..."
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20
  }

  ## Key Features Implemented

  1. **Complete Authentication & Authorization**: JWT validation + role-based permissions
  2. **Comprehensive Error Handling**: Proper HTTP status codes and error messages
  3. **Business Logic Protection**: Prevents self-modification and owner role restrictions
  4. **Pagination & Search**: Efficient user listing with filtering capabilities
  5. **Audit Logging**: Role changes are logged to console
  6. **Type Safety**: Full TypeScript interfaces and validation
  7. **Security Best Practices**: Input validation, permission checks, and sanitized responses

  This completes Phase 1 with production-ready admin API endpoints that integrate seamlessly
  with your existing permission system.

  Final notes:

   # Roles & Permissions Implementation Progress

  ## Current Status
  - ✅ Permissions system complete with recent updates (admin.canRegisterForEvents = false)
  - ✅ Phase 1 plan created with detailed code examples
  - 🔄 Currently working on: Phase 1 - Admin API Endpoints

  ## Phase 1: Admin API Endpoints (In Progress)

  ### Files to Create:
  1. `src/app/api/admin/users/route.ts` - User list endpoint
  2. `src/app/api/admin/users/[id]/role/route.ts` - Individual user management
  3. `src/lib/types/admin.ts` - TypeScript interfaces (optional)

  ### Implementation Details:
  [Copy the detailed code from this conversation here]

  ## Next Phases:
  - Phase 2: Event Registration System
  - Phase 3: User Management UI
  - Phase 4: Testing & Polish

  ## Notes:
  - Admin role permissions updated: canRegisterForEvents = false
  - JWT validation and role-based permissions working
  - Command-line scripts already functional

  Alternative: Use Git Branch

  # Create a feature branch to track this work
  git checkout -b feature/admin-api-implementation

  # Add your implementation files
  # Commit progress as you go
  git commit -m "WIP: Phase 1 admin API endpoints planning complete"