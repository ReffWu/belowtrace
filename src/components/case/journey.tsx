import type { Stage } from "@/lib/case";

// The whole shape of a sewer backup, so a resident knows where they are and what's left.
export const STAGES = [
  { n: 1, short: "Safety & report", when: "Now", title: "Get safe and report the backup", note: "Keep safe, record facts, and ask DWSD for a Service Request number." },
  { n: 2, short: "Record findings", when: "After contact", title: "Record what DWSD communicates", note: "Keep the finding, any written record, and the next official step." },
  { n: 3, short: "Confirm cause", when: "If needed", title: "Keep the cause evidence-based", note: "It is okay for the cause to remain unknown until a proper inspection." },
  { n: 4, short: "Track paths", when: "45-day claim window", title: "Track claims, programs, and repair", note: "Submitting an application is the start of follow-through, not the end." },
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
