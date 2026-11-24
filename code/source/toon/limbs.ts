import { LOOK } from "./dna";
export type P2 = [number, number];
export type Side = -1 | 1;
export type View = "front" | "side";
export type Build = "adult" | "stout" | "kid" | "slim" | "thin" | "round";
export type FootStyle = "stroke" | "dot" | "none";
/** anything with a 2D context; P (optional) maps a design point to canvas space, like the toon Pen's rotation */
export type PenLike = {
  g: CanvasRenderingContext2D;
  P?: (x: number, y: number) => P2;
};
/** character ink: the same near-black plum as the toon outline (INK in toon.ts) */
export const LIMB_INK = "#241726";
export type LimbStyle = {
  ink: string;
  arm: number;
  leg: number;
  hand: number;
  footLen: number;
  footW: number;
  toe: number;
  footDot: number;
  foot: FootStyle;
};
/** measured limb sizes for a head width W (u = W / 100): arm 5.2u, leg 5.8u, hand r 5.5u, foot 16u x 7.5u */
export const limbStyle = (W: number, o: Partial<LimbStyle> = {}): LimbStyle => {
  const u = W / 100;
  const s: LimbStyle = {
    ink: LIMB_INK,
    arm: 5.2 * u * LOOK.limb,
    leg: 5.8 * u * LOOK.limb,
    hand: 5.5 * u * Math.sqrt(LOOK.limb),
    footLen: 16 * u,
    footW: 7.5 * u,
    toe: 4.6 * u,
    footDot: 6.5 * u,
    foot: "stroke"
  };
  return {
    ...s,
    ...o
  };
};
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const rad = (d: number) => d * Math.PI / 180;
const frac = (x: number) => x - Math.floor(x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp2 = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const dist = (a: P2, b: P2) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const smootherstep = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (6 * x - 15) + 10);
};
const rotAbout = (p: P2, c: P2, deg: number): P2 => {
  const a = rad(deg),
    s = Math.sin(a),
    k = Math.cos(a),
    x = p[0] - c[0],
    y = p[1] - c[1];
  return [c[0] + x * k - y * s, c[1] + x * s + y * k];
};
const bez = (a: P2, c: P2, b: P2, n: number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      s = 1 - t;
    out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]);
  }
  return out;
};
export const polyLen = (pts: P2[]) => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  return l;
};
/**
 * Two-bone IK: the joint between a and b for bone lengths l1, l2. The joint goes on the side of the a-b line that
 * points along `pref` (for example forward for a knee in side view, outward for an elbow).
 * If b is out of reach the chain is straight toward b; `end` is where the chain really ends.
 */
export const ik2 = (a: P2, b: P2, l1: number, l2: number, pref: P2): {
  joint: P2;
  end: P2;
} => {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    d0 = Math.hypot(dx, dy) || 1e-9;
  const ux = dx / d0,
    uy = dy / d0;
  const d = clamp(d0, Math.abs(l1 - l2) + 1e-6, l1 + l2 - 1e-6);
  const end: P2 = [a[0] + ux * d, a[1] + uy * d];
  const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d),
    h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  let nx = -uy,
    ny = ux;
  if (nx * pref[0] + ny * pref[1] < 0) {
    nx = -nx;
    ny = -ny;
  }
  return {
    joint: [a[0] + ux * x + nx * h, a[1] + uy * x + ny * h],
    end
  };
};
/**
 * Fixed-length hose from a toward b: a smooth quadratic curve whose arc length is exactly `len`, bowing to the side
 * of `pref` (the elbow side). If b is farther than len, the hose is straight and stops short at `end`.
 */
