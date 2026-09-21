// Private sewer work, one permit at a time.
//
// Nothing public maps a private lateral. But BSEED trades permits record when one was dug up,
// at which address, by whom — which is the closest thing to a private-line history that exists,
// and it is per-parcel.
import fs from "node:fs";

const BASE = "https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/bseed_trades_permits/FeatureServer/0/query";
const WHERE = [
  "UPPER(work_description) LIKE '%SEWER%'",
  "UPPER(work_description) LIKE '%LATERAL%'",
  "UPPER(work_description) LIKE '%BACKWATER%'",
  "UPPER(work_description) LIKE '%BACK WATER%'",
  "UPPER(work_description) LIKE '%BACKFLOW%'",
  "UPPER(work_description) LIKE '%CLEANOUT%'",
  "UPPER(work_description) LIKE '%CLEAN OUT%'",
].join(" OR ");

const FIELDS = "address,issued_date,work_description,contact_business_name,council_district,parcel_id,longitude,latitude";

async function page(offset) {
  const url = `${BASE}?where=${encodeURIComponent(WHERE)}&outFields=${FIELDS}&resultOffset=${offset}&resultRecordCount=1000&orderByFields=issued_date DESC&returnGeometry=false&f=json`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) throw new Error(JSON.stringify(json.error));
  return json.features ?? [];
}

const all = [];
for (let offset = 0; ; offset += 1000) {
  const got = await page(offset);
  all.push(...got);
  process.stdout.write(`\r  fetched ${all.length}`);
  if (got.length < 1000) break;
}
console.log();

const KIND = (d = "") => {
  const s = d.toUpperCase();
  if (/BACKWATER|BACK WATER|BACKFLOW/.test(s)) return "valve";
  if (/LATERAL/.test(s)) return "lateral";
  if (/CLEANOUT|CLEAN OUT/.test(s)) return "cleanout";
  return "sewer";
};

const rows = all
  .map((f) => f.attributes)
  .filter((a) => a.longitude && a.latitude && a.issued_date)
  .map((a) => ({
    at: [Number(Number(a.longitude).toFixed(5)), Number(Number(a.latitude).toFixed(5))],
    on: String(a.issued_date).slice(0, 10),
    kind: KIND(a.work_description),
    // Trimmed: the report shows one line, not a case file.
    what: String(a.work_description ?? "").replace(/\s+/g, " ").trim().slice(0, 120),
    by: (a.contact_business_name ?? "").trim() || null,
    parcel: (a.parcel_id ?? "").trim() || null,
    addr: (a.address ?? "").trim(),
  }))
  .sort((a, b) => b.on.localeCompare(a.on));

fs.writeFileSync("src/data/sewer-permits.json", JSON.stringify(rows));

const by = (k) => rows.filter((r) => r.kind === k).length;
const years = rows.map((r) => r.on.slice(0, 4));
console.log(`kept ${rows.length} permits with coordinates`);
console.log(`  lateral ${by("lateral")} · valve ${by("valve")} · cleanout ${by("cleanout")} · sewer ${by("sewer")}`);
console.log(`  ${Math.min(...years)} – ${Math.max(...years)}`);
console.log(`  ${(fs.statSync("src/data/sewer-permits.json").size / 1024) | 0} KB`);
