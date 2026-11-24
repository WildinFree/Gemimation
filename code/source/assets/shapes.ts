import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
export const CHUNK = 0.65;
/** lerp by the house chunk dial: ck(real, chunky) */
export const ck = (a: number, b: number) => a + (b - a) * CHUNK;
/** box-projected world UVs (metres / tile) */
export const wuv = (g: THREE.BufferGeometry, tile = 1, ox = 0, oy = 0) => {
  const p = g.attributes.position,
    n = g.attributes.normal,
    uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)),
      ay = Math.abs(n.getY(i)),
      az = Math.abs(n.getZ(i));
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    let u: number, v: number;
    if (ay >= ax && ay >= az) {
      u = x;
      v = z;
    } else if (ax >= az) {
      u = z;
      v = y;
    } else {
      u = x;
      v = y;
    }
    uv[i * 2] = (u + ox) / tile;
    uv[i * 2 + 1] = (v + oy) / tile;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
};
/** cylinder-projected UVs: u around the y axis (arc length at radius r), v up */

export const cuv = (g: THREE.BufferGeometry, tile = 1, r = 0.1) => {
  const p = g.attributes.position,
    uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i));
    uv[i * 2] = a * r * 2 / tile;
    uv[i * 2 + 1] = p.getY(i) / tile;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
};
/** rounded box w x h x d, centred on x/z, base on y = 0 (or centred on all axes). r = edge radius (min 0.004) */

export const rbox = (w: number, h: number, d: number, r = 0.012, centred = false) => {
  const rr = Math.max(0.004, Math.min(r * ck(1, 1.6), Math.min(w, h, d) * 0.45));
  const g = new RoundedBoxGeometry(w, h, d, 3, rr);
  if (!centred) g.translate(0, h / 2, 0);
  return wuv(g);
};
export type Prof = [number, number][];
/** resample a [radius, y] profile through a centripetal Catmull-Rom spline (n points): soft curves, no kinks */

export const smooth = (prof: Prof, n = 40): Prof => {
  const c = new THREE.CatmullRomCurve3(prof.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, "centripetal");
  return c.getPoints(n - 1).map(p => [Math.max(0, p.x), p.y]);
};
/** turned shape from a [radius, y] profile (bottom to top). smoothN 0 keeps the profile as given (pre-smoothed runs) */

export const lathe = (prof: Prof, smoothN = 40, seg = 56) => {
  const p = smoothN > 0 ? smooth(prof, smoothN) : prof;
  const g = new THREE.LatheGeometry(p.map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r), y)), seg);
  return cuv(g, 1, Math.max(...p.map(q => q[0])));
};
/** cylinder (or cone frustum) r0 at the base, r1 at the top, base on y = 0 */

export const cyl = (r0: number, r1: number, h: number, seg = 40) => {
  const g = new THREE.CylinderGeometry(r1, r0, h, Math.max(seg, 24));
  g.translate(0, h / 2, 0);
  return cuv(g, 1, Math.max(r0, r1));
};
/** tube along a smooth curve through pts */

export const tube = (pts: THREE.Vector3[], r: number, closed = false) => wuv(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), 48, r, 14, closed));
/** torus in the xy plane (rotate it to lie flat) */

export const torus = (R: number, r: number, arc = Math.PI * 2) => wuv(new THREE.TorusGeometry(R, r, 16, 56, arc));
/** sphere (or ellipsoid) centred on the origin */

export const sph = (r: number, sx = 1, sy = 1, sz = 1) => {
  const g = new THREE.SphereGeometry(r, 48, 32);
  g.scale(sx, sy, sz);
  return wuv(g);
};
/** merge geometries that share one surface into one */

export const merge = (gs: THREE.BufferGeometry[]) => mergeGeometries(gs.map(g => g.index ? g.toNonIndexed() : g), false)!;
/** a small deterministic random generator (mulberry32) */

export const rand = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = a + 0x6d2b79f5 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};
