"use client";

import { useState } from "react";
import type { Contact } from "@/lib/contacts";

/** The number, big enough to hit with wet hands, with the sentence to open with. */
export function CallButton({ contact, tone = "primary" }: { contact: Contact; tone?: "primary" | "quiet" | "danger" }) {
  const [open, setOpen] = useState(false);
  const base = "flex min-h-[4.5rem] w-full items-center gap-4 rounded-2xl px-5 text-left transition active:scale-[0.99]";
  const skin =
    tone === "primary"
      ? "bg-brand text-white hover:bg-brand-ink shadow-[0_14px_30px_-16px_rgb(13_92_107/0.85)]"
      : tone === "danger"
        ? "bg-stop text-white hover:brightness-110"
        : "border-2 border-line-2 bg-surface hover:border-ink";
  return (
    <div className="grid min-w-0 gap-2">
      <a href={`tel:${contact.tel}`} className={`${base} ${skin}`}>
        <PhoneGlyph />
        <span className="min-w-0 flex-1">
          <span className="block text-[1.45rem] font-extrabold leading-none tracking-tight tabular-nums sm:text-[1.6rem]">{contact.phone}</span>
          <span className={`mt-1 block text-[0.95rem] leading-snug ${tone === "quiet" ? "text-ink-3" : "text-white/75"}`}>
            {contact.name}
            {contact.hours ? ` · ${contact.hours}` : ""}
          </span>
        </span>
      </a>
      {contact.say && (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="min-h-11 rounded-lg px-1 text-[0.95rem] font-semibold text-brand underline decoration-brand/30 underline-offset-4"
          >
            {open ? "Hide what to say" : "What to say when they answer"}
          </button>
          {open && (
            <blockquote className="mt-2 rounded-2xl bg-brand-tint/70 p-4 text-[1.1rem] font-semibold leading-snug text-brand-ink">
              &ldquo;{contact.say}&rdquo;
            </blockquote>
          )}
        </div>
      )}
      {contact.note && <p className="text-[0.95rem] text-ink-2">{contact.note}</p>}
    </div>
  );
}

export function PhoneGlyph() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8 shrink-0 opacity-90" aria-hidden="true">
      <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" />
    </svg>
  );
}
