import * as THREE from "three";
import { rbox, lathe, cyl, sph, torus, tube, rand, ck } from "../assets/shapes";
import { PAL, tint, part, grp, flame, type Built } from "../assets/palette";
const S = {
  marble: tint(PAL.stone, "#f0e8dc", {
    rough: 0.4
  }),
  marbleVein: tint(PAL.stone, "#cdbfb4", {
    rough: 0.4
  }),
  cherry: tint(PAL.paintedWood, "#b04a30", {
    rough: 0.6
  }),
  walnut: tint(PAL.darkWood, "#8a5232"),
  velvet: tint(PAL.cloth, "#c0344c"),
  brass: PAL.brass,
  iron: PAL.iron,
  ironDark: tint(PAL.iron, "#34303c", {
    rough: 0.5
  }),
  china: tint(PAL.china, "#fbf4e8"),
  blue: tint(PAL.china, "#3c6cc4", {
    rough: 0.35
  }),
  tile1: tint(PAL.china, "#3a8a84", {
    rough: 0.3
  }),
  tile2: tint(PAL.china, "#e8c068", {
    rough: 0.3
  }),
  coal: tint(PAL.ink, "#3a3040", {
    rough: 0.6
  }),
  fireGlow: tint(PAL.glow, "#ff7a2a", {
    emi: 2.4
  }),
  glass: PAL.glass,
  ink: tint(PAL.ink, "#2c2640", {
    rough: 0.4
  }),
  quill: tint(PAL.cloth, "#fbf6ec", {
    rough: 0.8
  }),
  tea: tint(PAL.china, "#a8501c", {
    rough: 0.2
  }),
  font: tint(PAL.china, "#d44a4a", {
    rough: 0.3
  }),
  shade: tint(PAL.glow, "#ffe0aa", {
    emi: 1.05
  }),
  page: tint(PAL.cloth, "#f6ead0"),
  book1: tint(PAL.leather, "#c03c3c"),
  book2: tint(PAL.leather, "#2c8a5c"),
  book3: tint(PAL.leather, "#4c5cb4"),
  book4: tint(PAL.leather, "#d49a3a"),
  sea: tint(PAL.paintedWood, "#4a90c8", {
    rough: 0.5
  }),
  land: tint(PAL.paintedWood, "#6aa852", {
    rough: 0.5
  }),
  land2: tint(PAL.paintedWood, "#d8b45a", {
    rough: 0.5
  }),
  green: tint(PAL.paintedWood, "#2c6a4c", {
    rough: 0.55
  }),
  rugEdge: tint(PAL.cloth, "#6a3040"),
  rug: tint(PAL.cloth, "#c4504a")
};
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const L = (p: [number, number][], n = 40) => lathe(p, n);
const turned = (h: number, r: number): [number, number][] => [[0, 0], [r * 0.7, 0], [r * 0.9, h * 0.08], [r * 0.55, h * 0.2], [r, h * 0.45], [r * 0.5, h * 0.7], [r * 0.6, h * 0.92], [r * 0.8, h], [0, h]];
const bookSurf = (i: number) => [S.book1, S.book2, S.book3, S.book4][i % 4];
const fireplace = (): Built => {
  const g = grp(),
    W = 1.5,
    H = 1.2,
    D = 0.34,
    pw = 0.22,
    ow = W - 2 * pw,
    oh = 0.62;
  for (const s of [-1, 1]) {
    const x = s * (W / 2 - pw / 2);
    part(g, rbox(pw + 0.05, 0.12, D + 0.04, 0.02), S.marble, x, 0, 0.01);
    part(g, rbox(pw + 0.02, 0.025, D + 0.02, 0.01), S.marbleVein, x, 0.12, 0.01);
    part(g, rbox(pw - 0.03, H - 0.48, D - 0.04, 0.02), S.marble, x, 0.145, 0.02);
    part(g, rbox(pw - 0.07, H - 0.5, 0.03, 0.01), S.marbleVein, x, 0.14, D / 2 - 0.005);
    part(g, rbox(pw + 0.05, 0.05, D + 0.04, 0.015), S.marbleVein, x, H - 0.335, 0.01);
    part(g, rbox(pw + 0.09, 0.08, D + 0.08, 0.025), S.marble, x, H - 0.285, 0.03);
    part(g, sph(0.045, 1, 0.7, 1), S.brass, x, H - 0.25, D / 2 + 0.04);
  }
  part(g, rbox(W - 2 * pw + 0.04, 0.2, D, 0.02), S.marble, 0, H - 0.4, 0);
  part(g, rbox(0.2, 0.1, 0.03, 0.02), S.marbleVein, 0, H - 0.35, D / 2);
  part(g, rbox(W + 0.08, 0.04, D + 0.06, 0.015), S.marbleVein, 0, H - 0.195, 0.02);
  part(g, rbox(W + 0.24, 0.07, D + 0.16, 0.03), S.marble, 0, H - 0.155, 0.06);
  part(g, rbox(W + 0.3, 0.04, D + 0.2, 0.02), S.marble, 0, H - 0.085, 0.08);
  const iw = ow - 0.14,
    ar = iw / 2,
    y0 = 0.12,
    springY = y0 + oh - ar;
  part(g, rbox(ow + 0.02, H - 0.46, 0.06, 0.012), S.iron, 0, y0, -D / 2 + 0.05);
  part(g, rbox(iw, springY - y0, 0.04, 0.01), S.ink, 0, y0, -D / 2 + 0.085);
  part(g, cyl(ar, ar, 0.04, 48), S.ink, 0, springY, -D / 2 + 0.065, 0, Math.PI / 2);
  part(g, torus(ar + 0.03, 0.026, Math.PI), S.ironDark, 0, springY, -D / 2 + 0.115);
  for (const s of [-1, 1]) part(g, rbox(0.06, springY - y0, 0.05, 0.015), S.ironDark, s * (ar + 0.03), y0, -D / 2 + 0.11);
  part(g, sph(0.03, 1, 1, 0.8), S.brass, 0, springY + ar + 0.06, -D / 2 + 0.15);
  const gw = 0.5;
  part(g, rbox(gw, 0.05, 0.2, 0.015), S.ironDark, 0, 0.14, -0.02);
  for (let i = 0; i < 7; i++) part(g, rbox(0.026, 0.17, 0.026, 0.01), S.ironDark, -gw / 2 + 0.02 + i * ((gw - 0.04) / 6), 0.14, 0.09);
  part(g, rbox(gw, 0.025, 0.026, 0.01), S.ironDark, 0, 0.3, 0.09);
  for (const s of [-1, 1]) {
    part(g, rbox(0.05, 0.16, 0.05, 0.02), S.ironDark, s * gw * 0.42, 0.04, 0.0);
    part(g, sph(0.03), S.brass, s * (gw / 2 + 0.01), 0.31, 0.09);
  }
  part(g, rbox(gw - 0.06, 0.03, 0.15, 0.012), S.fireGlow, 0, 0.19, -0.02);
  const r = rand(5);
  for (let i = 0; i < 14; i++) part(g, sph(0.04 + r() * 0.025, 1, 0.8, 1), i % 3 ? S.coal : S.fireGlow, (r() - 0.5) * gw * 0.8, 0.2 + r() * 0.05, -0.02 + (r() - 0.5) * 0.1, r() * 3);
  const up = flame(g, 0, 0.23, -0.04, 0.7, 5);
  part(g, rbox(W + 0.3, 0.05, 0.52, 0.02), S.marble, 0, 0, D / 2 + 0.03);
  const nx = 9,
    nz = 3,
    tw = (W + 0.2) / nx,
    tz = 0.4 / nz;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) part(g, rbox(tw - 0.012, 0.012, tz - 0.012, 0.004), (i + j) % 2 ? S.tile1 : S.tile2, -(W + 0.2) / 2 + tw * (i + 0.5), 0.048, D / 2 - 0.05 + tz * (j + 0.5), 0);
  return {
    obj: g,
    update: up
  };
};
const mantelClock = (): Built => {
  const g = grp(),
    k = ck(1, 1.15);
  part(g, rbox(0.34 * k, 0.05, 0.15, 0.02), S.brass, 0, 0, 0);
  part(g, rbox(0.3 * k, 0.2 * k, 0.13, 0.03), S.cherry, 0, 0.045, 0);
  part(g, sph(0.15 * k, 1, 0.7, 0.47), S.cherry, 0, 0.24 * k, 0);
  part(g, sph(0.03), S.brass, 0, 0.34 * k, 0);
  for (const x of [-0.12, 0.12]) part(g, sph(0.024, 1, 0.8, 1), S.brass, x * k, 0, 0.04);
  part(g, torus(0.085 * k, 0.014), S.brass, 0, 0.19 * k, 0.066);
  part(g, cyl(0.08 * k, 0.08 * k, 0.012, 48), S.china, 0, 0.19 * k, 0.058, 0, Math.PI / 2);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    part(g, sph(0.005), S.ink, Math.sin(a) * 0.066 * k, 0.19 * k + Math.cos(a) * 0.066 * k, 0.07);
  }
  part(g, rbox(0.012, 0.062 * k, 0.005, 0.002, true), S.ink, 0, 0.19 * k + 0.02, 0.074, 0, 0, 0.5);
  part(g, rbox(0.01, 0.045 * k, 0.005, 0.002, true), S.ink, 0, 0.19 * k, 0.076, 0, 0, -1.9);
  return {
    obj: g
  };
};
const painting = (): Built => {
  const g = grp(),
    w = 0.9,
    h = 0.62,
    f = ck(0.06, 0.08),
    y0 = f;
  part(g, rbox(w, h, 0.02, 0.004), S.sea, 0, y0, 0);
  part(g, sph(0.3, 1, 0.4, 0.1), S.land, -0.15, y0 + 0.12, 0.012);
  part(g, sph(0.26, 1, 0.35, 0.1), S.green, 0.18, y0 + 0.09, 0.016);
  part(g, sph(0.06, 1, 1, 0.15), S.shade, 0.26, y0 + 0.42, 0.012);
  part(g, rbox(w + 2 * f, f, 0.05, 0.015), S.brass, 0, 0, 0.01);
  part(g, rbox(w + 2 * f, f, 0.05, 0.015), S.brass, 0, y0 + h, 0.01);
  for (const s of [-1, 1]) part(g, rbox(f, h + f, 0.05, 0.015), S.brass, s * (w / 2 + f / 2), y0, 0.01);
  return {
    obj: g
  };
};
const wingback = (): Built => {
  const g = grp(),
    W = 0.86,
    k = ck(1, 1.1),
    seatY = 0.44;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) part(g, L(turned(0.18, 0.04), 24), S.cherry, x * (W / 2 - 0.06), 0, z * 0.28);
  part(g, rbox(W, 0.28, 0.72, 0.07), S.velvet, 0, 0.15, 0);
  part(g, rbox(W - 0.2, 0.13 * k, 0.62, 0.07), S.velvet, 0, seatY - 0.04, 0.04);
  part(g, rbox(W - 0.04, 0.86 * k, 0.2, 0.08), S.velvet, 0, seatY - 0.05, -0.29, 0, -0.1);
  for (const s of [-1, 1]) {
    part(g, rbox(0.14, 0.28, 0.66, 0.06), S.velvet, s * (W / 2 - 0.07), 0.36, 0.02);
    part(g, cyl(0.09 * k, 0.09 * k, 0.66, 40), S.velvet, s * (W / 2 - 0.06), 0.63, -0.3, 0, Math.PI / 2);
    part(g, sph(0.03), S.brass, s * (W / 2 - 0.06), 0.52, 0.4);
    part(g, rbox(0.11, 0.58 * k, 0.38, 0.05), S.velvet, s * (W / 2 - 0.04), 0.68, -0.16, s * 0.28);
  }
  return {
    obj: g
  };
};
const tripodTable = (): Built => {
  const g = grp(),
    h = 0.66,
    r = ck(0.31, 0.35);
  part(g, cyl(r, r, 0.04, 56), S.cherry, 0, h - 0.01, 0);
  part(g, torus(r, 0.02), S.cherry, 0, h + 0.03, 0, 0, Math.PI / 2);
  part(g, L([[0, 0.12], [0.06, 0.12], [0.075, 0.2], [0.04, 0.3], [0.06, 0.45], [0.035, 0.58], [0.065, h], [0, h]]), S.cherry);
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2,
      c = Math.cos(a),
      s = Math.sin(a);
    part(g, tube([V(c * 0.03, 0.18, s * 0.03), V(c * 0.15, 0.1, s * 0.15), V(c * 0.27, 0.045, s * 0.27)], ck(0.022, 0.03)), S.cherry);
    part(g, sph(0.035, 1, 0.8, 1), S.brass, c * 0.27, 0.035, s * 0.27);
  }
  return {
    obj: g
  };
};
const oilLamp = (): Built => {
  const g = grp(),
    k = ck(1, 1.2);
  part(g, L([[0, 0], [0.09 * k, 0], [0.095 * k, 0.018], [0.05, 0.05], [0.035, 0.12], [0.05, 0.15], [0, 0.15]], 48), S.brass);
  part(g, L([[0, 0], [0.06, 0.005], [0.09 * k, 0.05], [0.085 * k, 0.1], [0.04, 0.135], [0, 0.135]], 48), S.font, 0, 0.15, 0);
  part(g, torus(0.088 * k, 0.007), S.brass, 0, 0.2, 0, 0, Math.PI / 2);
  part(g, L([[0, 0], [0.04, 0], [0.047, 0.03], [0.035, 0.055], [0, 0.055]], 32), S.brass, 0, 0.285, 0);
  part(g, L([[0.026, 0], [0.04, 0.03], [0.042, 0.07], [0.024, 0.12], [0.02, 0.22], [0.018, 0.22], [0.022, 0.12], [0.038, 0.07], [0.036, 0.03], [0.024, 0]], 32), S.glass, 0, 0.34, 0);
  part(g, sph(0.09 * k, 1, 0.9, 1), S.shade, 0, 0.46, 0);
  const up = flame(g, 0, 0.35, 0, 0.2, 3);
  return {
    obj: g,
    update: up
  };
};
const teapot = (): Built => {
  const g = grp(),
    k = ck(1, 1.2);
  part(g, L([[0, 0], [0.055 * k, 0], [0.09 * k, 0.035], [0.1 * k, 0.08], [0.085 * k, 0.125], [0.045, 0.14], [0, 0.14]], 48), S.china);
  part(g, torus(0.099 * k, 0.008), S.blue, 0, 0.07, 0, 0, Math.PI / 2);
  part(g, torus(0.06 * k, 0.006), S.blue, 0, 0.13, 0, 0, Math.PI / 2);
  part(g, L([[0, 0], [0.045, 0], [0.04, 0.02], [0.012, 0.032], [0.016, 0.05], [0, 0.056]], 32), S.china, 0, 0.135, 0);
  part(g, sph(0.018), S.blue, 0, 0.195, 0);
  part(g, tube([V(0.08 * k, 0.04, 0), V(0.13 * k, 0.07, 0), V(0.155 * k, 0.13, 0)], ck(0.018, 0.024)), S.china);
  part(g, torus(0.05, ck(0.012, 0.016), Math.PI * 1.2), S.china, -0.1 * k, 0.08, 0, 0, 0, Math.PI * 0.4);
  return {
    obj: g
  };
};
const teacup = (): Built => {
  const g = grp();
  part(g, L([[0, 0], [0.075, 0.002], [0.085, 0.012], [0.078, 0.018], [0.026, 0.012], [0, 0.012]], 48), S.china);
  part(g, L([[0, 0.012], [0.026, 0.012], [0.048, 0.035], [0.056, 0.075], [0.048, 0.075], [0.042, 0.036], [0, 0.024]], 48), S.china);
  part(g, torus(0.054, 0.006), S.blue, 0, 0.068, 0, 0, Math.PI / 2);
  part(g, cyl(0.046, 0.046, 0.004, 40), S.tea, 0, 0.056, 0);
  part(g, torus(0.024, 0.008, Math.PI * 1.3), S.china, 0.058, 0.045, 0, 0, 0, -Math.PI * 0.65);
  return {
    obj: g
  };
};
const books = (): Built => {
  const g = grp(),
    r = rand(2);
  let y = 0;
  for (let i = 0; i < 4; i++) {
    const w = 0.16 + r() * 0.06,
      d = 0.22 + r() * 0.05,
      t = 0.035 + r() * 0.025,
      ry = (r() - 0.5) * 0.4;
    part(g, rbox(w, t, d, 0.006), bookSurf(i), 0, y, 0, ry);
    part(g, rbox(w - 0.01, t - 0.008, d - 0.006, 0.002), S.page, 0.008, y + 0.004, 0, ry);
    y += t;
  }
  return {
    obj: g
  };
};
const watch = (): Built => {
  const g = grp(),
    r = ck(0.03, 0.036);
  part(g, cyl(r, r, 0.016, 48), S.brass);
  part(g, cyl(r * 0.86, r * 0.86, 0.003, 48), S.china, 0, 0.015, 0);
  part(g, rbox(0.004, 0.002, r * 0.6, 0.001), S.ink, 0, 0.018, -r * 0.25, 0.6);
  part(g, torus(0.008, 0.003), S.brass, 0, 0.007, -r - 0.007);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 8; i++) pts.push(V(Math.sin(i * 0.7) * 0.03, 0.004, -r - 0.014 - i * 0.018));
  part(g, tube(pts, 0.0025), S.brass);
  return {
    obj: g
  };
};
const inkwell = (): Built => {
  const g = grp();
  part(g, rbox(0.07, 0.055, 0.07, 0.012), S.glass);
  part(g, rbox(0.055, 0.038, 0.055, 0.006), S.ink, 0, 0.004, 0);
  part(g, cyl(0.019, 0.019, 0.014, 40), S.brass, 0, 0.055, 0);
  part(g, tube([V(0, 0.045, 0), V(0.05, 0.12, -0.02), V(0.12, 0.2, -0.05)], 0.003), S.quill);
  const vane = sph(0.05, 0.25, 1.6, 0.06);
  vane.rotateZ(-0.7);
  part(g, vane, S.quill, 0.08, 0.15, -0.035);
  return {
    obj: g
  };
};
const bookcase = (): Built => {
  const g = grp(),
    W = 1.0,
    H = 1.9,
    D = 0.34,
    t = 0.035,
    r = rand(11);
  for (const s of [-1, 1]) part(g, rbox(t, H, D, 0.01), S.cherry, s * (W / 2 - t / 2), 0, 0);
  part(g, rbox(W, t, D, 0.01), S.cherry, 0, 0, 0);
  part(g, rbox(W + 0.08, 0.06, D + 0.05, 0.015), S.cherry, 0, H, 0.01);
  part(g, rbox(W, H, 0.02, 0.004), S.walnut, 0, 0, -D / 2 + 0.01);
  for (let sh = 0; sh < 4; sh++) {
    const y = 0.08 + sh * 0.45;
    if (sh) part(g, rbox(W - 2 * t, 0.03, D - 0.02, 0.006), S.cherry, 0, y - 0.03, 0.01);
    let x = -W / 2 + t + 0.01;
    while (x < W / 2 - t - 0.06) {
      const bw = 0.035 + r() * 0.035,
        bh = 0.26 + r() * 0.1,
        lean = x > W / 2 - 0.2 && sh === 2 ? -0.25 : 0;
      part(g, rbox(bw, bh, 0.2 + r() * 0.05, 0.004), bookSurf(Math.floor(r() * 4)), x + bw / 2, y, 0.03, 0, 0, lean);
      x += bw + 0.002;
      if (r() < 0.06) x += 0.08;
    }
  }
  return {
    obj: g
  };
};
const rug = (): Built => {
  const g = grp();
  part(g, rbox(2.6, 0.01, 1.8, 0.004), S.rugEdge);
  part(g, rbox(2.4, 0.014, 1.6, 0.004), S.rug);
  return {
    obj: g
  };
};
const candlestick = (): Built => {
  const g = grp();
  part(g, L([[0, 0], [0.065, 0], [0.075, 0.012], [0.06, 0.03], [0.022, 0.05], [0.026, 0.1], [0.04, 0.125], [0.02, 0.15], [0.03, 0.2], [0.05, 0.23], [0.052, 0.255], [0.03, 0.26], [0, 0.26]], 60), S.brass);
  part(g, cyl(0.026, 0.026, 0.2, 40), S.china, 0, 0.26, 0);
  part(g, sph(0.026, 1, 0.5, 1), S.china, 0, 0.46, 0);
  part(g, cyl(0.004, 0.004, 0.02, 12), S.ink, 0, 0.465, 0);
  const up = flame(g, 0, 0.485, 0, 0.18, 3);
  return {
    obj: g,
    update: up
  };
};
const globe = (): Built => {
  const g = grp(),
    R = 0.2,
    cy = 0.5;
  part(g, L([[0, 0], [0.13, 0], [0.145, 0.015], [0.1, 0.04], [0.035, 0.08], [0.03, 0.2], [0.04, 0.3], [0, 0.3]], 48), S.walnut);
  for (let i = 0; i < 3; i++) {
    const a = i * 2.094;
    part(g, tube([V(Math.cos(a) * 0.03, 0.2, Math.sin(a) * 0.03), V(Math.cos(a) * 0.1, 0.1, Math.sin(a) * 0.1), V(Math.cos(a) * 0.15, 0.02, Math.sin(a) * 0.15)], 0.022), S.walnut);
  }
  const tilt = new THREE.Group();
  tilt.position.set(0, cy, 0);
  tilt.rotation.z = 0.4;
  g.add(tilt);
  part(tilt, sph(R), S.sea);
  const rr = rand(7);
  for (let i = 0; i < 7; i++) {
    const th = rr() * 6.28,
      ph = (rr() - 0.5) * 2.2,
      s = 0.06 + rr() * 0.05;
    const m = part(tilt, sph(s, 1, 1, 0.35), i % 2 ? S.land : S.land2, Math.cos(th) * Math.cos(ph) * R * 0.97, Math.sin(ph) * R * 0.97, Math.sin(th) * Math.cos(ph) * R * 0.97);
    m.lookAt(m.position.clone().multiplyScalar(2).add(tilt.position));
  }
  part(tilt, torus(R * 1.1, 0.012), S.brass, 0, 0, 0, Math.PI / 2);
  part(tilt, torus(R * 1.1, 0.01), S.brass, 0, 0, 0, 0, Math.PI / 2);
  part(tilt, cyl(0.014, 0.014, R * 2.5, 24), S.brass, 0, -R * 1.25, 0);
  part(tilt, sph(0.026), S.brass, 0, R * 1.28, 0);
  return {
    obj: g
  };
};
const hatStand = (): Built => {
  const g = grp(),
    H = 1.7;
  part(g, L([[0, 0], [0.17, 0], [0.19, 0.02], [0.14, 0.06], [0.05, 0.12], [0, 0.12]], 48), S.ironDark);
  part(g, L([[0, 0.1], [0.04, 0.1], [0.032, 0.3], [0.04, 0.5], [0.028, 0.9], [0.032, 1.4], [0.045, H - 0.08], [0.04, H - 0.04], [0, H - 0.04]], 60), S.walnut);
  part(g, sph(0.05), S.brass, 0, H, 0);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + Math.PI / 4,
      c = Math.cos(a),
      s = Math.sin(a);
    part(g, tube([V(c * 0.03, H - 0.18, s * 0.03), V(c * 0.1, H - 0.2, s * 0.1), V(c * 0.17, H - 0.1, s * 0.17)], 0.014), S.brass);
    part(g, sph(0.022), S.brass, c * 0.17, H - 0.1, s * 0.17);
  }
  part(g, torus(0.14, 0.015), S.brass, 0, 0.75, 0, 0, Math.PI / 2);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2;
    part(g, rbox(0.012, 0.012, 0.11, 0.004), S.brass, Math.cos(a) * 0.085, 0.745, Math.sin(a) * 0.085, -a + Math.PI / 2);
  }
  return {
    obj: g
  };
};
export const VICTORIAN: Record<string, () => Built> = {
  fireplace,
  clock: mantelClock,
  painting,
  armchair: wingback,
  table: tripodTable,
  lamp: oilLamp,
  teapot,
  teacup,
  books,
  watch,
  inkwell,
  bookcase,
  rug,
  candlestick,
  globe,
  hatstand: hatStand
};
