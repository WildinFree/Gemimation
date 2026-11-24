import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Batch, lam, quad, V, inTheWay } from "./build";
import { ctex, rng, jit, stoneHD, stone as stoneLo, brick } from "./paint";
import { detail, seg, parts } from "../assets/tiers";
export type HouseOpts = {
  x: number;
  z: number;
  seed: number;
  y?: number;
  yaw?: number;
  w?: number;
  d?: number;
  floors?: number;
  bays?: number;
  wall?: string;
  trim?: string;
  roof?: "gable" | "hip" | "flat";
  roofCol?: string;
  shop?: boolean;
  lod?: 0 | 1 | 2;
};
export const FH = 2.9;
export const mat4 = (x: number, y: number, z: number, yaw = 0, pitch = 0, roll = 0) => {
  const m = new THREE.Matrix4().makeRotationY(yaw);
  if (pitch) m.multiply(new THREE.Matrix4().makeRotationX(pitch));
  if (roll) m.multiply(new THREE.Matrix4().makeRotationZ(roll));
  return m.setPosition(x, y, z);
};
const merge = (f: THREE.BufferGeometry[]) => mergeGeometries(f, false)!;
/** axis box with uv in metres / tile (front face u continuous with x, v offset v0); no bottom unless asked */
export const boxUV = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tile = 0, v0 = 0, bottom = false) => {
  const t = (a: number) => tile ? a / tile : 1,
    fu = tile ? x0 / tile : 0,
    w = x1 - x0,
    h = y1 - y0,
    d = z1 - z0;
  const f = [quad(V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1), fu + t(w), v0 + t(h), fu, v0), quad(V(x1, y0, z0), V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0), t(w), v0 + t(h), 0, v0), quad(V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0), t(d), v0 + t(h), 0, v0), quad(V(x1, y0, z1), V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1), t(d), v0 + t(h), 0, v0), quad(V(x0, y1, z1), V(x1, y1, z1), V(x1, y1, z0), V(x0, y1, z0), t(w), t(d))];
  if (bottom) f.push(quad(V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1), t(w), t(d)));
  return merge(f);
};
/** quad whose normal points away from `inside` (so the winding never matters) */
export const qo = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, inside: THREE.Vector3, u1 = 1, v1 = 1) => {
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a));
  const cen = new THREE.Vector3().add(a).add(b).add(c).add(d).multiplyScalar(0.25);
  return n.dot(cen.sub(inside)) < 0 ? quad(a, d, c, b, u1, v1) : quad(a, b, c, d, u1, v1);
};
const UP = V(0, 1, 0);
export class Out {
  constructor(readonly b: Batch, readonly m: THREE.Matrix4) {}
  sub(x: number, y: number, z: number, yaw = 0, pitch = 0, roll = 0) {
    return new Out(this.b, this.m.clone().multiply(mat4(x, y, z, yaw, pitch, roll)));
  }
  geo(g: THREE.BufferGeometry, mat: THREE.Material, local?: THREE.Matrix4) {
    this.b.add(g, mat, local ? this.m.clone().multiply(local) : this.m);
  }
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: THREE.Material, tile = 0, v0 = 0, bottom = false) {
    this.geo(boxUV(x0, y0, z0, x1, y1, z1, tile, v0, bottom), mat);
  }
  cyl(x: number, y: number, z: number, r0: number, h: number, mat: THREE.Material, sg = 8, r1 = r0) {
    this.geo(new THREE.CylinderGeometry(r1, r0, h, seg(sg), 1, false).translate(0, h / 2, 0), mat, mat4(x, y, z));
  }
  sph(x: number, y: number, z: number, rx: number, ry: number, rz: number, mat: THREE.Material, sg = 7) {
    this.geo(new THREE.SphereGeometry(1, seg(sg), Math.max(4, seg(sg) - 2)), mat, new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(rx, ry, rz)));
  }
  rod(a: THREE.Vector3, bb: THREE.Vector3, r: number, mat: THREE.Material, sg = 6) {
    const dir = new THREE.Vector3().subVectors(bb, a),
      len = dir.length();
    if (len < 1e-5) return;
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
    this.geo(new THREE.CylinderGeometry(r, r, len, seg(sg), 1, false), mat, new THREE.Matrix4().compose(new THREE.Vector3().addVectors(a, bb).multiplyScalar(0.5), q, V(1, 1, 1)));
  }
}
/** stone paint shared by house.ts and street.ts: the HD course texture for hero / piece, the plain one below that */
export const stoneMat = () => detail().hd ? lam("hstone", () => ({
  map: stoneHD()
})) : lam("hstoneLo", () => ({
  map: stoneLo("hstoneLo", ["#ddd0bf", "#d3c5b3", "#e5d9c9", "#cabba8"])
}));
const TAU = Math.PI * 2;
const U = (r: () => number, a: number, b: number) => a + (b - a) * r();
const blot = (g: CanvasRenderingContext2D, W: number, H: number, x: number, y: number, rad: number, sy: number, rgb: string, a: number) => {
  for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) {
    if (x + ox + rad < 0 || x + ox - rad > W || y + oy + rad * sy < 0 || y + oy - rad * sy > H) continue;
    g.save();
    g.translate(x + ox, y + oy);
    g.scale(1, sy);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rad);
    gr.addColorStop(0, `rgba(${rgb},${a})`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(-rad, -rad, 2 * rad, 2 * rad);
    g.restore();
  }
};
const tone = (hex: string, k: number) => {
  const c = new THREE.Color(hex),
    h = {
      h: 0,
      s: 0,
      l: 0
    };
  c.getHSL(h);
  c.setHSL(h.h, h.s, Math.min(0.98, h.l * k));
  return "#" + c.getHexString();
};
const wallTex = (col: string, ground: boolean) => ctex("hw" + (ground ? "G" : "U") + col, 768, 768, (g, r) => {
  const W = 768,
    H = 768,
    PXM = H / FH;
  g.fillStyle = col;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 16; i++) {
    const light = r() > 0.45;
    blot(g, W, H, U(r, 0, W), U(r, 0, H), U(r, 90, 230), U(r, 0.6, 1.4), light ? "255,247,232" : "120,92,80", light ? U(r, 0.09, 0.16) : U(r, 0.07, 0.13));
  }
  for (let i = 0; i < 0; i++) {
    const cx = U(r, 100, W - 100),
      cy = U(r, 100, H - 100),
      rx = U(r, 40, 90),
      ry = U(r, 30, 70);
    g.save();
    g.shadowColor = "rgba(90,70,60,0.35)";
    g.shadowBlur = 34;
    g.fillStyle = r() > 0.5 ? "rgba(255,246,232,0.09)" : "rgba(120,95,80,0.07)";
    g.beginPath();
    for (let k = 0; k < 9; k++) {
      const a = k / 9 * TAU,
        q = U(r, 0.8, 1.15);
      g.lineTo(cx + Math.cos(a) * rx * q, cy + Math.sin(a) * ry * q);
    }
    g.closePath();
    g.fill();
    g.restore();
  }
  for (let i = 0; i < 3; i++) {
    let x = U(r, 40, W - 40),
      y = U(r, 60, H * 0.7);
    g.strokeStyle = "rgba(95,75,65,0.42)";
    g.lineWidth = 1.3;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += U(r, -14, 14);
      y += U(r, 10, 30);
      g.lineTo(x, y);
    }
    g.stroke();
  }
  if (ground) {
    const gh = 0.62 * PXM,
      gr = g.createLinearGradient(0, H, 0, H - gh);
    gr.addColorStop(0, "rgba(78,62,56,0.34)");
    gr.addColorStop(0.55, "rgba(78,62,56,0.14)");
    gr.addColorStop(1, "rgba(78,62,56,0)");
    g.fillStyle = gr;
    g.fillRect(0, H - gh, W, gh);
  }
});
const shadeTex = () => ctex("hshade", 8, 64, g => {
  const gr = g.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, "rgba(70,55,60,0.30)");
  gr.addColorStop(1, "rgba(70,55,60,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 8, 64);
});
const glassTex = (col: string) => ctex("hg" + col, 128, 128, g => {
  const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, tone(col, 1.1));
  gr.addColorStop(1, tone(col, 0.86));
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  for (const [x, w, a] of [[26, 14, 0.24], [48, 6, 0.16]]) {
    g.fillStyle = `rgba(255,255,255,${a})`;
    g.beginPath();
    g.moveTo(x + 50, 0);
    g.lineTo(x + 50 + w, 0);
    g.lineTo(x - 30 + w, 128);
    g.lineTo(x - 30, 128);
    g.closePath();
    g.fill();
  }
});
const shutTex = (col: string) => ctex("hsh" + col, 64, 128, g => {
  g.fillStyle = col;
  g.fillRect(0, 0, 64, 128);
  for (let y = 0; y < 128; y += 9) {
    g.fillStyle = "rgba(255,240,250,0.2)";
    g.fillRect(0, y, 64, 3);
    g.fillStyle = "rgba(40,30,70,0.3)";
    g.fillRect(0, y + 4, 64, 3);
  }
});
const tileTex = (col: string, k: number) => ctex("ht" + col + k, 256, 64, (g, r) => {
  g.fillStyle = tone(col, [0.96, 1.0, 1.05][k]);
  g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 4; i++) {
    const x = i * 64,
      c = jit(r, col, 0.06, 3, 0.1);
    g.fillStyle = c;
    g.fillRect(x, 0, 64, 64);
    const gr = g.createLinearGradient(x, 0, x + 64, 0);
    gr.addColorStop(0, "rgba(255,240,225,0.14)");
    gr.addColorStop(0.55, "rgba(255,240,225,0)");
    gr.addColorStop(1, "rgba(60,25,20,0.14)");
    g.fillStyle = gr;
    g.fillRect(x, 0, 64, 64);
    g.fillStyle = "rgba(60,25,20,0.22)";
    g.fillRect(x, 0, 2, 64);
  }
  g.fillStyle = "rgba(255,235,220,0.18)";
  g.fillRect(0, 0, 256, 6);
});
const WALL_K = 0.87;
type Style = {
  wallU: THREE.Material;
  wallG: THREE.Material;
  trim: THREE.Material;
  stone: THREE.Material;
  glass: THREE.Material;
  shutA: THREE.Material;
  shutSlab: THREE.Material;
  door: THREE.Material;
  doorPanel: THREE.Material;
  gutter: THREE.Material;
  brass: THREE.Material;
  soil: THREE.Material;
  leaf: THREE.Material;
  wood: THREE.Material;
  tiles: THREE.Material[];
  deck: THREE.Material;
  lampGlass: THREE.Material;
  brick: THREE.Material;
  curt: THREE.Material[];
  rev: THREE.Material;
  sillShade: THREE.Material;
  flowers: THREE.Material[];
  awnA: THREE.Material;
  awnB: THREE.Material;
  sign: THREE.Material;
  core: THREE.Material;
};
const FLOWER = ["#e8708f", "#f4c43e", "#fbf1e2", "#e8805a", "#c78ae0"];
const SHUT = ["#816e89", "#5a5f9a", "#6e7f9a", "#7a6a96"];
const DOORS = ["#2f4f8a", "#3f7a4f", "#7a2a30", "#2f7f85"];
const AWN: [string, string][] = [["#e58e6e", "#fceed5"], ["#a3cdc7", "#fceed5"], ["#df585d", "#fceed5"], ["#6f8fc6", "#f6ecd6"]];
const styleOf = (wall: string, trim: string, roofCol: string, r: () => number): Style => {
  const w = tone(wall, WALL_K),
    glassCol = r() > 0.5 ? "#7b7ea0" : "#6670b0",
    sc = SHUT[Math.floor(r() * SHUT.length)],
    dc = DOORS[Math.floor(r() * DOORS.length)];
  const aw = AWN[Math.floor(r() * AWN.length)],
    signCol = r() > 0.5 ? "#4f6f82" : "#f4ead6";
  return {
    wallU: lam("hwU" + w, () => ({
      map: wallTex(w, false)
    })),
    wallG: lam("hwG" + w, () => ({
      map: wallTex(w, true)
    })),
    rev: lam("hrev" + w, () => ({
      color: tone(wall, WALL_K * 0.55)
    })),
    sillShade: lam("hsillsh", () => ({
      map: shadeTex(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    })),
    core: lam("hcore" + w, () => ({
      color: tone(wall, WALL_K * 0.8)
    })),
    trim: lam("htrim" + trim, () => ({
      color: trim
    })),
    stone: stoneMat(),
    glass: lam("hglass" + glassCol, () => ({
      map: glassTex(glassCol)
    })),
    shutA: lam("hshutA" + sc, () => ({
      color: sc
    })),
    shutSlab: lam("hshutS" + sc, () => ({
      map: shutTex(sc)
    })),
    door: lam("hdoor" + dc, () => ({
      color: dc
    })),
    doorPanel: lam("hdoorP" + dc, () => ({
      color: tone(dc, 1.18)
    })),
    gutter: lam("hgutter", () => ({
      color: "#7d8294"
    })),
    brass: lam("hbrass", () => ({
      color: "#d4a84e"
    })),
    soil: lam("hsoil", () => ({
      color: "#6a4a38"
    })),
    leaf: lam("hleaf", () => ({
      color: "#5aa84a"
    })),
    wood: lam("hwood", () => ({
      color: "#a8744a"
    })),
    tiles: [0, 1, 2].map(k => lam("htile" + roofCol + k, () => ({
      map: tileTex(roofCol, k)
    }))),
    deck: lam("hdeck", () => ({
      color: "#6a5a60",
      side: THREE.DoubleSide
    })),
    lampGlass: lam("hlampg", () => ({
      color: "#fff0b8"
    })),
    brick: lam("hbrick", () => ({
      map: brick()
    })),
    curt: ["#e9a3b1", "#ecd2a8", "#e9a3b1"].map(c => lam("hcurt" + c, () => ({
      color: c
    }))),
    flowers: FLOWER.map(c => lam("hfl" + c, () => ({
      color: c
    }))),
    awnA: lam("hawnA" + aw[0], () => ({
      color: aw[0],
      side: THREE.DoubleSide
    })),
    awnB: lam("hawnB" + aw[1], () => ({
      color: aw[1],
      side: THREE.DoubleSide
    })),
    sign: lam("hsign" + signCol, () => ({
      color: signCol
    }))
  };
};
type Hole = {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};
const wallBand = (o: Out, len: number, y0: number, y1: number, holes: Hole[], fb: number, mat: THREE.Material, R: number) => {
  const sh = new THREE.Shape(),
    a0 = y0 - fb,
    a1 = y1 - fb,
    eps = 1e-6;
  const bot = holes.filter(h => h.y0 <= y0 + eps).sort((p, q) => p.x0 - q.x0);
  sh.moveTo(-len / 2, a0);
  for (const h of bot) {
    sh.lineTo(h.x0, a0);
    sh.lineTo(h.x0, h.y1 - fb);
    sh.lineTo(h.x1, h.y1 - fb);
    sh.lineTo(h.x1, a0);
  }
  sh.lineTo(len / 2, a0);
  sh.lineTo(len / 2, a1);
  sh.lineTo(-len / 2, a1);
  sh.closePath();
  for (const h of holes) {
    if (h.y0 <= y0 + eps) continue;
    const p = new THREE.Path();
    p.moveTo(h.x0, h.y0 - fb);
    p.lineTo(h.x1, h.y0 - fb);
    p.lineTo(h.x1, h.y1 - fb);
    p.lineTo(h.x0, h.y1 - fb);
    p.closePath();
    sh.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: R,
    bevelEnabled: false
  });
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / FH, uv.getY(i) / FH);
  o.geo(g, mat, mat4(0, fb, -R));
};
type WinV = {
  shut: number;
  curt: number;
  flower: boolean;
  head: number;
  lod: number;
  ajar: number;
};
const windowAt = (o: Out, S: Style, R: number, cx: number, y0: number, ww: number, wh: number, v: WinV, r: () => number) => {
  const x0 = cx - ww / 2,
    x1 = cx + ww / 2,
    y1 = y0 + wh,
    zg = -R + 0.015;
  o.geo(quad(V(x0, y0, zg), V(x1, y0, zg), V(x1, y1, zg), V(x0, y1, zg)), S.glass);
  o.box(x0 - 0.08, y0 - 0.07, -0.03, x1 + 0.08, y0 + 0.012, 0.08, S.trim);
  const fw = 0.07,
    zb = -R + 0.005,
    zf = -R + 0.075,
    e = 0.015;
  if (parts(1)) {
    o.box(x0 + e, y0 + 0.01, zb, x0 + e + fw, y1 - e, zf, S.trim);
    o.box(x1 - e - fw, y0 + 0.01, zb, x1 - e, y1 - e, zf, S.trim);
    o.box(x0 + e + fw, y1 - e - fw, zb, x1 - e - fw, y1 - e, zf, S.trim);
    o.box(x0 + e + fw, y0 + 0.01, zb, x1 - e - fw, y0 + 0.01 + fw, zf, S.trim);
    o.box(cx - 0.025, y0 + fw, zb, cx + 0.025, y1 - fw, zf - 0.02, S.trim);
    if (wh > 1.2) o.box(x0 + fw, y0 + wh * 0.62, zb, x1 - fw, y0 + wh * 0.62 + 0.05, zf - 0.02, S.trim);
  }
  if (parts(3)) for (const k of [0.3, 0.86]) {
    o.box(x0 + e + fw, y0 + wh * k, zb, x1 - e - fw, y0 + wh * k + 0.03, zf - 0.035, S.trim);
  }
  const lin = 0.012;
  o.box(x0, y0, zb, x0 + lin, y1, 0, S.rev);
  o.box(x1 - lin, y0, zb, x1, y1, 0, S.rev);
  o.box(x0 + lin, y1 - lin, zb, x1 - lin, y1, 0, S.rev);
  o.box(x0 - 0.11, y1 - 0.01, -0.01, x1 + 0.11, y1 + 0.15, 0.06, S.trim);
  if (v.head === 1 && v.lod < 2) o.box(cx - 0.1, y1 - 0.01, 0.0, cx + 0.1, y1 + 0.24, 0.1, S.trim);
  if (v.head === 2 && v.lod < 1) o.box(x0 - 0.17, y1 + 0.15, -0.01, x1 + 0.17, y1 + 0.21, 0.12, S.trim);
  if (v.curt && parts(2)) {
    const c = S.curt[v.curt - 1],
      dw = ww * 0.26,
      zc = -R + 0.03,
      top = y1 - fw - 0.02,
      bot = y0 + wh * 0.15,
      nf = v.lod < 2 ? 3 : 1;
    for (const sd of [-1, 1]) for (let k = 0; k < nf; k++) {
      const xa = sd < 0 ? x0 + e + fw + k * dw / nf : x1 - e - fw - dw + k * dw / nf,
        hz = k % 2 ? 0.014 : 0;
      o.box(xa, bot + k % 2 * 0.03, zc, xa + dw / nf, top, zc + 0.014 + hz, c);
    }
    if (v.lod < 2) o.box(x0 + e + fw, top - 0.06, zc, x1 - e - fw, top, zc + 0.02, c);
  }
  if (v.lod >= 1) {
    if (v.shut === 1) o.box(x0, y0, 0.0, x1, y1, 0.04, S.shutSlab);else if (v.shut > 1) {
      const lw = ww * 0.42;
      o.box(x0 - 0.04 - lw, y0, 0, x0 - 0.04, y1, 0.04, S.shutSlab);
      o.box(x1 + 0.04, y0, 0, x1 + 0.04 + lw, y1, 0.04, S.shutSlab);
    }
    return;
  }
  if (v.lod === 0 && parts(2)) o.geo(quad(V(x0 - 0.1, y0 - 0.34, 0.004), V(x1 + 0.1, y0 - 0.34, 0.004), V(x1 + 0.1, y0 - 0.07, 0.004), V(x0 - 0.1, y0 - 0.07, 0.004)), S.sillShade);
  if (v.shut) {
    const lw = v.shut === 1 ? ww / 2 : ww * 0.42;
    for (const s of [-1, 1]) {
      const left = s < 0,
        flat = v.shut === 2;
      const hx = v.shut === 1 ? left ? x0 : x1 : left ? x0 - 0.04 : x1 + 0.04;
      const dirS = left ? 1 : -1;
      const phi = v.shut === 1 ? 0 : v.shut === 2 ? 0 : Math.PI * (0.55 + 0.25 * v.ajar);
      const leaf = o.sub(hx, y0 - 0.01, 0.025, -dirS * phi);
      const ext = flat ? -dirS : dirS;
      const a = ext > 0 ? 0 : -lw,
        b = ext > 0 ? lw : 0,
        st = 0.05;
      leaf.box(a, 0, -0.02, b, wh + 0.02, 0.015, S.shutA);
      leaf.box(a, 0, 0.015, a + st, wh + 0.02, 0.03, S.shutA);
      leaf.box(b - st, 0, 0.015, b, wh + 0.02, 0.03, S.shutA);
      leaf.box(a, 0, 0.015, b, 0.06, 0.03, S.shutA);
      leaf.box(a, wh - 0.04, 0.015, b, wh + 0.02, 0.03, S.shutA);
      const n = 7,
        g = new THREE.BoxGeometry(lw - 2 * st, 0.12, 0.024);
      if (parts(2)) for (let k = 0; k < n; k++) leaf.geo(g, S.shutA, new THREE.Matrix4().compose(V((a + b) / 2, 0.14 + k * (wh - 0.26) / (n - 1), 0.028), new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), 0.55), V(1, 1, 1)));
    }
  }
  if (v.flower && parts(2)) {
    const fx0 = x0 - 0.04,
      fx1 = x1 + 0.04,
      fy1 = y0 - 0.1;
    o.box(fx0, fy1 - 0.2, 0.0, fx1, fy1, 0.2, S.wood);
    o.box(fx0 + 0.02, fy1, 0.02, fx1 - 0.02, fy1 + 0.02, 0.18, S.soil);
    const n = 4 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const fx = fx0 + 0.1 + (fx1 - fx0 - 0.2) * (i + r() * 0.4) / n,
        rr = 0.07 + r() * 0.03;
      o.sph(fx, fy1 + 0.08, 0.1 + i % 2 * 0.04, rr * 1.1, rr * 0.9, rr * 1.1, S.leaf, 6);
      o.sph(fx, fy1 + 0.16, 0.11 + i % 2 * 0.04, rr * 0.8, rr * 0.8, rr * 0.8, S.flowers[(i + Math.floor(r() * 3)) % S.flowers.length], 6);
    }
  }
};
const doorAt = (o: Out, S: Style, R: number, cx: number, lod: number, glazed: boolean) => {
  const dw = 0.45,
    zl = -R + 0.02;
  if (lod >= 2) {
    o.box(cx - dw, 0, zl, cx + dw, 2.05, zl + 0.05, S.door);
    o.box(cx - 0.535, 0, -0.1, cx - 0.45, 2.385, 0.025, S.trim);
    o.box(cx + 0.45, 0, -0.1, cx + 0.535, 2.385, 0.025, S.trim);
    o.box(cx - 0.535, 2.3, -0.1, cx + 0.535, 2.385, 0.025, S.trim);
    o.box(cx - 0.7, 0, 0, cx + 0.7, 0.18, 0.4, S.stone, 2);
    return;
  }
  o.box(cx - 0.535, 0, -0.1, cx - 0.45, 2.385, 0.025, S.trim);
  o.box(cx + 0.45, 0, -0.1, cx + 0.535, 2.385, 0.025, S.trim);
  o.box(cx - 0.535, 2.3, -0.1, cx + 0.535, 2.385, 0.025, S.trim);
  o.box(cx - dw, 0, zl, cx + dw, 2.05, zl + 0.06, S.door);
  o.box(cx - dw - 0.01, 2.03, zl, cx + dw + 0.01, 2.11, zl + 0.085, S.trim);
  o.geo(quad(V(cx - dw, 2.11, zl + 0.01), V(cx + dw, 2.11, zl + 0.01), V(cx + dw, 2.3, zl + 0.01), V(cx - dw, 2.3, zl + 0.01)), S.glass);
  o.box(cx - 0.02, 2.11, zl, cx + 0.02, 2.29, zl + 0.06, S.trim);
  if (glazed) {
    o.geo(quad(V(cx - 0.36, 0.95, zl + 0.065), V(cx + 0.36, 0.95, zl + 0.065), V(cx + 0.36, 1.95, zl + 0.065), V(cx - 0.36, 1.95, zl + 0.065)), S.glass);
    o.box(cx - 0.015, 0.95, zl + 0.06, cx + 0.015, 1.95, zl + 0.085, S.door);
  } else {
    if (parts(2)) for (const [ya, yb] of [[0.15, 0.98], [1.1, 1.95]]) for (const [xa, xb] of [[cx - 0.37, cx - 0.03], [cx + 0.03, cx + 0.37]]) o.box(xa + 0.04, ya, zl + 0.06, xb - 0.04, yb, zl + 0.095, S.doorPanel);
  }
  if (parts(3) && !glazed) {
    for (const y of [0.4, 1.7]) o.box(cx - dw, y, zl + 0.06, cx - dw + 0.3, y + 0.05, zl + 0.085, S.gutter);
    for (const y of [0.55, 0.85, 1.4, 1.75]) for (const x of [cx - 0.3, cx + 0.3]) o.sph(x, y, zl + 0.1, 0.018, 0.018, 0.012, S.brass, 6);
  }
  if (lod < 1 && parts(2)) {
    o.sph(cx + 0.33, 1.0, zl + 0.1, 0.035, 0.035, 0.035, S.brass, 6);
    o.box(cx - 0.75, 0, 0, cx + 0.75, 0.14, 0.5, S.stone, 2);
    o.box(cx - 0.65, 0.14, 0, cx + 0.65, 0.28, 0.26, S.stone, 2);
  } else o.box(cx - 0.7, 0, 0, cx + 0.7, 0.18, 0.4, S.stone, 2);
};
const lantern = (o: Out, S: Style, x: number, y: number, z: number) => {
  o.box(x - 0.03, y - 0.1, 0, x + 0.03, y + 0.12, 0.03, S.gutter);
  o.box(x - 0.015, y - 0.02, 0.02, x + 0.015, y + 0.02, z, S.gutter);
  o.rod(V(x, y - 0.1, 0.03), V(x, y - 0.015, z - 0.02), 0.012, S.gutter, 4);
  o.box(x - 0.07, y + 0.02, z - 0.07, x + 0.07, y + 0.04, z + 0.07, S.gutter);
  o.box(x - 0.055, y + 0.04, z - 0.055, x + 0.055, y + 0.22, z + 0.055, S.lampGlass);
  o.box(x - 0.08, y + 0.22, z - 0.08, x + 0.08, y + 0.25, z + 0.08, S.gutter);
  o.cyl(x, y + 0.25, z, 0.07, 0.07, S.gutter, 6, 0.01);
};
const awning = (o: Out, S: Style, x0: number, x1: number, ya: number, proj: number, drop: number, lod: number) => {
  const sw = 0.28,
    n = Math.max(2, Math.round((x1 - x0) / sw)),
    w = (x1 - x0) / n,
    L = Math.hypot(proj, drop),
    phi = Math.atan2(drop, proj);
  for (let i = 0; i < n; i++) {
    const xa = x0 + i * w,
      m = i % 2 ? S.awnB : S.awnA;
    o.sub(0, ya, 0.0, 0, phi).box(xa, 0, 0, xa + w, 0.025, L, m);
    if (lod < 2) {
      o.box(xa, ya - drop - 0.14, proj, xa + w, ya - drop + 0.01, proj + 0.02, m);
      if (lod < 1) o.geo(new THREE.CircleGeometry(w / 2, seg(10), Math.PI, Math.PI), m, mat4(xa + w / 2, ya - drop - 0.14, proj + 0.01));
    }
  }
  if (lod < 1) for (const x of [x0 + 0.1, x1 - 0.1]) o.rod(V(x, ya - 0.3, 0.02), V(x, ya - drop - 0.02, proj - 0.05), 0.014, S.gutter, 5);
};
const slope = (o: Out, S: Style, A: THREE.Vector3, B: THREE.Vector3, C: THREE.Vector3, D: THREE.Vector3, lod: number, r: () => number) => {
  const n = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(D, A)).normalize();
  if (n.y < 0) n.negate();
  const len = new THREE.Vector3().subVectors(D, A).length(),
    course = [0.2, 0.3, 0.6][lod];
  const N = Math.max(2, Math.round(len / course)),
    mid = new THREE.Vector3().addVectors(A, C).multiplyScalar(0.5),
    inside = mid.clone().addScaledVector(n, -1);
  const P = (s: number, side: number) => side ? new THREE.Vector3().lerpVectors(B, C, s) : new THREE.Vector3().lerpVectors(A, D, s);
  const tLo = lod === 2 ? 0.03 : 0.065,
    tHi = 0.012;
  for (let k = 0; k < N; k++) {
    const s0 = k / N,
      s1 = Math.min(1, (k + 1.3) / N);
    const a = P(s0, 0),
      b = P(s0, 1),
      c = P(s1, 1),
      d = P(s1, 0);
    const at = a.clone().addScaledVector(n, tLo),
      bt = b.clone().addScaledVector(n, tLo),
      ct = c.clone().addScaledVector(n, tHi),
      dt = d.clone().addScaledVector(n, tHi);
    const uw = (a.distanceTo(b) + d.distanceTo(c)) / 2 / 1.2,
      mat = S.tiles[Math.floor(r() * 3)];
    const fs = [qo(at, bt, ct, dt, inside, uw, 1), qo(a, b, bt, at, inside, uw, 0.2)];
    if (lod < 2) fs.push(qo(a, at, dt, d, inside), qo(b, bt, ct, c, inside));
    o.geo(merge(fs), mat);
  }
  o.geo(merge([qo(A, B, C, D, inside)]), S.deck, new THREE.Matrix4().makeTranslation(-n.x * 0.01, -n.y * 0.01, -n.z * 0.01));
};
const TP = 0.66;
const roofFrame = (o: Out, S: Style, Wr: number, Dr: number, ov: number, hip: boolean, lod: number, r: () => number) => {
  const X = Wr / 2 + (hip ? ov : 0.28),
    Z = Dr / 2 + ov,
    ye = 0.14,
    yr = ye + TP * Z;
  if (!hip) {
    for (const rot of [0, Math.PI]) slope(o.sub(0, 0, 0, rot), S, V(-X, ye, Z), V(X, ye, Z), V(X, yr, 0), V(-X, yr, 0), lod, r);
    const yb = ye + TP * ov - 0.03,
      sh = new THREE.Shape();
    sh.moveTo(-Dr / 2, 0);
    sh.lineTo(Dr / 2, 0);
    sh.lineTo(Dr / 2, yb);
    sh.lineTo(0, yr - 0.03);
    sh.lineTo(-Dr / 2, yb);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, {
      depth: 0.2,
      bevelEnabled: false
    });
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / FH, uv.getY(i) / FH);
    for (const sx of [1, -1]) o.geo(g, S.wallU, new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(sx > 0 ? Wr / 2 - 0.2 : -Wr / 2, 0, 0));
    o.rod(V(-X - 0.05, yr + 0.03, 0), V(X + 0.05, yr + 0.03, 0), 0.12, S.tiles[1], 6);
    return {
      ye,
      yr,
      X,
      Z
    };
  }
  const lx = Math.max(0, X - Z);
  for (const rot of [0, Math.PI]) slope(o.sub(0, 0, 0, rot), S, V(-X, ye, Z), V(X, ye, Z), V(lx, yr, 0), V(-lx, yr, 0), lod, r);
  for (const rot of [Math.PI / 2, -Math.PI / 2]) slope(o.sub(0, 0, 0, rot), S, V(-Z, ye, X), V(Z, ye, X), V(0, yr, lx), V(0, yr, lx), lod, r);
  if (lx > 0.01) o.rod(V(-lx, yr + 0.03, 0), V(lx, yr + 0.03, 0), 0.12, S.tiles[1], 6);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) o.rod(V(sx * X, ye + 0.03, sz * Z), V(sx * lx, yr + 0.03, 0), 0.09, S.tiles[1], 5);
  return {
    ye,
    yr,
    X,
    Z
  };
};
export function house(b: Batch, op: HouseOpts): {
  w: number;
  d: number;
  h: number;
} {
  const r = rng(Math.abs(Math.floor(op.seed)) * 7 + 13);
  for (let i = 0; i < 4; i++) r();
  const floors = Math.max(1, Math.min(4, Math.round(op.floors ?? 2))),
    shop = !!op.shop,
    lod = Math.max(op.lod ?? 0, 2 - detail().parts) as 0 | 1 | 2;
  const w = op.w ?? (shop ? 6.2 : U(r, 4.6, 7)),
    d = op.d ?? U(r, 6, 8.5);
  const roofType = op.roof ?? (r() < 0.25 ? "hip" : "gable"),
    flat = roofType === "flat",
    hip = roofType === "hip";
  const wall = op.wall ?? ["#f3e6d2", "#e58e6e", "#df585d", "#a3cdc7"][Math.floor(r() * 4)],
    trim = op.trim ?? "#fceed5";
  const roofCol = op.roofCol ?? ["#dc8872", "#c87563", "#ec9c87"][Math.floor(r() * 3)];
  const H = floors * FH,
    bays = Math.max(1, op.bays ?? Math.round((w - 0.9) / 1.7));
  const frontGable = roofType === "gable" && !shop && r() < 0.22 && floors <= 3;
  const ov = U(r, 0.3, 0.45),
    R = U(r, 0.12, 0.18);
  const ridgeAlongZ = frontGable || hip && d > w;
  const Wr = ridgeAlongZ ? d : w,
    Dr = ridgeAlongZ ? w : d;
  const S = styleOf(wall, trim, roofCol, r);
  const rise = flat ? 0.62 : 0.14 + TP * (Dr / 2 + ov);
  const yaw = op.yaw ?? 0,
    X0 = op.x,
    Y0 = op.y ?? 0,
    Z0 = op.z;
  const ext = Math.max(w, d) / 2 + 0.6;
  if (inTheWay(X0 - ext, X0 + ext, Y0, Y0 + H + rise, Z0 - ext, Z0 + ext)) return {
    w,
    d,
    h: H + rise
  };
  const root = new Out(b, mat4(X0, Y0, Z0, yaw));
  const corner = Math.floor(r() * 3),
    headStyle = Math.floor(r() * 3),
    lampStyle = Math.floor(r() * 3),
    shutP = r() < 0.85 ? 0.85 : 0.5,
    curtP = U(r, 0.45, 0.6),
    flowP = r() < 0.5 ? 0.35 : 0.0;
  const doorBay = shop ? r() < 0.5 ? 0 : bays - 1 : Math.floor(bays / 2),
    pitchX = (w - 0.9) / bays,
    wh = 1.55;
  const doorX = -w / 2 + 0.45 + pitchX * (doorBay + 0.5);
  const winV = (f: number, face: number): WinV => ({
    shut: r() < shutP ? [1, 2, 2, 3][Math.floor(r() * 4)] : 0,
    curt: r() < curtP ? 1 + Math.floor(r() * 3) : 0,
    flower: face === 0 && f < 2 && r() < flowP,
    head: headStyle,
    lod,
    ajar: r()
  });
  root.box(-w / 2 + R, 0, -d / 2 + R, w / 2 - R, H, d / 2 - R, S.wallU);
  const faces: [Out, number, number][] = [[root.sub(0, 0, d / 2, 0), w, 0], [root.sub(0, 0, -d / 2, Math.PI), w, 1], [root.sub(w / 2, 0, 0, Math.PI / 2), d - 2 * R, 2], [root.sub(-w / 2, 0, 0, -Math.PI / 2), d - 2 * R, 3]];
  for (const [fo, len, face] of faces) {
    if (face === 1 && lod >= 1) {
      fo.box(-len / 2, 0, -R, len / 2, H, 0, S.wallU, FH);
      continue;
    }
    const nb = face < 2 ? bays : Math.max(1, Math.round(len / 1.9)),
      px = face < 2 ? pitchX : len / nb,
      wwf = Math.max(0.7, Math.min(1.0, px * 0.52));
    const cxOf = (i: number) => face < 2 ? -len / 2 + 0.45 + px * (i + 0.5) : -len / 2 + px * (i + 0.5);
    fo.box(-len / 2, 0, -R - 0.2, len / 2, H, -R, S.core);
    for (let f = 0; f < floors; f++) {
      const fb = f * FH,
        holes: Hole[] = [];
      let shopWin: Hole | null = null,
        doorCx: number | null = null;
      for (let i = 0; i < nb; i++) {
        const cx = cxOf(i);
        if (face === 0 && f === 0 && i === doorBay) {
          holes.push({
            x0: cx - 0.55,
            x1: cx + 0.55,
            y0: 0,
            y1: 2.4
          });
          doorCx = cx;
          continue;
        }
        if (face === 0 && f === 0 && shop) continue;
        holes.push({
          x0: cx - wwf / 2,
          x1: cx + wwf / 2,
          y0: fb + 0.95,
          y1: fb + 0.95 + wh
        });
      }
      if (face === 0 && f === 0 && shop) {
        shopWin = doorBay === 0 ? {
          x0: doorX + 0.7,
          x1: len / 2 - 0.4,
          y0: 0.75,
          y1: 2.3
        } : {
          x0: -len / 2 + 0.4,
          x1: doorX - 0.7,
          y0: 0.75,
          y1: 2.3
        };
        holes.push(shopWin);
      }
      wallBand(fo, len, fb, fb + FH, holes, fb, f === 0 ? S.wallG : S.wallU, R);
      for (let i = 0; i < nb; i++) {
        if (face === 0 && f === 0 && (i === doorBay || shop)) continue;
        windowAt(fo, S, R, cxOf(i), fb + 0.95, wwf, wh, winV(f, face), r);
      }
      if (doorCx !== null) doorAt(fo, S, R, doorCx, lod, shop);
      if (shopWin) {
        const {
            x0,
            x1
          } = shopWin,
          zb = -R + 0.005;
        fo.geo(quad(V(x0, 0.75, -R + 0.015), V(x1, 0.75, -R + 0.015), V(x1, 2.3, -R + 0.015), V(x0, 2.3, -R + 0.015)), S.glass);
        fo.box(x0 - 0.1, 0.72, -0.03, x1 + 0.1, 0.78, 0.1, S.stone, 2);
        if (lod < 2) {
          fo.box(x0, 0.75, zb, x0 + 0.1, 2.3, zb + 0.08, S.trim);
          fo.box(x1 - 0.1, 0.75, zb, x1, 2.3, zb + 0.08, S.trim);
          fo.box(x0, 2.2, zb, x1, 2.3, zb + 0.08, S.trim);
          fo.box(x0, 0.75, zb, x1, 0.85, zb + 0.08, S.trim);
          fo.box(x0, 1.85, zb, x1, 1.9, zb + 0.06, S.trim);
          const nm = Math.max(1, Math.round((x1 - x0) / 1.2));
          for (let i = 1; i < nm; i++) fo.box(x0 + (x1 - x0) * i / nm - 0.03, 0.75, zb, x0 + (x1 - x0) * i / nm + 0.03, 2.3, zb + 0.07, S.trim);
          if (lod < 1) for (let i = 0; i < nm; i++) fo.box(x0 + (x1 - x0) * i / nm + 0.15, 0.45, 0, x0 + (x1 - x0) * (i + 1) / nm - 0.15, 0.7, 0.03, S.trim);
          fo.box(x0 + 0.05, 2.4, 0, x1 - 0.05, 2.8, 0.1, S.trim);
          fo.box(x0 + 0.1, 2.45, 0.1, x1 - 0.1, 2.75, 0.115, S.sign);
          awning(fo, S, x0 + 0.1, x1 - 0.1, 2.36, 1.1, 0.38, lod);
        }
      }
      if (face === 0 && f === 0 && lod < 1 && parts(2) && !shop) {
        if (lampStyle === 1) lantern(fo, S, doorX + (doorBay < bays / 2 ? 0.85 : -0.85), 1.75, 0.1);else if (lampStyle === 2) fo.box(doorX + 0.75, 1.55, 0, doorX + 0.9, 1.65, 0.015, S.trim);
      }
    }
  }
  const pl = (xa: number, xb: number, za: number, zb: number) => root.box(xa, 0, za, xb, 0.45, zb, S.stone, 2);
  pl(-w / 2 - 0.05, doorX - 0.55, d / 2, d / 2 + 0.05);
  pl(doorX + 0.55, w / 2 + 0.05, d / 2, d / 2 + 0.05);
  pl(-w / 2 - 0.05, w / 2 + 0.05, -d / 2 - 0.05, -d / 2);
  pl(w / 2, w / 2 + 0.05, -d / 2, d / 2);
  pl(-w / 2 - 0.05, -w / 2, -d / 2, d / 2);
  const ringBox = (y0: number, y1: number, p: number) => {
    root.box(-w / 2 - p, y0, d / 2, w / 2 + p, y1, d / 2 + p, S.trim);
    root.box(-w / 2 - p, y0, -d / 2 - p, w / 2 + p, y1, -d / 2, S.trim);
    root.box(w / 2, y0, -d / 2, w / 2 + p, y1, d / 2, S.trim);
    root.box(-w / 2 - p, y0, -d / 2, -w / 2, y1, d / 2, S.trim);
  };
  if (parts(1)) for (let f = 1; f < floors; f++) ringBox(f * FH - 0.08, f * FH + 0.08, 0.07);
  ringBox(H - 0.09, H, 0.07);
  if (lod < 2) {
    ringBox(H - 0.19, H - 0.09, 0.13);
    ringBox(H - 0.27, H - 0.19, 0.19);
  }
  if (parts(3)) for (let k = 0; k * 0.2 + 0.2 < w - 0.1; k++) root.box(-w / 2 + 0.1 + k * 0.2, H - 0.36, d / 2, -w / 2 + 0.2 + k * 0.2, H - 0.27, d / 2 + 0.1, S.trim);
  if (lod < 1 && corner > 0 && parts(2)) {
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      if (corner === 2) {
        root.box(sx > 0 ? w / 2 - 0.3 : -w / 2, 0.45, sz > 0 ? d / 2 : -d / 2 - 0.06, sx > 0 ? w / 2 : -w / 2 + 0.3, H - 0.27, sz > 0 ? d / 2 + 0.06 : -d / 2, S.trim);
        continue;
      }
      for (let k = 0; k * 0.3 + 0.45 < H - 0.45; k++) {
        const y0 = 0.45 + k * 0.3,
          long = k % 2 === 0,
          lf = long ? 0.45 : 0.28,
          ls = long ? 0.28 : 0.45;
        root.box(sx > 0 ? w / 2 - lf : -w / 2, y0, sz > 0 ? d / 2 : -d / 2 - 0.035, sx > 0 ? w / 2 : -w / 2 + lf, y0 + 0.28, sz > 0 ? d / 2 + 0.035 : -d / 2, S.trim);
        root.box(sx > 0 ? w / 2 : -w / 2 - 0.035, y0, sz > 0 ? d / 2 - ls : -d / 2, sx > 0 ? w / 2 + 0.035 : -w / 2, y0 + 0.28, sz > 0 ? d / 2 : -d / 2 + ls, S.trim);
      }
    }
  }
  let top = H + rise;
  if (flat) {
    const t = 0.2,
      hp = 0.55;
    root.box(-w / 2 - 0.05, H, d / 2 - t, w / 2 + 0.05, H + hp, d / 2 + 0.05, S.wallU, FH);
    root.box(-w / 2 - 0.05, H, -d / 2 - 0.05, w / 2 + 0.05, H + hp, -d / 2 + t, S.wallU, FH);
    root.box(w / 2 - t, H, -d / 2 + t, w / 2 + 0.05, H + hp, d / 2 - t, S.wallU, FH);
    root.box(-w / 2 - 0.05, H, -d / 2 + t, -w / 2 + t, H + hp, d / 2 - t, S.wallU, FH);
    root.box(-w / 2 - 0.12, H + hp, -d / 2 - 0.12, w / 2 + 0.12, H + hp + 0.07, d / 2 + 0.12, S.stone, 2);
    root.box(-w / 2 + t, H, -d / 2 + t, w / 2 - t, H + 0.12, d / 2 - t, S.deck);
    top = H + hp + 0.07;
  } else {
    const rf = root.sub(0, H, 0, ridgeAlongZ ? Math.PI / 2 : 0);
    const info = roofFrame(rf, S, Wr, Dr, ov, hip, lod, r);
    top = H + info.yr + 0.1;
    const sx = ridgeAlongZ ? info.Z : info.X,
      sz = ridgeAlongZ ? info.X : info.Z,
      yy = H + 0.005,
      away = V(0, H + 5, 0);
    root.geo(merge([qo(V(-sx, yy, -sz), V(sx, yy, -sz), V(sx, yy, sz), V(-sx, yy, sz), away)]), S.deck);
    if (lod < 2 && r() < 0.75) {
      const cx = U(r, 0.2, 0.32) * Wr * (r() < 0.5 ? 1 : -1),
        cz = -0.15;
      rf.box(cx - 0.3, info.yr - 1.1, cz - 0.3, cx + 0.3, info.yr + 0.85, cz + 0.3, S.brick, 1.4);
      rf.box(cx - 0.38, info.yr + 0.85, cz - 0.38, cx + 0.38, info.yr + 0.97, cz + 0.38, S.stone, 2);
      if (lod < 1 && parts(2)) {
        rf.cyl(cx - 0.12, info.yr + 0.97, cz, 0.07, 0.3, S.tiles[0], 8);
        rf.cyl(cx + 0.12, info.yr + 0.97, cz, 0.07, 0.24, S.tiles[0], 8);
      }
    }
    if (lod < 1 && parts(2) && !ridgeAlongZ && !hip && floors <= 3 && w > 4.5 && r() < 0.45) {
      const dx = (r() < 0.5 ? -1 : 1) * w * 0.2,
        zf = info.Z * 0.5,
        ys = info.ye + TP * (info.Z - zf),
        dwid = 1.4,
        yb = ys - 0.35,
        yt = ys + 1.25,
        DR = 0.12;
      const dm = root.sub(dx, H, 0),
        df = dm.sub(0, 0, zf);
      df.box(-dwid / 2, yb, -DR - 1.4, dwid / 2, yt, -DR, S.core);
      wallBand(df, dwid, yb, yt, [{
        x0: -0.375,
        x1: 0.375,
        y0: yb + 0.5,
        y1: yb + 1.4
      }], yb, S.wallU, DR);
      windowAt(df, S, DR, 0, yb + 0.5, 0.75, 0.9, {
        shut: 0,
        curt: 1,
        flower: false,
        head: 0,
        lod: 1,
        ajar: 0
      }, r);
      roofFrame(dm.sub(0, yt, zf - 0.8, Math.PI / 2), S, 1.6, dwid, 0.15, false, 1, r);
    }
    if (lod < 2) {
      const gy = H + 0.1,
        e = info.Z + 0.03;
      if (ridgeAlongZ) for (const s of [1, -1]) root.rod(V(s * e, gy, -info.X), V(s * e, gy, info.X), 0.045, S.gutter, 6);else for (const s of [1, -1]) root.rod(V(-info.X, gy, s * e), V(info.X, gy, s * e), 0.045, S.gutter, 6);
      const side = shop ? doorBay === 0 ? -1 : 1 : r() < 0.5 ? 1 : -1;
      const px = ridgeAlongZ ? side * (w / 2 + 0.09) : side * (w / 2 - 0.22),
        pz = ridgeAlongZ ? d / 2 - 0.25 : d / 2 + 0.09;
      const ex = ridgeAlongZ ? side * e : px,
        ez = ridgeAlongZ ? pz : e;
      root.rod(V(ex, gy - 0.04, ez), V(px, H - 0.3, pz), 0.03, S.gutter, 5);
      root.rod(V(px, H - 0.3, pz), V(px, 0.12, pz), 0.04, S.gutter, 6);
      root.rod(V(px, 0.12, pz), V(px + (ridgeAlongZ ? 0.14 * side : 0), 0.04, pz + (ridgeAlongZ ? 0 : 0.14)), 0.04, S.gutter, 6);
      if (lod < 1 && parts(2)) for (let y = 0.9; y < H - 0.4; y += 1.0) root.box(px - 0.05, y, pz - 0.06, px + 0.05, y + 0.03, pz + 0.04, S.gutter);
    }
  }
  return {
    w,
    d,
    h: top
  };
}
