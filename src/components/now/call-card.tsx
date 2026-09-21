"use client";

// A phone number is not an instruction. Under stress people dial, get an answer, and forget
// what they meant to ask — so every number on this site carries the same four lines: what to
// say, what to ask, what to write down, and the thing people get wrong on that call.
import { useState } from "react";
import type { Contact } from "@/lib/contacts";
import { PhoneGlyph } from "./call";

// Guidance is always collapsed to start: the number is the urgent thing, the script is there
// for whoever wants it.
export function CallCard({ contact, tone = "primary" }: { contact: Contact; tone?: "primary" | "quiet" | "onDark" }) {
  const [open, setOpen] = useState(false);
  const hasScript = Boolean(contact.say || contact.ask?.length || contact.write?.length);
  const skin =
    tone === "primary"
      ? "bg-brand text-white hover:bg-brand-ink shadow-[0_14px_30px_-16px_rgb(13_92_107/0.85)]"
      : tone === "onDark"
        ? "bg-white text-ink hover:bg-white/90"
        : "border-2 border-line-2 bg-surface hover:border-ink";

  return (
    <div className="grid min-w-0 gap-2">
      <a href={`tel:${contact.tel}`} className={`flex min-h-[4.25rem] w-full items-center gap-3 rounded-2xl px-4 text-left transition active:scale-[0.99] sm:gap-4 sm:px-5 ${skin}`}>
        <PhoneGlyph />
        <span className="min-w-0 flex-1">
          <span className="block text-[1.4rem] font-extrabold leading-none tracking-tight tabular-nums xs:text-[1.5rem] sm:text-[1.6rem]">
            {contact.phone}
          </span>
          <span
            className={`mt-1 block truncate text-[0.82rem] leading-tight sm:text-[0.9rem] ${tone === "primary" ? "text-white/75" : "text-ink-3"}`}
          >
            {contact.short ?? contact.name}
            {contact.hours ? ` · ${contact.hours}` : ""}
          </span>
        </span>
      </a>

      {hasScript && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={`min-h-11 rounded-lg px-1 text-left text-[0.95rem] font-bold underline underline-offset-4 ${tone === "onDark" ? "text-white/90 decoration-white/40" : "text-brand decoration-brand/30"}`}
          >
            {open ? "Hide the call" : "Before you dial — what to say and ask"}
          </button>

          {open && (
            <div className="grid gap-3 rounded-2xl border border-line bg-paper p-4">
              {contact.say && (
                <Part label="Open with">
                  <p className="text-[1.05rem] font-semibold leading-snug text-brand-ink">&ldquo;{contact.say}&rdquo;</p>
                </Part>
              )}
              {contact.ask?.length ? (
                <Part label="Ask">
                  <ol className="grid gap-1.5">
                    {contact.ask.map((q) => (
                      <li key={q} className="flex gap-2 leading-snug text-ink-2">
                        <span aria-hidden="true" className="mt-[0.5rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand/50" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ol>
                </Part>
              ) : null}
              {contact.write?.length ? (
                <Part label="Write down before you hang up">
                  <ul className="grid gap-1.5">
                    {contact.write.map((w) => (
                      <li key={w} className="flex gap-2 leading-snug text-ink-2">
                        <span aria-hidden="true" className="mt-[0.35rem] text-own">✓</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </Part>
              ) : null}
              {contact.watch && <p className="rounded-xl bg-warn-tint p-3 text-[0.98rem] leading-relaxed text-[#6b3d00]">{contact.watch}</p>}
            </div>
          )}
        </>
      )}

      {contact.note && <p className="text-[0.95rem] leading-snug text-ink-2">{contact.note}</p>}
    </div>
  );
}

function Part({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-ink-3">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
