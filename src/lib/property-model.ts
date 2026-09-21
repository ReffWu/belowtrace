import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type { LngLat, Parcel, PropertySite, SewerMain } from "./types";

export type Point2 = [number, number];
export type ModelBuilding = {
  id: string;
  rings: Point2[][];
  onParcel: boolean;
  accessory: boolean;
};
export type PropertyModel = {
  lot: Point2[][][];
  buildings: ModelBuilding[];
  primary: ModelBuilding | null;
  roads: { name: string; parts: Point2[][] }[];
  main: { parts: Point2[][]; point: Point2; depthM: number | null; radiusM: number | null; installYear: number | null } | null;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  houseBounds: { minX: number; maxX: number; minZ: number; maxZ: number } | null;
  widthFt: number | null;
  depthFt: number | null;
  bearing: number | null;
  north: Point2;
  facing: string | null;
  streetName: string | null;
  frontZ: number;
};

export function boundsOf(points: Point2[]) {
  return { minX: Math.min(...points.map(p => p[0])), maxX: Math.max(...points.map(p => p[0])), minZ: Math.min(...points.map(p => p[1])), maxZ: Math.max(...points.map(p => p[1])) };
}

export function nearestOnLine(point: Point2, parts: Point2[][]): Point2 | null {
  let nearest: Point2 | null = null;
  let distance = Infinity;
  for (const part of parts) for (let i = 1; i < part.length; i++) {
    const a = part[i - 1], b = part[i];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)));
    const hit: Point2 = [a[0] + dx * t, a[1] + dz * t];
    const d = Math.hypot(hit[0] - point[0], hit[1] - point[1]);
    if (d < distance) { distance = d; nearest = hit; }
  }
  return nearest;
}

// All horizontal geometry is projected from geographic coordinates in meters.
// No floor-area-to-footprint conversion: a multi-storey home's floor area is not its footprint.
export function propertyModel(parcel: Parcel | null, site: PropertySite | undefined, main: SewerMain | null, origin: LngLat): PropertyModel | null {
  if (parcel?.match !== "exact" || !parcel.geometry) return null;
  const metersLng = 111320 * Math.cos(origin[1] * Math.PI / 180);
  const eastNorth = (p: number[]): Point2 => [(p[0] - origin[0]) * metersLng, (p[1] - origin[1]) * 111320];
  const roadMatch = site?.roads.filter(r => r.name.toLowerCase().includes(site.streetName.toLowerCase()) && site.streetName.trim());
  const roadPoint = roadMatch?.length ? nearestOnLine([0, 0], roadMatch.flatMap(r => r.parts.map(p => p.map(eastNorth)))) : null;
  const toward = roadPoint ?? (site?.streetPoint ? eastNorth(site.streetPoint) : null);
  const oriented = toward !== null && Math.hypot(...toward) > 2;
  const length = oriented ? Math.hypot(...toward!) : 1;
  const front: Point2 = oriented ? [toward![0] / length, toward![1] / length] : [0, 1];
  const project = (p: number[]): Point2 => {
    const [e, n] = eastNorth(p);
    return [e * front[1] - n * front[0], e * front[0] + n * front[1]];
  };
  const polygons = (g: GeoJSON.Polygon | GeoJSON.MultiPolygon) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates).map(p => p.map(r => r.map(project)));
  const lot = polygons(parcel.geometry);
  const lotBounds = boundsOf(lot.flatMap(p => p[0]));
  if (!Object.values(lotBounds).every(Number.isFinite)) return null;
  const buildings = (site?.buildings ?? []).flatMap(b => {
    // The parcel ID is authoritative; do not silently select the nearest neighboring house.
    const onParcel = b.parcelId?.trim() === parcel.id.trim();
    return polygons(b.geometry).map((rings, i) => ({ id: `${b.id}-${i}`, rings, onParcel, accessory: /accessory|garage/i.test(b.kind ?? "") }));
  });
  const area = (b: ModelBuilding) => Math.abs(b.rings[0].reduce((sum, p, i, ring) => {
    const q = ring[(i + 1) % ring.length]; return sum + p[0] * q[1] - q[0] * p[1];
  }, 0));
  const primary = buildings.filter(b => b.onParcel && !b.accessory).sort((a, b) => area(b) - area(a))[0] ?? null;
  const houseBounds = primary ? boundsOf(primary.rings[0]) : null;
  const roads = (site?.roads ?? []).map(r => ({ name: r.name.trim(), parts: r.parts.map(p => p.map(project)) }));
  const streetName = roadMatch?.[0]?.name.trim() ?? (oriented ? site?.streetName ?? null : null);
  const frontZ = oriented ? length : lotBounds.maxZ + 8;
  const projectedMainPoint = main ? project(main.nearestPoint) : null;
  const targetMinZ = projectedMainPoint ? Math.min(lotBounds.minZ - 10, projectedMainPoint[1] - 5) : lotBounds.minZ - 10;
  const targetMaxZ = projectedMainPoint ? Math.max(lotBounds.maxZ + 8, oriented ? frontZ + 6 : lotBounds.maxZ + 8, projectedMainPoint[1] + 5) : Math.max(lotBounds.maxZ + 8, oriented ? frontZ + 6 : lotBounds.maxZ + 8);
  const targetMinX = projectedMainPoint ? Math.min(lotBounds.minX - 10, projectedMainPoint[0] - 5) : lotBounds.minX - 10;
  const targetMaxX = projectedMainPoint ? Math.max(lotBounds.maxX + 10, projectedMainPoint[0] + 5) : lotBounds.maxX + 10;
  const bounds = { minX: targetMinX, maxX: targetMaxX, minZ: targetMinZ, maxZ: targetMaxZ };
  const bearing = oriented ? (Math.atan2(front[0], front[1]) * 180 / Math.PI + 360) % 360 : null;
  return {
    lot, buildings, primary, roads, houseBounds, bounds, frontZ,
    widthFt: houseBounds ? (houseBounds.maxX - houseBounds.minX) / 0.3048 : null,
    depthFt: houseBounds ? (houseBounds.maxZ - houseBounds.minZ) / 0.3048 : null,
    bearing, facing: bearing === null ? null : ["North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest"][Math.round(bearing / 45) % 8],
    north: [-front[0], front[1]], streetName,
    main: main ? {
      parts: main.parts.map(p => p.map(project)), point: projectedMainPoint!,
      depthM: main.depthFt && main.depthFt > 0 && Number.isFinite(main.depthFt) ? main.depthFt * 0.3048 : null,
      radiusM: main.sizeIn && main.sizeIn > 0 && Number.isFinite(main.sizeIn) ? main.sizeIn * 0.0254 / 2 : null,
      installYear: main.installYear,
    } : null,
  };
}

export function insideLot(point: Point2, lot: Point2[][][]): boolean {
  return lot.some(coordinates => booleanPointInPolygon(point, { type: "Polygon", coordinates }));
}

// Liang–Barsky clipping keeps road and pipe geometry inside the model's display bounds.
export function clipSegment(a: Point2, b: Point2, bounds: PropertyModel["bounds"]): [Point2, Point2] | null {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  let start = 0, end = 1;
  const p = [-dx, dx, -dz, dz];
  const q = [a[0] - bounds.minX, bounds.maxX - a[0], a[1] - bounds.minZ, bounds.maxZ - a[1]];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return null; }
    else if (p[i] < 0) start = Math.max(start, q[i] / p[i]);
    else end = Math.min(end, q[i] / p[i]);
  }
  return start <= end ? [[a[0] + start * dx, a[1] + start * dz], [a[0] + end * dx, a[1] + end * dz]] : null;
}
