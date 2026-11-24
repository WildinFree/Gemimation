import * as THREE from "three";
import { Pool, Actor, Fx, SU, Place, Stage } from "../cast/cards";
import type { Anch, HeldKind } from "../toon/toon";
import { INK } from "../toon/toon";
import { NOINK } from "../post/ink";
/** how a held prop sits in the hand: height (m), grip point (fraction of the height from the base), how far in front
 *  of the card (m), radius (m: the hand disc goes just in front of it), extra tilt toward the lens (rad, e.g. a bowl
 *  tipped to the lips shows its round underside), sword-like props point along the arm */
export type Grip = {
  h: number;
  g: number;
  dz: number;
  rad: number;
  tiltX?: number;
  blade?: boolean;
};
export type HeldFactory = {
  grip: Grip;
  make: (n: number) => THREE.Object3D;
  variants?: number;
};
export type HatFactory = {
  make: () => THREE.Object3D;
  width: number;
};
const HAND_GEO = new THREE.CircleGeometry(1, 20);
const ZAX = new THREE.Vector3(0, 0, 1),
  XAX = new THREE.Vector3(1, 0, 0);
export class CardLayer {
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private held: Record<string, THREE.Object3D[]> = {};
  private heldN: Record<string, number> = {};
  private hands: THREE.Mesh[] = [];
  private handN = 0;
  private handMat = new THREE.MeshBasicMaterial({
    color: INK
  });
  private hats: THREE.Object3D[] = [];
  private hatN = 0;
  private q1 = new THREE.Quaternion();
  private q2 = new THREE.Quaternion();
  private v2 = new THREE.Vector3();
  private v3 = new THREE.Vector3();
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4();
  private v = new THREE.Vector3();
  private sph = new THREE.Sphere();
  constructor(private root: THREE.Object3D, private heldKinds: Partial<Record<HeldKind, HeldFactory>> = {}, private hat?: HatFactory) {}
  sync(st: Stage, cam: THREE.PerspectiveCamera, actorShadow = false) {
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    this.heldN = {};
    this.handN = 0;
    this.hatN = 0;
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc, p.z), 1.8 * sc))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      const sq = p.sq ?? 0;
      a.mesh.scale.set((p.mirror ? -sc : sc) * (1 - 0.03 * sq), sc * (1 + 0.05 * sq), sc);
      a.mesh.castShadow = actorShadow;
      used.push(a);
      if (p.anch) this.placeHeld(p, a, cam);
    }
    for (const hd of st.held3d) {
      const F = this.heldKinds[hd.kind];
      if (!F) throw new Error("no HeldFactory for " + hd.kind);
      const o = this.take(hd.kind + "#arm", () => F.make(hd.n));
      this.q2.setFromAxisAngle(ZAX, -hd.ang);
      o.quaternion.copy(cam.quaternion).multiply(this.q2);
      o.scale.setScalar(hd.h / ((o.userData.size as THREE.Vector3 | undefined)?.y || 1));
      const upv = this.v3.set(0, 1, 0).applyQuaternion(o.quaternion);
      o.position.set(...hd.at).addScaledVector(upv, -hd.h / 2);
      if (hd.hand) this.hand(cam, this.v2.set(...hd.hand.at), 0.035, hd.hand.r);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    for (const [k, list] of Object.entries(this.held)) for (let i = this.heldN[k] ?? 0; i < list.length; i++) list[i].visible = false;
    for (let i = this.handN; i < this.hands.length; i++) this.hands[i].visible = false;
    for (let i = this.hatN; i < this.hats.length; i++) this.hats[i].visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h)))) continue;
      const ef = this.fx(fi++);
      ef.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      ef.use(!!p.soft, p.opacity ?? 1, !!p.add);
      ef.mesh.visible = true;
      ef.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) ef.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);else {
        ef.mesh.quaternion.copy(cam.quaternion);
        ef.mesh.rotateZ(p.rot ?? 0);
      }
      ef.mesh.scale.set(p.w, p.h, 1);
      fused.push(ef);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const ef of fused) ef.bind();
  }
  private take(kind: string, mk: () => THREE.Object3D) {
    const list = this.held[kind] ??= [],
      i = this.heldN[kind] ?? 0;
    if (i >= list.length) {
      const o = mk();
      this.root.add(o);
      list.push(o);
    }
    this.heldN[kind] = i + 1;
    const o = list[i];
    o.visible = true;
    return o;
  }
  private hand(cam: THREE.PerspectiveCamera, at: THREE.Vector3, front: number, r: number) {
    if (this.handN >= this.hands.length) {
      const m = new THREE.Mesh(HAND_GEO, this.handMat);
      m.layers.set(NOINK);
      m.renderOrder = 3;
      this.root.add(m);
      this.hands.push(m);
    }
    const m = this.hands[this.handN++],
      tc = this.v3.copy(cam.position).sub(at).normalize();
    m.visible = true;
    m.position.copy(at).addScaledVector(tc, front);
    m.quaternion.copy(cam.quaternion);
    m.scale.setScalar(r);
  }
  private placeHeld(p: Place, a: Actor, cam: THREE.PerspectiveCamera) {
    const an = p.anch as Anch,
      mesh = a.mesh,
      mir = mesh.scale.x < 0,
      sc = Math.abs(mesh.scale.y);
    mesh.updateMatrixWorld(true);
    const local = (X: number, Y: number) => new THREE.Vector3((X - 400) * SU, (975 - Y) * SU, 0).applyMatrix4(mesh.matrixWorld);
    const toCam = (at: THREE.Vector3) => this.v3.copy(cam.position).sub(at).normalize();
    let front = 0;
    if (an.prop) {
      const A = an.prop,
        F = this.heldKinds[A.kind];
      if (!F) throw new Error("no HeldFactory for " + A.kind);
      const G = F.grip,
        nv = F.variants ?? 1;
      const o = this.take(A.kind + A.n % nv, () => F.make(A.n % nv));
      this.q2.setFromAxisAngle(ZAX, G.blade ? mir ? Math.PI + A.ang : -A.ang : mir ? A.ang : -A.ang);
      o.quaternion.copy(mesh.quaternion).multiply(this.q2);
      if (G.tiltX) o.quaternion.multiply(this.q1.setFromAxisAngle(XAX, G.tiltX));
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(o.quaternion);
      const at = local(A.x, A.y);
      o.position.copy(at).addScaledVector(toCam(at), G.dz * sc).addScaledVector(up, -G.g * G.h * sc);
      o.scale.setScalar(sc);
      front = G.dz + G.rad + 0.012;
    }
    for (const [X, Y, r] of an.hands) this.hand(cam, local(X, Y), front * sc, r * SU * sc);
    if (an.crown && this.hat) {
      const C = an.crown;
      if (this.hatN >= this.hats.length) {
        const c = this.hat.make();
        this.root.add(c);
        this.hats.push(c);
      }
      const c = this.hats[this.hatN++];
      c.visible = true;
      this.q2.setFromAxisAngle(ZAX, mir ? C.ang : -C.ang);
      c.quaternion.copy(mesh.quaternion).multiply(this.q2);
      c.position.copy(local(C.x, C.y));
      c.scale.setScalar(C.w * SU * sc * 1.12 / this.hat.width);
    }
  }
  private actor(i: number) {
    while (this.actors.length <= i) this.actors.push(new Actor(this.root));
    return this.actors[i];
  }
  private fx(i: number) {
    while (this.fxs.length <= i) this.fxs.push(new Fx(this.root));
    return this.fxs[i];
  }
}
