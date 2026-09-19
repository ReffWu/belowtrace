"use client";

import { useEffect, useRef, useState } from "react";
import { clipSegment, type PropertyModel } from "@/lib/property-model";
import type { createPropertyScene, ModelView } from "./property-scene-renderer";
import styles from "./ownership-diagram.module.css";

type Label = { text: string; detail?: string; x: number; y: number; tone?: string };
const VIEWS = [{ id: "model", label: "3D site & pipes" }, { id: "plan", label: "Top view plan" }] as const;

export function PropertyScene({ model }: { model: PropertyModel | null }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<ReturnType<typeof createPropertyScene> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [view, setView] = useState<ModelView>("model");
  const [labels, setLabels] = useState<Label[]>([]);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element || !model) return;
    let cancelled = false;
    const lost = (event: Event) => { event.preventDefault(); setStatus("fallback"); };
    element.addEventListener("webglcontextlost", lost);
    const observer = new IntersectionObserver(async entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      observer.disconnect();
      try {
        const { createPropertyScene } = await import("./property-scene-renderer");
        if (cancelled) return;
        controller.current = createPropertyScene(element, model, setLabels, setSnapshot);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("fallback");
      }
    }, { rootMargin: "400px" });
    observer.observe(element);
    return () => {
      cancelled = true; observer.disconnect(); element.removeEventListener("webglcontextlost", lost);
      controller.current?.dispose(); controller.current = null;
    };
  }, [model]);

  const selectView = (next: ModelView) => { setView(next); controller.current?.setView(next); };

  if (!model) return <div className={styles.unavailable}><strong>Property model unavailable</strong><p>An exact parcel boundary is needed to place the house and roads. No building dimensions or orientation have been assumed.</p></div>;
  const mainInView = model.main?.parts.some(part => part.some((point, i) => i > 0 && clipSegment(part[i - 1], point, model.bounds)));

  return (
    <div className={styles.modelSection}>
      <div className={styles.toolbar}>
        <div className={styles.viewSwitch} role="group" aria-label="Property model view">
          {VIEWS.map(v => <button key={v.id} type="button" aria-pressed={view === v.id} disabled={status !== "ready"} onClick={() => selectView(v.id)}>{v.label}</button>)}
        </div>
        <div className={styles.zoom} role="group" aria-label="Model zoom">
          <button type="button" aria-label="Zoom out" disabled={status !== "ready"} onClick={() => controller.current?.zoom(1 / 1.2)}>−</button>
          <button type="button" aria-label="Zoom in" disabled={status !== "ready"} onClick={() => controller.current?.zoom(1.2)}>+</button>
          <button type="button" aria-label="Reset model view" disabled={status !== "ready"} onClick={() => selectView("model")}>↺</button>
        </div>
      </div>
      <div className={styles.modelViewport}>
        <canvas ref={canvas} className={status === "ready" ? styles.canvas : `${styles.canvas} ${styles.canvasPending}`} aria-label="Three-dimensional property model. Use the view and zoom buttons; drag the model to rotate." />
        <div className={styles.labels} aria-hidden="true">
          {status === "ready" && labels.map((label, i) => <div key={`${label.text}-${i}`} data-tone={label.tone} className={styles.modelLabel} style={{ left: label.x, top: label.y }}><strong>{label.text}</strong>{label.detail && <span>{label.detail}</span>}</div>)}
        </div>
        {status !== "ready" && <div className={styles.planFallback}><PropertyPlan model={model} /><p role="status">{status === "loading" ? "Preparing the 3D property model…" : "3D is unavailable in this browser. Showing the mapped footprint plan."}</p></div>}
        {snapshot && <div role="img" aria-label="Property model for printing" className={styles.printModel} style={{ backgroundImage: `url(${snapshot})` }} />}
        {!model.main && (
          <div className={styles.noMainBanner}>
            <span className={styles.noMainBadge}>City record unmapped</span>
            <span>DWSD public open-data has no sewer main record within 120 m for this block. Private underground line requires a camera check.</span>
          </div>
        )}
        <div className={styles.modelHint}>{view === "plan" ? "Top view · building dimensions & underground sewer lines" : "Drag to rotate · building massing & underground pipes"}</div>
      </div>
      <div className={styles.modelLegend}>
        <div className={styles.keyItem}>
          <span className={styles.keyTag}><i className={styles.cityKey} /> <strong>City sewer main</strong></span>
          <span className={styles.keyDetail}>
            {model.main ? `${model.main.depthM ? `≈${(model.main.depthM / 0.3048).toFixed(1)} ft deep` : "Depth unrecorded"}${model.main.radiusM ? ` · ${Math.round(model.main.radiusM * 2 / 0.0254)}″ pipe` : ""} · DWSD maintenance` : "No public sewer main record"}
          </span>
        </div>
        <div className={styles.keyItem}>
          <span className={styles.keyTag}><i className={styles.privateKey} /> <strong>Private line</strong></span>
          <span className={styles.keyDetail}>House to sewer main · Homeowner responsibility · Route unverified</span>
        </div>
        <div className={styles.keyItem}>
          <span className={styles.keyTag}><i className={styles.buildingKey} /> <strong>Home footprint</strong></span>
          <span className={styles.keyDetail}>
            {model.widthFt && model.depthFt ? `${model.widthFt.toFixed(1)} × ${model.depthFt.toFixed(1)} ft mapped footprint` : "Mapped parcel geometry"}
            {model.streetName ? ` · Fronts ${model.streetName}` : ""}
          </span>
        </div>
        <div className={styles.keyItem}>
          <span className={styles.keyTag}><i className={styles.lotKey} /> <strong>Lot boundary</strong></span>
          <span className={styles.keyDetail}>Recorded parcel boundary line · Rear / alley at back</span>
        </div>
      </div>
      {!model.primary && <p className={styles.modelWarning}>No building footprint was matched to this parcel. The model shows recorded land and roads; the home is not invented.</p>}
      {!model.main && <p className={styles.modelWarning}>No nearby city sewer is in the available records. No underground route has been assumed.</p>}
      {model.main && !mainInView && <p className={styles.modelWarning}>The nearest recorded main is outside this model’s extent. Its details are below; the map shows its location.</p>}
    </div>
  );
}

