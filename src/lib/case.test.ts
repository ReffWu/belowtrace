import { describe, expect, it } from "vitest";
import { callbackDue, newCase, stageOf, stepBack } from "./case";

const today = "2026-09-19";

describe("stageOf", () => {
  it("walks a backup through all four stages", () => {
    const c = newCase("backup", today);
    expect(stageOf(c)).toBe(1);
    expect(stageOf({ ...c, calledAt: "2026-09-19T15:00:00Z" })).toBe(2);
    const checked = { ...c, calledAt: "2026-09-19T15:00:00Z" };
    expect(stageOf({ ...checked, verdict: "city" })).toBe(4);
    expect(stageOf({ ...checked, verdict: "mine" })).toBe(3);
    expect(stageOf({ ...checked, verdict: "unsure" })).toBe(3);
    expect(stageOf({ ...checked, verdict: "mine", breakAt: "yard" })).toBe(4);
    expect(stageOf({ ...checked, verdict: "city", closedAt: today })).toBe(5);
  });

  it("starts a plumber quote at 'whose pipe', since the line is already known to be the owner's", () => {
    const c = newCase("quote", today);
    expect(c.verdict).toBe("mine");
    expect(stageOf(c)).toBe(3);
    expect(stageOf(newCase("quote", today, { breakAt: "alley" }))).toBe(4);
  });
});

describe("callbackDue", () => {
  it("is two days after the call, in the morning", () => {
    const d = callbackDue("2026-09-19T20:00:00-04:00");
    expect(d.getDate()).toBe(21);
    expect(d.getHours()).toBe(10);
  });
});

describe("stepBack", () => {
  const called = { ...newCase("backup", today), calledAt: "2026-09-19T15:00:00Z" };
  it("undoes the answer that finished the previous step", () => {
    expect(stageOf(stepBack(called))).toBe(1);
    expect(stageOf(stepBack({ ...called, verdict: "city" }))).toBe(2);
    expect(stageOf(stepBack({ ...called, verdict: "mine", breakAt: "yard" }))).toBe(3);
    expect(stepBack({ ...called, verdict: "city", claimFiledAt: today }).claimFiledAt).toBeUndefined();
    expect(stageOf(stepBack({ ...called, verdict: "city", closedAt: today }))).toBe(4);
  });

  it("can't go back past the start", () => {
    const c = newCase("backup", today);
    expect(stepBack(c)).toEqual(c);
  });
});
