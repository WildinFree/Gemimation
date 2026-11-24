import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { brick, rng, ctex, rep, facadeHD, roofHD, stoneHD } from "./paint";
import { twoTone } from "../light/shade";
import { isCartoon, surf, surfFrom } from "../look/cartoon";
import { detail, seg, parts } from "../assets/tiers";
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const mats = new Map<string, THREE.Material>();
const CHAIN_MATS = new WeakSet<THREE.Material>();
export const lam = (key: string, make: () => THREE.MeshLambertMaterialParameters) => {
  const ck = isCartoon() ? "c:" + key : key;
  let m = mats.get(ck) as THREE.MeshLambertMaterial | undefined;
  if (!m && isCartoon()) {
    const c = key === "chainHD" ? surf({
      col: "#7a8490",
      kind: "metal",
      rough: 0.45
    }) : surfFrom(make());
    if (key === "chainHD") CHAIN_MATS.add(c);
    m = c as unknown as THREE.MeshLambertMaterial;
    mats.set(ck, m);
  }
  if (!m) {
    if (key === "chainHD") {
      const c = twoTone(new THREE.MeshPhongMaterial({
        color: "#7a8490",
        specular: "#6c727b",
        shininess: 30
      }));
      CHAIN_MATS.add(c);
      m = c as unknown as THREE.MeshLambertMaterial;
    } else m = twoTone(new THREE.MeshLambertMaterial(make()));
    mats.set(key, m);
  }
  return m;
};
const f32 = (a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
  const out = new Float32Array(a.count * a.itemSize);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
  return new THREE.Float32BufferAttribute(out, a.itemSize);
};
/** quad a,b,c,d counter-clockwise seen from its front; uv (u0,v0) at a, (u1,v1) at c */
export const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, u1 = 1, v1 = 1, u0 = 0, v0 = 0) => {
  const g = new THREE.BufferGeometry();
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a)).normalize();
  g.setAttribute("position", new THREE.Float32BufferAttribute([a, b, c, a, c, d].flatMap(v => [v.x, v.y, v.z]), 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 2, 3, 4, 5].flatMap(() => [n.x, n.y, n.z]), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1], 2));
  return g;
};
export const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
  const g = new THREE.BufferGeometry();
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
  g.setAttribute("position", new THREE.Float32BufferAttribute([a, b, c].flatMap(v => [v.x, v.y, v.z]), 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 2].flatMap(() => [n.x, n.y, n.z]), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
  return g;
};
/** axis box from min to max, texture tiled every `tile` metres (0 = one image per face) */
export const boxGeo = (min: THREE.Vector3, max: THREE.Vector3, tile = 0, bottom = false) => {
  const [x0, y0, z0] = [min.x, min.y, min.z],
    [x1, y1, z1] = [max.x, max.y, max.z];
  const t = (a: number) => tile ? a / tile : 1;
  const w = x1 - x0,
    h = y1 - y0,
    d = z1 - z0;
  const faces = [quad(V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1), t(w), t(h)), quad(V(x1, y0, z0), V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0), t(w), t(h)), quad(V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0), t(d), t(h)), quad(V(x1, y0, z1), V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1), t(d), t(h)), quad(V(x0, y1, z1), V(x1, y1, z1), V(x1, y1, z0), V(x0, y1, z0), t(w), t(d))];
  if (bottom) faces.push(quad(V(x0, y0, z0), V(x1, y0, z0), V(x1, y0, z1), V(x0, y0, z1), t(w), t(d)));
  return mergeGeometries(faces, false);
};
/** collects pieces by material and merges them into one static mesh per material */
export class Batch {
  private g = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geo: THREE.BufferGeometry, mat: THREE.Material, m?: THREE.Matrix4) {
    const src = geo.index ? geo.toNonIndexed() : geo;
    const x = new THREE.BufferGeometry();
    x.setAttribute("position", f32(src.attributes.position));
    if (src.attributes.normal) x.setAttribute("normal", f32(src.attributes.normal));else x.computeVertexNormals();
    x.setAttribute("uv", src.attributes.uv ? f32(src.attributes.uv) : new THREE.Float32BufferAttribute(new Float32Array(src.attributes.position.count * 2), 2));
    if (m) x.applyMatrix4(m);
    const l = this.g.get(mat);
    if (l) l.push(x);else this.g.set(mat, [x]);
  }
  build(parent: THREE.Object3D, cast = true) {
    for (const [mat, list] of this.g) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      parent.add(mesh);
    }
    this.g.clear();
  }
}
const LNS = 16,
  LNR = 6;