function PropertyPlan({ model }: { model: PropertyModel }) {
  const b = model.bounds;
  const width = b.maxX - b.minX, height = b.maxZ - b.minZ;
  const point = ([x, z]: number[]) => `${x - b.minX},${b.maxZ - z}`;
  const outline = (rings: number[][][]) => rings.map(ring => `M${ring.map(point).join(" L")} Z`).join(" ");

  // Find nearest connection on main for SVG fallback
  let privateTarget: [number, number] | null = null;
  if (model.main && model.houseBounds) {
    const h = model.houseBounds;
    const center: [number, number] = [(h.minX + h.maxX) / 2, (h.minZ + h.maxZ) / 2];
    for (const part of model.main.parts) {
      for (let i = 1; i < part.length; i++) {
        const a = part[i - 1], bPoint = part[i];
        const dx = bPoint[0] - a[0], dz = bPoint[1] - a[1];
        const t = Math.max(0, Math.min(1, ((center[0] - a[0]) * dx + (center[1] - a[1]) * dz) / (dx * dx + dz * dz || 1)));
        const hit: [number, number] = [a[0] + dx * t, a[1] + dz * t];
        if (!privateTarget || Math.hypot(hit[0] - center[0], hit[1] - center[1]) < Math.hypot(privateTarget[0] - center[0], privateTarget[1] - center[1])) {
          privateTarget = hit;
        }
      }
    }
  }

  return (
    <svg viewBox={`-3 -3 ${width + 6} ${height + 6}`} role="img" aria-label="Recorded parcel and building footprint plan">
      <rect width={width} height={height} fill="#d9dfd0" />
      {model.roads.flatMap((r, i) => r.parts.map((part, j) => <polyline key={`r-${i}-${j}`} points={part.map(point).join(" ")} fill="none" stroke="#657171" strokeWidth="3" />))}
      {model.lot.map((polygon, i) => <path key={`l-${i}`} d={outline(polygon)} fillRule="evenodd" fill="#a8b396" stroke="#9c783b" strokeWidth="0.3" />)}
      {model.buildings.map(building => <path key={building.id} d={outline(building.rings)} fillRule="evenodd" fill={building.onParcel ? "#48616b" : "#b8c1b7"} stroke="#f4f2e8" strokeWidth="0.2" />)}
      {/* Sewer main and private lateral line in plan view */}
      {model.main?.parts.map((part, i) => (
        <polyline key={`main-${i}`} points={part.map(point).join(" ")} fill="none" stroke="#0284c7" strokeWidth="2.8" />
      ))}
      {model.houseBounds && privateTarget && (
        <line
          x1={(model.houseBounds.minX + model.houseBounds.maxX) / 2 - b.minX}
          y1={b.maxZ - (model.houseBounds.minZ + model.houseBounds.maxZ) / 2}
          x2={privateTarget[0] - b.minX}
          y2={b.maxZ - privateTarget[1]}
          stroke="#d97706"
          strokeWidth="2.2"
        />
      )}
    </svg>
  );
}
