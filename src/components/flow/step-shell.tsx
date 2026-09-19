import Link from "next/link";

// One screen, one job: a way back, a single headline, and whatever the screen needs.
export function StepShell({ back, title, lead, children }: { back: string; title: React.ReactNode; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-5 pb-20 pt-6 sm:pt-10">
      <Link href={back} className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-ink-2 hover:text-ink">
        <span aria-hidden="true">←</span> Back
      </Link>
      <h1 className="rise mt-8 text-[2.4rem] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[3rem]">{title}</h1>
      {lead && <p className="rise rise-1 mt-4 text-[1.2rem] leading-relaxed text-ink-2">{lead}</p>}
      <div className="rise rise-2 mt-8">{children}</div>
    </div>
  );
}
