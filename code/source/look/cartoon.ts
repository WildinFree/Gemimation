import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { NOINK } from "../post/ink";
import { INK } from "../toon/toon";
import type { MoodPreset, C3 } from "../light/moods";
export type WorldLook = "cartoon" | "legacy";
export const WORLD: {
  look: WorldLook;
} = {
  look: "cartoon"
};
export const isCartoon = () => WORLD.look === "cartoon";
/** toward the sun (world); cartoonLight() copies the rig's sun into it every frame */
export const SUNDIR = new THREE.Vector3(0.3, 0.6, 0.7).normalize();
export type StylePreset = {
  label: string;
  lo: number;
  hi: number;
  shade: C3;
  shadeK: number;
  litK: number;
  sat: number;
  rough: number;
  metalRough: number;
  envI: number;
  envDiff: number;
  toy: number;
  metalToy?: number;
  metalEnvI?: number;
  coat: number;
  rim: number;
  hullPx: number;
  tt: number;
  creasePx: number;
  creaseDeg: number;
  shadowR: number;
};
/** THE house look (Environment Lab pick 2026-11-23: "Storybook soft" + the sharp metal reflections of "Lit painterly") */
export const HOUSE: StylePreset = {
  label: "House (storybook soft, shiny metal)",
  lo: -0.35,
  hi: 0.6,
  shade: [0.7, 0.68, 0.84],
  shadeK: 0.6,
  litK: 1.0,
  sat: 1.05,
  rough: 1.0,
  metalRough: 0.26,
  envI: 0.5,
  envDiff: 0.25,
  toy: 1.0,
  metalToy: 0,
  metalEnvI: 1.15,
  coat: 0,
  rim: 0.05,
  hullPx: 4.6,
  tt: 0.45,
  creasePx: 1.6,
  creaseDeg: 38,
  shadowR: 8
};
/** a surface: flat colour + what it is made of. kind: matte (paint, wood, cloth, ceramic: set rough), metal, glass,
 *  glow (unlit, crosses the bloom threshold), flat (no highlight at all) */

export type CSurf = {
  col: string;
  kind?: "matte" | "metal" | "glass" | "glow" | "flat";
  rough?: number;
  metal?: number;
  emi?: number;
  opacity?: number;
  map?: THREE.Texture | null;
  side?: THREE.Side;
};
const SHARED = new Map<StylePreset, {
  uShade: {
    value: THREE.Vector3;
  };
}>();
const shared = (st: StylePreset) => {
  let s = SHARED.get(st);
  if (!s) SHARED.set(st, s = {
    uShade: {
      value: new THREE.Vector3(...st.shade)
    }
  });
  return s;
};
/** the ramped physical material for a surface under a preset (uncached: use surf() for shared materials) */

