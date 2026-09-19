// Turns a report into the few things one resident needs: which programs fit this home and
// this problem, and why the others don't. Every sentence is tied to an address fact or a rule.
import { CHR_CLOSES, HOPE_DEADLINE, PHONES, SOURCES } from "./facts";
import type { Report, Situation } from "./types";

export type BreakAt = "alley" | "yard" | "unsure";

export type Fit = {
  id: string;
  name: string;
  amount: string;
  why: string;
  action: { label: string; href: string };
  deadline?: string;
  screener?: boolean;
};

export type Checked = { name: string; reason: string; href: string };

const tel = (n: string) => `tel:${n.replace(/\D/g, "")}`;

export const parseBreak = (v: unknown): BreakAt => (v === "alley" || v === "yard" ? v : "unsure");

export function psrpFits(r: Pick<Report, "psrpNeighborhood" | "floodZone" | "parcel">) {
  const residential = r.parcel?.propertyClass ? /RESIDENTIAL/i.test(r.parcel.propertyClass) : true;
  return r.psrpNeighborhood.inProgram && r.floodZone.isSFHA !== true && residential;
}

export function whoCanPay(r: Pick<Report, "psrpNeighborhood" | "floodZone" | "parcel" | "lmi" | "projects">, situation: Situation, breakAt: BreakAt = "unsure", now = new Date()): { fits: Fit[]; checked: Checked[] } {
  const fits: Fit[] = [];
  const checked: Checked[] = [];
  const alleyWork = r.projects.find((p) => p.isAlley && p.phase !== "Closed");

  // Alley Sewer Repair: free, no application; DWSD picks alleys from its own camera work.
  const asrp: Fit = {
    id: "asrp",
    name: "Alley Sewer Repair Program",
    amount: "Free",
    why:
      breakAt === "alley"
        ? "A break where your line meets the alley sewer is exactly what this $184M City program fixes. DWSD picks the alleys, so ask if yours is on the list."
        : alleyWork
          ? `DWSD alley sewer work is already ${alleyWork.phase === "Construction" ? "under way" : "being bid"} ${alleyWork.distanceM} m from you. Ask whether your alley is next.`
          : r.lmi
            ? "Your area meets the income test the City uses to choose alleys for this $184M program. Ask DWSD if yours is on the list before you pay."
            : "DWSD picks alleys for this free $184M program from its own camera inspections. Ask if yours is on the list before you pay.",
    action: { label: `Call DWSD ${PHONES.dwsd.number}`, href: tel(PHONES.dwsd.number) },
  };
  if (breakAt === "alley" || alleyWork || r.lmi?.meetsAsrpIncomeTest || !r.lmi) {
    fits.push(asrp);
  } else {
    checked.push({ name: asrp.name, reason: "Your area is below the income test the City uses to pick alleys. DWSD still decides, so it's worth one call.", href: SOURCES.asrp.url });
  }

  // Private Sewer Repair: up to $40,000, only in 97 neighborhoods, never in a floodplain.
  if (psrpFits(r)) {
    const psrp: Fit = {
      id: "psrp",
      name: "Private Sewer Repair Program",
      amount: "Up to $40,000",
      why: `It's for homes hit by the June 2021 flood, and you're in ${r.psrpNeighborhood.name}, one of the 97 neighborhoods it serves. Eight questions tell you if you're likely to qualify.`,
      action: { label: "Check if I qualify", href: "#psrp" },
      screener: true,
    };
    // A break under the yard is the program's core case; lead with it.
    if (breakAt === "yard") fits.unshift(psrp);
    else fits.push(psrp);
  } else {
    checked.push({
      name: "Private Sewer Repair Program",
      reason: !r.psrpNeighborhood.inProgram
        ? "Only open to 97 neighborhoods, and this address isn't in one."
        : r.floodZone.isSFHA
          ? "Homes in a FEMA floodplain can't apply, and this one is in one."
          : "Only 1–4 unit homes qualify, and City records list this parcel differently.",
      href: SOURCES.psrp.url,
    });
  }

  // Critical Home Repair: broad, time-boxed, household-dependent.
  const chrOpen = now < new Date(CHR_CLOSES);
  if (chrOpen && situation !== "checking") {
    fits.push({
      id: "chr",
      name: "Critical Home Repair",
      amount: "Urgent repairs",
      why: "If you own and live here and someone at home is 62 or older, under 18, or has a disability. Selected homes get their most critical repairs, including severe plumbing.",
      action: { label: "Pre-apply on Neighborly", href: SOURCES.neighborly.url },
      deadline: CHR_CLOSES,
    });
  } else {
    checked.push({
      name: "Critical Home Repair",
      reason: chrOpen ? "For urgent repairs only; pre-applications close Tue, Sep 22 at 5 PM." : "This round closed Sep 22. Watch for the next one.",
      href: SOURCES.chr.url,
    });
  }

  if (situation !== "backup") {
    checked.push({ name: "DWSD damage claim", reason: "Only for sewage backups. It pays for damage when the city sewer caused it.", href: SOURCES.claims.url });
  }
  checked.push({
    name: "HOPE property tax exemption",
    reason:
      now < new Date(HOPE_DEADLINE)
        ? "Only matters if you're behind on property taxes. Repair programs require them to be current. Due Nov 6."
        : "Only matters if you're behind on property taxes. Closed for 2026.",
    href: SOURCES.hope.url,
  });
  checked.push({ name: "Basement Backup Protection", reason: "Closed. Reopens only with new funding.", href: SOURCES.bbpp.url });
  checked.push({ name: "Habitat Detroit home repair", reason: "Not taking new applications.", href: SOURCES.habitat.url });
  checked.push({ name: "0% home repair loans", reason: "Wound down in June 2026.", href: SOURCES.zeroLoan.url });

  return { fits, checked };
}
