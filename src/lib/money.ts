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
      note: "The public system and the private line have different responsibility rules. Keep the cause unconfirmed until an official finding or inspection supports it.",
      tag: { tone: "open", text: "Depends on what DWSD finds" },
    };
  }
  if (c.verdict === "city") return { id: "pipe", label, amount: "To be confirmed", note: "You recorded that DWSD said the public sewer was involved. Keep the official finding and follow its stated next step.", tag: { tone: "open", text: "Official follow-up needed" } };
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
      note: `A break near the alley connection may warrant a DWSD/ASRP question. Program selection and covered work are decided by DWSD.${psrp ? " PSRP may also be worth checking." : ""}`,
      tag: { tone: "ok", text: "May be free" },
    };
  }
  if (psrp === null) {
    return { id: "pipe", label, amount, note: "Add the address to check mapped program areas and official conditions. Responsibility for a private line still depends on the confirmed location and facts.", tag: { tone: "open", text: "Add the address to check" } };
  }
  if (psrp) {
    return {
      id: "pipe",
      label,
      amount,
      note: "This address passed the map screen for PSRP. Up to $40,000 may be available if the official review approves the household and eligible work. Ask before non-emergency work whether it affects the application.",
      tag: { tone: "ok", text: "You may qualify for help" },
    };
  }
  return {
    id: "pipe",
    label,
    amount,
    note: `This address is outside the mapped PSRP area. That does not settle responsibility or rule out other help. Keep written estimates and check any current alternatives.${now < new Date(CHR_CLOSES) ? " Critical Home Repair may be relevant for some households." : ""}`,
    tag: { tone: "warn", text: "Other help may be limited" },
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
    return { id: "now", label: "Drain service", amount: COSTS.snaking, note: "Typical handbook cost for snaking a line. If you choose urgent service, keep the receipt and ask the professional what work is being performed." };
  }
  if (c.verdict !== "city" && !c.breakAt && stage === 3) {
    return { id: "now", label: "Camera inspection", amount: COSTS.camera, note: "Typical handbook cost. A camera can help locate a defect; any program coverage is subject to official approval." };
  }
  return null;
}

export function whoPays(c: Case, r: Area | null, at = new Date()): MoneyRow[] {
  return [pipe(c, r, at), damage(c), now(c)].filter((x): x is MoneyRow => x !== null);
}
