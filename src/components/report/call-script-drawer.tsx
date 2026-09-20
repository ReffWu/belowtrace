"use client";

import { useState } from "react";
import type { CallProtocol } from "@/lib/call-protocols";

export function CallScriptDrawer({ protocol, defaultOpen = false }: { protocol: CallProtocol; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const fullScript = [
    `Agency: ${protocol.agency} (${protocol.phoneDisplay})`,
    `Goal: ${protocol.goal}`,
    "",
    "--- A TRUTHFUL OPENING YOU CAN ADAPT ---",
    protocol.openingScript,
    "",
    "--- KEY QUESTIONS TO ASK ---",
    ...protocol.keyQuestions.map((q, i) => `${i + 1}. ${q}`),
    "",
    "--- KEEP THE FACTS CLEAR ---",
    protocol.watchOut,
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard fallback
    }
  };

  return (
    <div className="no-print mt-3 w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-xl border border-brand/35 bg-brand-tint/35 px-3.5 py-2 text-xs font-semibold text-brand-ink transition-colors hover:bg-brand-tint hover:border-brand"
        aria-expanded={open}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-brand" aria-hidden="true">
          <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" />
        </svg>
        <span>{open ? "Hide call guidance" : `What to ask on this call (Script & Tips)`}</span>
        <span className="ml-1 text-[0.68rem] font-medium text-ink-2">· {protocol.agency}</span>
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-brand/20 bg-surface text-sm shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-brand-tint/20 px-4 py-3 sm:px-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink">{protocol.agency}</span>
                <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-semibold text-brand border border-line">
                  {protocol.phoneDisplay}
                </span>
              </div>
              {protocol.hours && <p className="mt-0.5 text-xs text-ink-2">Hours: {protocol.hours}</p>}
            </div>
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-brand hover:border-brand hover:bg-brand-tint/30 transition-colors"
            >
              {copied ? "✓ Copied to clipboard!" : "Copy complete script"}
            </button>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            {/* Target Goal */}
            <div className="rounded-xl border border-brand/25 bg-brand-tint/30 p-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-ink">🎯 Objective for this call</span>
              <p className="mt-1 font-semibold text-ink leading-snug">{protocol.goal}</p>
            </div>

            {/* Have ready */}
            {protocol.haveReady.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-2">📂 Have ready before calling:</span>
                <ul className="mt-1.5 space-y-1 text-xs text-ink">
                  {protocol.haveReady.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-0.5 font-bold text-brand">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Truthful Opening Script */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-2">📋 A truthful opening you can adapt:</span>
              <div className="mt-1.5 rounded-xl border border-line bg-sunk/60 p-3.5 text-xs sm:text-[0.83rem] leading-relaxed text-ink font-medium">
                {protocol.openingScript}
              </div>
            </div>

            {/* Key Questions */}
            {protocol.keyQuestions.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-2">❓ Follow-up questions to ask:</span>
                <div className="mt-1.5 space-y-1.5">
                  {protocol.keyQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-lg bg-surface border border-line/80 p-2.5 text-xs text-ink">
                      <span className="font-bold text-brand">{idx + 1}.</span>
                      <span className="italic">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keep the facts clear */}
            <div className="rounded-xl border border-stop/25 bg-stop-tint/35 p-3.5 text-xs leading-relaxed text-ink">
              <div className="flex items-center gap-1.5 font-bold text-stop">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
                <span>KEEP THE FACTS CLEAR:</span>
              </div>
              <p className="mt-1 text-ink/90">{protocol.watchOut}</p>
            </div>

            {/* Next Step */}
            {protocol.nextStep && (
              <div className="border-t border-line pt-3 text-xs text-ink-2">
                <strong className="text-ink">Next step after hanging up:</strong> {protocol.nextStep}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
