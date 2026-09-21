// PSRP eligibility screener. Rules follow the City's PSRP Program Guide (amended 9/1/2025)
// and Policy & Procedure (4/13/2026). Page numbers refer to the 2025 guide.
import { INCOME_LIMITS } from "./facts";

export type Ownership = "owner-occupant" | "landlord" | "renter";
export type YesNo = "yes" | "no";
export type YesNoUnsure = "yes" | "no" | "unsure";
export type IncomeBand = "under50" | "50to80" | "over80";
export type FloodProof = "insurance" | "fema" | "sba" | "dwsd-claim" | "contractor-invoice";

export type PsrpAnswers = {
  ownership?: Ownership;
  ownedSixMonths?: YesNo;
  householdSize?: number;
  income?: IncomeBand;
  flooded2021?: YesNoUnsure;
  floodProof?: FloodProof[];
  taxesCurrent?: YesNoUnsure;
  otherAssistance?: YesNo;
};

export type PsrpAuto = {
  inNeighborhood: boolean;
  neighborhoodName: string | null;
  isSFHA: boolean | null;
  residential: boolean | null;
};

export type Check = { status: "pass" | "fail" | "warn"; text: string; cite?: string };

export type PsrpResult = {
  verdict: "likely" | "possible" | "unlikely";
  summary: string;
  checks: Check[];
  documents: string[];
  complete: boolean;
};

export const QUESTION_ORDER: (keyof PsrpAnswers)[] = [
  "ownership",
  "ownedSixMonths",
  "householdSize",
  "income",
  "flooded2021",
  "floodProof",
  "taxesCurrent",
  "otherAssistance",
];

export function incomeLimitsFor(householdSize: number) {
  const i = Math.min(Math.max(Math.round(householdSize), 1), 8) - 1;
  return { veryLow50: INCOME_LIMITS.veryLow50[i], low80: INCOME_LIMITS.low80[i] };
}

// Which questions still apply given earlier answers (renters stop after question 1).
export function activeQuestions(a: PsrpAnswers): (keyof PsrpAnswers)[] {
  if (a.ownership === "renter") return ["ownership"];
  return QUESTION_ORDER.filter((q) => q !== "floodProof" || a.flooded2021 !== "no");
}