type LinkT = {
  p: Float32Array;
  n: Float32Array;
  idx: number[];
  pitch: number;
};
const linkTemplate = (h: number): LinkT => {
  const ow = h * 0.85,
    rb = ow * 0.14,
    ol = ow * 1.62,
    rc = ow / 2 - rb,
    hl = ol / 2 - rb - rc;
  const p = new Float32Array(LNS * LNR * 3),
    n = new Float32Array(LNS * LNR * 3),
    idx: number[] = [];
  for (let j = 0; j < LNS; j++) {
    const th = 2 * Math.PI * (j + 0.5) / LNS,
      nx = Math.cos(th),
      ny = Math.sin(th);
    const cx = rc * nx + Math.sign(nx) * hl,
      cy = rc * ny;
    for (let k = 0; k < LNR; k++) {
      const ph = 2 * Math.PI * k / LNR,
        cp = Math.cos(ph),
        sp = Math.sin(ph),
        o = (j * LNR + k) * 3;
      p[o] = cx + rb * cp * nx;
      p[o + 1] = cy + rb * cp * ny;
      p[o + 2] = rb * sp;
      n[o] = cp * nx;
      n[o + 1] = cp * ny;
      n[o + 2] = sp;
      const a = j * LNR + k,
        b = j * LNR + (k + 1) % LNR,
        c = (j + 1) % LNS * LNR + (k + 1) % LNR,
        d = (j + 1) % LNS * LNR + k;
      idx.push(a, d, c, a, c, b);
    }
  }
  return {
    p,
    n,
    idx,
    pitch: ol - 4 * rb
  };
};
export class Strand {
  mesh: THREE.Mesh;
  private pos: Float32Array;
  private nor: Float32Array;
  private uv: Float32Array;
  private lt: LinkT | null = null;
  private maxLinks = 0;
  constructor(public n: number, public w: number, public h: number, mat: THREE.Material, public tile = 1, cast = true) {
    const g = new THREE.BufferGeometry();
    if (CHAIN_MATS.has(mat)) {
      const lt = this.lt = linkTemplate(h),
        nv = LNS * LNR;
      this.maxLinks = 440;
      this.pos = new Float32Array(this.maxLinks * nv * 3);
      this.nor = new Float32Array(this.maxLinks * nv * 3);
      this.uv = new Float32Array(this.maxLinks * nv * 2);
      const idx = new Uint32Array(this.maxLinks * lt.idx.length);
      for (let l = 0; l < this.maxLinks; l++) for (let i = 0; i < lt.idx.length; i++) idx[l * lt.idx.length + i] = lt.idx[i] + l * nv;
      g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(this.nor, 3));
      g.setAttribute("uv", new THREE.BufferAttribute(this.uv, 2));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.setDrawRange(0, 0);
    } else {
      this.pos = new Float32Array(n * 12);
      this.nor = new Float32Array(n * 12);
      this.uv = new Float32Array(n * 8);
      g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(this.nor, 3));
      g.setAttribute("uv", new THREE.BufferAttribute(this.uv, 2));
      const idx: number[] = [];
      for (let i = 0; i < n - 1; i++) for (let k = 0; k < 4; k++) {
        const a = i * 4 + k,
          b = i * 4 + (k + 1) % 4,
          c = (i + 1) * 4 + (k + 1) % 4,
          d = (i + 1) * 4 + k;
        idx.push(a, b, c, a, c, d);
      }
      g.setIndex(idx);
    }
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = cast;
    this.mesh.receiveShadow = true;
  }
  private T = new THREE.Vector3();
  private S = new THREE.Vector3();
  private N = new THREE.Vector3();
  private setLinks(pts: THREE.Vector3[], lt: LinkT) {
    const {
        T,
        S,
        N
      } = this,
      nv = LNS * LNR;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const total = cum[cum.length - 1],
      count = Math.max(0, Math.min(this.maxLinks, Math.floor(total / lt.pitch)));
    const s0 = (total - (count - 1) * lt.pitch) / 2;
    let seg = 1;
    for (let l = 0; l < count; l++) {
      const s = s0 + l * lt.pitch;
      while (seg < pts.length - 1 && cum[seg] < s) seg++;
      const a = pts[seg - 1],
        b = pts[seg],
        u = (s - cum[seg - 1]) / Math.max(1e-6, cum[seg] - cum[seg - 1]);
      const px = a.x + (b.x - a.x) * u,
        py = a.y + (b.y - a.y) * u,
        pz = a.z + (b.z - a.z) * u;
      T.subVectors(b, a).normalize();
      S.set(-T.z, 0, T.x);
      if (S.lengthSq() < 1e-6) S.set(1, 0, 0);
      S.normalize();
      N.crossVectors(S, T).normalize();
      const odd = l % 2 === 1;
      const yx = odd ? S.x : N.x,
        yy = odd ? S.y : N.y,
        yz = odd ? S.z : N.z;
      const zx = odd ? -N.x : S.x,
        zy = odd ? -N.y : S.y,
        zz = odd ? -N.z : S.z;
      const base = l * nv * 3;
      for (let v = 0; v < nv * 3; v += 3) {
        const x = lt.p[v],
          y = lt.p[v + 1],
          z = lt.p[v + 2],
          o = base + v;
        this.pos[o] = px + T.x * x + yx * y + zx * z;
        this.pos[o + 1] = py + T.y * x + yy * y + zy * z;
        this.pos[o + 2] = pz + T.z * x + yz * y + zz * z;
        const nx = lt.n[v],
          ny = lt.n[v + 1],
          nz = lt.n[v + 2];
        this.nor[o] = T.x * nx + yx * ny + zx * nz;
        this.nor[o + 1] = T.y * nx + yy * ny + zy * nz;
        this.nor[o + 2] = T.z * nx + yz * ny + zz * nz;
      }
    }
    const g = this.mesh.geometry;
    g.setDrawRange(0, count * lt.idx.length);
    g.attributes.position.needsUpdate = true;
    g.attributes.normal.needsUpdate = true;
  }
  set(pts: THREE.Vector3[]) {
    if (this.lt) {
      this.setLinks(pts, this.lt);
      return;
    }
    const {
      T,
      S,
      N
    } = this;
    let len = 0;
    for (let i = 0; i < this.n; i++) {
      const p = pts[Math.min(i, pts.length - 1)];
      const a = pts[Math.max(0, i - 1)],
        b = pts[Math.min(pts.length - 1, i + 1)];
      T.subVectors(b, a).normalize();
      S.crossVectors(T, V(0, 1, 0));
      if (S.lengthSq() < 1e-6) S.set(1, 0, 0);
      S.normalize();
      N.crossVectors(S, T).normalize();
      if (i) len += p.distanceTo(pts[Math.min(i - 1, pts.length - 1)]);
      for (let k = 0; k < 4; k++) {
        const sx = k === 0 || k === 3 ? -1 : 1,
          sy = k < 2 ? -1 : 1,
          j = (i * 4 + k) * 3;
        this.pos[j] = p.x + S.x * sx * this.w / 2 + N.x * sy * this.h / 2;
        this.pos[j + 1] = p.y + S.y * sx * this.w / 2 + N.y * sy * this.h / 2;
        this.pos[j + 2] = p.z + S.z * sx * this.w / 2 + N.z * sy * this.h / 2;
        const nx = S.x * sx + N.x * sy,
          ny = S.y * sx + N.y * sy,
          nz = S.z * sx + N.z * sy,
          nl = Math.hypot(nx, ny, nz);
        this.nor[j] = nx / nl;
        this.nor[j + 1] = ny / nl;
        this.nor[j + 2] = nz / nl;
        this.uv[(i * 4 + k) * 2] = k / 4;
        this.uv[(i * 4 + k) * 2 + 1] = len / this.tile;
      }
    }
    const g = this.mesh.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.normal.needsUpdate = true;
    g.attributes.uv.needsUpdate = true;
  }
}
/** a sight line of the film: from the lens toward the shot's subject, `len` along d (d has unit forward component) */

