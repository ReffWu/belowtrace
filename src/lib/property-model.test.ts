import { describe, expect, it } from "vitest";
import golden from "@/data/golden.json";
import fixture from "./__fixtures__/property-site.json";
import { clipSegment, insideLot, nearestOnLine, propertyModel } from "./property-model";
import type { LngLat, PropertySite, Report } from "./types";

const { parcel, nearestMain } = (golden as unknown as Record<string, Report>)["16776 prevost st"];
const site = fixture.site as PropertySite;
const origin = fixture.origin as LngLat;

describe("geographically grounded property model", () => {
  it.each([[0, "North"], [90, "East"], [180, "South"], [270, "West"], [45, "Northeast"]] as const)("preserves dimensions for a home facing %s degrees", (degrees, facing) => {
    const angle = degrees * Math.PI / 180;
    const geo = (x: number, z: number): LngLat => {
      const e = x * Math.cos(angle) + z * Math.sin(angle);
      const n = -x * Math.sin(angle) + z * Math.cos(angle);
      return [origin[0] + e / (111320 * Math.cos(origin[1] * Math.PI / 180)), origin[1] + n / 111320];
    };
    const footprint: GeoJSON.Polygon = { type: "Polygon", coordinates: [[geo(-4, -5), geo(4, -5), geo(4, 5), geo(-4, 5), geo(-4, -5)]] };
    const synthetic: PropertySite = { ...site, streetName: "Example", roads: [{ name: "Example St", parts: [[geo(-40, 30), geo(40, 30)]] }], buildings: [{ id: "test", parcelId: parcel!.id, kind: "Residential", geometry: footprint }] };
    const model = propertyModel(parcel, synthetic, null, origin)!;
    expect(model.facing).toBe(facing);
    expect(model.widthFt).toBeCloseTo(8 / 0.3048, 3);
    expect(model.depthFt).toBeCloseTo(10 / 0.3048, 3);
  });

  it("matches the actual home instead of the nearest accessory building or neighbor", () => {
    const model = propertyModel(parcel, site, nearestMain, origin)!;
    expect(model.primary?.id).toBe("186188-0");
    expect(model.primary?.accessory).toBe(false);
    expect(model.buildings.some(b => b.onParcel && b.accessory)).toBe(true);
    expect(model.widthFt).toBeCloseTo(29.5, 0);
    expect(model.depthFt).toBeCloseTo(53.7, 0);
    expect(model.facing).toBe("West");
    expect(model.bearing).toBeCloseTo(268.2, 0);
    expect(model.streetName).toBe("Prevost St");
  });

  it("does not fabricate a house, dimensions, or a front door when building data is missing", () => {
    const model = propertyModel(parcel, { ...site, buildings: [], buildingsAvailable: false }, nearestMain, origin)!;
    expect(model.primary).toBeNull();
    expect(model.widthFt).toBeNull();
    expect(model.depthFt).toBeNull();
    expect(model.roads.length).toBeGreaterThan(0);
  });

  it("never turns a neighboring parcel into this property's model", () => {
    expect(propertyModel({ ...parcel!, match: "nearest" }, site, nearestMain, origin)).toBeNull();
    expect(propertyModel(null, site, nearestMain, origin)).toBeNull();
    const model = propertyModel(parcel, { ...site, buildings: site.buildings.filter(b => b.parcelId !== parcel!.id) }, nearestMain, origin)!;
    expect(model.primary).toBeNull();
  });

  it("keeps geographic north but does not invent a street-facing direction without street evidence", () => {
    const model = propertyModel(parcel, undefined, null, origin)!;
    expect(model.bearing).toBeNull();
    expect(model.facing).toBeNull();
    expect(model.north[0]).toBeCloseTo(0);
    expect(model.north[1]).toBe(1);
    expect(model.roads).toEqual([]);
    expect(model.main).toBeNull();
  });

  it("can orient a saved report from a matching mapped road without a geocoder street point", () => {
    expect(propertyModel(parcel, { ...site, streetPoint: null }, nearestMain, origin)?.facing).toBe("West");
  });

  it("does not substitute floor area for a missing footprint", () => {
    const model = propertyModel({ ...parcel!, floorArea: 99999 }, { ...site, buildings: [] }, nearestMain, origin)!;
    expect(model.widthFt).toBeNull();
    expect(model.depthFt).toBeNull();
  });

  it("preserves mapped main geometry and recorded depth, but keeps absent depth unknown", () => {
    const model = propertyModel(parcel, site, nearestMain, origin)!;
    expect(model.main?.depthM).toBeCloseTo(10.2 * 0.3048);
    expect(model.main?.radiusM).toBeCloseTo(12 * 0.0254 / 2);
    expect(model.main?.parts[0]).toHaveLength(nearestMain!.parts[0].length);
    const missing = propertyModel(parcel, site, { ...nearestMain!, depthFt: null, sizeIn: null }, origin)!;
    expect(missing.main?.depthM).toBeNull();
    expect(missing.main?.radiusM).toBeNull();
  });

  it("clips long road/pipe segments rather than moving their recorded position", () => {
    const bounds = { minX: -5, maxX: 5, minZ: -5, maxZ: 5 };
    expect(clipSegment([-100, 2], [100, 2], bounds)).toEqual([[-5, 2], [5, 2]]);
    expect(clipSegment([-100, 8], [100, 8], bounds)).toBeNull();
    expect(clipSegment([0, 0], [0, 0], bounds)).toEqual([[0, 0], [0, 0]]);
  });

  it("finds the perpendicular street point and rejects paving outside a parcel", () => {
    expect(nearestOnLine([0, 0], [[[-10, 6], [10, 6]]])).toEqual([0, 6]);
    expect(nearestOnLine([0, 0], [])).toBeNull();
    const model = propertyModel(parcel, site, nearestMain, origin)!;
    expect(insideLot([0, 0], model.lot)).toBe(true);
    expect(insideLot([1000, 1000], model.lot)).toBe(false);
  });
});