export const hose = (a: P2, b: P2, len: number, pref: P2, n = 16): {
  pts: P2[];
  end: P2;
} => {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    d0 = Math.hypot(dx, dy) || 1e-9;
  const ux = dx / d0,
    uy = dy / d0;
  if (d0 >= len * 0.999) {
    const end: P2 = [a[0] + ux * len, a[1] + uy * len];
    return {
      pts: bez(a, lerp2(a, end, 0.5), end, n),
      end
    };
  }
  let nx = -uy,
    ny = ux;
  if (nx * pref[0] + ny * pref[1] < 0) {
    nx = -nx;
    ny = -ny;
  }
  const m: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const at = (h: number) => bez(a, [m[0] + nx * h, m[1] + ny * h], b, 48);
  let lo = 0,
    hi = len * 2;
  for (let i = 0; i < 30; i++) {
    const h = (lo + hi) / 2;
    if (polyLen(at(h)) < len) lo = h;else hi = h;
  }
  const h = (lo + hi) / 2;
  return {
    pts: bez(a, [m[0] + nx * h, m[1] + ny * h], b, n),
    end: b
  };
};
const through = (a: P2, k: P2, b: P2, n = 16): P2[] => bez(a, [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], b, n);
export const LIMB_BUILD: Record<Build, {
  arm: number;
  leg: number;
}> = {
  adult: {
    arm: 0.95,
    leg: 1.4
  },
  stout: {
    arm: 0.97,
    leg: 1.2
  },
  kid: {
    arm: 0.72,
    leg: 0.82
  },
  slim: {
    arm: 0.96,
    leg: 1.42
  },
  thin: {
    arm: 0.98,
    leg: 1.48
  },
  round: {
    arm: 0.9,
    leg: 1.2
  }
};
export type RigIn = {
  W: number;
  HH: number;
  chin: number;
  Ta: number;
  cx?: number;
  sole?: number;
  build?: Build;
  view?: View;
  facing?: Side;
  armHH?: number;
  legHH?: number;
  style?: Partial<LimbStyle>;
};
export type Rig = {
  W: number;
  HH: number;
  u: number;
  chin: number;
  Ta: number;
  cx: number;
  sole: number;
  view: View;
  facing: Side;
  sh: [P2, P2];
  hip: [P2, P2];
  armLen: number;
  thigh: number;
  shin: number;
  ankleUp: number;
  stance: number;
  style: LimbStyle;
};
/**
 * Build the limb rig for one character. Shoulders sit tucked inside the torso edge (front: x = +-0.85 Ta,
 * y = chin + 0.12 HH); hips at +-0.35 Ta; legs reach the soles. Lengths are fixed per build and never stretch.
 */

export const rig = (o: RigIn): Rig => {
  const cx = o.cx ?? 300,
    sole = o.sole ?? 975,
    view = o.view ?? "front",
    facing = o.facing ?? 1;
  const b = LIMB_BUILD[o.build ?? "adult"],
    u = o.W / 100,
    style = limbStyle(o.W, o.style);
  const shY = o.chin + 0.12 * o.HH,
    legLen = (o.legHH ?? b.leg) * o.HH,
    hipY = sole - legLen;
  const ankleUp = style.footW / 2;
  let sh: [P2, P2], hip: [P2, P2], stance: number;
  if (view === "front") {
    sh = [[cx - 0.85 * o.Ta, shY], [cx + 0.85 * o.Ta, shY]];
    hip = [[cx - 0.35 * o.Ta, hipY], [cx + 0.35 * o.Ta, hipY]];
    stance = 0.225 * o.W - 0.3 * style.footLen;
  } else {
    const f = facing;
    sh = f > 0 ? [[cx - 0.05 * o.Ta, shY], [cx + 0.08 * o.Ta, shY]] : [[cx - 0.08 * o.Ta, shY], [cx + 0.05 * o.Ta, shY]];
    hip = [[cx - 0.06 * o.Ta, hipY], [cx + 0.06 * o.Ta, hipY]];
    stance = 0.04 * o.W;
  }
  const rest = Math.hypot(hip[1][0] - (cx + stance), sole - ankleUp - hipY);
  const L = rest * 1.015;
  return {
    W: o.W,
    HH: o.HH,
    u,
    chin: o.chin,
    Ta: o.Ta,
    cx,
    sole,
    view,
    facing,
    sh,
    hip,
    armLen: (o.armHH ?? b.arm) * o.HH,
    thigh: L / 2,
    shin: L / 2,
    ankleUp,
    stance,
    style
  };
};
/**
 * Squash and stretch for the house-rule expression bounce: moves the shoulders and hips (never a canvas scale, so
 * hands stay round and line widths stay constant). s > 0 squashes (down and wider), s < 0 stretches.
 * Limb lengths stay fixed: squashed legs simply bend a little more. Apply the same y factor to the torso and head.
 */

