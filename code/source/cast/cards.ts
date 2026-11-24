import * as THREE from "three";
import { Pen, bodyFront, bodySide, fxBurst, fxContact, fxShadow, fxFlour, fxPuff, fxDrop, fxPlip, fxSweat, fxGlow, fxSparkle, fxGlint, fxShock, Outfit, Expr, FrontOpts, SideOpts, Pose, Prop, REC, Anch, heldKind, HeldKind } from "../toon/toon";
import { V3, clamp01, lerp, q, hash as hh, smooth } from "../util";
import { eyesShut, type FaceFx } from "../toon/expressions";
import { MoodPreset, MOODS } from "../light/moods";
import { NOINK } from "../post/ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";
/** frames from the lip to the landing for drop() */
export const DROP_FALL = 9;
type Entry = {
  cv: HTMLCanvasElement;
  tex: THREE.CanvasTexture;
  w: number;
  h: number;
};
export type Req = {
  key: string;
  w: number;
  h: number;
  k: number;
  draw: (p: Pen) => void;
  tex?: THREE.CanvasTexture;
};
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return {
    cv,
    tex,
    w,
    h
  };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = {
      key: `${w}x${h}|${key}`,
      w,
      h,
      k,
      draw
    };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) {
      const l = want.get(r.key);
      if (l) l.push(r);else want.set(r.key, [r]);
    }
    for (const [key, e] of this.live) if (!want.has(key)) {
      this.live.delete(key);
      this.free.push(e);
    }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0],
          i = this.free.findIndex(x => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, e.w, e.h);
        g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}
const blank = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  return new THREE.CanvasTexture(c);
})();
export const SU = 0.00216;
const BODY = (() => {
  const g = new THREE.PlaneGeometry(800 * SU, 1000 * SU);
  g.translate(0, (975 - 500) * SU, 0);
  return g;
})();
const wide = (draw: (p: Pen) => void) => (p: Pen) => {
  p.g.translate(100, 0);
  draw(p);
};
const CARD = new THREE.PlaneGeometry(1, 1);
export class Actor {
  mesh: THREE.Mesh;
  mat: THREE.MeshLambertMaterial;
  dmat: THREE.MeshDepthMaterial;
  r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({
      map: blank,
      alphaTest: 0.5,
      side: THREE.DoubleSide
    }));
    this.dmat = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: blank,
      alphaTest: 0.5,
      side: THREE.DoubleSide
    });
    this.mesh = new THREE.Mesh(BODY, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = r => {
      const rt = r.getRenderTarget();
      CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920;
    };
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ";
    this.mesh.renderOrder = 1;
    this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  bind() {
    const t = this.r?.tex;
    if (t) {
      this.mat.map = t;
      this.dmat.map = t;
    }
  }
}
export class Fx {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  soft: THREE.MeshBasicMaterial;
  addm: THREE.MeshBasicMaterial;
  blob: THREE.MeshBasicMaterial;
  r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({
      map: blank,
      alphaTest: 0.5,
      side: THREE.DoubleSide
    });
    this.soft = new THREE.MeshBasicMaterial({
      map: blank,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.addm = new THREE.MeshBasicMaterial({
      map: blank,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false;
    this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean, opacity = 1, add = false) {
    this.mesh.material = add ? this.addm : soft ? this.soft : this.mat;
    this.soft.opacity = opacity;
    this.addm.opacity = opacity;
    this.addm.color.setScalar(add ? 1.6 : 1);
  }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) {
        t.generateMipmaps = false;
        t.minFilter = THREE.LinearFilter;
        t.needsUpdate = true;
      }
      this.blob.map = t;
      this.mesh.material = this.blob;
      this.mesh.renderOrder = 0.5;
    } else {
      this.mat.map = t;
      this.soft.map = t;
      this.addm.map = t;
      this.mesh.renderOrder = this.mesh.material === this.mat ? 0 : 2;
    }
  }
}
export type Place = {
  key: string;
  draw: (p: Pen) => void;
  x: number;
  y: number;
  z: number;
  scale?: number;
  mirror?: boolean;
  yaw?: number;
  roll?: number;
  size?: [number, number, number];
  dx?: number;
  anch?: Anch;
  tag?: string;
  sq?: number;
};
export type FxPlace = {
  key: string;
  cw: number;
  ch: number;
  draw: (p: Pen) => void;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  flat?: boolean;
  rot?: number;
  soft?: boolean;
  opacity?: number;
  add?: boolean;
};
export type CamInfo = {
  pos: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
  sun: THREE.Vector3;
};
/** a 3D prop held by a close-up arm card (world.ts): centre, in-screen angle (rad, clockwise), the hand disc in front */

