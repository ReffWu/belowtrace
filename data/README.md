# BelowTrace data receipt

The application commits compact, derived data in `src/data/` and `public/data/` so a deployment is reproducible. The source GeoJSON downloads in `data/raw/*.geojson` are intentionally not committed: together they are about 48 MB and are regenerated from public City and DWSD ArcGIS services.

`manifest.json` is the reviewable receipt for the snapshot in use. It records every query endpoint, filter, feature count and SHA-256 of the local raw download. It contains no resident-entered data.

## Refreshing the snapshot

```bash
npm run data
BASE=http://localhost:3000 node scripts/build-golden.mjs
```

`npm run data` downloads the raw public layers, rewrites `data/manifest.json`, then rebuilds the committed derived data. Review the manifest and the resulting app changes before committing. If raw files were supplied separately instead, run:

```bash
python3 scripts/write_data_manifest.py
node scripts/build-data.mjs
```

The underlying sources can change, disappear, or alter their schema. A matching SHA-256 proves which local input produced a snapshot; it does not make a public dataset authoritative or complete.
