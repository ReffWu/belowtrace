// The citywide picture as a standalone SVG file, loaded as an image.
//
// The interactive map needs WebGL, which the headless browser that prints the deck does not
// have, and an inline <svg> would not take a height from a flex parent when printing. A
// replaced element has intrinsic dimensions, so it scales correctly everywhere and stays vector.
// Regenerate with scripts/build-city-figure.mjs when the snapshots change.

export function CityFigure({ caption, height = 300 }: { caption?: string; height?: number }) {
  return (
    <figure style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div
        style={{
          width: "100%",
          height,
          flexShrink: 0,
          borderRadius: 20,
          overflow: "hidden",
          background: "var(--deep)",
          border: "2px solid var(--line)",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/deck/city-figure.svg"
          alt="Detroit: 14,115 basement flooding reports against the 138 alleys contracted so far"
          style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
        />

        <div
          style={{
            position: "absolute",
            left: 14,
            top: 14,
            display: "grid",
            gap: 7,
            background: "rgb(11 21 25 / 0.88)",
            borderRadius: 12,
            padding: "11px 13px",
            fontSize: 15,
            color: "rgb(255 255 255 / 0.88)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: "#4fd1dc" }} /> Water in a basement · 14,115 reports
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: "#ff7a1f", boxShadow: "0 0 0 2px rgb(255 255 255 / 0.7)" }} />{" "}
            Alleys contracted · 138
          </span>
        </div>
      </div>
      {caption && (
        <figcaption className="tiny" style={{ marginTop: 9 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
