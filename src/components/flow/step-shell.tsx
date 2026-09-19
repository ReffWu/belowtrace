import Link from "next/link";

// One screen, one job: a progress rail, a single headline, and whatever the step needs.
export function StepShell({
  step,
  of,
  back,
  title,
  lead,
  children,
}: {
  step: number;
  of: number;
  back: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl px-5 pb-20 pt-6 sm:pt-10">
      <div className="flex items-center justify-between gap-4">
        <Link href={back} className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-ink-2 hover:text-ink">
          <span aria-hidden="true">←</span> Back
        </Link>
        {of > 1 && (
          <div className="flex items-center gap-3" aria-label={`Step ${step} of ${of}`}>
            <span className="text-sm font-semibold tabular-nums text-ink-3">
              {step} of {of}
            </span>
            <span className="flex gap-1.5" aria-hidden="true">
              {Array.from({ length: of }, (_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i < step ? "w-6 bg-ink" : "w-3 bg-line-2"}`} />
              ))}
            </span>
          </div>
        )}
      </div>
      <h1 className="rise mt-10 text-[2.4rem] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[3rem]">{title}</h1>
      {lead && <p className="rise rise-1 mt-4 text-[1.2rem] leading-relaxed text-ink-2">{lead}</p>}
      <div className="rise rise-2 mt-8">{children}</div>
    </div>
  );
}

export function NextButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex min-h-16 w-full items-center justify-between rounded-2xl bg-ink px-6 text-lg font-bold text-white transition hover:bg-brand-ink active:scale-[0.99]"
    >
      {children}
      <span aria-hidden="true" className="transition group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
