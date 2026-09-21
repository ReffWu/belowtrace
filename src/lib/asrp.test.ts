import { describe, expect, it } from "vitest";
import { CALIBRATION, assessAsrp, type AsrpInputs } from "./asrp";

const base: AsrpInputs = { district: 6, caveIns500: 30, water500: 20, nearestWorkM: null, lowModPct: 0.72 };

describe("calibration is measured, not invented", () => {
  it("is built from the alleys DWSD actually chose", () => {
    expect(CALIBRATION.selected.n).toBe(CALIBRATION.selected.construction + CALIBRATION.selected.procurement);
    expect(CALIBRATION.selected.n).toBeGreaterThan(100);
  });

  it("records that four districts got nothing in the first round", () => {
    const counts = CALIBRATION.districtCounts as Record<string, number>;
    for (const empty of ["2", "3", "4", "5"]) expect(counts[empty] ?? 0).toBe(0);
    expect(counts["6"]).toBeGreaterThan(0);
  });

  it("keeps the comparison group it was tested against", () => {
    expect(CALIBRATION.comparison.n).toBeGreaterThan(0);
    expect(CALIBRATION.comparison.waterMedian).toBeGreaterThan(CALIBRATION.water.median);
  });
});

describe("what the reading says", () => {
  it("tells someone with contracted work next door not to pay yet", () => {
    const a = assessAsrp({ ...base, nearestWorkM: 180 });
    expect(a.verdict).toBe("underway");
    expect(a.advice).toMatch(/before you pay/i);
  });

  it("treats a district with no contracts as no work yet, however good the other signals are", () => {
    const a = assessAsrp({ ...base, district: 4, caveIns500: 99, lowModPct: 0.9 });
    expect(a.verdict).toBe("no-work-yet");
    expect(a.advice).toMatch(/skipped this district/i);
  });

  it("separates a matching address from a non-matching one in a district that has work", () => {
    expect(assessAsrp(base).verdict).toBe("possible");
    expect(assessAsrp({ ...base, caveIns500: 0 }).verdict).toBe("unlikely");
    expect(assessAsrp({ ...base, lowModPct: 0.2 }).verdict).toBe("unlikely");
  });

  it("never turns a failed lookup into a no", () => {
    const a = assessAsrp({ ...base, lowModPct: null });
    const lmi = a.signals.find((s) => s.label.includes("income"))!;
    expect(lmi.met).toBeNull();
    expect(a.verdict).toBe("possible"); // unknown income does not veto
  });

  it("always states that the deciding evidence is not public", () => {
    for (const inputs of [base, { ...base, district: 4 }, { ...base, nearestWorkM: 100 }]) {
      const camera = assessAsrp(inputs).signals.find((s) => s.label.includes("camera"))!;
      expect(camera.met).toBeNull();
      expect(camera.value).toBe("Not public");
      expect(camera.note).toMatch(/30,000\+/);
    }
  });

  it("does not claim a probability", () => {
    const text = JSON.stringify(assessAsrp(base));
    expect(text).not.toMatch(/\d+% (chance|likely|probability)/i);
  });
});

describe("the cave-in note describes the threshold that was applied", () => {
  it("does not claim a value below the median is at or above it", () => {
    const below = assessAsrp({ ...base, caveIns500: CALIBRATION.caveIns.median - 1 });
    const note = below.signals.find((s) => s.label.includes("cave-ins"))!.note;
    expect(note).not.toMatch(/at or above/i);
    expect(note).toMatch(/below their median/i);
  });

  it("says at or above only when it is", () => {
    const at = assessAsrp({ ...base, caveIns500: CALIBRATION.caveIns.median });
    expect(at.signals.find((s) => s.label.includes("cave-ins"))!.note).toMatch(/at or above the median/i);
  });

  it("calls out the bottom quarter plainly", () => {
    const low = assessAsrp({ ...base, caveIns500: 0 });
    expect(low.signals.find((s) => s.label.includes("cave-ins"))!.note).toMatch(/bottom quarter/i);
  });
});

describe("the address-level reading carries the finding", () => {
  it("reports basement flooding without pretending it is a selection criterion", () => {
    const heavy = assessAsrp({ ...base, water500: 107 });
    const sig = heavy.signals.find((s) => s.label.includes("Basement flooding"))!;
    expect(sig.met).toBeNull();
    expect(sig.value).toContain("107");
    expect(sig.note).toMatch(/does not track this number/i);
  });

  it("still names the median for an ordinary block", () => {
    const sig = assessAsrp(base).signals.find((s) => s.label.includes("Basement flooding"))!;
    expect(sig.note).toMatch(/not a criterion/i);
  });
});
