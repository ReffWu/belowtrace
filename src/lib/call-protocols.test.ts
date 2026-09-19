import { describe, expect, it } from "vitest";
import { getCallProtocol } from "./call-protocols";

describe("call-protocols", () => {
  const knownPrograms = ["asrp", "psrp", "chr", "claim", "hope", "habitat", "insurance"];

  it("returns structured protocol for all known programs", () => {
    for (const id of knownPrograms) {
      const p = getCallProtocol(id);
      expect(p).not.toBeNull();
      expect(p!.id).toBe(id);
      expect(p!.agency).toBeTruthy();
      expect(p!.phone).toBeTruthy();
      expect(p!.phoneDisplay).toBeTruthy();
      expect(p!.goal).toBeTruthy();
      expect(p!.openingScript).toBeTruthy();
      expect(p!.watchOut).toBeTruthy();
      expect(p!.haveReady.length).toBeGreaterThan(0);
      expect(p!.keyQuestions.length).toBeGreaterThan(0);
    }
  });

  it("injects address dynamically into the opening script", () => {
    const p = getCallProtocol("asrp", { address: "444 W Willis St" });
    expect(p?.openingScript).toContain("444 W Willis St");
  });

  it("injects neighborhood dynamically for psrp", () => {
    const p = getCallProtocol("psrp", { address: "16615 Whitcomb", hood: "Hubbell-Puritan" });
    expect(p?.openingScript).toContain("16615 Whitcomb");
    expect(p?.openingScript).toContain("Hubbell-Puritan");
  });

  it("provides fallback text when address is omitted", () => {
    const p = getCallProtocol("hope");
    expect(p?.openingScript).toContain("for my property");
  });

  it("returns null for unknown program ids", () => {
    expect(getCallProtocol("non-existent-program")).toBeNull();
  });
});
