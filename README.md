# BelowTrace Detroit

**Sewage in your basement? Start here.** → **[belowtrace.vercel.app](https://belowtrace.vercel.app)**

BelowTrace stays with a Detroit resident through a sewer backup, from the first phone call to the last claim. It starts by showing the whole road — four steps — and then walks it with them:

1. **Call DWSD** (free; they check the city sewer). What to say when they answer; then write down the service request number, the date and the address.
2. **DWSD checks.** What to ask the crew, and a calendar reminder to call back if no one comes in two days. Record what they found.
3. **Whose pipe.** The City's: go to step 4. The owner's: what to tell the plumber (camera video, where the break is, a written quote with a permit), and where the break turned out to be.
4. **Get it paid for.** The City's pipe: the 45-day damage-claim deadline, an evidence checklist and a reminder. The owner's line: only the programs that fit this home and this break, and why each other program doesn't.

Every answer moves the case forward, and a mistaken one can be undone. From the first screen, a **Who pays, so far** card shows each cost — fixing the pipe, the damage, today's cleanup — what it typically runs (DWSD's own handbook: $5,000–$20,000 for a private line) and what evidence or official decision would be needed. Weather is recorded as a case fact, but it does not decide a DWSD claim. Cause, responsibility and any claim outcome require DWSD's investigation and the applicable legal process. Anyone who may qualify for PSRP is told to apply before signing a repair contract, since the program can't pay for work that starts before its review. The case — dates, numbers, findings — lives only on the resident's phone and prints as a one-page case file for DWSD, a plumber or a program. A plumber's quote opens a case at step 3. "Just curious" shows what public records say is under a home, including a 3D view of the parcel, the building and the nearest recorded city sewer. The private line is never drawn, because no public record locates it.

Built for the Venture 313 Buildathon 2026 · Challenge 03: Reliable Transportation, Infrastructure & Sustainability.

## Why

**[See the citywide map →](https://belowtrace.vercel.app/map)** 5,053 of 14,115 water-in-basement reports since 2023 (36%) came from outside every neighborhood the $40,000 Private Sewer Repair Program serves.

- 14,115 "water in basement" investigations were requested through Detroit 311 between January 2023 and September 2026. These are requests, not confirmed incidents or unique households.
- DWSD says about 1 in 3 private sewer connections is clogged, offset or disconnected; repairs "can easily exceed $10,000".
- The City now has money for this — but the $184M alley program has no application and no address lookup, the PSRP guide lists two different income limits (80% on pp. 3–4, 50% on p. 10), and the programs live on different pages run by different departments.

## What it deliberately doesn't do

- **It never draws a guessed pipe.** No public record locates private sewer lines; only a camera inspection can. The ownership diagram is a labeled schematic, and the map shows only recorded public assets.
- It is not a utility locate, an inspection, or legal advice. Only the programs decide eligibility.

## Try it

| Address | What it shows |
|---|---|
| [16776 Prevost St](https://belowtrace.vercel.app/case?address=16776+Prevost+St) | A 1928 combined sewer 24 m away; 43 water-in-basement reports nearby; inside the PSRP area |
| [16821 Fenmore St](https://belowtrace.vercel.app/plan?address=16821+Fenmore+St&situation=checking) | DWSD alley sewer work under construction 68 m away |
| [14600 Archdale St](https://belowtrace.vercel.app/case?address=14600+Archdale+St) | Outside the PSRP area — see how the options change |

The full record for any address is still at `/report?address=…`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests (eligibility rules, program matching, geo lookups, plans, deadlines)
npm run build
```

Refresh the open-data snapshot (needs Python 3):

```bash
npm run data       # scripts/fetch_data.py → data/raw, then scripts/build-data.mjs → src/data
BASE=http://localhost:3000 node scripts/build-golden.mjs   # saved demo reports (offline fallback)
```

## How it works

```
address ─► Esri geocoder (Census backup) ─► City parcel (exact match, else nearest)
        ├► FEMA flood zone (live)             ├► HUD low/mod income block group (live)
        └► bundled City/DWSD open data: PSRP neighborhoods · sewer mains · sewer projects · 311 reports
                        │
                        ▼
      program rules (src/lib/facts.ts, psrp.ts, programs.ts) ─► report page + JSON API
```

- `src/lib/facts.ts` — every phone number, deadline, income limit and source URL, with the date it was checked.
- `src/lib/psrp.ts` — the PSRP screener rules, citing page numbers in the City's guide.
- `src/lib/case.ts` — the case: its four steps, what moves it forward, reminders.
- `src/lib/money.ts` — who pays, so far: each cost, its typical amount, and who is likely to pay, given the answers so far.
- `src/lib/guide.ts` — which programs fit this home and this problem, and why the others don't.
- `src/lib/programs.ts`, `glance.ts`, `plan.ts` — program cards, the at-a-glance summary and the step plan for the full record page.
- `src/lib/geo.ts` — spatial lookups (Flatbush index) over the bundled data.
- `src/lib/sources.ts` — live geocoder, parcel, FEMA and HUD calls with timeouts; failures become "Unknown", never "No".
- `GET /api/report?address=…&situation=backup|broken-line|checking` returns the full report as JSON.

## Data sources

City of Detroit Parcels; DWSD sewer cleaning dashboard (gravity mains, partial coverage); DWSD Capital Improvement Projects; CDBG-DR PSRP neighborhoods; Improve Detroit 311; FEMA National Flood Hazard Layer; HUD Low/Mod Income by Block Group (ACS 2016–2020); MSHDA income limits (effective May 1, 2026); PSRP Program Guide (9/2025) and Policy & Procedure (4/2026); DWSD and HRD program pages. Full list with links on the in-app **Data & method** page.

The large source GeoJSON downloads are regenerated locally rather than committed. [`data/manifest.json`](data/manifest.json) records the public query, record count and SHA-256 for the snapshot that produced the bundled data; [`data/README.md`](data/README.md) explains the refresh process.

## AI and data disclosure

Built with AI coding assistance (Claude). The app itself uses no AI at runtime: every statement comes from public data or published program rules through deterministic code.

## License

MIT
