// Loads MapLibre on the client and points it at the worker copied to /maplibre by scripts/copy-maplibre.mjs.
export const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

export async function loadMaplibre() {
  const maplibregl = await import("maplibre-gl");
  maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
  return maplibregl;
}