export const cartoonMat = (s: CSurf, st: StylePreset = HOUSE): THREE.Material => {
  const kind = s.kind ?? "matte";
  if (kind === "glow") return Object.assign(new THREE.MeshBasicMaterial({
    color: new THREE.Color(s.col).multiplyScalar(s.emi ?? 3),
    map: s.map ?? null,
    side: s.side
  }), {
    userData: {
      cartoon: "glow"
    }
  });
  const metal = kind === "metal",
    glass = kind === "glass";
  const rough = glass ? 0.06 : metal ? s.rough ?? st.metalRough : (s.rough ?? 0) >= 0.9 ? s.rough! : Math.min(1, (s.rough ?? 0.75) * st.rough);
  const m = new THREE.MeshPhysicalMaterial({
    color: s.col,
    map: s.map ?? null,
    side: s.side ?? THREE.FrontSide,
    roughness: rough,
    metalness: s.metal ?? (metal ? 1 : 0),
    envMapIntensity: glass ? Math.max(1.2, st.envI * 1.6) : metal ? st.metalEnvI ?? st.envI : st.envI,
    clearcoat: !metal && !glass && kind !== "flat" && (s.rough ?? 0.75) < 0.85 ? st.coat : 0,
    clearcoatRoughness: 0.12,
    emissive: s.emi && kind === "matte" ? new THREE.Color(s.col) : new THREE.Color(0),
    emissiveIntensity: kind === "matte" ? s.emi ?? 0 : 0,
    transparent: glass || (s.opacity ?? 1) < 1,
    opacity: glass ? s.opacity ?? 0.28 : s.opacity ?? 1,
    depthWrite: !glass,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 2
  });
  const u = {
    uLo: {
      value: st.lo
    },
    uHi: {
      value: st.hi
    },
    uShade: shared(st).uShade,
    uEnvDiff: {
      value: st.envDiff
    },
    uToy: {
      value: kind === "flat" ? 0 : metal ? st.metalToy ?? st.toy : st.toy
    },
    uSat: {
      value: st.sat
    },
    uRim: {
      value: glass ? st.rim * 2.5 + 0.15 : st.rim
    }
  };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    const pars = THREE.ShaderChunk.lights_physical_pars_fragment.replace("float dotNL = saturate( dot( geometryNormal, directLight.direction ) );", "float dotNL = smoothstep( uLo, uHi, dot( geometryNormal, directLight.direction ) );").replace("vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );", `vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
        { float rr = material.roughness; float a = 0.004 + rr * rr * 0.07;
          float nh = saturate( dot( geometryNormal, normalize( directLight.direction + geometryViewDir ) ) );
          float mt = smoothstep( 0.04, 0.5, max3( material.specularColor ) );
          vec3 hue = material.specularColor / max( max3( material.specularColor ), 1e-3 );
          vec3 blob = hue * smoothstep( 1.0 - a, 1.0 - a * 0.45, nh ) * mix( 0.9, 2.0, mt ) * mix( 1.0 - smoothstep( 0.55, 0.9, rr ), 1.0, mt );
          specularBRDF = mix( min( specularBRDF, vec3( 2.5 ) ), blob, uToy ); }`);
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uLo, uHi, uEnvDiff, uToy, uRim, uSat; uniform vec3 uShade;").replace("#include <lights_physical_pars_fragment>", pars).replace("#include <color_fragment>", "#include <color_fragment>\n diffuseColor.rgb = max( vec3( 0.0 ), mix( vec3( dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ) ), diffuseColor.rgb, uSat ) );").replace("#include <lights_fragment_maps>", "#include <lights_fragment_maps>\n iblIrradiance *= uEnvDiff;").replace("#include <aomap_fragment>", "#include <aomap_fragment>\n reflectedLight.indirectDiffuse *= uShade;").replace("#include <opaque_fragment>", "{ float fr = pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), 3.0 ); outgoingLight += uRim * fr * vec3( 1.0, 0.96, 1.0 ); if ( any( isnan( outgoingLight ) ) || any( isinf( outgoingLight ) ) ) outgoingLight = vec3( 0.0 ); }\n#include <opaque_fragment>");
  };
  m.customProgramCacheKey = () => `cartoon|${kind}`;
  m.userData.cartoon = kind;
  if (metal) trackMetal(m);
  return m;
};
const SURF_CACHE = new Map<string, THREE.Material>();
/** the shared (cached) house material for a surface; maps are cached by texture uuid */

export const surf = (s: CSurf, st: StylePreset = HOUSE): THREE.Material => {
  const k = `${st.label}|${s.col}|${s.kind ?? "matte"}|${s.rough ?? ""}|${s.metal ?? ""}|${s.emi ?? ""}|${s.opacity ?? ""}|${s.map?.uuid ?? ""}|${s.side ?? ""}`;
  let m = SURF_CACHE.get(k);
  if (!m) SURF_CACHE.set(k, m = cartoonMat(s, st));
  return m;
};
/** convert old Lambert / Phong parameters (world builders) into a house material: colour and painted map kept */