export type Held3D = {
  kind: HeldKind;
  n: number;
  at: V3;
  ang: number;
  h: number;
  hand?: {
    at: V3;
    r: number;
  };
};
export type Stage = {
  places: Place[];
  fx: FxPlace[];
  held3d: Held3D[];
};
const tier = (d: number): [number, number, number] => d < 1.6 ? [2400, 4000, 4.0] : d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const tmp = new THREE.Vector3();
let SUN = new THREE.Vector3(0, 1, 0);
let MOOD: MoodPreset = MOODS.day;
/** call once per frame before stage(): the sun direction (toward the sun, world) and the shot's mood */

export const setCardLight = (sun: THREE.Vector3, mood: MoodPreset) => {
  SUN = sun.clone().normalize();
  MOOD = mood;
};
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1),
    sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};
type View = {
  kind: "front" | "back" | "side";
  mirror: boolean;
  facing: -1 | 0 | 1;
};
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number, sideOK = true): View => {
  const tx = cam.pos.x - x,
    tz = cam.pos.z - z,
    tl = Math.hypot(tx, tz) || 1,
    dl = Math.hypot(dx, dz) || 1;
  const c = (tx * dx + tz * dz) / (tl * dl);
  const rs = (dx * cam.right.x + dz * cam.right.z) / dl;
  if (c > 0.42 || !sideOK && c >= 0) return {
    kind: "front",
    mirror: false,
    facing: c > 0.85 ? 0 : rs > 0 ? 1 : -1
  };
  if (c < -0.42 || !sideOK) return {
    kind: "back",
    mirror: false,
    facing: 0
  };
  return {
    kind: "side",
    mirror: rs < 0,
    facing: 0
  };
};
/** reactions lead their word by this many frames (blinks + bounce use it) */

export const LEAD = 2;
const LID = [0.5, 1, 1, 0.5];
const lidAt = (f: number, i: number, swaps: number[] = []) => {
  for (const fs of swaps) {
    const k = f - (fs - LEAD) + 1;
    if (k >= 0 && k < 4) return LID[k];
  }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13));
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => typeof v === "number" ? q(v) : v);
/** a character: who, where, facing, how */

