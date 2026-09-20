import { describe, expect, it } from "vitest";
import golden from "@/data/golden.json";
import { findPsrpNeighborhood, mainsNear, projectsNear, reportsNear, sideOfLot } from "./geo";
import { atAGlance } from "./glance";
import { buildPlan, claimDeadline } from "./plan";
import { buildPrograms } from "./programs";
import { normalizeQuery } from "./report";
import type { Report } from "./types";

const cores = golden as unknown as Record<string, Omit<Report, "programs">>;
const prevost = cores["16776 prevost st"];
const archdale = cores["14600 archdale st"];
const full = (core: Omit<Report, "programs">, now: Date): Report => ({ ...core, programs: buildPrograms(core, "backup", now) });
const beforeChr = new Date("2026-09-19T12:00:00-04:00");
const afterChr = new Date("2026-09-23T12:00:00-04:00");

describe("geo lookups against the bundled open data", () => {
  it("places 16776 Prevost in Crary/St Marys next to a 1928 combined sewer", () => {
    expect(findPsrpNeighborhood(prevost.lngLat)?.name).toBe("Crary/St Marys");
    const main = mainsNear(prevost.lngLat, 90)[0];
    expect(main.installYear).toBe(1928);
    expect(main.systemLabel).toMatch(/combined/);
    expect(main.distanceM).toBeLessThan(40);
  });

  it("finds active alley work near 16821 Fenmore", () => {
    const fenmore = cores["16821 fenmore st"];
    expect(projectsNear(fenmore.lngLat, 400).some((p) => p.isAlley && p.phase === "Construction")).toBe(true);
  });

  it("counts 311 reports only inside the radius", () => {
    const near = reportsNear(prevost.lngLat, 200);
    expect(near.length).toBeGreaterThan(0);
    expect(near.length).toBeLessThan(reportsNear(prevost.lngLat, 1000).length);
  });

  it("returns nothing outside the PSRP neighborhoods", () => {
    expect(findPsrpNeighborhood(archdale.lngLat)).toBeNull();
  });
});

describe("sideOfLot", () => {
  // A lot facing a street to its west: the alley is to the east.
  const center: [number, number] = [-83.203, 42.4139];
  const street: [number, number] = [-83.2034, 42.4139];
  it("puts a main east of the house (away from the street) at the rear", () => {
    expect(sideOfLot(center, street, [-83.2027, 42.4139])).toBe("rear");
  });
  it("puts a main under the street in front", () => {
    expect(sideOfLot(center, street, [-83.2035, 42.4139])).toBe("front");
  });
  it("calls a main off to one side a side street", () => {
    expect(sideOfLot(center, street, [-83.203, 42.4144])).toBe("side");
  });
  it("finds the 1928 main behind 16776 Prevost", () => {
    expect(prevost.mainSide).toBe("rear");
  });
});

describe("program cards", () => {
  it("orders the damage claim first when sewage is backing up", () => {
    expect(buildPrograms(prevost, "backup")[0].id).toBe("claim");
    expect(buildPrograms(prevost, "broken-line")[0].id).toBe("asrp");
  });

  it("rates PSRP unlikely outside the program area and offers the screener inside it", () => {
    const inArea = buildPrograms(prevost, "checking").find((c) => c.id === "psrp")!;
    const outArea = buildPrograms(archdale, "checking").find((c) => c.id === "psrp")!;
    expect(inArea.actions.some((a) => a.kind === "screener")).toBe(true);
    expect(outArea.verdict).toBe("unlikely");
    expect(outArea.actions.some((a) => a.kind === "screener")).toBe(false);
  });

  it("closes Critical Home Repair after Sep 22, 5 PM", () => {
    expect(buildPrograms(prevost, "backup", beforeChr).find((c) => c.id === "chr")!.status).toBe("closing-soon");
    expect(buildPrograms(prevost, "backup", afterChr).find((c) => c.id === "chr")!.status).toBe("closed");
  });
});

describe("at a glance and next steps", () => {
  it("leads with the DWSD call during a backup and mentions the 1928 sewer", () => {
    const items = atAGlance(full(prevost, beforeChr), "backup", beforeChr);
    expect(items[0].tone).toBe("act");
    expect(items.some((i) => i.text.includes("1928"))).toBe(true);
    expect(items.some((i) => i.text.includes("Critical Home Repair"))).toBe(true);
    expect(atAGlance(full(prevost, afterChr), "backup", afterChr).some((i) => i.text.includes("Critical Home Repair"))).toBe(false);
  });

  it("drops the Critical Home Repair step once it has closed", () => {
    expect(buildPlan(full(prevost, beforeChr), "backup", beforeChr).some((s) => s.id === "chr")).toBe(true);
    expect(buildPlan(full(prevost, afterChr), "backup", afterChr).some((s) => s.id === "chr")).toBe(false);
  });

  it("gives 45 days to file a damage claim", () => {
    expect(claimDeadline("2026-09-18").toISOString().slice(0, 10)).toBe("2026-11-02");
  });

  it("includes factual call guidance for DWSD", () => {
    const plan = buildPlan(full(prevost, beforeChr), "backup", beforeChr);
    const dwsdStep = plan.find((s) => s.id === "call-dwsd");
    expect(dwsdStep?.callScript).toBeDefined();
    expect(dwsdStep?.callScript?.recipient).toContain("DWSD");
    expect(dwsdStep?.callScript?.script.join(" ")).toContain("Service Request");
    expect(dwsdStep?.callScript?.factTips.length).toBeGreaterThan(0);
  });
});

describe("normalizeQuery", () => {
  it("treats suggest-style and typed addresses the same", () => {
    expect(normalizeQuery("16776 Prevost St, Detroit, MI")).toBe("16776 prevost st");
    expect(normalizeQuery("16776  PREVOST ST")).toBe("16776 prevost st");
  });
});
