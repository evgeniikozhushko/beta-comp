import { NextRequest, NextResponse } from "next/server";
import { mongoConnect } from "@/lib/mongodb";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/types/permissions";

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Permission check - only owners and admins can list users
    if (!isAdminRole(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Connect to database
    await mongoConnect();

    // Get search/filter parameters
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    const query: Record<string, unknown> = {};
    
    if (role && ['owner', 'admin', 'athlete', 'official'].includes(role)) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('displayName email role googleId createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Get role distribution stats
    const roleStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    return NextResponse.json({
      users: users.map(user => ({
        id: String(user._id),
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        hasGoogleId: !!user.googleId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats: {
        total: totalCount,
        roleDistribution: roleStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}