export type Act = {
  i: number;
  o: Outfit;
  okey: string;
  p: V3;
  face: [number, number];
  seed?: number;
  expr?: Expr;
  talk?: boolean;
  look?: number;
  pose?: Pose;
  k?: number;
  prop?: Prop;
  tip?: number;
  mode?: FrontOpts["mode"];
  phase?: number;
  headTilt?: number;
  tilt?: number;
  side?: Partial<SideOpts>;
  sideOK?: boolean;
  swaps?: number[];
  scale?: number;
  noBlob?: boolean;
  dx?: number;
  roll?: number;
  noBlink?: boolean;
  hideArm?: -1 | 1;
  yaw?: number;
  hat3d?: boolean;
  squash?: number;
  limbs?: FrontOpts["limbs"];
  fx?: FaceFx;
  blink?: number;
};
const MCTX = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  return c.getContext("2d")!;
})();
const ANCH = new Map<string, Anch>();
const measure = (key: string, draw: (p: Pen) => void) => {
  let r = ANCH.get(key);
  if (r) return r;
  REC.on = true;
  REC.a = {
    hands: []
  };
  MCTX.setTransform(1, 0, 0, 1, 0, 0);
  MCTX.save();
  try {
    draw(new Pen(MCTX));
  } finally {
    MCTX.restore();
    REC.on = false;
  }
  r = REC.a;
  ANCH.set(key, r);
  return r;
};
export const person = (cam: CamInfo, a: Act, f: number, out: Stage) => {
  const sc = a.scale ?? 1;
  const d = cam.pos.distanceTo(tmp.set(a.p[0], a.p[1] + 1.3 * sc, a.p[2])) / sc;
  const [w, h, k] = tier(d);
  const v = viewOf(cam, a.p[0], a.p[2], a.face[0], a.face[1], a.sideOK ?? true);
  const mirror = v.kind === "side" && v.mirror,
    light = light2D(cam, mirror);
  const blink = a.noBlink || a.expr && (eyesShut(a.expr) || a.expr === "oneEye") ? 0 : Math.max(a.blink ?? 0, lidAt(f, a.i, a.swaps));
  let key: string, draw: (p: Pen) => void;
  if (v.kind === "side") {
    const so: SideOpts = {
      mode: "stand",
      expr: a.expr ?? "neutral",
      talk: a.talk,
      blink,
      light,
      seed: a.seed ?? a.i % 7 + 1,
      ...a.side
    };
    if (a.hat3d) so.crown3d = true;
    key = `S|${a.okey}|${fkey(so)}`;
    draw = p => bodySide(p, a.o, so);
  } else {
    const fo: FrontOpts = {
      mode: a.mode ?? "stand",
      expr: a.expr ?? "neutral",
      talk: a.talk,
      look: a.look ?? 0,
      blink,
      light,
      seed: a.seed ?? a.i % 7 + 1,
      facing: v.facing,
      pose: a.pose,
      k: a.k,
      prop: a.prop ?? null,
      tip: a.tip ?? 0,
      phase: a.phase ?? 0,
      headTilt: a.headTilt ?? 0,
      tilt: a.tilt ?? 0,
      back: v.kind === "back",
      p3d: !!heldKind(a.prop ?? null),
      crown3d: !!a.hat3d,
      hideArm: a.hideArm,
      limbs: a.limbs,
      fx: a.fx
    };
    key = `F|${a.okey}|${fkey(fo)}`;
    draw = p => bodyFront(p, a.o, fo);
  }
  let sq = 0;
  for (const t of a.swaps ?? []) {
    const n = f - (t - LEAD);
    if (n >= 0 && n < 14) sq += Math.exp(-n / 3.2) * Math.sin(0.25 + n * 0.85);
  }
  if (a.squash) sq += a.squash / 0.05;
  const wd = wide(draw);
  const anch = v.kind !== "side" && heldKind(a.prop ?? null) || a.hat3d ? measure(key, wd) : undefined;
  out.places.push({
    key,
    draw: wd,
    x: a.p[0],
    y: a.p[1],
    z: a.p[2],
    scale: sc,
    mirror,
    roll: a.roll,
    yaw: a.yaw,
    size: [Math.round(w * 4 / 3), h, k],
    dx: a.dx,
    anch,
    tag: a.okey,
    sq: q(sq, 60)
  });
  if (!a.noBlob) blob(out, a.p[0], a.p[1], a.p[2], sc);
};
const toSrgb = (v: number) => {
  const c = clamp01(v);
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
};
const hexOf = (c: [number, number, number], k: number) => "#" + c.map(v => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
export const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1,
    ox = -SUN.x / hl,
    oz = -SUN.z / hl,
    rot = Math.atan2(-ox, -oz);
  const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
  const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc,
    h = len + 0.55 * sc,
    c = 0.3 * h;
  const tc = hexOf([0.5, 0.48, 0.62], k * 0.8);
  out.fx.push({
    key: `blob|shadow|${tc}`,
    cw: 128,
    ch: 256,
    draw: p => fxShadow(p, tc),
    x: x + ox * c,
    y: y + 0.012,
    z: z + oz * c,
    w: 0.72 * sc,
    h,
    flat: true,
    rot
  });
  const ch = hexOf(MOOD.contact, Math.min(1, k * 0.5)),
    cc = hexOf(MOOD.contact, Math.min(1.6, k * 1.35));
  out.fx.push({
    key: `blob|halo|${ch}`,
    cw: 128,
    ch: 128,
    draw: p => fxContact(p, ch),
    x,
    y: y + 0.014,
    z,
    w: 0.6 * sc,
    h: 0.3 * sc,
    flat: true,
    rot
  });
  out.fx.push({
    key: `blob|contact|${cc}`,
    cw: 128,
    ch: 128,
    draw: p => fxContact(p, cc),
    x,
    y: y + 0.016,
    z,
    w: 0.38 * sc,
    h: 0.16 * sc,
    flat: true,
    rot
  });
};
export const fx = (out: Stage, e: FxPlace) => out.fx.push(e);
/** a starburst for 9 frames from f0 */

