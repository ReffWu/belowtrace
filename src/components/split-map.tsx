"use client";

// One picture, two layers, no controls. Where people report sewage in their basement, and
// where the first $184M of contracts is going. The argument is that they do not overlap.
import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { BASEMAP_STYLE, loadMaplibre } from "@/lib/maplibre";

export function SplitMap({ height = "clamp(20rem, 58vw, 30rem)" }: { height?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: import("maplibre-gl").Map | undefined;
    (async () => {
      try {
        const [maplibregl, points] = await Promise.all([
          loadMaplibre(),
          fetch("/data/wib-points.json").then((r) => r.json() as Promise<[number, number, 0 | 1][]>),
        ]);
        if (cancelled || !ref.current) return;
        map = new maplibregl.Map({
          container: ref.current,
          style: BASEMAP_STYLE,
          center: [-83.1, 42.375],
          zoom: 10.1,
          minZoom: 9.4,
          maxZoom: 15,
          cooperativeGestures: true,
          attributionControl: { compact: true },
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

        map.on("load", () => {
          if (!map) return;
          map.addSource("reports", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: points.map(([x, y]) => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [x, y] } })),
            } as GeoJSON.FeatureCollection,
          });
          map.addSource("asrp", { type: "geojson", data: "/data/asrp-selected.json" });
          // 138 alley segments are a few dozen meters long each: invisible at city zoom.
          // A halo at their centroid keeps the second layer readable until you zoom in.
          map.addSource("asrp-pts", { type: "geojson", data: "/data/asrp-points.json" });

          map.addLayer({
            id: "reports",
            type: "circle",
            source: "reports",
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 9.5, 1.5, 13, 3.4],
              "circle-color": "#2bb3c4",
              "circle-opacity": 0.45,
            },
          });
          map.addLayer({
            id: "asrp-halo",
            type: "circle",
            source: "asrp-pts",
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 9.5, 8, 12, 14, 15, 4],
              "circle-color": "#ff8a3d",
              "circle-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0.3, 14, 0],
              "circle-blur": 0.85,
            },
          });
          map.addLayer({
            id: "asrp-dot",
            type: "circle",
            source: "asrp-pts",
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 9.5, 3.2, 12, 5, 15, 0],
              "circle-color": "#ff7a1f",
              "circle-opacity": ["interpolate", ["linear"], ["zoom"], 13, 1, 14.5, 0],
              "circle-stroke-width": 1.2,
              "circle-stroke-color": "#fff",
              "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0.9, 14.5, 0],
            },
          });
          map.addLayer({
            id: "asrp-glow",
            type: "line",
            source: "asrp",
            paint: { "line-color": "#ff8a3d", "line-width": ["interpolate", ["linear"], ["zoom"], 9.5, 7, 14, 16], "line-opacity": 0.22, "line-blur": 5 },
          });
          map.addLayer({
            id: "asrp",
            type: "line",
            source: "asrp",
            paint: { "line-color": "#ff8a3d", "line-width": ["interpolate", ["linear"], ["zoom"], 9.5, 2.2, 14, 5] },
          });
        });
        map.on("error", () => setFailed(true));
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  if (failed)
    return (
      <div className="grid place-items-center bg-deep-2 p-8 text-center text-white/60" style={{ height }}>
        The map could not load. The numbers beside it come from the same data.
      </div>
    );

  return (
    <div className="relative">
      <div ref={ref} style={{ height }} data-map className="w-full bg-deep-2" aria-label="Map of Detroit: basement flooding reports and contracted alley sewer repairs" role="img" />
      <div className="pointer-events-none absolute left-3 top-3 right-3 flex max-w-[16rem] flex-col gap-1.5 rounded-xl bg-deep/88 px-3 py-2.5 text-[0.78rem] leading-snug shadow-lg backdrop-blur sm:right-auto sm:text-[0.82rem]">
        <span className="flex min-w-0 items-start gap-2 text-white/85">
          <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-glow" /> Water in a basement · 14,115 reports
        </span>
        <span className="flex min-w-0 items-start gap-2 text-white/85">
          <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff7a1f] ring-2 ring-white/70" /> Alleys contracted · 138
        </span>
      </div>
    </div>
  );
}