export const squash = (R: Rig, s: number): Rig => {
  const ky = 1 - s,
    kx = 1 + 0.5 * s;
  const m = (p: P2): P2 => [R.cx + (p[0] - R.cx) * kx, R.sole + (p[1] - R.sole) * ky];
  return {
    ...R,
    sh: [m(R.sh[0]), m(R.sh[1])],
    hip: [m(R.hip[0]), m(R.hip[1])]
  };
};
/** move the whole upper body: dy (down +) on shoulders and hips, then lean (deg, + = toward facing) about the hips */

export const shiftBody = (R: Rig, dy: number, lean = 0): Rig => {
  const hc: P2 = [(R.hip[0][0] + R.hip[1][0]) / 2, (R.hip[0][1] + R.hip[1][1]) / 2 + dy];
  const deg = lean * R.facing;
  const m = (p: P2): P2 => rotAbout([p[0], p[1] + dy], hc, deg);
  return {
    ...R,
    sh: [m(R.sh[0]), m(R.sh[1])],
    hip: [[R.hip[0][0], R.hip[0][1] + dy], [R.hip[1][0], R.hip[1][1] + dy]]
  };
};
export type ArmGeo = {
  side: Side;
  pts: P2[];
  hand: P2;
  front: boolean;
};
export type LegGeo = {
  side: Side;
  pts: P2[];
  ankle: P2;
  knee: P2;
  foot: [P2, P2] | null;
};
export type Limbs = {
  arms: ArmGeo[];
  legs: LegGeo[];
};
/**
 * Arm target, in head heights relative to the shoulder: x is OUTWARD from the body (away from the torso centre,
 * negative = across the body), y is down. bend: +1 bows the hose outward / down (elbow out), -1 inward / up.
 * front: draw after the torso (crossing the body or holding a prop).
 */

export type ArmPose = {
  x: number;
  y: number;
  bend: number;
  front?: boolean;
};
/** geometry of one arm for a target pose */

export const armGeo = (R: Rig, side: Side, a: ArmPose): ArmGeo => {
  const S = R.sh[side < 0 ? 0 : 1];
  const out = R.view === "front" ? side : R.facing;
  const T: P2 = [S[0] + out * a.x * R.HH, S[1] + a.y * R.HH];
  const dx = T[0] - S[0],
    dy = T[1] - S[1];
  let pref: P2 = [out, 0.35];
  if (Math.abs(dx) > Math.abs(dy)) pref = [0, 1];
  if (a.bend < 0) pref = [-pref[0], -pref[1]];
  if (R.view === "side" && Math.abs(dx) <= Math.abs(dy)) pref = [-R.facing * Math.sign(a.bend || 1), 0];
  const h = hose(S, T, R.armLen, pref);
  return {
    side,
    pts: h.pts,
    hand: h.end,
    front: a.front ?? false
  };
};
/** geometry of one leg from its hip to an ankle point; toe angle in degrees (0 = flat, + = toe down) */

export const legGeo = (R: Rig, side: Side, ankle: P2, toeDeg = 0, kneePref?: P2): LegGeo => {
  const H = R.hip[side < 0 ? 0 : 1];
  const fwd = R.view === "front" ? side : R.facing;
  const pref: P2 = kneePref ?? (R.view === "front" ? [side, 0] : [R.facing, 0]);
  const k = ik2(H, ankle, R.thigh, R.shin, pref);
  const A = k.end;
  let foot: [P2, P2] | null = null;
  if (R.style.foot !== "none") {
    const a = rad(toeDeg),
      len = R.style.foot === "dot" ? 0 : R.style.footLen;
    foot = [A, [A[0] + fwd * Math.cos(a) * len, A[1] + Math.sin(a) * len]];
  }
  return {
    side,
    pts: through(H, k.joint, A),
    ankle: A,
    knee: k.joint,
    foot
  };
};
/** arm pose library (front view; also usable in side view, where x = toward facing). k animates 0..1 where noted */