export const burst = (out: Stage, f: number, f0: number, at: V3, size = 0.5, col = "#fff3b0", n = 8) => {
  if (f < f0 || f >= f0 + 9) return;
  const u = q((f - f0) / 9, 30);
  fx(out, {
    key: `burst${col}${n}${u}`,
    cw: 500,
    ch: 500,
    draw: p => fxBurst(p, u, col, n),
    x: at[0],
    y: at[1],
    z: at[2],
    w: size,
    h: size
  });
};
/** a drop falling from `a` to `b`, landing at frame fl (fall `n` frames), then a splash crown */

export const drop = (out: Stage, f: number, fl: number, a: V3, b: V3, col = "#8fe46a", size = 0.03, n = DROP_FALL) => {
  if (f >= fl - n && f < fl) {
    const u = (f - (fl - n)) / n,
      e = u * u;
    fx(out, {
      key: `drop${col}`,
      cw: 120,
      ch: 160,
      draw: p => fxDrop(p, col),
      x: lerp(a[0], b[0], e),
      y: lerp(a[1], b[1], e),
      z: lerp(a[2], b[2], e),
      w: size,
      h: size * 1.33 * (1 + 0.4 * u)
    });
  }
  if (f >= fl && f < fl + 10) {
    const u = q((f - fl) / 10, 20);
    fx(out, {
      key: `plip${col}${u}`,
      cw: 400,
      ch: 300,
      draw: p => fxPlip(p, u, col),
      x: b[0],
      y: b[1] + size * 1.3,
      z: b[2],
      w: size * 4.2,
      h: size * 3.2
    });
  }
};
export const sweat = (out: Stage, f: number, f0: number, at: V3, cam: CamInfo, n = 4) => {
  for (let k = 0; k < n; k++) {
    const t = (f - f0 - k * 5) / 14;
    if (t < 0 || t > 1) continue;
    const s = k % 2 ? 1 : -1,
      d = 0.12 + 0.35 * t;
    fx(out, {
      key: "sweat",
      cw: 100,
      ch: 140,
      draw: fxSweat,
      x: at[0] + cam.right.x * s * d,
      y: at[1] + 0.2 * t - 0.6 * t * t + 0.05,
      z: at[2] + cam.right.z * s * d,
      w: 0.05,
      h: 0.07,
      rot: -s * 0.6 * t
    });
  }
};
export const glow = (out: Stage, at: V3, size: number, col = "120,255,100", opacity = 1) => fx(out, {
  key: `glow${col}`,
  cw: 256,
  ch: 256,
  draw: p => fxGlow(p, col),
  x: at[0],
  y: at[1],
  z: at[2],
  w: size,
  h: size,
  add: true,
  opacity
});
export const dust = (out: Stage, f: number, f0: number, at: V3, n = 10, spread = 1.4) => {
  if (f < f0) return;
  const t = (f - f0) / 30;
  for (let i = 0; i < n; i++) {
    const life = clamp01(1 - t / (0.9 + 0.5 * hh(i, f0)));
    if (life <= 0) continue;
    const x = at[0] + (hh(i, 2) - 0.5) * 0.3,
      y = at[1] - 1.6 * t * t - 0.2 * t,
      z = at[2] + (hh(i, 3) - 0.5) * spread;
    fx(out, {
      key: `dust${i % 4}`,
      cw: 300,
      ch: 300,
      draw: p => fxFlour(p, i % 4),
      x,
      y,
      z,
      w: 0.12 + 0.2 * t,
      h: 0.12 + 0.2 * t,
      soft: true,
      opacity: 0.6 * life
    });
  }
};
/** a puff of smoke (appear / vanish) */

export const smokePop = (out: Stage, f: number, f0: number, at: V3) => {
  if (f < f0 || f > f0 + 14) return;
  const u = q((f - f0) / 14, 28);
  fx(out, {
    key: `puff${u}`,
    cw: 300,
    ch: 300,
    draw: p => fxPuff(p, u),
    x: at[0],
    y: at[1],
    z: at[2] + 0.05,
    w: 1.3,
    h: 1.3,
    soft: true,
    opacity: 0.8
  });
};
/** one twinkle: a four-point star that pops in with an overshoot, turns a little and shrinks, n frames from f0, over a
 *  small bloom glow. For a gem, a coin, a clean blade, a bright idea, a smug grin */

