"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { LngLat, Report311, SewerMain, SewerProject } from "@/lib/types";

type Props = {
  center: LngLat;
  parcel?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  mains: SewerMain[];
  projects: SewerProject[];
  points: Report311[];
};

const STYLE = "https://tiles.openfreemap.org/styles/positron";
const PHASE_COLOR = ["match", ["get", "phase"], "Construction", "#7c3aed", "Procurement", "#db2777", "#8a949c"];
const REPORT_COLOR = ["match", ["get", "type"], "w", "#0d5c6b", "s", "#a52a21", "#e0892b"];

const lines = <T extends { parts: LngLat[][] }>(items: T[], props: (t: T) => Record<string, unknown>): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: items.map((t) => ({ type: "Feature", properties: props(t), geometry: { type: "MultiLineString", coordinates: t.parts } })),
});

function escape(s: unknown) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

export function RecordsMap({ center, parcel, mains, projects, points }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    let cancelled = false;

    (async () => {
      try {
        const maplibregl = await import("maplibre-gl");
        if (cancelled || !ref.current) return;
        maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
        map = new maplibregl.Map({
          container: ref.current,
          style: STYLE,
          center,
          zoom: 16.4,
          cooperativeGestures: true,
          attributionControl: { compact: true },
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        map.on("error", (e) => console.warn("[map]", e.error?.message));

        map.on("load", () => {
          if (!map) return;
          map.addSource("parcel", {
            type: "geojson",
            data: parcel
              ? { type: "Feature", properties: {}, geometry: parcel }
              : { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: center } },
          });
          map.addSource("mains", {
            type: "geojson",
            data: lines(mains, (m) => ({
              year: m.installYear,
              material: m.materialLabel ?? m.material,
              system: m.systemLabel ?? m.system,
              depth: m.depthFt,
              size: m.sizeIn,
              street: m.street,
            })),
          });
          map.addSource("projects", {
            type: "geojson",
            data: lines(projects, (p) => ({ name: p.name, phase: p.phase, years: [p.startYear, p.endYear].filter(Boolean).join("–"), desc: p.description })),
          });
          map.addSource("reports", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: points.map((p) => ({ type: "Feature", properties: { type: p.type, date: p.date }, geometry: { type: "Point", coordinates: p.lngLat } })),
            },
          });

          map.addLayer({ id: "projects", type: "line", source: "projects", paint: { "line-color": PHASE_COLOR as never, "line-width": 7, "line-opacity": 0.55 } });
          map.addLayer({
            id: "mains",
            type: "line",
            source: "mains",
            layout: { "line-cap": "round" },
            paint: { "line-color": "#0d5c6b", "line-width": ["interpolate", ["linear"], ["zoom"], 14, 2, 18, 5] },
          });
          if (parcel) {
            map.addLayer({ id: "parcel-fill", type: "fill", source: "parcel", paint: { "fill-color": "#b45f06", "fill-opacity": 0.22 } });
            map.addLayer({ id: "parcel-line", type: "line", source: "parcel", paint: { "line-color": "#b45f06", "line-width": 3 } });
          } else {
            map.addLayer({ id: "parcel-dot", type: "circle", source: "parcel", paint: { "circle-color": "#b45f06", "circle-radius": 9, "circle-stroke-color": "#fff", "circle-stroke-width": 3 } });
          }
          map.addLayer({
            id: "reports",
            type: "circle",
            source: "reports",
            paint: {
              "circle-color": REPORT_COLOR as never,
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 3, 18, 6],
              "circle-stroke-color": "#fff",
              "circle-stroke-width": 1.5,
              "circle-opacity": 0.9,
            },
          });

          const popup = new maplibregl.Popup({ closeButton: true, maxWidth: "260px" });
          const show = (html: string) => (e: import("maplibre-gl").MapLayerMouseEvent) => {
            const p = e.features?.[0]?.properties ?? {};
            popup.setLngLat(e.lngLat).setHTML(html.replace(/\{(\w+)\}/g, (_, k) => escape(p[k]) || "—")).addTo(map!);
          };
          map.on("click", "mains", show("<strong>City sewer</strong><br>Laid {year} · {size}-inch {material}<br>{system}<br>About {depth} ft deep · {street}<br><em>DWSD record</em>"));
          map.on("click", "projects", show("<strong>{name}</strong><br>{desc}<br>{phase} · {years}<br><em>DWSD capital project</em>"));
          map.on("click", "reports", (e) => {
            const p = e.features?.[0]?.properties ?? {};
            const label = p.type === "w" ? "Water in basement" : p.type === "s" ? "Cave-in over the sewer" : "Cave-in / sinkhole";
            popup.setLngLat(e.lngLat).setHTML(`<strong>311: ${label}</strong><br>Reported ${escape(p.date)}`).addTo(map!);
          });
          for (const id of ["mains", "projects", "reports"]) {
            map.on("mouseenter", id, () => (map!.getCanvas().style.cursor = "pointer"));
            map.on("mouseleave", id, () => (map!.getCanvas().style.cursor = ""));
          }
        });
      } catch (err) {
        console.warn("[map] could not start", err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [center, parcel, mains, projects, points]);

  if (failed) {
    return (
      <div className="grid h-72 place-items-center rounded-2xl border border-dashed border-line-2 bg-sunk p-6 text-center text-ink-2">
        The map couldn&apos;t load on this device. Everything it shows is listed below.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div ref={ref} className="h-[22rem] w-full bg-sunk sm:h-[26rem]" role="region" aria-label="Map of public sewer records near this address" />
      <MapLegend />
    </div>
  );
}

function MapLegend() {
  const item = "flex items-center gap-2";
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line bg-surface px-4 py-3 text-sm text-ink-2">
      <span className={item}>
        <span className="h-3 w-4 rounded-sm border-2 border-own bg-own/25" aria-hidden="true" /> This property
      </span>
      <span className={item}>
        <span className="h-1 w-5 rounded bg-brand" aria-hidden="true" /> City sewer on record
      </span>
      <span className={item}>
        <span className="h-2 w-5 rounded bg-[#7c3aed]/55" aria-hidden="true" /> Sewer work: construction
      </span>
      <span className={item}>
        <span className="h-2 w-5 rounded bg-[#db2777]/55" aria-hidden="true" /> being bid
      </span>
      <span className={item}>
        <span className="h-2 w-5 rounded bg-[#8a949c]/55" aria-hidden="true" /> finished
      </span>
      <span className={item}>
        <span className="h-2.5 w-2.5 rounded-full bg-brand" aria-hidden="true" /> 311 water in basement
      </span>
      <span className={item}>
        <span className="h-2.5 w-2.5 rounded-full bg-stop" aria-hidden="true" /> cave-in over sewer
      </span>
      <span className={item}>
        <span className="h-2.5 w-2.5 rounded-full bg-[#e0892b]" aria-hidden="true" /> other cave-in
      </span>
      <span className="w-full text-xs text-ink-3">Private sewer lines are not shown — no public record locates them.</span>
    </div>
  );
}
