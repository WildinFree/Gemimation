import { faceOf, talkMouth, eyeKind, lidOf, type Expr, type EyeK, type MouthK, type MouthP, type FaceFx } from "./expressions";
export { EXPRS, type Expr } from "./expressions";
import { limbStyle, LIMB_INK, rig, posed, shiftBody, gait as limbGait, drawLegs, drawArm, drawHand, drawArms, type Pose as LimbPose, type Rig as LimbRig, type Gait, type GaitOut } from "./limbs";
import { type Dna, type HairStyle, type Nose, headParams, bodyParams, pushK, postureOf, LOOK, toneOutfit } from "./dna";
import { hairBehind, hairOver, type HairCtx, type HairView } from "./hair";
export const INK = "#241726";
export const SKIN = "#ffe2c2";
const WHITE = "#ffffff";
const MOUTH = "#5a1e28";
const TONGUE = "#e86e78";
const SWEAT = "#9fd4ff";
const LIMB = LIMB_INK;
type C3 = [number, number, number];
const SH_SKIN: C3 = [0.96, 0.86, 0.84];
const SH_CLOTH: C3 = [0.64, 0.66, 0.74];
const SH_FELT: C3 = [0.62, 0.62, 0.7];
export type Build = "adult" | "stout" | "kid" | "slim" | "thin" | "round";
export type Outfit = {
  jacket: string;
  pants: string;
  boots: string;
  hat?: string | null;
  belt?: string | null;
  buttons?: string;
  rifle?: boolean;
  sash?: string;
  sword?: boolean;
  moustache?: string;
  walrus?: boolean;
  skin?: string;
  head?: number;
  cap?: string;
  hair?: string;
  dress?: string;
  build?: Build;
  apron?: string;
  flour?: boolean;
  chain?: boolean;
  necklace?: boolean;
  beard?: string;
  crest?: string;
  cape?: string;
  spear?: boolean;
  shield?: string;
  trim?: string;
  earring?: boolean;
  robe?: "jama" | "angarkha" | "kurta";
  robeLen?: number;
  patka?: string;
  brocade?: string;
  katar?: boolean;
  pearls?: boolean;
  jutti?: boolean;
  tilak?: boolean;
  nosering?: boolean;
  bangles?: boolean;
  lashes?: boolean;
  curl?: boolean;
  pencil?: boolean;
  round?: boolean;
  quilt?: boolean;
  plume?: boolean;
  gem?: string;
  lower?: "churidar" | "dhoti" | "pyjama";
  hgt?: number;
  stubble?: boolean;
  wide?: number;
  dna?: Dna;
};
type P2 = [number, number];
const rad = (d: number) => d * Math.PI / 180;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const mul = (c: string, m: C3) => {
  const n = parseInt(c.slice(1), 16);
  const ch = (v: number, k: number) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
  return `#${ch(n >> 16 & 255, m[0])}${ch(n >> 8 & 255, m[1])}${ch(n & 255, m[2])}`;
};
export const shade = (c: string, k: number) => mul(c, [k, k, k]);
export const mix = (a: string, b: string, t: number) => {
  const A = parseInt(a.slice(1), 16),
    B = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round((A >> s & 255) * (1 - t) + (B >> s & 255) * t).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};
const rnd = (seed: number, k: number) => {
  const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const rotPts = (pts: P2[], a: number, cx: number, cy: number): P2[] => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
const rotAbout = (q: P2, a: number, c: P2): P2 => rotPts([q], a, c[0], c[1])[0];
const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const curve = (a: P2, k: P2, b: P2, n = 10): P2[] => {
  const c: P2 = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2],
    out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      s = 1 - t;
    out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]);
  }
  return out;
};
/** skin ramp: indices 0-3 unchanged (stored characters keep their tone); 4-6 = deeper tones (character lab P4) */

export const SKINS = [SKIN, "#f5c9a0", "#ecd0b6", "#c99067", "#a8714a", "#8a5634", "#6a3e24"];
export class Pen {
  g: CanvasRenderingContext2D;
  ol = 12;
  rot: number[] | null = null;
  constructor(g: CanvasRenderingContext2D) {
    this.g = g;
  }
  P(x: number, y: number): P2 {
    if (!this.rot) return [x, y];
    const r = this.rot,
      a = r[0],
      cx = r[1],
      cy = r[2],
      dx = r.length > 3 ? r[3] : 0,
      dy = r.length > 4 ? r[4] : 0,
      c = Math.cos(a),
      s = Math.sin(a);
    return [cx + (x - cx) * c - (y - cy) * s + dx, cy + (x - cx) * s + (y - cy) * c + dy];
  }
  path(pts: P2[], close: boolean) {
    const g = this.g;
    g.beginPath();
    pts.forEach((p, i) => {
      const [x, y] = this.P(p[0], p[1]);
      if (i) g.lineTo(x, y);else g.moveTo(x, y);
    });
    if (close) g.closePath();
  }
  poly(pts: P2[], fill: string | null, ol?: number) {
    const g = this.g,
      w = ol ?? this.ol;
    this.path(pts, true);
    if (fill) {
      g.fillStyle = fill;
      g.fill();
    }
    if (w) {
      g.lineWidth = w;
      g.strokeStyle = INK;
      g.lineJoin = "round";
      g.stroke();
    }
  }
  ell(cx: number, cy: number, rx: number, ry: number, fill: string | null, ol?: number, a0 = 0, a1 = 360, rot = 0) {
    this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
  }
  line(pts: P2[], fill: string, w: number, ink = true) {
    const g = this.g;
    g.lineCap = "round";
    g.lineJoin = "round";
    if (ink) {
      this.path(pts, false);
      g.strokeStyle = INK;
      g.lineWidth = w + 2 * this.ol * 0.9;
      g.stroke();
    }
    this.path(pts, false);
    g.strokeStyle = fill;
    g.lineWidth = w;
    g.stroke();
  }
  stroke(pts: P2[], w: number, fill = INK) {
    const g = this.g;
    g.lineCap = "round";
    g.lineJoin = "round";
    this.path(pts, false);
    g.strokeStyle = fill;
    g.lineWidth = w;
    g.stroke();
  }
  arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, w: number, fill = INK) {
    const pts: P2[] = [];
    for (let i = 0; i <= 24; i++) pts.push([cx + rx * Math.cos(rad(a0 + (a1 - a0) * i / 24)), cy + ry * Math.sin(rad(a0 + (a1 - a0) * i / 24))]);
    this.stroke(pts, w, fill);
  }
  dot(cx: number, cy: number, r: number, fill = INK) {
    const [x, y] = this.P(cx, cy);
    this.g.beginPath();
    this.g.arc(x, y, r, 0, Math.PI * 2);
    this.g.fillStyle = fill;
    this.g.fill();
  }
  clip(pts: P2[], fn: () => void) {
    const g = this.g;
    g.save();
    this.path(pts, true);
    g.clip();
    fn();
    g.restore();
  }
  shadedFill(pts: P2[], base: string, shadow: string, light: number, R: number, shift = 0.45, r0 = 1.05, r1 = 1.25) {
    const g = this.g,
      n = pts.length;
    let cx = 0,
      cy = 0;
    for (const [x, y] of pts) {
      cx += x / n;
      cy += y / n;
    }
    const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
    gr.addColorStop(0, base);
    gr.addColorStop(r0 / r1, base);
    gr.addColorStop(1, LOOK.shade === 1 ? shadow : mix(base, shadow, LOOK.shade));
    this.path(pts, true);
    g.fillStyle = gr;
    g.fill();
  }
  gradFill(pts: P2[], base: string, shadow: string, light: number, flat = 0.22) {
    const g = this.g,
      dx = Math.cos(light),
      dy = Math.sin(light),
      n = pts.length;
    let cx = 0,
      cy = 0,
      lo = Infinity,
      hi = -Infinity;
    for (const [x, y] of pts) {
      cx += x / n;
      cy += y / n;
      const d = x * dx + y * dy;
      lo = Math.min(lo, d);
      hi = Math.max(hi, d);
    }
    const dc = cx * dx + cy * dy;
    const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)),
      [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
    const gr = g.createLinearGradient(ax, ay, bx, by);
    gr.addColorStop(0, base);
    gr.addColorStop(flat, base);
    gr.addColorStop(1, LOOK.shade === 1 ? shadow : mix(base, shadow, LOOK.shade));
    this.path(pts, true);
    g.fillStyle = gr;
    g.fill();
  }
  inkRing(pts: P2[], w0: number, thick: number, k = 0.45, col = INK) {
    const n = pts.length;
    let cx = 0,
      cy = 0;
    for (const [x, y] of pts) {
      cx += x / n;
      cy += y / n;
    }
    const out: P2[] = [],
      inn: P2[] = [];
    pts.forEach((q, i) => {
      const a = pts[(i + n - 1) % n],
        b = pts[(i + 1) % n];
      let nx = b[1] - a[1],
        ny = a[0] - b[0];
      const l = Math.hypot(nx, ny) || 1;
      nx /= l;
      ny /= l;
      const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
      out.push([q[0] + nx * h, q[1] + ny * h]);
      inn.push([q[0] - nx * h, q[1] - ny * h]);
    });
    const g = this.g;
    const trace = (r: P2[]) => {
      r.forEach(([x0, y0], i) => {
        const [x, y] = this.P(x0, y0);
        if (i) g.lineTo(x, y);else g.moveTo(x, y);
      });
      g.closePath();
    };
    g.beginPath();
    trace(out);
    trace(inn.reverse());
    g.fillStyle = col;
    g.fill("evenodd");
  }
  band(pts: P2[], fill: string, w: number, rim: number, cap: CanvasLineCap = "butt") {
    const g = this.g;
    g.lineCap = cap;
    g.lineJoin = "round";
    this.path(pts, false);
    g.strokeStyle = INK;
    g.lineWidth = w + 2 * rim;
    g.stroke();
    this.path(pts, false);
    g.strokeStyle = fill;
    g.lineWidth = w;
    g.stroke();
    g.lineCap = "round";
  }
}
const ellPts = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = 360, rot = 0, n = 48): P2[] => {
  const r = rad(rot),
    pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + (a1 - a0) * i / n),
      x = rx * Math.cos(a),
      y = ry * Math.sin(a);
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return pts;
};
const rrect = (x0: number, y0: number, x1: number, y1: number, r: number, n = 8): P2[] => {
  const pts: P2[] = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]]) for (let i = 0; i <= n; i++) pts.push([cx + r * Math.cos(rad(a + 90 * i / n)), cy + r * Math.sin(rad(a + 90 * i / n))]);
  return pts;
};
const taper = (p: Pen, a: P2, b: P2, wa: number, wb: number, col = INK) => {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    l = Math.hypot(dx, dy) || 1,
    nx = -dy / l,
    ny = dx / l;
  p.poly([[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2], [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]], col, 0);
  p.dot(a[0], a[1], wa / 2, col);
  p.dot(b[0], b[1], wb / 2, col);
};
export type Blob = {
  a: number;
  b: number;
  nTop: number;
  nBot: number;
  egg: number;
  asym: number;
  rot: number;
  noise: number;
  seed: number;
};
/** superellipse "bean": separate crown / jaw exponents, egg taper (neg = narrower chin), one-side bulge, soft noise.
 *  Points run right -> down -> left -> up (clockwise on screen). */

export const blobPts = (cx: number, cy: number, B: Blob, n = 72): P2[] => {
  const ph = [rnd(B.seed, 11), rnd(B.seed, 12), rnd(B.seed, 13)].map(v => v * Math.PI * 2);
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2,
      c = Math.cos(t),
      s = Math.sin(t),
      e = 2 / (s < 0 ? B.nTop : B.nBot);
    let X = Math.sign(c) * Math.abs(c) ** e;
    const Y = Math.sign(s) * Math.abs(s) ** e;
    X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
    const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
    const x = B.a * X * r,
      y = B.b * Y * r;
    pts.push([cx + x * Math.cos(B.rot) - y * Math.sin(B.rot), cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)]);
  }
  return pts;
};
/** measured head: H/W 0.94, slightly pointed crown (1.75), fuller jaw (2.3), chin taper -0.12, 8 % bulge to the facing side */

export const headBlob = (seed: number, a = 118, facing = 0): Blob => ({
  a,
  b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
  nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5),
  nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
  egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
  asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
  rot: rad(8 * (rnd(seed, 7) - 0.5)),
  noise: 0.008,
  seed
});
/** thickest outline direction: away from the light, pulled toward the ground (64 deg measured for upper-left light) */

