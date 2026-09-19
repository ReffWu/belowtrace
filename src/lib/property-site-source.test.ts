import { afterEach, describe, expect, it, vi } from "vitest";
import { propertySite } from "./property-site-source";

const at: [number, number] = [-83.203, 42.414];
const road = { geometry: { type: "LineString", coordinates: [at, [-83.203, 42.415]] }, properties: { STREETNAME: "Prevost", STREETTYPE: "St" } };
afterEach(() => vi.unstubAllGlobals());

describe("property site source resilience", () => {
  it("keeps the road data when the building service fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("Footprints")) throw new Error("offline");
      return Response.json({ features: [road] });
    }));
    const site = await propertySite(at, null, "Prevost");
    expect(site.buildingsAvailable).toBe(false);
    expect(site.buildings).toEqual([]);
    expect(site.roadsAvailable).toBe(true);
    expect(site.roads[0].name).toBe("Prevost St");
  });

  it("rejects truncated/error responses instead of presenting partial coverage as complete", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => Response.json(url.includes("Footprints") ? { features: [], exceededTransferLimit: true } : { error: { message: "Unavailable" } })));
    const site = await propertySite(at, null, "Prevost");
    expect(site.buildingsAvailable).toBe(false);
    expect(site.roadsAvailable).toBe(false);
  });

  it("retains multipart footprints and road names without adding entrance coordinates", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => Response.json({ features: url.includes("Footprints") ? [{ properties: { FID: 1, parcelID: "123", bldgType: "Residential" }, geometry: { type: "MultiPolygon", coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]] } }] : [road] })));
    const site = await propertySite(at, at, "Prevost");
    expect(site.buildings[0].geometry.type).toBe("MultiPolygon");
    expect(site.buildings[0].parcelId).toBe("123");
    expect(site).not.toHaveProperty("entrance");
  });
});
