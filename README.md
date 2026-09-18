# BelowTrace Detroit

**Sewage in your basement? Start here.** → **[belowtrace.vercel.app](https://belowtrace.vercel.app)**

Enter a Detroit address and get a one-page answer to four questions:

1. **Whose pipe is it?** In Detroit the sewer line from your house to the alley sewer is yours; the City owns the sewer under the alley.
2. **Will anyone help pay?** The City's $184M Alley Sewer Repair Program, the Private Sewer Repair Program (up to $40,000), Critical Home Repair, DWSD damage claims and HOPE — checked against your address, with deadlines.
3. **What do I do first?** A step-by-step plan for your situation, with real dates (the 45-day claim window, program deadlines).
4. **What do the records show?** The nearest recorded city sewer (install year, size, material, depth), DWSD sewer work nearby, and neighbors' 311 reports — every fact labeled **Recorded**, **Estimated** or **Unknown**, with its source.

Built for the Venture 313 Buildathon 2026 · Challenge 03: Reliable Transportation, Infrastructure & Sustainability.

## Why

**[See the citywide map →](https://belowtrace.vercel.app/map)** 5,053 of 14,115 water-in-basement reports since 2023 (36%) came from outside every neighborhood the $40,000 Private Sewer Repair Program serves.

- 14,115 "water in basement" investigations were requested through Detroit 311 between January 2023 and September 2026.
- DWSD says about 1 in 3 private sewer connections is clogged, offset or disconnected; repairs "can easily exceed $10,000".
- The City now has money for this — but the $184M alley program has no application and no address lookup, the PSRP guide lists two different income limits (80% on pp. 3–4, 50% on p. 10), and the programs live on different pages run by different departments.

## What it deliberately doesn't do

- **It never draws a guessed pipe.** No public record locates private sewer lines; only a camera inspection can. The ownership diagram is a labeled schematic, and the map shows only recorded public assets.
- It is not a utility locate, an inspection, or legal advice. Only the programs decide eligibility.

## Try it

| Address | What it shows |
|---|---|
| 16776 Prevost St | A 1928 combined sewer 24 m away; 43 water-in-basement reports nearby; inside the PSRP area |
| 16821 Fenmore St | DWSD alley sewer work under construction 68 m away |
| 14600 Archdale St | Outside the PSRP area — see how the options change |

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 25 unit tests (eligibility rules, geo lookups, plans, deadlines)
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
- `src/lib/programs.ts`, `glance.ts`, `plan.ts` — program cards, the at-a-glance summary and the step plan.
- `src/lib/geo.ts` — spatial lookups (Flatbush index) over the bundled data.
- `src/lib/sources.ts` — live geocoder, parcel, FEMA and HUD calls with timeouts; failures become "Unknown", never "No".
- `GET /api/report?address=…&situation=backup|broken-line|checking` returns the full report as JSON.

## Data sources

City of Detroit Parcels; DWSD sewer cleaning dashboard (gravity mains, partial coverage); DWSD Capital Improvement Projects; CDBG-DR PSRP neighborhoods; Improve Detroit 311; FEMA National Flood Hazard Layer; HUD Low/Mod Income by Block Group (ACS 2016–2020); MSHDA income limits (effective May 1, 2026); PSRP Program Guide (9/2025) and Policy & Procedure (4/2026); DWSD and HRD program pages. Full list with links on the in-app **Data & method** page.

## AI and data disclosure

Built with AI coding assistance (Claude). The app itself uses no AI at runtime: every statement comes from public data or published program rules through deterministic code.

## License

MIT
