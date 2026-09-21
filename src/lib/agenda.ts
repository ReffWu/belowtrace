// What to do today, derived from one date.
//
// The old build asked sixteen questions and used the answers to unlock stages. This asks two
// and uses the calendar. Every action below carries a window measured in days from the moment
// the water was found, because that is the only clock that runs on its own.
//
// Order is by what cannot be undone, not by what comes first in a story:
//   danger        someone can be hurt in the next minute
//   irreversible  a door closes for good, evidence thrown out, a statutory deadline passed
//   window        a fixed period after which the cost multiplies (mould, mainly)
//   steady        important, recoverable, do it when you can
//
// An action can be satisfied by a fact the resident already recorded, so nothing is asked twice.
import type { Case } from "./case";
import { CONTACTS, type ContactId } from "./contacts";
import { NOTICE_DAYS, PRESERVATION_ASK, daysBetween, noticeClock, type NoticeClock } from "./law";

export type Urgency = "danger" | "irreversible" | "window" | "steady";

export type Action = {
  id: string;
  title: string;
  /** One line. The reason, not the instruction. */
  why: string;
  urgency: Urgency;
  /** Days from the day the water was found. Day 0 is that day. */
  from: number;
  to?: number;
  points?: string[];
  script?: string[];
  warn?: string;
  contact?: ContactId;
  link?: { label: string; href: string };
  /** Already true because of something recorded. */
  satisfiedBy?: (c: Case) => boolean;
  /** Not applicable to this case at all. */
  unless?: (c: Case) => boolean;
  /** Always on screen, never ticked off. */
  standing?: boolean;
  /** Has its own screen rather than a checkbox. */
  opens?: string;
};

const URGENCY_RANK: Record<Urgency, number> = { danger: 0, irreversible: 1, window: 2, steady: 3 };

