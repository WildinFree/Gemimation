export type Tier = "hero" | "piece" | "dressing" | "far";
export type Detail = {
  segK: number;
  parts: 0 | 1 | 2 | 3;
  hd: boolean;
};
export const DETAIL: Record<Tier, Detail> = {
  hero: {
    segK: 1.5,
    parts: 3,
    hd: true
  },
  piece: {
    segK: 1,
    parts: 2,
    hd: true
  },
  dressing: {
    segK: 0.6,
    parts: 1,
    hd: false
  },
  far: {
    segK: 0.35,
    parts: 0,
    hd: false
  }
};
let cur: Detail = DETAIL.piece;
/** the detail level builders should use right now (default: piece) */

export const detail = (): Detail => cur;
/** run fn with the given tier active; the previous tier comes back afterwards, also when fn throws */

export function withTier<T>(t: Tier, fn: () => T): T {
  const prev = cur;
  cur = DETAIL[t];
  try {
    return fn();
  } finally {
    cur = prev;
  }
}
/** an authored radial / curve segment count scaled by the tier (never below 3) */

export const seg = (n: number) => Math.max(3, Math.round(n * cur.segK));
/** true when the tier builds parts of this level: 1 trims and secondary masses, 2 small parts (flowers, panels, wear),
 *  3 hero-only extras (bolts, studs, bars) */

export const parts = (level: number) => cur.parts >= level;
/** the tier for an object whose largest on-screen height over its shots is `screenFrac` of the frame height;
 *  `story` objects (the camera lands on them, a character touches or holds them) are always hero */

export const tierFor = (screenFrac: number, story = false): Tier => story || screenFrac >= 0.25 ? "hero" : screenFrac >= 0.08 ? "piece" : screenFrac >= 0.02 ? "dressing" : "far";
