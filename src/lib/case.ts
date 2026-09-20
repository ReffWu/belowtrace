// A resident's case: what happened, what they've done, and what DWSD or a plumber told them.
// It lives only in their browser. Everything here is pure so the journey logic can be tested.
import type { BreakAt } from "./guide";
import type { Parcel, Report } from "./types";

export type Verdict = "city" | "mine" | "unsure";
export type TrackerStatus = "not-started" | "submitted" | "waiting" | "more-info" | "approved" | "scheduled" | "complete" | "not-approved";
export type TrackerId = "claim" | "psrp" | "repair";

export type CaseTracker = {
  status: TrackerStatus;
  reference?: string;
  lastAction?: string;
  due?: string;
  note?: string;
};

export type Case = {
  id?: string;
  entry: "backup" | "quote";
  startedAt: string; // YYYY-MM-DD
  found: string; // YYYY-MM-DD, when the water was found
  rain?: "yes" | "no" | "unsure"; // a fact to record; it does not decide a claim
  sr: string; // DWSD service request number
  address?: string;
  contactStatus?: "attempted" | "reported";
  contactAttemptedAt?: string;
  calledAt?: string; // ISO time the resident reported the issue to DWSD
  safeAcknowledgedAt?: string;
  dwsdVisit?: "visited" | "not-yet" | "unknown";
  dwsdFinding?: string;
  dwsdRecord?: "yes" | "no" | "unknown";
  dwsdNextStep?: string;
  dwsdFollowUpDue?: string;
  verdict?: Verdict; // what DWSD found
  breakAt?: BreakAt; // what the plumber's camera found
  quote?: string;
  kept: Record<string, boolean>; // claim evidence checklist
  claimFiledAt?: string; // YYYY-MM-DD
  trackers?: Partial<Record<TrackerId, CaseTracker>>;
  closedAt?: string; // YYYY-MM-DD
};

// 1 call DWSD · 2 DWSD checks · 3 whose pipe · 4 get it paid for · 5 closed
export type Stage = 1 | 2 | 3 | 4 | 5;

export function stageOf(c: Case): Stage {
  if (c.closedAt) return 5;
  if (c.entry === "backup") {
    const reported = c.contactStatus === "reported" || (!c.contactStatus && Boolean(c.calledAt));
    if (!reported) return 1;
    if (!c.verdict) return 2;
  }
  if (c.verdict !== "city" && !c.breakAt) return 3;
  return 4;
}

// Undo whatever finished the previous step, so a mistaken answer never traps anyone.
export function stepBack(c: Case): Case {
  const stage = stageOf(c);
  if (stage === 5) return { ...c, closedAt: undefined };
  if (stage === 4 && c.claimFiledAt) return { ...c, claimFiledAt: undefined };
  if (stage === 4 && c.verdict !== "city") return { ...c, breakAt: undefined };
  if (stage >= 3 && c.entry === "backup") return { ...c, verdict: undefined, breakAt: undefined };
  if (stage === 2) return { ...c, calledAt: undefined, contactStatus: undefined };
  return c;
}

export function newCase(entry: Case["entry"], today: string, patch: Partial<Case> = {}): Case {
  return {
    id: `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    entry,
    startedAt: today,
    found: today,
    sr: "",
    kept: {},
    ...(entry === "quote" ? { verdict: "mine" as const } : {}),
    ...patch,
  };
}

// If DWSD hasn't come two days after the call, call back with the number.
export function callbackDue(calledAt: string) {
  const d = new Date(calledAt);
  d.setDate(d.getDate() + 2);
  d.setHours(10, 0, 0, 0);
  return d;
}

export const EVIDENCE = [
  { id: "photos", label: "Photos of the water line and anything damaged" },
  { id: "receipts", label: "Receipts for cleanup, repairs and anything you replace" },
  { id: "list", label: "A list of damaged items and what they cost" },
];

// Only what the case page needs from a report, so the browser doesn't download building outlines twice.
export type CaseReport = Pick<Report, "query" | "address" | "psrpNeighborhood" | "floodZone" | "lmi" | "projects" | "warnings"> & {
  parcel: Parcel | null; // without its geometry
  waterInBasement: number;
};

export function slimReport(r: Report): CaseReport {
  return {
    query: r.query,
    address: r.address,
    psrpNeighborhood: r.psrpNeighborhood,
    floodZone: r.floodZone,
    lmi: r.lmi,
    projects: r.projects.map((p) => ({ ...p, parts: [] })),
    warnings: r.warnings,
    parcel: r.parcel && { ...r.parcel, geometry: undefined },
    waterInBasement: r.reports311.waterInBasement,
  };
}