export const ARM = {
  hang: {
    x: 0.1,
    y: 0.9,
    bend: 1
  } as ArmPose,
  wave: (w = 0): ArmPose => ({
    x: 0.42 + 0.14 * w,
    y: -0.5,
    bend: 1
  }),
  raise: (k = 1): ArmPose => ({
    x: lerp(0.36, 0.26, k),
    y: lerp(-0.35, -0.84, k),
    bend: 1
  }),
  cheer: {
    x: 0.38,
    y: -0.8,
    bend: 1
  } as ArmPose,
  point: {
    x: 1.4,
    y: 0.02,
    bend: 1,
    front: true
  } as ArmPose,
  reach: (k = 1): ArmPose => ({
    x: lerp(0.1, 0.75, k),
    y: lerp(0.9, 0.3, k),
    bend: 1,
    front: true
  }),
  hips: {
    x: 0.04,
    y: 0.66,
    bend: 1
  } as ArmPose,
  shrug: (k = 1): ArmPose => ({
    x: 0.38,
    y: lerp(0.45, 0.18, k),
    bend: 1
  }),
  hold: {
    x: -0.16,
    y: 0.62,
    bend: 1,
    front: true
  } as ArmPose,
  chest: {
    x: -0.3,
    y: 0.38,
    bend: 1,
    front: true
  } as ArmPose,
  crossed: {
    x: -0.86,
    y: 0.42,
    bend: 1,
    front: true
  } as ArmPose,
  sideHang: {
    x: 0.04,
    y: 0.93,
    bend: 1
  } as ArmPose
};
export type LegPose = "stand" | "crouch" | "sit" | {
  ankles: [P2, P2];
  toe?: [number, number];
};
export type Pose = {
  arms: [ArmPose, ArmPose];
  legs?: LegPose;
  crouch?: number;
  seat?: number;
  knees?: number;
};
const ankleRest = (R: Rig, side: Side): P2 => R.view === "front" ? [R.cx + side * R.stance, R.sole - R.ankleUp] : [R.cx + side * R.stance * R.facing, R.sole - R.ankleUp];
/** legs for a static leg pose; returns the (possibly lowered) rig too, since crouch and sit move the hips */

