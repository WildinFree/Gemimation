import * as THREE from "three";
import { Batch, lam, V, plant, PlantKind } from "./build";
import { rng } from "./paint";
import { withTier } from "../assets/tiers";
const U = (r: () => number, a: number, b: number) => a + (b - a) * r();
const tone = (hex: string, dl: number, dh = 0) => {
  const c = new THREE.Color(hex);
  c.offsetHSL(dh, 0, dl);
  return "#" + c.getHexString();
};
const prism = (w: number, rh: number, d: number) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, rh);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: false
  }).translate(0, 0, -d / 2);
};
const BOX = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
/** a row of building silhouettes from x0 to x1 at depth z (ground at y = 0): wall height h[0]..h[1], roofs gable, hip,
 *  flat or spire, three wall tones around `col` and two roof tones. */

export function skyline(b: Batch, o: {
  x0: number;
  x1: number;
  z: number;
  h: [number, number];
  seed: number;
  col?: string;
}) {
  const r = rng(Math.abs(Math.floor(o.seed)) * 37 + 5),
    col = o.col ?? "#c8b8c4";
  const walls = [0, -0.05, 0.05].map(dl => lam("farW" + col + dl, () => ({
    color: tone(col, dl, dl * 0.2)
  })));
  const roofs = ["#b86a58", "#8d6f7e"].map(c => lam("farR" + c, () => ({
    color: c
  })));
  const M = (x: number, y: number, z: number, sx: number, sy: number, sz: number, yaw = 0) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), V(sx, sy, sz));
  let x = o.x0;
  while (x < o.x1) {
    const w = U(r, 3.2, 7.5),
      d = U(r, 4, 8),
      h = U(r, o.h[0], o.h[1]),
      cx = Math.min(x + w / 2, o.x1),
      kind = r(),
      wm = walls[Math.floor(r() * 3)],
      rm = roofs[Math.floor(r() * 2)];
    b.add(BOX, wm, M(cx, 0, o.z, w, h, d));
    if (kind < 0.45) {
      const rh = w * U(r, 0.28, 0.45),
        side = r() < 0.5;
      b.add(prism(side ? w + 0.5 : d + 0.5, rh, side ? d + 0.4 : w + 0.4), rm, M(cx, h, o.z, 1, 1, 1, side ? 0 : Math.PI / 2));
    } else if (kind < 0.7) {
      const rh = w * U(r, 0.3, 0.5);
      b.add(new THREE.ConeGeometry(0.72, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0), rm, M(cx, h, o.z, w + 0.6, rh, d + 0.6));
    } else if (kind < 0.85) {
      b.add(BOX, walls[0], M(cx, h, o.z, w + 0.3, 0.35, d + 0.3));
      if (r() < 0.6) b.add(BOX, wm, M(cx + U(r, -w / 4, w / 4), h, o.z, w * 0.3, 1.2, d * 0.3));
    } else {
      const tw = Math.min(w, 3.4),
        th = h * U(r, 1.25, 1.6);
      b.add(BOX, wm, M(cx, h, o.z, tw, th - h, tw));
      b.add(new THREE.ConeGeometry(0.75, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0), rm, M(cx, th, o.z, tw * 1.25, tw * 1.7, tw * 1.25));
    }
    x += w + U(r, 0, 1.4);
  }
}
/** a line of trees from x0 to x1 at depth z, tree height h[0]..h[1], drawn with the cartoon plant at the far tier */

export function treeLine(b: Batch, o: {
  x0: number;
  x1: number;
  z: number;
  h: [number, number];
  seed: number;
}) {
  const r = rng(Math.abs(Math.floor(o.seed)) * 41 + 3),
    kinds: PlantKind[] = ["round", "round", "tall", "fat", "cone"];
  withTier("far", () => {
    let x = o.x0,
      i = 0;
    while (x < o.x1) {
      const h = U(r, o.h[0], o.h[1]);
      plant(b, kinds[Math.floor(r() * kinds.length)], x, 0, o.z + U(r, -2.5, 2.5), h, o.seed + i++);
      x += h * U(r, 0.45, 0.8);
    }
  });
}
