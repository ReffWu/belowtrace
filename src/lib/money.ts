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

function damage(c: Case, r: Area | null): MoneyRow | null {
  if (c.entry !== "backup") return null;
  const label = "Your damage";
  const by = day(claimDeadline(c.found));
  if (c.verdict === "mine") {
    return {
      id: "damage",
      label,
      amount: "—",
      note: `DWSD won't pay: the cause was your own line, and home insurance often won't either.${
        r && psrpFits(r) ? " PSRP can add basement cleaning and furnace or water-heater service once the line is fixed." : ""
      }`,
      tag: { tone: "no", text: "DWSD claim: no" },
    };
  }
  if (c.verdict === "city") {
    if (c.rain === "yes") {
      return {
        id: "damage",
        label,
        amount: `Claim by ${by}`,
        note: "DWSD says claims are likely denied when heavy rain overwhelms the sewers, unless a failure in its system caused at least half. File anyway, and ask your insurer about a sewer backup rider.",
        tag: { tone: "warn", text: "Claim likely denied" },
      };
    }
    if (c.rain === "no") {
      return {
        id: "damage",
        label,
        amount: `Claim by ${by}`,
        note: "A city sewer that failed on a dry day is what a damage claim is for. DWSD decides each claim.",
        tag: { tone: "ok", text: "Worth filing" },
      };
    }
    return {
      id: "damage",
      label,
      amount: `Claim by ${by}`,
      note: "A claim pays only if a failure in the city sewer caused at least half the problem. DWSD decides.",
      tag: { tone: "open", text: "DWSD decides" },
    };
  }
  if (c.verdict === "unsure") {
    return {
      id: "damage",
      label,
      amount: `Claim by ${by}`,
      note: "Ask DWSD what caused it: a claim pays only if the city sewer was at fault. Filing by the deadline keeps your right to be paid.",
      tag: { tone: "open", text: "Get a clear answer" },
    };
  }
  if (c.rain === "yes") {
    return {
      id: "damage",
      label,
      amount: "Varies",
      note: "Heavy rain alone usually isn't DWSD's fault, so claims are likely denied. Home insurance pays only with a sewer backup rider.",
      tag: { tone: "warn", text: "Claim likely denied" },
    };
  }
  return {
    id: "damage",
    label,
    amount: "Varies",
    note:
      c.rain === "no"
        ? "If DWSD finds the city sewer blocked, a damage claim is worth filing. Keep photos and receipts."
        : "A DWSD claim pays only if the city sewer was at fault. Heavy rain alone usually isn't.",
    tag: c.rain === "no" ? { tone: "open", text: "Depends on what DWSD finds" } : { tone: "open", text: "Was it raining hard?" },
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
  return [pipe(c, r, at), damage(c, r), now(c)].filter((x): x is MoneyRow => x !== null);
}
