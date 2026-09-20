import type { Metadata } from "next";
import Link from "next/link";
import { JourneyMap } from "@/components/case/journey";
import { StartCase } from "@/components/case/start-case";
import { WhoPays } from "@/components/case/who-pays";
import { newCase } from "@/lib/case";
import { whoPays } from "@/lib/money";

export const metadata: Metadata = { title: "What happens after a backup" };

export default function BackupOverview() {
  return (
    <div className="mx-auto max-w-xl px-5 pb-20 pt-6 sm:pt-10">
      <Link href="/" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-ink-2 hover:text-ink">
        <span aria-hidden="true">←</span> Back
      </Link>
      <h1 className="rise mt-8 text-[2.4rem] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[3rem]">Start safe. Keep the facts. Stay with the case.</h1>
      <p className="rise rise-1 mt-4 text-[1.2rem] leading-relaxed text-ink-2">
        A backup does not end with one call. We&apos;ll keep safety, address facts, official follow-up, claims, programs, and repair records together while you move through them.
      </p>
      <div className="rise rise-2 mt-10">
        <JourneyMap />
      </div>
      <div className="rise rise-3 mt-10">
        <StartCase />
        <p className="mt-4 text-center text-ink-3">Free. No sign-up. Your case stays on this phone.</p>
      </div>
      <div className="mt-12">
        <WhoPays title="What it can cost, and who pays" rows={whoPays(newCase("backup", ""), null)} />
      </div>
    </div>
  );
}