export const thickAngle = (light: number) => Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
const DEF_LIGHT = rad(-120);
const eye = (p: Pen, kind: EyeK, x: number, ey: number, u: number, side: number, look: number, skin: string) => {
  const lx = x + look * 3 * u,
    lw = 3.8 * u;
  switch (kind) {
    case "dot":
      p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0);
      break;
    case "small":
      p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0);
      break;
    case "lid":
      p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180);
      p.stroke([[x - 9 * u, ey - u], [x + 9 * u, ey - u]], lw);
      break;
    case "slit":
      p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180);
      p.stroke([[x - 9 * u, ey], [x + 9 * u, ey]], lw);
      break;
    case "happy":
      p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw);
      break;
    case "dash":
      p.stroke([[x - 8.5 * u, ey], [x + 8.5 * u, ey]], lw);
      break;
    case "closed":
      p.arc(x, ey - 3 * u, 8.5 * u, 6 * u, 20, 160, lw);
      p.stroke([[x - 7 * u, ey + 3 * u], [x - 9.5 * u, ey + 6 * u]], 1.8 * u);
      p.stroke([[x + 7 * u, ey + 3 * u], [x + 9.5 * u, ey + 6 * u]], 1.8 * u);
      break;
    case "sleepy":
      p.ell(lx, ey + u, 6 * u, 3.4 * u, INK, 0, 0, 180);
      p.stroke([[x - 9 * u, ey + u], [x + 9 * u, ey + u]], lw * 1.1);
      p.arc(x, ey + 3 * u, 9.5 * u, 5.5 * u, 20, 160, 2.8 * u, "#8a5f7a");
      break;
    case "teary":
      p.ell(x, ey + 3 * u, 9.5 * u, 6 * u, "#bfe3ff", 2 * u);
      p.ell(lx, ey, 3.6 * u, 5 * u, INK, 0);
      p.ell(x + 5 * u * side, ey + 15 * u, 2.8 * u, 4.2 * u, "#9fd4ff", 1.6 * u);
      break;
    case "up":
      p.ell(x, ey, 8.5 * u, 9.5 * u, WHITE, 2.4 * u);
      p.ell(lx, ey - 4.6 * u, 3.4 * u, 4.2 * u, INK, 0);
      break;
    case "side":
      p.ell(x, ey - 0.5 * u, 7.5 * u, 4.4 * u, WHITE, 2.2 * u);
      p.ell(x + 4 * u * Math.sign(look || 1), ey - 0.5 * u, 2.8 * u, 3.4 * u, INK, 0);
      p.stroke([[x - 9 * u, ey - 4.6 * u], [x + 9 * u, ey - 4.6 * u]], lw * 0.8);
      break;
    case "squeeze":
      p.stroke([[x + 6 * u * side, ey - 5 * u], [x - 6 * u * side, ey], [x + 6 * u * side, ey + 5 * u]], lw);
      break;
    case "wide":
    case "wideLid":
      {
        const rx = 8.2 * u,
          ry = 9.6 * u,
          cut = ey - 1.2 * u;
        p.ell(x, ey, rx, ry, WHITE, 0);
        p.dot(x + look * 3 * u, ey + 1.4 * u, 3.7 * u);
        if (kind === "wideLid") p.clip(ellPts(x, ey, rx, ry), () => p.poly([[x - rx - 3 * u, ey - ry - 3 * u], [x + rx + 3 * u, ey - ry - 3 * u], [x + rx + 3 * u, cut], [x - rx - 3 * u, cut]], skin, 0));
        p.ell(x, ey, rx, ry, null, 2.4 * u);
        if (kind === "wideLid") p.stroke([[x - rx - 0.5 * u, cut], [x + rx + 0.5 * u, cut]], lw * 0.95);
        break;
      }
    case "bead":
      p.ell(lx, ey, 2.7 * u, 3.3 * u, INK, 0);
      break;
    case "beadLid":
      p.ell(lx, ey + 0.6 * u, 4.4 * u, 3.4 * u, INK, 0, 0, 180);
      p.stroke([[x - 6.5 * u, ey + 0.6 * u], [x + 6.5 * u, ey + 0.6 * u]], 3 * u);
      break;
    case "shock":
    case "shockHalf":
      p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u);
      p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u);
      if (kind === "shockHalf") {
        p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360);
        p.stroke([[x - 11 * u, ey], [x + 11 * u, ey]], 2.6 * u);
      }
      break;
    default:
      {
        const s: P2[] = [];
        for (let t = 1; t < 15; t++) s.push([x + Math.cos(t * 0.9) * t * 0.55 * u, ey + Math.sin(t * 0.9) * t * 0.55 * u]);
        p.stroke(s, 2.4 * u);
      }
  }
};
const dmouth = (p: Pen, mx: number, y: number, rx: number, ry: number, u: number, tongue = false) => {
  p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
  p.clip([[mx - rx, y], [mx + rx, y], [mx + rx, y + 3 * u], [mx - rx, y + 3 * u]], () => p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
  if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
  p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
};
const mouth = (p: Pen, kind: MouthK, mx: number, my: number, u: number, k = 1) => {
  const mw = 4 * u;
  switch (kind) {
    case "dash":
      p.stroke([[mx - 5.5 * u * k, my], [mx + 5.5 * u * k, my - 0.8 * u]], mw);
      break;
    case "frown":
      p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw);
      break;
    case "smirk":
      p.arc(mx + u, my - 3 * u, 7 * u * k, 4 * u, 10, 150, mw);
      break;
    case "smile":
      p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw);
      break;
    case "smileWide":
      p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw);
      break;
    case "grin":
      dmouth(p, mx, my - u, 12 * u * k, 8 * u, u);
      break;
    case "laugh":
      dmouth(p, mx, my, 16 * u * k, 11 * u, u, true);
      break;
    case "o":
      p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u);
      break;
    case "O":
      p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u);
      break;
    case "wave":
      {
        const s: P2[] = [];
        for (let i = 0; i <= 12; i++) s.push([mx - 9 * u * k + i * 1.5 * u * k, my + 1.5 * u * Math.sin(i * 1.3)]);
        p.stroke(s, 3 * u);
        break;
      }
    case "teeth":
      p.poly([[mx - 12 * u * k, my - 4 * u], [mx + 12 * u * k, my - 4 * u], [mx + 11 * u * k, my + 4 * u], [mx - 11 * u * k, my + 4 * u]], WHITE, 3 * u);
      for (const j of [-1, 0, 1]) p.stroke([[mx + j * 6 * u * k, my - 4 * u], [mx + j * 6 * u * k, my + 4 * u]], 1.5 * u);
      break;
    case "lick":
      p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw);
      p.ell(mx + 6 * u * k, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u);
      break;
    case "smirkSide":
      p.stroke(curve([mx - 7 * u * k, my + 1.5 * u], [mx + u, my + 2.5 * u], [mx + 9 * u * k, my - 4 * u]), mw);
      p.stroke([[mx + 9.5 * u * k, my - 3 * u], [mx + 12 * u * k, my - 6 * u]], 2.2 * u);
      break;
    case "puff":
      p.stroke([[mx - 4 * u * k, my], [mx - 1.5 * u * k, my + 1.4 * u], [mx + u * k, my - 0.6 * u], [mx + 4 * u * k, my + 0.8 * u]], 2.8 * u);
      break;
    case "talkPuff":
      p.ell(mx, my + u, 4.5 * u * k, 3.6 * u, MOUTH, 2.4 * u);
      break;
    case "talk":
      dmouth(p, mx, my - 0.5 * u, 9 * u * k, 6.5 * u, u, true);
      break;
    case "talkFrown":
      p.ell(mx, my + 2 * u, 7 * u * k, 6 * u, MOUTH, 2.6 * u);
      p.clip(ellPts(mx, my + 2 * u, 7 * u * k, 6 * u), () => p.ell(mx, my + 7 * u, 5 * u * k, 3 * u, TONGUE, 0));
      break;
    case "mutter":
      p.ell(mx, my + u, 5 * u * k, 3.4 * u, MOUTH, 2.4 * u);
      break;
    case "cry":
      {
        const s: P2[] = [];
        for (let i = 0; i <= 12; i++) s.push([mx - 8 * u * k + i * 1.33 * u * k, my + 3 * u - 3.5 * u * Math.sin(i / 12 * Math.PI) + 0.9 * u * Math.sin(i * 2.2)]);
        p.stroke(s, 3.2 * u);
        break;
      }
  }
};
const mouthP = (p: Pen, m: MouthP, mx: number, my: number, u: number, t = 0) => {
  const rnd = clamp(m.round ?? 0, 0, 1),
    o = Math.max(0, m.open) * u,
    sk = m.skew ?? 0,
    k = clamp(m.curve, -1.4, 1.4);
  const hw = (m.w + (Math.max(m.open * 0.55, 3) - m.w) * rnd) * u;
  if (m.open < 1.4) {
    const pts: P2[] = [];
    for (let i = 0; i <= 16; i++) {
      const x = -1 + i / 8,
        y = my - k * 4 * u * x * x + k * 1.5 * u * (1 - x * x) - sk * 3 * u * x + (m.wob ?? 0) * 1.6 * u * Math.sin(i * 1.3 + t * 0.9);
      pts.push([mx + x * hw, y]);
    }
    p.stroke(pts, 4 * u);
    return;
  }
  const tf = 0.4 - 0.3 * clamp(k, -1, 1),
    topH = o * tf,
    botH = o * (1 - tf),
    e = 1.5 - 0.5 * rnd,
    pts: P2[] = [];
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * Math.PI * 2,
      c = Math.cos(a),
      s = Math.sin(a);
    pts.push([mx + hw * Math.sign(c) * Math.abs(c) ** 0.8, my + (s < 0 ? -topH : botH) * Math.abs(s) ** (1 / e) - k * 4 * u * c * c - sk * 3 * u * c]);
  }
  p.poly(pts, MOUTH, 0);
  p.clip(pts, () => {
    if (m.teeth) p.poly([[mx - hw - 4 * u, my - o - 12 * u], [mx + hw + 4 * u, my - o - 12 * u], [mx + hw + 4 * u, my - topH + m.teeth * Math.min(4.2 * u, o * 0.38)], [mx - hw - 4 * u, my - topH + m.teeth * Math.min(4.2 * u, o * 0.38)]], WHITE, 0);
    if (m.tongue) p.ell(mx + 2 * u, my + botH * 0.8, hw * 0.5, botH * 0.5 * m.tongue + u, TONGUE, 0);
  });
  p.poly(pts, null, 3 * u);
};
const marksFx = (p: Pen, fx: FaceFx, cx: number, cy: number, Ha: number, Hb: number, u: number, facing: number, xs: number[], ey: number) => {
  const M = fx.marks!,
    t = fx.t ?? 0,
    fs = facing || 1,
    g = p.g;
  if (M.lines) for (let i = 0; i < 6; i++) {
    const a = rad((i < 3 ? -158 : -58) + i % 3 * 18),
      r0 = 1.26,
      L = (10 + 4 * (i % 2)) * u * M.lines;
    const x0 = cx + Math.cos(a) * Ha * r0,
      y0 = cy + Math.sin(a) * Hb * r0;
    p.stroke([[x0, y0], [x0 + Math.cos(a) * L, y0 + Math.sin(a) * L]], 3.2 * u);
  }
  if (M.vein) {
    const r = 6.5 * u * M.vein * (1 + 0.12 * Math.sin(t * 1.3)),
      x = cx + fs * 0.5 * Ha,
      y = cy - 0.58 * Hb;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const ang = Math.atan2(-sy, -sx) * 180 / Math.PI;
      p.arc(x + sx * r, y + sy * r, r * 0.85, r * 0.85, ang - 42, ang + 42, 5.4 * u);
      p.arc(x + sx * r, y + sy * r, r * 0.85, r * 0.85, ang - 40, ang + 40, 3 * u, "#e23a46");
    }
  }
  if (M.steam) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const ph = ((t / 14 + i / 3 + (s > 0 ? 0.17 : 0)) % 1 + 1) % 1,
      r = (3 + 5.5 * ph) * u * M.steam;
    const x = cx + s * (1.02 * Ha + (8 + 24 * ph) * u),
      y = cy - 0.05 * Hb - (4 + 22 * ph) * u,
      C = [[-0.6, 0.1], [0.6, 0.1], [0, -0.45]];
    g.save();
    g.globalAlpha = Math.min(1, (1 - ph) * 1.8) * Math.min(1, M.steam);
    for (const [a, b] of C) p.ell(x + a * r, y + b * r, r + 1.8 * u, r + 1.8 * u, INK, 0);
    for (const [a, b] of C) p.ell(x + a * r, y + b * r, r, r, "#ffffff", 0);
    g.restore();
  }
  if (M.tears) for (let j = 0; j < xs.length; j++) {
    const x = xs[j],
      s = j ? 1 : -1,
      pts: P2[] = [];
    for (let i = 0; i <= 8; i++) pts.push([x + s * 2 * u + Math.sin(i * 0.9 + t * 0.7) * 1.6 * u, ey + 8 * u + i * 4.2 * u * M.tears]);
    p.stroke(pts, 7 * u * M.tears + 2.4 * u);
    p.stroke(pts, 7 * u * M.tears, "#8fd0ff");
  }
  if (M.sweat) {
    const ph = (t / 22 % 1 + 1) % 1,
      x = cx + fs * 0.9 * Ha,
      y = cy - 0.45 * Hb + ph * 14 * u,
      r = 3.2 * u * M.sweat;
    p.ell(x, y, r, r * 1.6, SWEAT, 2 * u);
    p.ell(cx - fs * 1.1 * Ha, cy - 0.5 * Hb - 4 * u * Math.sin(ph * Math.PI), r * 0.8, r * 1.2, SWEAT, 1.8 * u);
  }
  if (M.sparkle) for (const [dx, dy, k] of [[1.05, -0.85, 1], [1.3, -0.35, 0.6]]) {
    const x = cx + fs * dx * Ha,
      y = cy + dy * Hb,
      r = 7 * u * k * M.sparkle * (0.75 + 0.25 * Math.sin(t * 0.8 + k * 3));
    p.poly([[x, y - r], [x + r * 0.25, y - r * 0.25], [x + r, y], [x + r * 0.25, y + r * 0.25], [x, y + r], [x - r * 0.25, y + r * 0.25], [x - r, y], [x - r * 0.25, y - r * 0.25]], "#fff3b0", 2 * u);
  }
};
const mous = (p: Pen, o: Outfit, x0: number, y0: number, s: number, u: number, col: string, stout: boolean, side: boolean, open = false) => {
  if (o?.walrus) {
    const L = side ? 0.78 : 1,
      yy = y0 + 1.5 * u - (open ? 3.2 * u : 0),
      X = (d: number) => x0 + s * d * u * L;
    const pts: P2[] = [[X(-1.5), yy - 5 * u], [X(8), yy - 7.5 * u], [X(19), yy - 4.5 * u], [X(26.5), yy + 3 * u], [X(28), yy + 12 * u], [X(25), yy + 19 * u], [X(21), yy + 12 * u], [X(14), yy + 7.5 * u], [X(6), yy + 6.5 * u], [X(-1.5), yy + 4.5 * u]];
    p.poly(pts, col, 2.2 * u);
    p.stroke([[X(7), yy - 1 * u], [X(16), yy + 2.5 * u], [X(22), yy + 10 * u]], 1.3 * u, mix(col, INK, 0.55));
    return;
  }
  const sx = side ? -1 : 1;
  if (o?.curl) {
    const L = side ? 0.8 : 1;
    const A: P2 = [x0 + s * 1.5 * u, y0],
      B: P2 = [x0 + s * 11 * u * L, y0 + 3.2 * u],
      C: P2 = [x0 + s * 19 * u * L, y0 + 0.5 * u],
      D: P2 = [x0 + s * 22.5 * u * L, y0 - 6 * u],
      E: P2 = [x0 + s * 20 * u * L, y0 - 9.5 * u];
    taper(p, A, B, 4.6 * u, 3.6 * u, col);
    taper(p, B, C, 3.6 * u, 2.5 * u, col);
    taper(p, C, D, 2.5 * u, 1.9 * u, col);
    taper(p, D, E, 1.9 * u, 1.4 * u, col);
    void sx;
  } else if (o?.pencil) {
    taper(p, [x0 + s * 1.5 * u, y0 - 0.6 * u], [x0 + s * 13 * u * (side ? 0.8 : 1), y0 + 1.2 * u], 4.8 * u, 3.4 * u, col);
    taper(p, [x0 + s * 13 * u * (side ? 0.8 : 1), y0 + 1.2 * u], [x0 + s * 23 * u * (side ? 0.8 : 1), y0 + 4.6 * u], 3.4 * u, 1.6 * u, col);
  } else taper(p, [x0 + s * 1.5 * u, y0], [x0 + s * (stout ? 19 : 15) * u * (side ? 0.9 : 1), y0 + (stout ? -2 : 2.5) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, col);
};
const extrasFront = (p: Pen, o: Outfit, cx: number, cy: number, u: number, facing: number, skin: string, expr: Expr, ckO?: number) => {
  const fx = cx + 7 * u * facing,
    mx = cx + 8 * u * facing;
  if (o.tilak) {
    p.dot(fx, cy - 24.5 * u, 3.6 * u, INK);
    p.dot(fx, cy - 24.5 * u, 2.6 * u, "#d8323a");
  }
  if (o.nosering) {
    p.ell(mx + 4.5 * u, cy + 10.5 * u, 3.6 * u, 3.6 * u, null, 2.6 * u);
    p.ell(mx + 4.5 * u, cy + 10.5 * u, 3.6 * u, 3.6 * u, null, 1.2 * u);
    p.arc(mx + 4.5 * u, cy + 10.5 * u, 3.6 * u, 3.6 * u, 0, 360, 1.4 * u, "#f0c24a");
  }
  if (o.earring) for (const s of [-1, 1]) {
    const ex = cx + s * 49 * u,
      ey = cy + 17 * u;
    p.ell(ex, ey, 3 * u, 3 * u, null, 1.8 * u);
    p.dot(ex, ey + 6 * u, 3.4 * u, INK);
    p.dot(ex, ey + 6 * u, 2.4 * u, "#f0c24a");
  }
  if (o.stubble) for (let i = 0; i < 16; i++) {
    const a = rnd(11, i) * 2 - 1,
      r = rnd(12, i);
    p.dot(cx + 8 * u * facing + a * 30 * u, cy + (27 + 10 * r) * u - Math.abs(a) * 7 * u, 0.95 * u, mix(INK, skin, 0.35));
  }
  const ck = ckO ?? faceOf(expr).cheeks;
  if (ck) for (const s of [-1, 1]) {
    const x = mx + s * (ck > 1.2 ? 25 : 21) * u,
      y = cy + 17 * u,
      k = ck;
    p.ell(x, y, 10 * k * u, 9 * k * u, mul(skin, [0.99, 0.93, 0.9]), 0);
    p.arc(x, y, 10 * k * u, 9 * k * u, s > 0 ? -60 : 120, s > 0 ? 100 : 280, 2.4 * u);
  }
};
const lashesFront = (p: Pen, x: number, ey: number, side: number, u: number) => {
  for (const [dy, l] of [[-2, 5], [1.5, 4]] as const) p.stroke([[x + side * 8 * u, ey + dy * u - 1 * u], [x + side * (8 + l) * u, ey + (dy - 4) * u - 1 * u]], 2 * u);
};
let BROW_FLOOR: number | null = null;
const bFl = (by: number, u: number, dI: number, dO: number, shock: boolean, eK: number) => BROW_FLOOR == null ? by : Math.max(by, BROW_FLOOR + 5 * u + Math.max(0, -Math.min(dI, dO)) * u + (shock ? 9 * u * eK : 0));
const faceFront = (p: Pen, o: Outfit, cx: number, cy: number, W: number, expr: Expr, facing: number, look: number, lid: number, brim: boolean, skin: string, talk = false, H?: Blob, rf?: FaceFx) => {
  const u = W / 100,
    F0 = faceOf(expr),
    F = rf ? {
      ...F0,
      eye: rf.eye ?? F0.eye,
      brow: rf.brow ?? F0.brow,
      brow2: rf.brow2 ?? (rf.brow ? undefined : F0.brow2)
    } : F0,
    D = o.dna,
    fx = cx + (D ? 11 : 7) * u * facing,
    stout = o.build === "stout";
  const hv = D && H ? clamp(H.b / H.a / 0.94, 0.8, 1.6) : 1,
    eK0 = pushK(D, D?.eyeK) * (D ? LOOK.eye : 1),
    gK = pushK(D, D?.eyeGap) * (D ? Math.sqrt(LOOK.eye) : 1),
    bK = pushK(D, D?.browK),
    eK = eK0 * (rf?.eyeK ?? 1);
  const shockE = F.eye[0] === "shock";
  const ex = Math.max((shockE ? 12 : 13) * u * gK, shockE ? 11.5 * u * eK : 0),
    ey = cy - (hv - 1) * 10 * u,
    lk = look || F.look || 0;
  const xs: number[] = [];
  const rk = (k: EyeK): EyeK => rf && k === "lid" && D?.eye === "dot" ? "lid" : restEye(k, D);
  for (const side of [-1, 1]) {
    const x = fx + side * ex * (D && facing && side !== facing ? 0.8 : 1),
      front = facing ? side === facing : side > 0;
    const kind = eyeKind(rk(F.eye[front ? 1 : 0]), lid),
      ue = u * eK;
    xs.push(x);
    eye(p, kind, x, ey, ue, side, lk, skin);
    if (o.lashes && kind !== "shock" && kind !== "shockHalf") lashesFront(p, x, ey, side, ue);
  }
  if (D?.glasses) glassesFront(p, D, xs, ey, u, eK, cx, H, facing);
  for (const side of [-1, 1]) {
    const x = xs[side < 0 ? 0 : 1],
      front = facing ? side === facing : side > 0;
    const kind = eyeKind(rk(F.eye[front ? 1 : 0]), lid);
    const [dI, dO] = browClamp(front ? F.brow : F.brow2 ?? F.brow, !!rf);
    let by = ey - (brim ? 17 : 20) * u - (rf?.browUp ?? 0) * u - Math.max(0, eK - 1) * 9 * u - (kind === "wide" || kind === "wideLid" ? 3 * u * eK : 0);
    by = bFl(by, u, dI, dO, kind === "shock" || kind === "shockHalf", eK);
    if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u * eK, 9 * u * eK, 3 * u, 200, 340, 4 * u * bK);else browDraw(p, D?.brow, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], u, bK, browHalo(o, skin));
  }
  if (D?.brow === "uni") {
    const k0 = F.brow,
      by = bFl(ey - (brim ? 17 : 20) * u - Math.max(0, eK - 1) * 9 * u, u, k0[0], k0[0], false, eK);
    p.stroke([[xs[0] + 8 * u, by + k0[0] * u], [xs[1] - 8 * u, by + k0[0] * u]], 5.5 * u * bK);
  }
  const nose = LOOK.nose ? D?.nose ?? "none" : "none",
    bigNose = nose === "bulb" || nose === "long" || nose === "hook";
  const mx = cx + 8 * u * facing,
    my = cy + 20 * u * hv + (bigNose ? 4 * u : 0);
  if (nose !== "none") noseFront(p, nose, cx + 9 * u * facing, ey + (my - ey) * 0.5, u, facing, skin);
  if (D?.age || D?.freckles || D?.mole) marksFront(p, D, xs, ey, mx, my, u, facing, skin);
  if (D && LOOK.blush) for (const x of xs) p.ell(x + 2 * u * facing, ey + 13 * u * eK, 8.5 * u, 4.6 * u, `rgba(236,96,110,${LOOK.blush})`, 0);
  if (rf?.mouth) mouthP(p, rf.mouth, mx, my, u, rf.t);else mouth(p, talk ? talkMouth(F) : F.mouth, mx, my, u);
  if (o.moustache) for (const s of [-1, 1]) mous(p, o, mx, my - (o.curl ? 6.5 : 7.5) * u, s, u, o.moustache, stout, false, talk || ["laugh", "o", "O", "teeth", "grin", "cry"].includes(F.mouth));
  if (F.sweat && !rf) p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, SWEAT, 2 * u);
  extrasFront(p, o, cx, cy, u, facing, skin, expr, rf ? rf.cheeks ?? 0 : undefined);
  if (rf?.marks && H) marksFx(p, rf, cx, cy, H.a, H.b, u, facing, xs, ey);
};
const restEye = (k: EyeK, D?: Dna): EyeK => {
  switch (D?.eye) {
    case "wide":
      return k === "lid" || k === "dot" || k === "small" ? "wide" : k;
    case "bead":
      return k === "lid" || k === "dot" || k === "small" ? "bead" : k;
    case "sleepy":
      return k === "lid" ? "sleepy" : k;
    case "dot":
      return k === "lid" ? "dot" : k;
    default:
      return k;
  }
};
const wornDetail = (p: Pen, o: Outfit, tcx: number, chin: number, bot: number, HH: number, Ta: number, u: number, f: number, seed: number) => {
  const pc = mix(o.jacket, "#c9b48c", 0.5),
    st = mix(o.jacket, INK, 0.5);
  const patch = (x: number, y: number, w: number, h: number, r: number) => {
    const c = Math.cos(r),
      s = Math.sin(r),
      q: P2[] = [[-w, -h], [w, -h], [w, h], [-w, h]].map(([a, b]) => [x + a * c - b * s, y + a * s + b * c] as P2);
    p.poly(q, pc, 1.8 * u);
    for (let i = 0; i < 4; i++) {
      const [a, b] = q[i],
        [c2, d2] = q[(i + 1) % 4];
      for (let k = 1; k < 4; k++) {
        const tx = a + (c2 - a) * k / 4,
          ty = b + (d2 - b) * k / 4;
        p.stroke([[tx - 1.6 * u, ty - 1.6 * u], [tx + 1.6 * u, ty + 1.6 * u]], 1.1 * u, st);
      }
    }
  };
  const j = seed % 7 / 7;
  patch(tcx - 0.42 * Ta * (f || 1), chin + (0.5 + 0.1 * j) * HH, 0.2 * Ta, 0.14 * HH, -0.18);
  patch(tcx + 0.5 * Ta * (f || 1), bot - 0.22 * HH, 0.15 * Ta, 0.1 * HH, 0.22);
  p.stroke([[tcx + 0.1 * Ta, bot - 0.01 * HH], [tcx + 0.22 * Ta, bot - 0.12 * HH], [tcx + 0.34 * Ta, bot - 0.01 * HH]], 1.6 * u, st);
};
const topDetail = (p: Pen, o: Outfit, top: string, tcx: number, chin: number, bot: number, HH: number, Ta: number, u: number, f: number, skin: string) => {
  const cx = tcx + 2 * u * f,
    acc = o.dna?.topCol,
    seam = mix(o.jacket, INK, 0.45);
  switch (top) {
    case "stripes":
      {
        const c = acc ?? mix(o.jacket, "#ffffff", 0.5);
        for (let y = chin + 0.1 * HH; y < bot; y += 0.17 * HH) p.poly([[tcx - 2 * Ta, y], [tcx + 2 * Ta, y], [tcx + 2 * Ta, y + 0.075 * HH], [tcx - 2 * Ta, y + 0.075 * HH]], c, 0);
        break;
      }
    case "vneck":
      {
        const v: P2[] = [[cx - 0.34 * Ta, chin - 0.1 * HH], [cx, chin + 0.3 * HH], [cx + 0.34 * Ta, chin - 0.1 * HH]];
        p.poly(v, skin, 0);
        p.stroke(v, 2.4 * u);
        break;
      }
    case "tie":
      {
        for (const s of [-1, 1]) {
          const c: P2[] = [[cx, chin + 0.03 * HH], [cx + s * 0.3 * Ta, chin - 0.06 * HH], [cx + s * 0.26 * Ta, chin + 0.12 * HH]];
          p.poly(c, "#f4f1ea", 2 * u);
        }
        const tc = acc ?? "#c0353a",
          k: P2[] = [[cx - 4 * u, chin + 0.03 * HH], [cx + 4 * u, chin + 0.03 * HH], [cx + 3 * u, chin + 0.11 * HH], [cx - 3 * u, chin + 0.11 * HH]];
        p.poly([[cx - 3 * u, chin + 0.11 * HH], [cx + 3 * u, chin + 0.11 * HH], [cx + 6 * u, chin + 0.58 * HH], [cx, chin + 0.66 * HH], [cx - 6 * u, chin + 0.58 * HH]], tc, 2 * u);
        p.poly(k, tc, 2 * u);
        break;
      }
    case "zip":
      {
        p.stroke([[cx, chin], [cx, bot + 0.1 * HH]], 2.4 * u, seam);
        p.poly([[cx - 2.5 * u, chin + 0.16 * HH], [cx + 2.5 * u, chin + 0.16 * HH], [cx + 2.5 * u, chin + 0.26 * HH], [cx - 2.5 * u, chin + 0.26 * HH]], "#d9dde0", 1.4 * u);
        for (const s of [-1, 1]) p.stroke([[cx + s * 0.3 * Ta, chin - 0.05 * HH], [cx + s * 0.12 * Ta, chin + 0.2 * HH]], 2 * u, seam);
        break;
      }
    case "collar":
      {
        for (const s of [-1, 1]) p.poly([[cx, chin + 0.04 * HH], [cx + s * 0.42 * Ta, chin - 0.06 * HH], [cx + s * 0.34 * Ta, chin + 0.16 * HH]], acc ?? "#f4f1ea", 2 * u);
        for (const k2 of [0.26, 0.44, 0.62]) {
          p.dot(cx, chin + k2 * HH, 2.6 * u, INK);
          p.dot(cx, chin + k2 * HH, 1.8 * u, shade(o.jacket, 0.7));
        }
        break;
      }
    case "hoodie":
      {
        for (const s of [-1, 1]) {
          p.stroke([[cx + s * 0.14 * Ta, chin], [cx + s * 0.16 * Ta, chin + 0.28 * HH]], 2 * u, acc ?? "#f4f1ea");
          p.dot(cx + s * 0.16 * Ta, chin + 0.3 * HH, 2.4 * u, acc ?? "#f4f1ea");
        }
        const pk: P2[] = [[cx - 0.5 * Ta, bot - 0.05 * HH], [cx - 0.36 * Ta, chin + 0.52 * HH], [cx + 0.36 * Ta, chin + 0.52 * HH], [cx + 0.5 * Ta, bot - 0.05 * HH]];
        p.stroke(pk, 2.2 * u, seam);
        break;
      }
    case "overalls":
      {
        const c = acc ?? "#3a5a9a",
          y0 = chin + 0.3 * HH;
        p.poly([[cx - 0.5 * Ta, y0], [cx + 0.5 * Ta, y0], [cx + 1.4 * Ta, bot + 0.2 * HH], [cx - 1.4 * Ta, bot + 0.2 * HH]], c, 2.2 * u);
        for (const s of [-1, 1]) {
          p.band([[cx + s * 0.42 * Ta, y0], [cx + s * 0.6 * Ta, chin - 0.1 * HH]], c, 6 * u, 1.8 * u);
          p.dot(cx + s * 0.4 * Ta, y0 + 0.05 * HH, 2.6 * u, "#f0c24a");
        }
        break;
      }
    default:
      break;
  }
};
const browClamp = (d: [number, number], on: boolean): [number, number] => {
  if (!on) return d;
  const m = clamp((d[0] + d[1]) / 2, -7, 6),
    h = clamp((d[0] - d[1]) / 2, -6.5, 6.5);
  return [m + h, m - h];
};
const browDraw = (p: Pen, st: Dna["brow"], a: P2, b: P2, u: number, k: number, halo?: string) => {
  const pass = (col: string, add: number) => {
    const T = (q0: P2, q1: P2, wa: number, wb: number) => taper(p, q0, q1, wa + add, wb + add, col);
    switch (st) {
      case "block":
      case "uni":
        T(a, b, 6.2 * u * k, 6.2 * u * k);
        break;
      case "thin":
        T(a, b, 2.8 * u * k, 1.9 * u * k);
        break;
      case "bushy":
        {
          T(a, b, 8 * u * k, 6 * u * k);
          for (const t of [0.15, 0.5, 0.85]) {
            const q = lerp2(a, b, t);
            T(q, [q[0] + (b[0] - a[0]) * 0.12, q[1] - 6 * u * k], 3.6 * u * k, 1.2 * u * k);
          }
          break;
        }
      default:
        T(a, b, 5 * u * k, 2.5 * u * k);
    }
  };
  if (halo) pass(halo, 3.6 * u);
  pass(INK, 0);
};
const browHalo = (o: Outfit, skin: string) => {
  const h = o.dna?.hair;
  return o.dna && (h && h !== "none" && h !== "bald" && h !== "horseshoe" || o.hat && o.hat !== "hair") ? skin : undefined;
};
const skinD = (skin: string) => mul(skin, [0.95, 0.86, 0.84]);
const noseFront = (p: Pen, kind: Nose, x: number, y: number, u: number, f: number, skin: string) => {
  const sd = f || 0;
  switch (kind) {
    case "tick":
      if (sd) p.stroke([[x + sd * 1 * u, y - 7 * u], [x + sd * 4.5 * u, y + 1 * u], [x - sd * 0.5 * u, y + 2.5 * u]], 3 * u);
      break;
    case "button":
      p.ell(x + sd * 2 * u, y, 6 * u, 4.8 * u, skinD(skin), 0);
      p.arc(x + sd * 2 * u, y, 6 * u, 4.8 * u, 15, 165, 2.6 * u);
      break;
    case "snub":
      p.ell(x + sd * 2 * u, y, 5.5 * u, 4.4 * u, skinD(skin), 0);
      p.arc(x + sd * 2 * u, y, 5.5 * u, 4.4 * u, 200, 340, 2.4 * u);
      for (const s of [-1, 1]) p.dot(x + sd * 2 * u + s * 2.4 * u, y + 1.2 * u, 1.3 * u);
      break;
    case "bulb":
      p.ell(x + sd * 4 * u, y + 1 * u, 11 * u, 9.5 * u, skinD(skin), 2.8 * u);
      p.arc(x + sd * 4 * u - 3 * u, y - 2 * u, 4 * u, 3 * u, 200, 260, 1.6 * u, mul(skin, [0.8, 0.7, 0.7]));
      break;
    case "long":
    case "hook":
      {
        const s = sd || 1,
          out = (sd ? kind === "hook" ? 11 : 8 : 3.5) * u,
          tipY = y + (kind === "hook" ? 6 : 3) * u,
          top = y - 15 * u;
        const tipX = x + s * out,
          back = x + s * (sd ? 0.5 : -3.5) * u;
        const shape: P2[] = [[x - s * 1.5 * u, top], ...curve([x + s * 1.5 * u, top], [tipX + s * 2.5 * u, tipY - 5 * u], [tipX, tipY + 3 * u], 8), ...curve([tipX, tipY + 3 * u], [x + s * 2 * u, tipY + 5 * u], [back, tipY - 1 * u], 6)];
        p.poly(shape, skinD(skin), 0);
        p.stroke(curve([x + s * 1.5 * u, top + 3 * u], [tipX + s * 2.5 * u, tipY - 5 * u], [tipX, tipY + 3 * u], 10), 2.6 * u);
        p.stroke(curve([tipX, tipY + 3 * u], [x + s * 2 * u, tipY + 5 * u], [back, tipY], 8), 2.6 * u);
        if (kind === "hook") p.stroke(curve([tipX - s * 1 * u, tipY + 3 * u], [tipX - s * 1 * u, tipY + 7 * u], [tipX - s * 3.5 * u, tipY + 8 * u], 5), 2.4 * u);
        break;
      }
    default:
      break;
  }
};
const marksFront = (p: Pen, D: Dna, xs: number[], ey: number, mx: number, my: number, u: number, f: number, skin: string) => {
  const lc = mix(skin, INK, 0.42);
  if (D.age) for (const x of xs) p.arc(x, ey + 7 * u, 6.5 * u, 3 * u, 30, 150, 1.6 * u, lc);
  if ((D.age ?? 0) >= 2) for (const s of [-1, 1]) p.stroke(curve([mx + s * 13 * u, my - 11 * u], [mx + s * 16 * u, my - 4 * u], [mx + s * 15 * u, my + 2 * u], 6), 1.7 * u, lc);
  if (D.freckles) for (const x of xs) for (let i = 0; i < 4; i++) p.dot(x + (i - 1.5) * 3.6 * u + f * 2 * u, ey + 11 * u + i % 2 * 2.4 * u, 1.1 * u, mix(skin, "#8a4a2a", 0.55));
  if (D.mole) p.dot(mx + 11 * u * (f || 1), my - 5 * u, 1.6 * u, mix(skin, INK, 0.6));
};
const GLASS = "#241726";
const glassesFront = (p: Pen, D: Dna, xs: number[], ey: number, u: number, eK: number, cx: number, H: Blob | undefined, f: number) => {
  const col = D.glassCol ?? GLASS,
    w = 3 * u,
    R = Math.max(12.5 * u, 11 * u * eK + 2.5 * u),
    kind = D.glasses!;
  const rim = (x: number) => {
    if (kind === "round") {
      if (col !== GLASS) p.arc(x, ey, R, R, 0, 360, w + 1.6 * u);
      p.arc(x, ey, R, R, 0, 360, w, col);
    } else if (kind === "square" || kind === "shades") {
      const pts = rrect(x - R * 1.1, ey - R * 0.85, x + R * 1.1, ey + R * 0.85, 4 * u);
      p.poly(pts, kind === "shades" ? "#2c2433" : null, 0);
      if (kind === "shades") p.clip(pts, () => p.stroke([[x - R * 0.7, ey + R], [x + R * 0.4, ey - R]], 3 * u, "#4a4058"));
      p.path(pts, true);
      p.g.lineWidth = w;
      p.g.strokeStyle = col;
      p.g.stroke();
    } else if (kind === "cat") {
      const s = Math.sign(x - cx) || 1;
      const pts: P2[] = [[x - s * R, ey - R * 0.5], [x + s * R * 1.25, ey - R * 1.05], [x + s * R * 1.05, ey + R * 0.25], [x + s * R * 0.2, ey + R * 0.75], [x - s * R * 0.95, ey + R * 0.4]];
      p.path(pts, true);
      p.g.lineWidth = w;
      p.g.strokeStyle = col;
      p.g.lineJoin = "round";
      p.g.stroke();
    } else if (kind === "half") p.arc(x, ey, R * 1.05, R * 0.8, 0, 180, w * 1.2, col);
  };
  rim(xs[0]);
  rim(xs[1]);
  const bx0 = xs[0] + R * (kind === "square" || kind === "shades" ? 1.1 : 1),
    bx1 = xs[1] - R * (kind === "square" || kind === "shades" ? 1.1 : 1);
  if (bx1 > bx0) p.stroke(curve([bx0, ey - 2 * u], [(bx0 + bx1) / 2, ey - 5 * u], [bx1, ey - 2 * u], 6), 2.4 * u, col);
  if (H) for (const s of f ? [-f] : [-1, 1]) {
    const xo = s < 0 ? Math.min(...xs) - R * 1.05 : Math.max(...xs) + R * 1.05,
      xe = cx + s * H.a * 0.8;
    if ((xe - xo) * s > 2 * u) p.stroke([[xo, ey - 3 * u], [xe, ey - 4 * u]], 2.4 * u, col);
  }
};
const earsFront = (p: Pen, D: Dna, H: Blob, cx: number, hc: number, f: number, skin: string, ow: number) => {
  const u = 2 * H.a / 100,
    big = D.ears === "big",
    rx = (big ? 15 : 9) * u,
    ry = (big ? 21 : 13) * u;
  for (const s of f ? [-f] : [-1, 1]) {
    const ex = cx + s * H.a * (0.98 - 0.08 * Math.abs(f)) + s * rx * 0.45,
      ey = hc + 6 * u;
    p.ell(ex, ey, rx, ry, skin, 0, 0, 360, s * (big ? 12 : 6));
    p.ell(ex, ey, rx, ry, null, ow * 0.8, 0, 360, s * (big ? 12 : 6));
    p.arc(ex + s * rx * 0.1, ey, rx * 0.5, ry * 0.55, s > 0 ? -80 : 100, s > 0 ? 80 : 260, 2.2 * u, mul(skin, [0.78, 0.66, 0.66]));
  }
};
const earSide = (p: Pen, D: Dna, H: Blob, hx: number, hc: number, skin: string, ow: number) => {
  const u = 2 * H.a / 100,
    big = D.ears === "big",
    rx = (big ? 12 : 8) * u,
    ry = (big ? 18 : 12) * u,
    ex = hx - 8 * u,
    ey = hc + 6 * u;
  p.ell(ex, ey, rx, ry, skin, ow * 0.7);
  p.arc(ex + 1 * u, ey, rx * 0.5, ry * 0.55, 100, 300, 2.2 * u, mul(skin, [0.78, 0.66, 0.66]));
};
const dnaHead = (HB: Blob, D: Dna): Blob => {
  const P = headParams(D),
    a = HB.a * P.aK * pushK(D, D.headK) * LOOK.head;
  return {
    ...HB,
    a,
    b: a * P.hw * (HB.b / HB.a / 0.94),
    nTop: Math.max(1.3, HB.nTop - 1.75 + P.nTop),
    nBot: Math.max(1.3, HB.nBot - 2.3 + P.nBot),
    egg: HB.egg + 0.12 + P.egg
  };
};
const dnaBuild = (Bd: {
  a: number;
  torso: number;
  legs: number;
  tw: number;
}, D?: Dna) => ({
  a: Bd.a,
  torso: Bd.torso * pushK(D, D?.torsoK),
  legs: Bd.legs * pushK(D, D?.legK) * (D ? LOOK.legs : 1),
  tw: Bd.tw * (D?.body ? bodyParams(D).twK : 1) * pushK(D, D?.widthK)
});
const hairCtxOf = (p: Pen, o: Outfit, style: HairStyle, H: Blob, hp: P2[], cx: number, hc: number, facing: number, view: HairView, light: number, thick: number, ow: number, seed: number): HairCtx => ({
  p,
  o,
  style,
  H,
  hp,
  cx,
  hc,
  facing,
  view,
  light,
  thick,
  ow,
  u: 2 * H.a / 100,
  col: o.hair ?? "#3a2a20",
  hat: !!o.hat && o.hat !== "hair",
  seed
});
const faceSide = (p: Pen, o: Outfit, hx0: number, hy: number, W: number, expr: Expr, lid: number, brim: boolean, skin: string, talk = false, H?: Blob, hp?: P2[]) => {
  const u = W / 100,
    F = faceOf(expr),
    stout = o.build === "stout",
    D = o.dna;
  let hx = hx0,
    hv = 1;
  if (D && H && hp) {
    let edge = -Infinity;
    for (const [x, y] of hp) if (y > hy - 4 * u && y < hy + 16 * u) edge = Math.max(edge, x);
    if (edge > -Infinity) hx = edge - 1.12 * 50 * u;
    hv = clamp(H.b / H.a / 0.94, 0.8, 1.6);
  }
  const eK = pushK(D, D?.eyeK) * (D ? LOOK.eye : 1),
    bK = pushK(D, D?.browK),
    ey = hy - (hv - 1) * 10 * u,
    ex = hx + 27 * u + (eK - 1) * 4 * u;
  const kind = eyeKind(restEye(F.eye[1], D), lid);
  eye(p, kind, ex, ey, u * eK, 1, 0.6 + (F.look ?? 0) * 0.3, skin);
  if (o.lashes && kind !== "shock" && kind !== "shockHalf") lashesFront(p, ex, ey, 1, u * eK);
  if (D?.glasses) {
    const R = Math.max(12.5 * u, 11 * u * eK + 2.5 * u),
      col = D.glassCol ?? GLASS;
    if (D.glasses === "shades") p.ell(ex + 3 * u, ey, R * 0.55, R * 0.85, "#2c2433", 0);
    p.ell(ex + 3 * u, ey, R * 0.55, R * 0.85, null, 0);
    p.arc(ex + 3 * u, ey, R * 0.55, R * 0.85, 0, 360, 3 * u, col);
    p.stroke([[ex + 3 * u - R * 0.55, ey - 3 * u], [hx0 - 6 * u, ey - 1 * u]], 2.4 * u, col);
  }
  const [dI, dO] = F.brow,
    by = bFl(ey - (brim ? 17 : 20) * u - Math.max(0, eK - 1) * 9 * u - (kind === "wide" || kind === "wideLid" ? 3 * u * eK : 0), u, dI, dO, kind === "shock" || kind === "shockHalf", eK);
  if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u * eK, 9 * u * eK, 3 * u, 200, 340, 4 * u * bK);else browDraw(p, D?.brow, [ex + 8 * u, by + dI * u], [ex - 7 * u, by - u + dO * u], u, bK, browHalo(o, skin));
  const nose = LOOK.nose ? D?.nose ?? "none" : "none",
    ny = ey + 8 * u * hv,
    nx = hx + 46 * u;
  if (nose === "none" || nose === "tick") p.stroke([[hx + 44 * u, ny - 4 * u], [hx + 47.5 * u, ny + 1 * u], [hx + 43 * u, ny + 2 * u]], 3 * u);else if (nose === "button") p.ell(nx + 1 * u, ny, 6 * u, 5 * u, skinD(skin), 2.6 * u);else if (nose === "snub") p.ell(nx + 1 * u, ny - 1 * u, 6.5 * u, 4.4 * u, skinD(skin), 2.6 * u, 0, 360, -28);else if (nose === "bulb") p.ell(nx + 4 * u, ny + 2 * u, 11 * u, 10 * u, skinD(skin), 2.8 * u);else if (nose === "long") p.ell(nx + 8 * u, ny + 1 * u, 14 * u, 5.4 * u, skinD(skin), 2.8 * u, 0, 360, 22);else if (nose === "hook") {
    p.ell(nx + 7 * u, ny - 1 * u, 13 * u, 6.4 * u, skinD(skin), 2.8 * u, 0, 360, 30);
    p.stroke(curve([nx + 16 * u, ny + 4 * u], [nx + 17 * u, ny + 9 * u], [nx + 13 * u, ny + 11 * u], 6), 3 * u);
  }
  const bigNose = nose === "bulb" || nose === "long" || nose === "hook",
    my = hy + 21 * u * hv + (bigNose ? 4 * u : 0);
  if (D?.age) p.arc(ex, ey + 7 * u, 6 * u, 3 * u, 30, 150, 1.6 * u, mix(skin, INK, 0.42));
  if (D?.freckles) for (let i = 0; i < 4; i++) p.dot(ex + (i - 1) * 3.6 * u, ey + 11 * u + i % 2 * 2.4 * u, 1.1 * u, mix(skin, "#8a4a2a", 0.55));
  mouth(p, talk ? talkMouth(F) : F.mouth, hx + 33 * u, my, u, 0.62);
  if (o.moustache) mous(p, o, hx + 41 * u, my - 7 * u, -1, u, o.moustache, stout, true, talk || ["laugh", "o", "O", "teeth", "grin", "cry"].includes(F.mouth));
  if (F.sweat) p.ell(hx - 30 * u, hy - 24 * u, 3 * u, 5 * u, SWEAT, 2 * u);
  if (o.tilak) {
    p.dot(hx + 41.5 * u, hy - 15 * u, 3.4 * u, INK);
    p.dot(hx + 41.5 * u, hy - 15 * u, 2.5 * u, "#d8323a");
  }
  if (o.nosering) p.arc(hx + 43.5 * u, hy + 11 * u, 3.4 * u, 3.4 * u, 0, 360, 1.6 * u, "#f0c24a");
  if (o.earring) {
    p.dot(hx - 4 * u, hy + 23 * u, 3.2 * u, INK);
    p.dot(hx - 4 * u, hy + 23 * u, 2.3 * u, "#f0c24a");
  }
  if (F.cheeks) {
    const x = hx + 33 * u,
      y = hy + 17 * u,
      k = F.cheeks;
    p.ell(x, y, 10 * k * u, 9 * k * u, mul(skin, [0.99, 0.93, 0.9]), 0);
    p.arc(x, y, 10 * k * u, 9 * k * u, -70, 100, 2.4 * u);
  }
  if (o.stubble) for (let i = 0; i < 12; i++) {
    const a = rnd(11, i),
      r = rnd(12, i);
    p.dot(hx + (6 + a * 36) * u, hy + (27 + 9 * r) * u - Math.abs(a - 0.5) * 7 * u, 0.95 * u, mix(INK, skin, 0.35));
  }
};
const BONNET = "#e9cf8f",
  BONNET_BRIM = "#d6b46a";
