import { glide, clamp01 } from "../util";
export const SNAP = [0, .05, .16, .31, .48, .66, .79, .88, .93, .96, .98, .99, 1];
/** 0..1 -> 0..1 through SNAP (linear between table points), clamped */
export const snap = (u: number): number => {
  const x = clamp01(u) * (SNAP.length - 1),
    i = Math.min(SNAP.length - 2, Math.floor(x));
  return SNAP[i] + (SNAP[i + 1] - SNAP[i]) * (x - i);
};
export const snapAt = (f: number, f0: number, n = 12): number => snap((f - f0) / n);
/** [frame, value, ease INTO this key] */
export type TKey = [number, number, ("snap" | "glide" | "in" | "out" | "hold")?];
const ease = (e: string, u: number) => e === "glide" ? glide(u) : e === "in" ? u * u : e === "out" ? 1 - (1 - u) * (1 - u) : e === "hold" ? 0 : snap(u);
/** keyed track: default ease "snap"; before the first key = first value; after the last key DEAD STILL */
export const tr = (keys: TKey[], f: number): number => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e = "snap"] = keys[i],
      [f0, v0] = keys[i - 1];
    if (f < f1) {
      const u = (f - f0) / Math.max(1e-6, f1 - f0);
      return v0 + (v1 - v0) * ease(e, u);
    }
  }
  return keys[keys.length - 1][1];
};
/** impact dip: 0 -> -amp -> 0 as -amp*sin(pi*u) */
export const dip = (f: number, f0: number, amp: number, n = 4): number => {
  const u = (f - f0) / n;
  return u < 0 || u > 1 ? 0 : -amp * Math.sin(Math.PI * u);
};
/** settle wobble: amp*exp(-3u)*sin(2.5*pi*u) for u in 0..1, exactly 0 outside */

export const ring = (f: number, f0: number, amp: number, n = 8): number => {
  const u = (f - f0) / n;
  return u < 0 || u > 1 ? 0 : amp * Math.exp(-3 * u) * Math.sin(2.5 * Math.PI * u);
};
/** lift for a hand or prop travelling on an arc */

export const arcUp = (u: number, h: number): number => h * Math.sin(Math.PI * clamp01(u));
/** one action as a studio sequence: NOTICE, ANTICIPATE (counter), HOLD, STRIKE, IMPACT, SETTLE, then dead still.
 *  at = contact frame. Returns 0..1 amounts the shot multiplies into its pose. */

export const action = (f: number, o: {
  at: number;
  counter?: number;
  hold?: number;
  strike?: number;
  settle?: number;
}) => {
  const c = o.counter ?? 5,
    h = o.hold ?? 2,
    s = o.strike ?? 4,
    st = o.settle ?? 10;
  const sStart = o.at - s,
    windStart = sStart - h - c;
  const wind = f < windStart ? 0 : f < sStart - h ? snap((f - windStart) / c) : f < sStart ? 1 : f < o.at ? 1 - clamp01((f - sStart) / s) ** 2 : 0;
  const hit = f < sStart ? 0 : f < o.at ? clamp01((f - sStart) / s) ** 2 : 1;
  return {
    wind,
    hit,
    dip: -dip(f, o.at, 1, 4),
    ring: ring(f, o.at, 1, st),
    still: f >= o.at + st
  };
};
