import * as THREE from "three";
import { rbox, lathe, cyl, sph, torus, tube, smooth, wuv, rand } from "../assets/shapes";
import { PAL, tint, part, grp, type Built } from "../assets/palette";
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const S = {
  oak: tint(PAL.rawWood, "#d09a5c", {
    rough: 0.8
  }),
  black: tint(PAL.iron, "#3d3d4c", {
    rough: 0.45
  }),
  blackP: tint(PAL.plastic, "#3d3d4c", {
    rough: 0.4
  }),
  steel: tint(PAL.steel, "#c4ccd8", {
    rough: 0.24
  }),
  white: tint(PAL.plastic, "#f6f3ec", {
    rough: 0.4
  }),
  head: tint(PAL.plastic, "#4f6fc8", {
    rough: 0.4
  }),
  lampY: tint(PAL.plastic, "#f2a63a", {
    rough: 0.45
  }),
  terra: tint(PAL.cloth, "#d2704c"),
  blue: tint(PAL.cloth, "#5d82cc"),
  mesh: tint(PAL.cloth, "#4a5878"),
  boucle: tint(PAL.cloth, "#efe3cc"),
  mustard: tint(PAL.cloth, "#e6b44c"),
  sage: tint(PAL.cloth, "#8ea486"),
  screen: tint(PAL.glow, "#dfeaf6", {
    emi: 0.9
  }),
  ui1: tint(PAL.glow, "#6a8fd8", {
    emi: 0.8
  }),
  ui2: tint(PAL.glow, "#f0b868", {
    emi: 0.8
  }),
  ui3: tint(PAL.glow, "#2e3a52", {
    emi: 0.6
  }),
  led: tint(PAL.glow, "#fff4d8", {
    emi: 2.2
  }),
  shade: tint(PAL.glow, "#ffe9b4", {
    emi: 1.1
  }),
  mug: tint(PAL.china, "#4fb3c4", {
    rough: 0.3
  }),
  coffee: tint(PAL.bakelite, "#6a3d24", {
    rough: 0.2
  }),
  potT: tint(PAL.china, "#e0805a", {
    rough: 0.6
  }),
  potW: tint(PAL.china, "#f4eee2", {
    rough: 0.3
  }),
  potG: tint(PAL.china, "#6fb7a8", {
    rough: 0.3
  }),
  soil: tint(PAL.cloth, "#5a3f30"),
  leaf: tint(PAL.paintedWood, "#3f9a50", {
    rough: 0.45
  }),
  leaf2: tint(PAL.paintedWood, "#5cb35a", {
    rough: 0.45
  }),
  leaf3: tint(PAL.paintedWood, "#4aa85c", {
    rough: 0.45
  }),
  stem: tint(PAL.paintedWood, "#4f8a48", {
    rough: 0.6
  }),
  suc: tint(PAL.paintedWood, "#86bd8e", {
    rough: 0.6
  }),
  bottle: tint(PAL.plastic, "#5aa0c8", {
    rough: 0.3
  }),
  sole: tint(PAL.rubber, "#efe9d8", {
    rough: 0.5
  }),
  shoe: tint(PAL.cloth, "#f7f3ea"),
  shoeA: tint(PAL.cloth, "#ee5a3c"),
  b1: tint(PAL.paintedWood, "#d8704c", {
    rough: 0.6
  }),
  b2: tint(PAL.paintedWood, "#3f64a8", {
    rough: 0.6
  }),
  b3: tint(PAL.paintedWood, "#e8c060", {
    rough: 0.6
  }),
  b4: tint(PAL.paintedWood, "#5fa070", {
    rough: 0.6
  }),
  b5: tint(PAL.paintedWood, "#a868b0", {
    rough: 0.6
  }),
  spk: tint(PAL.cloth, "#5a5a70")
};
const BOOKS = [S.b1, S.b2, S.b3, S.b4, S.b5];
const TOP = 0.74;
const desk = (): Built => {
  const g = grp(),
    W = 1.4,
    D = 0.65;
  part(g, rbox(W, 0.045, D, 0.016), S.oak, 0, TOP - 0.045, 0);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) part(g, rbox(0.045, TOP - 0.045, 0.045, 0.012), S.black, sx * (W / 2 - 0.06), 0, sz * (D / 2 - 0.06));
    part(g, rbox(0.04, 0.04, D - 0.08, 0.01), S.black, sx * (W / 2 - 0.06), TOP - 0.085, 0);
  }
  part(g, rbox(W - 0.12, 0.04, 0.04, 0.01), S.black, 0, TOP - 0.085, -D / 2 + 0.06);
  return {
    obj: g
  };
};
const laptop = (): Built => {
  const g = grp(),
    w = 0.33,
    d = 0.23;
  part(g, rbox(w, 0.02, d, 0.01), S.steel, 0, 0, 0);
  part(g, rbox(w - 0.04, 0.004, d * 0.5, 0.003), S.black, 0, 0.018, -0.035);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) part(g, rbox(0.02, 0.005, 0.017, 0.005), S.white, -0.1 + c * 0.0222, 0.019, -0.075 + r * 0.0225);
  part(g, rbox(0.09, 0.004, 0.055, 0.005), S.black, 0, 0.018, 0.075);
  const lid = grp();
  lid.position.set(0, 0.012, -d / 2 + 0.008);
  lid.rotation.x = -0.22;
  g.add(lid);
  part(lid, rbox(w, 0.225, 0.016, 0.01), S.steel, 0, 0, -0.008);
  part(lid, rbox(w - 0.02, 0.205, 0.004, 0.005), S.black, 0, 0.01, 0.0005);
  part(lid, rbox(w - 0.034, 0.19, 0.002, 0), S.screen, 0, 0.017, 0.0025);
  part(lid, rbox(0.07, 0.17, 0.003, 0), S.ui3, -0.115, 0.022, 0.0035);
  part(lid, rbox(0.16, 0.05, 0.003, 0), S.ui1, 0.045, 0.14, 0.0035);
  part(lid, rbox(0.07, 0.06, 0.003, 0), S.ui2, 0.01, 0.065, 0.0035);
  part(lid, rbox(0.07, 0.06, 0.003, 0), S.ui1, 0.09, 0.065, 0.0035);
  part(lid, rbox(0.15, 0.012, 0.003, 0), S.ui3, 0.05, 0.03, 0.0035);
  return {
    obj: g
  };
};
const monitor = (): Built => {
  const g = grp();
  const base = part(g, cyl(0.1, 0.1, 0.016, 48), S.black, 0, 0, -0.03);
  base.scale.set(1.3, 1, 0.85);
  part(g, rbox(0.06, 0.19, 0.035, 0.014), S.black, 0, 0.01, -0.04);
  part(g, rbox(0.64, 0.38, 0.035, 0.02), S.black, 0, 0.14, -0.04);
  part(g, rbox(0.6, 0.33, 0.004, 0.002), S.screen, 0, 0.165, -0.0215);
  part(g, rbox(0.12, 0.29, 0.005, 0), S.ui3, -0.23, 0.185, -0.019);
  part(g, rbox(0.22, 0.12, 0.005, 0), S.ui1, -0.02, 0.34, -0.019);
  part(g, rbox(0.2, 0.12, 0.005, 0), S.ui2, 0.2, 0.34, -0.019);
  part(g, rbox(0.44, 0.08, 0.005, 0), S.ui3, 0.08, 0.2, -0.019);
  part(g, rbox(0.44, 0.02, 0.005, 0), S.ui1, 0.08, 0.18, -0.019);
  return {
    obj: g
  };
};
const phone = (): Built => {
  const g = grp();
  part(g, rbox(0.075, 0.009, 0.155, 0.014), S.blackP);
  part(g, rbox(0.066, 0.001, 0.142, 0.007), S.ui3, 0, 0.0095, 0);
  part(g, rbox(0.052, 0.001, 0.022, 0), S.ui2, 0, 0.0105, -0.045);
  part(g, rbox(0.052, 0.001, 0.022, 0), S.ui1, 0, 0.0105, 0);
  part(g, rbox(0.02, 0.001, 0.006, 0.002), S.ui1, 0, 0.0105, 0.055);
  return {
    obj: g
  };
};
const mug = (): Built => {
  const g = grp();
  const prof: [number, number][] = [[0, 0], ...smooth([[0.036, 0], [0.047, 0.014], [0.052, 0.055], [0.05, 0.102]], 26), [0.0475, 0.108], [0.044, 0.104], ...smooth([[0.044, 0.1], [0.046, 0.055], [0.04, 0.016]], 20), [0, 0.014]];
  part(g, lathe(prof, 0), S.mug);
  part(g, lathe([[0, 0.088], [0.0445, 0.088], [0, 0.088]], 0), S.coffee);
  part(g, lathe(smooth([[0.0505, 0.092], [0.0515, 0.094], [0.0515, 0.1], [0.0505, 0.101]], 8), 0), S.white);
  part(g, torus(0.032, 0.0095, Math.PI * 1.3), S.mug, 0.046, 0.054, 0, 0, 0, -Math.PI * 0.65);
  return {
    obj: g
  };
};
const headphones = (): Built => {
  const g = grp(),
    R = 0.082;
  part(g, torus(R, 0.009, Math.PI), S.head, 0, 0.058, 0);
  part(g, torus(R, 0.013, Math.PI / 2.6), S.white, 0, 0.058, 0, 0, 0, Math.PI / 2 - Math.PI / 5.2);
  for (const s of [-1, 1]) {
    part(g, sph(0.05, 0.42, 1, 1), S.head, s * 0.092, 0.05, 0);
    part(g, cyl(0.034, 0.034, 0.007, 40), S.terra, s * 0.1, 0.05, 0, 0, 0, -s * Math.PI / 2);
    part(g, torus(0.034, 0.014), S.white, s * 0.07, 0.05, 0, Math.PI / 2);
    part(g, rbox(0.014, 0.022, 0.014, 0.005), S.white, s * R, 0.095, 0);
  }
  return {
    obj: g
  };
};
const lamp = (): Built => {
  const g = grp();
  part(g, lathe([[0, 0], [0.075, 0], [0.078, 0.01], [0.05, 0.026], [0.014, 0.03]], 18), S.lampY);
  part(g, tube([V(0, 0.02, 0), V(0, 0.12, 0.01), V(0, 0.22, 0)], 0.011), S.lampY);
  part(g, sph(0.02), S.lampY, 0, 0.225, 0);
  part(g, tube([V(0, 0.225, 0), V(0, 0.3, -0.05), V(0, 0.38, -0.1)], 0.01), S.lampY);
  part(g, sph(0.018), S.lampY, 0, 0.385, -0.1);
  const sh = grp();
  sh.position.set(0, 0.4, -0.12);
  sh.rotation.x = 0.25;
  g.add(sh);
  part(sh, lathe([[0.1, -0.09], [0.07, -0.04], [0.03, 0.01], [0, 0.02], [0.02, 0.0], [0.065, -0.045], [0.094, -0.088], [0.1, -0.09]], 40), S.lampY);
  part(sh, cyl(0.075, 0.075, 0.005, 40), S.led, 0, -0.077, 0);
  return {
    obj: g
  };
};
const chair = (): Built => {
  const g = grp(),
    sy = 0.46;
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2,
      c = Math.sin(a),
      s = Math.cos(a);
    part(g, tube([V(0, 0.1, 0), V(c * 0.15, 0.085, s * 0.15), V(c * 0.29, 0.065, s * 0.29)], 0.022), S.black);
    part(g, sph(0.036), S.mesh, c * 0.29, 0.036, s * 0.29);
    part(g, sph(0.025), S.steel, c * 0.29, 0.036, s * 0.29);
  }
  part(g, cyl(0.036, 0.036, sy - 0.12, 40), S.steel, 0, 0.1, 0);
  part(g, cyl(0.06, 0.05, 0.1, 40), S.black, 0, 0.1, 0);
  part(g, rbox(0.52, 0.09, 0.5, 0.04), S.blue, 0, sy - 0.08, 0.02);
  part(g, rbox(0.22, 0.03, 0.22, 0.012), S.black, 0, sy - 0.1, 0);
  part(g, tube([V(0, sy - 0.04, -0.2), V(0, sy + 0.1, -0.27), V(0, sy + 0.3, -0.29)], 0.022), S.black);
  part(g, rbox(0.48, 0.52, 0.06, 0.028), S.mesh, 0, sy + 0.12, -0.3, 0, -0.1);
  part(g, rbox(0.38, 0.12, 0.065, 0.03), S.blue, 0, sy + 0.14, -0.27, 0, -0.1);
  for (const s of [-1, 1]) {
    part(g, rbox(0.04, 0.2, 0.04, 0.014), S.black, s * 0.28, sy - 0.04, 0);
    part(g, rbox(0.07, 0.034, 0.27, 0.016), S.black, s * 0.28, sy + 0.16, 0);
  }
  return {
    obj: g
  };
};
const pot = (r: number, h: number, col = S.potT) => {
  const g = grp();
  part(g, lathe([[0, 0], ...smooth([[r * 0.7, 0], [r * 0.9, h * 0.5], [r * 0.98, h * 0.88]], 14), [r * 1.1, h * 0.9], [r * 1.12, h * 1.03], [r * 1.0, h * 1.04], [r * 0.9, h * 0.92], [r * 0.86, h * 0.9], [0, h * 0.9]], 0), col);
  part(g, lathe([[0, 0], [r * 0.88, 0], [0, 0]], 0), S.soil, 0, h * 0.86, 0);
  return g;
};
const leafOf = (wid: number, len: number, holes: boolean) => {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0.02);
  sh.bezierCurveTo(-0.03 * wid, -0.02, -wid * 0.9, 0.0, -wid, len * 0.3);
  sh.bezierCurveTo(-wid * 1.05, len * 0.6, -wid * 0.5, len * 0.88, 0, len);
  sh.bezierCurveTo(wid * 0.5, len * 0.88, wid * 1.05, len * 0.6, wid, len * 0.3);
  sh.bezierCurveTo(wid * 0.9, 0.0, 0.03 * wid, -0.02, 0, 0.02);
  if (holes) for (const sx of [-1, 1]) for (const [y, l] of [[0.1, 0.1], [0.17, 0.095], [0.24, 0.07]] as [number, number][]) {
    const hole = new THREE.Path(),
      x0 = sx * 0.04,
      x1 = sx * (0.04 + l),
      hw = 0.011;
    hole.moveTo(x0, y - hw);
    hole.lineTo(x1, y + hw * 0.4);
    hole.lineTo(x1, y + hw * 2.2);
    hole.lineTo(x0, y + hw);
    hole.lineTo(x0, y - hw);
    sh.holes.push(hole);
  }
  const geo = new THREE.ExtrudeGeometry(sh, {
    depth: 0.005,
    bevelEnabled: true,
    bevelSize: 0.003,
    bevelThickness: 0.003,
    bevelSegments: 3,
    curveSegments: 32
  });
  geo.rotateX(Math.PI / 2);
  return wuv(geo, 0.3);
};
const monsteraLeaf = leafOf(0.125, 0.28, true);
const fiddleLeaf = leafOf(0.085, 0.24, false);
const plant = (): Built => {
  const g = grp(),
    r = rand(8);
  g.add(pot(0.17, 0.3));
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + r() * 0.5,
      len = 0.35 + r() * 0.5,
      lean = 0.1 + r() * 0.2;
    const c = Math.cos(a),
      s = Math.sin(a),
      h = 0.3 + len;
    part(g, tube([V(0, 0.3, 0), V(c * lean * 0.4, 0.3 + len * 0.55, s * lean * 0.4), V(c * lean, h, s * lean)], 0.011), S.stem);
    const lg = grp();
    lg.rotation.order = "YXZ";
    lg.position.set(c * lean, h, s * lean);
    lg.rotation.set(0.1 + r() * 0.5, Math.atan2(c, s), (r() - 0.5) * 0.4);
    part(lg, monsteraLeaf, i % 2 ? S.leaf : S.leaf2);
    g.add(lg);
  }
  return {
    obj: g
  };
};
const fiddle = (): Built => {
  const g = grp(),
    r = rand(21);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(g, cyl(0.02, 0.014, 0.06, 32), S.oak, sx * 0.09, 0, sz * 0.09);
  const p = pot(0.17, 0.34, S.potW);
  p.position.y = 0.06;
  g.add(p);
  const base = 0.4;
  part(g, tube([V(0, base - 0.03, 0), V(0.02, base + 0.4, 0.01), V(-0.01, base + 0.85, 0), V(0.02, base + 1.1, 0.02)], 0.022), S.stem);
  const cols = [S.leaf, S.leaf2, S.leaf3];
  let k = 0;
  for (let row = 0; row < 7; row++) {
    const y = base + 0.28 + row * 0.12;
    for (let j = 0; j < 3; j++) {
      const a = row * 1.9 + j * (Math.PI * 2 / 3) + r() * 0.3;
      const c = Math.cos(a),
        s = Math.sin(a);
      const lg = grp();
      lg.rotation.order = "YXZ";
      lg.position.set(c * 0.03, y, s * 0.03);
      lg.rotation.set(0.35 + r() * 0.3, Math.atan2(c, s), (r() - 0.5) * 0.3);
      lg.scale.setScalar(1.2 - row * 0.07);
      part(lg, fiddleLeaf, cols[k++ % 3]);
      g.add(lg);
    }
  }
  const top = grp();
  top.position.set(0.02, base + 1.1, 0.02);
  top.rotation.x = 0.2;
  top.scale.setScalar(0.9);
  g.add(top);
  part(top, fiddleLeaf, S.leaf2);
  return {
    obj: g
  };
};
const succulent = (): Built => {
  const g = grp();
  g.add(pot(0.05, 0.07, S.potW));
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2,
      c = Math.cos(a),
      s = Math.sin(a);
    part(g, sph(0.03, 0.5, 1.5, 0.5), S.suc, c * 0.03, 0.1, s * 0.03, 0, s * 0.7, -c * 0.7);
  }
  part(g, sph(0.027, 1, 1.2, 1), S.suc, 0, 0.1, 0);
  return {
    obj: g
  };
};
const bottle = (): Built => {
  const g = grp();
  part(g, lathe([[0, 0], [0.036, 0], [0.039, 0.02], [0.039, 0.2], [0.032, 0.23], [0.017, 0.25], [0, 0.25]], 40), S.bottle);
  part(g, cyl(0.02, 0.02, 0.03, 32), S.black, 0, 0.25, 0);
  return {
    obj: g
  };
};
const sneakers = (): Built => {
  const g = grp();
  const one = () => {
    const s = grp();
    part(s, rbox(0.105, 0.042, 0.3, 0.021), S.sole, 0, 0, 0);
    part(s, rbox(0.108, 0.009, 0.302, 0.004), S.shoeA, 0, 0.018, 0);
    part(s, sph(0.1, 0.55, 0.55, 1.35), S.shoe, 0, 0.085, -0.005);
    part(s, sph(0.06, 1, 0.65, 1.05), S.shoe, 0, 0.065, 0.1);
    part(s, sph(0.052, 1, 0.9, 1), S.shoeA, 0, 0.105, -0.11);
    part(s, rbox(0.065, 0.015, 0.11, 0.006), S.shoeA, 0, 0.148, 0.045, 0, 0.35);
    for (let i = 0; i < 3; i++) part(s, cyl(0.006, 0.006, 0.07, 32), S.white, -0.035, 0.158 - i * 0.004, 0.01 + i * 0.03, 0, 0, Math.PI / 2);
    for (const sx of [-1, 1]) part(s, sph(0.05, 0.08, 0.35, 0.8), S.shoeA, sx * 0.05, 0.085, 0, 0, 0, -sx * 0.25);
    return s;
  };
  const a = one();
  a.position.set(-0.07, 0.01, 0);
  a.rotation.y = 0.12;
  g.add(a);
  const b = one();
  b.position.set(0.1, 0.01, 0.04);
  b.rotation.y = -0.3;
  g.add(b);
  return {
    obj: g
  };
};
const couch = (W: number, D: number): THREE.Group => {
  const g = grp();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(g, cyl(0.026, 0.02, 0.11, 32), S.oak, sx * (W / 2 - 0.1), 0, sz * (D / 2 - 0.1));
  part(g, rbox(W, 0.22, D, 0.08), S.boucle, 0, 0.1, 0);
  const n = 2,
    cw = (W - 0.4) / n;
  for (let i = 0; i < n; i++) part(g, rbox(cw - 0.01, 0.16, D - 0.2, 0.07), S.boucle, -(W - 0.4) / 2 + cw * (i + 0.5), 0.3, 0.07);
  part(g, rbox(W, 0.5, 0.22, 0.09), S.boucle, 0, 0.2, -D / 2 + 0.11);
  for (const s of [-1, 1]) part(g, rbox(0.2, 0.28, D, 0.09), S.boucle, s * (W / 2 - 0.1), 0.2, 0);
  return g;
};
const sofa = (): Built => {
  const g = couch(1.9, 0.88);
  part(g, rbox(0.42, 0.4, 0.14, 0.07), S.terra, 0.5, 0.38, 0, -0.3, -0.35, 0.08);
  return {
    obj: g
  };
};
const loveseat = (): Built => {
  const g = couch(1.5, 0.85);
  part(g, rbox(0.4, 0.38, 0.14, 0.07), S.terra, -0.32, 0.4, -0.12, 0.35, -0.3, -0.06);
  part(g, rbox(0.38, 0.36, 0.14, 0.07), S.mustard, 0.3, 0.4, -0.12, -0.3, -0.3, 0.06);
  part(g, rbox(0.3, 0.26, 0.13, 0.06), S.sage, 0.02, 0.38, -0.02, 0, -0.45, 0);
  return {
    obj: g
  };
};
const shelf = (): Built => {
  const g = grp(),
    W = 1.1,
    r = rand(4);
  part(g, rbox(W, 0.035, 0.22, 0.01), S.oak, 0, 0, 0);
  for (const s of [-1, 1]) part(g, rbox(0.02, 0.1, 0.18, 0.005), S.black, s * (W / 2 - 0.15), -0.1, -0.02);
  let x = -W / 2 + 0.06;
  for (let i = 0; i < 6; i++) {
    const w = 0.028 + r() * 0.025,
      h = 0.2 + r() * 0.08;
    part(g, rbox(w, h, 0.16, 0.006), BOOKS[i % 5], x + w / 2, 0.035, 0, 0, 0, i === 5 ? -0.2 : 0);
    x += w + 0.002;
  }
  part(g, cyl(0.055, 0.055, 0.14, 40), S.spk, 0.15, 0.035, 0);
  part(g, cyl(0.055, 0.055, 0.014, 40), S.black, 0.15, 0.175, 0);
  part(g, cyl(0.032, 0.032, 0.003, 32), S.led, 0.15, 0.189, 0);
  part(g, rbox(0.16, 0.04, 0.11, 0.012), S.white, 0.38, 0.035, 0);
  for (const s of [-1, 1]) part(g, rbox(0.012, 0.12, 0.012, 0.004), S.white, 0.38 + s * 0.06, 0.045, -0.04, 0, 0, s * -0.12);
  part(g, rbox(0.03, 0.005, 0.004, 0), S.led, 0.38, 0.05, 0.056);
  return {
    obj: g
  };
};
const bookcase = (): Built => {
  const g = grp(),
    W = 1.2,
    H = 0.8,
    D = 0.34,
    t = 0.03,
    yb = 0.06;
  for (const s of [-1, 1]) part(g, rbox(t, H - yb, D, 0.01), S.oak, s * (W / 2 - t / 2), yb, 0);
  part(g, rbox(t, H - yb, D - 0.02, 0.008), S.oak, 0, yb, 0);
  part(g, rbox(W, t, D, 0.01), S.oak, 0, H - t, 0);
  part(g, rbox(W - 2 * t, t, D - 0.02, 0.01), S.oak, 0, yb, 0);
  part(g, rbox(W - 2 * t, t, D - 0.02, 0.01), S.oak, 0, 0.42, 0);
  part(g, rbox(W - 2 * t, H - yb - 2 * t, 0.015, 0.004), S.white, 0, yb + t, -D / 2 + 0.02);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(g, cyl(0.025, 0.018, yb, 32), S.black, sx * (W / 2 - 0.05), 0, sz * (D / 2 - 0.05));
  const fill = (x0: number, x1: number, y: number, hmax: number, seed: number) => {
    const rr = rand(seed);
    let x = x0;
    while (x < x1 - 0.06) {
      const w = 0.032 + rr() * 0.03,
        h = hmax * (0.7 + rr() * 0.3);
      part(g, rbox(w, h, D - 0.1, 0.007), BOOKS[Math.floor(rr() * 5)], x + w / 2, y, 0.01);
      x += w + 0.003;
    }
  };
  const y1 = yb + t,
    y2 = 0.42 + t;
  fill(-W / 2 + t + 0.02, -0.04, y1, 0.3, 5);
  fill(0.05, W / 2 - t - 0.2, y1, 0.3, 6);
  part(g, rbox(0.14, 0.14, 0.16, 0.05), S.mustard, W / 2 - t - 0.1, y1, 0.02);
  fill(-W / 2 + t + 0.02, 0.1, y2, 0.3, 7);
  part(g, rbox(0.24, 0.035, 0.2, 0.01), S.b1, 0.3, y2, 0.02);
  part(g, rbox(0.2, 0.035, 0.18, 0.01), S.b2, 0.3, y2 + 0.035, 0.02, 0.3);
  const p = pot(0.06, 0.1, S.potG);
  p.position.set(0.38, H, 0);
  g.add(p);
  const rr = rand(3);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2,
      c = Math.cos(a),
      s = Math.sin(a);
    const lg = grp();
    lg.rotation.order = "YXZ";
    lg.position.set(0.38 + c * 0.015, H + 0.1, s * 0.015);
    lg.rotation.set(0.9 + rr() * 0.4, Math.atan2(c, s), 0);
    lg.scale.setScalar(0.55);
    part(lg, fiddleLeaf, i % 2 ? S.leaf : S.leaf2);
    g.add(lg);
  }
  return {
    obj: g
  };
};
const floorlamp = (): Built => {
  const g = grp(),
    H = 1.5;
  part(g, lathe([[0, 0], [0.16, 0], [0.17, 0.01], [0.165, 0.03], [0.1, 0.045], [0.02, 0.05]], 20), S.black);
  part(g, cyl(0.016, 0.016, H - 0.2, 32), PAL.brass, 0, 0.04, 0);
  part(g, cyl(0.02, 0.02, 0.1, 32), PAL.brass, 0, H - 0.2, 0);
  part(g, lathe(smooth([[0.12, 0], [0.2, 0.08], [0.215, 0.2], [0.2, 0.3], [0.17, 0.34]], 24), 0), S.shade, 0, H - 0.18, 0);
  part(g, torus(0.17, 0.011), S.oak, 0, H - 0.18 + 0.34, 0, Math.PI / 2);
  part(g, torus(0.12, 0.011), S.oak, 0, H - 0.18, 0, Math.PI / 2);
  part(g, sph(0.07), S.led, 0, H - 0.04, 0);
  return {
    obj: g
  };
};
const speaker = (): Built => {
  const g = grp();
  part(g, lathe(smooth([[0, 0], [0.05, 0], [0.055, 0.01], [0.055, 0.18], [0.05, 0.19], [0, 0.19]], 14), 0), S.spk);
  part(g, cyl(0.058, 0.058, 0.024, 40), S.blackP, 0, 0, 0);
  part(g, cyl(0.058, 0.058, 0.024, 40), S.blackP, 0, 0.17, 0);
  part(g, cyl(0.045, 0.045, 0.006, 40), S.black, 0, 0.19, 0);
  for (const x of [-0.02, 0.02]) part(g, cyl(0.011, 0.011, 0.009, 32), S.white, x, 0.19, 0);
  part(g, torus(0.0575, 0.0045), S.led, 0, 0.1, 0, Math.PI / 2);
  return {
    obj: g
  };
};
export const MODERN: Record<string, () => Built> = {
  desk,
  laptop,
  monitor,
  phone,
  mug,
  headphones,
  lamp,
  chair,
  plant,
  fiddle,
  succulent,
  bottle,
  sneakers,
  sofa,
  loveseat,
  shelf,
  bookcase,
  floorlamp,
  speaker
};
