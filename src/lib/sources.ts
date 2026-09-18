// Live public data sources. Every call has a timeout; callers treat failures as "unknown", never as "no".
import type { LngLat, Parcel } from "./types";
import { SOURCES } from "./facts";
import { distanceM } from "./geo";

const ARCGIS_GEOCODER = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";
const CENSUS_GEOCODER = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";
const PARCELS = "https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/Parcels_Current/FeatureServer/0/query";
const FEMA_ZONES = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query";
const HUD_LMI = "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/LOW_MOD_INCOME_BY_BG/FeatureServer/0/query";

// Detroit city limits bounding box (generous) and a point used to bias suggestions.
export const DETROIT_EXTENT = "-83.2877,42.2551,-82.9105,42.4502";
const DETROIT_CENTER = "-83.1,42.37";

async function getJson<T>(url: string, params: Record<string, string>, timeoutMs = 8000): Promise<T> {
  const res = await fetch(`${url}?${new URLSearchParams(params)}`, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "User-Agent": "BelowTrace/1.0 (civic tool; https://github.com/belowtrace)" },
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const data = await res.json();
  if (data?.error) throw new Error(`${url} -> ${JSON.stringify(data.error).slice(0, 200)}`);
  return data as T;
}

export type Suggestion = { text: string; magicKey: string };

export async function suggestAddresses(text: string): Promise<Suggestion[]> {
  const data = await getJson<{ suggestions: Suggestion[] }>(
    `${ARCGIS_GEOCODER}/suggest`,
    { text, location: DETROIT_CENTER, searchExtent: DETROIT_EXTENT, category: "Address", countryCode: "USA", maxSuggestions: "6", f: "json" },
    4000,
  );
  // Only full street addresses: a bare street name ("Kelly Rd, Detroit") can't identify a property.
  return data.suggestions.filter((s) => /^\d/.test(s.text)).map(({ text, magicKey }) => ({ text, magicKey }));
}

export type Geocoded = {
  label: string;
  lngLat: LngLat;
  number: string;
  preDir: string;
  street: string;
  city: string;
  zip: string;
  source: "arcgis" | "census";
};

type ArcgisCandidate = {
  score: number;
  location: { x: number; y: number };
  attributes: Record<string, string>;
};

async function findCandidate(singleLine: string, magicKey?: string): Promise<Geocoded | null> {
  const data = await getJson<{ candidates: ArcgisCandidate[] }>(`${ARCGIS_GEOCODER}/findAddressCandidates`, {
    SingleLine: singleLine,
    ...(magicKey ? { magicKey } : {}),
    // No search extent: an address just outside the city should say "outside Detroit", not "not found".
    location: DETROIT_CENTER,
    maxLocations: "1",
    outFields: "Match_addr,Addr_type,AddNum,StPreDir,StName,City,Postal",
    f: "json",
  });
  const c = data.candidates.find((c) => c.score >= 85 && /PointAddress|StreetAddress|StreetAddressExt|Subaddress/.test(c.attributes.Addr_type));
  if (!c) return null;
  const a = c.attributes;
  return {
    label: a.Match_addr.replace(/, Michigan, /, ", MI "),
    lngLat: [c.location.x, c.location.y],
    number: a.AddNum,
    preDir: a.StPreDir,
    street: a.StName,
    city: a.City,
    zip: a.Postal,
    source: "arcgis",
  };
}

export async function geocode(address: string, magicKey?: string): Promise<Geocoded | null> {
  const namesPlace = /,|\bMI\b|michigan|\b\d{5}\b/i.test(address);
  try {
    return (
      (await findCandidate(namesPlace ? address : `${address}, Detroit, MI`, magicKey)) ??
      // Not a Detroit address? Find where it is so we can say so instead of "not found".
      (namesPlace ? null : await findCandidate(`${address}, MI`))
    );
  } catch {
    return geocodeCensus(address);
  }
}

async function geocodeCensus(address: string): Promise<Geocoded | null> {
  type Match = {
    matchedAddress: string;
    coordinates: { x: number; y: number };
    addressComponents: Record<string, string>;
  };
  const data = await getJson<{ result: { addressMatches: Match[] } }>(CENSUS_GEOCODER, {
    address: /detroit/i.test(address) ? address : `${address}, Detroit, MI`,
    benchmark: "Public_AR_Current",
    format: "json",
  });
  const m = data.result.addressMatches[0];
  if (!m) return null;
  const c = m.addressComponents;
  return {
    label: m.matchedAddress,
    lngLat: [m.coordinates.x, m.coordinates.y],
    number: m.matchedAddress.split(" ")[0],
    preDir: c.preDirection ?? "",
    street: c.streetName ?? "",
    city: c.city ?? "",
    zip: c.zip ?? "",
    source: "census",
  };
}

