"use client";

import { useId, useState } from "react";
import { claimDeadline, type Step } from "@/lib/plan";
import { deadlineIcs, downloadIcs } from "@/lib/ics";

const todayInDetroit = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Detroit" });

function fmt(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: "America/Detroit" });
}

function daysFromToday(d: Date) {
  const start = new Date(`${todayInDetroit()}T00:00:00`);
  const end = new Date(d.toLocaleDateString("en-CA", { timeZone: "America/Detroit" }) + "T00:00:00");
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function ActionPlan({ steps, askFoundDate }: { steps: Step[]; askFoundDate: boolean }) {
  const [foundOn, setFoundOn] = useState(todayInDetroit);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [openScript, setOpenScript] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const dateId = useId();

  function copyScript(id: string, text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2500);
    }
  }

  return (
    <div>
      {askFoundDate && (
        <div className="no-print mb-5 flex flex-wrap items-center gap-3 rounded-xl bg-sunk px-4 py-3">
          <label htmlFor={dateId} className="font-semibold">
            When did you find the backup?
          </label>
          <input
            id={dateId}
            type="date"
            value={foundOn}
            max={todayInDetroit()}
            onChange={(e) => e.target.value && setFoundOn(e.target.value)}
            className="h-11 rounded-lg border-2 border-line-2 bg-surface px-3 text-base"
          />
          <span className="text-sm text-ink-2">We use it to work out your claim deadline.</span>
        </div>
      )}
      <ol className="space-y-3">
        {steps.map((s, i) => {
          const due = s.due === "claim" ? claimDeadline(foundOn) : s.due ? new Date(s.due) : null;
          const left = due ? daysFromToday(due) : null;
          const urgent = left !== null && left <= 7;
          return (
            <li key={s.id} className={`print-break-avoid flex gap-4 rounded-2xl border bg-surface p-4 sm:p-5 ${done[s.id] ? "border-line opacity-60" : "border-line"}`}>
              <div className="flex flex-col items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-base font-bold text-white">{i + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <h3 className={`text-lg font-bold leading-snug ${done[s.id] ? "line-through" : ""}`}>{s.title}</h3>
                  <label className="no-print flex shrink-0 cursor-pointer items-center gap-2 text-sm text-ink-2">
                    <input
                      type="checkbox"
                      checked={Boolean(done[s.id])}
                      onChange={(e) => setDone({ ...done, [s.id]: e.target.checked })}
                      className="h-5 w-5 accent-[var(--brand)]"
                    />
                    Done
                  </label>
                </div>
                <p className="mt-1 text-ink-2">{s.detail}</p>
                {due && (
                  <p
                    className={`mt-2 inline-flex flex-wrap items-center gap-x-2 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                      urgent ? "bg-stop-tint text-stop" : "bg-own-tint text-[#8a4700]"
                    }`}
                  >
                    {s.dueLabel ?? "Due"} {fmt(due)}
                    {left !== null && <span className="font-bold">· {left < 0 ? "passed" : left === 0 ? "today" : `${left} day${left === 1 ? "" : "s"} left`}</span>}
                  </p>
                )}
                {due && left !== null && left >= 0 && (
                  <p className="no-print mt-2">
                    <button
                      type="button"
                      onClick={() => downloadIcs(`${s.id}-deadline.ics`, deadlineIcs({ title: s.title, detail: s.detail, due, url: window.location.href }))}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-brand underline decoration-brand/30 hover:decoration-brand"
                    >
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                        <path d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" />
                      </svg>
                      Add to my calendar (reminds me 3 days and 1 day before)
                    </button>
                  </p>
                )}
                {s.callScript && (
                  <div className="no-print mt-3">
                    <button
                      type="button"
                      onClick={() => setOpenScript({ ...openScript, [s.id]: !openScript[s.id] })}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand-tint/40 px-3 py-1.5 text-xs font-semibold text-brand-ink hover:bg-brand-tint"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                        <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" />
                      </svg>
                      {openScript[s.id] ? "Hide call guidance" : "Call guidance and factual questions"}
                    </button>
                    {openScript[s.id] && (
                      <div className="mt-3 rounded-xl border border-brand/20 bg-surface p-4 text-sm shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
                          <span className="font-bold text-brand-ink">🎯 Goal: {s.callScript.goal}</span>
                          <button
                            type="button"
                            onClick={() => copyScript(s.id, s.callScript!.script.join("\n\n"))}
                            className="shrink-0 rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-brand hover:border-brand"
                          >
                            {copied === s.id ? "✓ Copied!" : "Copy script"}
                          </button>
                        </div>
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-ink-2">A truthful opening you can adapt:</p>
                          {s.callScript.script.map((line, idx) => (
                            <p key={idx} className="rounded-lg bg-sunk/60 p-2.5 text-xs leading-relaxed text-ink border border-line/60">
                              {line}
                            </p>
                          ))}
                        </div>
                        {s.callScript.factTips?.length > 0 && (
                          <div className="mt-3 rounded-lg bg-stop-tint/40 p-3 border border-stop/20">
                            <p className="text-xs font-bold text-stop">⚠️ Keep the facts clear:</p>
                            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-stop">
                              {s.callScript.factTips.map((tip, idx) => (
                                <li key={idx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {s.link && (
                  <p className="no-print mt-3">
                    <a
                      href={s.link.href}
                      {...(s.link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="inline-flex min-h-11 items-center rounded-xl border-2 border-line-2 px-4 font-semibold text-brand hover:border-brand"
                    >
                      {s.link.label}
                    </a>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
