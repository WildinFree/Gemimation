import * as THREE from "three";
import { MoodPreset } from "../light/moods";
import { TONE, CHAR, untone } from "../light/shade";
import { NOINK } from "../post/ink";
import { cloudHD } from "./paint";
import { glide } from "../util";
import { isCartoon, cartoonLight, PRACTICAL_K } from "../look/cartoon";
export type SunFrame = {
  dir?: THREE.Vector3;
  centre: THREE.Vector3;
  radius: number;
};
/** flicker multiplier for practical light k at frame f (0.76 .. 1.0) */
export const flicker = (f: number, k = 0) => {
  const t = f / 30;
  return 0.95 + 0.03 * Math.sin(2.2 * t + k * 2.1) + 0.02 * Math.sin(3.7 * t + k);
};
/** the old fast flicker (0.76 .. 1.0): for fires and torches only */
export const flickerFire = (f: number, k = 0) => 0.82 + 0.12 * Math.sin(f * 0.71 + k * 2.1) + 0.06 * Math.sin(f * 1.93 + k);
/** 0..1 fade of any light, glint, cone or glow: smootherstep ramps of n frames (10-15, min 4) on at `on`, off at `off`; never a one-frame switch */
export const fadeLight = (f: number, on: number, off = Infinity, n = 12): number => {
  const m = Math.max(4, n);
  return glide((f - on) / m) * (1 - glide((f - off) / m));
};
export class LightRig {
  hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
  sun = new THREE.DirectionalLight("#fff0d6", 2.6);
  fog = new THREE.Fog("#bccbec", 25, 420);
  practicals: THREE.PointLight[] = [];
  private sky: THREE.Mesh;
  private skyMat: THREE.ShaderMaterial;
  private clouds: THREE.Mesh[] = [];
  private cloudMaps = new Map<string, THREE.Texture[]>();
  private sunDir = new THREE.Vector3();
  constructor(root: THREE.Object3D, o: {
    practicals?: number;
    clouds?: number;
    shadowMap?: number;
  } = {}) {
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        c0: {
          value: new THREE.Color()
        },
        c1: {
          value: new THREE.Color()
        },
        c2: {
          value: new THREE.Color()
        },
        c3: {
          value: new THREE.Color()
        },
        c4: {
          value: new THREE.Color()
        },
        e: {
          value: new THREE.Vector4()
        }
      },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el)); c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1;
    this.sky.frustumCulled = false;
    this.sky.layers.set(NOINK);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(o.shadowMap ?? 4096, o.shadowMap ?? 4096);
    root.add(this.sky, this.hemi, this.sun, this.sun.target);
    for (let i = 0; i < (o.clouds ?? 11); i++) {
      const a = i / 11 * Math.PI * 2 + 0.3;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
        color: new THREE.Color(1.1, 1.1, 1.1),
        transparent: true,
        depthWrite: false,
        fog: false
      }));
      const w = 130 + i % 4 * 30;
      m.position.set(Math.cos(a) * 640, 70 + i % 4 * 34, Math.sin(a) * 640);
      m.scale.set(w, w / 2, 1);
      m.layers.set(NOINK);
      this.clouds.push(m);
      root.add(m);
    }
    for (let i = 0; i < (o.practicals ?? 4); i++) {
      const p = new THREE.PointLight("#ff9a48", 0, 9, 2);
      p.castShadow = false;
      this.practicals.push(p);
      root.add(p);
    }
  }
  apply(m: MoodPreset, cam: THREE.PerspectiveCamera, scene: THREE.Scene, s: SunFrame) {
    const dir = this.sunDir.copy(s.dir ?? new THREE.Vector3(...m.dir)).normalize();
    this.hemi.color.set(m.sky);
    this.hemi.groundColor.set(m.ground);
    this.hemi.intensity = m.hemiI;
    this.sun.color.set(m.sunCol);
    this.sun.intensity = m.sunI;
    this.sun.position.copy(s.centre).addScaledVector(dir, 80);
    this.sun.target.position.copy(s.centre);
    const sc = this.sun.shadow.camera,
      R = s.radius;
    sc.left = -R;
    sc.right = R;
    sc.top = R;
    sc.bottom = -R;
    sc.near = 1;
    sc.far = 220;
    sc.updateProjectionMatrix();
    this.sun.shadow.bias = m.bias;
    this.sun.shadow.normalBias = m.normalBias * (R / 10);
    TONE.uLitCol.value.set(...m.lit);
    TONE.uShadeCol.value.set(...m.shade);
    TONE.uShadeLift.value.set(...m.lift);
    TONE.uLambert.value = m.lambert;
    TONE.uSideK.value = m.sideK;
    TONE.uTerm.value = m.term;
    TONE.uBounce.value.set(...m.bounce);
    TONE.uSat.value = m.sat;
    CHAR.uCharTint.value.set(...m.charTint);
    CHAR.uCharShade.value = m.charShade;
    CHAR.uGrad.value = m.charGrad;
    CHAR.uBodyGrad.value = m.bodyGrad;
    CHAR.uSideTint.value.set(...m.sideTint);
    const su = this.skyMat.uniforms;
    m.skyGrad.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = m.skyGrad.e.map(deg => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(m.fog, this.fog.color);
    this.fog.near = m.fogNear;
    this.fog.far = m.fogFar;
    scene.fog = this.fog;
    scene.background = null;
    const key = m.cloud ? JSON.stringify(m.cloud) : "";
    if (m.cloud && !this.cloudMaps.has(key)) this.cloudMaps.set(key, [0, 1, 2, 3].map(i => cloudHD(i, m.cloud!)));
    const maps = this.cloudMaps.get(key);
    this.clouds.forEach((c, i) => {
      c.visible = !!maps;
      if (!maps) return;
      const a = i / this.clouds.length * Math.PI * 2 + 0.3;
      c.position.x = cam.position.x + Math.cos(a) * 640;
      c.position.z = cam.position.z + Math.sin(a) * 640;
      c.lookAt(cam.position.x, c.position.y, cam.position.z);
      (c.material as THREE.MeshBasicMaterial).map = maps[i % 4];
    });
    this.sunCol = m.sunCol;
    if (isCartoon()) cartoonLight(this, m, dir);
    return dir;
  }
  sunCol = "#fff0d6";
  practicalsOff() {
    for (const p of this.practicals) p.intensity = 0;
  }
  practical(i: number, at: [number, number, number], col: string, intensity: number, f: number, flick = i, range = 9, kind: "lamp" | "fire" = "lamp") {
    const p = this.practicals[i];
    if (!p) throw new Error("practical " + i + " not allocated (LightRig practicals option)");
    p.position.set(...at);
    p.color.set(col);
    p.distance = range;
    p.intensity = intensity * (isCartoon() ? PRACTICAL_K : 1) * (flick >= 0 ? (kind === "fire" ? flickerFire : flicker)(f, flick) : 1);
  }
}
