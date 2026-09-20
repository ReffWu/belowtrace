import { SOURCES } from "@/lib/facts";
import type { MoneyRow, Tone } from "@/lib/money";

const TAG: Record<Tone, string> = {
  ok: "bg-go-tint text-go",
  warn: "bg-warn-tint text-warn",
  no: "bg-stop-tint text-stop",
  open: "bg-sunk text-ink-2",
};

// The money side of the case, always in view: each cost, what it runs, and what still needs confirmation.
export function WhoPays({ rows, title = "Who pays, so far" }: { rows: MoneyRow[]; title?: string }) {
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
            {r.tag && <span className={`mt-2 inline-block rounded-md px-2 py-0.5 text-sm font-bold ${TAG[r.tag.tone]}`}>{r.tag.text}</span>}
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
