// "Who pays, so far": the money side of a case, narrowed by every answer the resident records.
// Costs come from DWSD's handbook; the claim rule is Michigan law (MCL 691.1416–1419) as DWSD applies it:
// DWSD pays for damage only when a failure in its system caused at least half of the backup.
import { stageOf, type Case, type CaseReport } from "./case";
import { CHR_CLOSES, COSTS } from "./facts";
import { psrpFits } from "./guide";
import { claimDeadline } from "./plan";

export type Tone = "ok" | "warn" | "no" | "open";
export type MoneyRow = { id: "pipe" | "damage" | "now"; label: string; amount: string; note: string; tag?: { tone: Tone; text: string } };

type Area = Pick<CaseReport, "psrpNeighborhood" | "floodZone" | "parcel">;

const day = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Detroit" });

function pipe(c: Case, r: Area | null, now: Date): MoneyRow {
  const label = "Fixing the pipe";
  const psrp = r ? psrpFits(r) : null;
  if (c.entry === "backup" && !c.verdict) {
    return {
      id: "pipe",
      label,
      amount: `$0 or ${COSTS.lateral}`,
      note: "If the city sewer is at fault, the City fixes it. If it's your line, you pay, unless a program helps.",
      tag: { tone: "open", text: "Depends on what DWSD finds" },
    };
  }
  if (c.verdict === "city") return { id: "pipe", label, amount: "$0", note: "The City fixes its own sewer.", tag: { tone: "ok", text: "The City pays" } };
  if (c.verdict === "unsure" && !c.breakAt) {
    return {
      id: "pipe",
      label,
      amount: `$0 or ${COSTS.lateral}`,
      note: "Nobody has found the break yet. A camera inspection shows whose side it's on.",
      tag: { tone: "open", text: "Find the break first" },
    };
  }
  const amount = c.quote?.trim() || COSTS.lateral;
  if (c.breakAt === "alley") {
    return {
      id: "pipe",
      label,
      amount,
      note: `The free Alley Sewer Repair Program fixes breaks where your line meets the alley sewer, if DWSD picks your alley. Ask before you pay.${psrp ? " PSRP may cover it too." : ""}`,
      tag: { tone: "ok", text: "May be free" },
    };
  }
  if (psrp === null) {
    return { id: "pipe", label, amount, note: "Your line is yours to fix. Up to $40,000 is available in 97 neighborhoods.", tag: { tone: "open", text: "Add the address to check" } };
  }
  if (psrp) {
    return {
      id: "pipe",
      label,
      amount,
      note: "Up to $40,000 from the Private Sewer Repair Program may cover it. Apply before you sign a contract: it can't pay for work done first.",
      tag: { tone: "ok", text: "You may qualify for help" },
    };
  }
  return {
    id: "pipe",
    label,
    amount,
    note: `Your line is yours to fix, and this address is outside the $40,000 program. Get two written quotes.${now < new Date(CHR_CLOSES) ? " Critical Home Repair may help some households." : ""}`,
    tag: { tone: "warn", text: "Most likely you" },
  };
}

function damage(c: Case): MoneyRow | null {
  if (c.entry !== "backup") return null;
  const label = "Your damage";
  const by = day(claimDeadline(c.found));
  const causeNote =
    c.verdict === "city"
      ? "DWSD said its sewer may be involved. Follow its claim instructions and keep its finding in writing."
      : c.verdict === "mine"
        ? "A preliminary finding points to a private line. Ask whether that is final and request a written claim record before the deadline."
        : "Record what you observed and ask DWSD for its written or recorded finding before the deadline.";
  return {
    id: "damage",
    label,
    amount: `Claim by ${by}`,
    note: `${causeNote} A claim outcome depends on the agency review and applicable law; rain or a preliminary finding alone does not decide it.`,
    tag: { tone: "open", text: "Confirm the cause" },
  };
}

function now(c: Case): MoneyRow | null {
  const stage = stageOf(c);
  if (c.entry === "backup" && stage <= 2) {
    return { id: "now", label: "Clearing the drain", amount: COSTS.snaking, note: "What a plumber charges to snake a line. You pay now; keep the receipt for a claim or insurance." };
  }
  if (c.verdict !== "city" && !c.breakAt && stage === 3) {
    return { id: "now", label: "Camera inspection", amount: COSTS.camera, note: "What DWSD's own program budgets for one. PSRP pays for it if you qualify." };
  }
  return null;
}

export function whoPays(c: Case, r: Area | null, at = new Date()): MoneyRow[] {
  return [pipe(c, r, at), damage(c), now(c)].filter((x): x is MoneyRow => x !== null);
}
