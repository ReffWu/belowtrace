// A case is two facts the resident gives us and everything they learn afterwards.
//
// There are no stages. A backup is not a decision tree, safety, cleanup, the insurer and the
// statutory notice all run at once, on different clocks, and the 45-day clock keeps running
// whether or not anyone ever decides whose pipe it was. So the model is a date plus a set of
// recorded facts, and what to do today is derived from them (see agenda.ts).
//
// Every field is something a person could read off a phone screen to a clerk. Nothing here is
// an inference, a score, or a prediction.
import { detroitDay } from "./law";

/** What someone has been told so far. Never this app's conclusion. */
export type Whose = "unknown" | "city" | "mine";

/** The single most useful free signal, and the one the old build never asked for. */
export type NeighborSignal = "same" | "only-me" | "unknown";

export type Case = {
  id: string;
  /** YYYY-MM-DD in Detroit. The one input everything else is derived from. */
  foundOn: string;
  startedOn: string;
  address?: string;
  parcelId?: string;

  // --- identity, only ever asked once, only for the statutory notice ---
  name?: string;
  phone?: string;

  // --- what they have been told ---
  serviceRequest?: string;
  whose?: Whose;
  whoseBasis?: string;
  neighbors?: NeighborSignal;

  // --- what they have sent ---
  /** recipient id -> YYYY-MM-DD it was mailed. */
  noticeSentOn?: Record<string, string>;
  insuranceClaim?: string;

  // --- the damage, in their words ---
  waterDepth?: string;
  damageNote?: string;

  /** actionId -> ISO timestamp. An action can also be satisfied by a fact; see agenda.ts. */
  done: Record<string, string>;

  closedOn?: string;
};

export const todayInDetroit = () => detroitDay(new Date());

export function newCase(foundOn: string, patch: Partial<Case> = {}): Case {
  const today = todayInDetroit();
  return {
    id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    foundOn: foundOn || today,
    startedOn: today,
    done: {},
    whose: "unknown",
    ...patch,
  };
}

/** The notice needs a name and a phone; nothing else in the app does. */
export function noticeReady(c: Case) {
  return Boolean(c.name?.trim() && c.phone?.trim() && c.address?.trim());
}

export function sentTo(c: Case, recipientId: string) {
  return c.noticeSentOn?.[recipientId];
}

export function markSent(c: Case, recipientId: string, day = todayInDetroit()): Case {
  return { ...c, noticeSentOn: { ...c.noticeSentOn, [recipientId]: day } };
}

export function unmarkSent(c: Case, recipientId: string): Case {
  const next = { ...(c.noticeSentOn ?? {}) };
  delete next[recipientId];
  return { ...c, noticeSentOn: next };
}

export function complete(c: Case, actionId: string): Case {
  return { ...c, done: { ...c.done, [actionId]: new Date().toISOString() } };
}

export function uncomplete(c: Case, actionId: string): Case {
  const done = { ...c.done };
  delete done[actionId];
  return { ...c, done };
}

/**
 * What the neighbors said, turned into the only plain-language reading it supports.
 * Deliberately not fed into any eligibility or claim logic: it points a person at the right
 * next question, it does not answer it.
 */
export function neighborReading(n: NeighborSignal | undefined): string | null {
  if (n === "same") return "Several homes backing up at once usually points at the public sewer, not your line. Say that to DWSD.";
  if (n === "only-me") return "If it is only your home, the blockage is often in your own line. Your notice still goes in, a plumber's opinion is not the City's finding.";
  return null;
}
