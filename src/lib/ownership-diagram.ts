import type { Parcel, Report, SewerMain } from "./types";

const positive = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

// Proximity does not establish a service connection. Keep recorded attributes separate
// from inferred position, and never borrow dimensions from a merely nearby parcel.
export function ownershipDiagramData(parcel: Parcel | null, main: SewerMain | null, side: Report["mainSide"]) {
  const exactParcel = parcel?.match === "exact" ? parcel : null;
  const position = main && exactParcel && (side === "front" || side === "rear" || side === "side") ? side : "unknown";
  const positionLabel = { front: "In front of the lot", rear: "Behind the lot", side: "Beside the lot", unknown: "Location unconfirmed" }[position];

  return {
    position,
    positionLabel,
    hasMain: Boolean(main),
    lotDepth: positive(exactParcel?.depthFt),
    yearBuilt: positive(exactParcel?.yearBuilt),
    mainDepth: positive(main?.depthFt),
    mainSize: positive(main?.sizeIn),
    installYear: positive(main?.installYear),
    material: main?.materialLabel || (main?.material ? `Code ${main.material}` : null),
    system: main?.systemLabel || (main?.system ? `Code ${main.system}` : null),
    notice: main
      ? "The nearest recorded main may not serve this home. A plumber or DWSD must confirm the connection."
      : "No nearby main appears in the available public data. This does not mean there is no sewer. Ask DWSD to confirm it.",
  };
}
