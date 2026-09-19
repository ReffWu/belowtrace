import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import golden from "@/data/golden.json";
import type { Report } from "@/lib/types";
import { OwnershipDiagram } from "./ownership-diagram";

const { parcel, nearestMain: main } = (golden as unknown as Record<string, Report>)["16776 prevost st"];

describe("ownership diagram rendering", () => {
  it.each(["front", "rear", "side", null] as const)("renders %s with an accessible mapped-plan fallback", (side) => {
    const html = renderToStaticMarkup(createElement(OwnershipDiagram, { parcel, main, side }));
    expect(html).not.toMatch(/NaN|Infinity|undefined|Horizontal to scale/);
    expect(html).toContain("not a survey");
    expect(html).toContain("1928");
    expect(html).toContain("10.2");
    expect(html).toContain("may not serve this home");
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const match of html.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(match[1]);
    expect(html.match(/<svg /g)).toHaveLength(1);
    expect(html).toContain("Recorded parcel and building footprint plan");
    expect(html).toContain("Preparing the 3D property model");
  });

  it("does not turn missing records into a recorded pipe or guessed alley", () => {
    const html = renderToStaticMarkup(createElement(OwnershipDiagram, { parcel: null, main: null, side: null }));
    expect(html).toContain("record unavailable");
    expect(html).toContain("Location unconfirmed");
    expect(html).not.toMatch(/alley|1928|10\.2|12<small/);
  });

  it("keeps SVG paint and accessible labels unique across reports on one page", () => {
    const html = renderToStaticMarkup(createElement("div", null,
      createElement(OwnershipDiagram, { parcel, main, side: "front" }),
      createElement(OwnershipDiagram, { parcel, main, side: "rear" }),
    ));
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const match of html.matchAll(/aria-labelledby="([^"]+)"/g)) {
      for (const id of match[1].split(" ")) expect(ids).toContain(id);
    }
  });
});