export const sparkle = (out: Stage, f: number, f0: number, at: V3, size = 0.12, col = "#ffcf4a", n = 12) => {
  if (f < f0 || f >= f0 + n) return;
  const u = q((f - f0) / n, 24);
  fx(out, {
    key: `spark${col}${u}`,
    cw: 256,
    ch: 256,
    draw: p => fxSparkle(p, u, col),
    x: at[0],
    y: at[1],
    z: at[2],
    w: size,
    h: size,
    rot: 0.6 * u
  });
  glow(out, at, size * 1.8, "255,236,180", 0.75 * (1 - u));
};
/** sparkles twinkling around a point from f0 to f1: a new one every `every` frames at a hashed spot within r metres
 *  (in the camera's plane), sizes varied. Keep r inside the shiny object's silhouette, or just past its edge */

export const sparkles = (out: Stage, f: number, f0: number, f1: number, at: V3, cam: CamInfo, r = 0.25, every = 5, size = 0.1, col = "#ffcf4a", seed = 0) => {
  if (f < f0 || f >= f1 + 12) return;
  for (let k = Math.max(0, Math.floor((f - f0 - 12) / every)); f0 + k * every <= Math.min(f, f1); k++) {
    const a = 6.2832 * hh(k, seed + 11),
      d = r * Math.sqrt(hh(k, seed + 12)),
      cx = Math.cos(a) * d,
      cy = Math.sin(a) * d;
    const p: V3 = [at[0] + cam.right.x * cx + cam.up.x * cy, at[1] + cam.right.y * cx + cam.up.y * cy, at[2] + cam.right.z * cx + cam.up.z * cy];
    sparkle(out, f, f0 + k * every, p, size * (0.6 + 0.7 * hh(k, seed + 13)), col);
  }
};
/** a lens glint (crossed flares and a twinkle) for n frames from f0: light catching metal, glass, a gem or an eye.
 *  Additive, so it blooms */

export const glint = (out: Stage, f: number, f0: number, at: V3, size = 0.4, n = 10) => {
  if (f < f0 || f >= f0 + n) return;
  const u = q((f - f0) / n, 20);
  fx(out, {
    key: `glint${u}`,
    cw: 512,
    ch: 512,
    draw: p => fxGlint(p, u),
    x: at[0],
    y: at[1],
    z: at[2],
    w: size,
    h: size,
    add: true
  });
  sparkle(out, f, f0, at, size * 0.3, "#ffffff", n);
};
/** ONE thin horizontal lens streak with a small bright core (additive, in 2 f, out by n): the premium highlight for metal
 *  and glass; never a cross or star */

export const streak = (out: Stage, f: number, f0: number, at: V3, size = 0.6, n = 10) => {
  if (f < f0 || f >= f0 + n) return;
  const u = q((f - f0) / n, 20),
    a = Math.min(1, (f - f0 + 1) / 2) * (1 - u) ** 1.5;
  const key = `streak${q(a, 20)}`;
  fx(out, {
    key,
    cw: 512,
    ch: 128,
    draw: p => {
      const g = p.g,
        cy = 64,
        L = 250;
      g.save();
      g.globalAlpha = a;
      g.beginPath();
      g.moveTo(256 - L, cy);
      g.quadraticCurveTo(256, cy - 5, 256 + L, cy);
      g.quadraticCurveTo(256, cy + 5, 256 - L, cy);
      g.closePath();
      g.fillStyle = "rgba(255,244,220,0.9)";
      g.fill();
      const gr = g.createRadialGradient(256, cy, 0, 256, cy, 34);
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(0.45, "rgba(255,244,215,0.5)");
      gr.addColorStop(1, "rgba(255,240,200,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 512, 128);
      g.restore();
    },
    x: at[0],
    y: at[1],
    z: at[2],
    w: size,
    h: size / 4,
    add: true
  });
};
/** hard blinks on a named spot: `pulses` pulses of len frames, each full on its first frame, decaying (1-q)^2, the glow
 *  swelling 30 % */

export const markGlow = (out: Stage, f: number, f0: number, at: V3, size: number, col = "255,220,120", pulses = 2, len = 9) => {
  const k = Math.floor((f - f0) / len);
  if (f < f0 || k >= pulses) return;
  const qq = (f - f0) % len / len,
    a = q((1 - qq) ** 2, 20);
  fx(out, {
    key: `markglow|${col}|${a}`,
    cw: 256,
    ch: 256,
    draw: p => {
      const g = p.g,
        gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      gr.addColorStop(0, `rgba(${col},${a})`);
      gr.addColorStop(0.5, `rgba(${col},${a * 0.45})`);
      gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, 256, 256);
    },
    x: at[0],
    y: at[1],
    z: at[2],
    w: size * (1 + 0.3 * qq),
    h: size * (1 + 0.3 * qq),
    add: true
  });
};
/** a shine sliding along a surface from a to b over n frames (a sword blade, a polished floor, a new car), ending in
 *  a glint at b */