const hatBehind = (p: Pen, o: Outfit, H: Blob, cx: number, hc: number, light: number, thick: number, ow: number, side: boolean) => {
  if (o.hat === "dupatta") {
    const W = 2 * H.a,
      HH = 2 * H.b,
      col = o.cap ?? "#f19ab0",
      yb = hc + H.b;
    for (const sd of side ? [-1] : [-1, 1]) {
      const lobe: P2[] = [[cx + sd * 0.4 * W, hc], [cx + sd * 0.56 * W, yb + 0.05 * HH], [cx + sd * 0.58 * W, yb + 0.36 * HH], [cx + sd * 0.42 * W, yb + 0.46 * HH], [cx + sd * 0.22 * W, yb + 0.36 * HH], [cx + sd * 0.2 * W, yb]];
      p.shadedFill(lobe, col, mul(col, SH_CLOTH), light, 0.4 * W, 0.4);
      p.poly(lobe, null, ow * 0.85);
      p.stroke([lobe[1], lobe[2], lobe[3]], 3.2 * W / 100, GOLDC);
    }
    return;
  }
  if (o.hat !== "bonnet") return;
  const bb = blobPts(cx - (side ? 12 : 0) * (H.a / 50), hc - 0.07 * 2 * H.b, {
    ...H,
    a: H.a * 1.17,
    b: H.b * 1.13,
    asym: 0,
    egg: 0.04,
    seed: H.seed + 3
  });
  p.shadedFill(bb, BONNET, mul(BONNET, SH_CLOTH), light, H.a * 1.17);
  p.inkRing(bb, ow * 0.85, thick);
};
let BACK = false;
const GOLDC = "#f0c24a";
const fillInk = (p: Pen, pts: P2[], col: string, light: number, ow: number, R = 0.5, sh: C3 = SH_CLOTH) => {
  p.shadedFill(pts, col, mul(col, sh), light, R, 0.4);
  p.poly(pts, null, ow);
};
const domePts = (cx: number, yb: number, wb: number, h: number, ex: number, sag: number): P2[] => {
  const pts: P2[] = [];
  for (let i = 0; i <= 28; i++) {
    const t = Math.PI * i / 28;
    pts.push([cx + wb * Math.cos(t), yb - h * Math.sin(t) ** ex]);
  }
  for (let i = 1; i < 12; i++) {
    const t = i / 12;
    pts.push([cx - wb + 2 * wb * t, yb + sag * (1 - (2 * t - 1) ** 2)]);
  }
  return pts;
};
const smileBand = (cx: number, wb: number, y0: number, y1: number, sag: number, tilt = 0): P2[] => {
  const top: P2[] = [],
    bot: P2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12,
      x = cx - wb + 2 * wb * t,
      c = sag * (1 - (2 * t - 1) ** 2) + tilt * (t - 0.5);
    top.push([x, y0 + c]);
    bot.push([x, y1 + c]);
  }
  return [...top, ...bot.reverse()];
};
const featherPts = (a: P2, k: P2, b: P2, wmax: number, notch: number): [P2[], P2[]] => {
  const c = curve(a, k, b, 22),
    l: P2[] = [],
    r: P2[] = [];
  for (let i = 0; i < c.length; i++) {
    const p0 = c[Math.max(0, i - 1)],
      p1 = c[Math.min(c.length - 1, i + 1)],
      dx = p1[0] - p0[0],
      dy = p1[1] - p0[1],
      ln = Math.hypot(dx, dy) || 1,
      nx = -dy / ln,
      ny = dx / ln;
    const t = i / (c.length - 1),
      w = wmax * Math.sin(Math.PI * Math.min(1, 0.12 + 0.88 * t) ** 0.8) * (1 - 0.18 * t) * (1 - (i % 2 ? notch : 0));
    l.push([c[i][0] + nx * w, c[i][1] + ny * w]);
    r.push([c[i][0] - nx * w, c[i][1] - ny * w]);
  }
  return [c, [...l, ...r.reverse()]];
};
const tailPts = (x0: number, y0: number, w0: number, w1: number, len: number, sway: number): P2[] => {
  const Lt: P2[] = [],
    Rt: P2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12,
      w = w0 + (w1 - w0) * t ** 0.85,
      x = x0 + sway * Math.sin(t * Math.PI * 0.8),
      y = y0 + len * t;
    Lt.push([x - w, y]);
    Rt.push([x + w, y]);
  }
  return [...Lt, ...Rt.reverse()];
};
const M1_RIM = 0.17;
const m1Wide = (o: Outfit): number => {
  const h = o.dna?.hair;
  return h === "afro" ? 1.35 : h === "bob" || h === "puffs" ? 1.22 : h === "curly" ? 1.25 : h === "long" ? 1.15 : 1;
};
const hairUnderM1 = (p: Pen, o: Outfit, H: Blob, hc: number, cx: number, view: "front" | "side" | "back", over: boolean, fn: () => void) => {
  if (o.hat !== "helmet_m1") {
    fn();
    return;
  }
  const HH = 2 * H.b,
    W = 2 * H.a,
    r0 = hc - H.b + M1_RIM * HH - 0.02 * HH;
  const fringe = (xa: number, xb: number, depth: number, n: number): P2[] => {
    const top: P2[] = [],
      bot: P2[] = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28,
        x = xa + (xb - xa) * t,
        tp = Math.sin(Math.PI * t) ** 0.45;
      top.push([x, r0]);
      bot.push([x, r0 + 0.03 * HH + depth * tp * (0.72 + 0.28 * Math.abs(Math.sin(Math.PI * n * t)))]);
    }
    return [...top, ...bot.reverse()];
  };
  if (view === "back" && over) return;
  if (view === "side") {
    p.clip(fringe(cx - 0.62 * W, cx + 0.02 * W, 0.26 * HH, 2), fn);
    return;
  }
  if (view === "back" || !over) {
    p.clip(view === "back" ? fringe(cx - 0.6 * W, cx + 0.6 * W, 0.24 * HH, 3) : fringe(cx - 0.75 * W, cx + 0.75 * W, 0.3 * HH, 3), fn);
    return;
  }
  p.clip(fringe(cx - 0.62 * W, cx - 0.36 * W, 0.2 * HH, 1), fn);
  p.clip(fringe(cx + 0.36 * W, cx + 0.62 * W, 0.2 * HH, 1), fn);
  return;
};
const hatNew = (p: Pen, o: Outfit, hp: P2[], H: Blob, cx: number, hc: number, light: number, seed: number, facing: number, side: boolean, back: boolean): boolean => {
  const kind = o.hat;
  if (kind !== "pagdi" && kind !== "turban_mughal" && kind !== "turban_small" && kind !== "topi" && kind !== "dupatta" && kind !== "helmet_spike") return false;
  const W = 2 * H.a,
    HH = 2 * H.b,
    u = W / 100,
    crown = hc - H.b,
    ow = 0.85 * 5 * u;
  const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5));
  const R = (pts: P2[]) => rotPts(pts, a, cx, hc);
  const s = side ? 1 : facing || 1,
    sh0 = side ? -0.045 * W : facing * 0.035 * W,
    cx0 = cx + sh0;
  const deg = a * 180 / Math.PI;
  if (kind === "pagdi") {
    const yb = crown + 0.17 * HH,
      wb = 0.55 * W,
      h = 0.84 * HH,
      WH = "#f7f2e7",
      cl = mix(WH, INK, 0.3);
    const dome = R(domePts(cx0, yb, wb, h, 0.72, 3 * u));
    fillInk(p, dome, WH, light, ow, wb);
    p.clip(dome, () => {
      for (let i = 0; i < 5; i++) {
        const y0 = yb - h * (0.02 + 0.2 * i);
        p.stroke(R(curve([cx0 - wb * 1.1, y0 + 0.1 * HH], [cx0, y0 - 0.08 * HH], [cx0 + wb * 1.1, y0 - 0.14 * HH], 14)), 2.1 * u, cl);
      }
      const band = R(smileBand(cx0, wb * 1.08, yb - 0.3 * HH, yb - 0.06 * HH, 5 * u, side ? -6 * u : 0));
      p.shadedFill(band, "#f2a22e", mul("#f2a22e", SH_CLOTH), light, wb, 0.4);
      p.poly(band, null, 1.9 * u);
      if (!back) {
        const P1 = curve([cx0 + s * 0.04 * W, yb - 0.96 * h], [cx0 + s * 0.36 * W, yb - 0.7 * h], [cx0 + s * 0.58 * W, yb - 0.2 * HH], 12);
        const P2b = curve([cx0 - s * 0.14 * W, yb - 0.86 * h], [cx0 + s * 0.16 * W, yb - 0.5 * h], [cx0 + s * 0.4 * W, yb - 0.2 * HH], 12);
        const fold = R([...P1, ...P2b.reverse()]);
        p.shadedFill(fold, "#ebe3d2", mul("#ebe3d2", SH_CLOTH), light, wb, 0.4);
        p.poly(fold, null, 2 * u);
        for (const t of [0.35, 0.68]) p.stroke(R(P1.map((q, i) => lerp2(q, P2b[P2b.length - 1 - i] ?? q, t))), 1.5 * u, cl);
      }
    });
    p.poly(dome, null, ow);
    if (!back) {
      const [px, py] = R([[cx0 + s * 0.43 * W, yb - 0.17 * HH]])[0];
      p.ell(px, py, 5 * u, 7.2 * u, GOLDC, 2 * u, 0, 360, deg - 20 * s);
      p.dot(px, py, 1.9 * u, "#d8323a");
    } else {
      const tail = R(tailPts(cx0 + 0.03 * W, yb + 0.04 * HH, 0.2 * W, 0.035 * W, 0.78 * HH, 0.05 * W));
      p.shadedFill(tail, WH, mul(WH, SH_CLOTH), light, 0.4 * W, 0.4);
      p.clip(tail, () => {
        for (const t of [0.3, 0.7]) p.stroke(R([[cx0 - 0.3 * W, yb + (0.04 + 0.78 * t) * HH], [cx0 + 0.4 * W, yb + (0.04 + 0.78 * t) * HH + 0.02 * HH]]), 0.07 * HH, "#f2a22e");
        p.stroke(R([[cx0 + 0.03 * W, yb + 0.1 * HH], [cx0 + 0.05 * W, yb + 0.7 * HH]]), 1.4 * u, cl);
      });
      p.poly(tail, null, ow * 0.85);
    }
  } else if (kind === "turban_mughal") {
    const yb = crown + 0.2 * HH,
      wb = 0.57 * W,
      h = 0.64 * HH,
      RC = "#c2272f",
      RD = "#8f1d28",
      pxc = cx0 + (side ? 0.1 : s * 0.0) * W;
    const plume = (): void => {
      const lean = side ? -1 : -(facing || 1) * 0.7,
        base: P2 = [pxc, yb - 0.17 * HH];
      const tip: P2 = [base[0] + lean * (side ? 0.4 : 0.2) * W, base[1] - (side ? 0.74 : 0.82) * HH],
        mid: P2 = [base[0] + lean * 0.02 * W, base[1] - 0.42 * HH];
      const [c, outl] = featherPts(R([base])[0], R([mid])[0], R([tip])[0], 7.5 * u, 0.22);
      p.poly(outl, "#fffdf6", 2.2 * u);
      p.clip(outl, () => p.stroke(c.slice(2, c.length - 2).map(([x, y]) => [x + 2.5 * u, y] as P2), 3.5 * u, "#ece6f2"));
      p.stroke(c.slice(1, c.length - 2), 1.3 * u, "#bdb5c8");
    };
    if (back) plume();
    const dome = R(domePts(cx0, yb, wb, h, 0.8, 3 * u));
    fillInk(p, dome, RC, light, ow, wb, SH_FELT);
    p.clip(dome, () => {
      for (let i = 0; i < 4; i++) {
        const y0 = yb - h * (0.18 + 0.22 * i);
        const lo = curve([cx0 - wb * 1.1, y0 + 0.14 * HH], [cx0, y0 - 0.02 * HH], [cx0 + wb * 1.1, y0 - 0.1 * HH], 14);
        const hi = curve([cx0 - wb * 1.1, y0 + 0.2 * HH], [cx0, y0 + 0.05 * HH], [cx0 + wb * 1.1, y0 - 0.04 * HH], 14);
        p.poly(R([...lo, ...hi.reverse()]), RD, 0);
        p.stroke(R(lo), 1.6 * u, "#e8606a");
      }
      const band = R(smileBand(cx0, wb * 1.08, yb - 0.14 * HH, yb - 0.01 * HH, 4 * u));
      p.shadedFill(band, GOLDC, "#b98a22", light, wb, 0.4);
      p.poly(band, null, 1.9 * u);
      for (let i = 0; i < 7; i++) {
        const t = (i + 0.5) / 7,
          q2 = R([[cx0 - wb + 2 * wb * t, yb - 0.075 * HH + 4 * u * (1 - (2 * t - 1) ** 2)]])[0];
        p.dot(q2[0], q2[1], 2 * u, "#fff4d8");
      }
    });
    p.poly(dome, null, ow);
    if (!back) {
      const gx = pxc,
        gy = yb - 0.1 * HH;
      if (o.plume !== false) plume();
      const pl = R([[gx, gy - 0.2 * HH], [gx + 8 * u, gy - 0.09 * HH], [gx + 9 * u, gy + 0.02 * HH], [gx, gy + 0.07 * HH], [gx - 9 * u, gy + 0.02 * HH], [gx - 8 * u, gy - 0.09 * HH]]);
      p.shadedFill(pl, GOLDC, "#b98a22", light, 10 * u, 0.4);
      p.poly(pl, null, 2.2 * u);
      const [jx, jy] = R([[gx, gy - 0.02 * HH]])[0];
      p.ell(jx, jy, 4.6 * u, 5.4 * u, o.gem ?? "#2fb27a", 2 * u, 0, 360, deg);
      p.dot(jx - 1.2 * u, jy - 1.5 * u, 1.2 * u, "#d8fff0");
      const [tx, ty] = R([[gx, gy - 0.15 * HH]])[0];
      p.dot(tx, ty, 1.8 * u, "#fff4d8");
    } else {
      const tail = R(tailPts(cx0 + 0.02 * W, yb + 0.04 * HH, 0.17 * W, 0.03 * W, 0.62 * HH, 0.04 * W));
      p.shadedFill(tail, RC, mul(RC, SH_FELT), light, 0.4 * W, 0.4);
      p.clip(tail, () => {
        for (const t of [0.3, 0.55]) p.stroke(R([[cx0 - 0.3 * W, yb + (0.04 + 0.62 * t) * HH], [cx0 + 0.4 * W, yb + (0.04 + 0.62 * t) * HH + 0.015 * HH]]), 0.045 * HH, GOLDC);
        const tipT = R([[cx0 - 0.3 * W, yb + 0.58 * HH], [cx0 + 0.4 * W, yb + 0.58 * HH], [cx0 + 0.4 * W, yb + 0.8 * HH], [cx0 - 0.3 * W, yb + 0.8 * HH]]);
        p.poly(tipT, GOLDC, 0);
      });
      p.poly(tail, null, ow * 0.85);
    }
  } else if (kind === "turban_small") {
    const col = o.cap ?? "#e8e0c8",
      yb = crown + 0.22 * HH,
      wb = 0.53 * W,
      h = 0.5 * HH,
      cd = mix(col, INK, 0.26);
    if (!back || true) {
      const ts = side ? -1 : -s,
        tx = cx0 + ts * 0.42 * W;
      const tail = R([[tx - 0.07 * W, yb - 0.05 * HH], [tx + 0.1 * W, yb - 0.05 * HH], [tx + ts * 0.08 * W + 0.06 * W, yb + 0.42 * HH], [tx + ts * 0.08 * W - 0.07 * W, yb + 0.36 * HH]]);
      p.poly(tail, cd, ow * 0.8);
    }
    const dome = R(domePts(cx0, yb, wb, h, 0.8, 3 * u));
    fillInk(p, dome, col, light, ow, wb, SH_FELT);
    p.clip(dome, () => {
      for (let i = 0; i < 3; i++) {
        const y0 = yb - h * (0.1 + 0.3 * i);
        p.stroke(R(curve([cx0 - wb * 1.1, y0 + 0.12 * HH], [cx0, y0 - 0.02 * HH], [cx0 + wb * 1.1, y0 - 0.08 * HH], 14)), 2.1 * u, cd);
      }
      const band = R(smileBand(cx0, wb * 1.08, yb - 0.07 * HH, yb + 0.02 * HH, 4 * u));
      p.shadedFill(band, cd, mul(cd, SH_FELT), light, wb, 0.4);
    });
    p.poly(dome, null, ow);
  } else if (kind === "topi") {
    const col = o.cap ?? "#f2efe6",
      yb = crown + (o.round ? 0.34 : 0.3) * HH,
      ht = (o.round ? 0.28 : 0.36) * HH,
      wb = 0.5 * W,
      wt = 0.53 * W,
      cd = mix(col, INK, 0.22);
    const pts: P2[] = [];
    pts.push([cx0 - wt, yb - ht + 6 * u]);
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push([cx0 - wt + 2 * wt * t, yb - ht - 3 * u * Math.sin(Math.PI * t) + (side ? -8 * u * (t - 0.5) : 0)]);
    }
    pts.push([cx0 + wt, yb - ht + 6 * u]);
    for (let i = 0; i <= 10; i++) {
      const t = 1 - i / 10;
      pts.push([cx0 - wb + 2 * wb * t, yb + 3 * u * (1 - (2 * t - 1) ** 2)]);
    }
    const body = R(pts);
    fillInk(p, body, col, light, ow, wb, SH_FELT);
    p.clip(body, () => {
      p.stroke(R([[cx0 - wb * 1.1, yb - 0.1 * HH], [cx0 + wb * 1.1, yb - 0.1 * HH]]), 2 * u, cd);
      for (const t of [-0.5, 0, 0.5]) p.stroke(R([[cx0 + t * wb, yb - ht], [cx0 + t * wb * 0.9, yb - 0.1 * HH]]), 1.4 * u, cd);
    });
    p.poly(body, null, ow);
  } else if (kind === "dupatta") {
    const col = o.cap ?? "#f19ab0",
      cd = mix(col, INK, 0.2);
    const arc = hp.filter(([, y]) => y < hc + 0.5 * H.b).map(([x, y]) => [cx + (x - cx) * 1.07, hc + (y - hc) * 1.07 - 3 * u] as P2);
    if (arc.length > 3) {
      const shell = R(arc);
      p.shadedFill(shell, col, mul(col, SH_FELT), light, H.a, 0.35);
      p.inkRing(shell, ow, thickAngle(light));
      p.clip(shell, () => {
        for (const k of [0.34, 0.6]) p.stroke(R([[cx - 0.6 * W, hc - k * HH], [cx, hc - k * HH - 0.1 * HH], [cx + 0.6 * W, hc - k * HH + 0.02 * HH]]), 1.6 * u, cd);
      });
      if (!back) {
        const fo = R(ellPts(cx + (side ? 15 : 5 * (facing || 0)) * u, hc + 0.05 * HH, (side ? 0.3 : 0.455) * W, 0.44 * HH, 0, 360, 0, 40));
        p.poly(fo, o.skin ?? SKIN, 0);
        p.clip(fo, () => {
          p.ell(cx + (side ? 15 : 5 * (facing || 0)) * u, hc - 0.5 * HH, 0.6 * W, 0.14 * HH, o.hair ?? "#1c1218", 0);
        });
        p.clip(shell, () => {
          p.stroke([...fo, fo[0]], 5 * u, GOLDC);
          p.stroke([...fo, fo[0]], 1.4 * u, "#b98a22");
        });
        p.clip(shell, () => p.stroke([...fo, fo[0]], 2.4 * u, INK));
        p.clip(shell, () => {
          p.stroke([...fo, fo[0]], 3.4 * u, GOLDC);
        });
      } else p.stroke(R([[cx - 0.4 * W, hc + 0.2 * H.b], [cx, hc + 0.3 * H.b + 3 * u], [cx + 0.4 * W, hc + 0.2 * H.b]]), 3 * u, GOLDC);
    }
  } else if (kind === "helmet_spike") {
    const yb = crown + 0.22 * HH,
      ST = "#98a1ab",
      STD = "#6b727c",
      BR = "#d2a24c";
    const dome = blobPts(cx0, crown + 0.24 * HH, {
      ...H,
      a: H.a * 1.04,
      b: H.b * 0.74,
      nTop: 2.4,
      nBot: 6,
      egg: 0,
      asym: 0,
      seed: H.seed + 5
    }).filter(([, y]) => y < yb).map(([x, y]) => [x, y] as P2);
    if (back) {
      const fl = R([[cx - 0.46 * W, yb - 2 * u], [cx + 0.46 * W, yb - 2 * u], [cx + 0.5 * W, yb + 0.26 * HH], [cx + 0.3 * W, yb + 0.33 * HH], [cx - 0.3 * W, yb + 0.33 * HH], [cx - 0.5 * W, yb + 0.26 * HH]]);
      const FLC = mix(o.jacket, "#ffffff", 0.1);
      p.shadedFill(fl, FLC, mul(FLC, SH_CLOTH), light, 0.5 * W, 0.4);
      p.clip(fl, () => {
        for (let d = -0.4; d < 0.6; d += 0.13) {
          p.stroke(R([[cx + d * W, yb], [cx + (d + 0.3) * W, yb + 0.35 * HH]]), 1.5 * u, mix(FLC, INK, 0.4));
          p.stroke(R([[cx + (d + 0.3) * W, yb], [cx + d * W, yb + 0.35 * HH]]), 1.5 * u, mix(FLC, INK, 0.4));
        }
      });
      p.poly(fl, null, ow * 0.85);
    }
    for (const sd of back ? [] : side ? [-1] : [-1, 1]) {
      const gx = cx0 + sd * (side ? 0.3 : 0.47) * W;
      p.poly(R([[gx - 9 * u, yb], [gx + 9 * u, yb], [gx + 8 * u, yb + 0.26 * HH], [gx, yb + 0.3 * HH], [gx - 8 * u, yb + 0.26 * HH]]), ST, ow * 0.7);
    }
    const shell = R([...dome, [cx0 + 0.53 * W, yb], [cx0 + 0.53 * W, yb + 0.035 * HH], [cx0 - 0.53 * W, yb + 0.035 * HH], [cx0 - 0.53 * W, yb]]);
    const [sx, sy] = R([[cx0, crown + 0.0 * HH]])[0],
      [tx, ty] = R([[cx0, crown - 0.3 * HH]])[0];
    p.poly([[sx - 6 * u, sy + 2 * u], [tx, ty], [sx + 6 * u, sy + 2 * u]], BR, 2.2 * u);
    p.shadedFill(shell, ST, STD, light, 0.55 * W, 0.4);
    p.clip(shell, () => {
      p.band(R([[cx0 - 0.62 * W, yb - 0.02 * HH], [cx0 + 0.62 * W, yb - 0.02 * HH]]), BR, 0.07 * HH, 0.9 * u);
      p.stroke(R([[cx0, crown], [cx0 + (side ? 0 : 0), yb]]), 1.6 * u, STD);
    });
    p.poly(shell, null, ow);
    p.ell(sx, sy + 1 * u, 5 * u, 4 * u, BR, 2 * u);
  }
  return true;
};
const hatOn = (p: Pen, o: Outfit, hp: P2[], H: Blob, cx: number, hc: number, light: number, seed: number, facing: number, side: boolean, back = false) => {
  BROW_FLOOR = null;
  if (hatNew(p, o, hp, H, cx, hc, light, seed, facing, side, back)) return;
  const W = 2 * H.a,
    HH = 2 * H.b,
    u = W / 100,
    ow = 0.85 * 5 * u;
  let crown = hc - H.b;
  const LOWF: Record<string, number> = {
    garrison: 0.32,
    peaked: 0.335,
    flatcap: 0.365,
    helmet_m1: 0.23,
    beret: 0.41
  };
  if (LOWF[o.hat ?? ""] && !back) {
    const hvv = o.dna && H ? clamp(H.b / H.a / 0.94, 0.8, 1.6) : 1,
      by0 = hc - (hvv - 1) * 10 * u - 17 * u;
    if (o.hat !== "helmet_m1") crown -= Math.max(0, crown + LOWF[o.hat!] * HH - (by0 - 4 * u - 0.04 * HH));
    BROW_FLOOR = crown + LOWF[o.hat!] * HH + 0.02 * HH;
  }
  const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5));
  const R = (pts: P2[]) => rotPts(pts, a, cx, hc);
  const sag = (yb: number, wb: number): P2[] => {
    const base: P2[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      base.push([cx + wb * (2 * t - 1), yb + 3 * u * (1 - (2 * t - 1) ** 2)]);
    }
    return base;
  };
  if (o.hat === "shako" || o.hat === "shako_tall") {
    const tall = o.hat === "shako_tall",
      yb = crown + 0.25 * HH,
      ht = (tall ? 0.66 : 0.56) * HH,
      wb = 46 * u,
      wt = 52 * u;
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, "#3a3d47", "#24262d", light, wt, 0.4);
    if (tall) p.clip(body, () => p.band(R([[cx - wt - 5 * u, yb - ht + 0.07 * HH], [cx + wt + 5 * u, yb - ht + 0.07 * HH]]), "#e8c45a", 0.06 * HH, 1.5 * u));
    p.poly(body, null, ow);
    const deg = a * 180 / Math.PI;
    if (side) {
      p.poly(R([[cx + 36 * u, yb - 1 * u], [cx + 60 * u, yb + 8 * u], [cx + 34 * u, yb + 6 * u]]), "#16171b", 2.5 * u);
      const [tx, ty] = R([[cx + 24 * u, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
    } else {
      const [px, py] = R([[cx + 3 * u * facing, yb + 3 * u]])[0];
      p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, deg);
      const [bx, by] = R([[cx, yb - 0.45 * ht]])[0];
      p.ell(bx, by, 7 * u, 6 * u, tall ? "#e8c45a" : "#c9ccd2", 2 * u, 0, 360, deg);
      p.arc(bx, by, 3.5 * u, 2.8 * u, 200, 500, 1.6 * u);
      const [tx, ty] = R([[cx, yb - ht - 6 * u]])[0];
      p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
    }
  } else if (o.hat === "cap" || o.hat === "hair") {
    const cut = crown + (o.hat === "cap" ? 0.3 : 0.35) * HH;
    const keep = (x: number, y: number) => y < cut || side && o.hat === "hair" && x < cx - 6 * u && y < hc + 0.42 * H.b;
    const n = hp.length,
      startIdx = Math.max(0, hp.findIndex(([x, y], i) => keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
    const arc = [...hp.slice(startIdx), ...hp.slice(0, startIdx)].filter(([x, y]) => keep(x, y)).map(([x, y]) => [cx + (x - cx) * 1.03, hc + (y - hc) * 1.03] as P2);
    if (arc.length < 3) return;
    if (o.hat === "hair") {
      const [x0, y0] = arc[arc.length - 1],
        [x1, y1] = arc[0];
      for (let i = 1; i < 6; i++) arc.push([x0 + (x1 - x0) * i / 6, y0 + (y1 - y0) * i / 6 + (i % 2 ? 4 * u : 0)]);
    }
    const col = o.hat === "cap" ? o.cap! : o.hair!;
    p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
    p.poly(arc, null, ow);
    if (o.hat === "hair") {
      const s = side ? -1 : facing || 1;
      void s;
    }
    if (o.hat === "cap") {
      const deg = a * 180 / Math.PI;
      if (side) p.poly(R([[cx + 40 * u, cut - 2 * u], [cx + 74 * u, cut + 4 * u], [cx + 40 * u, cut + 6 * u]]), shade(col, 0.8), ow);else {
        const s = facing || (rnd(seed, 21) < 0.5 ? -1 : 1),
          [px, py] = R([[cx + s * 4 * u, cut + 1.5 * u]])[0];
        p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg);
      }
    }
  } else if (o.hat === "toque") {
    const yb = crown + 0.3 * HH,
      bandH = 0.17 * HH,
      wb = 0.47 * W,
      s = side ? 1 : facing || 1,
      col = "#fbf8f0",
      sh = "#d9d4e6";
    const band = R([...sag(yb, wb).reverse(), [cx - wb * 0.98, yb - bandH], [cx + wb * 0.98, yb - bandH]]);
    const puffC: P2 = [cx + s * 0.1 * W, yb - bandH - 0.3 * HH];
    const [px, py] = R([puffC])[0];
    const pp = blobPts(px, py, {
      a: 0.6 * W,
      b: 0.36 * HH,
      nTop: 2.1,
      nBot: 2.6,
      egg: 0.08,
      asym: 0.08 * s,
      rot: a + rad(-8 * s),
      noise: 0.03,
      seed: seed + 41
    });
    p.shadedFill(pp, col, sh, light, 0.6 * W, 0.45);
    p.inkRing(pp, ow, thickAngle(light));
    for (const k of [-0.28, 0.05, 0.36]) {
      const [x0, y0] = R([[puffC[0] + k * W, puffC[1] + 0.3 * HH]])[0],
        [x1, y1] = R([[puffC[0] + k * W * 1.15 + s * 4 * u, puffC[1] - 0.1 * HH]])[0];
      p.stroke([[x0, y0], [x1, y1]], 1.6 * u, "#b8b2c8");
    }
    p.shadedFill(band, col, sh, light, wb, 0.4);
    p.poly(band, null, ow);
  } else if (o.hat === "capotain") {
    const yb = crown + 0.24 * HH,
      ht = 0.95 * HH,
      wb = 0.33 * W,
      wt = 0.27 * W,
      col = "#24222b";
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
    p.clip(body, () => p.band(R([[cx - wb - 4 * u, yb - 0.15 * HH], [cx + wb + 4 * u, yb - 0.15 * HH]]), "#5a2a30", 0.15 * HH, 0.8 * u));
    p.poly(body, null, ow);
    const [kx, ky] = R([[cx + (side ? 0.18 * W : 0), yb - 0.15 * HH]])[0];
    p.poly([[kx - 7 * u, ky - 6 * u], [kx + 7 * u, ky - 6 * u], [kx + 7 * u, ky + 6 * u], [kx - 7 * u, ky + 6 * u]], "#e8c45a", 2 * u);
    const [bx, by] = R([[cx + (side ? 6 * u : 0), yb + 1 * u]])[0];
    p.ell(bx, by, 0.6 * W, 0.06 * HH, "#1a1920", ow, 0, 360, a * 180 / Math.PI);
  } else if (o.hat === "tophat") {
    const yb = crown + 0.22 * HH,
      ht = 0.8 * HH,
      wb = 0.31 * W,
      wt = 0.33 * W,
      col = "#2e2a36";
    const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
    p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
    p.clip(body, () => p.band(R([[cx - wt - 4 * u, yb - 0.13 * HH], [cx + wt + 4 * u, yb - 0.13 * HH]]), shade(o.jacket, 0.9), 0.14 * HH, 0.8 * u));
    p.poly(body, null, ow);
    const [bx, by] = R([[cx, yb + 1 * u]])[0];
    p.ell(bx, by, 0.45 * W, 0.05 * HH, "#1d1b22", ow, 0, 360, a * 180 / Math.PI);
  } else if (o.hat === "crown" && CROWN3D) {
    const yb = crown + 0.24 * HH,
      wb = 0.43 * W;
    if (REC.on) {
      const [bx, by] = capPt(p, ...R([[cx, yb + 3 * u]])[0]);
      REC.a.crown = {
        x: bx,
        y: by,
        w: 2 * wb * capScale(p),
        ang: (p.rot ? p.rot[0] : 0) + a
      };
    }
  } else if (o.hat === "crown") {
    const yb = crown + 0.24 * HH,
      bh = 0.13 * HH,
      wb = 0.43 * W,
      G = "#f0c24a",
      GD = "#b98a22";
    const pts: P2[] = [...sag(yb, wb).reverse()];
    const n = 5,
      top = yb - bh;
    pts.push([cx - wb * 1.02, top]);
    for (let i = 0; i < n; i++) {
      const x0 = cx - wb * 1.02 + 2 * wb * 1.02 * i / n,
        x1 = x0 + 2 * wb * 1.02 / n;
      pts.push([(x0 + x1) / 2, top - (i === 2 ? 0.3 : 0.22) * HH], [x1, top]);
    }
    const body = R(pts);
    p.shadedFill(body, G, GD, light, wb, 0.35);
    p.clip(body, () => p.band(R([[cx - wb - 4 * u, yb - 0.4 * bh], [cx + wb + 4 * u, yb - 0.4 * bh]]), "#d9a93a", 0.08 * HH, 0.6 * u));
    p.poly(body, null, ow);
    for (let i = 0; i < n; i++) {
      const x0 = cx - wb * 1.02 + 2 * wb * 1.02 * i / n,
        x1 = x0 + 2 * wb * 1.02 / n;
      const [tx, ty] = R([[(x0 + x1) / 2, top - (i === 2 ? 0.3 : 0.22) * HH]])[0];
      p.ell(tx, ty, 4.2 * u, 4.2 * u, i % 2 ? "#4aa0e0" : "#fff4c8", 2 * u);
    }
    const [gx, gy] = R([[cx + (side ? 0.25 * W : 4 * u * facing), yb - 0.45 * bh]])[0];
    p.ell(gx, gy, 6.5 * u, 5.5 * u, "#d8323a", 2.2 * u);
  } else if (o.hat === "diadem") {
    const yb = crown + 0.3 * HH,
      wb = 0.49 * W;
    const band = R([...sag(yb, wb).reverse(), [cx - wb * 0.99, yb - 0.08 * HH], [cx + wb * 0.99, yb - 0.08 * HH]]);
    p.shadedFill(band, "#fbf6ea", "#cfc8dc", light, wb, 0.4);
    p.poly(band, null, ow * 0.8);
  } else if (o.hat === "helmet") {
    const yb = crown + 0.27 * HH,
      B = "#d29a48",
      BD = "#94632a",
      wb = 0.52 * W;
    const dome = blobPts(cx, crown + 0.2 * HH, {
      ...H,
      a: H.a * 1.08,
      b: H.b * 0.62,
      nBot: 6,
      egg: 0,
      asym: 0,
      seed: H.seed + 5
    }).filter(([, y]) => y < yb).map(([x, y]) => [x, y] as P2);
    const shell = R([...dome, [cx + wb, yb], [cx + wb * 0.98, yb + 0.06 * HH], [cx - wb * 0.98, yb + 0.06 * HH], [cx - wb, yb]]);
    const cc = o.crest ?? "#c0353a";
    const cr: P2[] = [];
    if (side) {
      for (let i = 0; i <= 14; i++) {
        const t = i / 14,
          a = Math.PI * (1 - t);
        cr.push([cx - 4 * u + 0.62 * W * Math.cos(a), crown + 0.05 * HH - 0.42 * HH * Math.sin(a)]);
      }
      for (let i = 14; i >= 0; i--) {
        const t = i / 14,
          a = Math.PI * (1 - t);
        cr.push([cx - 4 * u + 0.5 * W * Math.cos(a), crown + 0.1 * HH - 0.24 * HH * Math.sin(a)]);
      }
    } else {
      for (let i = 0; i <= 12; i++) {
        const t = i / 12,
          a = Math.PI * (1 - t);
        cr.push([cx + 0.16 * W * Math.cos(a), crown - 0.02 * HH - 0.55 * HH * Math.sin(a) * (0.85 + 0.15 * Math.sin(t * 9))]);
      }
    }
    const crp = R(cr);
    p.shadedFill(crp, cc, mul(cc, SH_FELT), light, 0.3 * W, 0.4);
    p.poly(crp, null, ow * 0.8);
    p.shadedFill(shell, B, BD, light, wb, 0.4);
    p.clip(shell, () => p.band(R([[cx - wb - 4 * u, yb - 0.03 * HH], [cx + wb + 4 * u, yb - 0.03 * HH]]), "#f0c060", 0.05 * HH, 0.6 * u));
    p.poly(shell, null, ow);
    for (const s of side ? [-1] : [-1, 1]) {
      const gx = cx + s * (side ? 0.32 : 0.47) * W;
      p.poly(R([[gx - 9 * u, yb + 2 * u], [gx + 9 * u, yb + 2 * u], [gx + 6 * u * s, yb + 0.33 * HH], [gx - 4 * u * s, yb + 0.3 * HH]]), B, ow * 0.7);
    }
  } else if (o.hat === "helmet_m1") {
    const col = o.cap ?? "#5f6b3a",
      dk = mul(col, SH_FELT),
      rim = crown + M1_RIM * HH;
    const wk = m1Wide(o),
      kk = side ? 1 + (wk - 1) * 0.7 : wk,
      sx = -1;
    const hw = H.a * 1.1 * kk,
      hcx = side ? cx - 0.15 * (wk - 1) * W : cx,
      hgt = wk > 1 ? 0.5 * 2 * hw : 0.28 * HH;
    const baseY = (c: number) => rim + (side ? 0.075 * HH * Math.max(0, Math.min(1, (c * sx + 0.1) / 1.1)) : back ? 0.05 * HH : 0.025 * HH * c * c);
    const dome: P2[] = [];
    for (let i = 0; i <= 26; i++) {
      const t = i / 26 * Math.PI,
        c = Math.cos(t);
      dome.push([hcx + hw * c, baseY(c) - hgt * Math.sin(t) ** 0.72]);
    }
    for (let i = 1; i < 12; i++) {
      const c = -1 + 2 * i / 12;
      dome.push([hcx + hw * c, baseY(c) + 0.004 * HH]);
    }
    const bwBack = Math.min(hw + 0.075 * W, hw * 1.12),
      bwFront = Math.min(hw + (side ? 0.015 : 0.075) * W, hw * 1.12),
      bh = (back ? 0.05 : 0.036) * HH;
    const brim: P2[] = [];
    for (let i = 0; i < 44; i++) {
      const t = i / 44 * Math.PI * 2,
        c = Math.cos(t),
        sn = Math.sin(t),
        wbk = side ? c * sx > 0 ? bwBack : bwFront : bwBack;
      brim.push([hcx + c * wbk, baseY(c) + (sn > 0 ? sn * bh : sn * bh * 0.35) + 0.02 * HH * Math.abs(c) ** 3]);
    }
    const brimR = R(brim);
    p.shadedFill(brimR, shade(col, 0.88), shade(dk, 0.85), light, bwBack, 0.35);
    p.poly(brimR, null, ow);
    const domeR = R(dome);
    p.shadedFill(domeR, col, dk, light, hw, 0.35);
    p.clip(domeR, () => {
      const [hx2, hy2] = R([[hcx - Math.cos(light) * 0.32 * hw, rim - hgt * 0.55]])[0];
      p.ell(hx2, hy2, 0.3 * hw, 0.09 * HH, mix(col, "#ffffff", 0.22), 0);
    });
    p.poly(domeR, null, ow);
    if (!back) {
      const sts = side ? [[cx - 0.1 * W, cx - 0.12 * W]] : [[cx - 0.495 * W, cx - 0.49 * W], [cx + 0.495 * W, cx + 0.49 * W]];
      for (const [x0, x1] of sts) p.stroke(R([[x0, rim + 0.03 * HH], [(x0 + x1) / 2, rim + 0.15 * HH], [x1, rim + 0.27 * HH]]), ow, INK);
    }
  } else if (o.hat === "garrison") {
    const col = o.cap ?? "#5a5a3a",
      dk = mul(col, SH_FELT),
      lh = 0.26 * HH,
      yb = crown + 0.27 * HH,
      f3 = facing !== 0 && !side && !back;
    const tl = rad(side ? 4 : -9 * (facing || 1)),
      Rg = (pts: P2[]) => rotPts(R(pts), tl, cx, crown + 0.1 * HH);
    let body: P2[], crease: P2[], curtain: P2[], pipe: P2[];
    if (side) {
      body = [[cx - 0.56 * W, yb + 0.02 * HH], [cx - 0.5 * W, yb - 0.1 * HH], [cx - 0.25 * W, yb - lh * 0.95], [cx + 0.1 * W, yb - lh - 0.03 * HH], [cx + 0.42 * W, yb - lh * 0.55], [cx + 0.54 * W, yb - 0.01 * HH], [cx + 0.2 * W, yb + 0.03 * HH]];
      crease = [[cx - 0.5 * W, yb - 0.1 * HH], [cx - 0.1 * W, yb - lh * 0.9], [cx + 0.42 * W, yb - lh * 0.55]];
      curtain = [[cx - 0.55 * W, yb + 0.0], [cx - 0.1 * W, yb - 0.05 * HH], [cx + 0.5 * W, yb - 0.01 * HH]];
      pipe = [[cx - 0.5 * W, yb - 0.1 * HH], [cx - 0.25 * W, yb - lh * 0.95], [cx + 0.1 * W, yb - lh - 0.03 * HH], [cx + 0.42 * W, yb - lh * 0.55]];
    } else {
      const hw = (f3 ? 0.38 : 0.34) * W,
        sh = f3 ? 0.06 * W * (facing || 1) : 0;
      body = [[cx - hw, yb + 0.02 * HH], [cx - hw * 0.95 + sh, yb - lh * 0.6], [cx + sh, yb - lh - 0.04 * HH], [cx + hw * 0.95 + sh, yb - lh * 0.6], [cx + hw, yb + 0.02 * HH], [cx, yb + 0.045 * HH]];
      crease = [[cx - hw * 0.15, yb + 0.03 * HH], [cx + sh * 0.7, yb - lh * 0.5], [cx + sh, yb - lh - 0.04 * HH]];
      curtain = [[cx - hw * 0.97, yb - 0.02 * HH], [cx, yb + 0.02 * HH], [cx + hw * 0.97, yb - 0.02 * HH]];
      pipe = [[cx - hw * 0.95 + sh, yb - lh * 0.6], [cx + sh, yb - lh - 0.04 * HH], [cx + hw * 0.95 + sh, yb - lh * 0.6]];
    }
    const bR = Rg(body);
    p.shadedFill(bR, col, dk, light, W * 0.5, 0.35);
    p.stroke(Rg(curtain), 1.3 * u, mix(INK, col, 0.35));
    p.stroke(Rg(crease), 1.5 * u, mix(INK, col, 0.35));
    p.poly(bR, null, ow);
    if (o.trim) p.stroke(Rg(pipe), 2.2 * u, o.trim);
  } else if (o.hat === "peaked") {
    const col = o.cap ?? "#4b4a33",
      dk = mul(col, SH_FELT),
      RUS = "#5a3424",
      yb = crown + 0.26 * HH,
      bh = 0.1 * HH,
      wb = 0.5 * W,
      wt = 0.6 * W,
      top = crown - 0.1 * HH;
    const sd = side ? 1 : 0;
    const crownPts: P2[] = [];
    if (side) {
      crownPts.push([cx - wb, yb - bh]);
      crownPts.push([cx - 0.66 * W, yb - bh * 1.7]);
      crownPts.push([cx - 0.62 * W, top + 0.06 * HH]);
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        crownPts.push([cx - 0.55 * W + 1.0 * W * t, top + 0.035 * HH * (1 - t) ** 2 - 0.03 * HH * t ** 2 + 0.01 * HH * Math.sin(Math.PI * t)]);
      }
      crownPts.push([cx + 0.5 * W, top + 0.1 * HH]);
      crownPts.push([cx + wb * 0.98, yb - bh]);
    } else {
      crownPts.push([cx - wb, yb - bh]);
      crownPts.push([cx - wt, yb - bh * 1.8]);
      crownPts.push([cx - wt * 0.97, top + 0.05 * HH]);
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        crownPts.push([cx - 0.9 * wt + 1.8 * wt * t, top - 0.04 * HH * Math.sin(Math.PI * t) + 0.02 * HH]);
      }
      crownPts.push([cx + wt * 0.97, top + 0.05 * HH]);
      crownPts.push([cx + wt, yb - bh * 1.8]);
      crownPts.push([cx + wb, yb - bh]);
    }
    const crR = R(crownPts);
    const bandPts: P2[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      bandPts.push([cx - wb * 1.04 + 2.08 * wb * t, yb - bh + 0.012 * HH * Math.sin(Math.PI * t)]);
    }
    for (let i = 12; i >= 0; i--) {
      const t = i / 12;
      bandPts.push([cx - wb * 1.04 + 2.08 * wb * t, yb + 0.03 * HH * (1 - (2 * t - 1) ** 2) + 0.01 * HH]);
    }
    p.shadedFill(crR, col, dk, light, wt, 0.4);
    p.poly(crR, null, ow);
    const bdR = R(bandPts),
      bc = shade(col, 0.78);
    p.shadedFill(bdR, bc, shade(dk, 0.78), light, wb, 0.4);
    p.poly(bdR, null, ow);
    const brown = "#6e4a30";
    if (!back) {
      const sts = side ? [[cx - 0.02 * W, cx - 0.06 * W]] : [[cx - 0.5 * W, cx - 0.47 * W], [cx + 0.5 * W, cx + 0.47 * W]];
      for (const [x0, x1] of sts) p.stroke(R([[x0, yb + 0.03 * HH], [(x0 + x1) / 2, yb + 0.15 * HH], [x1, yb + 0.27 * HH]]), 1.6 * u, brown);
      if (side) {
        const vis = R([[cx + 0.42 * W, yb - 0.03 * HH], [cx + 0.7 * W, yb + 0.0 * HH], [cx + 0.9 * W, yb + 0.05 * HH], [cx + 0.75 * W, yb + 0.075 * HH], [cx + 0.42 * W, yb + 0.05 * HH]]);
        p.shadedFill(vis, RUS, mul(RUS, SH_FELT), light, 0.3 * W, 0.4);
        p.poly(vis, null, ow);
        p.stroke(R([[cx + 0.55 * W, yb + 0.02 * HH], [cx + 0.75 * W, yb + 0.05 * HH]]), 1.4 * u, "#b8805a");
      } else {
        const s2 = facing * 0.04 * W,
          [vx, vy] = R([[cx + s2, yb + 0.01 * HH]])[0],
          deg = a * 180 / Math.PI;
        p.ell(vx, vy, 0.5 * W, 0.065 * HH, RUS, ow, 0, 180, deg);
        const [hx2, hy2] = R([[cx + s2 - 0.12 * W, yb + 0.035 * HH]])[0];
        p.ell(hx2, hy2, 0.14 * W, 0.016 * HH, "#b8805a", 0, 0, 360, deg);
      }
    }
    void sd;
  } else if (o.hat === "flatcap") {
    const col = o.cap ?? "#6a5a46",
      dk = mul(col, SH_FELT),
      yb = crown + 0.3 * HH,
      deg = a * 180 / Math.PI;
    const s = side ? 1 : facing || (rnd(seed, 21) < 0.5 ? -1 : 1);
    let cr: P2[];
    if (side) {
      cr = [[cx - 0.6 * W, yb + 0.01 * HH], [cx - 0.62 * W, yb - 0.1 * HH], [cx - 0.4 * W, yb - 0.31 * HH], [cx - 0.05 * W, yb - 0.35 * HH], [cx + 0.3 * W, yb - 0.26 * HH], [cx + 0.62 * W, yb - 0.04 * HH], [cx + 0.66 * W, yb + 0.03 * HH], [cx + 0.3 * W, yb + 0.03 * HH], [cx - 0.1 * W, yb + 0.05 * HH]];
    } else {
      const sh = s * 0.05 * W,
        n = 22;
      cr = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n * Math.PI,
          c = Math.cos(t);
        cr.push([cx + sh - c * 0.62 * W, yb - 0.01 * HH - 0.33 * HH * Math.sin(t) ** 0.7]);
      }
      for (let i = 1; i < 12; i++) {
        const t = i / 12;
        cr.push([cx + sh + 0.62 * W - 1.24 * W * t, yb + 0.012 * HH + 0.04 * HH * (1 - (2 * t - 1) ** 2)]);
      }
    }
    const crR = R(cr);
    p.shadedFill(crR, col, dk, light, 0.6 * W, 0.4);
    p.poly(crR, null, ow);
    p.clip(crR, () => {
      p.stroke(R(side ? [[cx - 0.5 * W, yb - 0.12 * HH], [cx - 0.1 * W, yb - 0.24 * HH], [cx + 0.45 * W, yb - 0.1 * HH]] : [[cx + s * 0.05 * W - 0.5 * W, yb - 0.1 * HH], [cx + s * 0.05 * W, yb - 0.2 * HH], [cx + s * 0.05 * W + 0.5 * W, yb - 0.1 * HH]]), 1.2 * u, mix(INK, col, 0.55));
    });
    if (!back) {
      if (side) {
        const pk = R([[cx + 0.5 * W, yb + 0.0 * HH], [cx + 0.7 * W, yb + 0.01 * HH], [cx + 0.9 * W, yb + 0.045 * HH], [cx + 0.7 * W, yb + 0.06 * HH], [cx + 0.45 * W, yb + 0.04 * HH]]);
        p.shadedFill(pk, shade(col, 0.82), shade(dk, 0.8), light, 0.3 * W, 0.4);
        p.poly(pk, null, ow);
      } else {
        const [px, py] = R([[cx + s * 0.06 * W, yb + 0.015 * HH]])[0];
        p.ell(px, py, 0.36 * W, 0.05 * HH, shade(col, 0.8), ow, 0, 180, deg);
        p.arc(px, py - 0.004 * HH, 0.34 * W, 0.035 * HH, 200, 340, 1.2 * u, mix(INK, col, 0.4));
      }
    }
    const [bx, by] = R([[cx + (side ? 0 : s * 0.05 * W), yb - (side ? 0.275 : 0.245) * HH]])[0];
    p.dot(bx, by, 2.4 * u, shade(col, 0.75));
  } else if (o.hat === "beret") {
    const col = o.cap ?? "#2c3550",
      dk = mul(col, SH_FELT),
      cut = crown + 0.37 * HH;
    const s = side ? -1 : facing || (rnd(seed, 21) < 0.5 ? -1 : 1);
    const n = hp.length,
      keep = (y: number) => y < cut;
    const startIdx = Math.max(0, hp.findIndex(([, y], i) => keep(y) && !keep(hp[(i + n - 1) % n][1])));
    const band = [...hp.slice(startIdx), ...hp.slice(0, startIdx)].filter(([, y]) => keep(y)).map(([x, y]) => [cx + (x - cx) * 1.02, hc + (y - hc) * 1.02] as P2);
    if (band.length < 3) return;
    p.shadedFill(R(band), shade(col, 0.78), shade(dk, 0.78), light, H.a, 0.35);
    p.poly(R(band), null, ow);
    const dcx = cx + s * 0.1 * W,
      dcy = crown + 0.17 * HH,
      rx = (side ? 0.54 : 0.58) * W,
      ry = 0.19 * HH,
      tilt = rad(s * -15);
    const disc = rotPts(ellPts(dcx, dcy, rx, ry, 0, 360, 0, 40), tilt, dcx, dcy);
    const stalk = rotPts(ellPts(dcx - s * 0.02 * W, dcy - ry * 0.95, 0.035 * W, 0.028 * HH, 0, 360, 0, 14), tilt, dcx, dcy);
    p.poly(R(stalk), shade(col, 0.85), ow * 0.8);
    const dR = R(disc);
    p.shadedFill(dR, col, dk, light, rx, 0.35);
    p.clip(dR, () => {
      const [hx2, hy2] = R(rotPts([[dcx - Math.cos(light) * 0.25 * W, dcy - 0.05 * HH]], tilt, dcx, dcy))[0];
      p.ell(hx2, hy2, 0.2 * W, 0.06 * HH, mix(col, "#ffffff", 0.16), 0);
    });
    p.poly(dR, null, ow);
  } else if (o.hat === "hood" || o.hat === "veil") {
    const col = o.hat === "hood" ? o.cap ?? "#2e2a36" : o.cap ?? "#5a3a6e";
    const drape = o.hat === "veil" ? 0.55 : 0.3;
    const arc = hp.filter(([, y]) => y < hc + drape * H.b).map(([x, y]) => [cx + (x - cx) * 1.13, hc + (y - hc) * 1.1 - 2 * u] as P2);
    if (arc.length > 3) {
      const shell = R(arc);
      p.shadedFill(shell, col, mul(col, SH_FELT), light, H.a, 0.35);
      p.inkRing(shell, ow, thickAngle(light));
      if (!back) {
        const fo = R(ellPts(cx + (side ? 16 : 6 * facing) * u, hc + 5 * u, (side ? 0.3 : 0.37) * W, 0.35 * HH, 0, 360, 0, 40));
        p.poly(fo, o.skin ?? SKIN, 0);
        p.poly(fo, null, 2.6 * u);
      }
    }
  } else if (o.hat === "bonnet") {
    const [bx, by] = R([[cx + (side ? 6 * u : 0), crown + 0.16 * HH]])[0];
    p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, BONNET_BRIM);
    p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
    const cy = hc + H.b * 0.98;
    p.stroke([[cx - 14 * u, cy - 4 * u], [cx, cy + 2 * u], [cx + 14 * u, cy - 4 * u]], 2 * u, BONNET_BRIM);
  }
};
export type Arms = [P2[], P2[]];
/** held prop; for the hammer the number is the strike 0 (raised) .. 1 (struck) */

