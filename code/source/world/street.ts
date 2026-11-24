import * as THREE from "three";
import { Batch, lam, tri, V, inTheWay } from "./build";
import { rng } from "./paint";
import { Out, mat4, stoneMat } from "./house";
import { DETAIL, detail, seg, parts, withTier } from "../assets/tiers";
const at = (b: Batch, x: number, y: number, z: number, yaw: number, s: number) => new Out(b, mat4(x, y, z, yaw).multiply(new THREE.Matrix4().makeScale(s, s, s)));
const U = (r: () => number, a: number, b: number) => a + (b - a) * r();
const M = () => ({
  iron: lam("sIron", () => ({
    color: "#646b82"
  })),
  ironL: lam("sIronL", () => ({
    color: "#8a91a8"
  })),
  wood: lam("sWood", () => ({
    color: "#b07a4a"
  })),
  woodD: lam("sWoodD", () => ({
    color: "#8a5a38"
  })),
  woodL: lam("sWoodL", () => ({
    color: "#d4a66c"
  })),
  cream: lam("sCream", () => ({
    color: "#f4ead6"
  })),
  stone: stoneMat(),
  glass: lam("hlampg", () => ({
    color: "#fff0b8"
  })),
  pot: lam("sPot", () => ({
    color: "#c46a4a"
  })),
  soil: lam("hsoil", () => ({
    color: "#6a4a38"
  })),
  leafA: lam("sLeafA", () => ({
    color: "#5aa84a"
  })),
  leafB: lam("sLeafB", () => ({
    color: "#4c9a40"
  })),
  water: lam("sWater", () => ({
    color: "#6fb0e0"
  })),
  wire: lam("sWire", () => ({
    color: "#4a4658"
  }))
});
const FL = ["#e8708f", "#f4c43e", "#fbf1e2", "#e8805a", "#c78ae0"].map(c => lam("hfl" + c, () => ({
  color: c
})));
const FLAG = ["#e58e6e", "#a3cdc7", "#f4c43e", "#fceed5", "#6f8fc6", "#df585d"];
const AWN: [string, string][] = [["#e58e6e", "#fceed5"], ["#a3cdc7", "#fceed5"], ["#df585d", "#fceed5"], ["#6f8fc6", "#f6ecd6"]];
const duo = (c: string) => lam("sDuo" + c, () => ({
  color: c,
  side: THREE.DoubleSide
}));
const along = (b: Batch, x0: number, y: number, z0: number, x1: number, z1: number) => {
  const dx = x1 - x0,
    dz = z1 - z0;
  return {
    o: new Out(b, mat4(x0, y, z0, Math.atan2(-dz, dx))),
    L: Math.hypot(dx, dz)
  };
};
/** lamp post: stone base, tapered fluted post (8 facets), collars, an arm, and a lantern with cage, glass and cap.
 *  Returns the bulb position (world) for a practical light. */

