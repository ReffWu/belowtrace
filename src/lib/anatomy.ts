// Your home's drain, from the floor drain to the regional system, as six segments.
//
// This is the spine of the product. Detroit's money is not organised by "what happened to you"
//, it is organised by WHICH PART OF THE PIPE broke. Different segments have different owners,
// different symptoms, and entirely different funding, and no page anywhere lays them side by
// side. So: six segments, and for each one, who owns it, how you'd know it is that one, and who
// might pay.
import type { AsrpAssessment } from "./asrp";
import { ASRP } from "./asrp";
import { COSTS, PHONES, SOURCES } from "./facts";
import type { Report } from "./types";

export type Owner = "you" | "you-in-row" | "city" | "regional";

export type Payer = {
  name: string;
  amount: string;
  /** Where this address stands, when it can be determined. */
  status: "yes" | "maybe" | "no" | "unknown" | "info";
  detail: string;
  href?: string;
  phone?: string;
};

export type Segment = {
  id: string;
  n: number;
  name: string;
  where: string;
  owner: Owner;
  /** How a resident would know it is this segment and not another. */
  symptom: string;
  payers: Payer[];
  /** Only segment 4 carries the ASRP reading. */
  spotlight?: boolean;
};

export const OWNER_LABEL: Record<Owner, string> = {
  you: "Yours",
  "you-in-row": "Yours, but under public ground",
  city: "The City's",
  regional: "Regional",
};

export function anatomy(r: Report, asrp: AsrpAssessment): Segment[] {
  const inPsrp = r.psrpNeighborhood.inProgram && r.floodZone.isSFHA !== true;
  const main = r.nearestMain;

  return [
    {
      id: "fixtures",
      n: 1,
      name: "Pipes inside the house",
      where: "Sinks, toilets, the stack, the floor drain",
      owner: "you",
      symptom: "One fixture is slow or backs up, and everything else drains fine.",
      payers: [
        { name: "You", amount: COSTS.snaking, status: "info", detail: "A plumber's snake. The cheapest thing on this page." },
        {
          name: "MDHHS State Emergency Relief",
          amount: "Varies",
          status: "unknown",
          detail:
            "Emergency help for essential home repairs. Michigan does not publish which contractors accept it, so expect to call several.",
          phone: PHONES.wayneMetro.number,
        },
      ],
    },
    {
      id: "building-drain",
      n: 2,
      name: "The building drain",
      where: "Under the basement floor, out to the foundation wall",
      owner: "you",
      symptom: "Every drain in the house backs up at once, and it comes up through the floor drain first.",
      payers: [
        {
          name: "Basement Backup Protection Program",
          amount: "Backwater valve + sump pump",
          status: "unknown",
          detail:
            "Free in 11 flood-prone neighborhoods. Confirm the current round with DWSD, a valve will not help until the line beyond it is sound, which is what stalled the first phase.",
          href: SOURCES.bbpp.url,
          phone: PHONES.dwsd.number,
        },
        { name: "You", amount: "$2,000 to 4,000", status: "info", detail: "A backwater valve installed privately." },
      ],
    },
    {
      id: "lateral",
      n: 3,
      name: "Your private sewer lateral",
      where: "From the foundation to the property line",
      owner: "you",
      symptom: "Your home backs up but the neighbors' do not, or it backs up on dry days.",
      payers: [
        {
          name: "Private Sewer Repair Program",
          amount: "Up to $30,000",
          status: inPsrp ? "maybe" : "no",
          detail: inPsrp
            ? `This address is inside ${r.psrpNeighborhood.name}. Four more conditions decide it, including proof the June 2021 flood damaged this home. Apply before signing anything, it cannot pay for work already started.`
            : !r.psrpNeighborhood.inProgram
              ? "This address is outside the 97 neighborhoods the program serves."
              : "Homes in a FEMA floodplain cannot apply, and this one is in one.",
          href: SOURCES.psrp.url,
          phone: PHONES.hrd.number,
        },
        { name: "You", amount: COSTS.lateral, status: "info", detail: "Excavation and replacement, paid privately." },
      ],
    },
    {
      id: "connection",
      n: 4,
      name: "The connection to the city sewer",
      where: `From the property line to the main under the alley${main ? `, about ${main.distanceM} m out` : ""}`,
      owner: "you-in-row",
      symptom: "Repeat backups, and the alley behind you is sinking or has been patched.",
      spotlight: true,
      payers: [
        {
          name: "Alley Sewer Repair Program",
          amount: "Free, the City pays",
          status: asrp.verdict === "underway" ? "yes" : asrp.verdict === "possible" ? "maybe" : "no",
          detail: asrp.advice,
          href: SOURCES.asrp.url,
          phone: PHONES.dwsd.number,
        },
        {
          name: "You",
          amount: `$5,000 to 25,000`,
          status: "info",
          detail: `The City budgets about $${ASRP.perConnection.toLocaleString("en-US")} per connection. Paying for one yourself, in the month before a contract reaches your alley, is the most expensive mistake on this page.`,
        },
      ],
    },
    {
      id: "main",
      n: 5,
      name: "The public sewer main",
      where: main ? `Under the alley, ${main.installYear ? `laid ${main.installYear}, ` : ""}${main.materialLabel ?? "material not recorded"}` : "Under the alley or street",
      owner: "city",
      symptom: "The whole block backs up at the same time, wet weather or dry.",
      payers: [
        {
          name: "DWSD",
          amount: "No cost to you",
          status: "yes",
          detail: "The City maintains the public main. Report it and get a service request number, that number is also what a damage claim needs.",
          phone: PHONES.dwsd.number,
          href: SOURCES.maintenance.url,
        },
      ],
    },
    {
      id: "system",
      n: 6,
      name: "The regional system's capacity",
      where: "Detroit's combined sewers, draining into GLWA's regional system",
      owner: "regional",
      symptom: "It only happens in heavy rain, and it happens to many homes at once.",
      payers: [
        {
          name: "Damage claim",
          amount: "Your losses, not the pipe",
          status: "info",
          detail:
            "Michigan gives you 45 days from discovery to put a claim in writing, to the City and separately to GLWA. It compensates damage; it never pays to fix the pipe. GLWA denied all 24,000 claims from the 2021 flood.",
          href: "/notice",
        },
        {
          name: "Nobody, for the cause",
          amount: ",",
          status: "info",
          detail: "The Alley Sewer Repair Program does not add capacity. When rain exceeds what the system was built for, a sound connection still backs up.",
        },
      ],
    },
  ];
}

/** The one line at the top of the report. */
export function verdictLine(asrp: AsrpAssessment, inPsrp: boolean): { headline: string; sub: string } {
  if (asrp.verdict === "underway")
    return {
      headline: "Do not pay for this yet.",
      sub: "The City has already contracted work on your block. If your connection is one of the defects their camera finds, it is repaired at no cost to you.",
    };
  if (asrp.verdict === "possible")
    return {
      headline: "Make one phone call before you spend anything.",
      sub: "On the criteria DWSD publishes, this address looks like the alleys it has been choosing. There is no list to look up, so the call is the only way to find out.",
    };
  if (inPsrp)
    return {
      headline: "Do not wait for the alley program. Apply to the other one.",
      sub: "Nothing near this address is contracted, and on the public criteria it is not where the first round went. But this address is inside the Private Sewer Repair Program's area, and that one you can apply to.",
    };
  return {
    headline: "Nothing is coming to this address. Plan as if you are on your own.",
    sub: "No contracted work nearby, and outside the repair program's neighborhoods. That can change over three more years, but nobody will tell you if it does, so do not build a plan around it.",
  };
}
