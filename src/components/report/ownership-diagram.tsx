import { useId } from "react";
import type { LngLat, Parcel, PropertySite, Report, SewerMain } from "@/lib/types";
import { ownershipDiagramData } from "@/lib/ownership-diagram";
import { propertyModel } from "@/lib/property-model";
import { PropertyScene } from "./property-scene";
import { BUILDING_SOURCE, ROAD_SOURCE } from "@/lib/property-site-source";
import styles from "./ownership-diagram.module.css";

type Props = { parcel: Parcel | null; main: SewerMain | null; side: Report["mainSide"]; site?: PropertySite; center?: LngLat };

export function OwnershipDiagram({ parcel, main, side, site, center }: Props) {
  const data = ownershipDiagramData(parcel, main, side);
  const ring = parcel?.geometry ? (parcel.geometry.type === "Polygon" ? parcel.geometry.coordinates[0] : parcel.geometry.coordinates[0][0]) : null;
  const origin: LngLat = center ?? (ring?.[0] ? [ring[0][0], ring[0][1]] : [0, 0]);
  const model = propertyModel(parcel, site, main, origin);
  const id = useId().replace(/:/g, "");

  return (
    <figure className={`${styles.figure} print-break-avoid`} aria-labelledby={`${id}-heading`}>
      <div className={styles.header}>
        <div>
          <h3 id={`${id}-heading`}>Your property, above & below</h3>
          <p>{parcel?.match === "exact" ? parcel.address : "Land, building and sewer records"}</p>
        </div>
        <span className={styles.schematic}>Interactive site model</span>
      </div>
      <PropertyScene key={`${parcel?.id}-${main?.id}-${site?.fetchedAt}`} model={model} />
      <dl className={styles.siteFacts}>
        <div><dt>Street-facing direction</dt><dd>{model?.facing ? <>{model.facing}<small> {Math.round(model.bearing!)}°</small></> : "Unconfirmed"}</dd><span>Inferred from street & parcel</span></div>
        <div><dt>{model?.bearing === null ? "House footprint · E–W × N–S" : "House footprint · W × D"}</dt><dd>{model?.widthFt && model.depthFt ? <>{model.widthFt.toFixed(1)} × {model.depthFt.toFixed(1)}<small> ft</small></> : "Not recorded"}</dd><span>Measured from mapped outline</span></div>
        <div><dt>Lot · frontage × depth</dt><dd>{parcel?.match === "exact" && parcel.frontageFt && data.lotDepth ? <>{parcel.frontageFt} × {data.lotDepth}<small> ft</small></> : "Not recorded"}</dd><span>City parcel record</span></div>
        <div><dt>Total floor area</dt><dd>{parcel?.match === "exact" && parcel.floorArea ? <>{parcel.floorArea.toLocaleString("en-US")}<small> sq ft</small></> : "Not recorded"}</dd><span>All floors, not the footprint</span></div>
      </dl>
      <ol className={styles.explanation}>
        <li>
          <span className={styles.number}>1</span>
          <div><h4>Your private line</h4><p>You maintain the line from your home to the city sewer, including the connection.</p></div>
        </li>
        <li>
          <span className={styles.number}>2</span>
          <div><h4>The connection</h4><p>Its location, route and condition need a plumber’s camera inspection.</p></div>
        </li>
        <li>
          <span className={`${styles.number} ${styles.cityNumber}`}>3</span>
          <div><h4>The city main</h4><p>The City maintains the public sewer. A nearby record does not confirm your connection.</p></div>
        </li>
      </ol>
      <div className={styles.records}>
        <div className={styles.recordHeading}>
          <h4>{data.hasMain ? "Nearest main · DWSD record" : "City sewer · record unavailable"}</h4>
          <span>{data.positionLabel}{data.position !== "unknown" ? " · estimated" : ""}</span>
        </div>
        {data.hasMain && (
          <dl className={styles.facts}>
            <div><dt>Installed</dt><dd>{data.installYear ?? "Not recorded"}</dd></div>
            <div><dt>Diameter</dt><dd>{data.mainSize ? <>{data.mainSize}<small> in</small></> : "Not recorded"}</dd></div>
            <div><dt>Depth</dt><dd>{data.mainDepth ? <>{data.mainDepth}<small> ft</small></> : "Not recorded"}</dd></div>
            <div><dt>Material</dt><dd>{data.material ?? "Not recorded"}</dd></div>
          </dl>
        )}
        {data.system && <p className={styles.system}>System: {data.system}</p>}
        <p className={styles.notice}>{data.notice}</p>
      </div>
      <figcaption className={styles.caption}>
        <span>{data.lotDepth ? `Lot depth: ${data.lotDepth} ft · City parcel record.` : "Lot depth unconfirmed."}{data.yearBuilt ? ` Home built ${data.yearBuilt}.` : ""}</span>
        <span>Mapped: parcel boundary, building footprint, street centerlines and recorded city sewer. Dimensions are approximate map measurements, not a survey.</span>
        <span>Building massing: extruded from the recorded footprint without assuming unrecorded facade or roof details. Private lateral route is unverified. Pipe thickness is enlarged for visibility; missing pipe depth uses an illustrative level.</span>
        <details className={styles.modelSources}><summary>Model sources & accuracy</summary><p><a href={BUILDING_SOURCE} target="_blank" rel="noreferrer">City building footprints</a> (data layer last updated February 2020) · <a href={ROAD_SOURCE} target="_blank" rel="noreferrer">City street centerlines</a>. Older footprints may not reflect alterations or demolition. The street-facing side is inferred; the exact entrance location and facade are not on record.{site ? ` Retrieved ${site.fetchedAt.slice(0, 10)}.` : " Live site details are unavailable for this saved report."}</p></details>
      </figcaption>
    </figure>
  );
}
