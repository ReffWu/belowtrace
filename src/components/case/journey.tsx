import type { Stage } from "@/lib/case";

// The whole shape of a sewer backup, so a resident knows where they are and what's left.
export const STAGES = [
  { n: 1, short: "Call DWSD", when: "Today", title: "Stop the damage", note: "Call DWSD and get a service request number." },
  { n: 2, short: "DWSD checks", when: "1–2 days", title: "DWSD checks the city sewer", note: "A crew looks at the sewer that serves your home." },
  { n: 3, short: "Whose pipe", when: "Then", title: "You learn whose pipe it is", note: "The City's: they fix it. Yours: a camera shows where it broke." },
  { n: 4, short: "Get it paid", when: "Within 45 days", title: "Get it paid for", note: "A damage claim, or a program that pays for the repair." },
] as const;

export function JourneyMap({ current = 1 }: { current?: Stage }) {
  return (
    <ol className="relative grid gap-0">
      {STAGES.map((s, i) => {
        const done = s.n < current;
        const now = s.n === current;
        return (
          <li key={s.n} className="relative grid grid-cols-[2.75rem_1fr] gap-4 pb-7 last:pb-0">
            {i < STAGES.length - 1 && <span className="absolute bottom-0 left-[1.35rem] top-11 w-0.5 bg-line-2" aria-hidden="true" />}
            <span
              className={`relative z-10 grid h-11 w-11 place-items-center rounded-full text-lg font-extrabold ${
                now ? "bg-ink text-white" : done ? "bg-go text-white" : "border-2 border-line-2 bg-paper text-ink-3"
              }`}
            >
              {done ? "✓" : s.n}
            </span>
            <div className="pt-1.5">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-own">{s.when}</p>
              <p className="text-[1.25rem] font-bold leading-snug">{s.title}</p>
              <p className="mt-0.5 text-ink-2">{s.note}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// The compact version that sits on top of the case page.
export function Spine({ current, skipped = [] }: { current: Stage; skipped?: number[] }) {
  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label={current === 5 ? "All four steps done" : `Step ${current} of 4`}>
      {STAGES.map((s) => {
        const skip = skipped.includes(s.n);
        const done = !skip && s.n < current;
        const now = s.n === current;
        return (
          <li key={s.n} aria-current={now ? "step" : undefined}>
            <span className={`block h-1.5 rounded-full ${now ? "bg-ink" : done ? "bg-go" : "bg-line-2"}`} />
            <span className={`mt-2 block text-[0.8rem] font-semibold leading-tight ${now ? "text-ink" : done ? "text-go" : "text-ink-3"}`}>
              {done && "✓ "}
              {skip ? <s className="font-normal">{s.short}</s> : s.short}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
