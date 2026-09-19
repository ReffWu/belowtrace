"use client";

import Link from "next/link";
import { claimDeadline } from "@/lib/plan";
import { deadlineIcs, downloadIcs } from "@/lib/ics";
import { daysLeft, longDate, useClaim } from "./record-form";

// The claim "ticket": what the resident saved in step 2, turned into a date they can't miss.
export function ClaimCard({ claimsUrl }: { claimsUrl: string }) {
  const [claim] = useClaim();
  if (!claim) return <div className="h-52 rounded-3xl bg-ink" aria-hidden="true" />;

  const due = claimDeadline(claim.found);
  const left = daysLeft(due);
  const remind = () =>
    downloadIcs(
      "dwsd-claim-deadline.ics",
      deadlineIcs({
        title: "File DWSD damage claim",
        detail: `${claim.sr ? `Service request #${claim.sr.trim()}. ` : ""}DWSD only takes damage claims within 45 days of finding the backup.`,
        due,
        url: claimsUrl,
      }),
    );

  return (
    <div className="overflow-hidden rounded-3xl bg-ink text-white">
      <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-end sm:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-white/55">File your damage claim by</p>
          <p className="mt-2 text-[2.1rem] font-extrabold leading-tight tracking-tight sm:text-[2.6rem]">{longDate(due)}</p>
          <p className="mt-1 text-white/70">
            {claim.sr ? `Service request #${claim.sr} · ` : "Add your service request number · "}
            <Link href="/backup/record" className="underline decoration-white/30 hover:decoration-white">
              Edit
            </Link>
          </p>
        </div>
        <p className="text-left sm:text-right">
          <span className={`block text-[3.5rem] font-extrabold leading-none tabular-nums ${left <= 7 ? "text-[#ff9b8f]" : ""}`}>
            {Math.max(left, 0)}
          </span>
          <span className="text-white/60">{left === 1 ? "day left" : "days left"}</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-white/10 px-6 py-4 sm:px-8">
        <button type="button" onClick={remind} className="min-h-11 rounded-xl bg-white px-4 font-bold text-ink transition hover:bg-white/85">
          Remind me
        </button>
        <a href={claimsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl px-4 font-semibold text-white/85 hover:bg-white/10">
          How to file ↗
        </a>
      </div>
    </div>
  );
}
