"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-line-2 bg-surface px-4 font-semibold text-ink hover:border-ink"
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M5 2.75A.75.75 0 0 1 5.75 2h8.5a.75.75 0 0 1 .75.75V6h.25A2.75 2.75 0 0 1 18 8.75v4.5A1.75 1.75 0 0 1 16.25 15H15v2.25a.75.75 0 0 1-.75.75h-8.5a.75.75 0 0 1-.75-.75V15H3.75A1.75 1.75 0 0 1 2 13.25v-4.5A2.75 2.75 0 0 1 4.75 6H5V2.75ZM6.5 6h7V3.5h-7V6Zm0 7.5v3h7v-3h-7Z" />
      </svg>
      Print or save as PDF
    </button>
  );
}