export const shineSweep = (out: Stage, f: number, f0: number, a: V3, b: V3, n = 10, size = 0.3) => {
  if (f < f0 || f >= f0 + n + 10) return;
  const u = smooth((f - f0) / n),
    p: V3 = [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  if (f < f0 + n) glow(out, p, size, "255,248,225", 0.9);
  glint(out, f, f0 + n - 2, b, size * 1.3);
};
/** an impact: shockwave ring with ink edge and speed rays, a star burst and a bloom flash, n frames from f0. `flat`
 *  lays the ring on the ground (landings, stomps); otherwise it faces the lens (hits, punches, collisions) */

export const impact = (out: Stage, f: number, f0: number, at: V3, size = 1, col = "#ffffff", flat = false, n = 12) => {
  if (f < f0 || f >= f0 + n) return;
  const u = q((f - f0) / n, 24);
  fx(out, {
    key: `shock${col}${u}`,
    cw: 600,
    ch: 600,
    draw: p => fxShock(p, u, col),
    x: at[0],
    y: at[1] + (flat ? 0.02 : 0),
    z: at[2],
    w: size,
    h: size,
    flat
  });
  burst(out, f, f0, at, size * 0.55);
  if (f < f0 + 3) glow(out, at, size * 1.2, "255,245,215", 1 - (f - f0) / 3);
};
/** talking: open = a syllable is open (pass it as Act.talk; the face swaps to its open mouth), (syllable beats from word onsets), plus a bob / tilt for the head */

export const talk = (f: number, starts: number[], end: number) => {
  if (f < starts[0] - 1 || f > end) return {
    open: false,
    bob: 0
  };
  let s0 = starts[0];
  for (const t of starts) if (f >= t - 1) s0 = t - 1;
  const k = f - s0,
    open = k % 7 < 4;
  return {
    open,
    bob: Math.sin((f - starts[0]) / 7 * Math.PI)
  };
};
/** a character facing the lens */

export const TO_CAM: [number, number] = [0, 1];
/** walk cycle phase for a planted 0.8 m stride, from the distance walked (m) */
/** A character that travels sideways must FACE its travel direction (so viewOf draws the side view) and use
 *  walkPhase(dist, sideCycleM(o) * scale), which plants the stance foot in the world (no slide); a front view is only
 *  for walking toward or away from the lens. Default cycleM 0.8 = the old front-view stride. */

export const walkPhase = (dist: number, cycleM = 0.8) => q((dist / cycleM % 1 + 1) % 1, 480);
/** largest per-frame foot drift in metres over f0..f1: |d dist - d phase * cycleM| with phase unwrapped. < 0.01 = pass */

export const slideCheck = (dist: (f: number) => number, phase: (f: number) => number, cycleM: number, f0: number, f1: number): number => {
  let worst = 0,
    prev = phase(f0),
    un = 0;
  for (let f = f0 + 1; f <= f1; f++) {
    let d = phase(f) - prev % 1;
    if (d < -0.5) d += 1;else if (d > 0.5) d -= 1;
    prev = phase(f);
    un = d;
    worst = Math.max(worst, Math.abs(dist(f) - dist(f - 1) - un * cycleM));
  }
  return worst;
};
/** syllable onsets for talk(): word start frames of a quoted line + extra beats inside long words (every ~7 f) */

export const syllables = (starts: number[], ends: number[], every = 7) => {
  const out: number[] = [];
  starts.forEach((s, i) => {
    const e = ends[i] ?? s + every;
    for (let t = s; t < e - 2; t += every) out.push(t);
  });
  return out;
};
