// Mark: a ground line with a pipe tracing down and away beneath it.
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0d5c6b" />
      <path d="M5 12.5h22" stroke="#f6f3ec" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M10 12.5v5.5a3 3 0 0 0 3 3h12" fill="none" stroke="#f3a64a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="25" cy="21" r="2.6" fill="#f6f3ec" />
    </svg>
  );
}