type ParcelFeature = {
  properties: Record<string, string | number | null>;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
};

const PARCEL_FIELDS = [
  "parcel_number", "address", "zip_code", "property_class_desc", "use_code_desc",
  "tax_status_description", "homestead_pre", "year_built", "style", "total_floor_area",
].join(",");

function toParcel(f: ParcelFeature, match: Parcel["match"]): Parcel {
  const p = f.properties;
  const num = (v: unknown) => (typeof v === "number" && v > 0 ? v : undefined);
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  return {
    id: String(p.parcel_number),
    address: String(p.address ?? ""),
    zip: str(p.zip_code),
    propertyClass: str(p.property_class_desc),
    useCode: str(p.use_code_desc),
    taxStatus: str(p.tax_status_description),
    homesteadPct: typeof p.homestead_pre === "number" ? p.homestead_pre : undefined,
    yearBuilt: num(p.year_built),
    style: str(p.style),
    floorArea: num(p.total_floor_area),
    match,
    geometry: f.geometry ?? undefined,
    evidence: { level: "recorded", source: SOURCES.parcels.label, url: SOURCES.parcels.url, asOf: new Date().toISOString().slice(0, 10) },
  };
}

// Vertex average of the outer ring (closing vertex excluded) — fine for small, convex-ish lots.
export function centroid(g: GeoJSON.Polygon | GeoJSON.MultiPolygon | null): LngLat | null {
  const ring = g ? (g.type === "Polygon" ? g.coordinates[0] : g.coordinates[0][0]) : null;
  if (!ring || ring.length < 2) return null;
  const pts = ring.slice(0, -1);
  const [sx, sy] = pts.reduce(([x, y], [a, b]) => [x + a, y + b], [0, 0]);
  return [sx / pts.length, sy / pts.length];
}

export async function findParcel(g: Geocoded): Promise<Parcel | null> {
  const street = [g.preDir, g.street].filter(Boolean).join(" ").toUpperCase().replace(/'/g, "''");
  const base = { outFields: PARCEL_FIELDS, returnGeometry: "true", outSR: "4326", f: "geojson" };
  const number = g.number.replace(/\D/g, "");
  if (number && street) {
    // Parcel addresses appear both with and without the street type ("1 WOODWARD AVE", "15888 STANSBURY").
    const exact = await getJson<{ features: ParcelFeature[] }>(PARCELS, {
      ...base,
      where: `address = '${number} ${street}' OR address LIKE '${number} ${street} %'`,
    });
    if (exact.features.length) return toParcel(exact.features[0], "exact");
  }
  const near = await getJson<{ features: ParcelFeature[] }>(PARCELS, {
    ...base,
    geometry: g.lngLat.join(","),
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: "40",
    units: "esriSRUnit_Meter",
  });
  const best = near.features
    .map((f) => ({ f, c: centroid(f.geometry) }))
    .filter((x): x is { f: ParcelFeature; c: LngLat } => x.c !== null)
    .sort((a, b) => distanceM(a.c, g.lngLat) - distanceM(b.c, g.lngLat))[0];
  if (!best) return null;
  // Same house number on the closest parcel (street spelled differently, e.g. "Edsel" vs "Edsel Ford"): it's this property.
  const sameNumber = number !== "" && String(best.f.properties.address ?? "").startsWith(`${number} `);
  return toParcel(best.f, sameNumber ? "exact" : "nearest");
}

export async function floodZone(p: LngLat) {
  const data = await getJson<{ features: { attributes: { FLD_ZONE: string; SFHA_TF: string } }[] }>(FEMA_ZONES, {
    geometry: p.join(","),
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "FLD_ZONE,SFHA_TF",
    returnGeometry: "false",
    f: "json",
  }, 5000);
  const hits = data.features.map((f) => f.attributes);
  if (!hits.length) return { zone: null, isSFHA: false };
  const sfha = hits.find((h) => h.SFHA_TF === "T");
  return { zone: (sfha ?? hits[0]).FLD_ZONE, isSFHA: Boolean(sfha) };
}

export async function lowModIncome(p: LngLat) {
  const data = await getJson<{ features: { attributes: { GEOID: string; Lowmod_pct: number | string; geoname: string } }[] }>(HUD_LMI, {
    geometry: p.join(","),
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "GEOID,Lowmod_pct,geoname",
    returnGeometry: "false",
    f: "json",
  }, 5000);
  const a = data.features[0]?.attributes;
  if (!a) return null;
  return { blockGroup: a.geoname, lowModPct: Number(a.Lowmod_pct) };
}
