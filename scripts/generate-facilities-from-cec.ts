// scripts/generate-facilities-from-cec.ts
// Generates src/data/facilities.ca.generated.json from the CEC directory.
// Run: pnpm gen:facilities

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

const SOURCE = "https://climbingcanada.ca/where-to-climb-in-canada/";

// Canonical province buckets used by the CEC page.
const PROVINCES = [
  "British Columbia",
  "Alberta",
  "Saskatchewan",
  "Manitoba",
  "Ontario",
  "Québec",
  "New Brunswick",
  "Nova Scotia",
  "Prince Edward Island",
  "Newfoundland and Labrador",
  "Territories",
] as const;

type Province = (typeof PROVINCES)[number];

type FacilitySeed = {
  name: string;
  city?: string;
  province: Province;
  country: "Canada";
  address?: string; // optional; your model allows it to be optional/placeholder
};

const norm = (s: string) => s.normalize("NFC").replace(/\s+/g, " ").trim();

// Map province name variants to canonical spellings (if needed).
function canonicalProvince(s: string): Province | null {
  const t = norm(s);
  const hit = PROVINCES.find((p) => p.toLowerCase() === t.toLowerCase());
  return hit ?? null;
}

// Very light heuristic to split a line into { name, city? }.
// Removes trailing discipline codes like TR/B/L/S when present.
function parseLine(line: string): { name: string; city?: string } | null {
  const cleaned = norm(
    line
      .replace(/Image/gi, "")
      .replace(/Discipline:.*$/i, "")
      .replace(/\b(TR|B|L|S)(,|\s|$).*/i, "")
  );
  if (!cleaned) return null;

  // Try a simple "Name, City" pattern first
  const m = cleaned.match(/^(.*?)[,\s]+([A-Za-zÀ-ÿ' -]+)$/);
  if (m?.[1]) {
    const name = norm(m[1]);
    const city = norm(m[2] || "");
    return { name, city: city || undefined };
  }

  // Fallback: last token as city if multiple tokens
  const tokens = cleaned.split(" ");
  if (tokens.length > 2) {
    const city = tokens.at(-1)!;
    const name = tokens.slice(0, -1).join(" ");
    return { name: norm(name), city: norm(city) };
  }

  return { name: cleaned };
}

async function main() {
  try {
    // Use global fetch (Node >=18). If your runtime is older, add undici or node-fetch.
    const res = await fetch(SOURCE, {
      headers: { "User-Agent": "beta-comp-facility-generator/1.0" },
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    // Try multiple selectors to find content container
    let $root = $("main, article, .entry-content, .content, #content").first();
    if ($root.length === 0) {
      // Fallback to body if no content container found
      console.log("[generator] No specific content container found, using body");
      $root = $("body");
    }

    const rows: FacilitySeed[] = [];
    const seen = new Set<string>();
    const skipped: string[] = [];
    let currentProvince: Province | null = null;

    // Strategy: find all text content and look for province patterns
    const allText = $root.text();
    console.log("[generator] Scanning page content...");
    
    // Look for all headings and strong elements that might be provinces
    $root.find("h1, h2, h3, h4, h5, h6, strong, b").each((_, el) => {
      const txt = norm($(el).text());
      const maybeProvince = canonicalProvince(txt);
      if (maybeProvince && !currentProvince) {
        console.log(`[generator] Found province: ${maybeProvince}`);
        currentProvince = maybeProvince;
      }
    });

    // Alternative strategy: walk all elements looking for province headings and following content
    $root.find("*").each((_, el) => {
      const $el = $(el);
      const txt = norm($el.text());
      
      // Check if this element is a province heading
      const maybeProvince = canonicalProvince(txt);
      if (maybeProvince) {
        currentProvince = maybeProvince;
        console.log(`[generator] Processing ${currentProvince}...`);
        
        // Look at next siblings for facility listings
        let nextEl = $el.next();
        while (nextEl.length > 0 && !canonicalProvince(norm(nextEl.text()))) {
          const content = norm(nextEl.text());
          if (content) {
            const lines = content
              .split(/\n+/)
              .map(norm)
              .filter(Boolean)
              .filter(
                (line) =>
                  line.length > 2 &&
                  !/^Discipline:/i.test(line) &&
                  !/^Home$|^Events$|^Volunteer$/i.test(line) &&
                  !PROVINCES.includes(line as Province)
              );

            for (const line of lines) {
              const parsed = parseLine(line);
              if (!parsed) {
                skipped.push(`${currentProvince}: ${line}`);
                continue;
              }

              const key = `${parsed.name}::${parsed.city ?? ""}::${currentProvince}`;
              if (seen.has(key)) continue;
              seen.add(key);

              rows.push({
                name: parsed.name,
                city: parsed.city,
                province: currentProvince,
                country: "Canada",
              });
            }
          }
          nextEl = nextEl.next();
        }
      }
    });

    // Basic per-province summary
    const summary = PROVINCES.reduce<Record<string, number>>((acc, p) => {
      acc[p] = rows.filter((r) => r.province === p).length;
      return acc;
    }, {});

    const outPath = join(
      process.cwd(),
      "src/data/facilities.ca.generated.json"
    );

    // Ensure data directory exists
    const { mkdirSync } = await import("node:fs");
    mkdirSync(join(process.cwd(), "src/data"), { recursive: true });

    const payload = {
      source: SOURCE,
      generatedAt: new Date().toISOString(),
      summary,
      total: rows.length,
      skipped: skipped.length,
      data: rows,
    };

    writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
    console.log(
      `[generator] Wrote ${rows.length} facilities → ${outPath}\nSummary:`,
      summary
    );
    
    if (skipped.length > 0) {
      console.log(`[generator] Skipped ${skipped.length} unparsable lines`);
      if (skipped.length < 10) {
        console.log("Skipped lines:", skipped);
      }
    }

  } catch (error) {
    console.error("[generator] error:", error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[generator] error:", e);
  process.exit(1);
});