import { ASRP_STARTS, CHR_CLOSES, HOPE_DEADLINE, PHONES, SOURCES, VERIFIED_ON } from "./facts";
import type { Evidence, ProgramCard, Report, Situation } from "./types";

const tel = (n: string) => `tel:${n.replace(/\D/g, "")}`;
const hud: Evidence = { level: "estimated", source: SOURCES.hudLmi.label, url: SOURCES.hudLmi.url, note: "Block-group share of low- and moderate-income residents" };
const cip: Evidence = { level: "recorded", source: SOURCES.dwsdCip.label, url: SOURCES.dwsdCip.url };
const rule = (source: { label: string; url: string }): Evidence => ({ level: "recorded", source: source.label, url: source.url, asOf: VERIFIED_ON });

type Inputs = Pick<Report, "psrpNeighborhood" | "floodZone" | "lmi" | "projects" | "parcel">;

function asrp({ lmi, projects }: Inputs): ProgramCard {
  const reasons: ProgramCard["reasons"] = [];
  let verdict: ProgramCard["verdict"] = "check";
  let headline = "DWSD picks alleys from its camera inspections. Ask whether yours is on the list before you pay for a repair.";

  if (lmi) {
    const pct = Math.round(lmi.lowModPct * 100);
    if (lmi.meetsAsrpIncomeTest) {
      verdict = "possible";
      headline = "Your area meets the income test the City uses to choose alleys. Ask DWSD if yours is scheduled before you pay $10,000+.";
      reasons.push({ text: `${pct}% of residents in your census block group are low or moderate income. The City prioritizes areas above 50%.`, evidence: hud });
    } else {
      verdict = "unlikely";
      headline = "Your area is below the income test the City uses to prioritize alleys — but DWSD makes the final call.";
      reasons.push({ text: `${pct}% of residents in your census block group are low or moderate income; the City prioritizes areas above 50%.`, evidence: hud });
    }
  }

  const active = projects.filter((p) => p.isAlley && p.phase !== "Closed");
  if (active.length) {
    const p = active[0];
    reasons.push({
      text: `DWSD has alley sewer work ${p.phase === "Construction" ? "under construction" : "in procurement"} ${p.distanceM} m from you: “${p.name}” (${[p.startYear, p.endYear].filter(Boolean).join("–")}).`,
      evidence: cip,
    });
  }
  reasons.push({
    text: "DWSD chooses locations using camera (CCTV) inspections that confirm broken connections and alley cave-ins. That list is not public.",
    evidence: { level: "unknown", source: SOURCES.asrp.label, url: SOURCES.asrp.url },
  });

  return {
    id: "asrp",
    name: "Alley Sewer Repair Program",
    shortName: "Alley Sewer Repair",
    status: "upcoming",
    statusLabel: `Starts ${new Date(`${ASRP_STARTS}-01T12:00:00`).toLocaleString("en-US", { month: "short", year: "numeric" })} · No application`,
    amount: "Free — about 8,000 connections over 4 years ($184M)",
    verdict,
    headline,
    reasons,
    actions: [{ label: `Call DWSD ${PHONES.dwsd.number}`, href: tel(PHONES.dwsd.number), kind: "phone" }],
    source: SOURCES.asrp,
    verifiedOn: VERIFIED_ON,
  };
}

function psrp({ psrpNeighborhood, floodZone, parcel }: Inputs): ProgramCard {
  const reasons: ProgramCard["reasons"] = [];
  const hood = psrpNeighborhood;
  let verdict: ProgramCard["verdict"] = "check";
  let headline: string;

  if (!hood.inProgram) {
    verdict = "unlikely";
    headline = "Your address is outside the 97 neighborhoods this program serves.";
    reasons.push({ text: "Only homes in the program's 97 most-impacted neighborhoods can apply.", evidence: hood.evidence });
  } else {
    headline = `You're in ${hood.name}, one of the program's 97 neighborhoods. Answer 8 quick questions to see if you qualify.`;
    reasons.push({ text: `This address is inside the ${hood.name} program area.`, evidence: hood.evidence });
  }
  if (floodZone.isSFHA) {
    verdict = "unlikely";
    reasons.push({ text: `FEMA maps this property in flood zone ${floodZone.zone}. Homes in a floodplain are excluded.`, evidence: floodZone.evidence });
  }
  if (parcel?.propertyClass && !/RESIDENTIAL/i.test(parcel.propertyClass)) {
    reasons.push({ text: `City records list this parcel as “${parcel.propertyClass}”. Only 1–4 unit homes qualify.`, evidence: parcel.evidence });
  }
  reasons.push({
    text: "You must also show the June 25–26, 2021 flood affected your home and meet income limits.",
    evidence: rule(SOURCES.psrpGuide),
  });

  return {
    id: "psrp",
    name: "Private Sewer Repair Program (PSRP)",
    shortName: "Private Sewer Repair",
    status: "open",
    statusLabel: "Open · Apply online",
    amount: "Up to $40,000 — grant for owners, forgivable loan for landlords",
    verdict,
    headline,
    reasons,
    actions: [
      ...(hood.inProgram && !floodZone.isSFHA ? [{ label: "Check if I qualify", href: "#psrp-screener", kind: "screener" as const }] : []),
      { label: "Apply on Neighborly", href: SOURCES.neighborly.url, kind: "link" },
      { label: `Call HRD ${PHONES.hrd.number}`, href: tel(PHONES.hrd.number), kind: "phone" },
    ],
    source: SOURCES.psrp,
    verifiedOn: VERIFIED_ON,
  };
}

