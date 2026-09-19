// Turns data/raw/*.geojson (from scripts/fetch_data.py) into compact JSON the app bundles.
// Usage: node scripts/build-data.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { polygon as turfPolygon } from "@turf/helpers";

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

// City limits: outer ring plus the Hamtramck / Highland Park hole.
write("city-boundary", raw("city_boundary").flatMap((f) => polyRings(f.geometry)));

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

// ---- Citywide map (served statically from public/data) ----
const pub = join(root, "public/data");
mkdirSync(pub, { recursive: true });
const writePublic = (name, value) => {
  const json = JSON.stringify(value);
  writeFileSync(join(pub, `${name}.json`), json);
  console.log(`public/data/${name}.json  ${(json.length / 1024).toFixed(0)} KB`);
};

const psrpShapes = raw("psrp_neighborhoods").map((f) => ({
  name: f.properties.nhood_name,
  shapes: polyRings(f.geometry).map((rings) => turfPolygon(rings)),
}));
const inPsrp = (p) => psrpShapes.some((n) => n.shapes.some((s) => booleanPointInPolygon(p, s)));

// Water-in-basement reports since 2023: [lng, lat, inPsrp 0/1]
const wib = raw("311_water_in_basement")
  .map((f) => f.properties)
  .filter((p) => p.latitude && p.longitude && p.created_at >= since)
  .map((p) => {
    const pt = [r5(p.longitude), r5(p.latitude)];
    return { pt, inside: inPsrp(pt), hood: p.neighborhood ?? "Unknown", year: new Date(p.created_at).getUTCFullYear() };
  });
writePublic("wib-points", wib.map((w) => [...w.pt, w.inside ? 1 : 0]));

writePublic("psrp-areas", {
  type: "FeatureCollection",
  features: raw("psrp_neighborhoods").map((f) => ({
    type: "Feature",
    properties: { name: f.properties.nhood_name },
    geometry: { type: "MultiPolygon", coordinates: polyRings(f.geometry) },
  })),
});

writePublic("active-projects", {
  type: "FeatureCollection",
  features: raw("sewer_capital_projects")
    .filter((f) => f.properties.ProjectPHA !== "Closed")
    .map((f) => ({
      type: "Feature",
      properties: {
        name: f.properties.ProjNamLOC ?? f.properties.StreetCRRD ?? "DWSD sewer project",
        phase: f.properties.ProjectPHA,
        years: [f.properties.EstCstBDAT, f.properties.EstCstNDAT].filter(Boolean).join("–"),
      },
      geometry: { type: "MultiLineString", coordinates: lineParts(f.geometry) },
    })),
});

const byHood = new Map();
for (const w of wib) {
  const h = byHood.get(w.hood) ?? { name: w.hood, reports: 0, insidePsrp: 0 };
  h.reports++;
  h.insidePsrp += w.inside ? 1 : 0;
  byHood.set(w.hood, h);
}
const hoods = [...byHood.values()].map((h) => ({ ...h, psrp: h.insidePsrp / h.reports >= 0.5 })).sort((a, b) => b.reports - a.reports);
const byYear = {};
for (const w of wib) byYear[w.year] = (byYear[w.year] ?? 0) + 1;
const outside = wib.filter((w) => !w.inside).length;

// How fast DWSD closes water-in-basement calls, over the latest 12 months of data.
// "Closed" means DWSD finished the request, not necessarily that the home's problem is fixed.
const wibAll = raw("311_water_in_basement").map((f) => f.properties);
const latest = Math.max(...wibAll.map((p) => p.created_at));
const hours = wibAll
  .filter((p) => p.created_at >= latest - 365 * 86_400_000 && p.num_hours_to_close != null)
  .map((p) => p.num_hours_to_close)
  .sort((a, b) => a - b);
const response = {
  from: day(latest - 365 * 86_400_000),
  to: day(latest),
  calls: hours.length,
  medianHours: hours[Math.floor(hours.length / 2)],
  within48Pct: Math.round((hours.filter((h) => h <= 48).length / hours.length) * 100),
};
write("citywide-stats", {
  since: "2023-01-01",
  snapshot: new Date().toISOString().slice(0, 10),
  total: wib.length,
  outsidePsrp: outside,
  byYear,
  response,
  topOutside: hoods.filter((h) => !h.psrp).slice(0, 8),
  topInside: hoods.filter((h) => h.psrp).slice(0, 8),
  activeProjects: raw("sewer_capital_projects").filter((f) => f.properties.ProjectPHA !== "Closed").length,
});
