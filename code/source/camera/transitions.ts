import { V3, clamp01, lerp, lerp3, smooth } from "../util";
import type { Shot, ShotBase } from "./rig";
export type TxKind = "cut" | "blend" | "dissolve" | "flash" | "whip" | "through" | "timePass" | "loop";
export type Tx = {
  f: number;
  kind: TxKind;
  n?: number;
  dir?: [number, number];
  amount?: number;
  soft?: number;
  col?: string;
};
const DEFAULT_N: Record<TxKind, number> = {
  cut: 0,
  blend: 9,
  dissolve: 12,
  flash: 2,
  whip: 8,
  through: 10,
  timePass: 24,
  loop: 9
};
const nOf = (t: Tx) => t.kind === "blend" ? Math.max(6, Math.min(14, t.n ?? DEFAULT_N.blend)) : t.n ?? DEFAULT_N[t.kind];
const smoother = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
/** frames covered by a transition: [first, last + 1) */
export const txSpan = (t: Tx): [number, number] => {
  const n = nOf(t);
  switch (t.kind) {
    case "flash":
      return [t.f, t.f + n];
    case "loop":
      return [t.f - n, t.f];
    case "cut":
      return [t.f, t.f];
    default:
      return [t.f - Math.floor(n / 2), t.f + Math.ceil(n / 2)];
  }
};
/** everything the picture-side shell needs at frame f */
export type TxState = {
  flash: number;
  flashCol: string;
  whip: number;
  dir: [number, number];
};
const NONE: TxState = {
  flash: 0,
  flashCol: "#ffffff",
  whip: 0,
  dir: [-1, 0]
};
const peak = (f: number, a: number, c: number, b: number) => f < a || f >= b ? 0 : f < c ? ((f - a + 1) / (c - a + 1)) ** 2 : (1 - (f - c) / (b - c)) ** 2;
export const txAt = (tx: Tx[] | undefined, f: number): TxState => {
  const s: TxState = {
    ...NONE
  };
  if (!tx) return s;
  for (const t of tx) {
    const [a, b] = txSpan(t);
    if (f < a || f >= b) continue;
    if (t.kind === "flash") {
      s.flash = Math.max(s.flash, [1, 0.35][f - a] ?? 0);
      s.flashCol = t.col ?? "#ffffff";
    } else if (t.kind === "whip") {
      s.whip = Math.max(s.whip, (t.amount ?? 300) * peak(f, a, t.f, b));
      s.dir = t.dir ?? [-1, 0];
    }
  }
  return s;
};
export type TxLayer<Id> = {
  id: Id;
  alpha: number;
  dt?: number;
  mask?: string;
};
/** layer function for the shell from shots + transitions: at most 2 layers (base, then the incoming one over it) */

export const makeTxLayersAt = <S extends ShotBase<unknown>,>(shots: S[], tx: Tx[], total?: number) => {
  const T = total ?? shots[shots.length - 1].b;
  const wins = tx.filter(t => t.kind !== "cut" && t.kind !== "flash" && t.kind !== "whip");
  return (f: number): TxLayer<S["id"]>[] => {
    for (const t of wins) {
      const [a, b] = txSpan(t);
      if (f < a || f >= b) continue;
      const n = b - a,
        u = (f - a + 0.5) / n;
      if (t.kind === "loop") return [{
        id: shots[shots.length - 1].id,
        alpha: 1
      }, {
        id: shots[0].id,
        alpha: smoother(u),
        dt: -T
      }];
      const i = shots.findIndex(s => s.a === t.f);
      if (i <= 0) continue;
      if (t.kind === "dissolve") return [{
        id: shots[i - 1].id,
        alpha: 1
      }, {
        id: shots[i].id,
        alpha: smooth((f - a + 1) / (b - a + 1))
      }];
      if (t.kind === "timePass") {
        const soft = t.soft ?? 0.6,
          e = lerp(-soft, 1 + soft, smoother(u));
        const p = (v: number) => (v * 100).toFixed(2) + "%";
        const mask = `linear-gradient(to bottom, #000 0%, #000 ${p(e - soft / 2)}, transparent ${p(e + soft / 2)}, transparent 100%)`;
        return [{
          id: shots[i - 1].id,
          alpha: 1
        }, {
          id: shots[i].id,
          alpha: 1,
          mask
        }];
      }
      return [{
        id: shots[i - 1].id,
        alpha: 1
      }, {
        id: shots[i].id,
        alpha: smoother(u)
      }];
    }
    const s = shots.find(x => f >= x.a && f < x.b) ?? shots[shots.length - 1];
    return [{
      id: s.id,
      alpha: 1
    }];
  };
};
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]) || 1;
const norm = (a: V3) => mul(a, 1 / len(a));
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** camera basis: forward, right, up */

export const basis = (c: Shot) => {
  const fw = norm(sub(c.look, c.pos)),
    right = norm(cross(fw, [0, 1, 0])),
    up = cross(right, fw);
  return {
    fw,
    right,
    up
  };
};
/** turn a shot's aim about the camera: yaw in degrees (+ = turn right), pitch (+ = up). Keeps the aim distance. */

