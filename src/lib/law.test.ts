import { describe, expect, it } from "vitest";
import { NOTICE_CONTENT, addDays, daysBetween, noticeClock, noticeDeadline } from "./law";

describe("the 45-day clock", () => {
  it("counts calendar days from discovery, not from today", () => {
    expect(noticeDeadline("2026-09-20")).toBe("2026-11-04");
  });

  it("does not drift when the browser is in another time zone", () => {
    // The old build built the date at local noon and formatted it in Detroit, which moved the
    // deadline a day earlier for anyone east of the US.
    const tz = process.env.TZ;
    process.env.TZ = "Asia/Shanghai";
    expect(noticeDeadline("2026-09-19")).toBe("2026-11-03");
    process.env.TZ = "America/Detroit";
    expect(noticeDeadline("2026-09-19")).toBe("2026-11-03");
    process.env.TZ = tz;
  });

  it("survives a daylight-saving change inside the window", () => {
    // 2026-11-01 is the US fall-back. 45 days from Oct 1 must still be Nov 15.
    expect(noticeDeadline("2026-10-01")).toBe("2026-11-15");
    expect(daysBetween("2026-10-01", "2026-11-15")).toBe(45);
  });

  it("reports day 1 on the day the water was found", () => {
    expect(noticeClock("2026-09-20", "2026-09-20").dayOfCase).toBe(1);
    expect(noticeClock("2026-09-20", "2026-09-21").dayOfCase).toBe(2);
  });

  it("escalates as the deadline approaches and never hides a passed one", () => {
    expect(noticeClock("2026-09-20", "2026-09-21").state).toBe("open");
    expect(noticeClock("2026-09-20", "2026-10-29").state).toBe("urgent");
    expect(noticeClock("2026-09-20", "2026-11-04").state).toBe("last-day");
    expect(noticeClock("2026-09-20", "2026-11-05").state).toBe("passed");
  });

  it("reports negative days left once it has passed, so callers cannot mistake it for zero", () => {
    expect(noticeClock("2026-09-20", "2026-11-10").daysLeft).toBeLessThan(0);
  });

  it("moves dates without stepping on month ends", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("what the notice must contain", () => {
  it("is the six facts the statute lists, and nothing that takes weeks to gather", () => {
    expect(NOTICE_CONTENT.map((f) => f.id)).toEqual(["name", "address", "phone", "property", "discovered", "description"]);
    const labels = NOTICE_CONTENT.map((f) => f.label.toLowerCase()).join(" ");
    for (const absent of ["estimate", "receipt", "photograph", "value"]) expect(labels).not.toContain(absent);
  });
});
