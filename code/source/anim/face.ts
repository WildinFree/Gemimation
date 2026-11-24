import type { FrontOpts, Outfit } from "../toon/toon";
import type { EyeK, Expr, FaceFx, MouthP, Marks } from "../toon/expressions";
import { ARM, gait, WALK, type ArmPose, type Gait, type GaitOut, type Rig } from "../toon/limbs";
import { POSES, NEUTRAL, VIS, type ExPose, type PoseName } from "../toon/poses";
export type Mode = {
  X: number;
  morph: boolean;
  visemes: boolean;
  marks: boolean;
  alive: boolean;
  bounce: number;
  w: number;
  z: number;
};
export const MODES: Record<string, Mode> = {
  push: {
    X: 1,
    morph: true,
    visemes: true,
    marks: true,
    alive: true,
    bounce: 0.08,
    w: 0.55,
    z: 0.13
  },
  wild: {
    X: 1.6,
    morph: true,
    visemes: true,
    marks: true,
    alive: true,
    bounce: 0.15,
    w: 0.6,
    z: 0.085
  }
};
export const DEFAULT_MODE = "wild";
export const variant = (base: string, x: Partial<Mode> = {}): Mode => ({
  ...MODES[base],
  ...x
});
export type { PoseName };
export type FKey = {
  f: number;
  pose: string;
  take?: boolean;
};
/** syllable: start frame, length, viseme, stressed */

export type Syl = [number, number, keyof typeof VIS, boolean?];
export type AKey = [number, ArmPose, ArmPose];
/** any character: an outfit plus the card seed */
/** talk style, applied only while a syllable is active: jaw scales the open amount (on top of pose jaw), w scales the mouth width,
 *  curve is added to the curve, round scales the viseme roundness. Defaults = no change. */

export type Talk = {
  jaw?: number;
  w?: number;
  curve?: number;
  round?: number;
};
/** a character's own acting: expression poses (a stock name overrides it for this character only, new names add poses), talk style, walk */

export type Acting = {
  poses?: Record<string, ExPose>;
  talk?: Talk;
  gait?: Gait;
};
export type FaceChar = {
  o: Outfit;
  seed?: number;
  scale?: number;
  acting?: Acting;
};
/** the pose for a name: the character's own first, then the stock one */

export const poseOf = (c: FaceChar, name: string): ExPose => {
  const p = c.acting?.poses?.[name] ?? POSES[name];
  if (!p) throw new Error(`unknown expression pose "${name}"`);
  return p;
};
/** the character's walk (its own gait, else WALK) and one walk frame of it: walkAt(rig, phase, char) */

