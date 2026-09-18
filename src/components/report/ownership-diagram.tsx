import type { Parcel, Report, SewerMain } from "@/lib/types";

// A section drawing of this lot, built from its own records: lot depth (City parcel data), the nearest
// recorded city sewer (DWSD) and which side of the lot it runs on. Horizontal distances are to scale;
// depth is exaggerated. The private line's route is never known, so it is drawn dashed and labeled so.

type Props = { parcel: Parcel | null; main: SewerMain | null; side: Report["mainSide"] };

const W = 960;
const H = 500;
const GRADE = 190;
const SOIL_BOTTOM = 350;
const V = 10; // px per foot of depth (vertical exaggeration)
const ALLEY_FT = 18; // typical Detroit alley width
const BASEMENT_FT = 7;
const TYPICAL_LOT_FT = 120;

const C = {
  ink: "#15212b",
  ink2: "#46535e",
  ink3: "#7b8791",
  line: "#cfc7b8",
  soilTop: "#efe7d7",
  soilBottom: "#ddcfb6",
  own: "#b45f06",
  city: "#0d5c6b",
  house: "#26343f",
  roof: "#1a252e",
  paper: "#f6f3ec",
};

function describeMain(m: SewerMain) {
  return [m.installYear ? `laid ${m.installYear}` : null, m.sizeIn ? `${m.sizeIn}-inch` : null, m.materialLabel ?? (m.material ? `material ${m.material}` : null)]
    .filter(Boolean)
    .join(" · ");
}

