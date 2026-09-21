// The written notice required by MCL 691.1419(1), composed from what the case already knows.
//
// This is the whole product in one file. The statute asks for six facts and gives 45 days.
// People miss it because they believe they must first assemble estimates, receipts and a
// valuation — none of which the notice requires. So this builds a letter that is complete
// under the statute today, and says plainly that the packet can follow.
import type { Case } from "./case";
import { NOTICE_RECIPIENTS, type NoticeRecipient } from "./contacts";
import { CITATION, NOTICE_DAYS, noticeDeadline } from "./law";

export { NOTICE_RECIPIENTS };

const longDate = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

export type NoticeFields = {
  name: string;
  phone: string;
  mailing: string;
  property: string;
  discovered: string;
  description: string;
  serviceRequest?: string;
};

/** The geocoder returns "Detroit, MI, 48235"; a letter should not carry that stray comma. */
export const tidyAddress = (a?: string) => (a ?? "").trim().replace(/,\s*(MI|MICHIGAN),\s*(\d{5})/i, ", MI $2");

export function fieldsFrom(c: Case): NoticeFields {
  const address = tidyAddress(c.address);
  return {
    name: c.name?.trim() ?? "",
    phone: c.phone?.trim() ?? "",
    mailing: address,
    property: address,
    discovered: c.foundOn,
    description: describe(c),
    serviceRequest: c.serviceRequest?.trim() || undefined,
  };
}

/**
 * The "brief description of the claim" the statute asks for. Written from recorded facts only —
 * it never asserts a cause, because the resident does not know it and a wrong guess in writing
 * is worse than no guess.
 */
export function describe(c: Case): string {
  const parts = [`Sewage backed up into the basement of this property, which I discovered on ${longDate(c.foundOn)}.`];
  if (c.waterDepth?.trim()) parts.push(`The water reached approximately ${c.waterDepth.trim()}.`);
  if (c.neighbors === "same") parts.push("Other homes on the same block reported water in their basements at the same time.");
  if (c.damageNote?.trim()) parts.push(c.damageNote.trim());
  parts.push("The backup damaged the basement and personal property stored in it.");
  parts.push("This letter is given as notice within the 45-day period. It is not the complete claim.");
  return parts.join(" ");
}

export function missing(f: NoticeFields): string[] {
  const gaps: string[] = [];
  if (!f.name) gaps.push("your name");
  if (!f.phone) gaps.push("your phone number");
  if (!f.property) gaps.push("the property address");
  return gaps;
}

/** The letter, as plain text, ready to print or paste. */
export function compose(f: NoticeFields, to: NoticeRecipient, today: string): string {
  const deadline = noticeDeadline(f.discovered);
  const lines = [
    longDate(today),
    "",
    ...to.lines,
    "",
    `RE: Notice of claim under MCL 691.1419 — ${f.property}`,
    "",
    "To whom it may concern:",
    "",
    `This is written notice of a claim for damage caused by a sewage disposal system event, given under MCL 691.1419(1) within 45 days of discovery.`,
    "",
    `  Claimant:            ${f.name}`,
    `  Mailing address:     ${f.mailing}`,
    `  Telephone:           ${f.phone}`,
    `  Affected property:   ${f.property}`,
    `  Date of discovery:   ${longDate(f.discovered)}`,
    ...(f.serviceRequest ? [`  DWSD service request: ${f.serviceRequest}`] : []),
    "",
    "Description of the claim:",
    wrap(f.description),
    "",
    "I am preserving the damaged property and documentation and will provide photographs, an",
    "itemized list of damaged items and written repair estimates. Please confirm receipt of this",
    "notice and tell me the claim number assigned to it.",
    "",
    "Sincerely,",
    "",
    "",
    `${f.name}`,
    f.phone,
  ];
  return `${lines.join("\n")}\n\n---\nNotice deadline for this claim: ${longDate(deadline)} (45 days from discovery).\n`;
}

function wrap(text: string, width = 88): string {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if ((line + word).length > width) {
      out.push(line.trimEnd());
      line = "";
    }
    line += `${word} `;
  }
  if (line.trim()) out.push(line.trimEnd());
  return out.join("\n");
}

/** How to actually get it there, in the order that survives a dispute. */
export const SENDING = [
  {
    title: "Send it certified mail, return receipt requested",
    detail: "About $6 at any post office. The green card is your proof of the date, which is the only fact that matters if the agency says it never arrived.",
  },
  {
    title: "Keep a copy of exactly what you sent",
    detail: "Photograph the signed letter and the envelope before you seal it.",
  },
  {
    title: "Do not wait for estimates",
    detail: `The statute asks for six facts. The estimates, receipts and photographs belong to the claim packet, and that has no ${NOTICE_DAYS}-day clock.`,
  },
] as const;

export const WHY_TWO = {
  title: "Why two letters",
  body: "Detroit owns the sewer your home connects to. GLWA owns the regional system Detroit's sewage flows into. Both are governmental agencies under the statute, each with its own 45-day clock, and neither forwards a notice to the other. In 2021, 24,000 metro Detroit households sent one letter to a system with two owners.",
  cite: CITATION.definitions,
} as const;
