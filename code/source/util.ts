export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
/** smootherstep: the camera glide curve (zero velocity and acceleration at both ends) */
export const glide = (u: number) => {
  const x = clamp01(u);
  return x * x * x * (x * (6 * x - 15) + 10);
};
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
export const easeIn = (u: number) => clamp01(u) ** 2;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** 0 -> 1 over n frames starting at f0 (smoothstep) */

export const ramp = (f: number, f0: number, n: number) => smooth((f - f0) / n);
/** 0..1 oscillation with a period of `per` frames */

export const osc = (f: number, per: number) => 0.5 + 0.5 * Math.sin(f / per * Math.PI * 2);
/** damped spring from `from` to `to` starting at f0 (w = angular speed per frame, z = damping) */
export const spring = (f: number, f0: number, from: number, to: number, w = 0.55, z = 0.13) => {
  if (f < f0) return from;
  const t = f - f0;
  return to + (from - to) * Math.exp(-z * w * t * 6) * Math.cos(w * t);
};
/** pop-in scale: 0 before f0, overshoots ~12 % and settles */
export const pop = (f: number, f0: number) => f < f0 ? 0 : 1 + 0.12 * Math.exp(-(f - f0) / 3) * Math.cos((f - f0) * 0.9) - 0.12 * Math.exp(-(f - f0) / 1.5);
/** squash on impact: 1 - amt at f0, wobbling back to 1 */
export const thud = (f: number, f0: number, amt = 0.2, tau = 2.2) => f >= f0 ? 1 - amt * Math.exp(-(f - f0) / tau) * Math.cos((f - f0) * 0.9) : 1;
/** deterministic hash in [0, 1) */
export const hash = (i: number, s = 0) => {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
/** quantise (keeps canvas cache keys stable: a card is only redrawn when a value changes by >= 1/n) */
export const q = (v: number, n = 120) => Math.round(v * n) / n;
/** seeded PRNG (mulberry32) */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};
