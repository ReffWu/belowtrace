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
    factTips: string[];
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
      goal: "Report the issue, get a Service Request number (SR#), and ask how DWSD will inspect it.",
      script: [
        `"Hello, my name is [Your Name]. I am calling to report sewage backup and drain trouble at ${r.query}. I do not know the cause yet."`,
        r.nearestMain
          ? `"DWSD records show a city sewer near my property installed around ${r.nearestMain.installYear ?? "an unknown year"}. Please send a crew to check whether the city sewer serving my home is blocked or backed up."`
          : `"Please send a field technician to inspect the municipal sewer line on my street/alley to confirm if the public main is backing up."`,
        `"Could you please give me the official Service Request (work order) number and explain the next step for this report?"`,
        `"Can you also check if this address or alley is scheduled for the upcoming Alley Sewer Repair Program (ASRP)?"`,
      ],
      factTips: [
        "Write down the Service Request number if one is issued, the representative's name, and what they say will happen next. Use only facts you observed when describing the backup.",
      ],
    },
  };
  const psrp: Step = {
    id: "psrp",
    title: inPsrp ? "Check the Private Sewer Repair Program (up to $40,000)" : "Look at other ways to pay",
    detail: inPsrp
      ? "Use the screener as preparation, then check the official conditions and apply on Neighborly. Record any document request and its exact deadline from the notice you receive."
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
            detail: "Do not enter standing water near a fuse box, electrical appliances, outlets, or wires. From a safe place, record the discovery time and take photos before cleanup.",
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
            detail: "Use your Service Request number. Ask DWSD for the current claim procedure and any deadline that applies to your situation.",
            due: "claim",
            dueLabel: "Due",
            link: { label: "Damage claims page", href: SOURCES.claims.url },
          },
          {
            id: "insurance",
            title: "Call your home insurance company",
            detail: "Ask whether your policy covers sewer backup and keep the paperwork. If you also apply for a public program, disclose other assistance when the official application asks for it.",
            callScript: {
              recipient: "Homeowners Insurance Claims Desk",
              phone: "Your policy phone number",
              goal: "Check whether your policy includes a Water/Sewer Backup rider and understand the insurer's claim procedure.",
              script: [
                `"Hello, I am calling about policy for ${r.query}. Can you review my declaration page to check if I have a Sewer Backup or Sump Overflow endorsement?"`,
                `"What is my coverage limit and deductible for sewer backup?"`,
              ],
              factTips: [
                "Describe where the water entered, when you found it, and what you observed. If you do not know the cause, say it is still being investigated.",
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
              detail: "It costs a few hundred dollars and can reveal a $5,000–$20,000 repair.",
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
