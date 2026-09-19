import { describe, expect, it } from "vitest";
import golden from "@/data/golden.json";
import { ownershipDiagramData } from "./ownership-diagram";
import type { Report } from "./types";

const reports = golden as unknown as Record<string, Report>;
const { parcel, nearestMain: main } = reports["16776 prevost st"];

describe("ownership diagram evidence", () => {
  it.each(["front", "rear", "side"] as const)("preserves the inferred %s position without claiming a connection", (side) => {
    const data = ownershipDiagramData(parcel, main, side);
    expect(data.position).toBe(side);
    expect(data.notice).toContain("may not serve this home");
  });

  it("uses the actual recorded values from the report", () => {
    expect(ownershipDiagramData(parcel, main, "rear")).toMatchObject({
      lotDepth: 148, yearBuilt: 1940, installYear: 1928,
      mainDepth: 10.2, mainSize: 12, material: "concrete",
    });
  });

  it("keeps a recorded main beyond the old arbitrary 45 m cutoff", () => {
    expect(ownershipDiagramData(parcel, { ...main!, distanceM: 70 }, "front")).toMatchObject({
      hasMain: true, position: "front", installYear: 1928,
    });
  });

  it.each([null, undefined])("does not replace unknown orientation %s with an alley", (side) => {
    expect(ownershipDiagramData(parcel, main, side)).toMatchObject({
      hasMain: true, position: "unknown", positionLabel: "Location unconfirmed",
    });
  });

  it("does not take dimensions or direction from a neighboring parcel", () => {
    expect(ownershipDiagramData({ ...parcel!, match: "nearest" }, main, "rear")).toMatchObject({
      lotDepth: null, yearBuilt: null, position: "unknown", mainDepth: 10.2,
    });
  });

  it("keeps the no-record examples unknown rather than inventing a rear sewer", () => {
    for (const address of ["16821 fenmore st", "14600 archdale st", "5919 oldtown st"]) {
      const r = reports[address];
      expect(ownershipDiagramData(r.parcel, r.nearestMain, r.mainSide)).toMatchObject({
        hasMain: false, position: "unknown", mainDepth: null, mainSize: null,
      });
    }
    expect(ownershipDiagramData(null, null, "rear").notice).toContain("does not mean there is no sewer");
  });

  it.each([0, -1, NaN, Infinity, null])("does not invent dimensions when a value is %s", (value) => {
    expect(ownershipDiagramData({ ...parcel!, depthFt: value ?? undefined }, {
      ...main!, depthFt: value, sizeIn: value,
    }, "rear")).toMatchObject({ lotDepth: null, mainDepth: null, mainSize: null });
  });

  it("retains valid unusually shallow, deep, small and large records", () => {
    expect(ownershipDiagramData({ ...parcel!, depthFt: 420 }, {
      ...main!, depthFt: 32, sizeIn: 120,
    }, "rear")).toMatchObject({ lotDepth: 420, mainDepth: 32, mainSize: 120 });
    expect(ownershipDiagramData({ ...parcel!, depthFt: 38 }, {
      ...main!, depthFt: 2, sizeIn: 6,
    }, "front")).toMatchObject({ lotDepth: 38, mainDepth: 2, mainSize: 6 });
  });
});
