"use client";

import { useState } from "react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch {
        /* cancelled: fall back to copying */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-line-2 bg-surface px-4 font-semibold text-ink hover:border-ink"
      aria-live="polite"
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M12.23 3.2a.75.75 0 0 1 1.06 0l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 1 1-1.06-1.06l2.22-2.22H9.5A3.5 3.5 0 0 0 6 11.5v4.75a.75.75 0 0 1-1.5 0V11.5a5 5 0 0 1 5-5h4.95L12.23 4.26a.75.75 0 0 1 0-1.06Z" />
      </svg>
      {copied ? "Link copied" : "Share this report"}
    </button>
  );
}
