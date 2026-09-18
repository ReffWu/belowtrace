// MapLibre v6 loads its web worker relative to its own module URL, which bundlers rewrite.
// Serve the worker (and the shared chunk it imports) from /maplibre/ instead; see records-map.tsx.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = dirname(createRequire(import.meta.url).resolve("maplibre-gl/package.json")) + "/dist";
const out = join(root, "public/maplibre");
mkdirSync(out, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) copyFileSync(join(dist, f), join(out, f));
console.log("maplibre worker -> public/maplibre");