export const gaitOf = (c: {
  acting?: Acting;
}): Gait => c.acting?.gait ?? WALK;
export const walkAt = (R0: Rig, phase: number, c: {
  acting?: Acting;
}): GaitOut => gait(R0, phase, gaitOf(c));
export type Track = {
  c: FaceChar;
  x: number;
  facing: -1 | 0 | 1;
  face: FKey[];
  syl?: Syl[];
  arms?: AKey[];
  blinks?: number[];
  turns?: [number, -1 | 0 | 1][];
  ph?: number;
};
const L = (a: number, b: number, t: number) => a + (b - a) * t;
const sprS = (t: number, m: Mode, w = m.w, z = m.z) => t <= 0 ? 0 : 1 - Math.exp(-z * w * t * 6) * Math.cos(w * t);
const thud = (t: number, amp: number) => t < 0 || t > 16 ? 1 : 1 - amp * Math.exp(-t / 2.4) * Math.cos(t * 0.9);
const scaled = (p: ExPose, X: number): ExPose => {
  const n = NEUTRAL,
    s = (a: number, b: number) => L(a, b, X);
  const mo: MouthP = {
    ...p.mouth,
    w: s(n.mouth.w, p.mouth.w),
    open: Math.max(0, s(0, p.mouth.open)),
    curve: s(0, p.mouth.curve),
    skew: s(0, p.mouth.skew ?? 0)
  };
  const mk: Marks = {};
  for (const [k, v] of Object.entries(p.marks ?? {})) (mk as Record<string, number>)[k] = Math.min(1.35, (v as number) * Math.min(X, 1.35));
  return {
    ...p,
    eyeK: s(1, p.eyeK),
    brow: [s(n.brow[0], p.brow[0]), s(n.brow[1], p.brow[1])],
    brow2: p.brow2 ? [s(n.brow[0], p.brow2[0]), s(n.brow[1], p.brow2[1])] : undefined,
    browUp: s(0, p.browUp),
    mouth: mo,
    cheeks: p.cheeks ? p.cheeks * Math.min(X, 1.3) : 0,
    head: s(1, p.head),
    tilt: s(0, p.tilt),
    look: p.look,
    body: s(1, p.body),
    marks: mk,
    jaw: (p.jaw ?? 1) * L(1, X, 0.5)
  };
};
const MK = ["vein", "steam", "lines", "tears", "sweat", "sparkle"] as const;
const mix = (a: ExPose, b: ExPose, t: number, eyeFromB: boolean): ExPose => {
  const ma = a.mouth,
    mb = b.mouth,
    mk: Marks = {};
  for (const k of MK) {
    const v = L(a.marks?.[k] ?? 0, b.marks?.[k] ?? 0, Math.min(1, t));
    if (v > 0.02) mk[k] = v;
  }
  const b2a = a.brow2 ?? a.brow,
    b2b = b.brow2 ?? b.brow;
  return {
    ...b,
    eye: eyeFromB ? b.eye : a.eye,
    eyeK: L(a.eyeK, b.eyeK, t),
    brow: [L(a.brow[0], b.brow[0], t), L(a.brow[1], b.brow[1], t)],
    brow2: [L(b2a[0], b2b[0], t), L(b2a[1], b2b[1], t)],
    browUp: L(a.browUp, b.browUp, t),
    cheeks: L(a.cheeks ?? 0, b.cheeks ?? 0, t),
    head: L(a.head, b.head, t),
    tilt: L(a.tilt, b.tilt, t),
    look: L(a.look, b.look, t),
    body: L(a.body, b.body, t),
    jaw: L(a.jaw ?? 1, b.jaw ?? 1, t),
    mouth: {
      w: L(ma.w, mb.w, t),
      open: Math.max(0, L(ma.open, mb.open, t)),
      curve: L(ma.curve, mb.curve, t),
      skew: L(ma.skew ?? 0, mb.skew ?? 0, t),
      teeth: L(ma.teeth ?? 0, mb.teeth ?? 0, Math.min(1, t)),
      tongue: L(ma.tongue ?? 0, mb.tongue ?? 0, Math.min(1, t)),
      round: L(ma.round ?? 0, mb.round ?? 0, Math.min(1, t)),
      wob: L(ma.wob ?? 0, mb.wob ?? 0, Math.min(1, t))
    },
    marks: mk
  };
};
const faceAt = (c: FaceChar, keys: FKey[], f: number, m: Mode): {
  P: ExPose;
  key: number;
} => {
  let i = -1;
  for (let j = 0; j < keys.length; j++) if (keys[j].f <= f) i = j;
  const rec = (k: number, ff: number): ExPose => {
    const Pk = scaled(poseOf(c, keys[Math.max(0, k)].pose), m.X);
    if (k <= 0) return Pk;
    const from = rec(k - 1, keys[k].f),
      t = ff - keys[k].f;
    return mix(from, Pk, m.morph ? sprS(t, m) : 1, t >= (m.morph ? 1 : 0));
  };
  return {
    P: rec(i, f),
    key: i
  };
};
const armMix = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({
  x: L(a.x, b.x, t),
  y: L(a.y, b.y, t),
  bend: L(a.bend, b.bend, t),
  front: t > 0.5 ? b.front : a.front
});
const armsAt = (keys: AKey[] | undefined, f: number, m: Mode): [ArmPose, ArmPose] => {
  if (!keys?.length) return [ARM.hang, ARM.hang];
  let i = 0;
  for (let j = 0; j < keys.length; j++) if (keys[j][0] <= f) i = j;
  const rec = (k: number, ff: number): [ArmPose, ArmPose] => {
    if (k <= 0) return [keys[0][1], keys[0][2]];
    const from = rec(k - 1, keys[k][0]),
      t = sprS(ff - keys[k][0], m, 0.45, 0.16);
    return [armMix(from[0], keys[k][1], t), armMix(from[1], keys[k][2], t)];
  };
  return rec(i, f);
};
export type Acted = {
  opts: FrontOpts;
  stretch: number;
  x: number;
  sideExpr: Expr;
  sideTalk: boolean;
  armsKeyed: boolean;
};
/** everything one character does at frame f. n = the drift period in frames: the shot length for a seamless loop, ~100-150 otherwise */

