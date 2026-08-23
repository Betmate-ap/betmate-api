/**
 * One-off script to validate CricAPI key and inspect live data shape.
 * Run: npx ts-node scripts/test-cricket-api.ts
 *
 * Set CRICKET_API_KEY and optionally CRICKET_IPL_SERIES_ID in .env
 * or export them before running.
 */

import "dotenv/config";

const API_KEY = process.env.CRICKET_API_KEY;
const SERIES_ID = process.env.CRICKET_IPL_SERIES_ID;
const BASE = "https://api.cricketdata.org/v1";

if (!API_KEY) {
  console.error("❌  CRICKET_API_KEY is not set");
  process.exit(1);
}

async function get(path: string) {
  const url = `${BASE}${path}`;
  console.log(`\nGET ${url}\n`);
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("Non-JSON response:", text.slice(0, 500));
    process.exit(1);
  }
}

async function searchSeries() {
  console.log("=== Step 1: Search for IPL series ===");
  const data = await get(
    `/series?apikey=${API_KEY}&search=indian+premier+league&offset=0`,
  );
  console.log("status:", data.status);
  console.log("info:", data.info);
  if (data.status !== "success") {
    console.error("API error:", JSON.stringify(data, null, 2));
    return;
  }
  const series: Array<{ id: string; name: string; startDate: string }> =
    data.data ?? [];
  series.forEach((s) => console.log(`  ${s.id}  ${s.name}  (${s.startDate})`));
}

async function inspectSeries() {
  if (!SERIES_ID) {
    console.log(
      "\n⚠️  CRICKET_IPL_SERIES_ID not set — skipping series inspect",
    );
    return;
  }
  console.log(`\n=== Step 2: Inspect series ${SERIES_ID} ===`);
  const data = await get(`/series_info?apikey=${API_KEY}&id=${SERIES_ID}`);
  console.log("status:", data.status);
  if (data.status !== "success") {
    console.error("API error:", JSON.stringify(data, null, 2));
    return;
  }

  const matches: Array<Record<string, unknown>> = data.data?.matchList ?? [];
  console.log(`\nTotal matches: ${matches.length}`);

  const sample = matches.slice(0, 3);
  console.log("\n--- First 3 matches (raw) ---");
  console.log(JSON.stringify(sample, null, 2));

  // Check team name format
  console.log("\n--- Team names seen ---");
  const teamNames = new Set<string>();
  for (const m of matches) {
    const teams = m.teams as string[] | undefined;
    teams?.forEach((t) => teamNames.add(t));
  }
  teamNames.forEach((t) => console.log(" ", t));

  // Check status strings for completed matches
  const completed = matches.filter((m) => m.matchEnded === true);
  console.log(
    `\n--- Status strings for completed matches (${completed.length} total) ---`,
  );
  completed.slice(0, 5).forEach((m) => {
    console.log(
      `  teams: ${(m.teams as string[])?.join(" vs ")}  |  status: "${m.status}"`,
    );
  });
}

(async () => {
  try {
    await searchSeries();
    await inspectSeries();
    console.log("\n✅  Done");
  } catch (err) {
    console.error("\n❌  Unexpected error:", err);
    process.exit(1);
  }
})();