export function lampPost(b: Batch, x: number, y: number, z: number, yaw = 0, seed = 0, s = 1): THREE.Vector3 {
  const o = at(b, x, y, z, yaw, s),
    m = M();
  o.box(-0.2, 0, -0.2, 0.2, 0.18, 0.2, m.stone, 1.5);
  o.box(-0.16, 0.18, -0.16, 0.16, 0.3, 0.16, m.stone, 1.5);
  o.cyl(0, 0.3, 0, 0.13, 0.65, m.iron, 8, 0.075);
  if (parts(2)) o.cyl(0, 0.93, 0, 0.1, 0.07, m.ironL, 8);
  o.cyl(0, 1.0, 0, 0.048, 2.0, m.iron, 8);
  if (parts(2)) {
    o.cyl(0, 2.2, 0, 0.07, 0.05, m.ironL, 8);
    o.cyl(0, 2.95, 0, 0.085, 0.07, m.ironL, 8);
  }
  if (parts(3)) for (const [bx, bz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) o.cyl(bx * 0.14, 0.18, bz * 0.14, 0.018, 0.02, m.ironL, 6);
  const ay = 2.7 + seed % 3 * 0.03;
  o.rod(V(0, ay, 0), V(0.42, ay, 0), 0.016, m.iron, 5);
  if (parts(2)) {
    o.rod(V(0, ay - 0.35, 0), V(0.42, ay, 0), 0.014, m.iron, 5);
    o.sph(0.43, ay, 0, 0.03, 0.03, 0.03, m.ironL, 6);
  }
  o.cyl(0, 3.02, 0, 0.15, 0.04, m.iron, 8);
  o.box(-0.1, 3.06, -0.1, 0.1, 3.38, 0.1, m.glass);
  if (parts(2)) for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) o.rod(V(cx * 0.115, 3.04, cz * 0.115), V(cx * 0.115, 3.4, cz * 0.115), 0.011, m.iron, 4);
  o.cyl(0, 3.38, 0, 0.17, 0.05, m.iron, 8);
  o.cyl(0, 3.43, 0, 0.16, 0.16, m.iron, 8, 0.02);
  if (parts(2)) o.sph(0, 3.62, 0, 0.035, 0.035, 0.035, m.ironL, 6);
  return V(0, 3.22, 0).applyMatrix4(o.m);
}
/** park bench: wood seat + backrest slats, cast-iron legs and arm rests */

export function bench(b: Batch, x: number, y: number, z: number, yaw = 0, seed = 0, s = 1) {
  const o = at(b, x, y, z, yaw, s),
    m = M(),
    wood = seed % 2 ? m.woodL : m.wood;
  for (let i = 0; i < 4; i++) o.box(-0.8, 0.43, -0.2 + i * 0.105, 0.8, 0.47, -0.2 + i * 0.105 + 0.09, wood);
  const bk = o.sub(0, 0.5, -0.22, 0, -0.16);
  for (let i = 0; i < 3; i++) bk.box(-0.8, i * 0.13, 0, 0.8, i * 0.13 + 0.09, 0.035, wood);
  for (const sx of [-0.68, 0.68]) {
    o.box(sx - 0.025, 0, 0.14, sx + 0.025, 0.43, 0.2, m.iron);
    o.rod(V(sx, 0, -0.2), V(sx, 0.95, -0.3), 0.022, m.iron, 5);
    o.box(sx - 0.025, 0.42, -0.24, sx + 0.025, 0.46, 0.22, m.iron);
    if (parts(2)) {
      o.box(sx - 0.03, 0.6, -0.26, sx + 0.03, 0.64, 0.24, m.iron);
      o.rod(V(sx, 0.46, 0.2), V(sx, 0.62, 0.2), 0.02, m.iron, 5);
      o.box(sx - 0.03, 0.0, 0.12, sx + 0.03, 0.03, 0.24, m.iron);
    }
    if (parts(3)) for (const bz of [-0.15, 0.1]) o.sph(sx, 0.48, bz, 0.018, 0.012, 0.018, m.ironL, 6);
  }
}
/** barrel: bulging staves (12 facets), 4 iron hoops, a lid */