export const legsFor = (R0: Rig, p: Pose): {
  R: Rig;
  legs: LegGeo[];
} => {
  const lp = p.legs ?? "stand";
  if (lp === "stand") return {
    R: R0,
    legs: [legGeo(R0, -1, ankleRest(R0, -1)), legGeo(R0, 1, ankleRest(R0, 1))]
  };
  if (lp === "crouch") {
    const c = clamp(p.crouch ?? 0.6, 0, 1),
      L = R0.thigh + R0.shin;
    const R = shiftBody(R0, c * 0.32 * L);
    const sp = R0.view === "front" ? 1 + 0.6 * c : 1;
    const an = (s: Side): P2 => {
      const a = ankleRest(R0, s);
      return [R.cx + (a[0] - R.cx) * sp, a[1]];
    };
    return {
      R,
      legs: [legGeo(R, -1, an(-1)), legGeo(R, 1, an(1))]
    };
  }
  if (lp === "sit") {
    const seat = (p.seat ?? 0.5) * R0.HH,
      kn = clamp(p.knees ?? 0.7, 0, 1),
      L = R0.thigh + R0.shin;
    const hipY = R0.sole - seat,
      dy = hipY - R0.hip[0][1];
    const R = shiftBody(R0, dy);
    const legs: LegGeo[] = [];
    for (const s of [-1, 1] as Side[]) {
      const H = R.hip[s < 0 ? 0 : 1],
        dv = R.sole - R.ankleUp - H[1];
      const far = Math.sqrt(Math.max(0, (0.98 * L) ** 2 - dv * dv));
      const reach = lerp(far, Math.max(0.3 * L, far * 0.35), kn);
      if (R.view === "side") {
        const back = s === R.facing ? 0 : -0.04 * R.W;
        legs.push(legGeo(R, s, [H[0] + R.facing * reach + back, R.sole - R.ankleUp], 0, [R.facing * 0.3, -1]));
      } else {
        const K: P2 = [H[0] + s * 0.1 * R.W, H[1] + 0.06 * R.HH],
          A: P2 = [K[0] + s * 0.02 * R.W, R.sole - R.ankleUp];
        const fl = R.style.foot === "dot" ? 0 : R.style.footLen;
        legs.push({
          side: s,
          pts: through(H, K, A),
          knee: K,
          ankle: A,
          foot: R.style.foot === "none" ? null : [A, [A[0] + s * fl, A[1]]]
        });
      }
    }
    return {
      R,
      legs
    };
  }
  const t = lp.toe ?? [0, 0];
  return {
    R: R0,
    legs: [legGeo(R0, -1, lp.ankles[0], t[0]), legGeo(R0, 1, lp.ankles[1], t[1])]
  };
};
/** full static pose: legs (which may move the hips), then arms on the moved shoulders */

export const posed = (R0: Rig, p: Pose): Limbs & {
  R: Rig;
} => {
  const {
    R,
    legs
  } = legsFor(R0, p);
  return {
    R,
    legs,
    arms: [armGeo(R, -1, p.arms[0]), armGeo(R, 1, p.arms[1])]
  };
};
export type Gait = {
  stride: number;
  duty: number;
  lift: number;
  swing: number;
  bob: number;
  lean: [number, number];
};
/** measured walk: steps 9-12 f, bob 3-7 %, lean 1 deg passing to 5-7 deg contact, planted feet */

export const WALK: Gait = {
  stride: 0.75,
  duty: 0.56,
  lift: 0.1,
  swing: 22,
  bob: 0.032,
  lean: [1, 6]
};
export const RUN: Gait = {
  stride: 1.25,
  duty: 0.36,
  lift: 0.32,
  swing: 48,
  bob: 0.012,
  lean: [8, 12]
};
/** marching in place / toward the camera (front view) */

export const MARCH: Gait = {
  stride: 0,
  duty: 0.55,
  lift: 0.16,
  swing: 14,
  bob: 0.03,
  lean: [0, 0]
};
/** frames per full cycle (two steps) for a step length in frames (reference 9-12 f per step) */

export const cycleFrames = (stepFrames = 10) => 2 * stepFrames;
/** gait phase 0..1 at frame f */

export const gaitPhase = (f: number, stepFrames = 10, offset = 0) => frac(f / cycleFrames(stepFrames) + offset);
export type GaitOut = Limbs & {
  R: Rig;
  dy: number;
  lean: number;
  advance: number;
  travel: number;
};
/**
 * One gait frame. phase 0..1 over a full cycle (two steps); leg 0 is the screen-left leg. Foot strikes at phase 0
 * (left) and 0.5 (right). Side view moves along facing; front view lifts the feet in place.
 * Pure: the same phase always gives the same drawing. Card position = start + (cycles + advance) where
 * cycles = floor(f / cycleFrames) * travel, so the planted foot never slides.
 */