export type Prop = null | "icecream" | "shako" | ["hammer", number] | "loaf" | "roll" | "bag" | "bagFat" | ["scale", number] | "bowl" | "goblet" | ["vial", number] | "vialGlow" | "snake" | "napkin" | ["tray", number] | "sword" | "cup" | "bundle" | "stick" | "stickCut" | "knife";
/** arm poses (front view); k animates the pose 0..1. drink: facing hand from the chest (0) to the mouth (1);
 *  wipe: facing hand at the mouth, k sweeps it across; flex: both arms up, biceps; plead: hands together at the chest;
 *  present: both hands forward at chest height (offering a cup) */

export type Pose = "crossed" | "hips" | "shrug" | "hold" | "knead" | "reach" | "point" | "raise" | "drink" | "wipe" | "flex" | "plead" | "present" | "oath_heart" | "oath_pray" | "oath_sky" | "hush" | "bundle" | "give" | "take" | "gauge" | "measure" | "toss" | "take" | "laugh_belly" | "wag" | "lie" | "cheeks" | "hover";
export const VIALS = ["#6fdc5a", "#b05ae0", "#ff8a3a", "#3ac8e0", "#e04a6a", "#e8d84a"];
export type HeldKind = "bowl" | "goblet" | "cup" | "vial" | "vialGlow" | "sword";
/** held sticks and knives. world.ts keeps its Record<HeldKind, ..> grip table untouched: sticks and the knife are recorded in
 *  Anch.stick / Anch.stick2 (merge StickKind into HeldKind there when the film wires the 3D stick). */

export type StickKind = "stick" | "stickCut" | "knife";
export type HeldKindAll = HeldKind | StickKind;
/** stick.x / y = the gripping hand's centre (card canvas px), prop.ang = in-plane angle in rad, clockwise from straight UP (0 = upright;
 *  for stick / stickCut / knife the object's axis runs base -> top along this direction), prop.u = design unit in px, prop.len = full
 *  length in px, prop.grip = fraction of the length from the base end to the hand centre (STICK_GRIP); n = 1: tucked under the arm
 *  (no hand on it), n = 2: free in the air (not held). prop2 = the second stick of the `measure` pose. */

export type PropRec = {
  kind: StickKind;
  n: number;
  x: number;
  y: number;
  ang: number;
  u: number;
  len?: number;
  grip?: number;
};
export type Anch = {
  free?: PropRec;
  prop?: {
    kind: HeldKind;
    n: number;
    x: number;
    y: number;
    ang: number;
    u: number;
  };
  stick?: PropRec;
  stick2?: PropRec;
  hands: [number, number, number][];
  crown?: {
    x: number;
    y: number;
    w: number;
    ang: number;
  };
};
export const REC: {
  on: boolean;
  a: Anch;
} = {
  on: false,
  a: {
    hands: []
  }
};
let P3D = false,
  CROWN3D = false;
export const heldKind = (prop: Prop): HeldKind | null => prop === "bowl" || prop === "goblet" || prop === "cup" || prop === "vialGlow" || prop === "sword" ? prop : Array.isArray(prop) && prop[0] === "vial" ? "vial" : null;
export const stickKind = (prop: Prop): StickKind | null => prop === "stick" || prop === "stickCut" || prop === "knife" ? prop : null;
const isStick = (prop: Prop) => !!stickKind(prop);
/** any 3D-anchored held prop (old kinds + sticks): cast.ts sets p3d from this */

export const heldKindAll = (prop: Prop): HeldKindAll | null => heldKind(prop) ?? stickKind(prop);
const capPt = (p: Pen, x: number, y: number): [number, number] => {
  const [a, b] = p.P(x, y);
  const m = p.g.getTransform();
  return [m.a * a + m.c * b + m.e, m.b * a + m.d * b + m.f];
};
const capScale = (p: Pen) => {
  const m = p.g.getTransform();
  return Math.hypot(m.a, m.b);
};
/** the hand dot that holds a 3D prop: recorded so world.ts can redraw it in front of the model */

export const mitt = (p: Pen, x: number, y: number, r: number, _thumb = 0, _skin = SKIN, _flat = 0, _curl = 0) => {
  p.dot(x, y, r);
};
const handDot = (p: Pen, x: number, y: number, r: number, prop: Prop, flat = 0) => {
  mitt(p, x, y, r, 0, undefined, flat, 1);
  if (P3D && REC.on && (heldKind(prop) || isStick(prop))) {
    const [cx, cy] = capPt(p, x, y);
    REC.a.hands.push([cx, cy, r * capScale(p)]);
  }
};
const GOLD = "#f0c24a",
  GOLD_D = "#b98a22";
/** shallow two-handled bowl (kylix) seen from the side, tilted by rot (deg) */

export const drawBowl = (p: Pen, x: number, y: number, u: number, rot = 0, fill = "#8fd46a") => {
  const R = (pts: P2[]) => rotPts(pts, rad(rot), x, y);
  const cup: P2[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI * (i / 16);
    cup.push([x + 28 * u * Math.cos(a), y + 2 * u + 14 * u * Math.sin(a)]);
  }
  p.poly(R([[x - 3 * u, y + 15 * u], [x + 3 * u, y + 15 * u], [x + 9 * u, y + 24 * u], [x - 9 * u, y + 24 * u]]), GOLD_D, 2 * u);
  p.poly(R(cup), GOLD, 2.6 * u);
  p.poly(R([[x - 25 * u, y + 2 * u], [x + 25 * u, y + 2 * u], [x + 20 * u, y + 6 * u], [x - 20 * u, y + 6 * u]]), fill, 1.6 * u);
  for (const s of [-1, 1]) p.arc(...R([[x + s * 31 * u, y + 5 * u]])[0], 6 * u, 5 * u, s > 0 ? -90 : 90, s > 0 ? 90 : 270, 2.4 * u);
  p.stroke(R([[x - 18 * u, y + 9 * u], [x + 18 * u, y + 9 * u]]), 2.2 * u, "#d8323a");
};
/** the brass chalice (a drawn goblet, for a 2D goblet such as a servant's tray):
 *  a wide flared bowl with a lip, a knobbed stem and a broad foot */

export const drawGoblet = (p: Pen, x: number, y: number, u: number, rot = 0) => {
  const R = (pts: P2[]) => rotPts(pts, rad(rot), x, y),
    B = "#d2a24c",
    BD = "#94692a";
  p.poly(R([[x - 15 * u, y + 30 * u], [x + 15 * u, y + 30 * u], [x + 11 * u, y + 25 * u], [x + 4 * u, y + 22 * u], [x + 4 * u, y + 10 * u], [x - 4 * u, y + 10 * u], [x - 4 * u, y + 22 * u], [x - 11 * u, y + 25 * u]]), BD, 2.2 * u);
  p.ell(...R([[x, y + 15 * u]])[0], 6.5 * u, 3.5 * u, B, 2 * u, 0, 360, rot);
  const bowl: P2[] = [[x - 18 * u, y - 15 * u], [x + 18 * u, y - 15 * u]];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI * i / 12;
    bowl.push([x + 16 * u * Math.cos(a), y - 4 * u + 15 * u * Math.sin(a)]);
  }
  p.poly(R(bowl.slice(1).concat([bowl[0]])), B, 2.6 * u);
  p.stroke(R([[x - 9 * u, y - 9 * u], [x - 6 * u, y + 3 * u]]), 2.6 * u, "#f4d890");
  p.ell(...R([[x, y - 15 * u]])[0], 18 * u, 4 * u, "#6a1838", 2 * u, 0, 360, rot);
};
/** small glass vial with a cork; colour index into VIALS (or a glowing green for the strongest) */

export const drawVial = (p: Pen, x: number, y: number, u: number, col: string, rot = 0, glow = false, uncorked = false) => {
  const R = (pts: P2[]) => rotPts(pts, rad(rot), x, y);
  if (glow) for (const [r, a] of [[46, 0.18], [32, 0.25]] as const) p.ell(x, y, r * u, r * u, `rgba(150,255,120,${a})`, 0);
  p.poly(R(ellPts(x, y + 6 * u, 10 * u, 12 * u, 0, 360, 0, 24)), "#e8f4f8", 2.4 * u);
  p.poly(R(ellPts(x, y + 9 * u, 8.2 * u, 8.6 * u, 0, 360, 0, 24)), col, 0);
  p.poly(R([[x - 4.5 * u, y - 12 * u], [x + 4.5 * u, y - 12 * u], [x + 4.5 * u, y - 4 * u], [x - 4.5 * u, y - 4 * u]]), "#e8f4f8", 2.2 * u);
  if (!uncorked) p.poly(R([[x - 5 * u, y - 19 * u], [x + 5 * u, y - 19 * u], [x + 4.4 * u, y - 11 * u], [x - 4.4 * u, y - 11 * u]]), "#a8744a", 2 * u);
  p.ell(...R([[x - 4 * u, y + 3 * u]])[0], 2.4 * u, 4 * u, "#ffffff", 0);
  if (glow) {
    p.dot(...R([[x - 3 * u, y + 7 * u]])[0], 1.8 * u, INK);
    p.dot(...R([[x + 3 * u, y + 7 * u]])[0], 1.8 * u, INK);
  }
};
/** a green snake held by the neck: the head hangs straight down under the fist (fangs open, a drop forming), the body
 *  coils up and over the wrist. squeeze 0..1 narrows the neck. The fangs' tip is at (x, y + 31u). */

export const drawSnake = (p: Pen, x: number, y: number, u: number, squeeze = 0) => {
  const S = "#6fae3e",
    SD = "#4a7f28",
    body: P2[] = [];
  for (let i = 0; i <= 22; i++) {
    const t = i / 22;
    body.push([x + 4 * u + 26 * u * Math.sin(t * 6.2) * (0.3 + 0.7 * t), y - 4 * u - 70 * u * t]);
  }
  p.line(body, S, 8.5 * u * (1 - 0.12 * squeeze));
  for (let i = 2; i < 21; i += 3) p.dot(body[i][0], body[i][1], 2 * u, SD);
  p.line([[x, y + 2 * u], [x - 1 * u, y + 12 * u]], S, 7 * u * (1 - 0.2 * squeeze));
  const hy = y + 20 * u;
  p.ell(x - u, hy, 9 * u, 12 * u, S, 2.6 * u);
  p.dot(x - 5 * u, hy - 4 * u, 2.2 * u, INK);
  p.dot(x + 3 * u, hy - 4 * u, 2.2 * u, INK);
  p.stroke([[x - 8 * u, hy - 8 * u], [x - 3 * u, hy - 6 * u]], 1.6 * u);
  p.stroke([[x + 6 * u, hy - 8 * u], [x + 1 * u, hy - 6 * u]], 1.6 * u);
  p.poly([[x - 7 * u, hy + 7 * u], [x + 5 * u, hy + 7 * u], [x - u, hy + 12 * u]], "#d84a5a", 1.6 * u);
  for (const dx of [-4, 2]) p.poly([[x + (dx - 1.2) * u, hy + 8 * u], [x + (dx + 1.2) * u, hy + 8 * u], [x + dx * u, hy + 11 * u]], "#ffffff", 1 * u);
};
/** flat serving tray (side-on) with two cups and fruit; tilt in deg */

