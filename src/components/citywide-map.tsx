"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { BASEMAP_STYLE, loadMaplibre } from "@/lib/maplibre";

type Filter = "all" | "outside";

export function CitywideMap() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [showPsrp, setShowPsrp] = useState(true);
  const [showWork, setShowWork] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [maplibregl, points] = await Promise.all([
          loadMaplibre(),
          fetch("/data/wib-points.json").then((r) => r.json() as Promise<[number, number, 0 | 1][]>),
        ]);
        if (cancelled || !ref.current) return;
        const map = new maplibregl.Map({
          container: ref.current,
          style: BASEMAP_STYLE,
          center: [-83.1, 42.37],
          zoom: 10.6,
          minZoom: 9.5,
          maxZoom: 17,
          cooperativeGestures: true,
          attributionControl: { compact: true },
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

        map.on("load", () => {
          map.addSource("psrp", { type: "geojson", data: "/data/psrp-areas.json" });
          map.addSource("work", { type: "geojson", data: "/data/active-projects.json" });
          map.addSource("reports", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: points.map(([x, y, inside]) => ({ type: "Feature", properties: { in: inside }, geometry: { type: "Point", coordinates: [x, y] } })),
            },
          });

          map.addLayer({ id: "psrp-fill", type: "fill", source: "psrp", paint: { "fill-color": "#1d6f45", "fill-opacity": 0.1 } });
          map.addLayer({ id: "psrp-line", type: "line", source: "psrp", paint: { "line-color": "#1d6f45", "line-width": 1.4, "line-opacity": 0.8 } });
          map.addLayer({
            id: "reports-heat",
            type: "heatmap",
            source: "reports",
            maxzoom: 15,
            paint: {
              "heatmap-weight": 0.55,
              "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 3, 11, 6, 13, 12, 15, 20],
              "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 9, 0.35, 12, 0.6, 15, 1.2],
              "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0.8, 15, 0],
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0, "rgba(246,243,236,0)",
                0.1, "rgba(247,215,166,0.55)",
                0.35, "#f0b36a",
                0.6, "#e07b2a",
                0.85, "#b8460b",
                1, "#7a1f0e",
              ],
            },
          });
          map.addLayer({
            id: "reports-dots",
            type: "circle",
            source: "reports",
            minzoom: 13,
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 2.5, 17, 6],
              "circle-color": ["case", ["==", ["get", "in"], 1], "#0d5c6b", "#c8540c"],
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1,
              "circle-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 14, 0.9],
            },
          });
          map.addLayer({ id: "work", type: "line", source: "work", paint: { "line-color": "#7c3aed", "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.5, 15, 5] } });

          const popup = new maplibregl.Popup({ closeButton: false, maxWidth: "240px" });
          map.on("click", "psrp-fill", (e) => {
            const name = e.features?.[0]?.properties?.name;
            popup.setLngLat(e.lngLat).setHTML(`<strong>${String(name).replace(/</g, "&lt;")}</strong><br>Private Sewer Repair Program area`).addTo(map);
          });
          map.on("click", "work", (e) => {
            const p = e.features?.[0]?.properties ?? {};
            popup
              .setLngLat(e.lngLat)
              .setHTML(`<strong>${String(p.name).replace(/</g, "&lt;")}</strong><br>DWSD sewer work · ${p.phase === "Construction" ? "under construction" : "being bid"} · ${p.years}`)
              .addTo(map);
          });
          for (const id of ["psrp-fill", "work"]) {
            map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
            map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
          }
          setReady(true);
        });
      } catch (err) {
        console.warn("[citywide map]", err);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const f = filter === "outside" ? ["==", ["get", "in"], 0] : null;
    map.setFilter("reports-heat", f as never);
    map.setFilter("reports-dots", f as never);
    for (const id of ["psrp-fill", "psrp-line"]) map.setLayoutProperty(id, "visibility", showPsrp ? "visible" : "none");
    map.setLayoutProperty("work", "visibility", showWork ? "visible" : "none");
  }, [filter, showPsrp, showWork, ready]);

  if (failed) {
    return <div className="grid h-96 place-items-center rounded-2xl border border-dashed border-line-2 bg-sunk p-6 text-center text-ink-2">The map couldn&apos;t load on this device.</div>;
  }

  const chip = (on: boolean) =>
    `inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border-2 px-3.5 text-sm font-semibold ${on ? "border-ink bg-ink text-white" : "border-line-2 bg-surface text-ink hover:border-ink"}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap gap-2 border-b border-line p-3" role="group" aria-label="Map layers">
        <button type="button" className={chip(filter === "all")} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
          All water-in-basement reports
        </button>
        <button type="button" className={chip(filter === "outside")} aria-pressed={filter === "outside"} onClick={() => setFilter("outside")}>
          Only outside PSRP areas
        </button>
        <label className={chip(showPsrp)}>
          <input type="checkbox" className="sr-only" checked={showPsrp} onChange={(e) => setShowPsrp(e.target.checked)} />
          PSRP areas
        </label>
        <label className={chip(showWork)}>
          <input type="checkbox" className="sr-only" checked={showWork} onChange={(e) => setShowWork(e.target.checked)} />
          Active sewer work
        </label>
      </div>
      <div ref={ref} className="h-[30rem] w-full bg-sunk sm:h-[38rem]" role="region" aria-label="Map of Detroit water-in-basement reports and repair program areas" />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-3 text-sm text-ink-2">
        <span className="flex items-center gap-2">
          <span className="h-3 w-16 rounded-sm bg-gradient-to-r from-[#f7d7a6] via-[#ee9b45] to-[#7a1f0e]" aria-hidden="true" /> 311 reports (denser = more)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-4 rounded-sm border-2 border-go bg-go/15" aria-hidden="true" /> PSRP area (up to $30,000)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1 w-5 rounded bg-[#7c3aed]" aria-hidden="true" /> DWSD sewer work under way or being bid
        </span>
        <span className="text-xs text-ink-3">Zoom in to see individual reports: blue = inside PSRP, orange = outside.</span>
      </div>
    </div>
  );
}
