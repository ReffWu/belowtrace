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
      hours: "Mon–Fri 8:00 AM – 5:00 PM",
      goal: "Confirm if your alley is scheduled for city-funded sewer replacement under the $184M ASRP, or request a CCTV camera inspection.",
      haveReady: [
        "Exact property address and parcel number (if known)",
        "The cross streets / rear alley location behind your home",
        "Your DWSD water account number (if applicable)",
      ],
      openingScript: `“Hello, I am calling regarding the $184 Million Alley Sewer Repair Program (ASRP) for ${addr}. Our block has an active rear alley sewer, and I need to verify whether my parcel is scheduled for city-funded sewer lateral replacement before I contract private excavators.”`,
      keyQuestions: [
        "“Has DWSD logged a closed-circuit camera (CCTV) inspection for the alley sewer behind my parcel?”",
        "“If my block is not currently on the schedule, can you log a service request to inspect the alley connection for cave-ins?”",
        "“Who is the assigned capital project manager or liaison for alley sewer rehabilitation in my neighborhood?”",
      ],
      watchOut:
        "DO NOT report this as an ordinary toilet or indoor plumbing clog. If you say internal pipes are backed up, the agent may categorize it as a private responsibility and close the ticket. Emphasize that you are requesting a verification of the public alley main connection.",
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
      hours: "Mon–Fri 8:30 AM – 4:30 PM",
      goal: "Verify CDBG-DR Private Sewer Repair Program intake status, confirm income qualification guidelines, and request paper application assistance if needed.",
      haveReady: [
        "Recorded property deed or property transfer affidavit (must show your name)",
        "Proof of household income (2025 W-2, 1040 tax return, or SSA-1099 for all adults)",
        "Documentation or photos of past basement flood impact (June 2021 storm)",
        "Proof of property tax compliance (current taxes or active HOPE/payment plan)",
      ],
      openingScript: `“Hello, I am calling regarding the CDBG-DR Private Sewer Repair Program (PSRP) ${addr}${hoodText}. I understand my area is an eligible program neighborhood, and I need to verify whether new applications are being processed on Neighborly and what documentation is needed for household income verification.”`,
      keyQuestions: [
        "“Can an intake coordinator assist me over the phone or at a recreation center if I need help uploading documents to the Neighborly portal?”",
        "“Does an active HOPE exemption or Wayne County tax payment plan satisfy the property tax eligibility requirement?”",
        "“What is the current review timeline after submitting the full application packet?”",
      ],
      watchOut:
        "The applicant name must match the recorded deed. If you are behind on taxes, do not simply say you are delinquent — state that you are actively applying for HOPE or on an approved payment plan.",
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
      hours: "Mon–Fri 8:30 AM – 4:30 PM",
      goal: "Confirm application status or register on the interest list for critical emergency plumbing/sewer repairs.",
      haveReady: [
        "Proof of primary residency and home ownership",
        "Identification for all household members (showing seniors 62+, children under 18, or disability documentation)",
        "Proof of current household income",
      ],
      openingScript: `“Hello, I am calling regarding the Critical Home Repair Program for my home ${addr}. We have a critical underground plumbing and sewer issue that affects a vulnerable member of our household. I would like to confirm the intake deadline and ensure our pre-application is in order.”`,
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
      hours: "24/7 Dispatch (Business claims: Mon–Fri 8:00 AM – 5:00 PM)",
      goal: "Obtain an official DWSD Service Request # (SR#) immediately to lock in the 45-day legal deadline under Michigan Public Act 222.",
      haveReady: [
        "Exact date and time the sewage backup was first discovered",
        "Address where the backup occurred",
        "Photos or notes detailing the water level and affected basement contents",
      ],
      openingScript: `“I am calling to report a municipal sewage backup ${addr}. Raw sewage entered the basement through the drains. I need to report this immediately and obtain an official Service Request number for a Michigan Public Act 222 damage claim.”`,
      keyQuestions: [
        "“What is my exact Service Request (SR) number?” (Write this down immediately)",
        "“Can you dispatch a crew to inspect the city sewer main on our street for obstructions?”",
        "“Where should I email or submit my formal 45-day Notice of Claim form and damage receipts?”",
      ],
      watchOut:
        "DO NOT speculate that your private line was clogged or admit to pre-existing pipe defects. State clearly that municipal sewage backed up into the structure. You only have 45 days from discovery to file in writing.",
      nextStep: "Download and fill out the City of Detroit Sewer Backup Claim form. Mail it by certified mail or submit it online with your SR# attached.",
    };
  },

  hope: (ctx) => {
    const addr = ctx.address ? `for my home at ${ctx.address}` : "for my property";
    return {
      id: "hope",
      agency: "Wayne Metro Community Action Agency (HOPE Hotline)",
      phone: PHONES.wayneMetro.number,
      phoneDisplay: PHONES.wayneMetro.number,
      hours: "Mon–Fri 9:00 AM – 4:30 PM",
      goal: "Schedule a free one-on-one appointment with a housing counselor to complete and notarize your HOPE property tax exemption application.",
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
      hours: "Mon–Fri 9:00 AM – 4:00 PM",
      goal: "Ask when the next critical repair funding round opens and request to be placed on the homeowner interest waitlist.",
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

  insurance: (ctx) => {
    return {
      id: "insurance",
      agency: "Your Homeowner's Insurance Carrier",
      phone: "See insurance card / policy declaration",
      phoneDisplay: "Your Policy Claims #",
      hours: "24/7 Claims Reporting Line",
      goal: "Verify whether your policy includes a 'Water Backup and Sump Discharge Rider' and file a formal claim.",
      haveReady: [
        "Homeowners Insurance Policy Number",
        "Date and time the backup occurred",
        "DWSD Service Request number (SR#)",
        "Itemized list and photos of damaged personal property",
      ],
      openingScript:
        "“I am calling to report a water backup incident at my insured property. Municipal sewage backed up through the basement floor drain. I would like to check my endorsement limits for Water Backup coverage and open a claim.”",
      keyQuestions: [
        "“Does my declaration page include the Water Backup and Sump Overflow rider, and what is the coverage sub-limit?”",
        "“What is my deductible for this specific backup endorsement?”",
        "“When will an adjuster be assigned to inspect the property, and should I begin professional water mitigation immediately?”",
      ],
      watchOut:
        "NEVER describe the event as 'wear and tear', 'seepage over time', or 'old pipes deteriorating'. Standard policies exclude normal wear. State clearly that it was a sudden backup through the plumbing drains.",
      nextStep: "Do not throw away high-value damaged items before the adjuster photographs them. Keep all mitigation company receipts.",
    };
  },
};

export function getCallProtocol(programId: string, ctx: CallContext = {}): CallProtocol | null {
  const factory = PROTOCOLS[programId];
  return factory ? factory(ctx) : null;
}