export const drawTray = (p: Pen, x: number, y: number, u: number, tilt = 0) => {
  const R = (pts: P2[]) => rotPts(pts, rad(tilt), x, y);
  const sl = tilt * 0.45 * u;
  drawGoblet(p, ...R([[x - 20 * u + sl, y - 22 * u]])[0], u * 0.8, tilt);
  for (const [dx, c] of [[12, "#7a2a8a"], [22, "#8a3a9a"], [17, "#9a4aa8"]] as const) p.ell(...R([[x + dx * u + sl * 1.3, y - (dx === 17 ? 12 : 6) * u]])[0], 6 * u, 6 * u, c, 1.8 * u);
  p.ell(...R([[x + 34 * u + sl, y - 7 * u]])[0], 9 * u, 8 * u, "#e8a040", 2 * u);
  p.poly(R(ellPts(x, y + 2 * u, 50 * u, 9 * u, 0, 360, 0, 32)), "#d9a93a", 2.4 * u);
  p.poly(R(ellPts(x, y + 4 * u, 50 * u, 6 * u, 0, 180, 0, 20)), "#b98a22", 2 * u);
};
export const drawSword = (p: Pen, x: number, y: number, u: number, rot = -80) => {
  const R = (pts: P2[]) => rotPts(pts, rad(rot), x, y);
  p.poly(R([[x + 6 * u, y - 3 * u], [x + 86 * u, y - 4 * u], [x + 98 * u, y], [x + 86 * u, y + 4 * u], [x + 6 * u, y + 3 * u]]), "#dfe4ea", 2.2 * u);
  p.stroke(R([[x + 10 * u, y], [x + 84 * u, y]]), 1.2 * u, "#9aa4ae");
  p.poly(R([[x + 2 * u, y - 13 * u], [x + 7 * u, y - 13 * u], [x + 7 * u, y + 13 * u], [x + 2 * u, y + 13 * u]]), GOLD, 2 * u);
  p.poly(R([[x - 14 * u, y - 3 * u], [x + 2 * u, y - 3 * u], [x + 2 * u, y + 3 * u], [x - 14 * u, y + 3 * u]]), "#6a3a24", 2 * u);
  p.dot(...R([[x - 16 * u, y]])[0], 4 * u, GOLD);
};
export const drawNapkin = (p: Pen, x: number, y: number, u: number) => {
  p.poly([[x - 12 * u, y - 10 * u], [x + 14 * u, y - 12 * u], [x + 12 * u, y + 16 * u], [x + 2 * u, y + 10 * u], [x - 10 * u, y + 18 * u]], "#fbf6ea", 2.2 * u);
  p.stroke([[x - 4 * u, y - 6 * u], [x - 2 * u, y + 10 * u]], 1.4 * u, "#c8c0d0");
};
export const drawBundle = (p: Pen, x: number, y: number, u: number) => {
  p.band([[x, y + 20 * u], [x + 18 * u, y - 70 * u]], "#8a5a34", 4 * u, 1.4 * u, "round");
  const bx = x + 20 * u,
    by = y - 74 * u;
  p.poly([[bx - 20 * u, by - 4 * u], [bx - 4 * u, by - 22 * u], [bx + 22 * u, by - 10 * u], [bx + 20 * u, by + 16 * u], [bx - 14 * u, by + 18 * u]], "#d84a4a", 2.6 * u);
  for (const [dx, dy] of [[-6, -2], [8, 4], [2, 10]] as const) p.dot(bx + dx * u, by + dy * u, 2.6 * u, "#fbf6ea");
};
const CRUST = "#d58f3f",
  CRUST_D = "#a8642a",
  BAG = "#e3d3ab",
  BAG_D = "#b9a57a";
export const drawLoaf = (p: Pen, x: number, y: number, u: number, r = 1, rot = 0) => {
  const Wl = 32 * u * r,
    Hl = 17 * u * r,
    body = ellPts(x, y, Wl, Hl, 0, 360, rot);
  p.poly(body, CRUST, 0);
  p.clip(body, () => {
    p.ell(x, y + 9 * u * r, Wl * 1.05, Hl * 0.55, CRUST_D, 0, 0, 360, rot);
    p.ell(x - 3 * u * r, y - 6 * u * r, Wl * 0.78, Hl * 0.42, "#e8ab5e", 0, 0, 360, rot);
    for (const k of [-0.48, 0, 0.48]) p.ell(x + k * Wl * 0.95 * Math.cos(rad(rot)), y - 5 * u * r + k * Wl * Math.sin(rad(rot)), 3.6 * u * r, 9 * u * r, "#f5dcaa", 0, 0, 360, rot + 38);
  });
  p.poly(body, null, 2.6 * u);
};
export const drawRoll = (p: Pen, x: number, y: number, u: number, r = 1) => {
  p.ell(x, y, 15 * u * r, 12 * u * r, CRUST, 2.4 * u);
  p.stroke([[x - 6 * u * r, y - 6 * u * r], [x + 5 * u * r, y - 3 * u * r]], 2.2 * u * r, CRUST_D);
};
/** cloth sack hanging from (x, y) = the gathered neck; rolls peek out of the top */

export const drawBag = (p: Pen, x: number, y: number, u: number, fat = false) => {
  const w = (fat ? 40 : 33) * u,
    h = 52 * u;
  drawRoll(p, x - 9 * u, y - 4 * u, u, 0.75);
  drawRoll(p, x + 8 * u, y - 6 * u, u, 0.8);
  if (fat) drawRoll(p, x, y - 10 * u, u, 0.8);
  const pts: P2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24 * Math.PI * 2,
      c = Math.cos(t),
      si = Math.sin(t);
    pts.push([x + w * c * (0.75 + 0.25 * si), y + h * 0.55 + h * 0.5 * si]);
  }
  p.shadedFill(pts, BAG, BAG_D, rad(-120), w);
  p.poly(pts, null, 2.8 * u);
  p.stroke([[x - 14 * u, y + 2 * u], [x + 14 * u, y + 2 * u]], 3 * u, "#8a6a3a");
};
/** brass balance scale hanging from the hand at (x, y); tilt + = right pan down */

export const drawScale = (p: Pen, x: number, y: number, u: number, tilt = 0) => {
  const B = "#d8a83a",
    BD = "#9a7224",
    L = 62 * u,
    c = Math.cos(tilt),
    s2 = Math.sin(tilt);
  p.ell(x, y, 6 * u, 6 * u, null, 2.4 * u);
  p.stroke([[x, y + 4 * u], [x, y + 16 * u]], 3 * u, INK);
  const ends: P2[] = [[x - L * c, y + 16 * u - L * s2], [x + L * c, y + 16 * u + L * s2]];
  p.band([ends[0], ends[1]], B, 5 * u, 1.6 * u, "round");
  p.ell(x, y + 16 * u, 6 * u, 6 * u, B, 2 * u);
  for (const [ex, ey] of ends) {
    p.stroke([[ex, ey], [ex - 14 * u, ey + 40 * u]], 1.6 * u, BD);
    p.stroke([[ex, ey], [ex + 14 * u, ey + 40 * u]], 1.6 * u, BD);
    p.ell(ex, ey + 41 * u, 20 * u, 6 * u, B, 2.2 * u, 0, 180);
    p.stroke([[ex - 20 * u, ey + 41 * u], [ex + 20 * u, ey + 41 * u]], 2.2 * u, INK);
  }
};
/** THE magic stick: 0.30 m long (cut: 0.25 m), 0.022 m thick, at the cast scale SU = 0.00216 m per design unit */

export const STICK_LEN = 0.3 / 0.00216,
  STICK_CUT_LEN = 0.25 / 0.00216,
  STICK_THICK = 0.022 / 0.00216,
  STICK_GRIP = 0.42;
const STICK_BROWN = "#8a5530",
  STICK_DARK = "#6a3e22",
  STICK_PALE = "#e8c99a";
/** sheet-only 2D stick. (x, y) = the hand centre on the shaft, rot = degrees clockwise from straight up (axis runs base -> top),
 *  len in design units (STICK_LEN / STICK_CUT_LEN), cut = pale flat cut end at the top, grip = hand position as a fraction from the base */

export const drawStick = (p: Pen, x: number, y: number, u: number, rot = 0, len = STICK_LEN, cut = false, grip = STICK_GRIP, th = STICK_THICK) => {
  const r = rad(rot),
    ax = Math.sin(r),
    ay = -Math.cos(r),
    nx = -ay,
    ny = ax,
    t = th,
    rim = 1.9 * u;
  const b0: P2 = [x - ax * len * grip, y - ay * len * grip],
    b1: P2 = [x + ax * len * (1 - grip), y + ay * len * (1 - grip)];
  p.band([b0, b1], STICK_BROWN, t, rim, cut ? "butt" : "round");
  p.stroke([[b0[0] + nx * t * 0.26 - ax * 1, b0[1] + ny * t * 0.26 - ay * 1], [b1[0] + nx * t * 0.26, b1[1] + ny * t * 0.26]], t * 0.42, STICK_DARK);
  for (const f of [0.28, 0.7]) {
    const q0: P2 = [b0[0] + (b1[0] - b0[0]) * f, b0[1] + (b1[1] - b0[1]) * f];
    p.stroke([[q0[0] - nx * t * 0.46, q0[1] - ny * t * 0.46], [q0[0] + nx * t * 0.46, q0[1] + ny * t * 0.46]], 1.5 * u, STICK_DARK);
  }
  if (cut) p.poly([[b1[0] + nx * t / 2, b1[1] + ny * t / 2], [b1[0] - nx * t / 2, b1[1] - ny * t / 2], [b1[0] - nx * t / 2 - ax * 7, b1[1] - ny * t / 2 - ay * 7], [b1[0] + nx * t / 2 - ax * 7, b1[1] + ny * t / 2 - ay * 7]], STICK_PALE, 1.7 * u);
};
/** sheet-only 2D kitchen knife; (x, y) = the fist on the wooden handle, blade pointing along rot (deg clockwise from up) */

export const drawKnife = (p: Pen, x: number, y: number, u: number, rot = 0) => {
  const r = rad(rot),
    ax = Math.sin(r),
    ay = -Math.cos(r),
    nx = -ay,
    ny = ax,
    P = (a: number, n: number): P2 => [x + ax * a + nx * n, y + ay * a + ny * n];
  p.poly([P(14, -4.4), P(80, -9), P(96, -1), P(80, 4), P(14, 4.4)], "#dfe4ea", 2.2 * u);
  p.stroke([P(18, -1.4), P(80, -3)], 1.6 * u, "#aab3bd");
  p.poly([P(12, -6.5), P(15, -6.5), P(15, 6.5), P(12, 6.5)], "#b98a22", 1.8 * u);
  p.band([P(-26, 0), P(12, 0)], "#6a3a24", 9.5, 1.9 * u, "round");
};
const stickPlace = (p: Pen, prop: Prop, x: number, y: number, u: number, deg: number, nth = 0, state = 0) => {
  const hk = stickKind(prop);
  if (!hk) return;
  const len = hk === "stickCut" ? STICK_CUT_LEN : STICK_LEN;
  if (P3D) {
    if (REC.on) {
      const [cx, cy] = capPt(p, x, y),
        sc = capScale(p);
      const rec: PropRec = {
        kind: hk,
        n: state,
        x: cx,
        y: cy,
        ang: (p.rot ? p.rot[0] : 0) + rad(deg),
        u: u * sc,
        len: len * sc,
        grip: hk === "knife" ? 0.22 : STICK_GRIP
      };
      if (state === 2) REC.a.free = rec;else if (nth) REC.a.stick2 = rec;else REC.a.stick = rec;
    }
    return;
  }
  if (hk === "knife") drawKnife(p, x, y, u, deg);else drawStick(p, x, y, u, deg, len, hk === "stickCut");
};
const drawProp = (p: Pen, prop: Prop, x: number, y: number, u: number, tip = 0) => {
  if (isStick(prop)) {
    stickPlace(p, prop, x, y, u, tip);
    return;
  }
  const hk = heldKind(prop);
  if (P3D && hk) {
    if (REC.on) {
      const [cx, cy] = capPt(p, x, y);
      REC.a.prop = {
        kind: hk,
        n: Array.isArray(prop) ? prop[1] as number : 0,
        x: cx,
        y: cy,
        ang: (p.rot ? p.rot[0] : 0) + rad(hk === "sword" ? -80 + tip : tip),
        u: u * capScale(p)
      };
    }
    return;
  }
  if (prop === "bowl") drawBowl(p, x, y - 10 * u, u, tip);else if (prop === "goblet" || prop === "cup") drawGoblet(p, x, y - 8 * u, u * (prop === "cup" ? 0.85 : 1), tip);else if (Array.isArray(prop) && prop[0] === "vial") drawVial(p, x, y - 6 * u, u, VIALS[prop[1] % VIALS.length], tip);else if (prop === "vialGlow") drawVial(p, x, y - 6 * u, u * 1.25, "#7dff5a", tip, true);else if (prop === "snake") drawSnake(p, x, y, u);else if (prop === "napkin") drawNapkin(p, x, y, u);else if (Array.isArray(prop) && prop[0] === "tray") drawTray(p, x, y - 4 * u, u, prop[1]);else if (prop === "sword") drawSword(p, x, y, u, -80 + tip);else if (prop === "bundle") drawBundle(p, x, y, u);else if (prop === "loaf") drawLoaf(p, x, y - 6 * u, u, 1.35, -8);else if (prop === "roll") drawRoll(p, x, y - 6 * u, u);else if (prop === "bag" || prop === "bagFat") drawBag(p, x, y, u, prop === "bagFat");else if (Array.isArray(prop) && prop[0] === "scale") drawScale(p, x, y + 2 * u, u * 1.3, prop[1]);
};
const BUILD: Record<Build, {
  a: number;
  torso: number;
  legs: number;
  tw: number;
}> = {
  adult: {
    a: 118,
    torso: 1.1,
    legs: 1.4,
    tw: 0.8
  },
  stout: {
    a: 122,
    torso: 1.12,
    legs: 1.2,
    tw: 1.12
  },
  kid: {
    a: 120,
    torso: 0.72,
    legs: 0.82,
    tw: 0.7
  },
  slim: {
    a: 116,
    torso: 1.12,
    legs: 1.42,
    tw: 0.7
  },
  thin: {
    a: 112,
    torso: 1.12,
    legs: 1.48,
    tw: 0.62
  },
  round: {
    a: 118,
    torso: 1.0,
    legs: 1.2,
    tw: 0.9
  }
};
export type FrontOpts = {
  phase?: number;
  expr?: Expr;
  mode?: "march" | "stroll" | "stand" | "sit" | "fall";
  look?: number;
  blink?: boolean | number;
  lift?: number;
  prop?: Prop;
  tilt?: number;
  headTilt?: number;
  wave?: number;
  pose?: Pose;
  k?: number;
  tip?: number;
  back?: boolean;
  p3d?: boolean;
  hideArm?: -1 | 1 | 2;
  crown3d?: boolean;
  light?: number;
  facing?: -1 | 0 | 1;
  seed?: number;
  talk?: boolean;
  fx?: FaceFx;
  hand?: -1 | 1;
  cnt?: number;
  limbs?: LimbPose;
};
const footStroke = (p: Pen, a: P2, b: P2, w: number, col: string) => {
  if (col !== INK) p.stroke([a, b], w + 3, INK);
  p.stroke([a, b], w, col);
};
/** head metrics of the last bodyFront call (design units), so sheets can crop busts on any build */