export type Ray = {
  o: THREE.Vector3;
  d: THREE.Vector3;
  len: number;
  core: boolean;
};
let sight: Ray[] = [];
/** set the film's sight lines before building (one Ray per camera key: lens -> subject) */

export const setSight = (rays: Ray[]) => {
  sight = rays;
};
/** does any sight line pass through this box? (centre lines only for small props, so they can still frame a shot) */

export const inTheWay = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, coreOnly = false) => {
  for (const {
    o,
    d,
    len,
    core
  } of sight) {
    if (coreOnly && !core) continue;
    let t0 = 0,
      t1 = len;
    for (const [oo, dd, a, b] of [[o.x, d.x, x0, x1], [o.y, d.y, y0, y1], [o.z, d.z, z0, z1]]) {
      if (Math.abs(dd) < 1e-9) {
        if (oo < a || oo > b) t0 = Infinity;
        continue;
      }
      const ta = (a - oo) / dd,
        tb = (b - oo) / dd;
      t0 = Math.max(t0, Math.min(ta, tb));
      t1 = Math.min(t1, Math.max(ta, tb));
    }
    if (t0 <= t1) return true;
  }
  return false;
};
export type PlantKind = "round" | "fat" | "tall" | "cone" | "bush" | "hedge";
type VegKind = PlantKind;
const LEAF = ["#5aa83c", "#4c9a37", "#69b545", "#55a243", "#3f8f3c"];
const leafTex = (i: number) => ctex("leafHD" + i, 256, 128, (g, r) => {
  const base = new THREE.Color(LEAF[i]),
    top = base.clone().offsetHSL(0.012, 0.03, 0.08),
    bot = base.clone().offsetHSL(-0.015, 0.0, -0.08);
  const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, "#" + top.getHexString());
  gr.addColorStop(0.42, "#" + base.getHexString());
  gr.addColorStop(1, "#" + bot.getHexString());
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 128);
  for (let k = 0; k < 46; k++) {
    const x = r() * 256,
      y = 10 + r() * 108,
      rad = 5 + r() * 9,
      light = y < 64 ? r() < 0.7 : r() < 0.25;
    for (const ox of [-256, 0, 256]) {
      g.strokeStyle = light ? "rgba(225,255,170,0.22)" : "rgba(20,70,30,0.2)";
      g.lineWidth = 2.5;
      g.lineCap = "round";
      g.beginPath();
      g.arc(x + ox, y + rad * 0.6, rad, Math.PI * 1.15, Math.PI * 1.85);
      g.stroke();
    }
  }
});
const leafMat = (i: number) => lam("leafHD" + i, () => ({
  map: leafTex(i)
}));
const barkMat = () => lam("barkHD", () => ({
  color: "#8f5d3b"
}));
const vegGeo = new Map<string, THREE.BufferGeometry>();
const lobeGeo = (q: number) => {
  const k = "lobe" + q + "@" + detail().segK;
  let g = vegGeo.get(k);
  if (!g) {
    g = new THREE.SphereGeometry(1, seg([20, 14, 10][q]), seg([14, 10, 7][q]));
    vegGeo.set(k, g);
  }
  return g;
};
const trunkGeo = () => {
  const k = "trunk@" + detail().segK;
  let g = vegGeo.get(k);
  if (!g) {
    g = new THREE.CylinderGeometry(0.6, 1, 1, seg(10), 1, true).translate(0, 0.5, 0);
    vegGeo.set(k, g);
  }
  return g;
};
const hedgeGeo = () => {
  const hk = "hedge@" + detail().segK;
  let g = vegGeo.get(hk);
  if (!g) {
    g = new THREE.BoxGeometry(1, 1, 1, seg(18), seg(10), seg(10));
    const p = g.attributes.position as THREE.BufferAttribute,
      n = g.attributes.normal as THREE.BufferAttribute;
    const R = [0.106, 0.29, 0.385],
      v = new THREE.Vector3(),
      e = new THREE.Vector3(),
      q = [0, 0, 0];
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      for (let a = 0; a < 3; a++) {
        const c = v.getComponent(a),
          lim = a === 1 && c < 0 ? 0.5 : 0.5 - R[a];
        q[a] = THREE.MathUtils.clamp(c, -lim, lim);
        e.setComponent(a, (c - q[a]) / R[a]);
      }
      const L = e.length();
      if (L < 1e-6) continue;
      e.divideScalar(L);
      p.setXYZ(i, q[0] + e.x * R[0], q[1] + e.y * R[1], q[2] + e.z * R[2]);
      const nn = new THREE.Vector3(e.x / R[0], e.y / R[1], e.z / R[2]).normalize();
      n.setXYZ(i, nn.x, nn.y, nn.z);
    }
    g.translate(0, 0.5, 0);
    vegGeo.set(hk, g);
  }
  return g;
};
const yawQ = (a: number) => new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), a);
const vegRad = (k: VegKind, h: number) => k === "hedge" ? 1.7 : k === "bush" ? 0.85 * h : k === "tall" ? 0.2 * h : k === "cone" ? 0.27 * h : k === "fat" ? 0.44 * h : 0.39 * h;
const addVeg = (b: Batch, k: VegKind, x: number, y: number, z: number, h: number, seed: number, q = 0) => {
  const r = rng(Math.abs(Math.floor(seed)) % 200000 + 7),
    U = (a: number, c: number) => a + (c - a) * r();
  const leaf = leafMat(k === "cone" ? 4 : k === "hedge" ? 1 : Math.floor(r() * 4)),
    lobe = lobeGeo(q),
    yaw = r() * 6.28;
  const put = (px: number, py: number, pz: number, rad: number, sy = 0.9) => b.add(lobe, leaf, new THREE.Matrix4().compose(V(x + px, y + py, z + pz), yawQ(r() * 6.28), V(rad, rad * sy, rad)));
  const trunk = (th: number, tr: number) => b.add(trunkGeo(), barkMat(), new THREE.Matrix4().compose(V(x, y - 0.15, z), yawQ(yaw), V(tr, th + 0.15, tr)));
  const ring = (n0: number, dist: number, r0: number, r1: number, cy: number, dy: number) => {
    const n = parts(1) ? n0 : Math.min(n0, 2),
      a0 = r() * 6.28;
    for (let i = 0; i < n; i++) {
      const a = a0 + i * 6.28 / n + U(-0.35, 0.35),
        dd = dist * U(0.85, 1.12);
      put(Math.cos(a) * dd, cy + U(-dy, dy), Math.sin(a) * dd, U(r0, r1));
    }
  };
  if (k === "round" || k === "fat") {
    const f = k === "fat";
    trunk((f ? 0.4 : 0.48) * h, 0.055 * h);
    const cy = (f ? 0.58 : 0.64) * h;
    put(0, cy, 0, (f ? 0.29 : 0.26) * h);
    ring(f ? 5 : 4, (f ? 0.22 : 0.18) * h, (f ? 0.19 : 0.17) * h, (f ? 0.23 : 0.21) * h, cy - 0.05 * h, 0.04 * h);
    put(U(-0.05, 0.05) * h, cy + (f ? 0.15 : 0.17) * h, U(-0.05, 0.05) * h, (f ? 0.19 : 0.17) * h);
  } else if (k === "tall") {
    trunk(0.34 * h, 0.045 * h);
    put(0, 0.47 * h, 0, 0.17 * h, 1.3);
    put(U(-0.03, 0.03) * h, 0.65 * h, U(-0.03, 0.03) * h, 0.15 * h, 1.3);
    put(0, 0.82 * h, 0, 0.11 * h, 1.25);
    ring(3, 0.1 * h, 0.1 * h, 0.12 * h, 0.55 * h, 0.06 * h);
  } else if (k === "cone") {
    trunk(0.2 * h, 0.05 * h);
    put(0, 0.3 * h, 0, 0.26 * h, 0.62);
    put(0, 0.5 * h, 0, 0.2 * h, 0.66);
    put(0, 0.68 * h, 0, 0.14 * h, 0.75);
    put(0, 0.84 * h, 0, 0.08 * h, 1.0);
  } else if (k === "bush") {
    put(0, 0.46 * h, 0, 0.5 * h);
    ring(3, 0.42 * h, 0.32 * h, 0.38 * h, 0.32 * h, 0.04 * h);
  } else {
    b.add(hedgeGeo(), leaf, new THREE.Matrix4().compose(V(x, y - 0.06, z), new THREE.Quaternion(), V(3.3, h + 0.06, Math.max(0.9, h * 0.78))));
  }
};
const BANNER_COL = ["#b8553a", "#4f8a5a", "#5a6fa0"];
const FOLD = 0.27,
  CLOTH_W = 1.1,
  CLOTH_H = 2.6;
