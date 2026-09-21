import { describe, expect, it } from "vitest";
import { NOTICE_RECIPIENTS, compose, describe as describeClaim, fieldsFrom, missing } from "./notice";
import { newCase, type Case } from "./case";

const base: Case = {
  ...newCase("2026-09-20", { address: "16776 Prevost St, Detroit, MI 48235" }),
  name: "Jordan Ellis",
  phone: "313-555-0143",
};

const dwsd = NOTICE_RECIPIENTS.find((r) => r.id === "dwsd")!;
const glwa = NOTICE_RECIPIENTS.find((r) => r.id === "glwa")!;

describe("two agencies, two letters", () => {
  it("addresses the City and the regional authority separately", () => {
    expect(NOTICE_RECIPIENTS).toHaveLength(2);
    expect(compose(fieldsFrom(base), dwsd, "2026-09-21")).toContain("6425 Huber Street");
    expect(compose(fieldsFrom(base), glwa, "2026-09-21")).toContain("735 Randolph Street");
  });

  it("puts the statute and the discovery date on the face of both letters", () => {
    for (const to of NOTICE_RECIPIENTS) {
      const text = compose(fieldsFrom(base), to, "2026-09-21");
      expect(text).toContain("MCL 691.1419");
      expect(text).toContain("September 20, 2026");
      expect(text).toContain("November 4, 2026"); // the 45-day deadline, stated once
    }
  });

  it("carries all six statutory facts", () => {
    const text = compose(fieldsFrom(base), dwsd, "2026-09-21");
    expect(text).toContain("Jordan Ellis");
    expect(text).toContain("313-555-0143");
    expect(text).toContain("16776 Prevost St");
  });
});

describe("the letter never guesses", () => {
  it("does not assert a cause the resident does not know", () => {
    const text = describeClaim(base).toLowerCase();
    for (const guess of ["because", "caused by", "the city's negligence", "due to the city"]) {
      expect(text).not.toContain(guess);
    }
  });

  it("says outright that the packet follows, so nobody waits for estimates", () => {
    expect(describeClaim(base)).toContain("not the complete claim");
  });

  it("promises the photographs and estimates once, not twice", () => {
    const letter = compose(fieldsFrom(base), dwsd, "2026-09-21");
    expect(letter.match(/repair estimates/g)).toHaveLength(1);
  });

  it("cleans the geocoder's stray comma out of the address", () => {
    const letter = compose(fieldsFrom(base), dwsd, "2026-09-21");
    expect(letter).toContain("Detroit, MI 48235");
    expect(letter).not.toContain("MI, 48235");
  });

  it("includes the neighbors only when they actually reported water", () => {
    expect(describeClaim(base)).not.toContain("Other homes");
    expect(describeClaim({ ...base, neighbors: "same" })).toContain("Other homes on the same block");
    expect(describeClaim({ ...base, neighbors: "only-me" })).not.toContain("Other homes");
  });

  it("carries the depth only when it was recorded", () => {
    expect(describeClaim({ ...base, waterDepth: "4 inches" })).toContain("4 inches");
    expect(describeClaim(base)).not.toContain("approximately");
  });
});

describe("what is still missing", () => {
  it("names only the fields a person still has to supply", () => {
    expect(missing(fieldsFrom(base))).toEqual([]);
    expect(missing(fieldsFrom({ ...base, name: undefined }))).toEqual(["your name"]);
    expect(missing(fieldsFrom({ ...base, name: undefined, phone: " " }))).toEqual(["your name", "your phone number"]);
  });

  it("never treats a missing service request number as a blocker", () => {
    const gaps = missing(fieldsFrom({ ...base, serviceRequest: undefined }));
    expect(gaps).toEqual([]);
    expect(compose(fieldsFrom({ ...base, serviceRequest: undefined }), dwsd, "2026-09-21")).not.toContain("service request");
  });

  it("includes the service request number once it exists", () => {
    expect(compose(fieldsFrom({ ...base, serviceRequest: "SR-889" }), dwsd, "2026-09-21")).toContain("SR-889");
  });
});