export const LAST = {
  hc: 0,
  W: 0,
  HH: 0,
  crown: 0,
  chin: 0
};
export const bodyFront = (p: Pen, o0: Outfit, opts: FrontOpts) => {
  const o = toneOutfit(o0);
  const {
    phase = 0,
    expr = "neutral",
    mode = "march",
    look = 0,
    blink = false,
    lift = 60,
    prop = null,
    tilt = 0,
    headTilt = 0,
    wave,
    light = DEF_LIGHT,
    facing = 0,
    seed = 1
  } = opts;
  P3D = !!opts.p3d;
  CROWN3D = !!opts.crown3d;
  BACK = !!opts.back;
  try {
    const Bd = BUILD[o.build ?? "adult"],
      skin = o.skin ?? SKIN,
      two = Math.PI * 2,
      lid = lidOf(blink);
    const H0 = headBlob(seed, Bd.a, facing);
    const HB: Blob = o.round ? {
      ...H0,
      a: Bd.a * 1.12,
      b: Bd.a * 1.12 * 0.99,
      nTop: 2.0,
      nBot: 2.0,
      egg: 0.0,
      asym: 0,
      noise: 0.004
    } : H0;
    if (o.wide) {
      HB.a *= o.wide;
      HB.nBot = Math.min(HB.nBot, 2.1);
    }
    const D = o.dna,
      Hd: Blob = D ? dnaHead(HB, D) : HB,
      DB = dnaBuild(Bd, D),
      [pLean, pDrop] = postureOf(D);
    const hSt = opts.fx?.headSt ?? 1,
      H: Blob = hSt === 1 ? Hd : {
        ...Hd,
        a: Hd.a / Math.sqrt(hSt),
        b: Hd.b * Math.sqrt(hSt)
      };
    const W = 2 * HB.a,
      HH = 2 * HB.b,
      u = W / 100;
    const tall = (1 + DB.torso + DB.legs) * HH,
      sole = 975;
    const bob = mode === "march" ? 0.025 * tall * Math.cos(2 * two * phase) : mode === "stroll" ? 0.022 * tall * Math.cos(2 * two * phase) : 0;
    const torsoBot = mode === "sit" ? sole - 0.2 * HH : sole - DB.legs * HH + bob;
    const chin = torsoBot - DB.torso * HH,
      hc = chin - H.b + pDrop * 1.4 * HH,
      crown = hc - H.b,
      hipY = torsoBot - 0.12 * HH;
    Object.assign(LAST, {
      hc,
      W: 2 * H.a,
      HH: 2 * H.b,
      crown,
      chin
    });
    const thick = thickAngle(light),
      ow = 5 * u * (o.dna ? LOOK.ink : 1);
    const legCol = LIMB,
      armCol = LIMB,
      footCol = LIMB;
    const LS = limbStyle(W),
      legW = LS.leg,
      footW = LS.footW;
    const LR: LimbRig | null = opts.limbs ? rig({
      W,
      HH,
      chin,
      Ta: DB.tw / 2 * W / 1.06,
      build: o.build,
      legHH: (sole - hipY) / HH
    }) : null;
    const LL = LR && opts.limbs ? posed(LR, opts.limbs) : null;
    const legStroke = (pts: P2[]) => p.stroke(pts, legW, legCol);
    const jfoot = (a: P2, b: P2, side: number) => {
      footStroke(p, a, b, footW, footCol);
      if (!o.jutti) return;
      const c: P2[] = [b, [b[0] + side * 5 * u, b[1] - 0.8 * u], [b[0] + side * 9 * u, b[1] - 6 * u], [b[0] + side * 8.5 * u, b[1] - 11 * u]];
      p.stroke(c, footW * 0.62 + 3, INK);
      p.stroke(c, footW * 0.62, footCol);
      p.dot(c[3][0], c[3][1], footW * 0.3, footCol === INK ? INK : shade(footCol, 0.8));
    };
    p.rot = null;
    if (LL) drawLegs(p, LL.R, LL);else if (mode === "sit") {
      for (const side of [-1, 1]) {
        const h: P2 = [300 + side * 15 * u, hipY],
          k: P2 = [300 + side * 36 * u, hipY + 0.2 * HH],
          f: P2 = [300 + side * 44 * u, sole - 8 * u];
        legStroke(curve(h, k, f));
        jfoot([f[0] - side * 2 * u, f[1]], [f[0] + side * 12 * u, f[1] - 5 * u], side);
      }
    } else if (mode === "fall") {
      const legs: [P2, P2, P2][] = [[[300 - 15 * u, hipY], [300 - 46 * u, hipY + 0.5 * HH], [300 - 70 * u, hipY + 0.72 * HH]], [[300 + 15 * u, hipY], [300 + 50 * u, hipY + 0.45 * HH], [300 + 76 * u, hipY + 0.22 * HH]]];
      legs.forEach(([h, k, f], i) => {
        p.stroke(curve(h, k, f), legW, legCol);
        footStroke(p, f, [f[0] + (i ? 14 : -14) * u, f[1] + (i ? -6 : 4) * u], footW, footCol);
      });
    } else if (o.dress) {
      for (const [side, ph] of [[-1, 0], [1, 0.5]] as const) {
        const up = mode === "stroll" || mode === "march" ? Math.max(0, Math.sin(two * (phase + ph))) * 16 * u : 0;
        const fx = 300 + side * 12 * u,
          fy = sole - 4 * u - up;
        p.stroke([[fx, sole - 0.4 * HH], [fx + side * u, fy]], legW, legCol);
        footStroke(p, [fx - side * 3 * u, fy], [fx + side * 12 * u, fy + u], footW, footCol);
      }
    } else {
      const L = mode === "march" ? lift * 1.25 : mode === "stroll" ? lift * 1.3 : 0;
      for (const [side, ph] of [[-1, 0], [1, 0.5]] as const) {
        const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
        const hx = 300 + side * 15 * u,
          fx = 300 + side * 22 * u,
          fy = sole - 4 * u - up;
        const k: P2 = [(hx + fx) / 2 + side * (1.5 * u + up * 0.16), (hipY + fy) / 2 - up * 0.08];
        legStroke(curve([hx, hipY], k, [fx, fy]));
        jfoot([fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u], side);
      }
      if (o.lower === "dhoti") {
        const hy = hipY - 0.12 * HH,
          hem = hipY + 0.8 * (sole - hipY),
          w0 = 30 * u,
          w1 = 38 * u;
        const dh: P2[] = [[300 - w0, hy], [300 + w0, hy], [300 + w1, hem], [300 + 8 * u, hem + 0.05 * HH], [300 + 2 * u, hem - 0.16 * HH], [300 - 6 * u, hem + 0.07 * HH], [300 - w1, hem]];
        p.gradFill(dh, o.pants, mul(o.pants, SH_CLOTH), light);
        p.clip(dh, () => {
          for (const t of [-0.55, 0.25, 0.65]) p.stroke([[300 + t * w0, hy + 0.1 * HH], [300 + t * w1 * 1.1, hem]], 1.6 * u, mix(o.pants, INK, 0.3));
        });
        p.poly(dh, null, 3.4 * u);
      }
    }
    const sway = mode === "march" ? 1.6 * Math.sin(two * phase) : mode === "stroll" ? 1.0 * Math.sin(two * phase) : 0;
    const A = tilt + sway + pLean * 0.3 * facing;
    p.rot = A ? [rad(A), 300, hipY] : null;
    const dress = !!o.dress && mode !== "sit" && mode !== "fall";
    const BP = D?.body ? bodyParams(D) : null;
    const T: Blob = {
      a: DB.tw / 2 * W / 1.06,
      b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
      nTop: BP?.nTop ?? 2.2,
      nBot: BP?.nBot ?? 2.6,
      egg: BP?.egg ?? (o.build === "stout" ? 0.17 : 0.12),
      asym: 0.04 * facing,
      rot: 0,
      noise: 0.006,
      seed: seed + 7
    };
    const tcx = 300 + 3 * u * facing,
      tcy = torsoBot - T.b,
      tp = blobPts(tcx, tcy, T);
    const sh = (side: number): P2 => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
    const hang = (side: number, fwd: number): [P2, P2, P2] => {
      const S = sh(side),
        ex = tcx + side * (1.12 * T.a + 4 * u);
      const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
      return [S, [ex, S[1] + 0.48 * HH], [hx, chin + 1.04 * HH - Math.abs(fwd) * 9 * u]];
    };
    const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
    const R0: P2 = [300 - 47 * u, torsoBot + 0.12 * HH],
      R1: P2 = [300 - 64 * u, crown - 0.32 * HH];
    const rifle = (!!o.rifle || !!o.spear) && (mode === "march" || mode === "stand" || mode === "stroll");
    type Arm = {
      pts: [P2, P2, P2];
      front: boolean;
      after?: () => void;
      noDot?: boolean;
      late?: boolean;
      custom?: () => void;
    };
    const arms: Arm[] = [];
    if (mode === "sit") for (const side of [-1, 1]) arms.push({
      pts: [sh(side), [tcx + side * (1.1 * T.a + 6 * u), sh(side)[1] + 0.4 * HH], [tcx + side * (1.2 * T.a + 10 * u), torsoBot + 0.04 * HH]],
      front: false
    });else if (mode === "fall") for (const side of [-1, 1]) arms.push({
      pts: [sh(side), [tcx + side * (1.15 * T.a + 12 * u), sh(side)[1] - 0.25 * HH], [tcx + side * (1.3 * T.a + 24 * u), sh(side)[1] - 0.68 * HH]],
      front: false
    });else {
      if (rifle) {
        const G = lerp2(R0, R1, 0.1);
        arms.push({
          pts: [sh(-1), [tcx - 1.12 * T.a - 5 * u, sh(-1)[1] + 0.45 * HH], G],
          front: false
        }, {
          pts: hang(1, 0),
          front: false
        });
      } else arms.push({
        pts: prop === "shako" ? hang(-1, 0) : hang(-1, -sw),
        front: false
      });
      if (rifle) {} else if (wave !== undefined) {
        const S = sh(1);
        arms.push({
          pts: [S, [tcx + 1.1 * T.a + 10 * u + 3 * u * wave, S[1] - 0.22 * HH], [tcx + 1.18 * T.a + 16 * u + 12 * u * wave, S[1] - 0.6 * HH]],
          front: false
        });
      } else if (prop === "icecream") {
        const S = sh(1);
        arms.push({
          pts: [S, [tcx + 1.05 * T.a + 4 * u, S[1] + 0.45 * HH], [tcx + 0.5 * T.a, S[1] + 0.4 * HH]],
          front: true
        });
      } else if (Array.isArray(prop) && prop[0] === "hammer") {
        const S = sh(1),
          k = clamp(prop[1], 0, 1);
        const E = lerp2([tcx + 1.1 * T.a + 10 * u, S[1] - 0.15 * HH], [tcx + 1.2 * T.a + 10 * u, S[1] + 0.3 * HH], k);
        const Hd = lerp2([tcx + 1.15 * T.a + 14 * u, S[1] - 0.55 * HH], [tcx + 1.45 * T.a + 22 * u, S[1] + 0.35 * HH], k);
        arms.push({
          pts: [S, E, Hd],
          front: true
        });
      } else arms.push({
        pts: hang(1, sw),
        front: false
      });
    }
    const pose = opts.limbs ? undefined : opts.pose,
      kk = clamp(opts.k ?? 0, 0, 1),
      fs = facing || -1,
      ws = opts.hand ?? fs;
    let late: (() => void) | null = null;
    const lates: (() => void)[] = [],
      underArm: (() => void)[] = [];
    let gripped = false;
    const gripAt = (hnd: P2, deg: number, nth = 0): Partial<Arm> => {
      if (!isStick(prop)) return {};
      gripped = true;
      return {
        noDot: true,
        after: () => {
          stickPlace(p, prop, hnd[0], hnd[1], u, deg, nth);
          handDot(p, hnd[0], hnd[1], 5.5 * u, prop);
        }
      };
    };
    if (pose && mode !== "fall") {
      arms.length = 0;
      const L = (S: P2, E: P2, Hd: P2, front: boolean, x: Partial<Arm> = {}) => arms.push({
        pts: [S, E, Hd],
        front,
        ...x
      });
      const bob = 0.03 * HH * Math.sin(kk * Math.PI * 4);
      for (const sd of [-1, 1]) {
        const S = sh(sd),
          out = tcx + sd * (1.1 * T.a + 6 * u),
          isW = sd === ws;
        if (pose === "oath_heart") {
          if (isW) L(S, [out + sd * 2 * u, S[1] + 0.4 * HH], [tcx - sd * 0.3 * T.a, chin + 0.3 * HH], true);else {
            const hg = hang(sd, 0);
            L(hg[0], hg[1], hg[2], true, gripAt(hg[2], sd * 4));
          }
        } else if (pose === "oath_pray") {
          const hd: P2 = [tcx + sd * 2.5 * u, chin + 0.4 * HH + bob * 0.3];
          if (isW) L(S, [out + sd * 2 * u, S[1] + 0.42 * HH], hd, true, isStick(prop) ? {
            noDot: true,
            after: () => {
              stickPlace(p, prop, tcx, hd[1], u, -12 * ws);
              for (const q of [-1, 1]) handDot(p, tcx + q * 2.5 * u, hd[1], 5.5 * u, prop);
            }
          } : {});else L(S, [out + sd * 2 * u, S[1] + 0.42 * HH], hd, true, isStick(prop) ? {
            noDot: true
          } : {});
          if (isW && isStick(prop)) gripped = true;
        } else if (pose === "oath_sky") {
          const hd: P2 = [tcx + sd * (1.15 * T.a + 44 * u), S[1] - 0.8 * HH - 0.06 * HH * kk];
          L(S, [tcx + sd * (1.3 * T.a + 18 * u), S[1] - 0.25 * HH], hd, true, isW ? gripAt(hd, ws * 6) : {});
        } else if (pose === "cheeks") {
          const hd: P2 = [300 + sd * 41 * u, hc + 17 * u];
          L(S, [tcx + sd * (1.45 * T.a + 8 * u), S[1] + 0.2 * HH + bob * 0.4], hd, true, {
            late: true
          });
        } else if (pose === "hover") {
          const hd: P2 = [tcx + sd * 18 * u, chin + 0.46 * HH],
            sl = stickKind(prop) === "stickCut" ? STICK_CUT_LEN : STICK_LEN;
          L(S, [out + sd * 2 * u, S[1] + 0.44 * HH], hd, true, {
            noDot: true,
            after: () => handDot(p, hd[0], hd[1], 5.5 * u, prop, 1)
          });
          if (isStick(prop)) {
            gripped = true;
            if (sd === -1) underArm.push(() => stickPlace(p, prop, tcx - 0.08 * sl, hd[1] + 10 * u, u, 90, 0, 1));
          }
        } else if (pose === "hush") {
          const hd: P2 = [300 + sd * 8 * u, hc + 20 * u];
          L(S, [tcx + sd * (1.4 * T.a + 6 * u), S[1] + 0.12 * HH], hd, true, {
            late: true
          });
          if (isW && isStick(prop)) {
            const ax = tcx + sd * 1.0 * T.a,
              ay = S[1] + 0.40 * HH;
            underArm.push(() => stickPlace(p, prop, ax, ay, u, -sd * 9, 0, 1));
            gripped = true;
          }
        } else if (pose === "bundle") {
          if (sd === -ws) {
            const E: P2 = [tcx + sd * 1.2 * T.a, S[1] + 0.5 * HH],
              hd: P2 = [tcx - sd * 0.3 * T.a, chin + 0.5 * HH];
            const Cx = (E[0] + hd[0]) / 2 + sd * 6 * u,
              Cy = (E[1] + hd[1]) / 2 - 0.1 * HH,
              th = -sd * 14;
            L(S, E, hd, true, {
              custom: () => {
                p.stroke(curve(S, E, hd), 5.2 * u, armCol);
                const r = rad(th),
                  px = Math.cos(r),
                  py = Math.sin(r);
                const nb = opts.cnt ?? 9;
                for (let i = 0; i < nb; i++) {
                  const o2 = (i - (nb - 1) / 2) * 4.4 * u * (nb < 9 ? 1 + (9 - nb) * 0.03 : 1),
                    lenv = 1 - 0.07 * (i * 5 % 3);
                  drawStick(p, Cx + px * o2, Cy + py * o2, u, th + (i % 3 - 1) * 1.5, STICK_LEN * lenv, false, 0.5);
                }
                const b0: P2 = [Cx - px * 21 * u, Cy - py * 21 * u],
                  b1: P2 = [Cx + px * 21 * u, Cy + py * 21 * u];
                p.band([b0, b1], "#b8432f", 7 * u, 1.8 * u, "round");
                mitt(p, hd[0], hd[1], 5.5 * u);
              }
            });
          } else {
            const hg = hang(sd, mode === "stroll" || mode === "march" ? Math.sin(two * phase) : 0);
            const E: P2 = [tcx + sd * (1.4 * T.a + 22 * u), S[1] + 0.05 * HH],
              hd: P2 = [tcx + sd * (1.55 * T.a + 40 * u), S[1] - 0.06 * HH];
            const hnd = lerp2(hg[2], hd, kk);
            L(S, lerp2(hg[1], E, kk), hnd, true, kk > 0.25 ? gripAt(hnd, ws * 70) : {});
          }
        } else if (pose === "give") {
          if (isW) {
            const hd: P2 = [tcx + sd * (1.4 * T.a + 44 * u), S[1] + 0.0 * HH];
            L(S, [tcx + sd * (1.28 * T.a + 16 * u), S[1] + 0.08 * HH], hd, true, gripAt(hd, sd * 66));
          } else {
            const hg = hang(sd, 0);
            L(hg[0], hg[1], hg[2], false);
          }
        } else if (pose === "measure") {
          const hd: P2 = [tcx + sd * 0.16 * T.a, chin + 0.46 * HH + bob];
          L(S, [out + sd * 2 * u, S[1] + 0.44 * HH], hd, true, gripAt(hd, 0, isW ? 0 : 1));
        } else if (pose === "take") {
          if (isW) {
            const hr: P2 = [tcx + sd * (0.98 * T.a + 8 * u), S[1] + 0.64 * HH],
              er: P2 = [tcx + sd * 1.26 * T.a, S[1] + 0.42 * HH];
            const he: P2 = [tcx + sd * (1.3 * T.a + 30 * u), S[1] + 0.2 * HH],
              ee: P2 = [tcx + sd * (1.28 * T.a + 14 * u), S[1] + 0.3 * HH];
            const hd = lerp2(hr, he, kk);
            L(S, lerp2(er, ee, kk), hd, true, gripAt(hd, sd * (3 + 63 * kk)));
          } else {
            const hg = hang(sd, 0);
            L(hg[0], hg[1], hg[2], false);
          }
        } else if (pose === "gauge") {
          const hy = chin + 0.5 * HH;
          if (sd === -1) {
            const hd: P2 = [tcx - 10 * u, hy];
            L(S, [out - 2 * u, S[1] + 0.44 * HH], hd, true, {
              noDot: true,
              after: () => {
                stickPlace(p, "stick", hd[0], hd[1], u, 0, 0);
                handDot(p, hd[0], hd[1], 5.5 * u, "stick");
              }
            });
          } else {
            const hc: P2 = [tcx + 10 * u, hy],
              hm: P2 = [tcx + sd * (1.55 * T.a + 40 * u), S[1] - 0.06 * HH],
              hd = lerp2(hc, hm, kk);
            const holding = (opts.cnt ?? 0) > 0;
            L(S, lerp2([out + 2 * u, S[1] + 0.44 * HH], [tcx + 1.28 * T.a + 16 * u, S[1] + 0.08 * HH], kk), hd, true, {
              noDot: true,
              after: () => {
                if (holding) stickPlace(p, "stick", hd[0], hd[1], u, 66 * kk, 1);
                handDot(p, hd[0], hd[1], 5.5 * u, holding ? "stick" : null);
              }
            });
          }
        } else if (pose === "toss") {
          if (isW) {
            const hd: P2 = [tcx + sd * (1.28 * T.a + 34 * u), S[1] - 0.6 * HH - 0.1 * HH * kk];
            L(S, [tcx + sd * (1.3 * T.a + 14 * u), S[1] - 0.12 * HH], hd, false);
            if (isStick(prop)) {
              gripped = true;
              lates.push(() => {
                p.rot = bodyRot;
                const x = hd[0] + sd * 12 * u,
                  y = hd[1] - (62 + 30 * kk) * u * 0.9;
                stickPlace(p, prop, x, y, u, sd * (30 + 70 * kk), 0, 2);
                for (const a of [-1, 0, 1]) p.stroke(curve([hd[0] + sd * (a * 12 - 14) * u, hd[1] - 22 * u], [hd[0] + sd * (a * 14 - 18) * u, hd[1] - 36 * u], [hd[0] + sd * (a * 12 - 12) * u, hd[1] - 46 * u], 5), 1.8 * u, INK);
              });
            }
          } else {
            const hg = hang(sd, 0);
            L(hg[0], hg[1], hg[2], false);
          }
        } else if (pose === "laugh_belly") {
          L(S, [tcx + sd * (1.38 * T.a + 10 * u), S[1] + 0.4 * HH], [tcx + sd * 0.42 * T.a, torsoBot - 0.5 * HH + bob * 1.6], true);
        } else if (pose === "wag") {
          if (isW) {
            const sn = Math.sin(kk * Math.PI * 2),
              hd: P2 = [tcx + sd * (1.2 * T.a + 50 * u) + sd * 6 * u * sn, S[1] - 0.3 * HH];
            L(S, [tcx + sd * (1.28 * T.a + 16 * u), S[1] + 0.22 * HH], hd, true, gripAt(hd, ws * (6 + 30 * sn)));
          } else {
            const hg = hang(sd, 0);
            L(hg[0], hg[1], hg[2], false);
          }
        } else if (pose === "lie") {
          const hd: P2 = [tcx + sd * 3 * u, chin + 0.46 * HH];
          L(S, [out + sd * 2 * u, S[1] + 0.4 * HH], hd, true, isStick(prop) ? {
            noDot: true,
            after: isW ? () => {
              stickPlace(p, prop, tcx, hd[1], u, ws * 64);
              for (const q of [-1, 1]) handDot(p, tcx + q * 3 * u, hd[1], 5.5 * u, prop);
            } : undefined
          } : {});
          if (isW && isStick(prop)) gripped = true;
        } else if (pose === "crossed") L(S, [tcx + sd * (1.12 * T.a), S[1] + 0.42 * HH], [tcx - sd * 0.42 * T.a, S[1] + 0.34 * HH + (sd > 0 ? 4 * u : 0)], true);else if (pose === "hips") L(S, [tcx + sd * (1.45 * T.a + 14 * u), S[1] + 0.3 * HH], [tcx + sd * 0.98 * T.a, torsoBot - 0.28 * HH], false);else if (pose === "shrug") {
          const up = 0.02 + 0.12 * kk;
          L(S, [tcx + sd * (1.18 * T.a + 8 * u), S[1] + 0.34 * HH], [tcx + sd * (1.3 * T.a + 14 * u), S[1] - up * HH], false);
        } else if (pose === "hold") L(S, [out + sd * 2 * u, S[1] + 0.48 * HH], [tcx + sd * 0.3 * T.a, S[1] + 0.58 * HH], true);else if (pose === "knead") {
          const bob = (sd > 0 ? kk : 1 - kk) * 0.1 * HH;
          L(S, [out + sd * 4 * u, S[1] + 0.5 * HH], [tcx + sd * 0.42 * T.a, torsoBot - 0.02 * HH + bob], true);
        } else if (pose === "raise" && sd === fs) L(S, [tcx + sd * (1.15 * T.a + 16 * u), S[1] - 0.1 * HH], [tcx + sd * (1.2 * T.a + 30 * u), S[1] - 0.25 * HH - 0.25 * HH * kk], false);else if ((pose === "reach" || pose === "point") && sd === fs) {
          const k2 = pose === "point" ? 1 : kk,
            hg = hang(sd, 0);
          const E = lerp2(hg[1], [tcx + sd * (1.35 * T.a + 22 * u), S[1] + 0.05 * HH], k2),
            Hd = lerp2(hg[2], [tcx + sd * (1.55 * T.a + 62 * u), S[1] + 0.02 * HH], k2);
          L(S, E, Hd, true, pose === "point" && isStick(prop) ? gripAt(Hd, sd * 90) : {});
        } else if (pose === "drink" && sd === fs) {
          const E = lerp2([tcx + sd * (1.2 * T.a + 10 * u), S[1] + 0.32 * HH], [tcx + sd * (1.32 * T.a + 20 * u), S[1] + 0.02 * HH], kk);
          const Hd = lerp2([tcx + sd * 0.35 * T.a, S[1] + 0.5 * HH], [300 + sd * 26 * u, hc + 24 * u], kk);
          L(S, E, Hd, true);
        } else if (pose === "wipe" && sd === fs) {
          L(S, [tcx + sd * (1.3 * T.a + 18 * u), S[1] + 0.05 * HH], [300 + sd * (24 - 30 * kk) * u, hc + 22 * u], true);
        } else if (pose === "flex") {
          const up = 0.5 + 0.5 * kk,
            E: P2 = [tcx + sd * (1.4 * T.a + 28 * u), S[1] - 0.02 * HH],
            Hd: P2 = [tcx + sd * (1.1 * T.a + 18 * u), S[1] - 0.55 * HH * up];
          L(S, E, Hd, false);
        } else if (pose === "plead") {
          const b = 0.04 * HH * Math.sin(kk * Math.PI * 4);
          L(S, [out + sd * 2 * u, S[1] + 0.46 * HH], [tcx + sd * 4 * u, S[1] + 0.36 * HH + b], true);
        } else if (pose === "present") {
          L(S, [out + sd * 4 * u, S[1] + 0.4 * HH], [tcx + sd * (0.42 * T.a + 6 * u * kk), S[1] + 0.36 * HH - 0.06 * HH * kk], true);
        } else {
          const hg = hang(sd, 0);
          L(hg[0], hg[1], hg[2], false);
        }
      }
    }
    if (isStick(prop) && !pose && mode !== "fall" && mode !== "sit" && !rifle) {
      const sd = ws,
        S = sh(sd),
        hnd: P2 = [tcx + sd * (0.98 * T.a + 8 * u), S[1] + 0.64 * HH];
      arms[sd < 0 ? 0 : 1] = {
        pts: [S, [tcx + sd * (1.26 * T.a), S[1] + 0.42 * HH], hnd],
        front: true,
        ...gripAt(hnd, sd * 3)
      };
    }
    if (o.robe || o.dress) for (const a of arms) a.front = true;
    if (LL) arms.length = 0;
    const drawArm = (a: Arm) => {
      if (opts.hideArm && (opts.hideArm === 2 || Math.sign(a.pts[0][0] - tcx) === opts.hideArm)) return;
      if (pose === "flex") {
        p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 9 * u, INK);
        p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 6 * u, skin);
        const bx = (a.pts[0][0] + a.pts[1][0]) / 2,
          by = (a.pts[0][1] + a.pts[1][1]) / 2 - (3 + 6 * kk) * u;
        p.ell(bx, by, (8 + 5 * kk) * u, (6 + 6 * kk) * u, skin, 2.6 * u);
        mitt(p, a.pts[2][0], a.pts[2][1], 6.5 * u);
        return;
      }
      const cv = curve(a.pts[0], a.pts[1], a.pts[2]);
      p.stroke(cv, 5.2 * u, armCol);
      if (o.bangles) for (const dk of [4, 7.5]) {
        const e = a.pts[2],
          pv = a.pts[1],
          dx = e[0] - pv[0],
          dy = e[1] - pv[1],
          l = Math.hypot(dx, dy) || 1,
          ux = dx / l,
          uy = dy / l,
          cxp = e[0] - ux * dk * u * 1.4,
          cyp = e[1] - uy * dk * u * 1.4;
        p.stroke([[cxp - uy * 3.9 * u, cyp + ux * 3.9 * u], [cxp + uy * 3.9 * u, cyp - ux * 3.9 * u]], 3.6 * u, INK);
        p.stroke([[cxp - uy * 3.9 * u, cyp + ux * 3.9 * u], [cxp + uy * 3.9 * u, cyp - ux * 3.9 * u]], 2 * u, "#f0c24a");
      }
      if (!a.noDot) mitt(p, a.pts[2][0], a.pts[2][1], 5.5 * u);
    };
    if (o.cape && !opts.back) {
      const cp: P2[] = [[tcx - 0.9 * T.a, chin + 0.06 * HH], [tcx + 0.9 * T.a, chin + 0.06 * HH], [300 + 1.45 * T.a, sole - 0.3 * HH], [300 + 0.4 * T.a, sole - 0.22 * HH], [300 - 0.5 * T.a, sole - 0.26 * HH], [300 - 1.45 * T.a, sole - 0.3 * HH]];
      p.gradFill(cp, shade(o.cape, 0.85), mul(o.cape, SH_CLOTH), light);
      p.poly(cp, null, ow * 0.9);
    }
    if (rifle && o.spear) {
      const s0: P2 = [300 - 50 * u, sole - 6 * u],
        s1: P2 = [300 - 58 * u, crown - 0.75 * HH];
      p.band([s0, s1], "#8a5a34", 4 * u, 1.4 * u, "round");
      p.poly([[s1[0] - 7 * u, s1[1] + 4 * u], [s1[0] + 1 * u, s1[1] - 30 * u], [s1[0] + 8 * u, s1[1] + 4 * u]], "#d9a048", 2.2 * u);
    } else if (rifle) {
      p.band([R0, R1], "#7a4b2a", 5 * u, 1.5 * u, "round");
      p.band([lerp2(R0, R1, 0.6), R1], "#8d949c", 2.4 * u, 1.2 * u, "round");
    }
    if (o.sword && mode !== "sit") {
      const s0: P2 = [tcx - 0.75 * T.a, torsoBot - 0.2 * HH];
      p.band([s0, [s0[0] - Math.sin(rad(25)) * 0.8 * HH, s0[1] + Math.cos(rad(25)) * 0.8 * HH]], "#c9ccd2", 3 * u, 1.2 * u, "round");
    }
    for (const a of arms) if (!a.front) drawArm(a);
    if (LL) drawArms(p, LL.R, LL, "back");
    const xcF = tcx + 3 * u * facing + 0.05 * T.a * facing;
    const robeFrac = mode === "sit" ? 0.93 : o.robeLen ?? (o.robe === "jama" ? 0.86 : o.robe === "angarkha" ? 0.56 : 0.5);
    const hemY = torsoBot + (sole - torsoBot) * robeFrac,
      y0s = torsoBot - 0.22 * HH;
    const wTop = 0.97 * T.a,
      wHem = T.a * (o.robe === "jama" ? 1.72 : o.robe === "angarkha" ? 1.2 : 1.05) * (mode === "sit" ? 1.12 : 1);
    const trimC = o.trim ?? "#f0c24a";
    const hemAt = (t: number) => {
      const x = tcx - wHem + 2 * wHem * t;
      const dy = o.robe === "jama" ? 6 * u * Math.abs(Math.sin(t * Math.PI * 4)) : o.robe === "angarkha" ? 0.07 * HH * (2 * t - 1) * (facing || 1) * -1 + 3 * u * Math.abs(Math.sin(t * Math.PI * 3)) : 0;
      const sw2 = mode === "march" || mode === "stroll" ? 3 * u * Math.sin(two * phase + t * 4) : 0;
      return [x + sw2, hemY + dy] as P2;
    };
    const brocadeOn = (x0: number, x1: number, ya: number, yb: number, col: string) => {
      let row = 0;
      for (let y = ya; y < yb; y += 0.11 * HH, row++) for (let x = x0 + row % 2 * 0.1 * T.a; x < x1; x += 0.2 * T.a) {
        p.poly([[x, y - 4.2 * u], [x + 3.2 * u, y], [x, y + 4.2 * u], [x - 3.2 * u, y]], col, 0);
        p.dot(x + 0.1 * T.a, y + 0.055 * HH, 1.5 * u, col);
      }
    };
    const quiltOn = (x0: number, x1: number, ya: number, yb: number, col: string) => {
      const st = 0.2 * HH;
      for (let d = -(yb - ya); d < x1 - x0; d += st) {
        p.stroke([[x0 + d, ya], [x0 + d + (yb - ya), yb]], 1.6 * u, col);
        p.stroke([[x0 + d + (yb - ya), ya], [x0 + d, yb]], 1.6 * u, col);
      }
    };
    const drawSkirt = () => {
      if (o.robe && !(o.dress && mode !== "sit")) {
        const L: P2[] = [],
          R2: P2[] = [],
          n = 10;
        for (let i = 0; i <= n; i++) {
          const t = i / n,
            y = y0s + (hemY - y0s) * t,
            w = wTop + (wHem - wTop) * t ** (o.robe === "jama" ? 0.75 : 1.2);
          L.push([tcx - w, y]);
          R2.push([tcx + w, y]);
        }
        const hem: P2[] = [];
        for (let i = 1; i < 16; i++) hem.push(hemAt(i / 16));
        const sk: P2[] = [...L, ...hem, ...R2.reverse()];
        p.gradFill(sk, o.jacket, mul(o.jacket, SH_CLOTH), light);
        p.clip(sk, () => {
          if (o.brocade) brocadeOn(tcx - wHem, tcx + wHem, torsoBot + 0.02 * HH, hemY, o.brocade);
          if (o.quilt) quiltOn(tcx - wHem, tcx + wHem, torsoBot - 0.1 * HH, hemY, mix(o.jacket, INK, 0.3));
          if (o.robe === "jama") p.stroke(hem.map(([x, y]) => [x, y - 0.045 * HH] as P2), 0.07 * HH, trimC);
          if (o.robe === "angarkha") p.stroke([[tcx + (facing || 1) * 0.55 * T.a, torsoBot - 0.18 * HH], [tcx + (facing || 1) * 0.6 * T.a, hemY + 0.1 * HH]], 2.2 * u, mix(o.jacket, INK, 0.45));
          if (o.robe === "kurta" && !o.quilt) for (const sd of [-1, 1]) p.stroke([[tcx + sd * wHem * 0.93, hemY - 0.14 * HH], [tcx + sd * wHem * 0.95, hemY + 4 * u]], 2 * u, mix(o.jacket, INK, 0.4));
          if (o.robe === "jama" && !opts.back) p.band([[xcF, torsoBot - 0.1 * HH], [xcF, hemY + 0.05 * HH]], trimC, 0.05 * HH, 1.3 * u);
          if (opts.back) p.stroke([[tcx, torsoBot - 0.1 * HH], [tcx, hemY + 0.05 * HH]], 2 * u, mix(o.jacket, INK, 0.4));
        });
        p.stroke(sk, ow, INK);
        if (mode === "sit") for (const side of [-1, 1]) {
          const fx2 = 300 + side * 44 * u,
            fy2 = sole - 8 * u;
          jfoot([fx2 - side * 2 * u, fy2], [fx2 + side * 12 * u, fy2 - 5 * u], side);
        }
      }
    };
    const hairPre = !!(D?.hair && D.hair !== "none");
    if (hairPre) {
      const r0 = p.rot,
        Ah0 = A + headTilt + (pose === "laugh_belly" ? -9 * fs * (0.55 + 0.45 * kk) : 0),
        [qx, qy] = rotAbout([300, chin], rad(A), [300, hipY]);
      p.rot = Ah0 ? [rad(Ah0), 300, chin, qx - 300, qy - chin] : null;
      hairUnderM1(p, o, H, hc, 300, opts.back ? "back" : "front", false, () => hairBehind(hairCtxOf(p, o, D!.hair!, H, blobPts(300, hc, H), 300, hc, facing, opts.back ? "back" : "front", light, thick, ow, seed)));
      p.rot = r0;
    }
    if (dress) {
      const D: Blob = {
        a: 0.5 * W * 0.98,
        b: 0.5 * (sole - 0.35 * HH - (chin - 0.2 * HH)),
        nTop: 2.0,
        nBot: 3.0,
        egg: 0.35,
        asym: 0.03 * facing,
        rot: 0,
        noise: 0.006,
        seed: seed + 9
      };
      const dp = blobPts(300, sole - 0.35 * HH - D.b, D);
      p.gradFill(dp, o.dress!, mul(o.dress!, SH_CLOTH), light);
      if (o.trim) p.clip(dp, () => {
        const yb = sole - 0.35 * HH + D.b * 0.92;
        p.band([[0, yb], [600, yb]], o.trim!, 0.1 * HH, 1.2 * u);
        p.band([[300 + 0.05 * W * facing, chin], [300 + 0.05 * W * facing, sole]], o.trim!, 0.06 * HH, 1.2 * u);
      });
      if (o.dna && o.belt && !opts.back) p.clip(dp, () => {
        const yw = chin + 0.5 * HH;
        p.band([[0, yw], [600, yw]], o.belt!, 0.07 * HH, 1.4 * u);
      });
      p.inkRing(dp, ow, thick);
      const Sw: Blob = {
        a: 0.37 * W,
        b: 0.3 * HH,
        nTop: 2.2,
        nBot: 2.4,
        egg: 0.1,
        asym: 0,
        rot: 0,
        noise: 0.006,
        seed: seed + 8
      };
      const sp = blobPts(300, chin + 0.12 * HH, Sw);
      p.gradFill(sp, o.jacket, mul(o.jacket, SH_CLOTH), light);
      if (o.dna?.topCol && !opts.back) p.clip(sp, () => {
        const xc = 300 + 0.03 * W * facing,
          hw = 0.42 * Sw.a;
        p.poly([[xc - hw, chin - 0.1 * HH], [xc + hw, chin - 0.1 * HH], [xc, chin + 0.24 * HH]], o.dna!.topCol!, 1.4 * u);
      });
      p.inkRing(sp, ow * 0.9, thick);
    } else {
      p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
      p.clip(tp, () => {
        if (o.belt) {
          for (const s of [-1, 1]) p.band([[tcx - s * 0.75 * T.a, chin - 0.05 * HH], [tcx + s * 0.8 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
          const xc = tcx + 0.025 * T.a,
            yc = chin - 0.05 * HH + (torsoBot - 0.1 * HH - (chin - 0.05 * HH)) * (0.75 / 1.55);
          p.poly([[xc - 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc + 3.5 * u], [xc - 3.5 * u, yc + 3.5 * u]], "#d9dde0", 1.5 * u);
        }
        if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
        if (o.brocade && o.robe === "jama") brocadeOn(tcx - T.a, tcx + T.a, chin + 0.12 * HH, torsoBot, o.brocade);
        if (o.quilt) quiltOn(tcx - T.a, tcx + T.a, chin, torsoBot, mix(o.jacket, INK, 0.3));
        if (o.robe === "jama" && !opts.back) p.band([[xcF, chin + 0.12 * HH], [xcF, torsoBot]], trimC, 0.05 * HH, 1.3 * u);
        if (o.robe === "angarkha" && !opts.back) {
          const sd = facing || 1,
            a0: P2 = [tcx - sd * 0.18 * T.a, chin + 0.02 * HH],
            a1: P2 = [tcx + sd * 0.82 * T.a, chin + 0.62 * HH],
            flap = curve(a0, [tcx + sd * 0.3 * T.a, chin + 0.42 * HH], a1, 12);
          const big: P2[] = [...flap, [tcx + sd * 1.3 * T.a, chin + 0.62 * HH], [tcx + sd * 1.3 * T.a, chin - 0.2 * HH], [tcx + sd * 0.4 * T.a, chin - 0.2 * HH]];
          p.shadedFill(big, mix(o.jacket, "#ffffff", 0.35), mul(o.jacket, SH_CLOTH), light, T.a, 0.4);
          p.stroke(flap, 2.6 * u);
          p.stroke([[a1[0] - sd * 3 * u, a1[1] - 0.04 * HH], [a1[0] - sd * 10 * u, a1[1] + 0.2 * HH]], 1.8 * u, mix(o.jacket, INK, 0.45));
        }
        if (o.robe === "kurta" && !opts.back && !o.quilt) {
          p.stroke([[xcF, chin + 0.04 * HH], [xcF, chin + 0.55 * HH]], 2.2 * u, mix(o.jacket, INK, 0.45));
          for (const k2 of [0.2, 0.38]) {
            p.dot(xcF + 3 * u, chin + k2 * HH, 2.4 * u, INK);
            p.dot(xcF + 3 * u, chin + k2 * HH, 1.5 * u, mix(o.jacket, "#ffffff", 0.5));
          }
        }
        if (!opts.back && o.dna?.worn && LOOK.worn) wornDetail(p, o, tcx, chin, torsoBot, HH, T.a, u, facing, seed);
        if (!opts.back && !o.robe && o.dna?.top && o.dna.top !== "buttons") topDetail(p, o, o.dna.top, tcx, chin, torsoBot, HH, T.a, u, facing, skin);else if (!opts.back && !o.robe) for (let i = 0; i < 4; i++) {
          const y = chin + 0.12 * HH + i * 0.2 * HH;
          if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
          p.dot(tcx + 2 * u * facing, y, 2.2 * u + 0.8 * u, INK);
          p.dot(tcx + 2 * u * facing, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
        }
      });
      if (o.sash) {
        const s = facing || 1;
        p.poly([[tcx + s * 0.55 * T.a, torsoBot - 0.3 * HH], [tcx + s * 0.75 * T.a, torsoBot + 0.05 * HH], [tcx + s * 0.45 * T.a, torsoBot + 0.02 * HH]], o.sash, 1.6 * u);
      }
      p.inkRing(tp, ow, thick);
      if (o.apron && mode !== "sit" && !opts.back) {
        const ax = tcx + 3 * u * facing,
          top = chin + 0.3 * HH,
          wB = 0.48 * T.a,
          wS = 0.86 * T.a,
          y0 = torsoBot - 0.42 * HH,
          y1 = torsoBot + 0.5 * HH;
        const bib: P2[] = [[ax - wB, top], [ax + wB, top], [ax + wB * 1.1, y0], [ax - wB * 1.1, y0]];
        const skirt: P2[] = [[ax - wS, y0], [ax + wS, y0], [ax + wS * 1.06, y1 - 8 * u], [ax + wS * 0.9, y1], [ax - wS * 0.9, y1], [ax - wS * 1.06, y1 - 8 * u]];
        p.gradFill(bib, o.apron, mul(o.apron, SH_CLOTH), light);
        p.poly(bib, null, 3 * u);
        p.gradFill(skirt, o.apron, mul(o.apron, SH_CLOTH), light);
        p.poly(skirt, null, 3.4 * u);
        p.stroke([[ax - wS * 1.04, y0], [ax + wS * 1.04, y0]], 5 * u, mul(o.apron, [0.78, 0.74, 0.7]));
        if (o.flour) for (let i = 0; i < 6; i++) p.ell(ax + (rnd(seed, 60 + i) - 0.5) * wS * 1.5, y0 + rnd(seed, 70 + i) * (y1 - y0) * 0.8, (4 + 5 * rnd(seed, 80 + i)) * u, (3 + 3 * rnd(seed, 90 + i)) * u, "#ffffff", 0);
      }
      if (o.flour) for (let i = 0; i < 5; i++) p.ell(tcx + (rnd(seed, 30 + i) > 0.5 ? 1 : -1) * T.a * (0.75 + 0.2 * rnd(seed, 31 + i)), chin + (0.15 + 0.6 * rnd(seed, 32 + i)) * HH, 5 * u, 3.5 * u, "#fbfaf6", 0);
      if (o.chain && !opts.back) {
        const pts: P2[] = [];
        for (let i = 0; i <= 10; i++) {
          const t = i / 10;
          pts.push([tcx - 0.62 * T.a + 1.24 * T.a * t, chin + 0.12 * HH + 0.32 * HH * Math.sin(Math.PI * t)]);
        }
        for (const q2 of pts) {
          p.dot(q2[0], q2[1], 4.4 * u, INK);
          p.dot(q2[0], q2[1], 3.2 * u, "#e8c45a");
        }
        p.ell(tcx, chin + 0.5 * HH, 9 * u, 9 * u, "#e8c45a", 2.2 * u);
        p.dot(tcx, chin + 0.5 * HH, 3 * u, "#b8323a");
      }
    }
    drawSkirt();
    if (o.patka) {
      const sd = facing || 1,
        py = torsoBot - 0.22 * HH,
        hh = 0.15 * HH,
        ww = 1.04 * T.a,
        pc = o.patka;
      const band: P2[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        band.push([tcx - ww + 2 * ww * t, py - hh / 2 + 3.5 * u * (1 - (2 * t - 1) ** 2)]);
      }
      for (let i = 12; i >= 0; i--) {
        const t = i / 12;
        band.push([tcx - ww + 2 * ww * t, py + hh / 2 + 3.5 * u * (1 - (2 * t - 1) ** 2)]);
      }
      if (!opts.back) {
        const kx = tcx + sd * 0.5 * T.a,
          ends: [number, number][] = [[-0.05, 0], [0.16, 0.06]];
        for (const [dx, k3] of ends) {
          const x1 = kx + sd * dx * T.a * 2,
            e: P2[] = [[x1 - 8 * u, py], [x1 + 8 * u, py], [x1 + 10 * u + k3 * 20 * u, py + 0.5 * HH], [x1 - 9 * u + k3 * 20 * u, py + 0.46 * HH]];
          p.shadedFill(e, pc, mul(pc, SH_CLOTH), light, 12 * u, 0.4);
          p.clip(e, () => {
            p.stroke([[x1 - 14 * u, py + 0.38 * HH], [x1 + 24 * u, py + 0.4 * HH]], 0.05 * HH, o.katar ? "#d8323a" : "#f4d58a");
          });
          p.poly(e, null, 2.6 * u);
          for (let i = 0; i < 5; i++) p.stroke([[x1 - 7 * u + i * 4.2 * u + k3 * 20 * u, py + 0.47 * HH], [x1 - 7.5 * u + i * 4.2 * u + k3 * 20 * u, py + 0.54 * HH]], 1.4 * u, mul(pc, [0.6, 0.6, 0.6]));
        }
      }
      p.shadedFill(band, pc, mul(pc, SH_CLOTH), light, ww, 0.4);
      if (o.katar) p.clip(band, () => {
        for (let i = 0; i < 8; i++) {
          const x = tcx - ww + 2 * ww * (i + 0.5) / 8;
          p.stroke([[x, py - hh / 2 - 4 * u], [x + 4 * u, py + hh / 2 + 4 * u]], 1.6 * u, "#d09a28");
        }
      });
      p.poly(band, null, 3 * u);
      if (!opts.back) {
        const kx = tcx + sd * 0.5 * T.a;
        p.ell(kx, py + 2 * u, 8 * u, 7 * u, mix(pc, "#ffffff", 0.08), 2.8 * u);
        p.stroke([[kx - 4 * u, py - 1 * u], [kx + 4 * u, py + 4 * u]], 1.5 * u, mul(pc, [0.6, 0.6, 0.6]));
      }
      if (o.katar) {
        const kx = tcx - sd * 0.28 * T.a,
          ky = py - hh * 0.5;
        p.poly([[kx - 3.4 * u, ky + 2 * u], [kx - 3.4 * u, ky - 0.3 * HH], [kx + 3.4 * u, ky - 0.3 * HH], [kx + 3.4 * u, ky + 2 * u]], "#b98a22", 2.2 * u);
        for (const dy of [0.3, 0.1]) p.poly([[kx - 9 * u, ky - dy * HH - 2 * u], [kx + 9 * u, ky - dy * HH - 2 * u], [kx + 9 * u, ky - dy * HH + 2 * u], [kx - 9 * u, ky - dy * HH + 2 * u]], "#f0c24a", 2 * u);
        p.dot(kx, ky - 0.3 * HH - 3 * u, 3 * u, "#d8323a");
      }
    }
    if (o.pearls && !opts.back && !dress) {
      for (const [k2, w2] of [[0.26, 0.42], [0.42, 0.48], [0.58, 0.54]] as const) {
        const a0: P2 = [tcx - w2 * T.a, chin + 0.03 * HH],
          a1: P2 = [tcx + w2 * T.a, chin + 0.03 * HH],
          c = curve(a0, [tcx + 3 * u * facing, chin + k2 * HH], a1, 18);
        for (let i = 0; i < c.length; i++) {
          p.dot(c[i][0], c[i][1], 3.4 * u, INK);
          p.dot(c[i][0], c[i][1], 2.5 * u, "#fffdf6");
        }
      }
      const gx = tcx + 3 * u * facing,
        gy = chin + 0.58 * HH + 2 * u;
      p.poly([[gx, gy - 6 * u], [gx + 6 * u, gy], [gx, gy + 7 * u], [gx - 6 * u, gy]], "#d8323a", 2 * u);
    }
    if (o.cape && opts.back) {
      const cp: P2[] = [[tcx - 0.95 * T.a, chin + 0.04 * HH], [tcx + 0.95 * T.a, chin + 0.04 * HH], [300 + 1.35 * T.a, sole - 0.3 * HH], [300 - 1.35 * T.a, sole - 0.3 * HH]];
      p.gradFill(cp, o.cape, mul(o.cape, SH_CLOTH), light);
      p.poly(cp, null, ow * 0.9);
    }
    if (o.shield && !opts.back && mode !== "sit" && mode !== "fall") {
      const sx = tcx - 0.95 * T.a,
        sy = chin + 0.62 * HH,
        r = 0.5 * HH;
      p.ell(sx, sy, r, r, o.shield, ow);
      p.ell(sx, sy, r * 0.82, r * 0.82, null, 2 * u);
      const st: P2[] = [];
      for (let k2 = 0; k2 < 16; k2++) {
        const a = k2 * Math.PI / 8 - Math.PI / 2,
          rr = k2 % 2 ? 0.12 * r : 0.34 * r;
        st.push([sx + rr * Math.cos(a), sy - 0.12 * r + rr * Math.sin(a)]);
      }
      p.poly(st, "#f0c24a", 1.6 * u);
      p.arc(sx, sy + 0.2 * r, 0.3 * r, 0.16 * r, 20, 160, 4 * u, "#f0c24a");
    }
    if (o.necklace && !opts.back) {
      const ny = chin + 0.62 * HH;
      p.stroke(curve([tcx - 0.42 * T.a, chin + 0.02 * HH], [tcx - 0.2 * T.a, ny - 0.12 * HH], [tcx - 4 * u, ny - 12 * u]), 2.6 * u, "#8a6a3a");
      p.stroke(curve([tcx + 0.42 * T.a, chin + 0.02 * HH], [tcx + 0.2 * T.a, ny - 0.12 * HH], [tcx + 4 * u, ny - 12 * u]), 2.6 * u, "#8a6a3a");
      drawLoaf(p, tcx, ny, u, 1.05, 4);
    }
    for (const f2 of underArm) f2();
    const bodyRot = p.rot;
    for (const a of arms) if (a.front) {
      if (a.custom) {
        a.custom();
        continue;
      }
      if (a.late) {
        lates.push(() => {
          p.rot = bodyRot;
          drawArm(a);
          a.after?.();
        });
        continue;
      }
      drawArm(a);
      if (a.after) {
        a.after();
        continue;
      }
      const [hx, hy] = a.pts[2];
      if (prop === "icecream") {
        p.poly([[hx - 8 * u, hy - 12 * u], [hx + 8 * u, hy - 12 * u], [hx, hy + 7 * u]], "#e0a35a", 1.8 * u);
        p.ell(hx, hy - 19 * u, 11 * u, 10 * u, "#f7c6d9", 2.2 * u);
        mitt(p, hx, hy, 5.5 * u);
      } else if (Array.isArray(prop) && prop[0] === "hammer") {
        const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
        const Rh = (pts: P2[]) => rotPts(pts, ang, hx, hy);
        p.band(Rh([[hx, hy + 12 * u], [hx, hy - 44 * u]]), "#8a5a34", 5 * u, 1.5 * u, "round");
        p.poly(Rh([[hx - 12 * u, hy - 58 * u], [hx + 20 * u, hy - 58 * u], [hx + 20 * u, hy - 42 * u], [hx - 12 * u, hy - 42 * u]]), "#7d848c", 2.2 * u);
        mitt(p, hx, hy, 5.5 * u);
      }
    }
    if (LL) drawArms(p, LL.R, LL, "front");
    if ((pose === "hold" || pose === "present" || pose === "plead") && prop) {
      const a0 = arms[0].pts[2],
        a1 = arms[1].pts[2],
        mx = (a0[0] + a1[0]) / 2,
        my = (a0[1] + a1[1]) / 2;
      drawProp(p, prop, mx, my + (prop === "bag" || prop === "bagFat" ? -6 * u : 0), u, (opts.tip ?? 0) * fs);
      handDot(p, a0[0], a0[1], 5.5 * u, prop);
      handDot(p, a1[0], a1[1], 5.5 * u, prop);
    } else if (prop && !gripped && prop !== "icecream" && prop !== "shako" && !(Array.isArray(prop) && prop[0] === "hammer")) {
      const arm = arms.find(a => Math.sign(a.pts[2][0] - tcx) === fs) ?? arms[arms.length - 1];
      const [hx, hy] = arm.pts[2];
      if (pose === "drink" || pose === "wipe") {
        const rot = p.rot;
        late = () => {
          p.rot = rot;
          drawArm(arm);
          drawProp(p, prop, hx, hy, u, (opts.tip ?? 0) * fs);
          handDot(p, hx, hy, 5.5 * u, prop);
        };
      } else {
        drawProp(p, prop, hx, hy, u, (opts.tip ?? 0) * fs);
        handDot(p, hx, hy, 5.5 * u, prop);
      }
    }
    if (prop === "shako") {
      const [hx, hy] = arms[0].pts[2];
      p.poly([[hx - 14 * u, hy + 3 * u], [hx + 14 * u, hy + 3 * u], [hx + 16 * u, hy + 30 * u], [hx - 16 * u, hy + 30 * u]], "#3a3d47", 2.2 * u);
      p.ell(hx, hy + 31 * u, 3.5 * u, 3.5 * u, "#2b7a4b", 1.5 * u);
      mitt(p, hx, hy, 5.5 * u);
    }
    const Ah = A + headTilt + (pose === "laugh_belly" ? -9 * fs * (0.55 + 0.45 * kk) : 0),
      [cpx, cpy] = rotAbout([300, chin], rad(A), [300, hipY]);
    p.rot = Ah ? [rad(Ah), 300, chin, cpx - 300, cpy - chin] : null;
    hatBehind(p, o, H, 300, hc, light, thick, ow, false);
    const hp = blobPts(300, hc, H);
    const hx0 = D?.hair && D.hair !== "none" ? hairCtxOf(p, o, D.hair, H, hp, 300, hc, facing, opts.back ? "back" : "front", light, thick, ow, seed) : null;
    if (hx0 && !hairPre) hairUnderM1(p, o, H, hc, 300, opts.back ? "back" : "front", false, () => hairBehind(hx0));
    if (opts.back && (!D || D.ears && D.ears !== "none")) for (const sd of [-1, 1]) {
      const ex = 300 + sd * 1.01 * H.a,
        ey = hc + 0.1 * H.b,
        ek = D?.ears === "big" ? 1.7 : D?.ears === "small" ? 1.15 : 1;
      p.ell(ex + sd * (ek - 1) * 0.06 * H.a, ey, 0.1 * H.a * ek, 0.17 * H.b * ek, mul(skin, SH_SKIN), 3.6 * u);
    } else if (D?.ears && D.ears !== "none") earsFront(p, D, H, 300, hc, facing, skin, ow);
    p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
    p.inkRing(hp, ow, thick);
    if (opts.back && hx0) {
      hairUnderM1(p, o, H, hc, 300, "back", true, () => hairOver(hx0));
      hatOn(p, o, hp, H, 300, hc, light, seed, 0, false, true);
      p.rot = null;
      return;
    }
    if (opts.back) {
      const hairC = mix(o.hair ?? "#4a3426", "#6a4228", 0.5);
      p.clip(hp, () => {
        const hl: P2[] = [];
        for (let i = 0; i <= 16; i++) {
          const t = -1.1 + 2.2 * i / 16;
          hl.push([300 + t * H.a, hc + (0.64 + 0.13 * (1 - Math.min(1, t * t) ** 1.2) - 0.08 * Math.abs(t)) * H.b]);
        }
        p.poly([...hl, [300 + 1.2 * H.a, hc + 1.3 * H.b], [300 - 1.2 * H.a, hc + 1.3 * H.b]], hairC, 0);
        p.stroke(hl, 1.6 * u, mix(hairC, INK, 0.4));
      });
      p.inkRing(hp, ow, thick);
      hatOn(p, o, hp, H, 300, hc, light, seed, 0, false, true);
      p.rot = null;
      return;
    }
    if (o.beard) {
      const bx = 300 + 7 * u * facing;
      p.clip(hp, () => p.ell(bx, hc + 0.74 * H.b, 0.9 * H.a, 0.44 * H.b, o.beard!, 0));
      const tuft = ellPts(bx, hc + 1.0 * H.b, 0.5 * H.a, 0.28 * H.b, 0, 180, 0, 24);
      p.poly(tuft, o.beard, ow * 0.8);
      p.inkRing(hp, ow, thick);
      p.ell(bx + 1 * u * facing, hc + 20 * u, 11 * u, 6.5 * u, skin, 0);
    }
    if (hx0) hairUnderM1(p, o, H, hc, 300, "front", true, () => hairOver(hx0));
    hatOn(p, o, hp, H, 300, hc, light, seed, facing, false);
    const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
    faceFront(p, o, 300, hc, 2 * H.a, expr, facing, look, lid, brim, skin, !!opts.talk, H, opts.fx);
    if (late) late();
    for (const f2 of lates) f2();
    p.rot = null;
  } finally {
    P3D = false;
    CROWN3D = false;
    BACK = false;
  }
};
/** soft flour puff on a 300 x 300 canvas (unlit, see-through) */

export const fxFlour = (p: Pen, seed: number) => {
  const g = p.g;
  for (let i = 0; i < 7; i++) {
    const a = rnd(seed, i) * Math.PI * 2,
      d = 40 * rnd(seed, i + 9),
      r = 55 + 40 * rnd(seed, i + 20);
    const x = 150 + Math.cos(a) * d,
      y = 150 + Math.sin(a) * d;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, "rgba(255,253,246,0.85)");
    gr.addColorStop(0.55, "rgba(252,248,238,0.55)");
    gr.addColorStop(1, "rgba(250,246,236,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 300, 300);
  }
};
/** gold coin, tumbling: phase 0..1 squashes it edge-on, on a 120 x 120 canvas */

export const fxCoin = (p: Pen, ph: number) => {
  const w = Math.max(8, 48 * Math.abs(Math.cos(ph * Math.PI)));
  p.ell(60, 60, w, 48, "#f0c24a", 7);
  if (w > 20) p.ell(60, 60, w * 0.6, 30, null, 4);
};
/** rising heat / drying wisp on a 160 x 400 canvas; t 0..1 */

export const fxWisp = (p: Pen, t: number) => {
  const pts: P2[] = [];
  for (let i = 0; i <= 20; i++) {
    const v = i / 20;
    pts.push([80 + 26 * Math.sin(v * 7 + t * 9), 380 - v * 340]);
  }
  p.g.globalAlpha = Math.max(0, Math.sin(Math.PI * t));
  p.stroke(pts, 14, "#ffffff");
  p.g.globalAlpha = 1;
};
export type SideOpts = {
  phase?: number;
  expr?: Expr;
  mode?: "march" | "stand" | "swing" | "push";
  blink?: boolean | number;
  stomp?: number;
  pose?: number;
  gait?: Gait;
  stride?: number;
  light?: number;
  seed?: number;
  hand?: [number, number];
  carry?: Prop;
  lean?: number;
  crown3d?: boolean;
  talk?: boolean;
};
const ik = (hip: P2, ank: P2, l1: number, l2: number): P2 => {
  const dx = ank[0] - hip[0],
    dy = ank[1] - hip[1],
    d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)),
    k = Math.atan2(dy, dx) - A;
  return [hip[0] + l1 * Math.cos(k), hip[1] + l1 * Math.sin(k)];
};
const SWING_HIP = 733;
/** metres the body travels per full walk cycle in the side view at scale 1 (the stance foot moves S design units per half
 *  cycle, so a cycle is 2 * S * SU; SU = 0.00216 m per design unit, cards are drawn 1 unit = SU * scale). Same S as bodySide. */

