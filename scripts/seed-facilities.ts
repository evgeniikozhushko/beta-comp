// scripts/seed-facilities.ts
// Reads src/data/facilities.ca.generated.json and upserts into MongoDB.
// Run: pnpm seed:facilities

import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mongoConnect } from "@/lib/mongodb";
import Facility from "@/lib/models/Facility";

type FacilitySeed = {
  name: string;
  city?: string;
  province: string;
  country: "Canada";
  address?: string;
};

// If your Facility model still has `address` required, set this true to use a placeholder.
const USE_PLACEHOLDER_ADDRESS = true;
const PLACEHOLDER_ADDRESS = "Unknown";

function loadGenerated(): FacilitySeed[] {
  const p = join(process.cwd(), "src/data/facilities.ca.generated.json");
  try {
    const json = JSON.parse(readFileSync(p, "utf8")) as {
      data: FacilitySeed[];
      total?: number;
    };
    if (!json?.data?.length) {
      throw new Error("No data found in facilities.ca.generated.json");
    }
    return json.data;
  } catch (error) {
    throw new Error(`Failed to load generated facilities: ${error}`);
  }
}

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
    console.log("[seed] Loading generated facilities...");
    const rows = loadGenerated().map(normalize);
    console.log(`[seed] Loaded ${rows.length} facilities`);

    console.log("[seed] Connecting to MongoDB...");
    await mongoConnect();

    // Tip: ensure your Facility schema has this index:
    // FacilitySchema.index({ name: 1, city: 1, province: 1, country: 1 }, { unique: true });

    const ops = rows.map((f) => ({
      updateOne: {
        filter: {
          name: f.name,
          city: f.city, // may be undefined; Mongoose matches undefined as "not present"
          province: f.province,
          country: f.country,
        },
        update: {
          $set: {
            name: f.name,
            city: f.city,
            province: f.province,
            country: f.country,
            ...(f.address ? { address: f.address } : {}), // only set if present
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

    // Show a sample by province
    const sampleByProvince = await Facility.aggregate([
      { $match: { country: "Canada" } },
      { $group: { _id: "$province", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log("[seed] Facilities by province:", sampleByProvince);

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