const bannerTex = (col: string) => ctex("bannerHD" + col, 256, 700, g => {
  const W = 256,
    H = 700,
    base = new THREE.Color(col);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#" + base.clone().offsetHSL(0, 0, 0.04).getHexString());
  gr.addColorStop(1, "#" + base.clone().offsetHSL(0, 0, -0.06).getHexString());
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x++) {
    const s = Math.sin(x / W * (CLOTH_W / FOLD) * Math.PI * 2);
    g.fillStyle = s > 0 ? `rgba(255,235,215,${0.1 * s})` : `rgba(60,15,15,${-0.12 * s})`;
    g.fillRect(x, 0, 1, H);
  }
  g.fillStyle = "#" + base.clone().offsetHSL(0, -0.05, -0.12).getHexString();
  g.fillRect(0, 0, W, 54);
  g.strokeStyle = "#d1aa5c";
  g.lineWidth = 9;
  g.strokeRect(20, 66, W - 40, H - 86);
  g.strokeStyle = "rgba(60,30,20,0.45)";
  g.lineWidth = 2;
  g.strokeRect(14, 60, W - 28, H - 74);
  g.strokeRect(26, 72, W - 52, H - 98);
  g.fillStyle = "#d1aa5c";
  g.fillRect(0, 46, W, 8);
  const cx = W / 2,
    cy = 250;
  g.fillStyle = "#efe2c2";
  g.beginPath();
  g.arc(cx, cy, 62, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(60,30,20,0.55)";
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = "#d1aa5c";
  g.beginPath();
  g.moveTo(cx, cy - 46);
  g.lineTo(cx + 34, cy);
  g.lineTo(cx, cy + 46);
  g.lineTo(cx - 34, cy);
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(60,30,20,0.6)";
  g.lineWidth = 2.5;
  g.stroke();
});
const bannerGeo = () => {
  const bk = "banner@" + detail().segK;
  let geo = vegGeo.get(bk);
  if (!geo) {
    const w = CLOTH_W,
      hh = CLOTH_H,
      notch = 0.42;
    geo = new THREE.PlaneGeometry(w, hh, seg(16), seg(20)).translate(0, -hh / 2, 0);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        t = -y / hh;
      p.setY(i, y + notch * (1 - Math.abs(x) / (w / 2)) * t * t);
      p.setZ(i, (0.025 + 0.055 * t) * Math.sin(x / FOLD * Math.PI * 2 + 0.6) + 0.04 * t * t);
    }
    geo.computeVertexNormals();
    vegGeo.set(bk, geo);
  }
  return geo;
};
/** gonfalon: a pole with a gold finial and a crossbar, a folded cloth hanging from it. Base at (x, y, z), pole height h,
 *  the cloth faces local +z turned by yaw. seed picks the cloth colour. */

