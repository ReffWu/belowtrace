import { describe, expect, it } from "vitest";
import golden from "@/data/golden.json";
import { newCase, type Case } from "./case";
import { whoPays } from "./money";
import type { Report } from "./types";

const cores = golden as unknown as Record<string, Report>;
const prevost = cores["16776 prevost st"]; // inside the PSRP area
const archdale = cores["14600 archdale st"]; // outside it
const today = "2026-09-19";
const before = new Date("2026-09-19T12:00:00-04:00");
const called: Case = { ...newCase("backup", today), calledAt: "2026-09-19T15:00:00Z" };
const row = (c: Case, id: string, r: Report | null = prevost) => whoPays(c, r, before).find((x) => x.id === id);

describe("whoPays", () => {
  it("starts open: the pipe could cost nothing or thousands, depending on DWSD", () => {
    const pipe = row(newCase("backup", today), "pipe");
    expect(pipe?.amount).toMatch(/^\$0 or \$5,000/);
    expect(pipe?.tag?.tone).toBe("open");
    expect(row(newCase("backup", today), "now")?.label).toBe("Clearing the drain");
  });

  it("keeps a claim path open without predicting the outcome from rain", () => {
    const damage = row({ ...called, rain: "yes" }, "damage");
    expect(damage?.tag?.text).toBe("Confirm the cause");
    expect(damage?.note).not.toMatch(/likely denied/);
  });

  it("keeps the claim conditional even when the city sewer failed on a dry day", () => {
    const d = row({ ...called, verdict: "city", rain: "no" }, "damage");
    expect(d?.tag?.text).toBe("Confirm the cause");
    expect(d?.amount).toBe("Claim by Nov 3");
    expect(row({ ...called, verdict: "city", rain: "no" }, "pipe")?.amount).toBe("$0");
  });

  it("does not predict the claim outcome from rain alone", () => {
    expect(row({ ...called, verdict: "city", rain: "yes" }, "damage")?.tag?.tone).toBe("open");
  });

  it("does not rule out a claim based on a resident's line-location answer", () => {
    const d = row({ ...called, verdict: "mine" }, "damage");
    expect(d?.tag?.text).toBe("Confirm the cause");
    expect(d?.note).toMatch(/written claim/);
  });

  it("tells a PSRP-area owner to apply before signing, and uses their own quote", () => {
    const p = row({ ...called, verdict: "mine", breakAt: "yard", quote: "$14,800" }, "pipe");
    expect(p?.amount).toBe("$14,800");
    expect(p?.note).toMatch(/Apply before you sign/);
    expect(row({ ...called, verdict: "mine", breakAt: "yard" }, "pipe", archdale)?.tag?.text).toBe("Most likely you");
  });

  it("points an alley break to the free program", () => {
    expect(row({ ...called, verdict: "mine", breakAt: "alley" }, "pipe", archdale)?.tag?.text).toBe("May be free");
  });

  it("prices the camera inspection only while the break is unknown", () => {
    expect(row({ ...called, verdict: "mine" }, "now")?.label).toBe("Camera inspection");
    expect(row({ ...called, verdict: "mine", breakAt: "yard" }, "now")).toBeUndefined();
  });

  it("has no damage row for a plumber's quote with no backup", () => {
    expect(row(newCase("quote", today, { breakAt: "yard" }), "damage")).toBeUndefined();
  });
});
