import { describe, expect, it } from "vitest";
import golden from "@/data/golden.json";
import { whoCanPay } from "./guide";
import type { Report } from "./types";

const cores = golden as unknown as Record<string, Report>;
const prevost = { ...cores["16776 prevost st"], programs: [] };
const archdale = { ...cores["14600 archdale st"], programs: [] };
const fenmore = { ...cores["16821 fenmore st"], programs: [] };
const beforeChr = new Date("2026-09-19T12:00:00-04:00");
const afterChr = new Date("2026-09-23T12:00:00-04:00");
const ids = (r: ReturnType<typeof whoCanPay>) => r.fits.map((f) => f.id);

describe("whoCanPay", () => {
  it("offers PSRP with its screener inside the program area", () => {
    const r = whoCanPay(prevost, "backup", "unsure", beforeChr);
    expect(ids(r)).toContain("psrp");
    expect(r.fits.find((f) => f.id === "psrp")?.screener).toBe(true);
  });

  it("moves PSRP to 'checked' with a reason outside the program area", () => {
    const r = whoCanPay(archdale, "backup", "unsure", beforeChr);
    expect(ids(r)).not.toContain("psrp");
    expect(r.checked.find((c) => c.name === "Private Sewer Repair Program")?.reason).toMatch(/97 neighborhoods/);
  });

  it("leads with PSRP when the break is under the yard", () => {
    expect(whoCanPay(prevost, "broken-line", "yard", beforeChr).fits[0].id).toBe("psrp");
  });

  it("always offers the alley program when the break is at the alley", () => {
    const r = whoCanPay(archdale, "broken-line", "alley", afterChr);
    expect(r.fits[0].id).toBe("asrp");
    expect(r.fits[0].why).toMatch(/alley sewer/);
  });

  it("names nearby alley work when there is some", () => {
    expect(whoCanPay(fenmore, "backup", "unsure", beforeChr).fits.find((f) => f.id === "asrp")?.why).toMatch(/under way|being bid/);
  });

  it("drops Critical Home Repair from the fits once its window closes", () => {
    expect(ids(whoCanPay(prevost, "backup", "unsure", beforeChr))).toContain("chr");
    const after = whoCanPay(prevost, "backup", "unsure", afterChr);
    expect(ids(after)).not.toContain("chr");
    expect(after.checked.find((c) => c.name === "Critical Home Repair")?.reason).toMatch(/closed/);
  });

  it("only lists the damage claim as 'checked' when there was no backup", () => {
    expect(whoCanPay(prevost, "backup").checked.some((c) => c.name === "DWSD damage claim")).toBe(false);
    expect(whoCanPay(prevost, "broken-line").checked.some((c) => c.name === "DWSD damage claim")).toBe(true);
  });

  it("describes HOPE as a tax-relief option, not only an arrears fix", () => {
    const hope = whoCanPay(prevost, "backup", "unsure", beforeChr).checked.find((c) => c.name.includes("HOPE"));
    expect(hope?.reason).not.toMatch(/Only matters if you're behind/);
  });
});

describe("whoCanPay when nothing fits", () => {
  it("returns no fits for a higher-income address outside PSRP once Critical Home Repair closes", () => {
    const burlington = { ...archdale, lmi: { ...archdale.lmi!, lowModPct: 0.13, meetsAsrpIncomeTest: false }, projects: [] };
    const r = whoCanPay(burlington, "backup", "unsure", afterChr);
    expect(r.fits).toEqual([]);
    expect(r.checked.length).toBeGreaterThan(5);
  });

  it("names the 2021 flood requirement up front for PSRP", () => {
    expect(whoCanPay(prevost, "backup").fits.find((f) => f.id === "psrp")?.why).toMatch(/June 2021 flood/);
  });
});