export const aim = (s: Shot, yawDeg: number, pitchDeg = 0): Shot => {
  const d = sub(s.look, s.pos),
    L = len(d),
    {
      fw,
      right,
      up
    } = basis(s);
  const y = yawDeg * Math.PI / 180,
    p = pitchDeg * Math.PI / 180;
  const dir = norm(add(add(mul(fw, Math.cos(y) * Math.cos(p)), mul(right, Math.sin(y) * Math.cos(p))), mul(up, Math.sin(p))));
  return {
    ...s,
    look: add(s.pos, mul(dir, L))
  };
};
/** whip out of a shot: the aim swings `yaw` degrees over the n frames before the cut fc, accelerating into the cut.
 *  Pair with { kind: "whip", f: fc } in TX; the outgoing image moves opposite to the turn. */

export const whipOut = (s: Shot, f: number, fc: number, n = 4, yaw = 35, pitch = 0): Shot => {
  const u = clamp01((f - (fc - n)) / n);
  return aim(s, yaw * u * u, pitch * u * u);
};
/** whip into a shot: starts swung by the same turn still going (from -yaw) and settles over n frames, with a small
 *  overshoot so the stop reads */

export const whipIn = (s: Shot, f: number, fc: number, n = 5, yaw = 35, pitch = 0): Shot => {
  const u = clamp01((f - fc) / n),
    e = 1 - (1 - u) ** 2;
  const over = Math.sin(Math.PI * clamp01((f - fc - n) / 6)) * 0.05;
  const k = -(1 - e) + over;
  return aim(s, yaw * k, pitch * k);
};
/** fly THROUGH an object: from the base pose the camera travels (smootherstep, over the n frames ending at f0 = the
 *  blend centre) to 0.62 m in front of `opening`, aiming 1.2 m beyond it. `normal` points from the opening toward the
 *  camera side (default: from the opening to the base camera). Pair with { kind: "through", f: f0 }. */

export const throughOut = (base: Shot, f: number, f0: number, n: number, opening: V3, normal?: V3): Shot => {
  const nm = norm(normal ?? sub(base.pos, opening)),
    u = smoother((f - (f0 - n)) / n);
  return {
    ...base,
    pos: lerp3(base.pos, add(opening, mul(nm, 0.62)), u),
    look: lerp3(base.look, sub(opening, mul(nm, 1.2)), u)
  };
};
/** the next shot of a fly-through: starts AT the opening (inside it) and eases out to the base pose over n*3 frames */

export const throughIn = (base: Shot, f: number, f0: number, n: number, opening: V3): Shot => {
  const u = clamp01((f - f0) / (n * 3)),
    e = 1 - (1 - u) ** 3;
  const look0 = add(opening, mul(norm(sub(base.look, opening)), 1.2));
  return {
    ...base,
    pos: lerp3(opening, base.pos, e),
    look: lerp3(look0, base.look, e)
  };
};
/** snap zoom: the lens snaps from the shot's fov to fov1 over n frames (2-4) from f0, then holds */

export const snapZoom = (s: Shot, f: number, f0: number, fov1: number, n = 3): Shot => {
  const u = clamp01((f - f0) / n);
  return {
    ...s,
    fov: lerp(s.fov ?? 40, fov1, 1 - (1 - u) ** 3)
  };
};
/** screen position of a world point (0..1, y down) for a camera; null when behind it. Use it to keep the subject in
 *  the same screen spot on both sides of a cut (eye-trace match) and to line up match dissolves. */

export const screenOf = (c: Shot, p: V3, aspect = 9 / 16): [number, number] | null => {
  const {
      fw,
      right,
      up
    } = basis(c),
    d = sub(p, c.pos),
    z = d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2];
  if (z <= 0.01) return null;
  const t = Math.tan((c.fov ?? 40) * Math.PI / 180 / 2);
  const x = (d[0] * right[0] + d[1] * right[1] + d[2] * right[2]) / (z * t * aspect);
  const y = (d[0] * up[0] + d[1] * up[1] + d[2] * up[2]) / (z * t);
  return [0.5 + x / 2, 0.5 - y / 2];
};
/** distance (fraction of frame height) between a subject's screen spots on the last frame before and the first
 *  frame after a cut. Under 0.12 reads as one continuous look; over 0.3 makes the eye jump. */

export const cutJump = (a: Shot, pa: V3, b: Shot, pb: V3, aspect = 9 / 16) => {
  const sa = screenOf(a, pa, aspect),
    sb = screenOf(b, pb, aspect);
  if (!sa || !sb) return 1;
  return Math.hypot((sa[0] - sb[0]) * aspect, sa[1] - sb[1]);
};
/** a world point that crosses the lens: for foreground wipes (a character, a post, a train, a wiper passing close to
 *  the camera hides the cut). Moves along the camera's right vector from `from` to `to` (in metres at distance `dist`)
 *  over n frames from f0, ease in-out; place a card or a model there and cut on its middle frame. */

export const lensPass = (c: Shot, f: number, f0: number, n: number, dist = 0.8, from = -1.4, to = 1.4, drop = 0): V3 => {
  const {
      fw,
      right,
      up
    } = basis(c),
    u = smooth((f - f0) / n);
  return add(add(add(c.pos, mul(fw, dist)), mul(right, lerp(from, to, u))), mul(up, drop));
};
