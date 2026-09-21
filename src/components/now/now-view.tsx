"use client";

// The product. One date in, a day's worth of work out.
//
// It renders entirely from what is stored on this phone, so it still works in a basement with
// no signal. The only network call adds program context, and its absence changes nothing
// urgent.
import Link from "next/link";
import { useState } from "react";
import { agenda, type ActionState } from "@/lib/agenda";
import { complete, neighborReading, todayInDetroit, uncomplete, type Case, type NeighborSignal } from "@/lib/case";
import { AFTER_DEADLINE, CITATION } from "@/lib/law";
import { save, useActiveCase, useSaveFailed } from "@/lib/store";
import { useAddressContext } from "@/lib/use-address-context";
import { ActionCard } from "./action-card";
import { Clock } from "./clock";
import { CaseFacts } from "./case-facts";
import { Start } from "./start";

export function NowView() {
  const c = useActiveCase();
  const today = todayInDetroit();
  const ctx = useAddressContext(c?.address);
  const saveFailed = useSaveFailed();
  const [showDone, setShowDone] = useState(false);

  if (c === undefined) return <div className="mx-auto h-[60vh] max-w-xl" aria-busy="true" />;
  if (c === null) return <NoCase />;

  const update = (next: Case) => save(next);
  const a = agenda(c, today, { inPsrpArea: ctx.inPsrpArea });
  const street = c.address?.split(",")[0];

  return (
    <div>
      <Clock clock={a.clock} street={street} />

      <div className="mx-auto max-w-xl px-5 pb-20 pt-7">
        {saveFailed && (
          <p role="alert" className="mb-6 rounded-2xl bg-warn-tint p-4 text-[#6b3d00]">
            This browser will not let the page save. Print the case file at the bottom before you close the tab.
          </p>
        )}

        {a.clock.state === "passed" && (
          <section className="mb-7 rounded-3xl border-2 border-stop/40 bg-stop-tint p-5 sm:p-6">
            <h2 className="text-[1.3rem] font-extrabold leading-tight">{AFTER_DEADLINE.headline}</h2>
            <ul className="mt-3 grid gap-2.5">
              {AFTER_DEADLINE.points.map((p) => (
                <li key={p} className="flex gap-2.5 leading-relaxed text-ink-2">
                  <span aria-hidden="true" className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-stop/50" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <a href={CITATION.notice.url} target="_blank" rel="noreferrer" className="mt-3 inline-block font-semibold text-brand underline">
              {CITATION.notice.label} ↗
            </a>
          </section>
        )}

        <h1 className="text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.03em]">
          {a.now.length === 0 ? "Nothing is due today." : a.now.length === 1 ? "One thing today." : `${a.now.length} things today.`}
        </h1>

        {a.standing.length > 0 && (
          <ul className="mt-6 grid gap-4">
            {a.standing.map((s) => (
              <ActionCard key={s.action.id} state={s} clock={a.clock} defaultOpen />
            ))}
          </ul>
        )}

        {a.now.length > 0 && (
          <ul className="mt-4 grid gap-4">
            {a.now.map((s, i) => (
              <ActionCard
                key={s.action.id}
                state={s}
                clock={a.clock}
                defaultOpen={i === 0}
                onDone={() => update(complete(c, s.action.id))}
              >
                <Slot state={s} c={c} update={update} />
              </ActionCard>
            ))}
          </ul>
        )}

        <CaseFacts c={c} update={update} ctx={ctx} />

        {a.later.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[1.1rem] font-extrabold uppercase tracking-[0.1em] text-ink-3">Coming up</h2>
            <ul className="mt-3 grid gap-2">
              {a.later.map((s) => (
                <li key={s.action.id} className="flex items-baseline justify-between gap-4 rounded-2xl border border-line bg-surface px-4 py-3">
                  <span className="font-semibold text-ink-2">{s.action.title}</span>
                  <span className="shrink-0 text-[0.9rem] text-ink-3">day {s.opensOnDay + 1}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {a.done.length > 0 && (
          <section className="mt-10">
            <button
              type="button"
              onClick={() => setShowDone((v) => !v)}
              aria-expanded={showDone}
              className="min-h-11 text-[1.1rem] font-extrabold uppercase tracking-[0.1em] text-ink-3 hover:text-ink"
            >
              Done · {a.done.length} {showDone ? "▲" : "▼"}
            </button>
            {showDone && (
              <ul className="mt-3 grid gap-2">
                {a.done.map((s) => (
                  <li key={s.action.id} className="flex items-center justify-between gap-4 rounded-2xl bg-sunk/70 px-4 py-3">
                    <span className="text-ink-3 line-through">{s.action.title}</span>
                    {!s.implicit && (
                      <button type="button" onClick={() => update(uncomplete(c, s.action.id))} className="shrink-0 min-h-11 px-1 font-semibold text-ink-3 underline">
                        Undo
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

/** The few actions that collect a fact instead of a tick. Recording it is what marks them done. */
function Slot({ state, c, update }: { state: ActionState; c: Case; update: (c: Case) => void }) {
  const id = state.action.id;

  if (id === "neighbors") {
    const OPTIONS: { v: NeighborSignal; l: string }[] = [
      { v: "same", l: "Others got water too" },
      { v: "only-me", l: "Only my home" },
      { v: "unknown", l: "Nobody answered" },
    ];
    return (
      <div role="group" aria-label="What the neighbors said">
        <p className="font-semibold">What did they say?</p>
        <div className="mt-2 grid gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.v}
              type="button"
              aria-pressed={c.neighbors === o.v}
              onClick={() => update({ ...c, neighbors: o.v })}
              className={`min-h-12 rounded-xl border-2 px-4 text-left font-semibold ${c.neighbors === o.v ? "border-ink bg-ink text-white" : "border-line-2 bg-surface hover:border-ink"}`}
            >
              {o.l}
            </button>
          ))}
        </div>
        {neighborReading(c.neighbors) && <p className="mt-3 leading-relaxed text-ink-2">{neighborReading(c.neighbors)}</p>}
      </div>
    );
  }

  if (id === "call-dwsd") {
    return (
      <Field
        label="Service request number"
        placeholder="From DWSD"
        value={c.serviceRequest ?? ""}
        onChange={(v) => update({ ...c, serviceRequest: v })}
      />
    );
  }

  if (id === "call-insurance") {
    return (
      <Field
        label="Insurance claim number"
        placeholder="From your insurer"
        value={c.insuranceClaim ?? ""}
        onChange={(v) => update({ ...c, insuranceClaim: v })}
      />
    );
  }

  if (id === "photos") {
    return (
      <Field
        label="How deep did the water get?"
        placeholder={'e.g. "4 inches"'}
        value={c.waterDepth ?? ""}
        onChange={(v) => update({ ...c, waterDepth: v })}
        hint="Both claim forms ask for this, and it is hard to remember once it is dry."
      />
    );
  }

  return null;
}

function Field({ label, value, placeholder, hint, onChange }: { label: string; value: string; placeholder?: string; hint?: string; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-semibold">{label}</span>
      {hint && <span className="text-[0.95rem] text-ink-3">{hint}</span>}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-full rounded-xl border-2 border-line-2 bg-surface px-4 text-lg outline-none focus:border-ink"
      />
    </label>
  );
}

function NoCase() {
  return (
    <div className="mx-auto max-w-xl px-5 pb-20 pt-10">
      <p className="text-[0.8rem] font-bold uppercase tracking-[0.14em] text-own">Second track · it already flooded</p>
      <h1 className="mt-3 text-[2.1rem] font-extrabold leading-[1.06] tracking-[-0.03em]">
        Fixing the pipe and paying for the damage are two different things.
      </h1>
      <p className="mt-4 text-[1.1rem] leading-relaxed text-ink-2">
        The $184M program repairs sewer connections. It never pays for a ruined basement. That is a separate claim, with its own
        45-day deadline, to two separate agencies — and it starts the day you found the water.
      </p>
      <div className="mt-7">
        <Start />
      </div>
      <p className="mt-4 text-center text-[0.95rem] text-ink-3">Free. No sign-up. It stays on this phone.</p>

      <div className="mt-10 rounded-2xl border border-line bg-surface p-5">
        <p className="font-bold">Looking for who fixes the pipe instead?</p>
        <p className="mt-1 leading-relaxed text-ink-2">
          That is the other track: six segments, who owns each, and whether the City&rsquo;s money is coming to your alley.
        </p>
        <Link href="/" className="mt-3 inline-flex min-h-12 items-center rounded-xl bg-ink px-5 font-bold text-white hover:bg-brand-ink">
          Check an address →
        </Link>
      </div>
    </div>
  );
}
