import { NextResponse } from 'next/server';
import { mongoConnect } from '@/lib/mongodb';
import Facility from '@/lib/models/Facility';
import { auth } from '@/lib/auth';
import { hasPermission } from '@/lib/types/permissions';
import { facilitiesCA, type FacilitySeed } from '@/data/facilities.ca';

// If your Facility model has address required, set this true to use a placeholder.
const USE_PLACEHOLDER_ADDRESS = true;
const PLACEHOLDER_ADDRESS = "Unknown";

function normalize(seed: FacilitySeed): FacilitySeed {
  const norm = (s?: string) => (s ? s.normalize("NFC").replace(/\s+/g, " ").trim() : s);
  return {
    ...seed,
    name: norm(seed.name)!,
    city: norm(seed.city),
    province: norm(seed.province)!,
    country: "Canada",
    address:
      seed.address ??
      (USE_PLACEHOLDER_ADDRESS ? PLACEHOLDER_ADDRESS : undefined),
  };
}

/**
 * POST /api/admin/seed-facilities
 * Seed facilities from the manual data file - requires admin permissions
 */
export async function POST() {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Permission check - only Owner/Admin can seed facilities
    if (!hasPermission(session.user.role, 'canManageEvents')) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Admin access required.' 
      }, { status: 403 });
    }

    console.log(`[seed-api] Loading ${facilitiesCA.length} manual facilities...`);
    const rows = facilitiesCA.map(normalize);

    console.log("[seed-api] Connecting to MongoDB...");
    await mongoConnect();

    // Check current facility count before seeding
    const beforeCount = await Facility.countDocuments();

    const ops = rows.map((f) => ({
      updateOne: {
        filter: {
          name: f.name,
          city: f.city,
          province: f.province,
          country: f.country,
        },
        update: {
          $set: {
            name: f.name,
            city: f.city,
            province: f.province,
            country: f.country,
            ...(f.address ? { address: f.address } : {}),
          },
        },
        upsert: true,
      },
    }));

    console.log("[seed-api] Upserting facilities...");
    const res = await Facility.bulkWrite(ops, { ordered: false });
    
    // Get facilities by province
    const byProvince = await Facility.aggregate([
      { $match: { country: "Canada" } },
      { $group: { _id: "$province", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const afterCount = await Facility.countDocuments();
    
    console.log(
      `[seed-api] ✅ Success! Upserted: ${res.upsertedCount ?? 0}, Modified: ${
        res.modifiedCount ?? 0
      }, Total processed: ${rows.length}`
    );

    return NextResponse.json({
      success: true,
      message: 'Facilities seeded successfully',
      stats: {
        totalProcessed: rows.length,
        upserted: res.upsertedCount ?? 0,
        modified: res.modifiedCount ?? 0,
        beforeCount,
        afterCount,
      },
      facilitiesByProvince: byProvince,
      executedBy: session.user.displayName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[seed-api] error:', error);
    return NextResponse.json({
      error: 'Failed to seed facilities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/seed-facilities
 * Get current facilities count and seeding status
 */
export async function GET() {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Permission check
    if (!hasPermission(session.user.role, 'canManageEvents')) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Admin access required.' 
      }, { status: 403 });
    }

    await mongoConnect();
    
    const totalFacilities = await Facility.countDocuments();
    const byProvince = await Facility.aggregate([
      { $match: { country: "Canada" } },
      { $group: { _id: "$province", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return NextResponse.json({
      success: true,
      totalFacilities,
      facilitiesByProvince: byProvince,
      availableToSeed: facilitiesCA.length,
      needsSeeding: totalFacilities === 0
    });

  } catch (error) {
    console.error('[seed-api] status error:', error);
    return NextResponse.json({
      error: 'Failed to get facilities status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}