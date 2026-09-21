// Who a resident actually has to reach, in the order a backup makes them needed.
// Each entry carries the one thing to say, because a phone number without a sentence
// is where most people stall.

export type Contact = {
  id: string;
  name: string;
  phone: string;
  /** Digits only, for tel: links. */
  tel: string;
  hours?: string;
  /** The sentence to open with. Written to be read aloud under stress. */
  say?: string;
  /** What to ask once they answer. Three at most — nobody holds more than three. */
  ask?: string[];
  /** What to have written down before you hang up. */
  write?: string[];
  /** The thing people get wrong on this call. */
  watch?: string;
  url?: string;
  note?: string;
};

export const CONTACTS = {
  emergency: {
    id: "emergency",
    name: "Emergency",
    phone: "911",
    tel: "911",
    say: "Fire, a live wire in water, or someone hurt.",
  },

  dte: {
    id: "dte",
    name: "DTE Energy — gas leak or electrical emergency",
    phone: "800-477-4747",
    tel: "8004774747",
    hours: "24 hours",
    say: "Water has reached the electrical panel in my basement. Nobody has touched the breakers.",
    ask: [
      "Is it safe for me to go back into the basement?",
      "Do you need to shut off power or gas at the meter?",
    ],
    write: ["The time you called", "Whether they are sending someone, and when"],
    watch: "Do not go and pull the breaker yourself first. That is the call.",
    note: "If you smell gas, leave the house first and call from outside.",
  },

  dwsd: {
    id: "dwsd",
    name: "DWSD Customer Service",
    phone: "313-267-8000",
    tel: "3132678000",
    hours: "24 hours",
    say: "Sewage is backing up into my basement. Please send a crew to check the city sewer.",
    ask: [
      "What is my service request number?",
      "Is my alley in the Alley Sewer Repair Program, now or in an upcoming contract?",
      "Has DWSD run a camera on the sewer behind my address, and what did it find?",
    ],
    write: ["The service request number", "The name of whoever answered", "What they said happens next, and by when"],
    watch:
      "They may not know about the alley program at the front desk. Ask anyway, and ask them to note the question on the service request.",
    url: "https://detroitmi.gov/departments/water-and-sewerage-department/dwsd-customer-service/water-and-sewer-maintenanceemergencies",
  },

  glwa: {
    id: "glwa",
    name: "Great Lakes Water Authority — Office of the General Counsel",
    phone: "844-455-4592",
    tel: "8444554592",
    say: "I am filing a sewage backup claim and need to confirm where to send my written notice.",
    ask: [
      "What address should my written notice go to?",
      "Do you have a claim number for me yet?",
    ],
    write: ["The mailing address they give you", "The date you called"],
    watch: "GLWA is a separate agency from the City. A notice sent to Detroit does not reach them.",
    url: "https://www.glwater.org/contact/",
    note: "GLWA runs the regional system Detroit's sewers drain into. It is a separate agency with its own 45-day clock.",
  },

  dpw: {
    id: "dpw",
    name: "Detroit Public Works — flood debris pickup",
    phone: "313-876-0004",
    tel: "3138760004",
    say: "I have flood-damaged items from a sewer backup that need a special bulk pickup.",
    ask: ["Which day will the truck come?", "What do I need to keep separate at the curb?"],
    write: ["The pickup date", "The request number"],
    note: "Also available through the Improve Detroit app.",
  },

  wayneHealth: {
    id: "wayneHealth",
    name: "Wayne County Environmental Health",
    phone: "734-727-7400",
    tel: "7347277400",
    say: "I need guidance on cleaning up after raw sewage in my home.",
    ask: [
      "What has to be thrown out, and what can be cleaned?",
      "Is it safe for children or anyone with asthma to be in the house?",
    ],
    write: ["Anything they tell you to discard — insurers ask for this"],
  },

  mi211: {
    id: "mi211",
    name: "Michigan 2-1-1",
    phone: "211",
    tel: "211",
    hours: "24 hours",
    say: "I had a sewage backup and need help with cleanup, food, or somewhere to stay.",
  },

  hrd: {
    id: "hrd",
    name: "Housing & Revitalization Department",
    phone: "313-224-6380",
    tel: "3132246380",
    say: "I want to ask about the Private Sewer Repair Program for my home.",
    ask: [
      "Am I eligible, and what proof of 2021 flood damage do you accept?",
      "If I already had emergency work done, does that disqualify me?",
      "Can someone help me upload the documents?",
    ],
    write: ["Your application number", "The list of documents they ask for", "The date they say you will hear back"],
    watch:
      "Ask before you sign any repair contract. The program cannot pay for work that started before its review — that is the single most expensive mistake on this list.",
  },

  wayneMetro: {
    id: "wayneMetro",
    name: "Wayne Metro Community Action Agency",
    phone: "866-313-2520",
    tel: "8663132520",
    say: "I need help with a water bill, or with the HOPE property tax exemption.",
    ask: [
      "Is there any emergency help for a sewer repair I cannot afford?",
      "Can you book me an appointment with a housing counselor?",
    ],
    write: ["The appointment date", "What to bring"],
  },

  missDig: {
    id: "missDig",
    name: "MISS DIG 811",
    phone: "811",
    tel: "811",
    say: "I need public utilities marked before digging.",
    note: "MISS DIG marks public utilities. It does not locate private sewer lines.",
  },
} as const satisfies Record<string, Contact>;

export type ContactId = keyof typeof CONTACTS;

/** Where written notices go. Both are governmental agencies under MCL 691.1416(b). */
export const NOTICE_RECIPIENTS = [
  {
    id: "dwsd",
    agency: "Detroit Water and Sewerage Department",
    attn: "Claims Division",
    lines: ["Detroit Water and Sewerage Department", "ATTN: Claims Division", "6425 Huber Street", "Detroit, MI 48211"],
    phone: CONTACTS.dwsd.phone,
    online: {
      label: "DWSD damage claim form",
      url: "https://detroitmi.gov/departments/water-and-sewerage-department/dwsd-customer-service/dwsd-damage-claims-sewage-backups",
    },
    why: "Detroit owns the sewer your home connects to.",
    confirm: `Confirm the mailing address when you call ${CONTACTS.dwsd.phone} — the City has moved claims intake before.`,
    needsServiceRequest: true,
  },
  {
    id: "glwa",
    agency: "Great Lakes Water Authority",
    attn: "Office of the General Counsel",
    lines: ["Great Lakes Water Authority", "Office of the General Counsel", "735 Randolph Street", "Detroit, MI 48226"],
    phone: CONTACTS.glwa.phone,
    online: { label: "GLWA contact", url: "https://www.glwater.org/contact/" },
    why: "Detroit's sewage flows into GLWA's regional system. In a storm backup it is a second responsible agency, with its own 45-day deadline.",
    confirm: "GLWA's own claim form carries the 45-day warning on its face.",
    needsServiceRequest: false,
  },
] as const;

export type NoticeRecipient = (typeof NOTICE_RECIPIENTS)[number];
