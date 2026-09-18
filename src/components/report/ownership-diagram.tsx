import type { SewerMain } from "@/lib/types";

// Schematic of the typical Detroit layout (after DWSD's own diagram). Deliberately not a map:
// no public record shows where a private sewer line actually runs.
export function OwnershipDiagram({ main }: { main: SewerMain | null }) {
  const cityDetail = main?.installYear ? `laid ${main.installYear}${main.sizeIn ? ` · ${main.sizeIn}-inch` : ""}` : null;
  const summary = `Diagram: your private sewer line runs from your basement to the city sewer, usually under the alley behind your home. You own the line up to and including the connection; the City owns the sewer under the alley.${
    main?.installYear ? ` The city sewer near you was laid in ${main.installYear}.` : ""
  }`;

  return (
    <figure className="print-break-avoid">
      <OwnershipChain cityDetail={cityDetail} />
      <svg viewBox="0 0 720 300" role="img" aria-label={summary} className="hidden h-auto w-full sm:block print:block">
        <defs>
          <pattern id="soil" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#e9e1d1" />
            <circle cx="2" cy="3" r="0.9" fill="#d8ccb5" />
            <circle cx="6" cy="6.5" r="0.7" fill="#d8ccb5" />
          </pattern>
        </defs>

        {/* ground */}
        <rect x="0" y="120" width="720" height="140" fill="url(#soil)" />
        <line x1="0" y1="120" x2="720" y2="120" stroke="#8a7e69" strokeWidth="2" />

        {/* house */}
        <path d="M50 64 L160 18 L270 64 Z" fill="#7a3b2e" />
        <rect x="68" y="62" width="184" height="58" fill="#b5634b" />
        <rect x="96" y="78" width="30" height="26" rx="2" fill="#f6f3ec" />
        <rect x="194" y="78" width="30" height="26" rx="2" fill="#f6f3ec" />
        <rect x="146" y="82" width="28" height="38" rx="2" fill="#5b2c22" />
        {/* basement */}
        <rect x="74" y="122" width="172" height="62" fill="#d6cdbd" stroke="#8a7e69" strokeWidth="1.5" />
        <text x="160" y="158" textAnchor="middle" fontSize="15" fontWeight="700" fill="#46535e" letterSpacing="1.5">
          BASEMENT
        </text>

        {/* property line */}
        <line x1="530" y1="92" x2="530" y2="262" stroke="#46535e" strokeWidth="1.5" strokeDasharray="5 5" />
        <text x="530" y="84" textAnchor="middle" fontSize="13" fill="#46535e">
          Property line
        </text>

        {/* alley */}
        <rect x="548" y="112" width="160" height="8" rx="2" fill="#9aa3a8" />
        <text x="628" y="104" textAnchor="middle" fontSize="14" fontWeight="700" fill="#15212b" letterSpacing="2">
          ALLEY
        </text>

        {/* private line: basement → city tap */}
        <path d="M246 172 L600 226" stroke="#b45f06" strokeWidth="9" strokeLinecap="round" />
        <text x="410" y="178" textAnchor="middle" fontSize="14" fontWeight="700" fill="#8a4700" transform="rotate(8.7 410 178)">
          Your private sewer line
        </text>
        <text x="385" y="219" textAnchor="middle" fontSize="12" fontStyle="italic" fill="#46535e" transform="rotate(8.7 385 219)">
          exact route and depth: not on any public record
        </text>

        {/* city sewer */}
        <circle cx="628" cy="230" r="24" fill="#0d5c6b" />
        <circle cx="628" cy="230" r="15" fill="#5d9aa6" />
        <circle cx="600" cy="226" r="5" fill="#f6f3ec" stroke="#b45f06" strokeWidth="3" />
        <text x="710" y="152" textAnchor="end" fontSize="14" fontWeight="800" fill="#083e49">
          City sewer
        </text>
        {cityDetail && (
          <text x="710" y="170" textAnchor="end" fontSize="13" fontWeight="600" fill="#083e49">
            {cityDetail}
          </text>
        )}

        {/* ownership bar */}
        <rect x="20" y="270" width="590" height="24" rx="4" fill="#fbefdf" stroke="#b45f06" strokeWidth="1.5" />
        <text x="315" y="287" textAnchor="middle" fontSize="13" fontWeight="800" fill="#8a4700" letterSpacing="1">
          YOU OWN — house drains to the connection at the city sewer
        </text>
        <rect x="614" y="270" width="96" height="24" rx="4" fill="#e3eff1" stroke="#0d5c6b" strokeWidth="1.5" />
        <text x="662" y="287" textAnchor="middle" fontSize="13" fontWeight="800" fill="#083e49" letterSpacing="1">
          CITY OWNS
        </text>
      </svg>
      <figcaption className="mt-2 text-sm text-ink-3">
        Typical Detroit layout, based on DWSD&apos;s diagram. Not to scale, and not the actual route of your pipe.
      </figcaption>
    </figure>
  );
}

// Phone-sized version: the wide drawing's labels become unreadable below ~600px.
function OwnershipChain({ cityDetail }: { cityDetail: string | null }) {
  const row = "flex items-start gap-3 rounded-xl px-4 py-3";
  return (
    <ol className="space-y-1.5 sm:hidden print:hidden" aria-label="Who owns each part of the sewer connection">
      <li className={`${row} bg-own-tint`}>
        <span className="mt-0.5 w-[4.6rem] shrink-0 text-xs font-extrabold uppercase tracking-wide text-[#8a4700]">You own</span>
        <span className="font-semibold">Drains inside your house and basement</span>
      </li>
      <li className={`${row} bg-own-tint`}>
        <span className="mt-0.5 w-[4.6rem] shrink-0 text-xs font-extrabold uppercase tracking-wide text-[#8a4700]">You own</span>
        <span>
          <span className="block font-semibold">Your private sewer line, under the yard to the alley</span>
          <span className="block text-sm italic text-ink-2">Exact route and depth: not on any public record</span>
        </span>
      </li>
      <li className={`${row} bg-own-tint`}>
        <span className="mt-0.5 w-[4.6rem] shrink-0 text-xs font-extrabold uppercase tracking-wide text-[#8a4700]">You own</span>
        <span className="font-semibold">The connection where it meets the city sewer</span>
      </li>
      <li className={`${row} bg-brand-tint`}>
        <span className="mt-0.5 w-[4.6rem] shrink-0 text-xs font-extrabold uppercase tracking-wide text-brand-ink">City owns</span>
        <span>
          <span className="block font-semibold">The city sewer under the alley</span>
          {cityDetail && <span className="block text-sm text-ink-2">Near you: {cityDetail}</span>}
        </span>
      </li>
    </ol>
  );
}
