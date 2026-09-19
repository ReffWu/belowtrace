import { type NextRequest, NextResponse } from "next/server";

const PARCELS = "https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/Parcels_Current/FeatureServer/0/query";
const ARCGIS_GEOCODER = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode";

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: "Missing lat/lng parameters" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    // 1. First attempt: Query City of Detroit official Parcels dataset
    const parcelUrl = new URL(PARCELS);
    parcelUrl.searchParams.set("geometry", `${lng},${lat}`);
    parcelUrl.searchParams.set("geometryType", "esriGeometryPoint");
    parcelUrl.searchParams.set("inSR", "4326");
    parcelUrl.searchParams.set("spatialRel", "esriSpatialRelIntersects");
    parcelUrl.searchParams.set("distance", "60");
    parcelUrl.searchParams.set("units", "esriSRUnit_Meter");
    parcelUrl.searchParams.set("outFields", "address,parcel_number,zip_code");
    parcelUrl.searchParams.set("returnGeometry", "false");
    parcelUrl.searchParams.set("f", "json");

    const parcelRes = await fetch(parcelUrl.toString(), {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "BelowTrace/1.0 (civic tool; https://belowtrace.com)" },
    });

    if (parcelRes.ok) {
      const parcelData = await parcelRes.json();
      if (parcelData.features && parcelData.features.length > 0) {
        const p = parcelData.features[0].attributes;
        const rawAddress = String(p.address || "").trim();
        if (rawAddress && /^\d/.test(rawAddress)) {
          const formatted = toTitleCase(rawAddress);
          return NextResponse.json({
            ok: true,
            inDetroit: true,
            address: formatted,
            zip: p.zip_code ? String(p.zip_code) : null,
            source: "detroit_parcels",
          });
        }
      }
    }

    // 2. Second attempt: Reverse geocode via ArcGIS World Geocoder
    const reverseUrl = new URL(ARCGIS_GEOCODER);
    reverseUrl.searchParams.set("location", `${lng},${lat}`);
    reverseUrl.searchParams.set("f", "json");

    const reverseRes = await fetch(reverseUrl.toString(), {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "BelowTrace/1.0" },
    });

    if (reverseRes.ok) {
      const revData = await reverseRes.json();
      if (revData.address) {
        const city = String(revData.address.City || "").trim();
        const address = String(revData.address.Address || "").trim();
        const isDetroit = /^detroit$/i.test(city);

        return NextResponse.json({
          ok: true,
          inDetroit: isDetroit,
          city: city || "Unknown",
          address: address || `${city}, MI`,
          source: "arcgis_reverse",
        });
      }
    }

    return NextResponse.json({
      ok: false,
      error: "Unable to match a Detroit street address at these coordinates",
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Geocoding error",
    }, { status: 500 });
  }
}