export const surfFrom = (p: THREE.MeshLambertMaterialParameters | THREE.MeshPhongMaterialParameters, o: Partial<CSurf> = {}): THREE.Material => {
  const col = p.color !== undefined ? "#" + new THREE.Color(p.color as THREE.ColorRepresentation).getHexString() : "#ffffff";
  const emi = (p as {
    emissiveIntensity?: number;
  }).emissiveIntensity;
  return surf({
    col,
    map: p.map as THREE.Texture | null ?? null,
    side: p.side,
    opacity: p.transparent ? p.opacity : undefined,
    emi: emi && emi > 0 ? emi : undefined,
    ...o
  });
};
const HULLS = new Set<THREE.ShaderMaterial>();
const LINES = new Set<LineMaterial>();
const hullMat = (st: StylePreset) => {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uPx: {
        value: st.hullPx
      },
      uTT: {
        value: st.tt
      },
      uRes: {
        value: new THREE.Vector2(1080, 1920)
      },
      uSun: {
        value: new THREE.Vector3(0, 1, 0)
      },
      uInk: {
        value: new THREE.Color(INK)
      }
    },
    vertexShader: `
      attribute vec3 sNormal;
      uniform float uPx, uTT; uniform vec2 uRes; uniform vec3 uSun;
      void main() {
        vec4 mv = modelViewMatrix * vec4( position, 1.0 );
        vec3 nv = normalize( normalMatrix * sNormal );
        vec4 clip = projectionMatrix * mv;
        vec2 ns = nv.xy; float l = length( ns ); ns = l > 1e-4 ? ns / l : vec2( 0.0 );
        vec2 ss = normalize( uSun.xy + vec2( 1e-4 ) );
        float tt = 1.0 - uTT * dot( ns, ss );
        float dist = max( 0.05, -mv.z );
        float w = uPx * (uRes.x / 1080.0) * tt * clamp( pow( 4.0 / dist, 0.5 ), 0.6, 1.4 ) * smoothstep( 0.0, 0.35, l );
        clip.xy += ns * w * 2.0 / uRes * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: `uniform vec3 uInk; void main() { gl_FragColor = vec4( uInk, 1.0 ); }`,
    side: THREE.BackSide,
    fog: false
  });
  HULLS.add(m);
  return m;
};
const lineMat = (st: StylePreset) => {
  const m = new LineMaterial({
    color: INK,
    linewidth: st.creasePx,
    worldUnits: false
  });
  LINES.add(m);
  return m;
};
const smoothNormals = (g: THREE.BufferGeometry) => {
  if (g.getAttribute("sNormal")) return;
  if (!g.getAttribute("normal")) g.computeVertexNormals();
  const p = g.getAttribute("position"),
    n = g.getAttribute("normal"),
    acc = new Map<string, THREE.Vector3>(),
    key: string[] = [];
  const q = (v: number) => Math.round(v * 2000);
  for (let i = 0; i < p.count; i++) {
    const k = q(p.getX(i)) + "," + q(p.getY(i)) + "," + q(p.getZ(i));
    key.push(k);
    let a = acc.get(k);
    if (!a) acc.set(k, a = new THREE.Vector3());
    a.x += n.getX(i);
    a.y += n.getY(i);
    a.z += n.getZ(i);
  }
  const out = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const a = acc.get(key[i])!;
    const l = a.length() || 1;
    out[i * 3] = a.x / l;
    out[i * 3 + 1] = a.y / l;
    out[i * 3 + 2] = a.z / l;
  }
  g.setAttribute("sNormal", new THREE.BufferAttribute(out, 3));
};
const OLM = new Map<StylePreset, {
  hm: THREE.ShaderMaterial;
  lm: LineMaterial | null;
}>();
const EDGES = new WeakMap<THREE.BufferGeometry, LineSegmentsGeometry | null>();
/** add the plum hull + crease lines to every house-material mesh under root (skips glass, glow, meshes flagged
 *  userData.noOutline, e.g. walls, floors and the far skyline). Cheap to call every frame: done meshes are skipped. */

export const outlineAll = (root: THREE.Object3D, st: StylePreset = HOUSE) => {
  const todo: THREE.Mesh[] = [];
  root.traverse(o => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData.olDone || m.userData.noOutline) return;
    const k = (m.material as THREE.Material)?.userData?.cartoon;
    if (!k || k === "glass" || k === "glow") return;
    todo.push(m);
  });
  if (!todo.length) return;
  let ms = OLM.get(st);
  if (!ms) OLM.set(st, ms = {
    hm: hullMat(st),
    lm: st.creasePx > 0 ? lineMat(st) : null
  });
  const {
    hm,
    lm
  } = ms;
  for (const m of todo) {
    m.userData.olDone = true;
    smoothNormals(m.geometry);
    const h = new THREE.Mesh(m.geometry, hm);
    h.layers.set(NOINK);
    h.castShadow = false;
    h.receiveShadow = false;
    h.userData.noOutline = true;
    h.frustumCulled = m.frustumCulled;
    m.add(h);
    if (lm && !m.userData.noCrease) {
      let eg = EDGES.get(m.geometry);
      if (eg === undefined) {
        const e = new THREE.EdgesGeometry(m.geometry, st.creaseDeg);
        eg = e.attributes.position.count ? new LineSegmentsGeometry().fromEdgesGeometry(e) : null;
        EDGES.set(m.geometry, eg);
      }
      if (eg) {
        const l = new LineSegments2(eg, lm);
        l.layers.set(NOINK);
        l.userData.noOutline = true;
        m.add(l);
      }
    }
  }
};
/** per frame: screen size and the sun direction in view space (thick side away from the light) */

export const outlineFrame = (cam: THREE.Camera, w: number, h: number, sunWorld: THREE.Vector3 = SUNDIR) => {
  const sv = sunWorld.clone().transformDirection(cam.matrixWorldInverse);
  for (const m of HULLS) {
    m.uniforms.uRes.value.set(w, h);
    m.uniforms.uSun.value.copy(sv);
  }
  for (const m of LINES) m.resolution.set(w, h);
};
const lum = (c: C3) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const DAY_LIT = 1.5,
  DAY_SHADE = 0.335;
const tmpA = new THREE.Color(),
  tmpB = new THREE.Color();
/** the house look's light for a mood: the lit core = litK x albedo, the shade = shadeK of it (three's diffuse divides by
 *  pi), both scaled by how bright the mood's lit / shade are vs day; the shade side is tinted by the mood's shade hue
 *  (day: lavender, golden: rose, night: deep blue); soft VSM shadows. Call after LightRig.apply(). */

export const cartoonLight = (rig: {
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
}, m: MoodPreset, dir: THREE.Vector3, st: StylePreset = HOUSE) => {
  const litM = lum(m.lit) / DAY_LIT,
    shadeM = Math.min(1.6, lum(m.shade) / DAY_SHADE);
  rig.sun.intensity = Math.PI * st.litK * (1 - st.shadeK) * litM / 0.95;
  rig.hemi.color.copy(tmpA.set("#fbf6ff").lerp(tmpB.set(m.sky), 0.3));
  rig.hemi.groundColor.copy(tmpA.set("#c6b4c4").lerp(tmpB.set(m.ground), 0.3));
  rig.hemi.intensity = Math.PI * st.litK * st.shadeK * shadeM / 0.9;
  rig.sun.shadow.radius = st.shadowR;
  rig.sun.shadow.blurSamples = 16;
  rig.sun.shadow.bias = -0.0006;
  rig.sun.shadow.normalBias = 0.02;
  const mx = Math.max(...m.shade),
    k = Math.max(...st.shade);
  shared(st).uShade.value.set(m.shade[0] / mx * k, m.shade[1] / mx * k, m.shade[2] / mx * k);
  SUNDIR.copy(dir).normalize();
};
/** practical lights (lamps, fires) need this multiplier under the house material to match their legacy brightness */

export const PRACTICAL_K = 2.4;
const ENVS = new Map<string, THREE.Texture>();
const METALS = new Set<THREE.MeshPhysicalMaterial>();
export const trackMetal = (m: THREE.Material) => {
  if ((m as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial) METALS.add(m as THREE.MeshPhysicalMaterial);
};
/** reflection environments, baked once per renderer + sun direction + colour through PMREM:
 *   studio  paint, glaze, cloth: warm top, lavender horizon, plum floor, a big soft key panel on the sun side (sun
 *           colour), a cool fill opposite, a top panel. Soft and bright, so satin highlights stay gentle.
 *   metal   chrome, brass, iron: a dim plum room with a crisp dark floor, a hot key panel, a top softbox and tall window
 *           strips around the horizon. Metal reads as metal by this light/dark contrast (no HDRI needed). */

export const studioEnv = (gl: THREE.WebGLRenderer, sun: THREE.Vector3 = SUNDIR, sunCol = "#fff1dc", kind: "studio" | "metal" = "studio") => {
  const k = kind + sun.toArray().map(v => v.toFixed(2)).join(",") + sunCol;
  let t = ENVS.get(k);
  if (t) return t;
  const sc = new THREE.Scene();
  const panel = (dir: THREE.Vector3, w: number, h: number, col: string, kk: number) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({
      color: new THREE.Color(col).multiplyScalar(kk),
      side: THREE.DoubleSide
    }));
    p.position.copy(dir.clone().normalize().multiplyScalar(8));
    p.lookAt(0, 0, 0);
    sc.add(p);
  };
  const metal = kind === "metal";
  const C = metal ? ["#a89cb4", "#5e5068", "#241a26"] : ["#fff3e4", "#c9bfdc", "#5a4658"];
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      top: {
        value: new THREE.Color(C[0])
      },
      mid: {
        value: new THREE.Color(C[1])
      },
      bot: {
        value: new THREE.Color(C[2])
      },
      fl: {
        value: metal ? 0.05 : 0.35
      }
    },
    vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 top, mid, bot; uniform float fl; varying vec3 vP; void main(){ float y = normalize(vP).y; vec3 c = y > 0.0 ? mix(mid, top, smoothstep(0.0, 0.7, y)) : mix(mid, bot, smoothstep(0.0, fl, -y)); gl_FragColor = vec4(c, 1.0); }"
  })));
  if (metal) {
    for (const a of [0.4, 1.6, 2.7, 3.9, 5.1]) panel(new THREE.Vector3(Math.cos(a), 0.15, Math.sin(a)), 0.8, 3.6, "#ffffff", 3.2);
    panel(sun, 4, 3, sunCol, 7);
    panel(new THREE.Vector3(0, 1, 0), 5, 5, "#ffffff", 2.2);
  } else {
    panel(sun, 6, 4, sunCol, 5);
    panel(new THREE.Vector3(-sun.x, 0.35, -sun.z), 5, 3, "#d8e2ff", 1.6);
    panel(new THREE.Vector3(0, 1, 0), 7, 7, "#ffffff", 1.4);
  }
  const pm = new THREE.PMREMGenerator(gl);
  t = pm.fromScene(sc, 0.02).texture;
  pm.dispose();
  if (ENVS.size > 24) ENVS.clear();
  ENVS.set(k, t);
  return t;
};
/** set the scene's studio env and give every metal its metal env (call once per frame, after the lights are set) */

export const applyEnvs = (gl: THREE.WebGLRenderer, scene: THREE.Scene, sunCol?: string) => {
  scene.environment = studioEnv(gl, SUNDIR, sunCol);
  scene.environmentIntensity = 1;
  const me = studioEnv(gl, SUNDIR, sunCol, "metal");
  for (const m of METALS) if (m.envMap !== me) {
    if (!m.envMap) m.needsUpdate = true;
    m.envMap = me;
  }
};
/** everything the shell does per frame for the house look, after the world has posed itself */

export const cartoonFrame = (gl: THREE.WebGLRenderer, scene: THREE.Scene, root: THREE.Object3D, cam: THREE.Camera, w: number, h: number, sunCol?: string, st: StylePreset = HOUSE) => {
  applyEnvs(gl, scene, sunCol);
  outlineAll(root, st);
  cam.updateMatrixWorld();
  outlineFrame(cam, w, h, SUNDIR);
};
