# BelowTrace Detroit

**Will the City fix your sewer line, or will you pay for it?** → **[belowtrace.vercel.app](https://belowtrace.vercel.app)**

Detroit is spending **$184,421,000** repairing about 9,000 residential sewer connections over four years. The City picks the alleys itself, from camera data it does not publish. Nobody can apply, there is no list, and nobody is notified either way.

So a homeowner staring at a $15,000 quote has one question — **wait, or pay?** — and no way to answer it.

BelowTrace answers it from one address.

## What you get

**A drawing of what is under the house, in six segments.** Detroit's money is not organised by what happened to you. It is organised by *which part of the pipe broke* — and each segment has a different owner, a different symptom, and an entirely different funding source.

| | Segment | Owner | Who might pay |
|---|---|---|---|
| 1 | Pipes inside the house | You | You · MDHHS emergency relief |
| 2 | The building drain | You | Basement Backup Protection Program |
| 3 | Your private lateral | You | Private Sewer Repair Program (up to $30,000) |
| **4** | **The connection, under the alley** | **You — but under public ground** | **★ Alley Sewer Repair Program — $184M, free, no application ★** |
| 5 | The public sewer main | The City | DWSD |
| 6 | Regional system capacity | GLWA | A damage claim, for losses only |

Segment 4 is where the money is, where ownership is most confusing, and where nothing is knowable — so it is where the work went.

## The finding

DWSD publishes its selection criteria — camera-confirmed lateral defects, recorded alley cave-ins, and federal rules requiring block groups above 50% low-to-moderate income. It does not publish the list.

We queried **all 782 feature services** on the City's ArcGIS organisation. For sewers, exactly two layers are public: catch basins, and gravity mains with recent cleaning work orders. The **30,000+ failed-connection data points** the City says it holds are in none of them.

So we measured the criteria that *do* have open data behind them, against the **138 alleys already under contract** (65 in construction, 73 in procurement) and the **47 alley projects the City completed before this programme**:

| Within 500 m, median | Water in basement | Cave-ins |
|---|---|---|
| Alleys chosen for the programme | **18** | **26** |
| Alley projects completed earlier | 45 | 19 |

Permutation test: **p < 0.0001** for the basement-flooding gap, **p = 0.0115** for the cave-in gap. Across all 14,115 basement-flooding reports, **1.0%** fall within 200 m of a contracted alley.

**The first round tracks collapsed pavement — a City asset liability it can see — rather than flooded basements, which residents report and which may never become a DWSD record.**

And by district:

| District | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| Alleys in round one | 55 | **0** | **0** | **0** | **0** | 80 | 3 |

The City's own Action Plan named Districts 4, 6 and 7 as priorities. District 4 has none.

**This is the first round** — 138 alleys against ~9,000 connections over four years, with field work starting October 2026. That is precisely why it is worth publishing now, while there is still time to steer it. Every caveat is on [`/method`](src/app/method/page.tsx).

## What it refuses to do

- **It never predicts DWSD's decision.** The deciding evidence — the camera inspection of your connection — is not public, and the report says so on every address.
- **It never draws a guessed pipe.** No public record locates a private lateral. The diagram is a labelled schematic; the map shows only recorded public assets.
- **It never states a false probability.** A failed lookup stays unknown, never "no".
- It is not a utility locate, an inspection, or legal advice.

## Routes

| | |
|---|---|
| `/` | The claim, the map, and the address box |
| `/report?address=` | The six segments, who owns each, who might pay — the product |
| `/method` | The test, the numbers, and everything it does not prove |
| `/map` | Both layers, full screen |
| `/notice` | If it already flooded: the 45-day letter Michigan requires, to both agencies |
| `/now` | A day-by-day agenda for an active backup |
| `/sources` · `/about` | Every source with its check date; what is and is not proven |

`GET /api/report?address=…` returns the whole record as JSON.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # 110 tests
npm run build
node scripts/calibrate-asrp.mjs   # regenerates src/data/asrp-calibration.json from the snapshots
```

## Code map

- [`src/lib/asrp.ts`](src/lib/asrp.ts) — the alley-programme reading, measured against the 138 chosen alleys. Never a probability.
- [`scripts/calibrate-asrp.mjs`](scripts/calibrate-asrp.mjs) — the calibration, reproducible from bundled data.
- [`src/lib/anatomy.ts`](src/lib/anatomy.ts) — the six segments: owner, symptom, who pays.
- [`src/lib/law.ts`](src/lib/law.ts) — MCL 691.1416–1419 modelled: the 45-day notice, its six required facts, the exclusions, the two agencies.
- [`src/lib/geo.ts`](src/lib/geo.ts), [`sources.ts`](src/lib/sources.ts), [`report.ts`](src/lib/report.ts) — spatial lookups and live geocoder, parcel, FEMA and HUD calls. Failures become "Unknown", never "No".
- [`src/lib/psrp.ts`](src/lib/psrp.ts) — the PSRP screener, citing page numbers in the City's guide (whose own income limits contradict each other: 80% on pp. 3–4, 50% on p. 10).

## Data

City of Detroit Parcels · DWSD gravity mains (partial coverage) · DWSD Capital Improvement Projects · CDBG-DR PSRP neighbourhoods · City Council districts 2026 · Improve Detroit 311 · FEMA National Flood Hazard Layer · HUD Low/Mod Income by block group · MSHDA income limits · PSRP Program Guide and Policy & Procedure · Michigan Compiled Laws. Full list with check dates in the app.

## Disclosure

Built with AI coding assistance (Claude). The app uses no AI at runtime: every statement comes from public data or a published rule, through deterministic code you can read.

Built for the Venture 313 Buildathon 2026 · Challenge 03: Reliable Transportation, Infrastructure & Sustainability. MIT.
