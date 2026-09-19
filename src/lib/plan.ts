import { CHR_CLOSES, PHONES, SOURCES } from "./facts";
import type { Report, Situation } from "./types";

export type Step = {
  id: string;
  title: string;
  detail: string;
  // ISO date string, or "claim" to compute 45 days from the date the backup was found.
  due?: string | "claim";
  dueLabel?: string;
  link?: { label: string; href: string };
  callScript?: {
    recipient: string;
    phone: string;
    goal: string;
    script: string[];
    whatNotToSay: string[];
  };
};

const tel = (n: string) => `tel:${n.replace(/\D/g, "")}`;

export function claimDeadline(foundOn: string) {
  const d = new Date(`${foundOn}T12:00:00`);
  d.setDate(d.getDate() + 45);
  return d;
}

export function buildPlan(r: Report, situation: Situation, now = new Date()): Step[] {
  const chrOpen = now < new Date(CHR_CLOSES);
  const inPsrp = r.psrpNeighborhood.inProgram && !r.floodZone.isSFHA;
  const dwsd: Step = {
    id: "call-dwsd",
    title: `Call DWSD at ${PHONES.dwsd.number}`,
    detail:
      situation === "backup"
        ? "Report the backup and write down your Service Request number. Ask them to check whether the problem is in the city sewer, and whether your alley is in the Alley Sewer Repair Program."
        : "Ask whether the problem could be at the city's alley sewer, and whether your alley is scheduled for the free Alley Sewer Repair Program (starts October 2026).",
    link: { label: `Call ${PHONES.dwsd.number}`, href: tel(PHONES.dwsd.number) },
    callScript: {
      recipient: "DWSD Dispatch / Customer Service",
      phone: PHONES.dwsd.number,
      goal: "Get an official Service Request number (SR#) and dispatch a field crew to inspect the municipal main.",
      script: [
        `"Hello, my name is [Your Name]. I am calling to report sewage backup and drain trouble at ${r.query}."`,
        r.nearestMain
          ? `"According to DWSD records, the sewer main serving my property was installed around ${r.nearestMain.installYear ?? "past records"} (${r.nearestMain.sizeIn ? `${r.nearestMain.sizeIn}-inch` : "main"}). Please send a crew to verify if the city's sewer line is blocked or backed up."`
          : `"Please send a field technician to inspect the municipal sewer line on my street/alley to confirm if the public main is backing up."`,
        `"Could you please give me the official Service Request (work order) number right now so I can record it for my 45-day claim window?"`,
        `"Can you also check if this address or alley is scheduled for the upcoming Alley Sewer Repair Program (ASRP)?"`,
      ],
      whatNotToSay: [
        "DO NOT say 'I think my toilet or private pipe might be clogged' — dispatch will label it a private plumbing issue and close the ticket.",
        "DO NOT hang up without the Service Request number — without it, future damage claims to the City are rejected.",
      ],
    },
  };
  const psrp: Step = {
    id: "psrp",
    title: inPsrp ? "Check the Private Sewer Repair Program (up to $40,000)" : "Look at other ways to pay",
    detail: inPsrp
      ? "Answer the 8 questions on this page, gather the documents on the checklist, then apply on Neighborly. Missing documents must be sent within 5 days of a request."
      : "Your address is outside the PSRP area. Ask DWSD about the alley program, and check Critical Home Repair if you qualify.",
    link: inPsrp ? { label: "Check if I qualify", href: "#psrp-screener" } : undefined,
  };
  const chr: Step | null = chrOpen
    ? {
        id: "chr",
        title: "Pre-apply for Critical Home Repair",
        detail: "For owner-occupants with a child under 18, a senior 62+, or a household member with a disability. Covers severe plumbing problems.",
        due: CHR_CLOSES,
        dueLabel: "Closes",
        link: { label: "Pre-apply on Neighborly", href: SOURCES.neighborly.url },
      }
    : null;

  const steps: (Step | null)[] =
    situation === "backup"
      ? [
          {
            id: "safe",
            title: "Stay safe",
            detail: "Keep children and pets out of the basement. Don't touch sewage without gloves and boots, and don't run water or flush until it drains.",
          },
          dwsd,
          {
            id: "photos",
            title: "Photograph everything and keep receipts",
            detail: "Take photos of the water line, damaged items and any cleanup costs before you throw anything away.",
          },
          {
            id: "claim",
            title: "File a DWSD damage claim",
            detail: "Use your Service Request number. Claims must be filed within 45 days of finding the backup.",
            due: "claim",
            dueLabel: "Due",
            link: { label: "Damage claims page", href: SOURCES.claims.url },
          },
          {
            id: "insurance",
            title: "Call your home insurance company",
            detail: "Ask whether your policy covers sewer backup. Any payout you get is subtracted from PSRP help later, so keep the paperwork.",
            link: { label: "What to ask insurance", href: "#" },
            callScript: {
              recipient: "Homeowners Insurance Claims Desk",
              phone: "Your policy phone number",
              goal: "Check if you have a Water/Sewer Backup rider without triggering an unnecessary claim record if below deductible.",
              script: [
                `"Hello, I am calling about policy for ${r.query}. Can you review my declaration page to check if I have a Sewer Backup or Sump Overflow endorsement?"`,
                `"What is my coverage limit and deductible for sewer backup?"`,
                `"If this is under the deductible, please don't file a formal claim yet — I just need to verify coverage limits."`,
              ],
              whatNotToSay: [
                "DO NOT say 'flood water entered from the street' if sewage came up from floor drains — standard policies cover sewer backup differently from surface flooding.",
              ],
            },
          },
          psrp,
          chr,
          {
            id: "camera",
            title: "Get a camera inspection before any digging",
            detail: "Only a camera (CCTV) inspection shows where your line is broken. If you qualify for PSRP, the program pays for it.",
          },
        ]
      : situation === "broken-line"
        ? [
            {
              id: "hold",
              title: "Don't sign a repair contract yet",
              detail: "Ask the plumber for the camera video and exactly where the break is: under your yard, or at the connection to the city sewer in the alley.",
            },
            dwsd,
            psrp,
            chr,
            {
              id: "quotes",
              title: "If you pay yourself, get two written quotes",
              detail: "Use a licensed plumber who pulls a permit, and keep the invoice and camera video. Programs ask for this paperwork.",
            },
          ]
        : [
            {
              id: "know",
              title: "Know which part is yours",
              detail: "Your line runs from the house to the city sewer, usually in the alley. Tree roots, age and shifting soil break these lines.",
            },
            {
              id: "scope",
              title: "Buying? Get a sewer camera inspection before closing",
              detail: "It costs a few hundred dollars and can reveal a $10,000–$25,000 repair.",
            },
            {
              id: "prevent",
              title: "Lower your risk",
              detail: "Disconnect downspouts that drain into the sewer, keep grease out of drains, and ask a plumber about a backwater valve.",
            },
            psrp,
            chr,
          ];

  return steps.filter((s): s is Step => s !== null);
}