export const sideCycleM = (o: Outfit, stride = 1, seed = 1): number => {
  const Bd = BUILD[o.build ?? "adult"];
  let a = Bd.a;
  const hb = headBlob(seed, Bd.a, 1);
  let b = hb.b;
  if (o.round) {
    a = Bd.a * 1.12;
    b = a * 0.99;
  }
  if (o.wide) {
    a *= o.wide;
    if (!o.round) b = hb.b;
  }
  const HH = 2 * b,
    u = 2 * a / 100,
    legLen = (dnaBuild(Bd, o.dna).legs + 0.12) * HH - 4 * u;
  const S = (o.build === "kid" ? Math.min(370, 1.2 * legLen) : 370) * stride;
  return 2 * S * 0.00216;
};
/** design units the body travels per full cycle of a limb-engine gait (SideOpts.gait) in the side view at scale 1:
 *  stride * head width / duty. Metres: * 0.00216 (like sideCycleM). Plant the feet with card x += travel * (cycles + phase). */

export const sideGaitTravel = (o: Outfit, g: Gait, seed = 1): number => {
  const Bd = BUILD[o.build ?? "adult"];
  let a = Bd.a;
  if (o.round) a = Bd.a * 1.12;
  if (o.wide) a *= o.wide;
  return g.duty > 0 ? g.stride * 2 * a / g.duty : 0;
};
/** side view facing screen-right; march footfalls land at phase 0 (near foot) and 0.5 (far foot), like the front view.
 *  The stance foot is planted: it slides back at exactly the walking speed while the hip rises and falls over it. */

export const bodySide = (p: Pen, o0: Outfit, opts: SideOpts) => {
  const o = toneOutfit(o0);
  const {
    phase = 0,
    expr = "neutral",
    mode = "march",
    blink = false,
    stomp = 1,
    pose = 0,
    stride = 1,
    light = DEF_LIGHT,
    seed = 1
  } = opts;
  CROWN3D = !!opts.crown3d;
  BACK = false;
  P3D = false;
  const Bd = BUILD[o.build ?? "adult"],
    skin = o.skin ?? SKIN,
    two = Math.PI * 2,
    lid = lidOf(blink);
  const HB: Blob = {
    ...headBlob(seed, Bd.a, 1),
    asym: 0.12,
    rot: rad(3 + 3 * (rnd(seed, 7) - 0.5))
  };
  if (o.round) Object.assign(HB, {
    a: Bd.a * 1.12,
    b: Bd.a * 1.12 * 0.99,
    nTop: 2.0,
    nBot: 2.0,
    egg: 0.0
  });
  if (o.wide) {
    HB.a *= o.wide;
    HB.nBot = Math.min(HB.nBot, 2.1);
  }
  const D = o.dna,
    H: Blob = D ? {
      ...dnaHead(HB, D),
      asym: 0.12
    } : HB,
    DB = dnaBuild(Bd, D),
    [pLean, pDrop, pFwd] = postureOf(D);
  const W = 2 * HB.a,
    HH = 2 * HB.b,
    u = W / 100,
    sole = 975,
    ankY = sole - 4 * u;
  const thick = thickAngle(light),
    ow = 5 * u * (o.dna ? LOOK.ink : 1);
  const legLen = (DB.legs + 0.12) * HH - 4 * u,
    l1 = legLen / 2,
    l2 = legLen / 2;
  const nearCol = LIMB,
    farCol = LIMB,
    footCol = LIMB;
  type LegS = {
    ank: P2;
    pitch: number;
    near: boolean;
  };
  const legs: LegS[] = [];
  let hipY = ankY - legLen * 0.995,
    lean = 0,
    nearFwd = 0;
  const exLean = (opts.lean ?? 0) + pLean;
  let GL: GaitOut | null = null;
  if (opts.gait && mode !== "swing" && mode !== "push") {
    const Ta = (o.build === "stout" ? 0.36 : 0.31) * W * (DB.tw / BUILD[o.build ?? "adult"].tw) * (D?.body ? 0.85 : 1);
    const chin0 = hipY + 0.12 * HH - DB.torso * HH + 0.02 * HH;
    const R0 = shiftBody(rig({
      W,
      HH,
      chin: chin0,
      Ta,
      cx: 300,
      sole,
      build: o.build,
      view: "side",
      facing: 1,
      legHH: (sole - hipY) / HH
    }), 0, exLean);
    GL = limbGait(R0, phase, opts.gait);
  }
  if (GL) {
    hipY = GL.R.hip[0][1];
  } else if (mode === "march") {
    const S = (o.build === "kid" ? Math.min(370, 1.2 * legLen) : 370) * stride,
      liftH = Math.max(22, 40 + 70 * (stomp - 1));
    const st = (ph: number) => {
      const c = ((phase + ph) % 1 + 1) % 1;
      if (c < 0.5) {
        const s = c / 0.5;
        return {
          x: S / 2 - S * s,
          h: 0,
          stance: true,
          s
        };
      }
      const s = (c - 0.5) / 0.5;
      return {
        x: -S / 2 + S * s - S / Math.PI * Math.sin(2 * Math.PI * s),
        h: liftH * Math.sin(Math.PI * s),
        stance: false,
        s
      };
    };
    const nL = st(0),
      fL = st(0.5),
      stance = nL.stance ? nL : fL;
    const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
    hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
    for (const [L, near] of [[fL, false], [nL, true]] as const) legs.push({
      ank: [300 + L.x, ankY - L.h],
      pitch: L.stance ? 0 : rad(35 * Math.sin(Math.PI * L.s) * (1 - 1.6 * L.s)),
      near
    });
    lean = 4 + 3 * Math.cos(2 * two * phase);
    nearFwd = nL.x / (S / 2);
  } else if (mode === "push") {
    hipY = ankY - 0.87 * legLen;
    legs.push({
      ank: [300 - 0.5 * legLen, ankY],
      pitch: rad(-8),
      near: false
    }, {
      ank: [300 + 0.32 * legLen, ankY],
      pitch: 0,
      near: true
    });
    lean = 14 * pose;
  } else if (mode === "swing") {
    hipY = SWING_HIP;
    const a = rad(60 * pose);
    for (const [dx, near] of [[-6, false], [0, true]] as const) {
      const knee: P2 = [300 + l1 * 0.98 + dx * u, hipY + 6 * u];
      legs.push({
        ank: [knee[0] + l2 * Math.sin(a), knee[1] + l2 * Math.cos(a)],
        pitch: -a * 0.5,
        near
      });
    }
  } else {
    legs.push({
      ank: [300 - 4 * u, ankY],
      pitch: 0,
      near: false
    }, {
      ank: [300 + 4 * u, ankY],
      pitch: 0,
      near: true
    });
  }
  const torsoBot = hipY + 0.12 * HH,
    chin = torsoBot - DB.torso * HH,
    hc = chin - H.b + pDrop * 0.6 * HH,
    crown = hc - H.b,
    hip: P2 = [300, hipY];
  p.rot = null;
  if (GL) {
    drawLegs(p, GL.R, GL);
    if (o.jutti) for (const l of GL.legs) {
      if (!l.foot) continue;
      const b = l.foot[1],
        cc: P2[] = [b, [b[0] + 5 * u, b[1] - 0.8 * u], [b[0] + 9 * u, b[1] - 6 * u], [b[0] + 8.5 * u, b[1] - 11 * u]];
      p.stroke(cc, 7.5 * u * 0.62 + 3, INK);
      p.stroke(cc, 7.5 * u * 0.62, footCol);
    }
  }
  for (const L of legs) {
    const knee = mode === "swing" ? [300 + l1 * 0.98 + (L.near ? 0 : -6 * u), hipY + 6 * u] as P2 : ik(hip, L.ank, l1, l2);
    const hp0: P2 = [300 + (L.near ? 0 : -5 * u), hipY];
    p.stroke([hp0, knee, L.ank], 5.8 * u, L.near ? nearCol : farCol);
    const c = Math.cos(L.pitch),
      s = Math.sin(L.pitch);
    const fcol = L.near ? footCol : footCol === INK ? INK : shade(footCol, 0.82);
    footStroke(p, [L.ank[0] - 3 * u * c, L.ank[1] - 3 * u * s], [L.ank[0] + 13 * u * c, L.ank[1] + 13 * u * s + 0.5 * u], 7.5 * u, fcol);
    if (o.jutti) {
      const b: P2 = [L.ank[0] + 13 * u * c, L.ank[1] + 13 * u * s + 0.5 * u],
        cc: P2[] = [b, [b[0] + 5 * u, b[1] - 0.8 * u], [b[0] + 9 * u, b[1] - 6 * u], [b[0] + 8.5 * u, b[1] - 11 * u]];
      p.stroke(cc, 7.5 * u * 0.62 + 3, INK);
      p.stroke(cc, 7.5 * u * 0.62, fcol);
    }
  }
  if (o.lower === "dhoti") {
    const hy = hipY - 0.12 * HH,
      hem = hipY + 0.8 * (sole - hipY),
      dh: P2[] = [[300 - 24 * u, hy], [300 + 24 * u, hy], [300 + 31 * u, hem], [300 + 4 * u, hem + 0.05 * HH], [300 - 31 * u, hem]];
    p.gradFill(dh, o.pants, mul(o.pants, SH_CLOTH), light);
    p.clip(dh, () => {
      for (const t of [-0.5, 0.2, 0.6]) p.stroke([[300 + t * 24 * u, hy + 0.1 * HH], [300 + t * 30 * u, hem]], 1.6 * u, mix(o.pants, INK, 0.3));
    });
    p.poly(dh, null, 3.4 * u);
  }
  if (GL) lean = GL.lean + exLean;else lean += exLean;
  p.rot = lean ? [rad(lean), 300, hipY] : null;
  const BPs = D?.body ? bodyParams(D) : null,
    twS = DB.tw / BUILD[o.build ?? "adult"].tw * (BPs ? 0.85 : 1);
  const T: Blob = {
    a: (o.build === "stout" ? 0.36 : 0.31) * W * twS,
    b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
    nTop: BPs?.nTop ?? 2.2,
    nBot: BPs?.nBot ?? 2.5,
    egg: BPs?.egg ?? 0.1,
    asym: 0.06,
    rot: 0,
    noise: 0.006,
    seed: seed + 7
  };
  const tcx = 300 + 2 * u,
    tcy = torsoBot - T.b,
    tp = blobPts(tcx, tcy, T);
  const armCol = LIMB,
    farArm = LIMB;
  const S: P2 = [tcx + 0.05 * T.a, chin + 0.14 * HH],
    aLen = 0.95 * HH;
  const swingArm = (ang: number): [P2, P2, P2] => {
    const e: P2 = [S[0] + Math.sin(ang) * aLen * 0.5, S[1] + Math.cos(ang) * aLen * 0.5],
      a2 = ang + rad(16) * Math.sign(ang || 1);
    return [S, e, [e[0] + Math.sin(a2) * aLen * 0.5, e[1] + Math.cos(a2) * aLen * 0.5]];
  };
  const rifle = !!o.rifle && (mode === "march" || mode === "stand");
  const gaitArm = (fn: () => void) => {
    const r0 = p.rot;
    p.rot = null;
    fn();
    p.rot = r0;
  };
  const B0: P2 = [tcx + 0.72 * T.a, chin + 0.58 * HH],
    B1: P2 = [tcx - 0.95 * T.a - 22 * u, crown - 0.4 * HH];
  let near: [P2, P2, P2], far: [P2, P2, P2] | null;
  if (GL) {
    near = rifle ? [S, [S[0] - 4 * u, S[1] + 0.42 * HH], B0] : swingArm(0);
    far = null;
  } else if (mode === "swing") {
    near = [S, [S[0] + 12 * u, S[1] - 0.16 * HH], [300 + 6 * u, chin - 0.3 * HH]];
    far = [S, [S[0] + 8 * u, S[1] - 0.18 * HH], [300 + 2 * u, chin - 0.36 * HH]];
  } else if (mode === "push") {
    const reach = 0.55 * HH + 0.45 * HH * pose;
    let hN: P2 = [S[0] + reach, S[1] + 0.06 * HH];
    if (opts.hand) {
      const th = -rad(lean),
        dx = opts.hand[0] - 300,
        dy = opts.hand[1] - hipY;
      const tg: P2 = [300 + dx * Math.cos(th) - dy * Math.sin(th), hipY + dx * Math.sin(th) + dy * Math.cos(th)];
      hN = [hN[0] + (tg[0] - hN[0]) * pose, hN[1] + (tg[1] - hN[1]) * pose];
    }
    near = [S, [(S[0] + hN[0]) / 2, (S[1] + hN[1]) / 2 + 0.06 * HH], hN];
    far = [S, [(S[0] + hN[0]) / 2 - 4 * u, (S[1] + hN[1]) / 2 - 0.02 * HH], [hN[0] - 6 * u, hN[1] - 0.08 * HH]];
  } else if (rifle) {
    near = [S, [S[0] - 4 * u, S[1] + 0.42 * HH], B0];
    far = mode === "march" ? swingArm(rad(30) * nearFwd) : swingArm(0);
  } else if (mode === "march") {
    near = swingArm(rad(-40) * nearFwd);
    far = swingArm(rad(40) * nearFwd);
  } else {
    near = swingArm(rad(34));
    far = null;
  }
  if (far) {
    const cvf = curve(far[0], far[1], far[2]);
    p.stroke(cvf, 5.2 * u, farArm);
    mitt(p, far[2][0], far[2][1], 5.5 * u);
  }
  if (GL) gaitArm(() => drawArms(p, GL!.R, GL!, "back"));
  const robeFrac = o.robeLen ?? (o.robe === "jama" ? 0.86 : o.robe === "angarkha" ? 0.56 : 0.5),
    hemY = torsoBot + (sole - torsoBot) * robeFrac;
  const wHemS = T.a * (o.robe === "jama" ? 2.0 : o.robe === "angarkha" ? 1.34 : 1.12),
    trimC = o.trim ?? "#f0c24a";
  const drawSkirtS = () => {
    if (o.robe) {
      const y0s = torsoBot - 0.22 * HH,
        Ls: P2[] = [],
        Rs: P2[] = [],
        n = 10,
        sw = mode === "march" || GL ? 4 * u * Math.sin(two * phase) : 0;
      for (let i = 0; i <= n; i++) {
        const t = i / n,
          y = y0s + (hemY - y0s) * t,
          w = 0.97 * T.a + (wHemS - 0.97 * T.a) * t ** (o.robe === "jama" ? 0.75 : 1.2);
        Ls.push([tcx - w * 0.92 - sw * t, y]);
        Rs.push([tcx + w + sw * t, y]);
      }
      const hem: P2[] = [];
      for (let i = 1; i < 14; i++) {
        const t = i / 14;
        hem.push([tcx - wHemS * 0.92 + wHemS * 1.92 * t, hemY + (o.robe === "jama" ? 6 * u * Math.abs(Math.sin(t * Math.PI * 3)) : o.robe === "angarkha" ? 3 * u * Math.abs(Math.sin(t * Math.PI * 2)) : 0)]);
      }
      const sk: P2[] = [...Ls, ...hem, ...Rs.reverse()];
      p.gradFill(sk, o.jacket, mul(o.jacket, SH_CLOTH), light);
      p.clip(sk, () => {
        if (o.brocade) {
          let row = 0;
          for (let y = torsoBot + 0.02 * HH; y < hemY; y += 0.11 * HH, row++) for (let x = tcx - wHemS + row % 2 * 0.1 * T.a; x < tcx + wHemS; x += 0.2 * T.a) p.poly([[x, y - 4.2 * u], [x + 3.2 * u, y], [x, y + 4.2 * u], [x - 3.2 * u, y]], o.brocade, 0);
        }
        if (o.quilt) for (let d = -(hemY - torsoBot); d < 2 * wHemS; d += 0.2 * HH) {
          p.stroke([[tcx - wHemS + d, torsoBot], [tcx - wHemS + d + (hemY - torsoBot), hemY]], 1.6 * u, mix(o.jacket, INK, 0.3));
          p.stroke([[tcx - wHemS + d + (hemY - torsoBot), torsoBot], [tcx - wHemS + d, hemY]], 1.6 * u, mix(o.jacket, INK, 0.3));
        }
        if (o.robe === "jama") p.stroke(hem.map(([x, y]) => [x, y - 0.045 * HH] as P2), 0.07 * HH, trimC);
        if (o.robe === "angarkha") p.stroke([[tcx + 0.5 * T.a, torsoBot - 0.18 * HH], [tcx + 0.6 * T.a, hemY + 0.1 * HH]], 2.2 * u, mix(o.jacket, INK, 0.45));
        if (o.robe === "kurta" && !o.quilt) p.stroke([[tcx + wHemS * 0.9, hemY - 0.14 * HH], [tcx + wHemS * 0.93, hemY + 4 * u]], 2 * u, mix(o.jacket, INK, 0.4));
      });
      p.stroke(sk, ow, INK);
    } else if (o.dress) {
      const D: Blob = {
        a: 0.44 * W,
        b: 0.5 * (sole - 0.35 * HH - (chin - 0.2 * HH)),
        nTop: 2.0,
        nBot: 3.0,
        egg: 0.35,
        asym: 0.03,
        rot: 0,
        noise: 0.006,
        seed: seed + 9
      };
      const dp = blobPts(tcx, sole - 0.35 * HH - D.b, D);
      p.gradFill(dp, o.dress, mul(o.dress, SH_CLOTH), light);
      p.clip(dp, () => {
        const yb = sole - 0.35 * HH + D.b * 0.92;
        p.band([[0, yb], [600, yb]], o.trim ?? "#f0c24a", 0.1 * HH, 1.2 * u);
        p.band([[0, yb - 0.1 * HH], [600, yb - 0.1 * HH]], mix(o.trim ?? "#f0c24a", INK, 0.3), 0.02 * HH, 0);
      });
      p.inkRing(dp, ow, thick);
      const Sw: Blob = {
        a: 0.28 * W,
        b: 0.3 * HH,
        nTop: 2.2,
        nBot: 2.4,
        egg: 0.1,
        asym: 0,
        rot: 0,
        noise: 0.006,
        seed: seed + 8
      };
      const sp = blobPts(tcx, chin + 0.12 * HH, Sw);
      p.gradFill(sp, o.jacket, mul(o.jacket, SH_CLOTH), light);
      p.inkRing(sp, ow * 0.9, thick);
    }
  };
  p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
  p.clip(tp, () => {
    if (o.belt) p.band([[tcx - 0.65 * T.a, chin - 0.05 * HH], [tcx + 0.75 * T.a, torsoBot - 0.1 * HH]], o.belt!, 5.5 * u, 1.8 * u);
    if (o.brocade && o.robe === "jama") {
      let row = 0;
      for (let y = chin + 0.12 * HH; y < torsoBot; y += 0.11 * HH, row++) for (let x = tcx - T.a + row % 2 * 0.1 * T.a; x < tcx + T.a; x += 0.2 * T.a) p.poly([[x, y - 4.2 * u], [x + 3.2 * u, y], [x, y + 4.2 * u], [x - 3.2 * u, y]], o.brocade, 0);
    }
    if (o.robe === "jama") p.band([[tcx + 0.62 * T.a, chin + 0.1 * HH], [tcx + 0.7 * T.a, torsoBot]], trimC, 0.04 * HH, 1.2 * u);
    if (o.robe === "angarkha") p.stroke([[tcx + 0.2 * T.a, chin + 0.05 * HH], [tcx + 0.9 * T.a, chin + 0.6 * HH]], 2.4 * u);
    if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
    if (!o.dress && !o.robe) for (let i = 0; i < 3; i++) {
      const y = chin + 0.16 * HH + i * 0.24 * HH;
      p.dot(tcx + 0.8 * T.a, y, 3 * u, INK);
      p.dot(tcx + 0.8 * T.a, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
    }
  });
  p.inkRing(tp, ow, thick);
  drawSkirtS();
  if (o.patka) {
    const py = torsoBot - 0.22 * HH,
      hh = 0.15 * HH,
      ww = 1.04 * T.a,
      pc = o.patka,
      band: P2[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      band.push([tcx - ww + 2 * ww * t, py - hh / 2 + 3.5 * u * (1 - (2 * t - 1) ** 2)]);
    }
    for (let i = 12; i >= 0; i--) {
      const t = i / 12;
      band.push([tcx - ww + 2 * ww * t, py + hh / 2 + 3.5 * u * (1 - (2 * t - 1) ** 2)]);
    }
    const kx = tcx + 0.45 * T.a,
      e: P2[] = [[kx - 8 * u, py], [kx + 8 * u, py], [kx + 12 * u, py + 0.5 * HH], [kx - 7 * u, py + 0.46 * HH]];
    p.shadedFill(e, pc, mul(pc, SH_CLOTH), light, 12 * u, 0.4);
    p.clip(e, () => p.stroke([[kx - 14 * u, py + 0.38 * HH], [kx + 24 * u, py + 0.4 * HH]], 0.05 * HH, o.katar ? "#d8323a" : "#f4d58a"));
    p.poly(e, null, 2.6 * u);
    p.shadedFill(band, pc, mul(pc, SH_CLOTH), light, ww, 0.4);
    p.poly(band, null, 3 * u);
    p.ell(kx, py + 2 * u, 8 * u, 7 * u, mix(pc, "#ffffff", 0.08), 2.8 * u);
    if (o.katar) {
      const hx2 = tcx - 0.1 * T.a,
        ky = py - hh * 0.5;
      p.poly([[hx2 - 3.4 * u, ky + 2 * u], [hx2 - 3.4 * u, ky - 0.3 * HH], [hx2 + 3.4 * u, ky - 0.3 * HH], [hx2 + 3.4 * u, ky + 2 * u]], "#b98a22", 2.2 * u);
      for (const dy of [0.3, 0.1]) p.poly([[hx2 - 6 * u, ky - dy * HH - 2 * u], [hx2 + 6 * u, ky - dy * HH - 2 * u], [hx2 + 6 * u, ky - dy * HH + 2 * u], [hx2 - 6 * u, ky - dy * HH + 2 * u]], "#f0c24a", 2 * u);
    }
  }
  if (o.pearls) for (const [k2, w2] of [[0.3, 0.5], [0.5, 0.62]] as const) {
    const c = curve([tcx + 0.4 * T.a, chin + 0.03 * HH], [tcx + w2 * T.a + 6 * u, chin + k2 * HH * 0.7], [tcx + 0.15 * T.a, chin + k2 * HH + 0.1 * HH], 14);
    for (const q2 of c) {
      p.dot(q2[0], q2[1], 3.4 * u, INK);
      p.dot(q2[0], q2[1], 2.5 * u, "#fffdf6");
    }
  }
  if (rifle) {
    p.band([B0, B1], "#7a4b2a", 5 * u, 1.5 * u, "round");
    p.band([lerp2(B0, B1, 0.6), B1], "#8d949c", 2.4 * u, 1.2 * u, "round");
  }
  if (opts.carry && isStick(opts.carry) && mode !== "push" && mode !== "swing") near = [S, [S[0] + 0.04 * HH, S[1] + 0.4 * HH], [S[0] + 0.3 * HH, S[1] + 0.64 * HH]];
  if (GL && !rifle) {
    const na = GL.arms.find(a => a.side === 1)!;
    gaitArm(() => drawArm(p, GL!.R, na));
    if (opts.carry) {
      const th = -rad(lean),
        dx = na.hand[0] - 300,
        dy = na.hand[1] - hipY;
      drawProp(p, opts.carry, 300 + dx * Math.cos(th) - dy * Math.sin(th), hipY + dx * Math.sin(th) + dy * Math.cos(th), u);
    }
    gaitArm(() => drawHand(p, GL!.R, na));
  } else {
    const cvn = curve(near[0], near[1], near[2]);
    p.stroke(cvn, 5.2 * u, armCol);
    if (opts.carry) drawProp(p, opts.carry, near[2][0], near[2][1], u);
    mitt(p, near[2][0], near[2][1], 5.5 * u);
  }
  const hx = 300 + 4 * u + pFwd * HH;
  hatBehind(p, o, H, hx, hc, light, thick, ow, true);
  const hp = blobPts(hx, hc, H);
  const hx1 = D?.hair && D.hair !== "none" ? hairCtxOf(p, o, D.hair, H, hp, hx, hc, 1, "side", light, thick, ow, seed) : null;
  if (hx1) hairUnderM1(p, o, H, hc, hx, "side", false, () => hairBehind(hx1));
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  if (D?.ears && D.ears !== "none") earSide(p, D, H, hx, hc, skin, ow);
  if (o.beard) {
    p.clip(hp, () => p.ell(hx + 18 * u, hc + 0.78 * H.b, 0.75 * H.a, 0.42 * H.b, o.beard!, 0));
    p.poly(ellPts(hx + 22 * u, hc + 1.0 * H.b, 0.42 * H.a, 0.26 * H.b, 0, 180, 0, 24), o.beard, ow * 0.8);
    p.inkRing(hp, ow, thick);
    p.ell(hx + 34 * u, hc + 21 * u, 8 * u, 6 * u, skin, 0);
  }
  if (hx1) hairUnderM1(p, o, H, hc, hx, "side", true, () => hairOver(hx1));
  hatOn(p, o, hp, H, hx, hc, light, seed, 1, true);
  CROWN3D = false;
  const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
  faceSide(p, o, hx, hc, 2 * H.a, expr, lid, brim, skin, !!opts.talk, H, hp);
  p.rot = null;
};
export const fxNote = (p: Pen, kind: number, col = "#1f2a44") => {
  p.ell(70, 200, 46, 34, col, 8, 0, 360, -20);
  p.stroke([[110, 190], [110, 40]], 14);
  if (kind === 0) p.poly([[110, 40], [170, 70], [170, 110], [110, 82]], col, 8);else {
    p.ell(150, 170, 40, 30, col, 8, 0, 360, -20);
    p.stroke([[186, 160], [186, 20]], 14);
    p.poly([[110, 40], [186, 20], [186, 50], [110, 70]], col, 8);
  }
};
/** spark / impact star on a 500 x 500 canvas; t in 0..1 */

export const fxBurst = (p: Pen, t: number, col = "#fff3b0", rays = 10, r0 = 40, r1 = 230) => {
  const c = 250,
    e = 1 - (1 - t) ** 3;
  for (let i = 0; i < rays; i++) {
    const a = rad(i * 360 / rays + 7 * (i % 2)),
      ra = r0 + (r1 - r0) * e * (0.75 + 0.25 * (i % 2));
    p.poly([[c + r0 * 0.5 * Math.cos(a + 0.18), c + r0 * 0.5 * Math.sin(a + 0.18)], [c + ra * Math.cos(a), c + ra * Math.sin(a)], [c + r0 * 0.5 * Math.cos(a - 0.18), c + r0 * 0.5 * Math.sin(a - 0.18)]], col, Math.max(3, 8 * (1 - t)));
  }
  if (t < 0.5) p.ell(c, c, r0 * (1.4 - t), r0 * (1.4 - t), WHITE, 8);
};
/** water splash crown on an 800 x 800 canvas; t in 0..1 */

export const fxSplash = (p: Pen, t: number) => {
  const c = 400,
    size = 800,
    rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
  const blue = "#bfe8ff",
    deep = "#6cc0f0";
  if (rise > 0.02) {
    const pts: P2[] = [];
    for (let i = 0; i < 19; i++) {
      const h = (i % 2 ? 260 : 130) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
      pts.push([c - 330 + 660 * i / 18, size - 120 - h]);
    }
    p.poly([...pts, [c + 330, size - 90], [c - 330, size - 90]], blue, 10);
    p.ell(c, size - 100, 360, 46, deep, 10);
  }
  for (let i = 0; i < 8; i++) {
    const a = rad(200 + i * 18),
      d = 120 + 380 * t,
      y = size - 160 + d * Math.sin(a) + 520 * t * t,
      r = 26 * (1 - t) + 6;
    if (t > 0.08 && y < size - 40) p.ell(c + d * Math.cos(a), y, r, r * 1.25, blue, 7);
  }
};
/** dust puff on a 300 x 300 canvas; t in 0..1 */

export const fxPuff = (p: Pen, t: number) => {
  for (let i = 0; i < 5; i++) {
    const a = rad(160 + i * 55),
      d = 40 + 70 * t,
      r = (34 + 20 * (i % 2)) * (1 - 0.6 * t);
    p.ell(150 + d * Math.cos(a), 180 + d * 0.45 * Math.sin(a), r, r * 0.8, `rgba(238,225,205,${(1 - t).toFixed(3)})`, 0);
  }
};
/** circling stars on a 420 x 210 canvas */

export const fxStars = (p: Pen, t: number) => {
  for (let i = 0; i < 4; i++) {
    const a = t * Math.PI * 2 + i * Math.PI / 2,
      x = 210 + 150 * Math.cos(a),
      y = 110 + 40 * Math.sin(a),
      pts: P2[] = [];
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 14 : 34,
        b = rad(k * 36 - 90);
      pts.push([x + r * Math.cos(b), y + r * Math.sin(b)]);
    }
    p.poly(pts, "#ffd84a", 6);
  }
};
/** three jittering strain ticks on a 300 x 300 canvas */

