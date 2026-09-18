import type { Situation } from "./types";

export const SITUATION_OPTIONS: { value: Situation; label: string; hint: string }[] = [
  { value: "backup", label: "Water or sewage in my basement", hint: "It's happening now or just happened" },
  { value: "broken-line", label: "A plumber says my sewer line is broken", hint: "I have a quote, or they want to dig" },
  { value: "checking", label: "Just checking", hint: "Buying, renting, or planning ahead" },
];
