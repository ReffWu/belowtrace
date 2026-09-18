import { CHR_CLOSES, PHONES } from "./facts";
import type { Report, Situation } from "./types";

export type GlanceItem = { tone: "act" | "good" | "warn" | "info"; text: string; href: string };

// The handful of sentences a resident needs if they read nothing else.
export function atAGlance(r: Report, situation: Situation, now = new Date()): GlanceItem[] {
  const items: GlanceItem[] = [];

  if (situation === "backup") {
    items.push({
      tone: "act",
      text: `Call DWSD at ${PHONES.dwsd.number} today and ask for a Service Request number. You need it to file a damage claim, and you have 45 days.`,
      href: "#next-steps",
    });
  }

  items.push({
    tone: "info",
    text: "The sewer line from your house to the city sewer in the alley is yours to maintain. The City owns the sewer under the alley.",
    href: "#responsibility",
  });

  const activeAlleyWork = r.projects.find((p) => p.isAlley && p.phase !== "Closed");
  if (r.lmi?.meetsAsrpIncomeTest) {
    items.push({
      tone: "good",
      text: `Before you pay for a repair, ask DWSD if your alley is in the free Alley Sewer Repair Program. Your area meets the income test the City uses to pick alleys${
        activeAlleyWork ? `, and DWSD alley sewer work is already ${activeAlleyWork.phase === "Construction" ? "under construction" : "being bid"} ${activeAlleyWork.distanceM} m away` : ""
      }.`,
      href: "#program-asrp",
    });
  } else if (r.lmi) {
    items.push({
      tone: "warn",
      text: "Your area is below the income test the City uses to pick alleys for its free repair program — but ask DWSD anyway before you pay.",
      href: "#program-asrp",
    });
  }

  if (r.psrpNeighborhood.inProgram && !r.floodZone.isSFHA) {
    items.push({
      tone: "good",
      text: `You're in ${r.psrpNeighborhood.name}, so you may qualify for up to $40,000 from the Private Sewer Repair Program. Check in about 2 minutes.`,
      href: "#psrp-screener",
    });
  } else {
    items.push({
      tone: "warn",
      text: "This address is outside the Private Sewer Repair Program's area, so its $40,000 grants aren't an option here.",
      href: "#program-psrp",
    });
  }

  if (now < new Date(CHR_CLOSES)) {
    const days = Math.ceil((new Date(CHR_CLOSES).getTime() - now.getTime()) / 86_400_000);
    items.push({
      tone: "act",
      text: `Critical Home Repair pre-applications close Tuesday, Sep 22 at 5 PM (${days <= 1 ? "less than a day" : `${days} days`} left). It covers severe plumbing problems for eligible owners.`,
      href: "#program-chr",
    });
  }

  if (r.nearestMain?.installYear) {
    items.push({
      tone: "info",
      text: `The nearest city sewer on record, ${r.nearestMain.distanceM} m from your home, was laid in ${r.nearestMain.installYear}.`,
      href: "#records",
    });
  }
  if (r.reports311.waterInBasement >= 3) {
    items.push({
      tone: "info",
      text: `${r.reports311.waterInBasement} water-in-basement reports were filed with 311 within ${r.reports311.radiusM} m of you since 2023. You're not the only one.`,
      href: "#records",
    });
  }

  return items;
}