export const gait = (R0: Rig, phase: number, g: Gait = WALK): GaitOut => {
  const ph = frac(phase),
    s = g.stride * R0.W,
    lift = g.lift * R0.W,
    L = R0.thigh + R0.shin;
  const fwd = R0.view === "side" ? R0.facing : 0;
  const travel = g.duty > 0 ? s / g.duty : 0;
  const ankles: P2[] = [],
    toes: number[] = [];
  const sides: Side[] = [-1, 1];
  for (let i = 0; i < 2; i++) {
    const sd = sides[i],
      q = frac(ph + i * 0.5),
      base = ankleRest(R0, sd);
    let x: number,
      y = 0,
      toe = 0;
    if (q < g.duty) {
      x = s / 2 - s * (q / g.duty);
    } else {
      const w = (q - g.duty) / (1 - g.duty);
      x = -s / 2 + s * smootherstep(w);
      y = lift * Math.sin(Math.PI * w);
      toe = R0.view === "side" ? 28 * Math.sin(Math.PI * w) * (1 - w) - 12 * Math.sin(Math.PI * w) * w : 0;
    }
    ankles.push([base[0] + fwd * x, base[1] - y]);
    toes.push(toe);
  }
  const c = 0.5 + 0.5 * Math.cos(4 * Math.PI * ph);
  const H = 3.5 * R0.HH;
  let hipY = R0.hip[0][1];
  for (let i = 0; i < 2; i++) {
    const hp = R0.hip[i],
      dx = ankles[i][0] - hp[0];
    const need = ankles[i][1] - Math.sqrt(Math.max(0, (0.995 * L) ** 2 - dx * dx));
    hipY = Math.max(hipY, need);
  }
  const dy = hipY - R0.hip[0][1] + g.bob * H * c - (g.duty < 0.5 ? g.bob * H * (1 - c) : 0);
  const lean = lerp(g.lean[0], g.lean[1], c);
  const R = shiftBody(R0, dy, R0.view === "side" ? lean : 0);
  const legs = [legGeo(R, -1, ankles[0], toes[0]), legGeo(R, 1, ankles[1], toes[1])];
  const arms: ArmGeo[] = [];
  for (let i = 0; i < 2; i++) {
    const sd = sides[i],
      q = frac(ph + i * 0.5);
    const sw = Math.cos(2 * Math.PI * q);
    let a: ArmPose;
    if (R.view === "side") {
      const th = rad(-g.swing * sw),
        r = 0.93;
      a = {
        x: Math.sin(th) * r,
        y: Math.cos(th) * r,
        bend: 1
      };
    } else {
      a = {
        x: 0.1,
        y: 0.9 - 0.08 * (1 - Math.abs(sw)) - 0.06 * Math.max(0, -sw),
        bend: 1
      };
    }
    arms.push(armGeo(R, sd, a));
  }
  const advance = fwd * travel * ph;
  return {
    R,
    legs,
    arms,
    dy,
    lean: R0.view === "side" ? lean : 0,
    advance,
    travel
  };
};
export const mixArm = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  bend: lerp(a.bend, b.bend, t) >= 0 ? 1 : -1,
  front: t < 0.5 ? a.front : b.front
});
/** blend two poses; leg poses snap at t = 0.5 unless both are "crouch"/"sit" (then their numbers blend) */

export const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  arms: [mixArm(a.arms[0], b.arms[0], t), mixArm(a.arms[1], b.arms[1], t)],
  legs: t < 0.5 ? a.legs : b.legs,
  crouch: lerp(a.crouch ?? (a.legs === "crouch" ? 0.6 : 0), b.crouch ?? (b.legs === "crouch" ? 0.6 : 0), t),
  seat: lerp(a.seat ?? 0.5, b.seat ?? 0.5, t),
  knees: lerp(a.knees ?? 0.7, b.knees ?? 0.7, t)
});
export type PoseKey = {
  f: number;
  pose: Pose;
  dur?: number;
  settle?: number;
};
/**
 * Keyframed pose track: poseAt(f) blends from the previous key to the current one with smootherstep over `dur`
 * frames, then the hands settle with a small damped overshoot. Pure in f.
 */