export const act = (tr: Track, f: number, n: number, m: Mode): Acted => {
  const {
      P,
      key
    } = faceAt(tr.c, tr.face, f, m),
    X = m.X;
  let head = P.head,
    body = P.body,
    tilt = P.tilt,
    browUp = P.browUp,
    look = P.look;
  for (const k of tr.face) {
    const t = f - k.f,
      amp = m.bounce * (k.take ? 2.2 : 1);
    if (k.take && t >= -5 && t < 0) {
      const a = ((t + 5) / 5) ** 2;
      head *= 1 - 0.09 * X * a;
      body *= 1 - 0.05 * X * a;
    }
    if (t >= 0 && t <= 16 && k !== tr.face[0]) {
      head *= thud(t, amp);
      body *= thud(t, amp * 0.6);
    }
  }
  let facing = tr.facing;
  for (const [tf, fc] of tr.turns ?? []) {
    if (f < tf) continue;
    const from = facing,
      t = f - tf;
    facing = fc;
    if (t < 4 && from !== fc && from !== 0 && fc !== 0) facing = 0;
    if (t <= 16) {
      head *= thud(t, m.bounce);
      body *= thud(t, m.bounce * 0.6);
    }
  }
  let mouth = {
    ...P.mouth
  };
  const syl = (tr.syl ?? []).find(([s0, len]) => f >= s0 && f < s0 + len);
  if (syl) {
    const [s0, len, v] = syl,
      tt = f - s0,
      T = tr.c.acting?.talk,
      jaw = (P.jaw ?? 1) * (T?.jaw ?? 1);
    if (!m.visemes) {
      const op = tt % 7 < 4;
      if (op) mouth = {
        ...mouth,
        open: Math.max(mouth.open, 7.5 * jaw),
        w: mouth.w * (T?.w ?? 1),
        curve: mouth.curve + (T?.curve ?? 0),
        teeth: Math.max(mouth.teeth ?? 0, 0.6),
        tongue: 0.5
      };
    } else {
      const env = Math.sin(Math.PI * Math.min(1, (tt + 0.7) / len)) ** 0.6,
        V = VIS[v];
      mouth = {
        ...mouth,
        open: L(mouth.open, (V.open ?? 0) * jaw, env),
        w: L(mouth.w, V.w ?? mouth.w, env * 0.6) * (T?.w ?? 1),
        round: L(mouth.round ?? 0, (V.round ?? 0) * (T?.round ?? 1), env),
        teeth: L(mouth.teeth ?? 0, V.teeth ?? 0, env),
        tongue: L(mouth.tongue ?? 0, V.tongue ?? 0, env),
        curve: mouth.curve * (1 - 0.3 * env) + (T?.curve ?? 0)
      };
    }
  }
  for (const [s0,,, st] of tr.syl ?? []) {
    const t = f - s0;
    if (!st || t < 0 || t > 9) continue;
    browUp += 3.2 * X * Math.exp(-t / 3.5);
    head *= 1 - 0.045 * Math.min(X, 1.3) * Math.sin(Math.PI * Math.min(1, t / 6));
    tilt += 2.6 * Math.min(X, 1.3) * Math.exp(-t / 3) * Math.sin(t * 0.9) * (facing || 1);
  }
  if (m.alive) {
    const ph = tr.ph ?? 0;
    body *= 1 + 0.008 * Math.sin(2 * Math.PI * 2 * f / n + ph);
    tilt += 1.3 * Math.sin(2 * Math.PI * f / n + ph * 1.7);
    look += 0.15 * Math.sin(2 * Math.PI * 2 * f / n + ph);
  }
  let lid = 0;
  for (const b of tr.blinks ?? []) {
    const t = f - b;
    if (t >= 0 && t < 4) lid = Math.max(lid, [0.5, 1, 1, 0.5][t]);
  }
  for (const k of tr.face.slice(1)) {
    const t = f - k.f + 1;
    if (!k.take && t >= 0 && t < 3) lid = Math.max(lid, [0.5, 1, 0.5][t]);
  }
  const D = tr.c.o.dna,
    lidK: EyeK = D?.eye === "wide" ? "wideLid" : D?.eye === "bead" ? "beadLid" : "lid";
  const eye = P.eye.map(k => k === "lid" ? lidK : k) as [EyeK, EyeK];
  const arms = armsAt(tr.arms, f, m);
  const fx: FaceFx = {
    eye,
    eyeK: P.eyeK,
    brow: P.brow,
    brow2: P.brow2,
    browUp,
    mouth,
    cheeks: P.cheeks,
    headSt: head,
    marks: m.marks ? P.marks : undefined,
    t: f
  };
  const opts: FrontOpts = {
    mode: "stand",
    seed: tr.c.seed ?? 1,
    facing,
    expr: "neutral",
    fx,
    look,
    blink: lid,
    headTilt: tilt * (facing || 1),
    talk: false,
    limbs: {
      arms
    }
  };
  return {
    opts,
    stretch: body,
    x: tr.x,
    sideExpr: poseOf(tr.c, tr.face[Math.max(0, key)].pose).house,
    sideTalk: !!syl && mouth.open > 3,
    armsKeyed: !!tr.arms?.length
  };
};
/** syllables from a pattern: "a e A _3 o7" = viseme per token (UPPER = stressed), _n = gap of n frames, a digit = length.
 *  In a short, build them from words.json (one token per syllable, stressed syllables upper case). */

export const say = (f0: number, pat: string, len = 5): Syl[] => {
  const out: Syl[] = [];
  let f = f0;
  for (const tok of pat.trim().split(/\s+/)) {
    if (tok[0] === "_") {
      f += Number(tok.slice(1) || 3);
      continue;
    }
    const v = tok[0].toLowerCase() as Syl[2],
      n = Number(tok.slice(1)) || len;
    out.push([f, n, v, tok[0] !== tok[0].toLowerCase()]);
    f += n;
  }
  return out;
};
export const cardFields = (a: Acted) => ({
  expr: a.opts.expr,
  fx: a.opts.fx,
  look: a.opts.look,
  headTilt: a.opts.headTilt,
  talk: a.opts.talk,
  blink: typeof a.opts.blink === "number" ? a.opts.blink : 0,
  side: {
    expr: a.sideExpr,
    talk: a.sideTalk
  },
  ...(a.armsKeyed ? {
    limbs: a.opts.limbs
  } : {}),
  squash: a.stretch - 1
});
