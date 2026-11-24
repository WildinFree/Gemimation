import * as THREE from "three";
import { rbox, lathe, cyl, sph, torus, tube, smooth, ck, rand, type Prof } from "../assets/shapes";
import { PAL, tint, part, grp, flame, type Built } from "../assets/palette";
const S = {
  beam: tint(PAL.darkWood, "#8a5a38"),
  oak: tint(PAL.rawWood, "#c8905a"),
  plank: tint(PAL.rawWood, "#d49c5c"),
  table: tint(PAL.rawWood, "#bc8450"),
  barrel: tint(PAL.paintedWood, "#c07a48", {
    rough: 0.6
  }),
  iron: PAL.iron,
  stone: tint(PAL.stone, "#bfb0a6"),
  stone2: tint(PAL.stone, "#a89c98"),
  stone3: tint(PAL.stone, "#cdbfae"),
  ash: tint(PAL.ink, "#4a3436"),
  clay: tint(PAL.china, "#dc7c50", {
    rough: 0.35
  }),
  clay2: tint(PAL.china, "#c8683e", {
    rough: 0.4
  }),
  cloth: tint(PAL.cloth, "#e0c890"),
  straw: tint(PAL.straw, "#e6b850"),
  bread: tint(PAL.straw, "#d8903e", {
    rough: 0.8
  }),
  crust: tint(PAL.straw, "#f0cc80", {
    rough: 0.8
  }),
  wax: tint(PAL.china, "#f6e8b8", {
    rough: 0.6
  }),
  herb: tint(PAL.cloth, "#6fae3a", {
    rough: 0.9
  }),
  herb2: tint(PAL.cloth, "#a8b448", {
    rough: 0.9
  }),
  garlic: tint(PAL.china, "#f2e6d2", {
    rough: 0.7
  }),
  stew: tint(PAL.enamel, "#b0622c"),
  band: tint(PAL.china, "#3f86aa", {
    rough: 0.35
  }),
  twine: tint(PAL.straw, "#b8924c"),
  wick: tint(PAL.ink, "#3a2a2c"),
  ember: tint(PAL.glow, "#ff6a20", {
    emi: 2.4
  })
};
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const P = (a: Prof, n = 40) => smooth(a, n);
const trestleTable = (): Built => {
  const g = grp(),
    L = 1.7,
    W = ck(0.72, 0.8),
    T = ck(0.05, 0.08),
    H = 0.76;
  for (let i = 0; i < 3; i++) part(g, rbox(L, T, W / 3 - 0.012, 0.014), S.table, 0, H - T, (i - 1) * (W / 3));
  for (const s of [-1, 1]) {
    const x = s * (L / 2 - 0.25),
      lw = ck(0.07, 0.1);
    for (const k of [-1, 1]) part(g, rbox(lw, H - T + 0.02, lw, 0.014), S.beam, x, 0, k * 0.18, 0, -k * 0.22, 0);
    part(g, rbox(lw * 1.1, lw, W * 0.95, 0.014), S.beam, x, H - T - lw, 0);
    part(g, rbox(lw, lw * 0.9, W * 0.7, 0.014), S.beam, x, 0.16, 0);
  }
  part(g, rbox(L - 0.4, ck(0.06, 0.08), ck(0.06, 0.08), 0.014), S.beam, 0, 0.22, 0);
  return {
    obj: g
  };
};
const stool = (): Built => {
  const g = grp(),
    r = ck(0.19, 0.21),
    h = ck(0.46, 0.43);
  part(g, cyl(r, r, 0.07, 48), S.plank, 0, h - 0.04, 0);
  part(g, sph(r, 1, 0.2, 1), S.plank, 0, h + 0.03, 0);
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2 + 0.3,
      lx = Math.cos(a),
      lz = Math.sin(a),
      lr = ck(0.04, 0.05);
    part(g, tube([V(lx * r * 0.55, h - 0.03, lz * r * 0.55), V(lx * r * 0.85, h * 0.5, lz * r * 0.85), V(lx * r * 1.2, 0.03, lz * r * 1.2)], lr), S.plank);
    part(g, sph(lr * 1.02), S.plank, lx * r * 1.2, 0.03, lz * r * 1.2);
  }
  return {
    obj: g
  };
};
const bowl = (): Built => {
  const g = grp(),
    r = 0.1,
    d = 0.075,
    w = 0.016;
  const out = P([[0, 0], [r * 0.45, 0], [r * 0.55, 0.01], [r * 0.88, d * 0.45], [r, d]], 24);
  const inn = P([[r - w, d], [r * 0.84 - w, d * 0.45], [r * 0.5, 0.02], [0, 0.016]], 24);
  part(g, lathe([...out, [r + 0.004, d + 0.004], [r - w, d + 0.004], ...inn], 0, 64), S.plank);
  return {
    obj: g
  };
};
const spoon = (): Built => {
  const g = grp();
  part(g, rbox(0.17, 0.014, 0.02, 0.007), S.oak, 0.03, 0, 0);
  part(g, sph(0.032, 1.25, 0.4, 0.95), S.oak, -0.08, 0.012, 0);
  return {
    obj: g
  };
};
const bread = (): Built => {
  const g = grp(),
    s = ck(1.1, 1.25);
  part(g, sph(0.11 * s, 1.3, 0.72, 1), S.bread, 0, 0.07 * s, 0);
  part(g, sph(0.1 * s, 1.25, 0.22, 0.88), S.bread, 0, 0.02 * s, 0);
  for (let i = 0; i < 3; i++) part(g, rbox(0.024 * s, 0.014, 0.1 * s, 0.007), S.crust, (i - 1) * 0.07 * s, 0.138 * s - Math.abs(i - 1) * 0.014, 0, 0.5);
  return {
    obj: g
  };
};
const jug = (): Built => {
  const g = grp(),
    k = ck(1.05, 1.18);
  const prof = P([[0.07 * k, 0], [0.105 * k, 0.025], [0.125 * k, 0.1], [0.118 * k, 0.17], [0.07 * k, 0.225], [0.05 * k, 0.26], [0.066 * k, 0.285], [0.074 * k, 0.285]], 56);
  part(g, lathe([[0, 0], ...prof, [0.06 * k, 0.272], [0.05 * k, 0.262], [0.04 * k, 0.2], [0, 0.18]], 0, 64), S.clay);
  part(g, torus(0.078 * k, 0.014), S.band, 0, 0.222, 0, 0, Math.PI / 2);
  part(g, tube([V(0.06 * k, 0.268, 0), V(0.15 * k, 0.262, 0), V(0.17 * k, 0.17, 0), V(0.118 * k, 0.085, 0)], ck(0.022, 0.028)), S.clay);
  return {
    obj: g
  };
};
const candle = (): Built => {
  const g = grp(),
    k = ck(1.1, 1.3);
  const base = P([[0.09 * k, 0], [0.094 * k, 0.016], [0.07 * k, 0.03], [0.026, 0.036]], 14);
  part(g, lathe([[0, 0], ...base, [0.02, 0.07], [0.045, 0.08], [0.045, 0.092], [0, 0.092]], 0, 56), S.iron);
  part(g, cyl(0.028 * k, 0.026 * k, 0.11, 48), S.wax, 0, 0.09, 0);
  part(g, sph(0.028 * k, 1, 0.5, 1), S.wax, 0, 0.2, 0);
  part(g, sph(0.013, 1, 1.5, 1), S.wax, 0.029 * k, 0.17, 0);
  part(g, cyl(0.004, 0.003, 0.02, 24), S.wick, 0, 0.205, 0);
  return {
    obj: g,
    update: flame(g, 0, 0.22, 0, 0.3, 3)
  };
};
const bucket = (): Built => {
  const g = grp(),
    r0 = ck(0.14, 0.16),
    r1 = ck(0.18, 0.2),
    h = ck(0.3, 0.28),
    n = 18;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2,
      rm = (r0 + r1) / 2,
      sw = 2 * Math.PI * r1 / n + 0.014;
    const m = part(g, rbox(sw, h, 0.03, 0.01), S.oak, Math.cos(a) * rm, 0, Math.sin(a) * rm, -a + Math.PI / 2);
    m.rotateX(Math.atan((r1 - r0) / h));
  }
  part(g, cyl(r0 - 0.005, r0 - 0.005, 0.03, 48), S.oak, 0, 0.02, 0);
  part(g, cyl(r0 + (r1 - r0) * 0.8, r0 + (r1 - r0) * 0.8, 0.004, 48), S.stew, 0, 0.19, 0);
  for (const y of [0.07, h - 0.06]) part(g, torus(r0 + (r1 - r0) * (y / h) + 0.014, ck(0.016, 0.02)), S.iron, 0, y, 0, 0, Math.PI / 2);
  part(g, torus(r1 * 0.98, ck(0.013, 0.016), Math.PI), S.iron, 0, h, 0);
  return {
    obj: g
  };
};
const broom = (): Built => {
  const g = grp(),
    h = 1.35,
    sr = ck(0.02, 0.028);
  part(g, cyl(sr, sr * 0.9, h, 40), S.beam, 0, 0.1, 0);
  part(g, sph(sr * 1.15), S.beam, 0, 0.1 + h, 0);
  const head = P([[0.012, 0.0], [0.15, 0.0], [0.145, 0.04], [0.1, 0.16], [0.062, 0.26], [0.044, 0.34], [0.036, 0.4]], 36);
  part(g, lathe([[0, 0], ...head, [0, 0.4]], 0, 64), S.straw);
  for (const [y, rr] of [[0.14, 0.108], [0.25, 0.07], [0.34, 0.05]] as const) part(g, torus(rr, 0.011), S.twine, 0, y, 0, 0, Math.PI / 2);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * 6.28;
    part(g, sph(0.02, 1, 1.8, 1), S.straw, Math.cos(a) * 0.13, 0.015, Math.sin(a) * 0.13);
  }
  return {
    obj: g
  };
};
const barrel = (): Built => {
  const g = grp(),
    h = ck(0.82, 0.78),
    rb = ck(0.31, 0.34),
    re = rb * 0.84;
  const prof: Prof = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    prof.push([re + (rb - re) * Math.sin(Math.PI * t), h * t]);
  }
  part(g, lathe([[0, 0.01], ...prof, [0, h - 0.01]], 0, 64), S.barrel);
  for (const t of [0.1, 0.28, 0.72, 0.9]) part(g, torus(re + (rb - re) * Math.sin(Math.PI * t) + 0.008, ck(0.02, 0.026)), S.iron, 0, h * t, 0, 0, Math.PI / 2);
  part(g, cyl(re * 0.97, re * 0.97, 0.024, 56), S.table, 0, h - 0.008, 0);
  return {
    obj: g
  };
};
const sack = (): Built => {
  const g = grp(),
    s = ck(1.05, 1.12);
  part(g, lathe([[0, 0], ...P([[0.15 * s, 0], [0.24 * s, 0.1], [0.245 * s, 0.24], [0.16 * s, 0.38], [0.075 * s, 0.46]], 48), [0.06 * s, 0.47], [0, 0.46]], 0, 64), S.cloth);
  part(g, lathe(P([[0.065 * s, 0.46], [0.1 * s, 0.5], [0.125 * s, 0.56], [0.08 * s, 0.6], [0.05 * s, 0.58]], 28), 0, 56), S.cloth);
  part(g, torus(0.07 * s, 0.016), S.twine, 0, 0.475 * s, 0, 0, Math.PI / 2);
  return {
    obj: g
  };
};
const logPile = (): Built => {
  const g = grp(),
    r = rand(4);
  for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - row; i++) {
    const rr = ck(0.06, 0.075) + r() * 0.012,
      x = (i - (3 - row) / 2) * 0.15,
      y = 0.065 + row * 0.12;
    part(g, cyl(rr, rr, 0.55, 40), S.beam, x, y, 0.275, 0, Math.PI / 2);
    part(g, cyl(rr * 0.8, rr * 0.8, 0.006, 40), S.oak, x, y, 0.553, 0, Math.PI / 2);
  }
  return {
    obj: g
  };
};
const cauldronGroup = (k = ck(1, 1.15)) => {
  const g = grp(),
    r = 0.22 * k;
  const belly = P([[r * 0.4, 0], [r * 0.8, 0.035], [r * 1.02, 0.12], [r * 1.0, 0.2], [r * 0.84, 0.268]], 40);
  const inner = P([[r * 0.72, 0.268], [r * 0.9, 0.2], [r * 0.9, 0.12], [r * 0.72, 0.045], [0, 0.035]], 28);
  part(g, lathe([[0, 0], ...belly, [r * 0.82, 0.29], [r * 0.7, 0.29], ...inner], 0, 64), S.iron);
  part(g, torus(r * 0.78, 0.02), S.iron, 0, 0.278, 0, 0, Math.PI / 2);
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2 + 0.5;
    part(g, sph(0.03, 1, 1.6, 1), S.iron, Math.cos(a) * r * 0.58, -0.02, Math.sin(a) * r * 0.58);
  }
  for (const s of [-1, 1]) part(g, sph(0.024), S.iron, s * r * 0.8, 0.26, 0);
  part(g, torus(r * 0.82, 0.013, Math.PI), S.iron, 0, 0.26, 0);
  part(g, cyl(r * 0.76, r * 0.76, 0.006, 56), S.stew, 0, 0.19, 0);
  return g;
};
const cauldron = (): Built => ({
  obj: cauldronGroup()
});
const hearth = (): Built => {
  const g = grp(),
    W = 1.7,
    H = 1.6,
    D = 0.6,
    jw = 0.3,
    ar = (W - 2 * jw) / 2,
    rr = rand(11);
  const cols = [S.stone, S.stone2, S.stone3];
  const jh = [0.3, 0.26, 0.32, 0.28];
  for (const s of [-1, 1]) {
    let y = 0.05;
    for (let i = 0; i < 4; i++) {
      const j = (i + (s > 0 ? 1 : 0)) % 4,
        w = jw + (rr() - 0.5) * 0.04;
      part(g, rbox(w, jh[j] - 0.012, D, 0.03), cols[j % 3], s * (W / 2 - jw / 2) + (rr() - 0.5) * 0.015, y, 0);
      y += jh[j];
    }
  }
  const stones = 9;
  for (let i = 0; i < stones; i++) {
    const a = Math.PI * (1 - (i + 0.5) / stones),
      cx = Math.cos(a) * (ar + 0.06),
      cy = Math.sin(a) * 0.4;
    part(g, rbox(0.2, 0.2, D, 0.03, true), cols[i % 3], cx, 1.2 + cy, 0, 0, 0, a - Math.PI / 2);
  }
  part(g, rbox(W - 0.1, H - 1.6 + 0.2, D * 0.8, 0.03), S.stone3, 0, 1.55, -D * 0.1);
  part(g, rbox(W + 0.24, 0.12, D + 0.14, 0.03), S.beam, 0, 1.5, 0.03);
  part(g, rbox(W + 0.3, 0.1, D + 0.45, 0.04), S.stone2, 0, 0, 0.12);
  part(g, rbox(W - 2 * jw, 0.06, D * 0.4, 0.015), S.ash, 0, 0.1, -0.12);
  part(g, rbox(W - 2 * jw, 1.1, 0.06, 0.01), S.ash, 0, 0.1, -D / 2 + 0.05);
  for (let i = 0; i < 3; i++) part(g, cyl(0.06, 0.06, 0.55, 40), S.beam, (i - 1) * 0.1, 0.17 + (i === 1 ? 0.08 : 0), -0.12, 0.4 * (i - 1), Math.PI / 2);
  part(g, cyl(0.3, 0.2, 0.05, 40), S.ember, 0, 0.12, -0.1);
  const up = flame(g, 0, 0.2, -0.1, 1.6, 7);
  part(g, cyl(0.014, 0.014, 0.72, 24), S.iron, 0.02, 0.9, -0.1);
  const c = cauldronGroup();
  c.position.set(0.02, 0.55, -0.1);
  g.add(c);
  return {
    obj: g,
    update: up
  };
};
const shelf = (): Built => {
  const g = grp(),
    L = 1.1,
    y0 = 0.5,
    T = 0.05;
  part(g, rbox(L, T, 0.14, 0.014), S.plank, 0, y0, 0.05);
  part(g, rbox(L, T, 0.14, 0.014), S.plank, 0, y0, -0.09);
  part(g, rbox(L + 0.02, 0.07, 0.03, 0.012), S.beam, 0, y0 - 0.04, 0.13);
  for (const s of [-1, 1]) {
    part(g, rbox(0.045, 0.28, 0.05, 0.012), S.beam, s * 0.4, y0 - 0.26, -0.1);
    part(g, rbox(0.045, 0.05, 0.26, 0.012), S.beam, s * 0.4, y0 - 0.05, 0);
    part(g, rbox(0.045, 0.2, 0.045, 0.012), S.beam, s * 0.4, y0 - 0.17, 0.03, 0, -0.75);
  }
  const t = y0 + T;
  const crock = (x: number, z: number, h: number, r: number, m: typeof S.clay) => {
    part(g, lathe([[0, 0], ...P([[r * 0.8, 0], [r, h * 0.45], [r * 0.9, h * 0.85], [r * 0.82, h]], 24), [r * 0.7, h], [0, h - 0.015]], 0, 56), m, x, t, z);
  };
  crock(-0.36, 0, 0.2, 0.08, S.clay);
  crock(-0.2, 0.04, 0.14, 0.065, S.clay2);
  crock(0.12, 0, 0.24, 0.085, S.clay);
  part(g, cyl(0.07, 0.07, 0.04, 48), S.cloth, 0.12, t + 0.24, 0);
  part(g, lathe([[0, 0], ...P([[0.05, 0], [0.065, 0.04], [0.06, 0.07]], 14), [0.05, 0.07], [0, 0.05]], 0, 48), S.band, 0.34, t, 0.03);
  part(g, sph(0.045, 1, 0.8, 1), S.bread, 0.4, t + 0.04, -0.04);
  part(g, cyl(0.025, 0.025, 0.1, 40), S.wax, -0.03, t, 0.02);
  return {
    obj: g
  };
};
const herbs = (): Built => {
  const g = grp(),
    r = rand(9),
    top = 0.62;
  part(g, cyl(0.004, 0.004, 0.18, 24), S.twine, 0, top - 0.04, 0);
  part(g, cyl(0.026, 0.02, 0.05, 40), S.twine, 0, top - 0.1, 0);
  part(g, lathe([[0, 0], ...P([[0.02, 0], [0.07, 0.07], [0.085, 0.18], [0.05, 0.3], [0.012, 0.38]], 36), [0, 0.38]], 0, 56), S.herb, 0, top - 0.5, 0);
  for (let j = 0; j < 22; j++) {
    const t = j / 21,
      rad = 0.02 + Math.sin(t * Math.PI * 0.85) * 0.07,
      a = j * 2.4;
    part(g, sph(ck(0.035, 0.045) * (0.8 + r() * 0.4), 1, 1.45, 1), j % 3 ? S.herb : S.herb2, Math.cos(a) * rad, top - 0.14 - t * 0.38, Math.sin(a) * rad, r() * 3, r() * 0.4, r() * 0.4);
  }
  return {
    obj: g
  };
};
const garlic = (): Built => {
  const g = grp(),
    top = 0.62;
  part(g, cyl(0.009, 0.009, 0.5, 24), S.twine, 0, top - 0.52, 0);
  part(g, cyl(0.004, 0.004, 0.12, 24), S.twine, 0, top - 0.06, 0);
  for (let j = 0; j < 7; j++) {
    const a = j * 1.1,
      side = j % 2 ? 1 : -1,
      y = top - 0.14 - j * 0.065;
    const bulb = lathe([[0, 0], ...P([[0.012, 0], [0.05, 0.012], [0.062, 0.045], [0.04, 0.08], [0.012, 0.11], [0.006, 0.125]], 30), [0, 0.125]], 0, 40);
    part(g, bulb, S.garlic, side * 0.035, y - 0.1, Math.cos(a) * 0.012, a, 0, side * 0.25);
    part(g, sph(0.018, 1.2, 0.5, 1.2), S.twine, side * 0.035, y - 0.1, 0);
  }
  return {
    obj: g
  };
};
const chest = (): Built => {
  const g = grp(),
    W = 0.8,
    D = 0.46,
    H = 0.42,
    lid = 0.17,
    bh = H - 0.06;
  part(g, rbox(W, bh, D, 0.03), S.oak, 0, 0, 0);
  part(g, rbox(W + 0.02, 0.05, D + 0.02, 0.02), S.beam, 0, 0, 0);
  const dome = new THREE.CylinderGeometry(D / 2, D / 2, W, 48, 1, false, 0, Math.PI);
  dome.rotateZ(Math.PI / 2);
  dome.scale(1, lid / (D / 2), 1);
  part(g, dome, S.oak, 0, bh, 0);
  for (const x of [-0.27, 0.27]) {
    part(g, rbox(0.07, bh + 0.01, D + 0.03, 0.012), S.iron, x, 0, 0);
    const band = new THREE.CylinderGeometry(D / 2 + 0.014, D / 2 + 0.014, 0.07, 48, 1, false, 0, Math.PI);
    band.rotateZ(Math.PI / 2);
    band.scale(1, lid / (D / 2), 1);
    part(g, band, S.iron, x, bh, 0);
    for (const z of [-D / 2 - 0.018, D / 2 + 0.018]) part(g, sph(0.018), S.iron, x, bh - 0.06, z);
  }
  part(g, rbox(0.1, 0.14, 0.03, 0.015), S.iron, 0, bh - 0.08, D / 2 + 0.012);
  part(g, sph(0.024), S.iron, 0, bh - 0.08, D / 2 + 0.035);
  for (const s of [-1, 1]) part(g, sph(0.027), S.iron, s * (W / 2 + 0.012), bh - 0.06, 0);
  return {
    obj: g
  };
};
const basket = (): Built => {
  const g = grp(),
    r0 = 0.15,
    r1 = 0.22,
    h = 0.28;
  part(g, lathe([[0, 0.01], ...P([[r0 * 0.9, 0.01], [r0, 0.02], [r1 * 0.95, h * 0.9], [r1 * 0.9, h - 0.02]], 20), [r1 * 0.78, h - 0.02], [r0 * 0.8, 0.04], [0, 0.04]], 0, 64), S.twine);
  const n = 9;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1),
      rr = r0 + (r1 - r0) * t * 0.96;
    part(g, torus(rr + 0.004, 0.017), i % 2 ? S.straw : S.twine, 0, 0.03 + t * (h - 0.05), 0, 0, Math.PI / 2);
  }
  for (let i = 0; i < 20; i++) {
    const a = i / 20 * Math.PI * 2;
    part(g, sph(0.02, 0.8, 5, 0.8), S.straw, Math.cos(a) * (r0 + 0.012), 0.1, Math.sin(a) * (r0 + 0.012), -a);
  }
  part(g, torus(r1 + 0.008, 0.024), S.straw, 0, h, 0, 0, Math.PI / 2);
  part(g, torus(r1 + 0.01, 0.017, Math.PI), S.straw, 0, h + 0.01, 0);
  for (let i = 0; i < 3; i++) part(g, sph(0.045, 1, 0.9, 1), S.bread, (i - 1) * 0.07, h - 0.01, i % 2 * 0.04 - 0.02);
  return {
    obj: g
  };
};
const oilLamp = (): Built => {
  const g = grp();
  const body = P([[0.01, 0], [0.06, 0], [0.09, 0.012], [0.095, 0.035], [0.075, 0.05]], 24);
  part(g, lathe([[0, 0], ...body, [0.06, 0.054], [0.05, 0.048], [0.06, 0.03], [0.05, 0.016], [0, 0.014]], 0, 56), S.clay);
  part(g, sph(0.03, 1.5, 0.7, 1), S.clay, 0.1, 0.034, 0, 0, 0, -0.15);
  part(g, sph(0.012, 1, 0.8, 1), S.wick, 0.135, 0.045, 0);
  part(g, tube([V(-0.085, 0.045, 0), V(-0.15, 0.065, 0), V(-0.155, 0.02, 0), V(-0.09, 0.012, 0)], 0.014), S.clay);
  part(g, torus(0.092, 0.01), S.band, 0, 0.032, 0, 0, Math.PI / 2);
  part(g, cyl(0.065, 0.05, 0.008, 40), S.stew, 0, 0.04, 0);
  return {
    obj: g,
    update: flame(g, 0.135, 0.05, 0, 0.22, 3)
  };
};
export const MEDIEVAL: Record<string, () => Built> = {
  trestleTable,
  stool,
  bowl,
  spoon,
  bread,
  jug,
  candle,
  bucket,
  broom,
  barrel,
  sack,
  logPile,
  cauldron,
  hearth,
  shelf,
  herbs,
  garlic,
  chest,
  basket,
  oilLamp
};
