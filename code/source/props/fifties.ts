import * as THREE from "three";
import { rbox, lathe, cyl, sph, torus, tube, smooth } from "../assets/shapes";
import { PAL, tint, part, grp, type Built } from "../assets/palette";
const S = {
  chrome: PAL.chrome,
  black: tint(PAL.bakelite, "#34303c", {
    rough: 0.4
  }),
  red: tint(PAL.plastic, "#e0382e", {
    rough: 0.4
  }),
  toast: tint(PAL.straw, "#e0a850"),
  milk: tint(PAL.china, "#fbfaf4", {
    rough: 0.3
  }),
  label: tint(PAL.paintedWood, "#4a90d8", {
    rough: 0.5
  }),
  foil: tint(PAL.steel, "#e0e4e8", {
    rough: 0.2
  }),
  brass: PAL.brass,
  glass: PAL.glass,
  bake: tint(PAL.bakelite, "#8a4a28", {
    rough: 0.35
  }),
  face: tint(PAL.enamel, "#fcf4da", {
    rough: 0.4
  }),
  mint: tint(PAL.china, "#6cd0b0", {
    rough: 0.35
  }),
  fridge: tint(PAL.enamel, "#f8f6ee", {
    rough: 0.35
  }),
  vinyl: tint(PAL.plastic, "#d8342e", {
    rough: 0.4
  }),
  wood: tint(PAL.paintedWood, "#b87038", {
    rough: 0.6
  }),
  screen: tint(PAL.screen, "#6fa890", {
    rough: 0.12
  }),
  pink: tint(PAL.enamel, "#f2a0b8", {
    rough: 0.32
  }),
  cream: tint(PAL.enamel, "#f8e8a8", {
    rough: 0.4
  }),
  white: tint(PAL.enamel, "#fbf6ea", {
    rough: 0.4
  })
};
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const toaster = (): Built => {
  const g = grp();
  part(g, rbox(0.32, 0.19, 0.18, 0.08), S.chrome, 0, 0.015, 0);
  part(g, rbox(0.3, 0.03, 0.16, 0.012), S.black, 0, 0, 0);
  part(g, rbox(0.3, 0.025, 0.17, 0.01), S.red, 0, 0.1, 0);
  for (const x of [-0.07, 0.07]) {
    part(g, rbox(0.11, 0.14, 0.03, 0.03), S.toast, x, 0.13, 0, 0, 0, x * 0.4);
    part(g, rbox(0.125, 0.014, 0.04, 0.005), S.black, x, 0.195, 0);
  }
  part(g, rbox(0.03, 0.04, 0.04, 0.012), S.black, 0.17, 0.13, 0.03);
  part(g, rbox(0.06, 0.04, 0.014, 0.01), S.black, -0.07, 0.055, 0.09);
  return {
    obj: g
  };
};
const milk = (): Built => {
  const g = grp();
  const body: [number, number][] = [...smooth([[0, 0], [0.036, 0], [0.04, 0.006]], 8), ...smooth([[0.04, 0.006], [0.039, 0.05], [0.036, 0.12], [0.03, 0.15], [0.02, 0.18], [0.019, 0.2]], 40), [0, 0.2]];
  for (let i = 0; i < 3; i++) {
    const x = i * 0.1 - 0.1,
      z = i === 1 ? -0.03 : 0.02;
    part(g, lathe(body, 0), S.milk, x, 0, z);
    part(g, cyl(0.0405, 0.0405, 0.05, 48), S.label, x, 0.045, z);
    part(g, cyl(0.0245, 0.0245, 0.022), S.foil, x, 0.2, z);
    part(g, sph(0.0245, 1, 0.35, 1), S.foil, x, 0.222, z);
  }
  return {
    obj: g
  };
};
const fridge = (): Built => {
  const g = grp(),
    W = 0.76,
    H = 1.62,
    D = 0.7;
  part(g, rbox(W - 0.1, 0.1, D - 0.1, 0.02), S.black, 0, 0, 0);
  part(g, rbox(W, H - 0.1, D, 0.12), S.fridge, 0, 0.1, 0);
  part(g, rbox(W - 0.04, 0.016, 0.02, 0.006), S.black, 0, 1.08, D / 2 + 0.001);
  for (const [y, h] of [[1.14, 0.34], [0.6, 0.36]] as const) part(g, rbox(0.045, h, 0.045, 0.02), S.chrome, W / 2 - 0.1, y, D / 2 + 0.026);
  part(g, rbox(0.24, 0.07, 0.025, 0.014), S.chrome, -0.08, 1.4, D / 2 + 0.006);
  part(g, rbox(0.15, 0.04, 0.02, 0.01), S.red, -0.08, 1.4, D / 2 + 0.016);
  return {
    obj: g
  };
};
const radio = (): Built => {
  const g = grp();
  part(g, rbox(0.38, 0.26, 0.2, 0.08), S.bake, 0, 0, 0);
  part(g, sph(0.15, 1.25, 0.6, 0.66), S.bake, 0, 0.23, 0);
  part(g, cyl(0.08, 0.08, 0.014, 48), S.face, -0.08, 0.14, 0.098, 0, Math.PI / 2);
  part(g, torus(0.082, 0.011), S.brass, -0.08, 0.14, 0.104);
  part(g, rbox(0.008, 0.065, 0.008, 0.003), S.red, -0.08, 0.15, 0.112, 0, 0, 0.7);
  for (let i = 0; i < 6; i++) part(g, rbox(0.016, 0.19, 0.016, 0.006), S.brass, 0.06 + i * 0.024, 0.035, 0.099);
  for (const x of [-0.13, -0.03]) part(g, cyl(0.03, 0.026, 0.034, 40), S.brass, x, 0.04, 0.1, 0, Math.PI / 2);
  return {
    obj: g
  };
};
const phone = (): Built => {
  const g = grp();
  part(g, rbox(0.24, 0.08, 0.19, 0.04), S.black, 0, 0, 0);
  part(g, sph(0.11, 1.15, 0.5, 0.85), S.black, 0, 0.06, 0);
  part(g, cyl(0.062, 0.062, 0.01, 48), S.chrome, 0, 0.098, 0.005);
  part(g, cyl(0.05, 0.05, 0.008, 48), S.face, 0, 0.106, 0.005);
  for (let i = 0; i < 10; i++) {
    const a = -0.5 + i / 9 * 4.4;
    part(g, cyl(0.009, 0.009, 0.005, 24), S.black, Math.sin(a + 1) * 0.037, 0.113, 0.005 + Math.cos(a + 1) * 0.037);
  }
  for (const s of [-1, 1]) part(g, cyl(0.019, 0.016, 0.04, 32), S.black, s * 0.085, 0.1, -0.05);
  part(g, rbox(0.21, 0.04, 0.045, 0.02), S.black, 0, 0.14, -0.05);
  for (const s of [-1, 1]) part(g, cyl(0.04, 0.036, 0.045, 32), S.black, s * 0.105, 0.125, -0.05);
  return {
    obj: g
  };
};
const jar = (): Built => {
  const g = grp();
  part(g, lathe(smooth([[0, 0], [0.07, 0], [0.1, 0.08], [0.105, 0.17], [0.08, 0.215], [0, 0.215]], 40), 0), S.mint);
  part(g, lathe(smooth([[0, 0.21], [0.085, 0.21], [0.075, 0.25], [0, 0.26]], 24), 0), S.red);
  part(g, sph(0.034), S.red, 0, 0.28, 0);
  part(g, torus(0.104, 0.011), S.face, 0, 0.12, 0, 0, Math.PI / 2);
  return {
    obj: g
  };
};
const table = (): Built => {
  const g = grp();
  part(g, rbox(1.0, 0.045, 0.7, 0.02), S.chrome, 0, 0.74, 0);
  part(g, rbox(0.92, 0.02, 0.62, 0.01), S.red, 0, 0.78, 0);
  part(g, cyl(0.06, 0.04, 0.025), S.chrome, 0, 0.715, 0);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) part(g, cyl(0.03, 0.026, 0.72, 32), S.chrome, x * 0.4, 0, z * 0.26);
  for (const z of [-0.26, 0.26]) part(g, rbox(0.8, 0.028, 0.028, 0.012), S.chrome, 0, 0.1, z);
  return {
    obj: g
  };
};
const chair = (): Built => {
  const g = grp();
  part(g, rbox(0.44, 0.09, 0.42, 0.04), S.vinyl, 0, 0.42, 0);
  part(g, rbox(0.44, 0.22, 0.08, 0.04), S.vinyl, 0, 0.58, -0.2);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) part(g, cyl(0.024, 0.02, 0.42, 32), S.chrome, x * 0.18, 0, z * 0.17);
  for (const s of [-1, 1]) part(g, cyl(0.022, 0.022, 0.28, 32), S.chrome, s * 0.18, 0.42, -0.19);
  for (const z of [-0.17, 0.17]) part(g, rbox(0.36, 0.026, 0.026, 0.011), S.chrome, 0, 0.12, z);
  part(g, rbox(0.44, 0.026, 0.026, 0.011), S.chrome, 0, 0.7, -0.19);
  return {
    obj: g
  };
};
const clock = (): Built => {
  const g = grp(),
    c = grp();
  c.position.y = 0.4;
  g.add(c);
  const Z = 0.02;
  for (let i = 0; i < 16; i++) {
    const long = i % 2 === 0,
      L = long ? 0.3 : 0.2,
      rg = grp();
    rg.rotation.z = -(i / 16) * Math.PI * 2;
    c.add(rg);
    part(rg, cyl(long ? 0.02 : 0.016, 0.006, L), S.brass, 0, 0.08, Z);
    part(rg, sph(long ? 0.03 : 0.022), S.brass, 0, 0.08 + L, Z);
  }
  part(c, cyl(0.12, 0.12, 0.04, 56), S.brass, 0, 0, 0, 0, Math.PI / 2);
  part(c, cyl(0.1, 0.1, 0.05, 56), S.face, 0, 0, 0, 0, Math.PI / 2);
  part(c, torus(0.1, 0.008), S.chrome, 0, 0, 0.05);
  for (let i = 0; i < 12; i++) {
    const tg = grp();
    tg.rotation.z = -(i / 12) * Math.PI * 2;
    c.add(tg);
    part(tg, rbox(i % 3 === 0 ? 0.016 : 0.01, i % 3 === 0 ? 0.026 : 0.016, 0.008, 0.003), S.black, 0, 0.065, 0.05);
  }
  const hand = (len: number, w: number, rz: number, z: number) => {
    const hg = grp();
    hg.rotation.z = rz;
    c.add(hg);
    part(hg, rbox(w, len, 0.01, 0.004), S.black, 0, -0.012, z);
    part(hg, rbox(w * 1.8, 0.02, 0.01, 0.004), S.black, 0, len - 0.02, z);
  };
  hand(0.058, 0.014, -0.8, 0.059);
  hand(0.08, 0.01, 1.5, 0.07);
  part(c, sph(0.014), S.red, 0, 0, 0.076);
  return {
    obj: g
  };
};
const tv = (): Built => {
  const g = grp();
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    part(g, cyl(0.02, 0.034, 0.34, 32), S.wood, x * 0.3, 0, z * 0.2, 0, -z * 0.12, x * 0.17);
    part(g, sph(0.026, 1, 0.6, 1), S.brass, x * 0.3, 0.012, z * 0.2);
  }
  part(g, rbox(0.7, 0.52, 0.48, 0.08), S.wood, 0, 0.3, 0);
  part(g, rbox(0.46, 0.4, 0.04, 0.09), S.bake, -0.08, 0.36, 0.232);
  part(g, rbox(0.4, 0.34, 0.03, 0.08), S.black, -0.08, 0.39, 0.25);
  part(g, sph(0.19, 1, 0.84, 0.2), S.screen, -0.08, 0.56, 0.255);
  part(g, rbox(0.012, 0.3, 0.014, 0.005), S.black, 0.185, 0.37, 0.248);
  for (const y of [0.66, 0.54]) part(g, cyl(0.036, 0.03, 0.034, 40), S.bake, 0.265, y, 0.24, 0, Math.PI / 2);
  for (const y of [0.66, 0.54]) part(g, rbox(0.006, 0.026, 0.01, 0.003), S.cream, 0.265, y, 0.278);
  for (let i = 0; i < 5; i++) part(g, rbox(0.08, 0.014, 0.014, 0.005), S.black, 0.265, 0.38 + i * 0.026, 0.244);
  part(g, sph(0.06, 1, 0.5, 1), S.chrome, 0, 0.84, -0.05);
  for (const s of [-1, 1]) {
    part(g, tube([V(0, 0.85, -0.05), V(s * 0.13, 1.02, -0.05), V(s * 0.26, 1.2, -0.05)], 0.01), S.chrome);
    part(g, sph(0.018), S.chrome, s * 0.26, 1.2, -0.05);
  }
  return {
    obj: g
  };
};
const barStool = (): Built => {
  const g = grp();
  part(g, lathe(smooth([[0, 0], [0.2, 0], [0.22, 0.014], [0.2, 0.04], [0.06, 0.08], [0.04, 0.1]], 24), 0), S.chrome);
  part(g, cyl(0.036, 0.04, 0.58, 40), S.chrome, 0, 0.06, 0);
  part(g, torus(0.2, 0.014), S.chrome, 0, 0.3, 0, 0, Math.PI / 2);
  for (let i = 0; i < 4; i++) {
    const sg = grp();
    sg.rotation.y = i / 4 * Math.PI * 2 + 0.4;
    g.add(sg);
    part(sg, cyl(0.011, 0.011, 0.16), S.chrome, 0.12, 0.3, 0, 0, 0, -Math.PI / 2);
  }
  part(g, lathe(smooth([[0, 0.62], [0.1, 0.62], [0.13, 0.655], [0.19, 0.67], [0.205, 0.7], [0.19, 0.735], [0.12, 0.76], [0, 0.765]], 40), 0), S.vinyl);
  part(g, torus(0.205, 0.014), S.chrome, 0, 0.685, 0, 0, Math.PI / 2);
  part(g, cyl(0.12, 0.09, 0.03, 40), S.chrome, 0, 0.6, 0);
  return {
    obj: g
  };
};
const standMixer = (): Built => {
  const g = grp();
  part(g, rbox(0.24, 0.05, 0.36, 0.025), S.pink, 0, 0, 0);
  part(g, rbox(0.11, 0.3, 0.1, 0.04), S.pink, 0, 0.03, -0.12);
  part(g, rbox(0.14, 0.12, 0.34, 0.055), S.pink, 0, 0.27, 0);
  part(g, sph(0.07, 1, 0.9, 0.9), S.pink, 0, 0.33, -0.1);
  part(g, cyl(0.04, 0.04, 0.03, 40), S.chrome, 0, 0.26, 0.12);
  part(g, cyl(0.014, 0.014, 0.1, 32), S.chrome, 0, 0.17, 0.1);
  part(g, torus(0.032, 0.007), S.chrome, 0, 0.1, 0.1);
  part(g, torus(0.022, 0.007), S.chrome, 0, 0.1, 0.1, Math.PI / 2);
  part(g, lathe(smooth([[0, 0.05], [0.05, 0.05], [0.1, 0.09], [0.125, 0.17], [0.13, 0.2], [0.126, 0.205], [0.116, 0.2], [0.112, 0.17], [0.09, 0.1], [0, 0.07]], 40), 0), S.chrome, 0, 0, 0.1);
  part(g, cyl(0.026, 0.022, 0.028, 40), S.black, 0.08, 0.28, 0.04, 0, 0, -Math.PI / 2);
  part(g, rbox(0.016, 0.012, 0.03, 0.005), S.cream, 0.1, 0.285, 0.04);
  return {
    obj: g
  };
};
const breadBox = (): Built => {
  const g = grp();
  part(g, rbox(0.42, 0.18, 0.28, 0.04), S.cream, 0, 0, 0);
  part(g, cyl(0.135, 0.135, 0.42, 48), S.cream, 0.21, 0.18, 0, 0, 0, Math.PI / 2);
  part(g, rbox(0.43, 0.02, 0.02, 0.008), S.chrome, 0, 0.175, 0.14);
  part(g, tube([V(-0.09, 0.1, 0.15), V(-0.09, 0.115, 0.185), V(0.09, 0.115, 0.185), V(0.09, 0.1, 0.15)], 0.011), S.chrome);
  part(g, rbox(0.15, 0.03, 0.012, 0.006), S.red, 0, 0.055, 0.14);
  return {
    obj: g
  };
};
void THREE;
export const FIFTIES: Record<string, () => Built> = {
  toaster,
  milk,
  fridge,
  radio,
  phone,
  jar,
  table,
  chair,
  clock,
  tv,
  barStool,
  standMixer,
  breadBox
};
