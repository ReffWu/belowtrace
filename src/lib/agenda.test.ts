import { describe, expect, it } from "vitest";
import { agenda } from "./agenda";
import { complete, newCase, type Case } from "./case";

const at = (foundOn: string, patch: Partial<Case> = {}): Case => ({ ...newCase(foundOn), ...patch });
const ids = (list: { action: { id: string } }[]) => list.map((s) => s.action.id);

describe("day one", () => {
  const a = agenda(at("2026-09-20"), "2026-09-20");

  it("keeps safety on screen as one standing card, with nothing to acknowledge", () => {
    expect(ids(a.standing)).toEqual(["safety"]);
    expect(a.standing[0].action.standing).toBe(true);
    // Everything a person must not do before going down belongs on that one card.
    const points = a.standing[0].action.points!.join(" ").toLowerCase();
    for (const rule of ["breaker", "cleanout", "stop using water", "n95"]) expect(points).toContain(rule);
    // The gas warning lives on the DTE contact, and must not be repeated in the points.
    expect(a.standing[0].action.contact).toBe("dte");
    expect(points).not.toContain("smell gas");
  });

  it("leads with what cannot be undone, not with what comes first in a story", () => {
    expect(a.now[0].action.urgency).toBe("irreversible");
    expect(a.now[0].action.id).toBe("photos");
    expect(ids(a.now)).not.toContain("programs"); // day one is not the day to shop for grants
  });

  it("keeps the day short enough to actually do", () => {
    expect(a.now.length).toBeLessThanOrEqual(5);
  });

  it("asks the neighbors, which the old build never did", () => {
    expect(ids(a.now)).toContain("neighbors");
  });

  it("offers the insurer on day one, not after a verdict", () => {
    expect(ids(a.now)).toContain("call-insurance");
  });

  it("offers the statutory notice on day one", () => {
    expect(ids(a.now)).toContain("notice");
  });
});

describe("facts satisfy actions, so nothing is asked twice", () => {
  it("treats a recorded service request as the DWSD call being made", () => {
    const done = agenda(at("2026-09-20", { serviceRequest: "SR-12345" }), "2026-09-20");
    expect(ids(done.now)).not.toContain("call-dwsd");
    expect(ids(done.done)).toContain("call-dwsd");
    expect(done.done.find((s) => s.action.id === "call-dwsd")!.implicit).toBe(true);
  });

  it("treats both notices being mailed as the notice being done", () => {
    const c = at("2026-09-20", { noticeSentOn: { dwsd: "2026-09-22" } });
    expect(ids(agenda(c, "2026-09-25").now)).toContain("notice");
    const both = { ...c, noticeSentOn: { dwsd: "2026-09-22", glwa: "2026-09-22" } };
    expect(ids(agenda(both, "2026-09-25").now)).not.toContain("notice");
  });

  it("lets an implicit completion be undone by clearing the fact, not by an Undo button", () => {
    const s = agenda(at("2026-09-20", { neighbors: "same" }), "2026-09-20").done.find((x) => x.action.id === "neighbors");
    expect(s?.implicit).toBe(true);
  });
});

describe("windows close, the notice does not", () => {
  it("drops the cleanup window once it is far past", () => {
    expect(ids(agenda(at("2026-09-20"), "2026-10-20").now)).not.toContain("cleanup");
  });

  it("keeps the notice live after the deadline, because a late notice can still be accepted", () => {
    const late = agenda(at("2026-07-01"), "2026-09-20");
    expect(late.clock.state).toBe("passed");
    expect(ids(late.now)).toContain("notice");
  });

  it("never lets a missed deadline hide the rest of the day's work", () => {
    expect(agenda(at("2026-07-01"), "2026-09-20").now.length).toBeGreaterThan(1);
  });
});

describe("being told it is your own line does not close the claim", () => {
  it("keeps the notice on the list when the resident was told the pipe is theirs", () => {
    const mine = agenda(at("2026-09-20", { whose: "mine" }), "2026-09-22");
    expect(ids(mine.now)).toContain("notice");
  });

  it("drops the camera inspection only when the City owns the problem", () => {
    expect(ids(agenda(at("2026-09-20", { whose: "mine" }), "2026-09-25").now)).toContain("camera");
    expect(ids(agenda(at("2026-09-20", { whose: "city" }), "2026-09-25").now)).not.toContain("camera");
  });
});

describe("program context", () => {
  it("only warns about applying before signing when the address is actually in the program", () => {
    expect(ids(agenda(at("2026-09-20"), "2026-09-25", { inPsrpArea: true }).now)).toContain("psrp-first");
    expect(ids(agenda(at("2026-09-20"), "2026-09-25", {}).now)).not.toContain("psrp-first");
    expect(ids(agenda(at("2026-09-20"), "2026-09-25", { inPsrpArea: false }).now)).not.toContain("psrp-first");
  });
});

describe("ticking things off", () => {
  it("moves an action to done and out of today", () => {
    const c = complete(at("2026-09-20"), "photos");
    const a = agenda(c, "2026-09-20");
    expect(ids(a.now)).not.toContain("photos");
    expect(ids(a.done)).toContain("photos");
  });

  it("shows what has not opened yet as later, with the day it opens", () => {
    const a = agenda(at("2026-09-20"), "2026-09-20");
    const prevent = a.later.find((s) => s.action.id === "prevent");
    expect(prevent?.opensOnDay).toBe(30);
  });
});
