// Calibrate the ASRP likelihood model against the alleys DWSD has already chosen.
//
// DWSD publishes its selection criteria but not its list. This measures each observable
// criterion on the 138 alleys already under contract, and writes the distribution so the app
// can say where an address sits relative to them — rather than inventing a probability.
import fs from "node:fs";

const proj = JSON.parse(fs.readFileSync("src/data/sewer-projects.json", "utf8"));
const rep = JSON.parse(fs.readFileSync("src/data/reports-311.json", "utf8"));
const districts = JSON.parse(fs.readFileSync("src/data/council-districts.json", "utf8"));

const M_LAT = 110540;
const mPerLng = (lat) => 111320 * Math.cos((lat * Math.PI) / 180);

const isAlley = (p) => /alley/i.test(`${p.street ?? ""} ${p.name ?? ""}`);
const midpoint = (p) => {
  const pts = p.parts.flat();
  if (!pts.length) return null;
  return [pts.reduce((s, q) => s + q[0], 0) / pts.length, pts.reduce((s, q) => s + q[1], 0) / pts.length];
};

const alleys = proj.filter(isAlley);
const picked = alleys.filter((p) => p.phase === "Construction" || p.phase === "Procurement");
const older = alleys.filter((p) => p.phase === "Closed");

// --- spatial index over 311 ---
const CELL = 0.004;
const grid = new Map();
for (const [lng, lat, type] of rep) {
  const k = `${Math.floor(lng / CELL)},${Math.floor(lat / CELL)}`;
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push([lng, lat, type]);
}
function countWithin(pt, radiusM, types) {
  const mx = mPerLng(pt[1]);
  const span = Math.ceil(radiusM / (CELL * Math.min(mx, M_LAT))) + 1;
  const cx = Math.floor(pt[0] / CELL);
  const cy = Math.floor(pt[1] / CELL);
  let n = 0;
  for (let i = -span; i <= span; i++)
    for (let j = -span; j <= span; j++)
      for (const [lng, lat, t] of grid.get(`${cx + i},${cy + j}`) ?? [])
        if (types.includes(t) && Math.hypot((lng - pt[0]) * mx, (lat - pt[1]) * M_LAT) <= radiusM) n++;
  return n;
}

// --- point in polygon ---
function inRings(pt, rings) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}
const districtOf = (pt) => districts.find((d) => inRings(pt, d.rings))?.n ?? null;

const R = 500;
const measure = (p) => {
  const m = midpoint(p);
  if (!m) return null;
  return { caveIns: countWithin(m, R, ["s", "c"]), water: countWithin(m, R, ["w"]), district: districtOf(m) };
};

const pickedStats = picked.map(measure).filter(Boolean);
const olderStats = older.map(measure).filter(Boolean);

const pct = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
const median = (a) => pct(a, 50);

const pickedCave = pickedStats.map((s) => s.caveIns);
const pickedWater = pickedStats.map((s) => s.water);
const olderWater = olderStats.map((s) => s.water);

const districtCounts = {};
for (const s of pickedStats) if (s.district) districtCounts[s.district] = (districtCounts[s.district] ?? 0) + 1;

const calibration = {
  generatedAt: new Date().toISOString().slice(0, 10),
  radiusM: R,
  selected: { n: pickedStats.length, construction: picked.filter((p) => p.phase === "Construction").length, procurement: picked.filter((p) => p.phase === "Procurement").length },
  comparison: { n: olderStats.length, waterMedian: median(olderWater) },
  caveIns: { p25: pct(pickedCave, 25), median: median(pickedCave), p75: pct(pickedCave, 75) },
  water: { median: median(pickedWater) },
  districtCounts,
};

fs.writeFileSync("src/data/asrp-calibration.json", JSON.stringify(calibration, null, 2));
console.log(JSON.stringify(calibration, null, 2));
console.log(`\n已选后巷进水中位数 ${median(pickedWater)}  vs  旧工程 ${median(olderWater)}  =  ${(median(olderWater) / median(pickedWater)).toFixed(1)}×`);
