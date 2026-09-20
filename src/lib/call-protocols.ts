import { PHONES } from "./facts";

export type CallProtocol = {
  id: string;
  agency: string;
  phone: string;
  phoneDisplay: string;
  hours: string;
  goal: string;
  haveReady: string[];
  openingScript: string;
  keyQuestions: string[];
  watchOut: string;
  nextStep: string;
};

export type CallContext = {
  address?: string;
  hood?: string;
  streetName?: string;
  mainYear?: number | null;
  mainSizeIn?: number | null;
};

const PROTOCOLS: Record<string, (ctx: CallContext) => CallProtocol> = {
  asrp: (ctx) => {
    const addr = ctx.address ? `my home at ${ctx.address}` : "my property";
    return {
      id: "asrp",
      agency: "DWSD Customer Care & Capital Improvement",
      phone: PHONES.dwsd.number,
      phoneDisplay: PHONES.dwsd.number,
      hours: "Confirm current hours with DWSD",
      goal: "Ask whether public work or an inspection is recorded for your address or alley.",
      haveReady: [
        "Exact property address and parcel number (if known)",
        "The cross streets / rear alley location behind your home",
        "Your DWSD water account number (if applicable)",
      ],
      openingScript: `“Hello, I am calling about ASRP for ${addr}. Can you tell me whether any city work or inspection is scheduled for my address or alley? I do not know whether the problem is public or private.”`,
      keyQuestions: [
        "“Has DWSD logged a closed-circuit camera (CCTV) inspection for the alley sewer behind my parcel?”",
        "“If my block is not currently on the schedule, can you log a service request to inspect the alley connection for cave-ins?”",
        "“Who is the assigned capital project manager or liaison for alley sewer rehabilitation in my neighborhood?”",
      ],
      watchOut:
        "Describe only what you observed. If you are unsure whether the problem is public or private, say so and ask how the representative will classify the request.",
      nextStep: "Note the representative's name and inquiry reference number. If a camera check is scheduled, ask for the expected inspection timeframe.",
    };
  },

  psrp: (ctx) => {
    const addr = ctx.address ? `for my home at ${ctx.address}` : "for my home";
    const hoodText = ctx.hood ? ` in the ${ctx.hood} neighborhood` : "";
    return {
      id: "psrp",
      agency: "City of Detroit Housing & Revitalization Dept. (CDBG-DR)",
      phone: PHONES.hrd.number,
      phoneDisplay: PHONES.hrd.number,
      hours: "Confirm current hours and application support with HRD",
      goal: "Verify current PSRP intake, official eligibility conditions, and available application help.",
      haveReady: [
        "Recorded property deed or property transfer affidavit (must show your name)",
        "Proof of household income (2025 W-2, 1040 tax return, or SSA-1099 for all adults)",
        "Documentation or photos of past basement flood impact (June 2021 storm)",
        "Proof of property tax compliance (current taxes or active HOPE/payment plan)",
      ],
      openingScript: `“Hello, I want to ask whether PSRP may be available ${addr}${hoodText}, and what I need to verify before applying.”`,
      keyQuestions: [
        "“Can an intake coordinator assist me over the phone or at a recreation center if I need help uploading documents to the Neighborly portal?”",
        "“Does an active HOPE exemption or Wayne County tax payment plan satisfy the property tax eligibility requirement?”",
        "“What is the current review timeline after submitting the full application packet?”",
      ],
      watchOut:
        "Answer property-tax questions truthfully. Ask whether a HOPE application or payment plan can satisfy a program requirement.",
      nextStep: "Gather your deed and income documents into clear PDF or print copies. If applying online, create your account at portal.neighborlysoftware.com/cityofdetroitmi.",
    };
  },

  chr: (ctx) => {
    const addr = ctx.address ? `at ${ctx.address}` : "";
    return {
      id: "chr",
      agency: "HRD Housing Call Center (Critical Home Repair)",
      phone: PHONES.hrd.number,
      phoneDisplay: PHONES.hrd.number,
      hours: "Confirm current hours and application support with HRD",
      goal: "Confirm whether Critical Home Repair is accepting applications and what its official conditions are.",
      haveReady: [
        "Proof of primary residency and home ownership",
        "Identification for all household members (showing seniors 62+, children under 18, or disability documentation)",
        "Proof of current household income",
      ],
      openingScript: `“Hello, I want to ask whether Critical Home Repair may be available for an underground plumbing or sewer issue at my home ${addr}, and how I can confirm the intake deadline.”`,
      keyQuestions: [
        "“What priority weighting is given to households with seniors or disabled occupants experiencing severe sewer backups?”",
        "“If the current pre-application round has closed, when will the next intake window open for emergency repairs?”",
      ],
      watchOut:
        "Make sure to explicitly mention qualifying household members (children under 18, seniors 62+, or persons with disabilities) — this is a key statutory scoring factor for program selection.",
      nextStep: "Submit the pre-application on Neighborly prior to the 5:00 PM deadline or request confirmation of intake receipt.",
    };
  },

  claim: (ctx) => {
    const addr = ctx.address ? `at ${ctx.address}` : "my home";
    return {
      id: "claim",
      agency: "DWSD Emergency Dispatch & City Law Department",
      phone: PHONES.dwsd.number,
      phoneDisplay: PHONES.dwsd.number,
      hours: "Confirm current reporting and claim hours with DWSD",
      goal: "Report the backup, obtain a Service Request number, and understand the current claim instructions.",
      haveReady: [
        "Exact date and time the sewage backup was first discovered",
        "Address where the backup occurred",
        "Photos or notes detailing the water level and affected basement contents",
      ],
      openingScript: `“Sewage or water entered my basement ${addr}. I need to report what happened and understand the claim process. I do not yet know the cause.”`,
      keyQuestions: [
        "“What is my exact Service Request (SR) number?” (Write this down immediately)",
        "“What will be recorded for this report, and what is the next step?”",
        "“Where can I find the current Notice of Claim instructions and required materials?”",
      ],
      watchOut:
        "Use dates, photos, receipts, and what you observed. Do not guess about the cause or leave out material facts; ask how the report will be recorded. You may have a filing deadline.",
      nextStep: "Use the official DWSD claims page, save your SR number, and follow its current submission instructions.",
    };
  },

  hope: (ctx) => {
    const addr = ctx.address ? `for my home at ${ctx.address}` : "for my property";
    return {
      id: "hope",
      agency: "Wayne Metro Community Action Agency (HOPE Hotline)",
      phone: PHONES.wayneMetro.number,
      phoneDisplay: PHONES.wayneMetro.number,
      hours: "Confirm current help availability with Wayne Metro",
      goal: "Ask for current HOPE application help and the official document checklist.",
      haveReady: [
        "Michigan Driver's License or State ID with current property address",
        "Proof of income for ALL adults in household (2025 W-2, 1040, SSI/SSD letter, or Zero Income Affidavit)",
        "Deed or land contract",
        "Current year property tax assessment notice or parcel number",
      ],
      openingScript: `“Hello, I am a Detroit homeowner calling to schedule a free appointment with a housing counselor for the HOPE property tax exemption ${addr}. I need to ensure my property taxes are cleared so I can qualify for city home and sewer repair grants.”`,
      keyQuestions: [
        "“What is the nearest neighborhood intake center with available appointment slots?”",
        "“Can you review the exact checklist of income documents I need to bring for everyone in my household?”",
        "“Do you provide free notary services at the appointment for the signed hardship application?”",
      ],
      watchOut:
        "Do not wait until the November deadline. Counselor appointment calendars fill up quickly in October. All adults living in the home who do not have income must sign a Zero Income Affidavit.",
      nextStep: "Bring all required paystubs, IDs, and tax documents to your scheduled appointment. Wayne Metro will submit the packet directly to the Board of Review.",
    };
  },

  habitat: (ctx) => {
    const addr = ctx.address ? `at ${ctx.address}` : "in Detroit";
    return {
      id: "habitat",
      agency: "Habitat for Humanity Detroit — Repair Services",
      phone: PHONES.habitat.number,
      phoneDisplay: PHONES.habitat.number,
      hours: "Confirm current availability with Habitat Detroit",
      goal: "Ask whether repair assistance is currently open and where future intake information will appear.",
      haveReady: [
        "Property address and owner contact information",
        "Summary of underground sewer/plumbing repair needs",
        "Rough estimate of household income bracket",
      ],
      openingScript: `“Hello, I am a homeowner ${addr}. I understand your Critical Home Repair program is temporarily paused for new applications, but I am facing an urgent sewer line failure. Could you let me know when your next intake round will open, and can I be added to an interest notification list?”`,
      keyQuestions: [
        "“What are the primary income requirements (AMI percentage) for when the program reopens?”",
        "“Are there partner organizations or emergency plumbing relief funds you recommend contacting in the meantime?”",
      ],
      watchOut:
        "Habitat operates on philanthropic grants that open in limited tranches. Be courteous and ask for exact dates or partner agencies (such as Wayne Metro or Matrix Human Services).",
      nextStep: "Set a reminder on your calendar to follow up 30 days prior to their stated funding cycle.",
    };
  },

  insurance: () => {
    return {
      id: "insurance",
      agency: "Your Homeowner's Insurance Carrier",
      phone: "See insurance card / policy declaration",
      phoneDisplay: "Your Policy Claims #",
      hours: "See your policy or insurer for current claims hours",
      goal: "Verify whether your policy includes a 'Water Backup and Sump Discharge Rider' and file a formal claim.",
      haveReady: [
        "Homeowners Insurance Policy Number",
        "Date and time the backup occurred",
        "DWSD Service Request number (SR#)",
        "Itemized list and photos of damaged personal property",
      ],
      openingScript:
        "“I had a water-backup incident at my insured property. I need help understanding my coverage and the claim process.”",
      keyQuestions: [
        "“Does my declaration page include the Water Backup and Sump Overflow rider, and what is the coverage sub-limit?”",
        "“What is my deductible for this specific backup endorsement?”",
        "“When will an adjuster be assigned to inspect the property, and should I begin professional water mitigation immediately?”",
      ],
      watchOut:
        "Give the dates and facts you know. If the cause is unclear, say it is still being investigated rather than guessing.",
      nextStep: "Do not throw away high-value damaged items before the adjuster photographs them. Keep all mitigation company receipts.",
    };
  },
};

export function getCallProtocol(programId: string, ctx: CallContext = {}): CallProtocol | null {
  const factory = PROTOCOLS[programId];
  return factory ? factory(ctx) : null;
}
