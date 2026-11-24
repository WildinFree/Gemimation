import * as THREE from "three";
import { twoTone } from "../light/shade";
import { ctex } from "../world/paint";
import { isCartoon, surf } from "../look/cartoon";
export type EnvLook = {
  top: string;
  wall: string;
  band: string;
  floor: string;
  windows: string;
  glows: string;
};
const ENVS = new Map<string, THREE.Texture>();
/** a painted equirect "room" used only as a reflection map: ceiling -> walls -> floor gradient, a row of bright
 *  windows and warm practical glows. Pass colours that match the set (key caches it). */
export const envTex = (key = "neutral", L: EnvLook = {
  top: "#2e2a30",
  wall: "#8a7a6a",
  band: "#b8a890",
  floor: "#c8b8a0",
  windows: "#fff6e0",
  glows: "rgba(255,190,90,1)"
}) => {
  const hit = ENVS.get(key);
  if (hit) return hit;
  const t = ctex("env" + key, 1024, 512, g => {
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, L.top);
    gr.addColorStop(0.42, L.wall);
    gr.addColorStop(0.56, L.band);
    gr.addColorStop(0.62, L.floor);
    gr.addColorStop(1, L.floor);
    g.fillStyle = gr;
    g.fillRect(0, 0, 1024, 512);
    for (const x of [90, 250, 410]) {
      const w = 70,
        y0 = 150,
        y1 = 270;
      g.fillStyle = L.windows;
      g.beginPath();
      g.moveTo(x, y1);
      g.lineTo(x, y0 + w / 2);
      g.arc(x + w / 2, y0 + w / 2, w / 2, Math.PI, 0);
      g.lineTo(x + w, y1);
      g.closePath();
      g.fill();
    }
    for (const x of [620, 900]) {
      const rg = g.createRadialGradient(x, 230, 2, x, 230, 60);
      rg.addColorStop(0, L.glows);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = rg;
      g.fillRect(x - 60, 170, 120, 120);
    }
  });
  t.mapping = THREE.EquirectangularReflectionMapping;
  ENVS.set(key, t);
  return t;
};
const mcache = new Map<string, THREE.Material>();
const once = <T extends THREE.Material,>(k: string, mk: () => T): T => {
  let m = mcache.get(k);
  if (!m) {
    m = mk();
    mcache.set(k, m);
  }
  return m as T;
};
/** toon metal: two-tone diffuse + the sun's specular + env reflections tinted by the albedo (gold reflects gold) */

export const metal = (key: string, o: {
  color: string;
  map?: THREE.Texture | null;
  spec?: string;
  shin?: number;
  refl?: number;
  lift?: number;
}) => isCartoon() ? surf({
  col: o.color,
  kind: "metal",
  map: o.map ?? null,
  rough: Math.min(0.55, Math.max(0.12, 0.62 - (o.shin ?? 70) / 200))
}) as unknown as THREE.MeshPhongMaterial : once("metal" + key, () => {
  const m = new THREE.MeshPhongMaterial({
    color: o.color,
    map: o.map ?? null,
    specular: o.spec ?? "#fff0c8",
    shininess: o.shin ?? 70,
    envMap: envTex(),
    combine: THREE.AddOperation,
    reflectivity: o.refl ?? 0.55
  });
  twoTone(m, o.lift ?? 0.2);
  const base = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    base.call(m, sh, r);
    sh.fragmentShader = sh.fragmentShader.replace("#include <envmap_fragment>", THREE.ShaderChunk.envmap_fragment.replace("outgoingLight += envColor.xyz * specularStrength * reflectivity;", "float fre = pow( 1.0 - max( dot( normalize( vNormal ), normalize( vViewPosition ) ), 0.0 ), 3.0 );\n\t\toutgoingLight += envColor.xyz * diffuseColor.rgb * 1.8 * specularStrength * reflectivity * ( 0.45 + 0.55 * fre );"));
  };
  m.customProgramCacheKey = () => "toonMetal1_" + (o.lift ?? 0.2).toFixed(2);
  return m;
});
/** clear glass: thin tint, fresnel rim (thicker-looking edges), env reflections, sharp sun highlight; drawn after the
 *  liquid (renderOrder 2) without writing depth */

export const glass = (key = "clear", tint = "#e6f6ff", opacity = 0.16) => isCartoon() ? surf({
  col: tint,
  kind: "glass",
  opacity: Math.max(0.2, opacity),
  side: THREE.DoubleSide
}) as unknown as THREE.MeshPhongMaterial : once("glass" + key, () => {
  const m = new THREE.MeshPhongMaterial({
    color: tint,
    specular: "#ffffff",
    shininess: 160,
    envMap: envTex(),
    combine: THREE.AddOperation,
    reflectivity: 0.35,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <opaque_fragment>", `float fr = pow( 1.0 - abs( dot( normalize( vNormal ), normalize( vViewPosition ) ) ), 2.2 );
       diffuseColor.a = clamp( diffuseColor.a + fr * 0.75 + dot( reflectedLight.directSpecular, vec3( 0.33 ) ), 0.0, 1.0 );
       outgoingLight += fr * vec3( 0.32, 0.38, 0.45 );
       #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => "glassFr1";
  return m;
});
/** glowing / coloured liquid: toon diffuse + emissive glow (glow > 1 crosses the bloom threshold) */

export const liquid = (key: string, col: string, glow = 0) => isCartoon() ? surf({
  col,
  rough: 0.3,
  emi: glow > 0 ? glow : undefined
}) as unknown as THREE.MeshLambertMaterial : once("liq" + key + glow, () => {
  const m = new THREE.MeshLambertMaterial({
    color: col,
    emissive: col,
    emissiveIntensity: glow
  });
  return twoTone(m, 0.4);
});
