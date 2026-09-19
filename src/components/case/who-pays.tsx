import type { Case } from "@/lib/case";
import { SOURCES } from "@/lib/facts";
import type { MoneyRow, Tone } from "@/lib/money";

const TAG: Record<Tone, string> = {
  ok: "bg-go-tint text-go",
  warn: "bg-warn-tint text-warn",
  no: "bg-stop-tint text-stop",
  open: "bg-sunk text-ink-2",
};

const RAIN: { value: NonNullable<Case["rain"]>; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
];

// The money side of the case, always in view: each cost, what it runs, and who is likely to pay.
// onRain asks the one question that most changes the damage answer, when it hasn't been answered.
export function WhoPays({ rows, title = "Who pays, so far", onRain }: { rows: MoneyRow[]; title?: string; onRain?: (v: NonNullable<Case["rain"]>) => void }) {
  return (
    <section aria-labelledby="who-pays" className="rounded-3xl border border-line bg-surface p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="who-pays" className="text-xl font-extrabold tracking-tight">
          {title}
        </h2>
        <span className="text-sm text-ink-3">Updates as you go</span>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="shrink-0 font-bold">{r.label}</span>
              <span className="text-lg font-extrabold tabular-nums tracking-tight">{r.amount}</span>
            </div>
            <p className="mt-1 text-ink-2">{r.note}</p>
            {r.tag && !(r.id === "damage" && onRain) && <span className={`mt-2 inline-block rounded-md px-2 py-0.5 text-sm font-bold ${TAG[r.tag.tone]}`}>{r.tag.text}</span>}
            {r.id === "damage" && onRain && (
              <div className="mt-3 rounded-xl bg-sunk p-3" role="group" aria-labelledby="rain-q">
                <p id="rain-q" className="mb-2 font-semibold">
                  Was it raining hard when the water came in?
                </p>
                <div className="flex flex-wrap gap-2">
                  {RAIN.map((o) => (
                    <button key={o.value} type="button" onClick={() => onRain(o.value)} className="min-h-11 rounded-xl border-2 border-line-2 bg-surface px-4 font-semibold hover:border-ink">
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-line pt-3 text-sm text-ink-3">
        Typical costs from the{" "}
        <a href={SOURCES.handbook.url} target="_blank" rel="noreferrer" className="underline">
          DWSD Basement Backup Handbook
        </a>
        .
        {rows.some((r) => r.id === "damage") && (
          <>
            {" "}
            Claims follow Michigan law: DWSD pays only if its sewer caused at least half the backup. After the June 2021 storm,{" "}
            <a href={SOURCES.glwaClaims.url} target="_blank" rel="noreferrer" className="underline">
              all 24,000+ claims to GLWA were denied
            </a>
            .
          </>
        )}
      </p>
    </section>
  );
}
