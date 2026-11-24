import type { Built } from "../assets/palette";
import { MEDIEVAL } from "./medieval";
import { VICTORIAN } from "./victorian";
import { FIFTIES } from "./fifties";
import { MODERN } from "./modern";
export type Period = "medieval" | "victorian" | "fifties" | "modern";
export const PERIODS: Record<Period, Record<string, () => Built>> = {
  medieval: MEDIEVAL,
  victorian: VICTORIAN,
  fifties: FIFTIES,
  modern: MODERN
};
export const PROPS: Record<string, () => Built> = Object.fromEntries((Object.keys(PERIODS) as Period[]).flatMap(p => Object.entries(PERIODS[p]).map(([k, b]) => [`${p}/${k}`, b])));
/** build a prop by key; throws with the list of keys when the key is unknown */
export const prop = (key: string): Built => {
  const b = PROPS[key];
  if (!b) throw new Error(`no prop ${key}; have: ${Object.keys(PROPS).join(", ")}`);
  return b();
};
