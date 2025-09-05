import { NextRequest, NextResponse } from "next/server";
import { auth} from '@/lib/auth';
import { hasPermission } from "@/lib/types/permissions";
import { mongoConnect } from "@/lib/mongodb";
import User from "@/lib/models/User";

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