import { NextResponse } from 'next/server';
import { mongoConnect } from '@/lib/mongodb';
import Facility from '@/lib/models/Facility';
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
 * POST /api/debug/seed-facilities
 * Debug endpoint to seed facilities (no auth required for testing)
 */
export async function POST() {
  try {
    console.log(`[debug-seed] Loading ${facilitiesCA.length} manual facilities...`);
    const rows = facilitiesCA.map(normalize);

    console.log("[debug-seed] Connecting to MongoDB...");
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

    console.log("[debug-seed] Upserting facilities...");
    const res = await Facility.bulkWrite(ops, { ordered: false });
    
    // Get facilities by province
    const byProvince = await Facility.aggregate([
      { $match: { country: "Canada" } },
      { $group: { _id: "$province", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const afterCount = await Facility.countDocuments();
    
    console.log(
      `[debug-seed] ✅ Success! Upserted: ${res.upsertedCount ?? 0}, Modified: ${
        res.modifiedCount ?? 0
      }, Total processed: ${rows.length}`
    );

    return NextResponse.json({
      success: true,
      message: 'Facilities seeded successfully via debug endpoint',
      stats: {
        totalProcessed: rows.length,
        upserted: res.upsertedCount ?? 0,
        modified: res.modifiedCount ?? 0,
        beforeCount,
        afterCount,
      },
      facilitiesByProvince: byProvince,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[debug-seed] error:', error);
    return NextResponse.json({
      error: 'Failed to seed facilities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/debug/seed-facilities
 * Get current facilities count and seeding status
 */
export async function GET() {
  try {
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
      needsSeeding: totalFacilities === 0,
      message: totalFacilities === 0 ? 
        'No facilities found. Use POST /api/debug/seed-facilities to seed them.' : 
        `${totalFacilities} facilities found in database.`
    });

  } catch (error) {
    console.error('[debug-seed] status error:', error);
    return NextResponse.json({
      error: 'Failed to get facilities status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}