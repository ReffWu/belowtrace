import { describe, expect, it } from "vitest";
import { activeQuestions, documentsFor, evaluatePsrp, incomeLimitsFor, type PsrpAnswers, type PsrpAuto } from "./psrp";

const inArea: PsrpAuto = { inNeighborhood: true, neighborhoodName: "Bethune Community", isSFHA: false, residential: true };
const strong: PsrpAnswers = {
  ownership: "owner-occupant",
  ownedSixMonths: "yes",
  householdSize: 3,
  income: "under50",
  flooded2021: "yes",
  floodProof: ["dwsd-claim"],
  taxesCurrent: "yes",
  otherAssistance: "no",
};

describe("evaluatePsrp", () => {
  it("rates a complete, qualifying owner as likely", () => {
    const r = evaluatePsrp(strong, inArea);
    expect(r.verdict).toBe("likely");
    expect(r.complete).toBe(true);
    expect(r.checks.every((c) => c.status === "pass")).toBe(true);
  });

  it("rules out addresses outside the 97 neighborhoods", () => {
    const r = evaluatePsrp(strong, { ...inArea, inNeighborhood: false, neighborhoodName: null });
    expect(r.verdict).toBe("unlikely");
  });

  it("rules out homes in a FEMA floodplain", () => {
    expect(evaluatePsrp(strong, { ...inArea, isSFHA: true }).verdict).toBe("unlikely");
  });

  it("treats the 50–80% band as possible because the guide contradicts itself", () => {
    const r = evaluatePsrp({ ...strong, income: "50to80" }, inArea);
    expect(r.verdict).toBe("possible");
    expect(r.checks.some((c) => c.cite === "Guide p.3–4 vs p.10")).toBe(true);
  });

  it("rules out incomes above 80% AMI", () => {
    expect(evaluatePsrp({ ...strong, income: "over80" }, inArea).verdict).toBe("unlikely");
  });

  it("rules out owners under six months and homes not hit in 2021", () => {
    expect(evaluatePsrp({ ...strong, ownedSixMonths: "no" }, inArea).verdict).toBe("unlikely");
    expect(evaluatePsrp({ ...strong, flooded2021: "no", floodProof: undefined }, inArea).verdict).toBe("unlikely");
  });

  it("keeps unsure flood history, missing proof, back taxes and prior aid as possible", () => {
    for (const change of [
      { flooded2021: "unsure" as const },
      { floodProof: [] },
      { taxesCurrent: "no" as const },
      { taxesCurrent: "unsure" as const },
      { otherAssistance: "yes" as const },
    ]) {
      expect(evaluatePsrp({ ...strong, ...change }, inArea).verdict).toBe("possible");
    }
  });

  it("sends renters to their landlord", () => {
    const r = evaluatePsrp({ ownership: "renter" }, inArea);
    expect(r.verdict).toBe("possible");
    expect(r.complete).toBe(true);
    expect(r.summary).toMatch(/landlord/);
  });

  it("marks incomplete answers as possible, never likely", () => {
    const r = evaluatePsrp({ ownership: "owner-occupant", ownedSixMonths: "yes" }, inArea);
    expect(r.complete).toBe(false);
    expect(r.verdict).toBe("possible");
  });

  it("flags non-residential parcels", () => {
    expect(evaluatePsrp(strong, { ...inArea, residential: false }).verdict).toBe("possible");
  });
});

describe("activeQuestions", () => {
  it("skips the proof question when the home was not flooded", () => {
    expect(activeQuestions({ flooded2021: "no" })).not.toContain("floodProof");
  });
  it("stops after ownership for renters", () => {
    expect(activeQuestions({ ownership: "renter" })).toEqual(["ownership"]);
  });
});

describe("incomeLimitsFor", () => {
  it("uses MSHDA 2026 Wayne County limits and clamps household size", () => {
    expect(incomeLimitsFor(4)).toEqual({ veryLow50: 52400, low80: 83850 });
    expect(incomeLimitsFor(12)).toEqual({ veryLow50: 69200, low80: 110700 });
    expect(incomeLimitsFor(0)).toEqual({ veryLow50: 36700, low80: 58700 });
  });
});

describe("documentsFor", () => {
  it("names the flood proof the resident has and adds landlord paperwork", () => {
    const docs = documentsFor({ ownership: "landlord", floodProof: ["fema", "insurance"] });
    expect(docs.join(" ")).toMatch(/FEMA claim/);
    expect(docs.join(" ")).toMatch(/BSEED/);
  });
});