export const banner = (b: Batch, x: number, y: number, z: number, h: number, yaw = 0, seed = 0) => {
  if (inTheWay(x - 0.7, x + 0.7, y, y + h, z - 0.7, z + 0.7, true)) return;
  const col = BANNER_COL[Math.abs(Math.floor(seed)) % BANNER_COL.length];
  const M = (px: number, py: number, pz: number) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z).multiply(new THREE.Matrix4().makeTranslation(px, py, pz));
  const pole = lam("bannerPole", () => ({
      color: "#6e4b33"
    })),
    gold = lam("bannerGold", () => ({
      color: "#c9a24e"
    }));
  b.add(new THREE.CylinderGeometry(0.045, 0.06, h, seg(10)).translate(0, h / 2, 0), pole, M(0, 0, 0));
  if (parts(1)) b.add(new THREE.CylinderGeometry(0.03, 0.03, CLOTH_W + 0.2, seg(8)).rotateZ(Math.PI / 2), pole, M(0, h - 0.18, 0.06));
  if (parts(2)) {
    b.add(new THREE.SphereGeometry(0.1, seg(14), seg(10)), gold, M(0, h + 0.06, 0));
    for (const s of [-1, 1]) b.add(new THREE.SphereGeometry(0.045, seg(10), seg(8)), gold, M(s * (CLOTH_W / 2 + 0.12), h - 0.18, 0.06));
  }
  b.add(bannerGeo(), lam("bannerHD" + col, () => ({
    map: bannerTex(col),
    side: THREE.DoubleSide
  })), M(0, h - 0.2, 0.1));
};
/** place a cartoon plant with its base on y, height h (left out when it would stand in front of the lens). Lobe detail
 *  also drops with distance from the origin (far away or deep in the background uses coarser spheres). seed varies the
 *  lobes and the canopy tint. */

export const plant = (b: Batch, kind: PlantKind, x: number, y: number, z: number, h: number, seed = 0) => {
  const rad = vegRad(kind, h);
  if (inTheWay(x - rad, x + rad, y, y + h, z - rad, z + rad, true)) return;
  const d = Math.hypot(x, z);
  addVeg(b, kind, x, y, z, h, x * 92.7 + z * 31.3 + seed * 1000, d > 200 ? 2 : Math.abs(z) > 45 && d > 60 ? 1 : 0);
};
