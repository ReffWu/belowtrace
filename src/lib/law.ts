// Michigan's sewage-backup statute, modelled instead of paraphrased.
//
// PA 222 of 2001, MCL 691.1416–691.1419, is the ONLY route to compensation from a
// governmental agency for a backup. It abrogates every common-law theory (691.1417(2)).
// Residents lose money in three specific ways, and each one is encoded below:
//
//   1. They miss the 45-day written notice (691.1419(1)) while gathering estimates that
//      the notice never required. NOTICE_CONTENT is the complete legal minimum.
//   2. They notify the city and not the regional authority. Both owned or discharged into
//      the system, so both are "appropriate governmental agencies" (691.1416(b)).
//   3. They are told the problem is their own lateral, so they never file at all — without
//      being told that a plumber's opinion is not the agency's finding, and that notice
//      costs nothing.
//
// Nothing here predicts an outcome. It states what the statute requires and what it excludes.

export const CITATION = {
  definitions: { label: "MCL 691.1416", url: "https://www.legislature.mi.gov/Laws/MCL?objectName=MCL-691-1416" },
  claim: { label: "MCL 691.1417", url: "https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-691-1417" },
  damages: { label: "MCL 691.1418", url: "https://www.legislature.mi.gov/Laws/MCL?objectName=MCL-691-1418" },
  notice: { label: "MCL 691.1419", url: "https://www.legislature.mi.gov/Laws/MCL?objectName=MCL-691-1419" },
  limitations: { label: "MCL 600.5805", url: "https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-600-5805" },
} as const;

/** 691.1419(1). Days from discovery, not from the storm and not from the agency's visit. */
export const NOTICE_DAYS = 45;

/** 691.1419(6). No civil action until 45 days after the agency received the notice. */
export const WAIT_DAYS_BEFORE_SUIT = 45;

/** MCL 600.5805 — three years for injury to property. The notice deadline is not the whole clock. */
export const LIMITATION_YEARS = 3;

/**
 * 691.1419(2)(c) — the exhaustive list. An agency may ask for more; the statute does not.
 * Estimates, receipts and photographs belong to the claim packet, which has no 45-day clock.
 */
export const NOTICE_CONTENT = [
  { id: "name", label: "Your name" },
  { id: "address", label: "Your address" },
  { id: "phone", label: "Your telephone number" },
  { id: "property", label: "The address of the affected property" },
  { id: "discovered", label: "The date you discovered the damage" },
  { id: "description", label: "A brief description of the claim" },
] as const;

/** 691.1417(3) — all five must be shown. The agency, not the resident, holds most of the proof. */
export const ELEMENTS = [
  { id: "agency", text: "The agency owned, operated, or discharged into that part of the system", who: "record" },
  { id: "defect", text: "The system had a construction, design, maintenance, operation or repair defect", who: "agency" },
  { id: "knew", text: "The agency knew, or should have known, about the defect", who: "agency" },
  { id: "failed", text: "It had authority to fix the defect and did not, in a reasonable time", who: "agency" },
  { id: "cause", text: "The defect caused 50% or more of the backup and the damage", who: "agency" },
] as const;

/**
 * 691.1416(k)(i)–(iii) — when an overflow is not a "sewage disposal system event" at all.
 * This is the difference between a weak claim and no claim. It is also why a plumber saying
 * "it's your line" does not by itself end the matter: the statute turns on what substantially
 * caused the overflow, which is the agency's finding to make, not the plumber's.
 */
export const EXCLUSIONS = [
  { id: "lateral", text: "A blockage in your own service lead that the agency did not cause" },
  { id: "onsite", text: "Something connected on your property — a sump system, building drain, surface drain, gutter or downspout" },
  { id: "war", text: "An act of war or terrorism" },
] as const;

/** 691.1418(1)–(2). Money for what the backup cost you; nothing for what it did to you. */
export const DAMAGES = {
  economic: "Repair, replacement, cleanup and other out-of-pocket losses.",
  noneconomic:
    "Pain, distress and inconvenience are not payable unless someone died, was permanently disfigured, or suffered serious impairment of a body function.",
} as const;

/**
 * 691.1419(3) — the one way a late notice survives.
 * If a resident told a contacting agency inside the 45 days, that agency owed them the notice
 * rules in writing (691.1419(2)); if it never sent them and that is why the notice was late,
 * the claim is not barred. Asking for it on the first call is free and costs one sentence,
 * which is why that sentence is in the call script rather than in a footnote.
 */
export const PRESERVATION_ASK =
  "Please send me, in writing, the notice requirements for a sewage disposal system claim, and the name and address of the person I must send my notice to.";

export const PRESERVATION_BASIS =
  "Michigan law requires the agency you first contact to give you those rules in writing. If it does not, and that is why your notice is late, your claim is not barred.";

/** A calendar day in Detroit, so a resident in another time zone still sees their own deadline. */
export function detroitDay(d: Date | string): string {
  const date = typeof d === "string" ? new Date(`${d}T12:00:00`) : d;
  return date.toLocaleDateString("en-CA", { timeZone: "America/Detroit" });
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

export function noticeDeadline(foundOn: string): string {
  return addDays(foundOn, NOTICE_DAYS);
}

export type NoticeClock = {
  deadline: string;
  daysLeft: number;
  /** Day 1 is the day the water was found, the way a resident counts it. */
  dayOfCase: number;
  state: "open" | "urgent" | "last-day" | "passed";
};

export function noticeClock(foundOn: string, today: string): NoticeClock {
  const deadline = noticeDeadline(foundOn);
  const daysLeft = daysBetween(today, deadline);
  return {
    deadline,
    daysLeft,
    dayOfCase: daysBetween(foundOn, today) + 1,
    state: daysLeft < 0 ? "passed" : daysLeft === 0 ? "last-day" : daysLeft <= 7 ? "urgent" : "open",
  };
}

/**
 * What to tell someone whose 45 days have run out. Not "you have no claim" — that is a legal
 * conclusion this app has no standing to reach, and 691.1419(3) plus the three-year limitation
 * period both survive a missed notice.
 */
export const AFTER_DEADLINE = {
  headline: "The 45 days have passed. That is not automatically the end of it.",
  points: [
    "Send the notice anyway. It costs a stamp, and an agency can accept a late one.",
    "If you told DWSD inside the 45 days and nobody sent you the notice rules in writing, Michigan law says a late notice does not bar your claim.",
    "Property claims in Michigan run three years. A lawyer who takes these cases on contingency can tell you what is left.",
  ],
} as const;
