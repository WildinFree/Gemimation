import { V3, glide, lerp, lerp3 } from "../util";
export type Cam = {
  pos: V3;
  look: V3;
  fov: number;
  roll: number;
};
export type Shot = Partial<Cam> & {
  pos: V3;
  look: V3;
};
/** a camera key: from frame f, either cut to s(f) or glide to it over dur frames (default 24) */

export type Key = {
  f: number;
  dur?: number;
  cut?: boolean;
  s: (f: number) => Shot;
};
const mixCam = (a: Cam, b: Cam, k: number): Cam => ({
  pos: lerp3(a.pos, b.pos, k),
  look: lerp3(a.look, b.look, k),
  fov: lerp(a.fov, b.fov, k),
  roll: lerp(a.roll, b.roll, k)
});
const full = (c: Shot): Cam => ({
  fov: 40,
  roll: 0,
  ...c
});
/** evaluate a key list at frame f */

export const runKeys = (keys: Key[], f: number): Cam => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mixCam(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** creeping push-in factor since f0 (distance multiplier: rate per frame, e.g. 0.0015-0.0035), with an optional punch
 *  (a faster rate for n frames, eased in and out over 8 f) on a stressed word */

export const pushK = (f: number, f0: number, rate: number, punch = 0, n = 30) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** a position k of the way from the look point out to pos (k < 1 = pushed in) */

export const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot => ({
  pos: lerp3(look, pos, k),
  look,
  ...rest
});
/** orbit around a centre: angle in rad from +z, radius, height, aim height */

export const orbit = (c: V3, ang: number, rad: number, y: number, lookY: number, rest: Partial<Cam> = {}): Shot => ({
  pos: [c[0] + Math.sin(ang) * rad, y, c[2] + Math.cos(ang) * rad],
  look: [c[0], lookY, c[2]],
  ...rest
});
/** a travelling orbit: angle a0 -> a1, radius r0 -> r1, height y0 -> y1 over n frames from f0 (smootherstep) + push */

export const arc = (f: number, f0: number, n: number, c: V3, a0: number, a1: number, r0: number, r1: number, y0: number, y1: number, lookY: number, rest: Partial<Cam> = {}, push = 0.0015): Shot => {
  const u = glide((f - f0) / n),
    k = pushK(f, f0, push);
  return orbit(c, lerp(a0, a1, u), lerp(r0, r1, u) * k, lerp(y0, y1, u), lookY, rest);
};
/** a straight track p0 -> p1 while the aim slides l0 -> l1 */

export const track = (f: number, f0: number, n: number, p0: V3, p1: V3, l0: V3, l1: V3, rest: Partial<Cam> = {}): Shot => {
  const u = glide((f - f0) / n);
  return {
    pos: lerp3(p0, p1, u),
    look: lerp3(l0, l1, u),
    ...rest
  };
};
/** a crane: rise / drop from y0 to y1 while pushing toward the look point */

export const crane = (f: number, f0: number, n: number, pos: V3, look: V3, y0: number, y1: number, push = 0.002, rest: Partial<Cam> = {}): Shot => {
  const u = glide((f - f0) / n),
    k = pushK(f, f0, push);
  const p: V3 = [pos[0], lerp(y0, y1, u), pos[2]];
  return dolly(p, look, k, rest);
};
/** [frame, gain]: the image offset flips sign each frame and decays over 7 f (gain ~0.3 soft .. 1.6 huge) */

export type Kick = [number, number];
export const kickAt = (kicks: Kick[], f: number) => {
  let a = 0;
  for (const [f0, g] of kicks) {
    const n = f - f0;
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
/** apply a kick amount to a camera (sideways + up offset of the aim, a hint of roll) */

export const withKick = (c: Cam, a: number): Cam => {
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d),
    h = Math.hypot(d[0], d[2]) || 1;
  const m = 3 / 640 * Math.tan(c.fov * Math.PI / 360) * L * a;
  return {
    ...c,
    look: [c.look[0] - d[2] / h * m, c.look[1] + 0.6 * m, c.look[2] + d[0] / h * m],
    roll: c.roll + a * 0.004
  };
};
/** the camera function a short exports: per-shot keys + kicks */

export const makeCamAt = <Id extends string | number,>(cams: Record<Id, Key[]>, kicks: Kick[]) => (id: Id, f: number): Cam => {
  const keys = cams[id];
  if (!keys) throw new Error("no camera keys for shot " + String(id));
  return withKick(runKeys(keys, f), kickAt(kicks, f));
};
/** from frame f (blend over dur frames): circle of confusion at infinity, px at 1080 wide (CU 12-16, MS 10-12, wide 0),
 *  and the focus point (default: the camera's look point). Focus on the eyes of the front character. */

export type Dof = {
  f: number;
  dur?: number;
  cInf: number;
  focus?: (f: number) => V3;
};
export const makeDofAt = (table: Dof[]) => (f: number) => {
  let i = 0;
  while (i + 1 < table.length && f >= table[i + 1].f) i++;
  const d = table[i],
    p = table[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return {
    cInf: p.cInf + (d.cInf - p.cInf) * k,
    focus: d.focus
  };
};
/** eye height helper for focus points */

export const eyes = (p: V3, h = 1.44) => (): V3 => [p[0], h, p[2]];
export type ShotBase<Id = string> = {
  id: Id;
  a: number;
  b: number;
};
/** A "rig hand-off without a cut" is just a Key with dur 14-30: runKeys already blends the two rigs with glide. */

/** damped-spring follow of a moving signal: a finite convolution of sig(f-k), k = 0..K, with the normalised impulse
 *  response of an under-damped 2nd-order system (w rad/frame, damping z). The camera lags a moving subject, carries on
 *  ~6-10 f when it stops, then settles back. Pure function of f. */

export const springFollow = (sig: (f: number) => V3, f: number, w = 0.22, z = 0.55, K = 90): V3 => {
  const wd = w * Math.sqrt(Math.max(1e-6, 1 - z * z));
  let sx = 0,
    sy = 0,
    sz = 0,
    sw = 0;
  for (let k = 0; k <= K; k++) {
    const h = Math.exp(-z * w * k) * Math.sin(wd * k);
    const p = sig(Math.max(0, f - k));
    sx += h * p[0];
    sy += h * p[1];
    sz += h * p[2];
    sw += h;
  }
  return sw === 0 ? sig(Math.max(0, f)) : [sx / sw, sy / sw, sz / sw];
};
/** aim lag (0.08-0.15 s = 2.5-4.5 f): exponential-kernel convolution of sig, K = 6 * lagF */

export const lagLook = (sig: (f: number) => V3, f: number, lagF = 3): V3 => {
  const K = Math.round(6 * lagF);
  let sx = 0,
    sy = 0,
    sz = 0,
    sw = 0;
  for (let k = 0; k <= K; k++) {
    const h = Math.exp(-k / lagF),
      p = sig(Math.max(0, f - k));
    sx += h * p[0];
    sy += h * p[1];
    sz += h * p[2];
    sw += h;
  }
  return [sx / sw, sy / sw, sz / sw];
};
