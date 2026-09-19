import type { LngLat, PropertySite } from "./types";

const BASE = "https://services2.arcgis.com/qvkbeam7Wirps6zC/ArcGIS/rest/services";
export const BUILDING_SOURCE = `${BASE}/Detroit_Building_Footprints_(Public_Safety)/FeatureServer/0`;
export const ROAD_SOURCE = `${BASE}/Detroit_Street_Centerline/FeatureServer/0`;

type Feature = { geometry: GeoJSON.Geometry; properties: Record<string, unknown> };

async function features(layer: string, at: LngLat, fields: string, where = "1=1"): Promise<Feature[]> {
  const query = new URLSearchParams({
    f: "geojson", geometry: at.join(","), geometryType: "esriGeometryPoint",
    inSR: "4326", outSR: "4326", distance: "65", units: "esriSRUnit_Meter",
    spatialRel: "esriSpatialRelIntersects", outFields: fields, returnGeometry: "true",
    resultRecordCount: "200", where,
  });
  const response = await fetch(`${layer}/query?${query}`, { signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error(`Site layer HTTP ${response.status}`);
  const data = await response.json();
  if (data.error || !Array.isArray(data.features) || data.exceededTransferLimit) throw new Error("Incomplete site layer");
  return data.features;
}

export async function propertySite(at: LngLat, streetPoint: LngLat | null, streetName: string): Promise<PropertySite> {
  const [buildings, roads] = await Promise.allSettled([
    features(BUILDING_SOURCE, at, "FID,parcelID,bldgType", "YEAR_DEMO IS NULL OR YEAR_DEMO = 0"),
    features(ROAD_SOURCE, at, "STREETNAME,STREETTYPE,STREETPREF,STREETSUFF"),
  ]);
  return {
    streetPoint, streetName,
    buildingsAvailable: buildings.status === "fulfilled",
    roadsAvailable: roads.status === "fulfilled",
    buildings: buildings.status === "fulfilled" ? buildings.value.flatMap(({ geometry, properties: p }) =>
      geometry?.type === "Polygon" || geometry?.type === "MultiPolygon"
        ? [{ id: String(p.FID), parcelId: typeof p.parcelID === "string" ? p.parcelID : null, kind: typeof p.bldgType === "string" ? p.bldgType : null, geometry }] : []) : [],
    roads: roads.status === "fulfilled" ? roads.value.flatMap(({ geometry, properties: p }) => {
      const parts = geometry?.type === "LineString" ? [geometry.coordinates] : geometry?.type === "MultiLineString" ? geometry.coordinates : [];
      return parts.length ? [{ name: [p.STREETPREF, p.STREETNAME, p.STREETTYPE, p.STREETSUFF].map(value => typeof value === "string" ? value.trim() : "").filter(Boolean).join(" "), parts: parts as LngLat[][] }] : [];
    }) : [],
    fetchedAt: new Date().toISOString(),
  };
}
