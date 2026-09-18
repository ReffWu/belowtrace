// Saves full reports for the demo addresses into src/data/golden.json, so a live demo still works
// if the address service is down. Run against a local server: BASE=http://localhost:3313 node scripts/build-golden.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ADDRESSES = ["16776 Prevost St", "16821 Fenmore St", "14600 Archdale St", "5919 Oldtown St"];

// Must match normalizeQuery in src/lib/report.ts.
const normalize = (q) =>
  q.toLowerCase().replace(/,?\s*(detroit|mi|michigan|usa)\b/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const golden = {};
for (const address of ADDRESSES) {
  const res = await fetch(`${BASE}/api/report?${new URLSearchParams({ address })}`);
  const report = await res.json();
  if (!res.ok) throw new Error(`${address}: ${report.message}`);
  const core = { ...report };
  delete core.programs; // program cards depend on the situation and are rebuilt per request
  const withZip = `${address}, Detroit, MI, ${core.parcel?.zip ?? core.address.match(/\d{5}$/)?.[0] ?? ""}`;
  for (const key of new Set([normalize(address), normalize(core.address), normalize(withZip)])) golden[key] = core;
  console.log(`${address}: ok`);
}
const out = join(dirname(fileURLToPath(import.meta.url)), "../src/data/golden.json");
writeFileSync(out, JSON.stringify(golden));
console.log(`wrote ${Object.keys(golden).length} keys`);