export const fxCreak = (p: Pen, t: number) => {
  const j = 6 * Math.sin(t * 40);
  for (const a of [-30, 0, 30]) {
    const b = rad(a - 90);
    p.stroke([[150 + 70 * Math.cos(b) + j, 230 + 70 * Math.sin(b)], [150 + 100 * Math.cos(b) + 10 + j, 230 + 100 * Math.sin(b)], [150 + 130 * Math.cos(b) + j, 230 + 130 * Math.sin(b)]], 10);
  }
};
/** flat water ring (drawn top-down) on a 600 x 600 canvas; t in 0..1 */

export const fxRing = (p: Pen, t: number) => {
  const g = p.g;
  for (let k = 0; k < 3; k++) {
    const u = t - k * 0.22;
    if (u <= 0 || u >= 1) continue;
    g.beginPath();
    g.ellipse(300, 300, 60 + 230 * u, 60 + 230 * u, 0, 0, Math.PI * 2);
    g.strokeStyle = k === 0 ? "#f6fcff" : "#cfe8fa";
    g.lineWidth = 9 * (1 - u) + 3;
    g.stroke();
  }
};
/** soft cartoon cloud on a 600 x 300 canvas */

export const fxCloud = (p: Pen, seed: number) => {
  const blobs: [number, number, number][] = [[150, 190, 80], [250, 150, 105], [360, 160, 95], [450, 195, 70], [300, 210, 90]];
  for (const [x, y, r] of blobs) p.ell(x + seed * 37 % 20 - 10, y, r, r * 0.8, "#ffffff", 0);
  p.ell(300, 235, 230, 40, "#ffffff", 0);
};
/** cast shadow on a 128 x 256 canvas: dark soft contact pool at the feet (y 205) and a softer tail that runs up the
 *  canvas = away from the sun, fading with distance; multiply colour (sRGB-encoded linear ratio), white = no change */

export const fxShadow = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE;
  g.fillRect(0, 0, 128, 256);
  g.save();
  g.filter = "blur(9px)";
  const lg = g.createLinearGradient(0, 205, 0, 22);
  lg.addColorStop(0, mix(col, WHITE, 0.08));
  lg.addColorStop(0.55, mix(col, WHITE, 0.3));
  lg.addColorStop(1, mix(col, WHITE, 0.85));
  g.fillStyle = lg;
  g.beginPath();
  g.moveTo(40, 205);
  g.bezierCurveTo(36, 120, 46, 50, 64, 30);
  g.bezierCurveTo(82, 50, 92, 120, 88, 205);
  g.closePath();
  g.fill();
  g.fillStyle = col;
  g.beginPath();
  g.ellipse(64, 205, 30, 17, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
};
/** tight contact shadow right under the feet on a 128 x 128 canvas: dark core, short fall-off (multiply colour) */

export const fxContact = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE;
  g.fillRect(0, 0, 128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.32, 0.02], [0.5, 0.22], [0.66, 0.58], [0.82, 0.88], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
};
/** soft ground contact blob on a 128 x 128 canvas, multiply colour (sRGB-encoded linear ratio) in the centre */

export const fxBlob = (p: Pen, col: string) => {
  const g = p.g;
  g.fillStyle = WHITE;
  g.fillRect(0, 0, 128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [r, k] of [[0, 0], [0.5, 0.04], [0.64, 0.18], [0.76, 0.42], [0.87, 0.72], [0.95, 0.92], [1, 1]] as const) gr.addColorStop(r, mix(col, WHITE, k));
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
};
/** a falling drop on a 120 x 160 canvas (teardrop, highlight) */

export const fxDrop = (p: Pen, col: string) => {
  const pts: P2[] = [[60, 10]];
  for (let i = 0; i <= 20; i++) {
    const a = -0.25 * Math.PI + 1.5 * Math.PI * i / 20;
    pts.push([60 + 40 * Math.cos(a), 104 + 44 * Math.sin(a)]);
  }
  p.poly(pts, col, 8);
  p.ell(46, 96, 9, 14, "#ffffff", 0, 0, 360, 20);
};
/** splash crown for a drop landing in a bowl, on a 400 x 300 canvas; t 0..1 */

export const fxPlip = (p: Pen, t: number, col = "#8fe46a") => {
  const rise = Math.sin(Math.min(1, t * 1.6) * Math.PI);
  if (rise > 0.03) {
    const pts: P2[] = [];
    for (let i = 0; i < 11; i++) pts.push([200 - 120 + 24 * i, 250 - (i % 2 ? 110 : 50) * rise]);
    p.poly([...pts, [320, 262], [80, 262]], col, 7);
  }
  for (let i = 0; i < 5; i++) {
    const a = rad(220 + i * 25),
      d = 40 + 170 * t,
      y = 220 + d * Math.sin(a) + 260 * t * t;
    if (t > 0.1 && y < 280) p.ell(200 + d * Math.cos(a), y, 12 * (1 - t) + 4, 15 * (1 - t) + 5, col, 5);
  }
};
/** sweat drop flung off, 100 x 140 */

export const fxSweat = (p: Pen) => {
  const pts: P2[] = [[50, 8]];
  for (let i = 0; i <= 18; i++) {
    const a = -0.2 * Math.PI + 1.4 * Math.PI * i / 18;
    pts.push([50 + 32 * Math.cos(a), 92 + 36 * Math.sin(a)]);
  }
  p.poly(pts, "#9fd4ff", 7);
  p.ell(40, 86, 7, 11, "#ffffff", 0);
};
/** shake ticks either side of a trembling body, 600 x 400; t animates the jitter */

export const fxShake = (p: Pen, t: number) => {
  const j = 8 * Math.sin(t * 50);
  for (const s of [-1, 1]) for (const k of [-1, 0, 1]) {
    const x = 300 + s * (210 + 30 * Math.abs(k)) + j * s,
      y = 200 + k * 70;
    p.stroke([[x, y - 26], [x + s * 18, y - 8], [x, y + 8], [x + s * 18, y + 26]], 10);
  }
};
/** burp: a puffy cloud with a curl in it and three little bubbles, 500 x 400; t 0..1 grows and fades it */

export const fxBurp = (p: Pen, t: number) => {
  const s = 0.4 + 0.6 * (1 - (1 - Math.min(1, t * 2.2)) ** 3),
    a = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
  p.g.globalAlpha = Math.max(0, a);
  const blobs: [number, number, number][] = [[200, 210, 80], [280, 180, 95], [360, 215, 75], [300, 250, 80], [230, 260, 60]];
  for (const [x, y, r] of blobs) p.ell(100 + (x - 100) * s, 230 + (y - 230) * s, r * s, r * 0.85 * s, "#e9f6dc", 9);
  for (const [x, y, r] of blobs) p.ell(100 + (x - 100) * s, 230 + (y - 230) * s, r * s - 9, r * 0.85 * s - 9, "#e9f6dc", 0);
  const sp: P2[] = [];
  for (let i = 0; i < 26; i++) {
    const an = i * 0.45,
      rr = 6 + i * 2.4 * s;
    sp.push([100 + 190 * s + rr * Math.cos(an), 230 - 10 * s + rr * Math.sin(an) * 0.8]);
  }
  p.stroke(sp, 7, "#9ab88a");
  for (const [x, y, r] of [[60, 250, 16], [30, 214, 11], [70, 196, 8]] as const) p.ell(x, y, r * s, r * s, "#e9f6dc", 6);
  p.g.globalAlpha = 1;
};
/** green stink waves rising off a sick character, 300 x 500; t animates */

export const fxStink = (p: Pen, t: number) => {
  for (let k = 0; k < 3; k++) {
    const pts: P2[] = [];
    for (let i = 0; i <= 16; i++) {
      const v = i / 16;
      pts.push([70 + k * 80 + 22 * Math.sin(v * 9 + t * 8 + k * 2), 470 - v * 420]);
    }
    p.g.globalAlpha = 0.85;
    p.stroke(pts, 16, "#9bd46a");
    p.g.globalAlpha = 1;
  }
};
/** a soft radial glow (unlit, see-through), 256 x 256 */

export const fxGlow = (p: Pen, col = "120,255,100") => {
  const g = p.g,
    gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, `rgba(${col},0.85)`);
  gr.addColorStop(0.35, `rgba(${col},0.35)`);
  gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
};
const sparkScale = (t: number) => t < 0.2 ? 1.2 * (1 - (1 - t / 0.2) ** 3) : t < 0.35 ? 1.2 - 0.2 * ((t - 0.2) / 0.15) : (1 - (t - 0.35) / 0.65) ** 1.5;
/** a four-point twinkle star with concave sides (white core, coloured ink edge), 256 x 256; t in 0..1 */

export const fxSparkle = (p: Pen, t: number, col = "#ffcf4a") => {
  const g = p.g,
    s = sparkScale(t),
    c = 128,
    L = 118 * s,
    S = 0.16 * L;
  if (s < 0.02) return;
  const star = (l: number, k: number) => {
    g.beginPath();
    g.moveTo(c, c - l);
    g.quadraticCurveTo(c + k, c - k, c + l, c);
    g.quadraticCurveTo(c + k, c + k, c, c + l);
    g.quadraticCurveTo(c - k, c + k, c - l, c);
    g.quadraticCurveTo(c - k, c - k, c, c - l);
    g.closePath();
  };
  star(L, S);
  g.fillStyle = col;
  g.fill();
  star(L * 0.78, S * 0.7);
  g.fillStyle = "#fffdf2";
  g.fill();
};
/** a lens glint: long thin horizontal and vertical flares crossing a small star, for metal, glass, gems and eyes;
 *  512 x 512, drawn for an additive card; t in 0..1 (flares grow and fade with sin) */

export const fxGlint = (p: Pen, t: number) => {
  const g = p.g,
    s = Math.sin(Math.PI * Math.min(1, Math.max(0, t))),
    c = 256;
  if (s < 0.02) return;
  const flare = (lx: number, ly: number) => {
    g.beginPath();
    g.moveTo(c - lx, c);
    g.quadraticCurveTo(c, c - ly, c + lx, c);
    g.quadraticCurveTo(c, c + ly, c - lx, c);
    g.closePath();
    g.fillStyle = "rgba(255,250,235,0.9)";
    g.fill();
  };
  flare(250 * s, 9 * s);
  g.save();
  g.translate(c, c);
  g.rotate(Math.PI / 2);
  g.translate(-c, -c);
  flare(150 * s, 8 * s);
  g.restore();
  const gr = g.createRadialGradient(c, c, 0, c, c, 70 * s);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.4, "rgba(255,240,200,0.55)");
  gr.addColorStop(1, "rgba(255,240,200,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 512);
};
/** an impact shockwave ring with an ink edge, thinning as it spreads, plus short speed rays, 600 x 600; t in 0..1 */

export const fxShock = (p: Pen, t: number, col = "#ffffff") => {
  const g = p.g,
    c = 300,
    e = 1 - (1 - t) ** 3,
    r = 50 + 215 * e,
    w = 46 * (1 - t) ** 1.4 + 3;
  if (t >= 1) return;
  g.beginPath();
  g.arc(c, c, r + w / 2 + 3, 0, Math.PI * 2);
  g.arc(c, c, Math.max(1, r - w / 2 - 3), 0, Math.PI * 2, true);
  g.fillStyle = INK;
  g.fill("evenodd");
  g.beginPath();
  g.arc(c, c, r + w / 2, 0, Math.PI * 2);
  g.arc(c, c, Math.max(1, r - w / 2), 0, Math.PI * 2, true);
  g.fillStyle = col;
  g.fill("evenodd");
  if (t < 0.55) {
    const k = 1 - t / 0.55;
    for (let i = 0; i < 12; i++) {
      const a = rad(i * 30 + 6 * (i * 7 % 3)),
        r0 = r + w / 2 + 6,
        r1 = r0 + 70 * k * (0.6 + 0.2 * (i * 7 % 3)),
        hw = (0.05 + 0.04 * k) * (200 / r0);
      p.poly([[c + r0 * Math.cos(a - hw), c + r0 * Math.sin(a - hw)], [c + r1 * Math.cos(a), c + r1 * Math.sin(a)], [c + r0 * Math.cos(a + hw), c + r0 * Math.sin(a + hw)]], col, 4);
    }
  }
};
/** a green poison fume curling up into a skull, 400 x 500; t 0..1 */

export const fxSkull = (p: Pen, t: number) => {
  const g = p.g,
    a = Math.min(1, t * 3) * (t > 0.75 ? (1 - t) / 0.25 : 1);
  g.globalAlpha = Math.max(0, a) * 0.9;
  const c = "#a6f07e",
    d = "#4f8a3a";
  const tail: P2[] = [];
  for (let i = 0; i <= 14; i++) {
    const v = i / 14;
    tail.push([200 + 30 * Math.sin(v * 8 + t * 6), 490 - v * 260]);
  }
  p.stroke(tail, 30, c);
  p.ell(200, 170, 105, 95, c, 0);
  p.ell(200, 245, 62, 38, c, 0);
  p.ell(158, 165, 26, 30, d, 0);
  p.ell(242, 165, 26, 30, d, 0);
  p.poly([[200, 200], [188, 226], [212, 226]], d, 0);
  for (const x of [172, 200, 228]) p.stroke([[x, 250], [x, 272]], 8, d);
  g.globalAlpha = 1;
};
/** CLOSE-UP ARM: exactly the characters' own arm (a hose stroke in the coat colour mixed 50 % with ink, ending in the
 *  round ink hand), drawn at true world scale on a 600 x 800 card that is 0.5 m wide (1200 px per metre), so a macro shot
 *  shows the same simple hand, only bigger. The arm comes in from the given edge; the hand is at (hx, hy) and grips the
 *  prop: the prop is drawn first and the round hand over it, so the prop pokes out on both sides.
 *  prop: "vial" (tipped by tilt 0..1, cork out while pouring) or "pill" (a small pill under the hand). */

export const ARM_PX = 1200,
  ARM_U = 2.36 * 0.00216 * ARM_PX;
export const armCard = (p: Pen, o: {
  jacket: string;
}, from: [number, number], hx: number, hy: number, prop: "vial" | "pill" | "none" | "hand3d", tilt = 0, col = "#8fe46a", open = 0, wk = 1) => {
  const u = ARM_U * wk,
    armCol = LIMB;
  const elbow: P2 = [(from[0] + hx) / 2 + (from[1] < hy ? -40 : 40), (from[1] + hy) / 2 + 40];
  const arm = curve(from, elbow, [hx, hy]);
  void armCol;
  p.stroke(arm, 5.2 * u + 2.4 * u, INK);
  p.stroke(arm, 5.2 * u, mix(o.jacket, "#ffffff", 0.1));
  const n = arm.length,
    lit = mix(o.jacket, "#ffffff", 0.28);
  p.stroke(arm.slice(1, Math.max(2, n - 3)).map(([x, y]) => [x - 1.3 * u, y - 1.3 * u] as P2), 1.1 * u, lit);
  const c0 = arm[Math.max(0, n - 4)],
    c1 = arm[Math.max(0, n - 3)];
  p.stroke([c0, c1], 6.4 * u, INK);
  p.stroke([c0, c1], 4.6 * u, mix(o.jacket, "#ffffff", 0.16));
  if (prop === "vial") {
    const rot = 20 + 100 * tilt;
    drawVial(p, hx, hy + 3 * u * 0.62, u * 0.62, col, rot, false, tilt > 0.45);
  }
  if (prop === "pill") {
    p.ell(hx - 2 * u, hy + (7 + 10 * open) * u, 2.6 * u, 1.9 * u, "#b05ae0", 1.2 * u);
  }
  p.dot(hx, hy - open * 3 * u, (prop === "hand3d" ? 3.3 : 5.5) * u);
};
/** the vial's mouth on the armCard for a tilt, as offsets from the card centre in metres (+x right, +y up) */

export const armVialMouth = (hx: number, hy: number, tilt: number): [number, number] => {
  const r = rad(20 + 100 * tilt),
    u = ARM_U * 0.62,
    cx = hx,
    cy = hy + 3 * u,
    my = -12 * u;
  const x = cx - my * Math.sin(r),
    y = cy + my * Math.cos(r);
  return [(x - 300) / ARM_PX, -(y - 400) / ARM_PX];
};
/** brazier flame on a 300 x 500 canvas: three tongues flickering with t (unlit, drawn bright) */

export const fxFlame = (p: Pen, t: number) => {
  const tongue = (cx: number, h: number, w: number, ph: number, col: string, ink: number) => {
    const pts: P2[] = [];
    for (let i = 0; i <= 20; i++) {
      const v = i / 20,
        a = Math.PI * 2 * v;
      const r = w * (0.5 + 0.5 * Math.cos(a)) ** 0.8;
      void r;
    }
    const sway = 18 * Math.sin(t * 9 + ph),
      top: P2 = [cx + sway, 480 - h];
    pts.push([cx - w, 470]);
    pts.push([cx - w * 0.9, 420], [cx - w * 0.55 + sway * 0.3, 360], top, [cx + w * 0.5 + sway * 0.3, 370], [cx + w * 0.9, 420], [cx + w, 470]);
    for (let i = 0; i <= 8; i++) {
      const a = i / 8 * Math.PI;
      pts.push([cx + w * Math.cos(a), 470 + 18 * Math.sin(a)]);
    }
    p.poly(pts, col, ink);
  };
  const k = (ph: number) => 0.85 + 0.15 * Math.sin(t * 13 + ph);
  tongue(150, 380 * k(0), 110, 0, "#ff8a2a", 10);
  tongue(110, 250 * k(1), 60, 1.7, "#ffb03a", 0);
  tongue(190, 280 * k(2), 64, 3.1, "#ffb03a", 0);
  tongue(150, 200 * k(3), 60, 4.2, "#fff0a0", 0);
};
/** a swallowed lump on a 200 x 200 canvas (head ~ 360 wide at card scale, so r 30 = 1/6 head width): a skin-coloured,
 *  ink-outlined bump with a small shine-free shade, drawn at the canvas centre. No guide line. sq squashes it a little as it slides (t 0..1). */

export const fxLumpGulp = (p: Pen, t: number, skin = SKIN) => {
  const sq = 1 + 0.1 * Math.sin(t * Math.PI * 2);
  p.ell(100, 100, 29 / sq, 29 * sq, mul(skin, [0.99, 0.95, 0.93]), 7);
  p.arc(100, 100, 17 / sq, 17 * sq, 150, 250, 3.6, mix(skin, INK, 0.28));
};
const twinkle = (p: Pen, x: number, y: number, r: number, col: string, ink = 0) => {
  const pts: P2[] = [];
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4,
      rr = k % 2 ? r * 0.28 : r;
    pts.push([x + rr * Math.cos(a), y + rr * Math.sin(a)]);
  }
  p.poly(pts, col, ink);
};
/** magic wisps with twinkles rising on a 200 x 420 canvas; t 0..1 (loops: feed t = (f % 40) / 40). Translucent: draw it soft / additive. */

export const fxSparkleWisp = (p: Pen, t: number) => {
  const g = p.g;
  for (const [k, col, w] of [[0, "rgba(200,170,255,0.55)", 22], [1, "rgba(255,244,200,0.8)", 9]] as const) {
    const pts: P2[] = [];
    for (let i = 0; i <= 24; i++) {
      const v = i / 24;
      pts.push([100 + 34 * Math.sin(v * 7 + t * 6.283 + k * 1.2) * (0.4 + v), 400 - v * 360]);
    }
    g.globalAlpha = 0.9;
    p.stroke(pts, w * (k ? 1 : 1.3), col);
    g.globalAlpha = 1;
  }
  for (let i = 0; i < 6; i++) {
    const ph = (t + i / 6) % 1,
      y = 390 - ph * 350,
      x = 100 + 44 * Math.sin(ph * 9 + i * 2.1),
      a = Math.sin(Math.PI * ph);
    g.globalAlpha = a;
    twinkle(p, x, y, 8 + 14 * a * (i % 2 ? 0.7 : 1), i % 2 ? "#fff4c0" : "#ffffff", 0);
    g.globalAlpha = 1;
  }
};
