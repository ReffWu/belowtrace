import Link from "next/link";
import { propertyModel } from "@/lib/property-model";
import type { LngLat, Report, Situation } from "@/lib/types";
import { PropertyScene } from "@/components/report/property-scene";

// The reveal: what the public record shows below this one home, and the part nobody can see.
export function UnderHome({ r, situation, street, lead = false }: { r: Report; situation: Situation; street: string; lead?: boolean }) {
  const Heading = lead ? "h1" : "h2";
  const ring = r.parcel?.geometry ? (r.parcel.geometry.type === "Polygon" ? r.parcel.geometry.coordinates[0] : r.parcel.geometry.coordinates[0][0]) : null;
  const origin: LngLat = r.lngLat ?? (ring?.[0] ? [ring[0][0], ring[0][1]] : [0, 0]);
  const model = propertyModel(r.parcel, r.site, r.nearestMain, origin);
  const m = r.nearestMain;
  const age = m?.installYear ? new Date().getFullYear() - m.installYear : null;
  const pipe = m ? [m.sizeIn && `${m.sizeIn}-inch`, m.materialLabel, m.depthFt && `about ${m.depthFt} ft down`].filter(Boolean).join(", ") : "";

  return (
    <section id="under" className="scroll-mt-4 bg-deep text-white">
      <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-glow">Below the surface</p>
        <Heading className="mt-2 text-[2.3rem] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[3.2rem]">What&apos;s under {street}</Heading>
        <p className="mt-3 max-w-2xl text-lg text-white/65">Built from City and DWSD records for this parcel.{model ? " Drag to turn it." : ""}</p>

        <div className="mt-8 overflow-hidden rounded-3xl ring-1 ring-white/10">
          <PropertyScene key={`${r.parcel?.id}-${m?.id}`} model={model} variant="dark" />
        </div>

        <dl className="mt-10 grid gap-8 sm:grid-cols-3">
          <Stat value={m?.installYear ? String(m.installYear) : "—"}>
            {m?.installYear
              ? `The nearest city sewer was laid ${age} years ago${pipe ? `: ${pipe}` : ""}.`
              : "The public data has no record of the city sewer here. DWSD's own maps are more complete."}
          </Stat>
          <Stat value={String(r.reports311.waterInBasement)}>
            {r.reports311.waterInBasement === 1 ? "report" : "reports"} of water in a basement within {r.reports311.radiusM} m of this home since
            2023. {r.reports311.waterInBasement >= 3 ? "You're not alone." : ""}
          </Stat>
          <Stat value="?" tone="own">
            Your own line isn&apos;t on any public record, so we don&apos;t draw it. Only a camera inspection can show where it runs.
          </Stat>
        </dl>

        <p className="mt-10 max-w-3xl border-t border-white/10 pt-6 text-sm leading-relaxed text-white/50">
          The nearest recorded main may not be the one your home connects to. Dimensions come from mapped outlines, not a survey. Not a utility locate,
          an inspection, or legal advice.{" "}
          <Link href={`/report?${new URLSearchParams({ address: r.query, situation })}`} className="font-semibold text-white/80 underline hover:text-white">
            See every record for this address
          </Link>
        </p>
      </div>
    </section>
  );
}

function Stat({ value, tone, children }: { value: string; tone?: "own"; children: React.ReactNode }) {
  return (
    <div className="border-t-2 border-white/15 pt-4">
      <dt className={`text-[3rem] font-extrabold leading-none tracking-[-0.04em] tabular-nums ${tone === "own" ? "text-[#f3a64a]" : "text-glow"}`}>{value}</dt>
      <dd className="mt-3 text-white/75">{children}</dd>
    </div>
  );
}
