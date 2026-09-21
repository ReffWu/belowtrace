// Where the $184M is going, reconstructed from the City's own published criteria.
//
// DWSD selects alleys for the Alley Sewer Repair Program using CCTV-confirmed lateral defects,
// recorded cave-ins, and federal low/moderate-income rules, then rolls them out in phases. It
// publishes the criteria. It does not publish the list, and the 30,000+ failed-lateral data
// points behind it are not in any open dataset — we checked all 782 services on the City's
// ArcGIS org; only catch basins and gravity mains are public.
//
// So this does not predict DWSD's decision. It measures the criteria that ARE public at one
// address and says where that address sits relative to the 138 alleys already under contract.
// The unobservable criterion — the CCTV evidence — is stated as unobservable, every time.
import calibration from "@/data/asrp-calibration.json";

export const ASRP = {
  total: 184_421_000,
  connections: 9000,
  years: 4,
  perConnection: Math.round(184_421_000 / 9000),
  fieldWorkStarts: "October 2026",
  knownDefectPoints: 30_000,
} as const;

export const CALIBRATION = calibration;

export type AsrpVerdict = "underway" | "possible" | "unlikely" | "no-work-yet";

export type AsrpSignal = {
  /** What we measured. */
  label: string;
  value: string;
  /** How it compares to the alleys already chosen. */
  note: string;
  met: boolean | null;
};

export type AsrpAssessment = {
  verdict: AsrpVerdict;
  headline: string;
  advice: string;
  signals: AsrpSignal[];
  district: number | null;
  districtSelected: number;
  nearestWorkM: number | null;
};

export type AsrpInputs = {
  district: number | null;
  caveIns500: number;
  water500: number;
  /** Meters to the nearest alley already under contract, null when none is near. */
  nearestWorkM: number | null;
  /** HUD low/mod income share for the block group, 0–1. null when the lookup failed. */
  lowModPct: number | null;
};

const counts = CALIBRATION.districtCounts as Record<string, number>;

export function assessAsrp(i: AsrpInputs): AsrpAssessment {
  const districtSelected = i.district ? (counts[String(i.district)] ?? 0) : 0;
  const lmiMet = i.lowModPct === null ? null : i.lowModPct >= 0.5;
  const caveMet = i.caveIns500 >= CALIBRATION.caveIns.p25;
  // The note must describe the threshold that was actually applied, not a different statistic.
  const caveNote =
    i.caveIns500 >= CALIBRATION.caveIns.median
      ? `At or above the median of the alleys already chosen (${CALIBRATION.caveIns.median}).`
      : caveMet
        ? `Inside the range of the alleys already chosen, but below their median of ${CALIBRATION.caveIns.median}.`
        : `Below the bottom quarter of the alleys already chosen (${CALIBRATION.caveIns.p25}). Cave-ins are the signal DWSD says it prioritizes.`;

  const signals: AsrpSignal[] = [
    {
      label: "Alley cave-ins reported nearby",
      value: `${i.caveIns500} within ${CALIBRATION.radiusM} m`,
      note: caveNote,
      met: caveMet,
    },
    {
      // The whole point of the calibration, brought down to one address: the program does not
      // track this number, and a household with a lot of it may still never be reached.
      label: "Basement flooding reported nearby",
      value: `${i.water500} within ${CALIBRATION.radiusM} m`,
      note:
        i.water500 > CALIBRATION.water.median * 1.5
          ? `Well above the alleys already chosen (median ${CALIBRATION.water.median}). The selection does not track this number — cave-ins are what it follows.`
          : `The alleys already chosen have a median of ${CALIBRATION.water.median}. This is not a criterion DWSD selects on.`,
      met: null,
    },
    {
      label: "Low/moderate income block group",
      value: i.lowModPct === null ? "Lookup unavailable" : `${Math.round(i.lowModPct * 100)}%`,
      note: "Federal funding requires the area to be above 50%.",
      met: lmiMet,
    },
    {
      label: "Council district",
      value: i.district ? `District ${i.district}` : "Unknown",
      note:
        districtSelected > 0
          ? `${districtSelected} of the first 138 alleys are in this district.`
          : "No alley in this district is in the first round of contracts.",
      met: districtSelected > 0 ? true : i.district ? false : null,
    },
    {
      label: "Nearest alley already under contract",
      value: i.nearestWorkM === null ? "None within 2 km" : `${fmtM(i.nearestWorkM)}`,
      note: "Work is rolled out area by area, so nearby contracts matter.",
      met: i.nearestWorkM !== null && i.nearestWorkM <= 800,
    },
    {
      label: "DWSD camera evidence for your connection",
      value: "Not public",
      note: `DWSD holds ${ASRP.knownDefectPoints.toLocaleString("en-US")}+ failed-connection data points. None of them are published, so nobody outside DWSD can check this one.`,
      met: null,
    },
  ];

  if (i.nearestWorkM !== null && i.nearestWorkM <= 400) {
    return {
      verdict: "underway",
      headline: "Work is already contracted on your block.",
      advice:
        "Call DWSD before you pay anyone. If your connection is among the defects their camera finds, this repair is free to you, and paying for it yourself now would be money you never get back.",
      signals,
      district: i.district,
      districtSelected,
      nearestWorkM: i.nearestWorkM,
    };
  }

  if (districtSelected === 0) {
    return {
      verdict: "no-work-yet",
      headline: i.district ? `Nothing in District ${i.district} yet.` : "No contracted work near this address.",
      advice:
        "The first round of contracts skipped this district entirely. There are three more years of the program, so this can change — but nothing is scheduled today, and nobody will tell you when it is. Do not plan around it.",
      signals,
      district: i.district,
      districtSelected,
      nearestWorkM: i.nearestWorkM,
    };
  }

  const strong = caveMet && lmiMet !== false;
  return {
    verdict: strong ? "possible" : "unlikely",
    headline: strong ? "This address matches what DWSD has been choosing." : "This address does not look like what DWSD has been choosing.",
    advice: strong
      ? "Worth one phone call before you spend anything. Ask whether your alley is in a current or upcoming contract — there is no list you can look up."
      : "Call anyway, because DWSD holds camera evidence nobody else can see. But do not wait on it: on the public criteria, this address is not where the first round went.",
    signals,
    district: i.district,
    districtSelected,
    nearestWorkM: i.nearestWorkM,
  };
}

const fmtM = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km away` : `${Math.round(m / 10) * 10} m away`);

export const VERDICT_TONE: Record<AsrpVerdict, "good" | "warn" | "stop" | "info"> = {
  underway: "good",
  possible: "info",
  unlikely: "warn",
  "no-work-yet": "stop",
};