export function barrel(b: Batch, x: number, y: number, z: number, yaw = 0, seed = 0, s = 1) {
  const o = at(b, x, y, z, yaw, s),
    m = M(),
    prof = [[0.26, 0], [0.3, 0.1], [0.34, 0.25], [0.36, 0.4], [0.34, 0.55], [0.3, 0.7], [0.26, 0.8]];
  o.geo(new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r, h)), seg(12)), seed % 2 ? m.woodD : m.wood);
  if (parts(1)) for (const h of [0.1, 0.28, 0.52, 0.7]) {
    const r = prof.reduce((a, p, i, arr) => i && arr[i - 1][1] <= h && p[1] >= h ? arr[i - 1][0] + (p[0] - arr[i - 1][0]) * (h - arr[i - 1][1]) / (p[1] - arr[i - 1][1]) : a, 0.3);
    o.geo(new THREE.TorusGeometry(r + 0.004, 0.014, seg(5), seg(14)).rotateX(Math.PI / 2), m.iron, mat4(0, h, 0));
  }
  o.geo(new THREE.CircleGeometry(0.255, seg(12)).rotateX(-Math.PI / 2), m.woodL, mat4(0, 0.801, 0));
}
const crate = (o: Out, m: ReturnType<typeof M>, cx: number, cy: number, cz: number, yaw: number, sz: number, wood: THREE.Material) => {
  const c = o.sub(cx, cy, cz, yaw),
    h = sz / 2,
    p = 0.05,
    T = 0.026;
  for (const [sx, sz2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c.box(sx * h - p / 2, 0, sz2 * h - p / 2, sx * h + p / 2, sz, sz2 * h + p / 2, m.woodD);
  const n = parts(1) ? 4 : 2,
    sh = (sz - 0.06) / n;
  for (let i = 0; i < n; i++) {
    const y0 = 0.03 + i * sh,
      y1 = y0 + sh - 0.02;
    c.box(-h + p / 2, y0, h - T, h - p / 2, y1, h, wood);
    c.box(-h + p / 2, y0, -h, h - p / 2, y1, -h + T, wood);
    c.box(h - T, y0, -h + p / 2, h, y1, h - p / 2, wood);
    c.box(-h, y0, -h + p / 2, -h + T, y1, h - p / 2, wood);
  }
  c.box(-h, 0, -h, h, 0.03, h, m.woodD);
};
/** 1-4 slatted crates, stacked or side by side */

export function crateStack(b: Batch, x: number, y: number, z: number, yaw = 0, seed = 0, s = 1) {
  const r = rng(seed * 11 + 5),
    o = at(b, x, y, z, yaw, s),
    m = M(),
    n = 1 + Math.abs(seed) % 4,
    sz = 0.5;
  const spots: [number, number, number][] = [[0, 0, 0], [0.56, 0, 0.02], [0.28, sz, 0.01], [-0.56, 0, -0.02]];
  const order = n === 1 ? [0] : n === 2 ? seed % 2 ? [0, 2] : [0, 1] : n === 3 ? [0, 1, 2] : [0, 1, 2, 3];
  for (const i of order) {
    const [cx, cy, cz] = spots[i];
    crate(o, m, cx + (i ? U(r, -0.02, 0.02) : 0), cy, cz, U(r, -0.12, 0.12), sz, r() < 0.5 ? m.wood : m.woodL);
  }
}
/** planter: tapered pot with a rim, soil, a round shrub of 5 lobes and flower blobs */

export function planter(b: Batch, x: number, y: number, z: number, yaw = 0, seed = 0, s = 1) {
  const r = rng(seed * 13 + 3),
    o = at(b, x, y, z, yaw, s),
    m = M();
  o.cyl(0, 0, 0, 0.19, 0.42, m.pot, 10, 0.27);
  o.cyl(0, 0.4, 0, 0.3, 0.07, m.pot, 10);
  o.cyl(0, 0.46, 0, 0.26, 0.02, m.soil, 10);
  const g = r() < 0.5 ? m.leafA : m.leafB;
  o.sph(0, 0.72, 0, 0.28, 0.25, 0.28, g, 9);
  if (parts(1)) for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + r();
    o.sph(Math.cos(a) * 0.2, 0.62 + r() * 0.14, Math.sin(a) * 0.2, 0.17, 0.15, 0.17, r() < 0.5 ? m.leafA : m.leafB, 8);
  }
  if (parts(2)) for (let i = 0; i < 6; i++) {
    const a = r() * 6.28,
      e = U(r, 0.2, 1.2),
      rr = 0.3;
    o.sph(Math.cos(a) * Math.cos(e) * rr, 0.72 + Math.sin(e) * 0.27, Math.sin(a) * Math.cos(e) * rr, 0.045, 0.045, 0.045, FL[Math.floor(r() * FL.length)], 6);
  }
}
/** bollard: iron post, collar, domed top */

export function bollard(b: Batch, x: number, y: number, z: number, yaw = 0, seed = 0, s = 1) {
  const o = at(b, x, y, z, yaw, s),
    m = M();
  o.cyl(0, 0, 0, 0.1, 0.1, m.stone, 8);
  o.cyl(0, 0.1, 0, 0.08, 0.6, seed % 2 ? m.ironL : m.iron, 8);
  if (parts(2)) o.cyl(0, 0.52, 0, 0.1, 0.04, m.ironL, 8);
  o.sph(0, 0.7, 0, 0.085, 0.07, 0.085, seed % 2 ? m.ironL : m.iron, 8);
}
/** sign post with a blank, framed, arrow-shaped board (and a second one on some seeds) */

export function signPost(b: Batch, x: number, y: number, z: number, yaw = 0, seed = 0, s = 1) {
  const o = at(b, x, y, z, yaw, s),
    m = M(),
    shape = (k: number, sx: number) => {
      const sh = new THREE.Shape();
      sh.moveTo(-0.4 * k, -0.13 * k);
      sh.lineTo(0.28 * sx * k, -0.13 * k);
      sh.lineTo(0.44 * sx * k, 0);
      sh.lineTo(0.28 * sx * k, 0.13 * k);
      sh.lineTo(-0.4 * k, 0.13 * k);
      sh.closePath();
      return sh;
    };
  o.cyl(0, 0, 0, 0.04, 2.3, m.woodD, 6);
  if (parts(2)) o.sph(0, 2.32, 0, 0.05, 0.05, 0.05, m.woodD, 6);
  const board = (yy: number, sx: number) => {
    const sub = o.sub(0.05 * sx, yy, 0.05, 0),
      fr = new THREE.ExtrudeGeometry(shape(1.12, sx), {
        depth: 0.02,
        bevelEnabled: false
      }),
      bd = new THREE.ExtrudeGeometry(shape(1, sx), {
        depth: 0.03,
        bevelEnabled: false
      });
    if (parts(2)) sub.geo(fr, m.woodD, mat4(0, 0, -0.01));
    sub.geo(bd, m.cream, mat4(0, 0, 0.01));
  };
  board(1.95, 1);
  if (seed % 2) board(1.6, -1);
}
/** two-point lines: a sagging wire with small bulbs; returns the bulb positions */

export function stringLights(b: Batch, a: THREE.Vector3, bb: THREE.Vector3, seed = 0, sag = 0.45): THREE.Vector3[] {
  const r = rng(seed * 17 + 1),
    m = M(),
    o = new Out(b, new THREE.Matrix4()),
    len = a.distanceTo(bb),
    n = Math.max(2, Math.round(len / 0.55)),
    out: THREE.Vector3[] = [];
  const P = (u: number) => new THREE.Vector3().lerpVectors(a, bb, u).setY(a.y + (bb.y - a.y) * u - sag * 4 * u * (1 - u));
  const segs = Math.max(8, Math.round(len / 0.3));
  for (let i = 0; i < segs; i++) o.rod(P(i / segs), P((i + 1) / segs), 0.008, m.wire, 4);
  const cols = ["#fff0b8", "#ffd27a", "#ffb7a6", "#fff6d6"].map(c => lam("sBulb" + c, () => ({
    color: c
  })));
  for (let i = 1; i < n; i++) {
    const p = P(i / n + U(r, -0.015, 0.015));
    if (parts(2)) o.cyl(p.x, p.y - 0.03, p.z, 0.012, 0.03, m.wire, 4);
    o.sph(p.x, p.y - 0.085, p.z, 0.04, 0.052, 0.04, cols[i % 4], 6);
    out.push(V(p.x, p.y - 0.085, p.z));
  }
  return out;
}
/** bunting: a sagging line of small triangle flags in muted colours */

export function bunting(b: Batch, a: THREE.Vector3, bb: THREE.Vector3, seed = 0, sag = 0.4) {
  const r = rng(seed * 19 + 7),
    m = M(),
    o = new Out(b, new THREE.Matrix4()),
    len = a.distanceTo(bb),
    n = Math.max(3, Math.round(len / 0.26));
  const P = (u: number) => new THREE.Vector3().lerpVectors(a, bb, u).setY(a.y + (bb.y - a.y) * u - sag * 4 * u * (1 - u));
  const segs = Math.max(8, Math.round(len / 0.3));
  for (let i = 0; i < segs; i++) o.rod(P(i / segs), P((i + 1) / segs), 0.007, m.wire, 4);
  const yaw = Math.atan2(-(bb.z - a.z), bb.x - a.x),
    g = tri(V(-0.1, 0, 0), V(0.1, 0, 0), V(0, -0.26, 0)),
    start = Math.floor(r() * 6);
  for (let i = 0; i < n; i++) {
    const p = P((i + 0.5) / n);
    o.geo(g, duo(FLAG[(start + i) % 6]), mat4(p.x, p.y - 0.005, p.z, yaw, 0, U(r, -0.12, 0.12)));
  }
}
/** market stall: 4 posts, wooden counter with raised panels, a striped scalloped canopy, trays of produce blobs */

export function marketStall(b: Batch, x: number, y: number, z: number, yaw = 0, seed = 0, s = 1) {
  const r = rng(seed * 23 + 9),
    o = at(b, x, y, z, yaw, s),
    m = M(),
    aw = AWN[Math.abs(seed) % 4],
    A = duo(aw[0]),
    B = duo(aw[1]);
  for (const [px, pz, h] of [[-0.95, 0.6, 2.2], [0.95, 0.6, 2.2], [-0.95, -0.6, 2.4], [0.95, -0.6, 2.4]]) o.box(px - 0.035, 0, pz - 0.035, px + 0.035, h, pz + 0.035, m.woodD);
  o.box(-0.95, 0, -0.62, 0.95, 1.1, -0.58, m.woodD);
  o.box(-0.9, 0.0, 0.15, 0.9, 0.78, 0.6, m.wood);
  o.box(-0.95, 0.78, 0.1, 0.95, 0.83, 0.65, m.woodL);
  if (parts(2)) for (let i = 0; i < 3; i++) o.box(-0.84 + i * 0.58, 0.1, 0.6, -0.4 + i * 0.58, 0.7, 0.625, m.woodL);
  if (parts(3)) for (const [px, pz, h] of [[-0.95, 0.6, 2.2], [0.95, 0.6, 2.2], [-0.95, -0.6, 2.4], [0.95, -0.6, 2.4]]) o.sph(px, h + 0.03, pz, 0.05, 0.05, 0.05, m.woodL, 6);
  const phi = Math.atan2(0.3, 1.5),
    L = Math.hypot(1.5, 0.3),
    n = 8,
    w = 2.1 / n,
    top = o.sub(0, 2.4, -0.75, 0, phi);
  for (let i = 0; i < n; i++) {
    const xa = -1.05 + i * w,
      mm = i % 2 ? B : A;
    top.box(xa, 0, 0, xa + w, 0.025, L, mm);
    o.box(xa, 2.1 - 0.12, 0.74, xa + w, 2.1 + 0.02, 0.76, mm);
    if (parts(2)) o.geo(new THREE.CircleGeometry(w / 2, seg(10), Math.PI, Math.PI), mm, mat4(xa + w / 2, 1.98, 0.75));
  }
  const prod = ["#df585d", "#f0903a", "#e8c43e", "#7cbb4c", "#b04a8a"].map(c => lam("sPr" + c, () => ({
    color: c
  })));
  if (parts(1)) for (let i = 0; i < 3; i++) {
    const cx = -0.62 + i * 0.62,
      pm = prod[(Math.abs(seed) + i * 2) % 5];
    o.box(cx - 0.24, 0.83, 0.22, cx + 0.24, 0.9, 0.52, m.woodD);
    for (let k = 0; k < 9; k++) o.sph(cx + U(r, -0.18, 0.18), 0.95 + U(r, 0, 0.05), 0.37 + U(r, -0.1, 0.1), 0.065, 0.06, 0.065, r() < 0.2 ? prod[Math.floor(r() * 5)] : pm, 6);
  }
}
const ringBlocks = (o: Out, mat: THREE.Material, rad: number, n: number, h: number, y: number, th: number, off = 0) => {
  const cw = Math.PI * 2 * rad / n * 0.5;
  for (let k = 0; k < n; k++) {
    const a = off + k / n * Math.PI * 2;
    o.sub(Math.cos(a) * rad, y, -Math.sin(a) * rad, a + Math.PI / 2).box(-cw, 0, -th / 2, cw, h, th / 2, mat, 1.5);
  }
};
/** stone well: ring of blocks, water, two posts, crossbeam with a bucket, a small tiled roof */

export function well(b: Batch, x: number, y: number, z: number, yaw = 0, seed = 0, s = 1) {
  const o = at(b, x, y, z, yaw, s),
    m = M(),
    roof = lam("sRoofT", () => ({
      color: "#c87563"
    }));
  ringBlocks(o, m.stone, 0.62, 12, 0.62, 0, 0.26);
  if (parts(1)) ringBlocks(o, m.stone, 0.62, 12, 0.08, 0.62, 0.32, Math.PI / 12);
  o.geo(new THREE.CircleGeometry(0.48, seg(14)).rotateX(-Math.PI / 2), m.water, mat4(0, 0.38, 0));
  for (const sx of [-0.75, 0.75]) o.box(sx - 0.045, 0, -0.045, sx + 0.045, 1.75, 0.045, m.woodD);
  o.rod(V(-0.8, 1.45, 0), V(0.8, 1.45, 0), 0.04, m.wood, 6);
  const rf = (sg: number) => o.sub(0, 1.74, 0, 0, 0, -sg * 0.6);
  for (const sg of [-1, 1]) rf(sg).box(sg > 0 ? 0 : -1.0, 0, -0.55, sg > 0 ? 1.0 : 0, 0.07, 0.55, roof);
  if (parts(2)) {
    o.rod(V(0.1, 1.45, 0), V(0.1, 0.8, 0), 0.01, m.wire, 4);
    o.cyl(0.1, 0.62, 0, 0.1, 0.2, m.woodL, 8, 0.12);
  }
  if (seed % 2 && parts(2)) o.box(-0.07, 1.45 - 0.2, 0.0, 0.07, 1.45 + 0.2, 0.04, m.iron);
  if (parts(3)) {
    o.rod(V(0.8, 1.45, 0), V(0.98, 1.45, 0.14), 0.02, m.woodD, 6);
    o.rod(V(0.98, 1.45, 0.14), V(0.98, 1.2, 0.14), 0.02, m.woodD, 6);
  }
}
/** fountain: stone basin, water, pedestal, an upper bowl with water, a finial */

export function fountain(b: Batch, x: number, y: number, z: number, yaw = 0, seed = 0, s = 1) {
  const o = at(b, x, y, z, yaw, s),
    m = M();
  ringBlocks(o, m.stone, 1.15, 16, 0.45, 0, 0.3);
  if (parts(1)) ringBlocks(o, m.stone, 1.15, 16, 0.07, 0.45, 0.36, Math.PI / 16);
  o.geo(new THREE.CircleGeometry(1.02, seg(18)).rotateX(-Math.PI / 2), m.water, mat4(0, 0.36, 0));
  o.cyl(0, 0.1, 0, 0.3, 0.12, m.stone, 10);
  o.cyl(0, 0.2, 0, 0.14, 0.8, m.stone, 10, 0.1);
  const prof = [[0, 0], [0.14, 0.02], [0.45, 0.1], [0.52, 0.22], [0.47, 0.22], [0.4, 0.15], [0, 0.12]];
  o.geo(new THREE.LatheGeometry(prof.map(([rr, h]) => new THREE.Vector2(rr, h)), seg(14)), m.stone, mat4(0, 0.96, 0));
  o.geo(new THREE.CircleGeometry(0.43, seg(14)).rotateX(-Math.PI / 2), m.water, mat4(0, 1.12, 0));
  if (parts(1)) {
    o.cyl(0, 1.1, 0, 0.06, 0.45, m.stone, 8, 0.035);
    o.sph(0, 1.62, 0, 0.07, 0.08, 0.07, seed % 2 ? m.water : m.stone, 8);
  }
}
/** fence from (x0, z0) to (x1, z1): posts with pointed caps + two rails (+ pickets on odd seeds) */

export function fence(b: Batch, x0: number, z0: number, x1: number, z1: number, seed = 0, y = 0, h = 0.95) {
  const {
      o,
      L
    } = along(b, x0, y, z0, x1, z1),
    m = M(),
    wood = seed % 2 ? m.cream : m.wood,
    n = Math.max(1, Math.round(L / 1.1)),
    step = L / n;
  for (let i = 0; i <= n; i++) {
    o.box(i * step - 0.045, 0, -0.045, i * step + 0.045, h, 0.045, wood);
    if (parts(2)) o.cyl(i * step, h, 0, 0.065, 0.07, wood, 4, 0.004);
  }
  for (const hy of [h * 0.3, h * 0.72]) o.box(0, hy, -0.03, L, hy + 0.07, 0.03, wood);
  if (seed % 2) for (let k = 0; k * 0.13 + 0.1 < L; k++) {
    const px = 0.1 + k * 0.13;
    o.box(px - 0.03, 0.05, 0.03, px + 0.03, h * 0.88, 0.05, wood);
    if (parts(2)) o.cyl(px, h * 0.88, 0.04, 0.045, 0.05, wood, 4, 0.003);
  }
}
/** kerb stones along a line: 0.5-0.85 m blocks, slight height and tone jitter, 1.5 cm joints */

export function cobbleKerb(b: Batch, x0: number, z0: number, x1: number, z1: number, seed = 0, y = 0) {
  const {
      o,
      L
    } = along(b, x0, y, z0, x1, z1),
    r = rng(seed * 29 + 3),
    cols = ["#c9bfb2", "#bfb4a6", "#d3c9bb", "#c4b8aa"].map(c => lam("sKerb" + c, () => ({
      color: c
    })));
  for (let x = 0; x < L - 0.05;) {
    const len = Math.min(U(r, 0.5, 0.85), L - x),
      h = 0.17 + U(r, -0.012, 0.012);
    o.box(x, 0, -0.1, x + len - 0.015, h, 0.1, cols[Math.floor(r() * 4)]);
    x += len;
  }
}
export type Kind = {
  name: string;
  size: "big" | "medium" | "small";
  r: number;
  place: (b: Batch, x: number, y: number, z: number, yaw: number, seed: number, scale: number) => unknown;
};
/** the stock point props as scatter kinds (footprint radius in m) */

export const KINDS: Kind[] = [{
  name: "fountain",
  size: "big",
  r: 1.6,
  place: fountain
}, {
  name: "stall",
  size: "big",
  r: 1.5,
  place: marketStall
}, {
  name: "well",
  size: "big",
  r: 1.1,
  place: well
}, {
  name: "bench",
  size: "medium",
  r: 0.9,
  place: bench
}, {
  name: "planter",
  size: "medium",
  r: 0.4,
  place: planter
}, {
  name: "lamp",
  size: "medium",
  r: 0.3,
  place: lampPost
}, {
  name: "barrel",
  size: "small",
  r: 0.4,
  place: barrel
}, {
  name: "crates",
  size: "small",
  r: 0.6,
  place: crateStack
}, {
  name: "bollard",
  size: "small",
  r: 0.2,
  place: bollard
}, {
  name: "sign",
  size: "small",
  r: 0.35,
  place: signPost
}];
/** place n props as clusters (about 15 % big, 30 % medium, the rest small, the small ones gathered around the big
 *  and medium ones), without overlaps, never in front of a registered lens ray. Kinds are built at the "dressing" tier
 *  (or lower when the caller is already in a lower one). Returns what was placed. */

export function scatter(b: Batch, kinds: Kind[], area: {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  y?: number;
}, n: number, seed: number, avoid: [number, number, number, number][] = []) {
  const r = rng(Math.abs(Math.floor(seed)) * 31 + 11),
    placed: {
      kind: Kind;
      x: number;
      z: number;
    }[] = [];
  const by = (sz: Kind["size"]) => kinds.filter(k => k.size === sz),
    pool = {
      big: by("big"),
      medium: by("medium"),
      small: by("small")
    };
  const nb = pool.big.length ? Math.max(1, Math.round(n * 0.15)) : 0,
    nm = pool.medium.length ? Math.round(n * 0.3) : 0,
    ns = pool.small.length ? Math.max(0, n - nb - nm) : 0;
  const free = (x: number, z: number, rr: number) => x - rr >= area.x0 && x + rr <= area.x1 && z - rr >= area.z0 && z + rr <= area.z1 && !placed.some(p => Math.hypot(p.x - x, p.z - z) < p.kind.r + rr + 0.12) && !avoid.some(([ax0, az0, ax1, az1]) => x + rr > ax0 && x - rr < ax1 && z + rr > az0 && z - rr < az1);
  const put = (k: Kind, anchor: {
    x: number;
    z: number;
  } | null) => {
    for (let t = 0; t < 40; t++) {
      let x: number, z: number;
      if (anchor && t < 28) {
        const a = r() * 6.283,
          d = U(r, 0.7, 1.9) + k.r;
        x = anchor.x + Math.cos(a) * d;
        z = anchor.z + Math.sin(a) * d;
      } else {
        x = U(r, area.x0, area.x1);
        z = U(r, area.z0, area.z1);
      }
      if (!free(x, z, k.r) || inTheWay(x - k.r, x + k.r, area.y ?? 0, (area.y ?? 0) + 2, z - k.r, z + k.r, true)) continue;
      placed.push({
        kind: k,
        x,
        z
      });
      const yaw = r() * 6.283,
        sd = Math.floor(r() * 1000),
        sc = 0.9 + r() * 0.25,
        go = () => k.place(b, x, area.y ?? 0, z, yaw, sd, sc);
      if (detail().parts <= DETAIL.dressing.parts) go();else withTier("dressing", go);
      return true;
    }
    return false;
  };
  const pickK = (a: Kind[]) => a[Math.floor(r() * a.length) % a.length];
  for (let i = 0; i < nb; i++) put(pickK(pool.big), null);
  for (let i = 0; i < nm; i++) put(pickK(pool.medium), placed.length && r() < 0.7 ? placed[Math.floor(r() * placed.length)] : null);
  for (let i = 0; i < ns; i++) put(pickK(pool.small), placed.length && r() < 0.8 ? placed[Math.floor(r() * placed.length)] : null);
  return placed.map(p => ({
    name: p.kind.name,
    x: p.x,
    z: p.z,
    size: p.kind.size
  }));
}
