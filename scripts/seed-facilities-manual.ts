// scripts/seed-facilities-manual.ts
// Seeds facilities from the manual src/data/facilities.ca.ts file
// Run: pnpm seed:facilities:manual

import "dotenv/config";
import { mongoConnect } from "@/lib/mongodb";
import Facility from "@/lib/models/Facility";
import { facilitiesCA, type FacilitySeed } from "@/data/facilities.ca";

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

async function main() {
  try {
    console.log(`[seed] Loading ${facilitiesCA.length} manual facilities...`);
    const rows = facilitiesCA.map(normalize);

    console.log("[seed] Connecting to MongoDB...");
    await mongoConnect();

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

    console.log("[seed] Upserting facilities...");
    const res = await Facility.bulkWrite(ops, { ordered: false });
    
    console.log(
      `[seed] ✅ Success! Upserted: ${res.upsertedCount ?? 0}, Modified: ${
        res.modifiedCount ?? 0
      }, Total processed: ${rows.length}`
    );

    // Show facilities by province
    const byProvince = await Facility.aggregate([
      { $match: { country: "Canada" } },
      { $group: { _id: "$province", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log("[seed] Facilities by province:", byProvince);

  } catch (error) {
    console.error("[seed] error:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch((e) => {
  console.error("[seed] error:", e);
  process.exit(1);
});