export const poseAt = (keys: PoseKey[], f: number): Pose => {
  if (!keys.length) return {
    arms: [ARM.hang, ARM.hang]
  };
  const ks = [...keys].sort((a, b) => a.f - b.f);
  let i = -1;
  for (let j = 0; j < ks.length; j++) if (ks[j].f <= f) i = j;
  if (i < 0) return ks[0].pose;
  const k = ks[i],
    prev = i > 0 ? ks[i - 1].pose : k.pose,
    dur = Math.max(1, k.dur ?? 6);
  const t = (f - k.f) / dur;
  if (t < 1) return mixPose(prev, k.pose, smootherstep(t));
  const st = k.settle ?? 0.08,
    tau = f - k.f - dur;
  if (!st || tau > 12) return k.pose;
  const o = st * Math.exp(-tau / 3) * Math.sin(tau / 6 * Math.PI * 2);
  const ov = (a: ArmPose, p: ArmPose): ArmPose => ({
    ...a,
    x: a.x + (a.x - p.x) * o,
    y: a.y + (a.y - p.y) * o
  });
  return {
    ...k.pose,
    arms: [ov(k.pose.arms[0], prev.arms[0]), ov(k.pose.arms[1], prev.arms[1])]
  };
};
const mapPts = (p: PenLike, pts: P2[]): P2[] => p.P ? pts.map(([x, y]) => p.P!(x, y)) : pts;
/** one uniform round-capped ink line */

export const inkLine = (p: PenLike, pts: P2[], w: number, col: string) => {
  const g = p.g,
    q = mapPts(p, pts);
  if (q.length < 2) return;
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.lineWidth = w;
  g.strokeStyle = col;
  g.beginPath();
  g.moveTo(q[0][0], q[0][1]);
  for (let i = 1; i < q.length; i++) g.lineTo(q[i][0], q[i][1]);
  g.stroke();
  g.restore();
};
/** filled ink circle */

export const inkDot = (p: PenLike, c: P2, r: number, col: string) => {
  const [x, y] = p.P ? p.P(c[0], c[1]) : c;
  p.g.save();
  p.g.fillStyle = col;
  p.g.beginPath();
  p.g.arc(x, y, r, 0, Math.PI * 2);
  p.g.fill();
  p.g.restore();
};
/** the arm line only (draw the prop next, then drawHand on top for a grip) */

export const drawArm = (p: PenLike, R: Rig, a: ArmGeo) => inkLine(p, a.pts, R.style.arm, R.style.ink);
/** the hand circle on the end of the arm */

export const drawHand = (p: PenLike, R: Rig, a: ArmGeo, scale = 1) => inkDot(p, a.hand, R.style.hand * scale, R.style.ink);
/** the foot: a short segment bent at the ankle with a slightly bulbous round end, or a dot */

export const drawFoot = (p: PenLike, R: Rig, l: LegGeo) => {
  const st = R.style;
  if (!l.foot || st.foot === "none") return;
  if (st.foot === "dot") {
    inkDot(p, l.ankle, st.footDot, st.ink);
    return;
  }
  inkLine(p, l.foot, st.footW, st.ink);
  inkDot(p, l.foot[1], st.toe, st.ink);
};
export const drawLeg = (p: PenLike, R: Rig, l: LegGeo) => {
  inkLine(p, l.pts, R.style.leg, R.style.ink);
  drawFoot(p, R, l);
};
/** both legs (draw first, before the back arm and the torso) */

export const drawLegs = (p: PenLike, R: Rig, L: Limbs) => {
  for (const l of L.legs) drawLeg(p, R, l);
};
/**
 * Arms by layer: "back" = arms not marked front (draw before the torso), "front" = arms marked front (after the
 * torso), "all" = both. Side view: the far arm (screen side opposite to facing) is "back", the near arm "front".
 * Returns the hand anchors drawn, so props can be attached to them.
 */

export const drawArms = (p: PenLike, R: Rig, L: Limbs, layer: "back" | "front" | "all" = "all"): P2[] => {
  const out: P2[] = [];
  for (const a of L.arms) {
    const far = R.view === "side" && a.side !== R.facing;
    const isFront = R.view === "side" ? !far : !!a.front;
    if (layer === "all" || layer === "front" === isFront) {
      drawArm(p, R, a);
      drawHand(p, R, a);
      out.push(a.hand);
    }
  }
  return out;
};
