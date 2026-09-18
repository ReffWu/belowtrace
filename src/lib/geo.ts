// Spatial lookups against the bundled open-data snapshots in src/data (built by scripts/build-data.mjs).
import Flatbush from "flatbush";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { polygon as turfPolygon } from "@turf/helpers";
import neighborhoodsData from "@/data/psrp-neighborhoods.json";
import cityBoundaryData from "@/data/city-boundary.json";
import mainsData from "@/data/sewer-mains.json";
import projectsData from "@/data/sewer-projects.json";
import reportsData from "@/data/reports-311.json";
import { MATERIALS, SYSTEMS } from "./facts";
import type { LngLat, Report311, SewerMain, SewerProject } from "./types";

type RawNeighborhood = { name: string; district: number; polygons: number[][][][] };
type RawMain = {
  id: string;
  parts: number[][][];
  installYear: number | null;
  material: string | null;
  system: string | null;
  depthFt: number | null;
  sizeIn: number | null;
  street: string | null;
  lastWork: string | null;
  lastWorkDate: string | null;
};
type RawProject = {
  name: string;
  description: string;
  phase: string;
  startYear: number | null;
  endYear: number | null;
  parts: number[][][];
};
type RawReport = [number, number, "w" | "s" | "c", string];

const neighborhoods = (neighborhoodsData as RawNeighborhood[]).map((n) => ({
  ...n,
  shapes: n.polygons.map((rings) => turfPolygon(rings)),
}));
const cityLimits = (cityBoundaryData as number[][][][]).map((rings) => turfPolygon(rings));
const mains = mainsData as RawMain[];
const projects = projectsData as RawProject[];
const reports = reportsData as RawReport[];

// Local equirectangular projection around Detroit: good to well under 1% at city scale.
const M_PER_DEG_LAT = 111_320;
const M_PER_DEG_LNG = 111_320 * Math.cos((42.35 * Math.PI) / 180);
const toXY = ([lng, lat]: number[]) => [lng * M_PER_DEG_LNG, lat * M_PER_DEG_LAT];

function pointToSegmentM(p: number[], a: number[], b: number[]) {
  const [px, py] = toXY(p);
  const [ax, ay] = toXY(a);
  const [bx, by] = toXY(b);
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function pointToPartsM(p: LngLat, parts: number[][][]) {
  let best = Infinity;
  for (const part of parts) {
    for (let i = 1; i < part.length; i++) best = Math.min(best, pointToSegmentM(p, part[i - 1], part[i]));
    if (part.length === 1) best = Math.min(best, pointToSegmentM(p, part[0], part[0]));
  }
  return best;
}

export function distanceM(a: number[], b: number[]) {
  const [ax, ay] = toXY(a);
  const [bx, by] = toXY(b);
  return Math.hypot(ax - bx, ay - by);
}

function lineIndex(items: { parts: number[][][] }[]) {
  const index = new Flatbush(Math.max(items.length, 1));
  for (const item of items) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const part of item.parts)
      for (const [x, y] of part) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    index.add(minX, minY, maxX, maxY);
  }
  index.finish();
  return index;
}

const mainIndex = lineIndex(mains);
const projectIndex = lineIndex(projects);
const reportIndex = (() => {
  const index = new Flatbush(Math.max(reports.length, 1));
  for (const [x, y] of reports) index.add(x, y, x, y);
  index.finish();
  return index;
})();

// Bounding box (in degrees) that contains a circle of radiusM around p.
function around([lng, lat]: LngLat, radiusM: number) {
  const dx = radiusM / M_PER_DEG_LNG;
  const dy = radiusM / M_PER_DEG_LAT;
  return [lng - dx, lat - dy, lng + dx, lat + dy] as const;
}

const round = (parts: number[][][]) => parts as LngLat[][];

// Official City of Detroit boundary. Postal city names don't follow it: parts of Detroit
// have Hamtramck, Highland Park or Harper Woods mailing addresses.
export function inDetroit(p: LngLat) {
  return cityLimits.some((s) => booleanPointInPolygon(p, s));
}

export function findPsrpNeighborhood(p: LngLat) {
  const hit = neighborhoods.find((n) => n.shapes.some((s) => booleanPointInPolygon(p, s)));
  return hit ? { name: hit.name, district: hit.district } : null;
}

export function mainsNear(p: LngLat, radiusM: number): SewerMain[] {
  return mainIndex
    .search(...around(p, radiusM))
    .map((i) => ({ m: mains[i], d: pointToPartsM(p, mains[i].parts) }))
    .filter(({ d }) => d <= radiusM)
    .sort((a, b) => a.d - b.d)
    .map(({ m, d }) => ({
      id: m.id,
      distanceM: Math.round(d),
      installYear: m.installYear,
      material: m.material,
      materialLabel: m.material ? (MATERIALS[m.material] ?? null) : null,
      system: m.system,
      systemLabel: m.system ? (SYSTEMS[m.system] ?? null) : null,
      depthFt: m.depthFt,
      sizeIn: m.sizeIn,
      street: m.street,
      lastWork: m.lastWork,
      lastWorkDate: m.lastWorkDate,
      parts: round(m.parts),
    }));
}

const PHASE_ORDER: Record<string, number> = { Construction: 0, Procurement: 1, Closed: 2 };

export function projectsNear(p: LngLat, radiusM: number): SewerProject[] {
  return projectIndex
    .search(...around(p, radiusM))
    .map((i) => ({ pr: projects[i], d: pointToPartsM(p, projects[i].parts) }))
    .filter(({ d }) => d <= radiusM)
    .sort((a, b) => (PHASE_ORDER[a.pr.phase] ?? 3) - (PHASE_ORDER[b.pr.phase] ?? 3) || a.d - b.d)
    .map(({ pr, d }) => ({
      name: pr.name,
      description: pr.description,
      phase: pr.phase,
      startYear: pr.startYear,
      endYear: pr.endYear,
      distanceM: Math.round(d),
      isAlley: /\balley\b/i.test(pr.name),
      parts: round(pr.parts),
    }));
}

export function reportsNear(p: LngLat, radiusM: number): Report311[] {
  return reportIndex
    .search(...around(p, radiusM))
    .map((i) => reports[i])
    .filter(([x, y]) => distanceM(p, [x, y]) <= radiusM)
    .map(([x, y, type, date]) => ({ lngLat: [x, y] as LngLat, type, date }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const DATA_SNAPSHOT = "2026-09-18";