export const ACTIONS: Action[] = [
  {
    id: "safety",
    title: "Before you go down there",
    why: "Sewage and electricity are in the same room, and the house is still adding to it.",
    urgency: "danger",
    from: 0,
    standing: true,
    points: [
      "If the fuse box, outlets, appliances or wiring are in the water, stay out of it. Do not reach in to pull the breaker.",
      "Stop using water upstairs, no toilets, showers, laundry or dishwasher until it stops rising. Every flush adds to what is down there.",
      "Leave the cleanout cap alone. On a blocked line it is holding pressure, and opening it sprays sewage and sewer gas.",
      "When you do go down: rubber boots, rubber or nitrile gloves, an N95, sealed goggles. Keep children and pets out entirely.",
    ],
    contact: "dte",
  },
  {
    id: "photos",
    title: "Photograph everything before anything leaves the basement",
    why: "What you throw out before you photograph it is gone from your insurance claim and your City notice at the same time.",
    urgency: "irreversible",
    from: 0,
    to: 4,
    points: [
      "Mark the water line on the wall and photograph it next to a tape measure. Write down the inches, both claim forms ask for the depth.",
      "Photograph every damaged item on its own, then walk the room on video saying today's date out loud.",
      "Photograph outside too: water at the curb, the storm, the manhole if it is lifting.",
      "Keep every receipt from today onward, pump rental, dehumidifier, plumber, hotel, dump runs.",
    ],
  },
  {
    id: "neighbors",
    title: "Knock on three neighbors' doors",
    why: "It is the fastest free read on whose pipe this is, and it stops working once everyone has cleaned up.",
    urgency: "window",
    from: 0,
    to: 3,
    points: [
      "Ask one question: “Did you get water in your basement too?”",
      "Several homes at once points at the public sewer. Only your home usually points at your own line.",
      "Write down their names. A neighbor who also backed up is the strongest fact you will have.",
    ],
    satisfiedBy: (c) => Boolean(c.neighbors && c.neighbors !== "unknown"),
  },
  {
    id: "call-dwsd",
    title: `Call DWSD and get a service request number`,
    why: "A DWSD damage claim cannot be filed without one, and the call itself starts a legal protection.",
    urgency: "irreversible",
    from: 0,
    contact: "dwsd",
    script: [
      "Sewage is backing up into my basement at [your address].",
      "Please send a crew to check the city sewer.",
      "What is my service request number?",
      PRESERVATION_ASK,
    ],
    points: [
      "Write down the number, the time, and the name of whoever answered.",
      "That last sentence matters: if they never send you the rules in writing and your notice ends up late, Michigan law says a late notice does not bar your claim.",
    ],
    satisfiedBy: (c) => Boolean(c.serviceRequest?.trim()),
  },
  {
    id: "call-insurance",
    title: "Open a claim with your home insurer today",
    why: "For most Detroit backups the insurer is the only party that actually pays. GLWA denied all 24,000 claims from the 2021 flood.",
    urgency: "irreversible",
    from: 0,
    to: 10,
    points: [
      "Ask three things: does my policy have the Water Backup and Sump Overflow endorsement, what is its limit, and is there a separate limit for mould.",
      "Standard homeowners policies exclude backups. The endorsement is usually $5,000 to $10,000 unless you raised it.",
      "Open the claim even if you think you are not covered. A denial letter is one of the documents the City's own claim form asks for.",
      "Do not throw out anything expensive before the adjuster has seen the photographs.",
    ],
    satisfiedBy: (c) => Boolean(c.insuranceClaim?.trim()),
  },
  {
    id: "notice",
    title: "Send your written notice",
    why: `Michigan gives you ${NOTICE_DAYS} days from the day you found the water, and asks for six facts. It does not ask for estimates, that is what people are waiting for when the deadline passes.`,
    urgency: "irreversible",
    from: 0,
    to: NOTICE_DAYS,
    opens: "/notice",
    link: { label: "Write it now", href: "/notice" },
  },
  {
    id: "cleanup",
    title: "Get it out and get it dry",
    why: "After about 48 hours you stop dealing with sewage and start dealing with mould, which costs more and is harder to claim.",
    urgency: "window",
    from: 1,
    to: 4,
    points: [
      "Throw out anything porous it touched: carpet and pad, mattresses, upholstered furniture, cardboard, books, soft toys, and all food and cosmetics.",
      "Cut away paper-faced drywall and wet insulation above the water line. Wet paper is what mould grows on.",
      "Wash hard surfaces with detergent and water first, then disinfect. Disinfectant on top of dirt does almost nothing.",
      "Never mix bleach with ammonia or other cleaners.",
      "Fans and a dehumidifier until it is dry through, not dry to the touch.",
    ],
    warn: "Call a restoration company instead if the water was deep, the furnace or electrics were under it, or anyone at home is pregnant, elderly, asthmatic or immunocompromised.",
    contact: "wayneHealth",
  },
  {
    id: "debris",
    title: "Book the flood debris pickup",
    why: "The City collects sewage-damaged bulk separately, so it does not sit at your curb.",
    urgency: "steady",
    from: 2,
    to: 21,
    contact: "dpw",
    points: ["You can also request it in the Improve Detroit app."],
  },
  {
    id: "psrp-first",
    title: "Apply to the repair program before you sign anything",
    why: "The Private Sewer Repair Program cannot pay for work that started before its review.",
    urgency: "irreversible",
    from: 1,
    contact: "hrd",
    points: [
      "This address is inside the program's neighborhoods, so the order matters: apply, then sign.",
      "An emergency repair you cannot wait on is still an emergency. Document why, and tell the program.",
    ],
    link: { label: "What it needs", href: "/help" },
  },
  {
    id: "camera",
    title: "Get a camera inspection in writing",
    why: "No public record locates a private sewer line. A plumber's CCTV run is the only thing that does.",
    urgency: "steady",
    from: 3,
    to: 90,
    unless: (c) => c.whose === "city",
    points: [
      "About $400. Ask for the video file and a written finding that says where the defect is, not just that there is one.",
      "If the break is at the alley connection, ask DWSD whether your alley is in the Alley Sewer Repair Program before you pay for anything.",
    ],
  },
  {
    id: "estimates",
    title: "Collect two written estimates",
    why: "Both the DWSD and the GLWA claim forms ask for two.",
    urgency: "steady",
    from: 3,
    to: NOTICE_DAYS,
    points: ["These belong to the claim packet, which has no deadline. Do not let them hold up the notice, which does."],
  },
  {
    id: "programs",
    title: "See which repair programs reach this address",
    why: "Detroit has money for this, spread across departments that do not talk to each other.",
    urgency: "steady",
    from: 4,
    link: { label: "Check this address", href: "/help" },
  },
  {
    id: "prevent",
    title: "Make the next one smaller",
    why: "Nothing here stops a storm. These three things change what it costs you.",
    urgency: "steady",
    from: 30,
    contact: "dwsd",
    points: [
      "A backwater valve is the single most effective fix. Ask DWSD whether your address is in the Basement Backup Protection Program before paying $2,000 to 4,000 for one.",
      "Raise the limit on your Water Backup endorsement. $5,000 does not finish a basement.",
      "Disconnect the downspouts and run them three feet from the foundation. Clear the catch basin at your curb before the next storm.",
    ],
  },
];

