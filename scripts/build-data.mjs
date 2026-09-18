// Turns data/raw/*.geojson (from scripts/fetch_data.py) into compact JSON the app bundles.
// Usage: node scripts/build-data.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = (name) => JSON.parse(readFileSync(join(root, "data/raw", `${name}.geojson`), "utf8")).features;
const outDir = join(root, "src/data");
mkdirSync(outDir, { recursive: true });
const write = (name, value) => {
  const json = JSON.stringify(value);
  writeFileSync(join(outDir, `${name}.json`), json);
  console.log(`${name}.json  ${(json.length / 1024).toFixed(0)} KB`);
};

const r5 = (n) => Math.round(n * 1e5) / 1e5;
const ring = (coords) => coords.map(([x, y]) => [r5(x), r5(y)]);
const year = (ms) => (ms == null ? null : new Date(ms).getUTCFullYear());
const day = (ms) => (ms == null ? null : new Date(ms).toISOString().slice(0, 10));

// Lines can arrive as LineString or MultiLineString; keep a list of parts.
const lineParts = (g) => (g.type === "LineString" ? [ring(g.coordinates)] : g.coordinates.map(ring));
const polyRings = (g) => (g.type === "Polygon" ? [g.coordinates.map(ring)] : g.coordinates.map((p) => p.map(ring)));

write(
  "psrp-neighborhoods",
  raw("psrp_neighborhoods").map((f) => ({
    name: f.properties.nhood_name,
    district: f.properties.council_district,
    polygons: polyRings(f.geometry),
  })),
);

write(
  "sewer-mains",
  raw("sewer_gravity_mains_dev").map((f) => {
    const p = f.properties;
    const depths = [p.US_Depth, p.DS_Depth].filter((d) => typeof d === "number" && d > 0);
    return {
      id: p.FACILITYID,
      parts: lineParts(f.geometry),
      installYear: year(p.INSTALLDATE),
      material: p.MATERIAL,
      system: p.SYSTEMTYPE,
      depthFt: depths.length ? Math.round((depths.reduce((a, b) => a + b, 0) / depths.length) * 10) / 10 : null,
      sizeIn: p.LINEWIDTH ?? null,
      street: p.NearestStreet,
      name: p.TRUNKORDRAWNAME,
      lastWork: p.DESCRIPTION,
      lastWorkDate: day(p.ACTUALFINISHDATE),
    };
  }),
);

write(
  "sewer-projects",
  raw("sewer_capital_projects").map((f) => {
    const p = f.properties;
    return {
      name: p.ProjNamLOC ?? p.StreetCRRD ?? p.Description ?? "DWSD sewer project",
      street: p.StreetCRRD,
      description: p.Description,
      phase: p.ProjectPHA,
      startYear: p.EstCstBDAT,
      endYear: p.EstCstNDAT,
      neighborhood: p.Neighborhood,
      parts: lineParts(f.geometry),
    };
  }),
);

// 311 geometry is null for most records; the lat/lon attributes are populated.
// Types: w = water in basement, s = cave-in over the sewer, c = other cave-in / sinkhole.
const waterInBasement = raw("311_water_in_basement").map((f) => ["w", f.properties]);
const caveIns = raw("311_sewer_cave_ins").map((f) => [
  f.properties.request_type === "Cave-In over the Sewer" ? "s" : "c",
  f.properties,
]);
const since = Date.UTC(2023, 0, 1);
write(
  "reports-311",
  [...waterInBasement, ...caveIns]
    .filter(([, p]) => p.latitude && p.longitude && p.created_at >= since)
    .map(([type, p]) => [r5(p.longitude), r5(p.latitude), type, day(p.created_at)]),
);