function chr(now: Date): ProgramCard {
  const open = now < new Date(CHR_CLOSES);
  return {
    id: "chr",
    name: "Critical Home Repair Program",
    shortName: "Critical Home Repair",
    status: open ? "closing-soon" : "closed",
    statusLabel: open ? "Pre-application closes Tue, Sep 22 · 5 PM" : "Closed for this round",
    amount: "The most critical repairs for selected homes",
    verdict: open ? "check" : "not-applicable",
    headline: open
      ? "Covers severe plumbing problems for owner-occupants with a child under 18, a senior 62+, or a household member with a disability."
      : "This round closed on Sep 22, 2026. Watch for the next round.",
    reasons: [
      {
        text: "You must own and live in the home, be current on property taxes or on a payment plan, and meet income limits. Selected homes get the most critical repairs; not every need can be covered.",
        evidence: rule(SOURCES.chr),
      },
    ],
    actions: open
      ? [
          { label: "Pre-apply on Neighborly", href: SOURCES.neighborly.url, kind: "link" },
          { label: `Call HRD ${PHONES.hrd.number}`, href: tel(PHONES.hrd.number), kind: "phone" },
        ]
      : [],
    deadline: open ? { label: "Pre-application closes", date: CHR_CLOSES } : undefined,
    source: SOURCES.chr,
    verifiedOn: VERIFIED_ON,
  };
}

function claim(): ProgramCard {
  return {
    id: "claim",
    name: "DWSD damage claim",
    shortName: "DWSD damage claim",
    status: "always",
    statusLabel: "Within 45 days of the backup",
    amount: "Reimbursement for damage, if DWSD is found responsible",
    verdict: "info",
    headline: "If sewage backed up into your home, file a claim within 45 days. Call DWSD first — you need a Service Request number to file.",
    reasons: [{ text: "Claims must be filed within 45 days of discovering the backup, with a DWSD Service Request number.", evidence: rule(SOURCES.claims) }],
    actions: [
      { label: `Call DWSD ${PHONES.dwsd.number}`, href: tel(PHONES.dwsd.number), kind: "phone" },
      { label: "File a claim", href: SOURCES.claims.url, kind: "link" },
    ],
    source: SOURCES.claims,
    verifiedOn: VERIFIED_ON,
  };
}

function hope(now: Date, parcel: Inputs["parcel"]): ProgramCard {
  const open = now < new Date(HOPE_DEADLINE);
  return {
    id: "hope",
    name: "HOPE property tax exemption",
    shortName: "HOPE tax exemption",
    status: open ? "open" : "closed",
    statusLabel: open ? "2026 applications due Nov 6" : "Closed for 2026",
    amount: "Lowers or eliminates this year's property taxes",
    verdict: "info",
    headline: "Repair programs require current property taxes or a plan. If you're behind, HOPE can clear this year's taxes for low-income homeowners.",
    reasons: [
      ...(parcel?.taxStatus ? [{ text: `City tax status for this parcel: “${parcel.taxStatus}”.`, evidence: parcel.evidence }] : []),
      { text: "Apply every year. Wayne Metro helps with applications for free.", evidence: rule(SOURCES.hope) },
    ],
    actions: [
      { label: `Call Wayne Metro ${PHONES.wayneMetro.number}`, href: tel(PHONES.wayneMetro.number), kind: "phone" },
      { label: "HOPE details", href: SOURCES.hope.url, kind: "link" },
    ],
    deadline: open ? { label: "HOPE applications due", date: HOPE_DEADLINE } : undefined,
    source: SOURCES.hope,
    verifiedOn: VERIFIED_ON,
  };
}

// Programs residents often get pointed to that are not taking applications right now.
function unavailable(): ProgramCard[] {
  const base = { amount: "", verdict: "not-applicable" as const, reasons: [], actions: [], verifiedOn: VERIFIED_ON };
  return [
    {
      ...base,
      id: "bbpp",
      name: "Basement Backup Protection Program",
      shortName: "Basement Backup Protection",
      status: "closed",
      statusLabel: "Closed",
      headline: "Backwater valves in 11 neighborhoods. Applications reopen only if new funding arrives.",
      source: SOURCES.bbpp,
    },
    {
      ...base,
      id: "habitat",
      name: "Habitat for Humanity Detroit — Critical Home Repair",
      shortName: "Habitat Critical Home Repair",
      status: "paused",
      statusLabel: "Not taking new applications",
      headline: `Serving its current group; it will reopen later. Call ${PHONES.habitat.number} to ask.`,
      source: SOURCES.habitat,
    },
    {
      ...base,
      id: "zero-loan",
      name: "Detroit 0% Interest Home Repair Loans",
      shortName: "0% Home Repair Loans",
      status: "closed",
      statusLabel: "Wound down June 2026",
      headline: "The 0% loan program wound down in June 2026. Confirm before you apply.",
      source: SOURCES.zeroLoan,
    },
  ];
}

const ORDER: Record<Situation, string[]> = {
  backup: ["claim", "asrp", "psrp", "chr", "hope"],
  "broken-line": ["asrp", "psrp", "chr", "claim", "hope"],
  checking: ["asrp", "psrp", "chr", "hope", "claim"],
};

export function buildPrograms(inputs: Inputs, situation: Situation, now = new Date()): ProgramCard[] {
  const cards = [asrp(inputs), psrp(inputs), chr(now), claim(), hope(now, inputs.parcel)];
  const byId = new Map(cards.map((c) => [c.id, c]));
  return [...ORDER[situation].map((id) => byId.get(id)!), ...unavailable()];
}
