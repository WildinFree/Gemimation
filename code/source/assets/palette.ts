import * as THREE from "three";
import { surf, type CSurf } from "../look/cartoon";
import { ctex, rng } from "../world/paint";
export const PAL = {
  cloth: {
    col: "#d8c8b0",
    rough: 0.95
  },
  straw: {
    col: "#e8c878",
    rough: 0.95
  },
  plaster: {
    col: "#efe4d2",
    rough: 0.95
  },
  stone: {
    col: "#b8aca0",
    rough: 0.92
  },
  rawWood: {
    col: "#b88454",
    rough: 0.88
  },
  darkWood: {
    col: "#7a4a2e",
    rough: 0.85
  },
  paintedWood: {
    col: "#e8dcc4",
    rough: 0.6
  },
  leather: {
    col: "#8a4a30",
    rough: 0.6
  },
  china: {
    col: "#fbf7ee",
    rough: 0.32
  },
  enamel: {
    col: "#f4f2ea",
    rough: 0.35
  },
  bakelite: {
    col: "#8a4a28",
    rough: 0.38
  },
  plastic: {
    col: "#f2f0ec",
    rough: 0.45
  },
  rubber: {
    col: "#3a3440",
    rough: 0.7
  },
  ink: {
    col: "#2e2434",
    rough: 0.5
  },
  chrome: {
    col: "#d6dae2",
    kind: "metal",
    rough: 0.16
  },
  steel: {
    col: "#b8bec8",
    kind: "metal",
    rough: 0.28
  },
  brass: {
    col: "#d8a444",
    kind: "metal",
    rough: 0.3
  },
  copper: {
    col: "#d27a4a",
    kind: "metal",
    rough: 0.3
  },
  iron: {
    col: "#5a5660",
    kind: "metal",
    rough: 0.5
  },
  glass: {
    col: "#e8f2f4",
    kind: "glass",
    opacity: 0.3
  },
  screen: {
    col: "#2a3448",
    rough: 0.15
  },
  glow: {
    col: "#fff0c8",
    kind: "glow",
    emi: 1.2
  }
} satisfies Record<string, CSurf>;
export type Fam = keyof typeof PAL;
/** a palette family in another colour (and optional overrides): tint(PAL.china, "#9cc4e8", { rough: 0.3 }) */

export const tint = (base: CSurf, col: string, o: Partial<CSurf> = {}): CSurf => ({
  ...base,
  col,
  ...o
});
/** a prop as built: its root (base on y = 0, real size, facing +z) and an optional per-frame animation */

export type Built = {
  obj: THREE.Object3D;
  update?: (f: number) => void;
};
export const grp = () => new THREE.Group();
/** add a mesh of surface s to parent at (x, y, z) with yaw / pitch / roll; shadows on (glass and glow cast none) */

export const part = (parent: THREE.Object3D, g: THREE.BufferGeometry, s: CSurf, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) => {
  const m = new THREE.Mesh(g, surf(s));
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  const k = s.kind ?? "matte";
  m.castShadow = k !== "glass" && k !== "glow";
  m.receiveShadow = k !== "glow";
  parent.add(m);
  return m;
};
let CONTACT: THREE.Texture | null = null;
const CM = new Map<number, THREE.Material>();
const contactMat = (k: number) => {
  let m = CM.get(k);
  if (m) return m;
  CONTACT ??= ctex("propContact", 128, 128, g => {
    const rg = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    rg.addColorStop(0, "rgba(255,255,255,1)");
    rg.addColorStop(0.55, "rgba(255,255,255,0.55)");
    rg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, 128, 128);
  });
  const b = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.42, 0.3, 0.4),
    alphaMap: CONTACT,
    transparent: true,
    opacity: 0.55 * k,
    depthWrite: false,
    blending: THREE.MultiplyBlending,
    premultipliedAlpha: true
  });
  b.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <opaque_fragment>", "#include <opaque_fragment>\n gl_FragColor.rgb = mix(vec3(1.0), diffuseColor.rgb, diffuseColor.a);");
  };
  CM.set(k, b);
  return b;
};
/** put a built prop on a surface at (x, y, z), yaw ry, with a soft plum contact patch under its footprint (aoK 0 = none).
 *  The patch grounds small props where the sun's shadow is soft or off-screen. */

export const place = (parent: THREE.Object3D, obj: THREE.Object3D, x: number, y: number, z: number, ry = 0, aoK = 1) => {
  obj.position.set(x, y, z);
  obj.rotation.y = ry;
  parent.add(obj);
  if (aoK > 0) {
    obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj),
      sz = b.getSize(new THREE.Vector3());
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sz.x * 1.25 + 0.06, sz.z * 1.25 + 0.06).rotateX(-Math.PI / 2), contactMat(aoK));
    m.position.set((b.min.x + b.max.x) / 2, y + 0.003, (b.min.z + b.max.z) / 2);
    m.renderOrder = 1;
    m.userData.noOutline = true;
    parent.add(m);
  }
  return obj;
};
/** a flickering cartoon flame of additive cones at (x, y, z); returns its per-frame update */

export const flame = (parent: THREE.Object3D, x: number, y: number, z: number, s = 1, n = 5) => {
  const r = rng(Math.round(x * 100 + z * 7)),
    parts: {
      m: THREE.Mesh;
      ph: number;
    }[] = [];
  const cols = ["#ffcf6a", "#ff9a3a", "#ff7a2a", "#ffe9a0"];
  for (let i = 0; i < n; i++) {
    const h = (0.18 + r() * 0.22) * s,
      g = new THREE.ConeGeometry(0.05 * s * (1 - i / (n * 1.6)), h, 16);
    g.translate(0, h / 2, 0);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color: new THREE.Color(cols[i % 4]).multiplyScalar(i === n - 1 ? 2.4 : 1.6),
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    m.position.set(x + (r() - 0.5) * 0.14 * s, y, z + (r() - 0.5) * 0.08 * s);
    m.userData.noOutline = true;
    parent.add(m);
    parts.push({
      m,
      ph: r() * 6.28
    });
  }
  return (f: number) => {
    for (const p of parts) {
      const k = 0.8 + 0.2 * Math.sin(f * 0.55 + p.ph) + 0.1 * Math.sin(f * 1.31 + p.ph * 2);
      p.m.scale.set(1, k, 1);
      p.m.rotation.z = 0.08 * Math.sin(f * 0.4 + p.ph);
    }
  };
};