export function OwnershipDiagram({ parcel, main, side }: Props) {
  // Use the recorded main only when it plausibly serves this lot: on the rear or front, within ~45 m.
  const usable = main && (side === "rear" || side === "front") && main.distanceM <= 45 ? main : null;
  const atFront = usable ? side === "front" : false;
  const lotFt = parcel?.depthFt && parcel.depthFt > 40 && parcel.depthFt < 400 ? parcel.depthFt : null;
  const lotDepth = lotFt ?? TYPICAL_LOT_FT;

  // Horizontal layout: [street | lot | alley], lot drawn to scale.
  const left = 40;
  const streetW = 96;
  const lotW = 560;
  const s = lotW / lotDepth; // px per foot
  const alleyW = Math.min(150, Math.max(70, ALLEY_FT * s));
  const pl0 = left + streetW; // front property line
  const pl1 = pl0 + lotW; // rear property line
  const alleyX0 = pl1;
  const alleyX1 = pl1 + alleyW;

  // House: typical 20 ft setback, footprint about 30% of lot depth (illustrative).
  const hx0 = pl0 + Math.min(20 * s, lotW * 0.2);
  const hw = Math.max(lotW * 0.3, 150);
  const hx1 = hx0 + hw;
  const basementY = GRADE + BASEMENT_FT * V;

  // City sewer: under the alley (rear) or the street (front).
  const depthFt = usable?.depthFt && usable.depthFt > 3 && usable.depthFt < 30 ? usable.depthFt : null;
  const mainR = Math.max(18, Math.min(34, ((usable?.sizeIn ?? 12) / 12) * V * 1.4));
  const mainY = Math.min(GRADE + (depthFt ?? 9.5) * V, SOIL_BOTTOM - mainR - 8);
  const mainX = atFront ? left + streetW / 2 : (alleyX0 + alleyX1) / 2;
  const tapX = atFront ? mainX + mainR * 0.78 : mainX - mainR * 0.78;
  const tapY = mainY - mainR * 0.62;
  const lateralStartX = atFront ? hx0 + 6 : hx1 - 6;
  const midX = (lateralStartX + tapX) / 2;

  const summary = [
    `Section through this lot${lotFt ? `, ${lotFt} feet deep according to City parcel records` : ""}.`,
    usable
      ? `The nearest recorded city sewer runs under the ${atFront ? "street in front of" : "alley behind"} the house${usable.installYear ? `, laid in ${usable.installYear}` : ""}${depthFt ? `, about ${depthFt} feet deep` : ""}.`
      : "The city sewer serving this home is not in the public data; in Detroit it usually runs under the alley.",
    "You own the private sewer line from the house to the connection at the city sewer; its exact route is not on any public record.",
  ].join(" ");

  const ownFrom = atFront ? tapX : pl0 - 8;
  const ownTo = atFront ? pl1 : tapX;
  const bracketY = SOIL_BOTTOM + 20;

  return (
    <figure className="print-break-avoid">
      <OwnershipChain parcel={parcel} main={usable} atFront={atFront} lotFt={lotFt} />
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="hidden h-auto w-full sm:block print:block">
        <defs>
          <linearGradient id="bt-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.soilTop} />
            <stop offset="1" stopColor={C.soilBottom} />
          </linearGradient>
          <radialGradient id="bt-main" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#e3e8e9" />
            <stop offset="0.55" stopColor="#a9b4b7" />
            <stop offset="1" stopColor="#6d7a7e" />
          </radialGradient>
          <linearGradient id="bt-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2e8a99" />
            <stop offset="1" stopColor="#0b4550" />
          </linearGradient>
          <linearGradient id="bt-house" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2f3f4b" />
            <stop offset="1" stopColor={C.house} />
          </linearGradient>
          <pattern id="bt-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="#c9bda6" strokeWidth="1" />
          </pattern>
          <marker id="bt-tick" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M5 0 V10" stroke={C.ink3} strokeWidth="1.4" />
          </marker>
        </defs>

        {/* ground */}
        <rect x={left} y={GRADE} width={alleyX1 + 40 - left} height={SOIL_BOTTOM - GRADE} fill="url(#bt-soil)" />
        {[0.3, 0.64].map((f) => (
          <line key={f} x1={left} x2={alleyX1 + 40} y1={GRADE + (SOIL_BOTTOM - GRADE) * f} y2={GRADE + (SOIL_BOTTOM - GRADE) * f} stroke="#d2c4a9" strokeDasharray="2 7" />
        ))}
        <rect x={left} y={GRADE - 5} width={streetW} height="5" rx="1" fill="#8e979c" />
        <rect x={alleyX0} y={GRADE - 4} width={alleyW} height="4" rx="1" fill="#a7afb3" />
        <line x1={left} x2={alleyX1 + 40} y1={GRADE} y2={GRADE} stroke="#9c8f77" strokeWidth="1.5" />
        <text x={left + streetW / 2} y={GRADE - 16} textAnchor="middle" fontSize="11.5" fontWeight="700" letterSpacing="1.8" fill={C.ink2}>
          STREET
        </text>
        <text x={(alleyX0 + alleyX1) / 2} y={GRADE - 16} textAnchor="middle" fontSize="11.5" fontWeight="700" letterSpacing="1.8" fill={C.ink2}>
          ALLEY
        </text>

        {/* property lines */}
        {[pl0, pl1].map((x) => (
          <line key={x} x1={x} x2={x} y1={24} y2={SOIL_BOTTOM} stroke={C.ink3} strokeWidth="1" strokeDasharray="4 5" />
        ))}

        {/* lot depth dimension */}
        <line x1={pl0} x2={pl1} y1={34} y2={34} stroke={C.ink3} strokeWidth="1.2" markerStart="url(#bt-tick)" markerEnd="url(#bt-tick)" />
        <rect x={(pl0 + pl1) / 2 - 116} y={23} width="232" height="22" rx="4" fill="#ffffff" />
        <text x={(pl0 + pl1) / 2} y={38} textAnchor="middle" fontSize="13" fontWeight="700" fill={C.ink}>
          {lotFt ? `${lotFt} ft lot depth` : "Lot depth not on record"}
          {lotFt && (
            <tspan fontWeight="500" fill={C.ink3}>
              {" "}· City record
            </tspan>
          )}
        </text>

        {/* house */}
        <path d={`M${hx0 - 10} ${GRADE - 76} L${(hx0 + hx1) / 2} ${GRADE - 114} L${hx1 + 10} ${GRADE - 76} Z`} fill={C.roof} />
        <rect x={hx0} y={GRADE - 78} width={hw} height="78" fill="url(#bt-house)" />
        {[0.18, 0.64].map((f) => (
          <rect key={f} x={hx0 + hw * f} y={GRADE - 58} width={hw * 0.16} height="22" rx="2" fill="#d9d2c3" />
        ))}
        <rect x={hx0 + hw * 0.43} y={GRADE - 44} width={hw * 0.13} height="44" rx="2" fill="#10181e" />
        <text x={(hx0 + hx1) / 2} y={GRADE - 124} textAnchor="middle" fontSize="12.5" fontWeight="600" fill={C.ink2}>
          {parcel?.yearBuilt ? `Built ${parcel.yearBuilt}` : "House"}
          {parcel?.frontageFt ? ` · ${parcel.frontageFt} ft wide lot` : ""}
        </text>

        {/* basement */}
        <rect x={hx0 + 6} y={GRADE} width={hw - 12} height={BASEMENT_FT * V} fill="#e8e1d3" />
        <rect x={hx0 + 6} y={GRADE} width={hw - 12} height={BASEMENT_FT * V} fill="url(#bt-hatch)" opacity="0.55" />
        <rect x={hx0 + 6} y={GRADE} width={hw - 12} height={BASEMENT_FT * V} fill="none" stroke="#a89c86" strokeWidth="1.2" />
        <text x={(hx0 + hx1) / 2} y={GRADE + (BASEMENT_FT * V) / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="2" fill={C.ink2}>
          BASEMENT
        </text>

        {/* private line: route unknown, so dotted */}
        <path
          d={`M${lateralStartX} ${basementY - 8} C ${midX} ${basementY - 4}, ${midX} ${tapY - 2}, ${tapX} ${tapY}`}
          fill="none"
          stroke={C.own}
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeDasharray="0.5 12"
        />

        {/* city sewer */}
        <circle
          cx={mainX}
          cy={mainY}
          r={mainR}
          fill={usable ? "url(#bt-main)" : C.paper}
          stroke={usable ? "#5d6a6e" : C.ink3}
          strokeWidth="1.5"
          strokeDasharray={usable ? undefined : "4 4"}
        />
        {usable && (
          <>
            <circle cx={mainX} cy={mainY} r={mainR * 0.72} fill="#20303a" />
            <path
              d={`M${mainX - mainR * 0.72} ${mainY + mainR * 0.12} A ${mainR * 0.72} ${mainR * 0.72} 0 0 0 ${mainX + mainR * 0.72} ${mainY + mainR * 0.12} Z`}
              fill="url(#bt-water)"
            />
          </>
        )}
        {!usable && (
          <text x={mainX} y={mainY + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={C.ink3}>
            ?
          </text>
        )}
        <circle cx={tapX} cy={tapY} r="6" fill={C.paper} stroke={C.own} strokeWidth="3" />

        {usable && depthFt && (
          <g>
            <line
              x1={atFront ? mainX - mainR - 12 : mainX + mainR + 14}
              x2={atFront ? mainX - mainR - 12 : mainX + mainR + 14}
              y1={GRADE}
              y2={mainY}
              stroke={C.ink3}
              strokeWidth="1.1"
              markerStart="url(#bt-tick)"
              markerEnd="url(#bt-tick)"
            />
            <text
              x={atFront ? mainX - mainR - 18 : mainX + mainR + 20}
              y={(GRADE + mainY) / 2 + 4}
              textAnchor={atFront ? "end" : "start"}
              fontSize="12"
              fontWeight="700"
              fill={C.ink}
            >
              ≈{depthFt} ft
            </text>
          </g>
        )}

        {/* ownership bracket */}
        <path d={`M${ownFrom} ${bracketY} v 10 H ${ownTo} v -10`} fill="none" stroke={C.own} strokeWidth="2" />
        <path d={`M${ownTo} ${bracketY} v 10 H ${atFront ? left : alleyX1 + 40}`} fill="none" stroke={C.city} strokeWidth="2" />
        <text x={(ownFrom + ownTo) / 2} y={bracketY + 28} textAnchor="middle" fontSize="11.5" fontWeight="800" letterSpacing="1.6" fill="#8a4700">
          YOU OWN
        </text>
        <text x={atFront ? (left + ownTo) / 2 : (ownTo + alleyX1 + 40) / 2} y={bracketY + 28} textAnchor="middle" fontSize="11.5" fontWeight="800" letterSpacing="1.6" fill={C.city}>
          CITY
        </text>

        {/* legend rows under the drawing */}
        <g fontSize="12.5">
          <circle cx={left + 8} cy={H - 76} r="5" fill={C.own} />
          <text x={left + 22} y={H - 72} fontWeight="800" fill="#8a4700">
            You own
          </text>
          <text x={left + 86} y={H - 72} fill={C.ink2}>
            house drains, your sewer line (route and condition not on any public record), and the connection
          </text>
          <circle cx={left + 8} cy={H - 50} r="5" fill={C.city} />
          <text x={left + 22} y={H - 46} fontWeight="800" fill={C.city}>
            City owns
          </text>
          <text x={left + 94} y={H - 46} fill={C.ink2}>
            {usable
              ? `the sewer under the ${atFront ? "street" : "alley"}: ${describeMain(usable)}${usable.systemLabel ? `, ${usable.systemLabel}` : ""} · DWSD record`
              : "the sewer under the alley or street — not in public data, ask DWSD"}
          </text>
        </g>

        <text x={W - 16} y={H - 6} textAnchor="end" fontSize="10.5" fill={C.ink3}>
          Horizontal to scale{lotFt ? "" : " (typical lot)"} · depth exaggerated · house footprint and line route illustrative
        </text>
      </svg>
    </figure>
  );
}

// Phone-sized version of the same facts.
function OwnershipChain({ parcel, main, atFront, lotFt }: { parcel: Parcel | null; main: SewerMain | null; atFront: boolean; lotFt: number | null }) {
  const row = "flex items-start gap-3 rounded-xl px-4 py-3";
  const tag = "mt-0.5 w-[4.6rem] shrink-0 text-xs font-extrabold uppercase tracking-wide";
  return (
    <ol className="space-y-1.5 sm:hidden print:hidden" aria-label="Who owns each part of the sewer connection">
      <li className={`${row} bg-own-tint`}>
        <span className={`${tag} text-[#8a4700]`}>You own</span>
        <span>
          <span className="block font-semibold">Drains in your house and basement</span>
          {parcel?.yearBuilt && <span className="block text-sm text-ink-2">House built {parcel.yearBuilt} · City record</span>}
        </span>
      </li>
      <li className={`${row} bg-own-tint`}>
        <span className={`${tag} text-[#8a4700]`}>You own</span>
        <span>
          <span className="block font-semibold">Your sewer line, under the yard to the {atFront ? "street" : "alley"}</span>
          <span className="block text-sm text-ink-2">
            {lotFt ? `Across a ${lotFt} ft deep lot · ` : ""}
            <em>route and condition not on any public record</em>
          </span>
        </span>
      </li>
      <li className={`${row} bg-own-tint`}>
        <span className={`${tag} text-[#8a4700]`}>You own</span>
        <span className="font-semibold">The connection where it meets the city sewer</span>
      </li>
      <li className={`${row} bg-brand-tint`}>
        <span className={`${tag} text-brand-ink`}>City owns</span>
        <span>
          <span className="block font-semibold">The city sewer under the {atFront ? "street" : "alley"}</span>
          <span className="block text-sm text-ink-2">
            {main ? `${describeMain(main)}${main.depthFt ? ` · ≈${main.depthFt} ft deep` : ""} · DWSD record` : "Not in public data — ask DWSD"}
          </span>
        </span>
      </li>
    </ol>
  );
}