export function evaluatePsrp(a: PsrpAnswers, auto: PsrpAuto): PsrpResult {
  const checks: Check[] = [];
  let hardFail = false;
  let soft = false;

  if (auto.inNeighborhood) {
    checks.push({ status: "pass", text: `Your address is in ${auto.neighborhoodName ?? "a"}, one of the 97 program neighborhoods.`, cite: "Guide p.4" });
  } else {
    hardFail = true;
    checks.push({ status: "fail", text: "Your address is not in one of the 97 program neighborhoods.", cite: "Guide p.4, p.8" });
  }

  if (auto.isSFHA === true) {
    hardFail = true;
    checks.push({ status: "fail", text: "FEMA maps this property in a Special Flood Hazard Area; the program excludes floodplain homes.", cite: "Guide p.4, p.12" });
  } else if (auto.isSFHA === false) {
    checks.push({ status: "pass", text: "Not in a FEMA floodplain.", cite: "Guide p.4" });
  } else {
    soft = true;
    checks.push({ status: "warn", text: "We could not verify the FEMA flood-zone status. Ask PSRP staff to confirm it before relying on this screen.", cite: "Guide p.4" });
  }

  if (auto.residential === false) {
    soft = true;
    checks.push({ status: "warn", text: "City records don't list this parcel as a 1 to 4 unit residential home. Only 1 to 4 unit homes qualify.", cite: "Guide p.4, p.7" });
  } else if (auto.residential === true) {
    checks.push({ status: "pass", text: "City records list this as a residential parcel.", cite: "Guide p.4, p.7" });
  } else {
    soft = true;
    checks.push({ status: "warn", text: "City records do not confirm whether this is a 1 to 4 unit residential property. Ask PSRP staff to confirm it.", cite: "Guide p.4, p.7" });
  }

  if (a.ownership === "renter") {
    return {
      verdict: hardFail ? "unlikely" : "possible",
      summary: hardFail
        ? "This address has a program requirement that may not match. A tenant may still ask PSRP staff whether an owner-consent path is available."
        : "A tenant may apply with the property owner’s consent. Confirm the application path with PSRP before gathering documents.",
      checks: [
        ...checks,
        {
          status: "warn",
          text: "Ask PSRP staff whether an owner-consent application path is available and what the owner must provide.",
          cite: "Guide p.5 to 6",
        },
      ],
      documents: ["A signed lease", "Written consent or contact information from the property owner"],
      complete: true,
    };
  }

  if (a.ownership === "landlord") {
    checks.push({ status: "warn", text: "As a landlord, help comes as a 5-year forgivable loan. Your tenants must be at or below 80% of area median income and the rental must be registered with BSEED.", cite: "Guide p.5 to 7" });
  }

  if (a.ownedSixMonths === "no") {
    hardFail = true;
    checks.push({ status: "fail", text: "You need to have owned the home for at least 6 months when you apply.", cite: "Guide p.12" });
  } else if (a.ownedSixMonths === "yes") {
    checks.push({ status: "pass", text: "Owned for 6+ months.", cite: "Guide p.12" });
  }

  if (a.income && a.householdSize) {
    const { veryLow50, low80 } = incomeLimitsFor(a.householdSize);
    const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;
    if (a.income === "under50") {
      checks.push({ status: "pass", text: `Income under ${fmt(veryLow50)} for ${a.householdSize}, meets both income limits the City lists.`, cite: "Guide p.3 to 4, p.10" });
    } else if (a.income === "50to80") {
      soft = true;
      checks.push({
        status: "warn",
        text: `Income between ${fmt(veryLow50)} and ${fmt(low80)}. The City's own guide lists 80% of area median income on p.3 to 4 but 50% on p.10. Ask the program which applies, don't rule yourself out.`,
        cite: "Guide p.3 to 4 vs p.10",
      });
    } else {
      hardFail = true;
      checks.push({ status: "fail", text: `Income over ${fmt(low80)} for ${a.householdSize}, above the program's highest listed limit.`, cite: "Guide p.3 to 4" });
    }
  }

  if (a.flooded2021 === "no") {
    hardFail = true;
    checks.push({ status: "fail", text: "The program is federal disaster money: you must show the June 25 to 26, 2021 flood affected your home.", cite: "Guide p.4, p.12" });
  } else if (a.flooded2021 === "unsure") {
    soft = true;
    checks.push({ status: "warn", text: "Not sure about the June 2021 flood? Staff can review other proof, and you may be able to sign an affidavit.", cite: "Guide p.5" });
  } else if (a.flooded2021 === "yes") {
    if (a.floodProof && a.floodProof.length > 0) {
      checks.push({ status: "pass", text: "You have proof from June to September 2021.", cite: "Guide p.4 to 5" });
    } else if (a.floodProof) {
      soft = true;
      checks.push({ status: "warn", text: "No 2021 claim or invoice? Other proof can be reviewed, and you may be asked to sign an affidavit.", cite: "Guide p.5" });
    }
  }

  if (a.taxesCurrent === "no" || a.taxesCurrent === "unsure") {
    soft = true;
    checks.push({
      status: "warn",
      text: "You need current property taxes or a payment plan / HOPE exemption. Behind? Apply for HOPE first, it can wipe out this year's taxes for low-income homeowners.",
      cite: "Guide p.12",
    });
  } else if (a.taxesCurrent === "yes") {
    checks.push({ status: "pass", text: "Property taxes current or on a plan.", cite: "Guide p.12" });
  }

  if (a.otherAssistance === "yes") {
    soft = true;
    checks.push({ status: "warn", text: "Other assistance for the same repair must be disclosed. Ask the program how it affects its duplication-of-benefits review.", cite: "Guide p.14" });
  }

  const complete = activeQuestions(a).every((q) => a[q] !== undefined);
  const verdict: PsrpResult["verdict"] = hardFail ? "unlikely" : soft || !complete ? "possible" : "likely";
  const summary =
    verdict === "likely"
      ? "Your answers appear consistent with the screen. Gather the documents below and apply; only the City can determine eligibility and any later document deadline."
      : verdict === "possible"
        ? "You might qualify. Check the yellow items with the program before you give up."
        : "You probably don't qualify for this program. See the other options on this page.";

  return { verdict, summary, checks, documents: documentsFor(a), complete };
}

export function documentsFor(a: PsrpAnswers): string[] {
  const docs = [
    "Photo ID for every household member 18+ (driver's license, State ID or Detroit ID)",
    "Proof you've owned the home 6+ months (recorded deed or land contract)",
    "Current paid property tax bill, or proof of a payment plan or HOPE application",
    "A utility bill or other mail from the last 2 weeks",
    "Current homeowner's / fire insurance policy (or a waiver)",
    "Income proof for every adult: latest signed tax return (1040) or IRS transcript",
    "Birth certificates (or guardianship papers) for dependents",
    "Duplication of Benefits certification form (the program provides it)",
  ];
  const proof = a.floodProof ?? [];
  const labels: Record<FloodProof, string> = {
    insurance: "your 2021 home insurance claim",
    fema: "your 2021 FEMA claim",
    sba: "your 2021 SBA claim",
    "dwsd-claim": "your 2021 DWSD water-in-basement claim",
    "contractor-invoice": "a licensed contractor's invoice from June to Sept 2021",
  };
  docs.push(
    proof.length
      ? `Proof of the June 2021 flood: ${proof.map((p) => labels[p]).join(", ")}`
      : "Proof of the June 2021 flood (claim or invoice dated June to Sept 2021), or ask about signing an affidavit",
  );
  if (a.ownership === "landlord") {
    docs.push("Signed lease and your tenants' income documents", "BSEED rental registration");
  }
  return docs;
}