const byId = new Map(ACTIONS.map((a) => [a.id, a]));
export const actionById = (id: string) => byId.get(id);

export type ActionState = {
  action: Action;
  done: boolean;
  /** Auto-satisfied by a recorded fact rather than ticked. */
  implicit: boolean;
  /** Day of the case this opens, for items still ahead. */
  opensOnDay: number;
  /** Last day it is useful, if it has one. */
  closesOnDay?: number;
};

export type Agenda = {
  clock: NoticeClock;
  standing: ActionState[];
  now: ActionState[];
  later: ActionState[];
  done: ActionState[];
  /** The one thing, if there is one. */
  first: ActionState | null;
};

export type AgendaContext = { inPsrpArea?: boolean };

export function agenda(c: Case, today: string, ctx: AgendaContext = {}): Agenda {
  const clock = noticeClock(c.foundOn, today);
  const day = daysBetween(c.foundOn, today);

  const standing: ActionState[] = [];
  const now: ActionState[] = [];
  const later: ActionState[] = [];
  const done: ActionState[] = [];

  for (const action of ACTIONS) {
    if (action.id === "psrp-first" && !ctx.inPsrpArea) continue;
    if (action.unless?.(c)) continue;

    const implicit = Boolean(action.satisfiedBy?.(c)) || (action.id === "notice" && allNoticesSent(c));
    const ticked = Boolean(c.done[action.id]);
    const isDone = implicit || ticked;
    const state: ActionState = { action, done: isDone, implicit, opensOnDay: action.from, closesOnDay: action.to };

    if (action.standing) {
      standing.push(state);
      continue;
    }
    if (isDone) {
      done.push(state);
      continue;
    }
    if (day < action.from) {
      later.push(state);
      continue;
    }
    // The notice stays live until it is sent, even past the deadline: a late notice can still
    // be accepted, and MCL 691.1419(3) can excuse one outright.
    const expired = action.to !== undefined && day > action.to && action.id !== "notice";
    if (expired) continue;
    now.push(state);
  }

  const rank = (s: ActionState) => URGENCY_RANK[s.action.urgency] * 1000 + s.action.from;
  now.sort((a, b) => rank(a) - rank(b));
  later.sort((a, b) => a.opensOnDay - b.opensOnDay);

  return { clock, standing, now, later, done, first: now[0] ?? null };
}

function allNoticesSent(c: Case) {
  const sent = c.noticeSentOn ?? {};
  return Boolean(sent.dwsd && sent.glwa);
}

/** Human phrasing for how long an action stays useful. */
export function windowLabel(s: ActionState, clock: NoticeClock): string | null {
  const { action } = s;
  if (action.id === "notice") {
    if (clock.state === "passed") return "Deadline passed, send it anyway";
    if (clock.daysLeft === 0) return "Today is the last day";
    return `${clock.daysLeft} days left`;
  }
  if (action.to === undefined) return null;
  const left = action.to - clock.dayOfCase + 1;
  if (left <= 0) return "Closing now";
  if (left === 1) return "Today";
  if (left <= 3) return `About ${left} days`;
  return null;
}

export const contactFor = (a: Action) => (a.contact ? CONTACTS[a.contact] : null);
