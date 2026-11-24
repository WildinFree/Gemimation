import * as THREE from "three";
import { Batch } from "../world/build";
import { withTier, type Tier } from "./tiers";
/** wrap: base on y = 0, centred, scaled to height h (or width w) */
export const fit = (c: THREE.Object3D, o: {
  h?: number;
  w?: number;
  s?: number;
}) => {
  c.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(c),
    size = box.getSize(new THREE.Vector3());
  const s = o.s ?? (o.h ? o.h / size.y : o.w ? o.w / Math.max(size.x, size.z) : 1);
  const g = new THREE.Group();
  c.position.set(-(box.min.x + box.max.x) / 2 * s, -box.min.y * s, -(box.min.z + box.max.z) / 2 * s);
  c.scale.multiplyScalar(s);
  g.add(c);
  g.userData.size = size.multiplyScalar(s);
  return g;
};
/** build kit parts (world/house.ts, street.ts, build.ts builders) into their own group, one merged mesh per material,
 *  base wherever the builder put it (usually y = 0). Use it for hero objects and foreground framing objects, which must
 *  not go through the sight-line test of a scene Batch. Builds at `tier` (default "hero"); pass "piece" for a
 *  foreground framing object that is not a story object. */
export const standalone = (build: (b: Batch) => void, tier: Tier = "hero"): THREE.Group => {
  const b = new Batch(),
    g = new THREE.Group();
  withTier(tier, () => build(b));
  b.build(g, false);
  g.traverse(x => {
    const m = x as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = false;
      m.receiveShadow = true;
      m.matrixAutoUpdate = true;
    }
  });
  return g;
};
/** re-parent `part` under a pivot placed at a hinge point (in the part's parent space) so rotating the pivot swings it */

export const hinge = (part: THREE.Object3D, at: THREE.Vector3) => {
  const parent = part.parent!,
    pivot = new THREE.Group();
  pivot.position.copy(at);
  parent.add(pivot);
  part.position.sub(at);
  pivot.add(part);
  return pivot;
};
