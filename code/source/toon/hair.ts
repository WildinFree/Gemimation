import type { Pen, Blob, Outfit } from "./toon";
import type { HairStyle } from "./dna";
export type P2 = [number, number];
export type HairView = "front" | "side" | "back";
export type HairCtx = {
  p: Pen;
  o: Outfit;
  style: HairStyle;
  H: Blob;
  hp: P2[];
  cx: number;
  hc: number;
  facing: number;
  view: HairView;
  light: number;
  thick: number;
  ow: number;
  u: number;
  col: string;
  hat: boolean;
  seed: number;
};
const INK = "#241726",
  D2R = Math.PI / 180;
type Shape = {
  pts: P2[];
  ink?: [number, number];
  vol?: boolean;
  w?: number;
  alpha?: number;
};
type Tick = {
  pts: P2[];
  w?: number;
  col?: string;
};
type Built = {
  behind: Shape[];
  over: Shape[];
  bt: Tick[];
  ot: Tick[];
  R: number;
};
const sm = (pts: P2[], seg = 6): P2[] => {
  const n = pts.length,
    out: P2[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n],
      p1 = pts[i],
      p2 = pts[(i + 1) % n],
      p3 = pts[(i + 2) % n];
    for (let s = 0; s < seg; s++) {
      const t = s / seg,
        t2 = t * t,
        t3 = t2 * t;
      const f = (k: 0 | 1) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  return out;
};
const stripe = (pts: P2[], w: number): P2[] => {
  const L: P2[] = [],
    R: P2[] = [];
  pts.forEach((q, i) => {
    const a = pts[Math.max(0, i - 1)],
      b = pts[Math.min(pts.length - 1, i + 1)];
    let nx = b[1] - a[1],
      ny = a[0] - b[0];
    const l = Math.hypot(nx, ny) || 1;
    nx = nx / l * w / 2;
    ny = ny / l * w / 2;
    L.push([q[0] + nx, q[1] + ny]);
    R.push([q[0] - nx, q[1] - ny]);
  });
  return [...L, ...R.reverse()];
};
const build = (c: HairCtx): Built => {
  const {
    hp,
    cx,
    hc,
    H,
    u,
    view,
    facing,
    seed,
    style
  } = c;
  const a = H.a,
    b = H.b,
    n = hp.length,
    step = 360 / n;
  const side = view === "side",
    back = view === "back",
    front = view === "front";
  const f = side ? 1 : facing,
    fv = f || 1;
  void fv;
  const X = (d: number) => cx + d * a,
    Y = (d: number) => hc + d * b;
  const XV = (d: number) => front ? cx + (d - f * 0.06) * a : cx + d * a;
  const rn = (k: number) => {
    const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const ss = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };
  const sc = (q: P2, k: number): P2 => [cx + (q[0] - cx) * k, hc + (q[1] - hc) * k];
  const at = (deg: number, k = 1): P2 => sc(hp[Math.round((deg % 360 + 360) % 360 / step) % n], k);
  const top = (deg: number) => Math.max(0, -Math.sin(deg * D2R));
  const pl = (pts: [number, number][]) => (x: number) => {
    const d = (x - cx) / a;
    if (d <= pts[0][0]) return Y(pts[0][1]);
    for (let i = 1; i < pts.length; i++) if (d <= pts[i][0]) {
      const [x0, y0] = pts[i - 1],
        [x1, y1] = pts[i];
      return Y(y0 + (y1 - y0) * (d - x0) / (x1 - x0));
    }
    return Y(pts[pts.length - 1][1]);
  };
  const sh = f * 0.08 * a;
  const Ef = (x: number) => Y(-0.6 + 0.55 * Math.pow(Math.abs((x - cx - sh) / a), 2.6));
  const Es = pl([[-1.2, 0.55], [-0.55, 0.5], [-0.3, -0.18], [0.1, -0.28], [0.55, -0.44], [1.2, -0.5]]);
  const Eb = (x: number) => {
    const d = (x - cx) / a;
    return Y(0.55 - 0.35 * d * d);
  };
  const E = back ? Eb : side ? Es : Ef;
  const cap = (k: number, edge: (x: number) => number = E, lift?: (deg: number) => number) => {
    const P = hp.map((q, i) => sc(q, k + (lift ? lift(i * step) : 0)));
    const keep = P.map(([x, y]) => y < edge(x));
    let s = -1;
    for (let i = 0; i < n; i++) if (keep[i] && !keep[(i + n - 1) % n]) {
      s = i;
      break;
    }
    if (s < 0) return null;
    const arc: P2[] = [];
    for (let j = 0; j < n; j++) {
      const i = (s + j) % n;
      if (!keep[i]) break;
      arc.push(P[i]);
    }
    const L = arc.length,
      lx = arc[L - 1][0],
      fx = arc[0][0];
    for (let m = 1; m < 12; m++) {
      const x = lx + (fx - lx) * m / 12;
      arc.push([x, edge(x)]);
    }
    return {
      pts: arc,
      L
    };
  };
  const capS = (k: number, edge?: (x: number) => number, lift?: (deg: number) => number, extra: Partial<Shape> = {}): Shape[] => {
    const r = cap(k, edge, lift);
    return r ? [{
      pts: r.pts,
      ...extra
    }] : [];
  };
  const ring = (a0: number, a1: number, k: number, th: (d: number) => number): Shape => {
    const o: P2[] = [],
      i2: P2[] = [];
    for (let d = a0; d <= a1 + 1e-6; d += step) {
      o.push(at(d, k));
      i2.push(at(d, Math.max(0.4, k - Math.max(0.02, th(d)))));
    }
    return {
      pts: [...o, ...i2.reverse()]
    };
  };
  const disc = (x: number, y: number, r: number, m = 28): P2[] => Array.from({
    length: m
  }, (_, i) => [x + r * Math.cos(i / m * 6.2832), y + r * Math.sin(i / m * 6.2832)] as P2);
  const mass = (mx: number, my: number, rx: number, ry: number, lobes: number, amp: number, r0: number) => {
    const pts: P2[] = [],
      cusps: P2[] = [],
      N = lobes * 8;
    for (let i = 0; i < N; i++) {
      const t = i / N * 2 * Math.PI,
        lobe = Math.abs(Math.sin(t * lobes / 2)),
        r = r0 + amp * Math.pow(lobe, 0.6);
      pts.push([mx + rx * r * Math.cos(t), my + ry * r * Math.sin(t)]);
      if (i % 8 === 0) cusps.push([mx + rx * (r0 + 0.02) * Math.cos(t), my + ry * (r0 + 0.02) * Math.sin(t)]);
    }
    return {
      pts,
      cusps
    };
  };
  const spikes = (degs: number[], len: number, half = 9): Shape[] => degs.map((m, i) => {
    const A = at(m - half, 0.97),
      B = at(m + half, 0.97),
      M = at(m, 1),
      dx = M[0] - cx,
      dy = M[1] - hc,
      l = Math.hypot(dx, dy) || 1;
    const L = len * (0.85 + 0.3 * rn(i + 1));
    return {
      pts: [A, [M[0] + dx / l * L, M[1] + dy / l * L], B] as P2[],
      vol: true
    };
  });
  const lift = (amp: number) => (d: number) => amp * Math.pow(top(d), 1.3);
  const out: Built = {
    behind: [],
    over: [],
    bt: [],
    ot: [],
    R: a * 1.15
  };
  const tx = f ? -f : 1;
  switch (style) {
    case "bald":
      out.ot.push({
        pts: [at(247, 0.82), at(256, 0.77)],
        w: 1.3 * u
      });
      break;
    case "horseshoe":
      {
        const tuft = (deg: number, k: number) => {
          const m = at(deg, 1.0);
          out.over.push({
            pts: mass(m[0], m[1], 0.2 * a * k, 0.17 * b * k, 3, 0.18, 0.9).pts
          });
        };
        if (front) for (const sd of [-1, 1]) tuft(sd < 0 ? 196 : 344, f && sd === f ? 0.75 : 1.05);else if (side) tuft(192, 1.2);else {
          out.over.push(ring(-14, 194, 1.04, () => 0.26));
          tuft(196, 1.05);
          tuft(344, 1.05);
        }
        break;
      }
    case "buzz":
      {
        const eb = front ? (x: number) => {
          const d = Math.abs((x - cx - sh) / a);
          return Y(-0.68 + 0.5 * Math.pow(d, 3) + (d > 0.8 ? 0.06 : 0));
        } : E;
        out.over.push(...capS(1.006, eb, undefined, {
          w: 0.55,
          alpha: 0.6
        }));
        break;
      }
    case "sidepart":
      {
        const ps = f ? f : -1,
          sw = -ps;
        const Esw = (x: number) => {
          const d = (x - cx) / a,
            q = d * sw,
            ad = Math.min(1, Math.abs(d));
          return Y(-0.6 + 0.45 * Math.pow(ad, 2.6) + 0.26 * ss(-0.1, 0.9, q) * (1 - Math.pow(ad, 3)));
        };
        const Eside = pl([[-1.2, 0.55], [-0.55, 0.5], [-0.3, -0.18], [0.1, -0.3], [0.6, -0.5], [0.95, -0.4], [1.2, -0.3]]);
        const edge = back ? Eb : side ? Eside : Esw;
        out.over.push(...capS(1.06, edge, lift(0.18)));
        if (front) out.over.push({
          pts: sm([[X(ps * 0.3), Y(-0.95)], [X(sw * 0.2), Y(-1.35)], [X(sw * 0.85), Y(-1.2)], [X(sw * 1.2), Y(-0.7)], [X(sw * 1.1), Y(-0.3)], [X(sw * 0.8), Y(-0.65)], [X(sw * 0.2), Y(-0.85)]]),
          vol: true
        });else if (side) out.over.push({
          pts: sm([[X(-0.3), Y(-0.8)], [X(0.2), Y(-1.35)], [X(0.9), Y(-1.3)], [X(1.25), Y(-0.75)], [X(1.1), Y(-0.45)], [X(0.8), Y(-0.75)], [X(0.2), Y(-0.85)]]),
          vol: true
        });
        const m = at(270 + ps * 22, 1.06);
        out.ot.push({
          pts: [m, [m[0] + ps * 0.05 * a, m[1] + 0.2 * b], [m[0] + ps * 0.02 * a, Math.min(edge(m[0]), m[1] + 0.4 * b)]]
        });
        break;
      }
    case "combover":
      {
        if (front) for (const sd of [-1, 1]) {
          const m = at(sd < 0 ? 194 : 346, 1.0),
            k = f && sd === f ? 0.6 : 0.85;
          out.over.push({
            pts: mass(m[0], m[1], 0.16 * a * k, 0.13 * b * k, 3, 0.14, 0.9).pts
          });
        } else if (side) out.over.push(ring(105, 235, 1.03, () => 0.24));else out.over.push(ring(-10, 190, 1.03, () => 0.2));
        for (let j = 0; j < 3; j++) {
          const s0 = side ? 150 + 10 * j : 196 + 4 * j,
            e0 = side ? 315 - 12 * j : 330 - 18 * j,
            pts: P2[] = [];
          for (let d = s0; d <= e0; d += step) pts.push(at(d, 0.97 - 0.13 * j));
          out.over.push({
            pts: stripe(pts, 3.4 * u)
          });
        }
        break;
      }
    case "quiff":
      {
        const e = front ? (x: number) => Y(-0.6 + 0.55 * Math.pow(Math.abs((x - cx - sh) / a), 2.6)) : E;
        out.over.push(...capS(1.04, e, lift(0.05)));
        let v: P2[];
        if (side) v = [[X(-0.4), Y(-0.7)], [X(-0.3), Y(-1.2)], [X(0.2), Y(-1.62)], [X(0.9), Y(-1.5)], [X(1.5), Y(-1.0)], [X(1.2), Y(-0.9)], [X(0.8), Y(-1.0)], [X(0.9), Y(-0.7)], [X(0.4), Y(-0.75)]];else if (back) v = [[X(-0.9), Y(-0.3)], [X(-0.95), Y(-0.9)], [X(-0.4), Y(-1.42)], [X(0.4), Y(-1.42)], [X(0.95), Y(-0.9)], [X(0.9), Y(-0.3)]];else v = [[XV(-0.9), Y(-0.5)], [XV(-0.95), Y(-1.0)], [XV(-0.5), Y(-1.6)], [XV(0.3), Y(-1.72)], [XV(0.95), Y(-1.4)], [XV(1.1), Y(-0.95)], [XV(0.75), Y(-0.78)], [XV(0.2), Y(-0.92)], [XV(-0.2), Y(-0.66)]];
        out.over.push({
          pts: sm(v),
          vol: true
        });
        break;
      }
    case "spiky":
      {
        out.over.push(...capS(1.03, E));
        out.over.push(...spikes(side ? [195, 222, 249, 276, 303, 330] : [208, 232, 256, 280, 304, 328], 0.6 * b, 9));
        break;
      }
    case "mohawk":
      {
        if (side) {
          out.over.push(ring(205, 335, 1.0, () => 0.1));
          for (let i = 0; i < 6; i++) {
            const m = 212 + i * 22,
              A = at(m - 12, 0.97),
              B = at(m + 12, 0.97),
              M = at(m, 1),
              dx = M[0] - cx,
              dy = M[1] - hc,
              l = Math.hypot(dx, dy) || 1,
              L = 0.55 * b * (0.8 + 0.4 * Math.sin((i + 0.5) / 6 * Math.PI));
            out.over.push({
              pts: [A, [M[0] + dx / l * L - 0.4 * L, M[1] + dy / l * L + 0.1 * L], B],
              vol: true
            });
          }
          if (c.hat) out.behind.push({
            pts: sm([[X(-0.8), Y(-0.3)], [X(-1.3), Y(-0.35)], [X(-1.6), Y(0.4)], [X(-1.2), Y(0.35)], [X(-0.9), Y(0.3)]])
          });
        } else {
          const lo = back ? 0.5 : -0.42,
            w = 0.24;
          if (c.hat && front) out.behind.push({
            pts: [[X(tx * 0.6), Y(-0.1)], [X(tx * 1.25), Y(-0.45)], [X(tx * 1.1), Y(-0.1)], [X(tx * 1.55), Y(0.15)], [X(tx * 1.15), Y(0.3)], [X(tx * 1.4), Y(0.75)], [X(tx * 0.7), Y(0.4)]]
          });
          out.over.push({
            pts: [[XV(-w), Y(lo)], [XV(-w - 0.02), Y(-1.25)], [XV(-0.14), Y(-1.58)], [XV(-0.07), Y(-1.4)], [XV(0), Y(-1.78)], [XV(0.07), Y(-1.4)], [XV(0.14), Y(-1.6)], [XV(w + 0.02), Y(-1.25)], [XV(w), Y(lo)]]
          });
        }
        break;
      }
    case "afro":
    case "curly":
      {
        const af = style === "afro";
        const m = mass(side ? cx - 0.18 * a : cx - f * 0.05 * a, hc + (c.hat ? 0.2 : af ? -0.12 : -0.08) * b, (af ? 1.5 : 1.3) * a, (c.hat ? 0.72 : af ? 1.42 : 1.22) * b, af ? 12 : 9, af ? 0.1 : 0.12, af ? 1.0 : 0.98);
        out.behind.push({
          pts: m.pts
        });
        out.R = a * (af ? 1.5 : 1.3);
        m.cusps.forEach(([x, y]) => {
          out.bt.push({
            pts: [[x, y], [x + (cx - x) * 0.12, y + (hc - y) * 0.12]],
            w: 1.2 * u
          });
        });
        const edge = front && !af ? (x: number) => Ef(x) + 0.05 * b * Math.abs(Math.sin((x - cx) / a * 7)) : E;
        const r = cap(1.05, edge);
        if (r) out.over.push({
          pts: r.pts,
          ink: [r.L - 1, r.pts.length - 1]
        });
        break;
      }
    case "puffs":
      {
        out.over.push(...capS(1.03, E, undefined, {
          w: 0.9
        }));
        if (side) {
          const A = at(238, 1.15),
            B = at(292, 1.12);
          out.behind.push({
            pts: disc(B[0], B[1], 0.38 * a),
            vol: true
          });
          out.over.push({
            pts: disc(A[0], A[1], 0.4 * a),
            vol: true
          });
        } else {
          for (const s of [-1, 1]) {
            const q = at(270 + s * 38, 1.12);
            out.behind.push({
              pts: disc(q[0] + s * 0.06 * a, q[1] - 0.05 * b, 0.4 * a),
              vol: true
            });
          }
        }
        break;
      }
    case "bun":
      {
        out.over.push(...capS(1.03, E));
        const q: P2 = side ? at(248, 1.2) : [XV(0), Y(-1.28)];
        const r = 0.36 * a;
        out.over.push({
          pts: disc(q[0], q[1], r),
          vol: true
        });
        out.ot.push({
          pts: [[q[0] - r * 0.8, q[1] + r * 0.85], [q[0], q[1] + r * 0.98], [q[0] + r * 0.8, q[1] + r * 0.85]],
          w: 1.3 * u
        });
        break;
      }
    case "ponytail":
      {
        out.over.push(...capS(1.03, E, lift(0.02)));
        if (side) {
          out.behind.push({
            pts: sm([[X(-0.8), Y(-0.6)], [X(-1.35), Y(-0.55)], [X(-1.75), Y(0.1)], [X(-1.85), Y(1.2)], [X(-1.55), Y(1.75)], [X(-1.35), Y(0.9)], [X(-1.0), Y(0.1)]])
          });
          out.ot.push({
            pts: [[X(-0.98), Y(-0.55)], [X(-1.02), Y(-0.1)]],
            w: 3.4 * u,
            col: "#c8473d"
          });
        } else if (back) {
          out.over.push({
            pts: sm([[X(-0.2), Y(-0.3)], [X(0.2), Y(-0.3)], [X(0.34), Y(0.9)], [X(0.12), Y(1.95)], [X(-0.2), Y(1.2)]])
          });
          out.ot.push({
            pts: [[X(-0.2), Y(-0.28)], [X(0.2), Y(-0.28)]],
            w: 3 * u,
            col: "#c8473d"
          });
        } else {
          out.behind.push({
            pts: sm([[X(-0.2), Y(-0.5)], [X(0.25), Y(-0.5)], [X(tx * 1.1), Y(0.3)], [X(tx * 1.4), Y(1.4)], [X(tx * 1.1), Y(2.05)], [X(tx * 0.75), Y(1.3)], [X(tx * 0.3), Y(0.4)]])
          });
        }
        break;
      }
    case "bob":
      {
        const fr = (x: number) => Y(-0.34 + 0.08 * Math.pow((x - cx) / a, 2));
        if (side) {
          out.behind.push({
            pts: sm([[X(-0.8), Y(-0.7)], [X(-1.3), Y(0.1)], [X(-1.25), Y(0.97)], [X(-0.3), Y(1.0)], [X(0), Y(0.2)], [X(-0.2), Y(-0.4)]])
          });
          out.over.push(...capS(1.04, pl([[-1.2, 0.55], [-0.55, 0.5], [-0.3, -0.18], [0.1, -0.3], [0.6, -0.4], [1.2, -0.36]])));
          out.over.push({
            pts: sm([[X(0.35), Y(-0.3)], [X(0.25), Y(0.5)], [X(0.05), Y(0.98)], [X(-0.9), Y(1.0)], [X(-1.15), Y(0.4)], [X(-1.0), Y(-0.3)]])
          });
        } else if (back) {
          out.over.push(...capS(1.08, () => Y(0.7)));
          out.over.push({
            pts: sm([[X(-1.05), Y(0.2)], [X(-1.25), Y(1.0)], [X(0), Y(1.05)], [X(1.25), Y(1.0)], [X(1.05), Y(0.2)], [X(0), Y(0.3)]])
          });
          out.ot.push({
            pts: [at(270, 1.06), [X(0), Y(0.4)], [X(0), Y(1.0)]],
            w: 1.3 * u
          });
        } else {
          out.behind.push({
            pts: sm([[X(-1.1), Y(-0.3)], [X(-1.24), Y(0.4)], [X(-1.1), Y(1.0)], [X(1.1), Y(1.0)], [X(1.24), Y(0.4)], [X(1.1), Y(-0.3)]])
          });
          out.over.push(...capS(1.05, fr));
          for (const s of [-1, 1]) out.over.push({
            pts: sm([[X(s * 1.02), Y(-0.34)], [X(s * 0.84), Y(-0.3)], [X(s * 0.8), Y(0.4)], [X(s * 0.86), Y(0.96)], [X(s * 1.2), Y(1.0)], [X(s * 1.22), Y(0.2)]])
          });
        }
        break;
      }
    case "long":
      {
        if (side) {
          out.behind.push({
            pts: sm([[X(-0.8), Y(-0.8)], [X(-1.35), Y(-0.2)], [X(-1.55), Y(1.2)], [X(-1.4), Y(2.4)], [X(-0.5), Y(2.3)], [X(-0.3), Y(1.0)], [X(-0.2), Y(-0.2)]])
          });
          out.over.push(...capS(1.04));
          out.over.push({
            pts: sm([[X(0.3), Y(-0.3)], [X(0.2), Y(0.6)], [X(0), Y(1.5)], [X(-0.45), Y(1.8)], [X(-0.75), Y(0.8)], [X(-0.7), Y(-0.2)]])
          });
        } else if (back) {
          out.over.push(...capS(1.1, () => Y(0.9)));
          {
            const bot: P2[] = [];
            for (let i = 0; i <= 8; i++) bot.push([X(1.25 - i * 0.3125), Y(i % 2 ? 2.15 : 2.45)]);
            out.over.push({
              pts: [[X(-1.1), Y(0.1)], ...sm([[X(-1.3), Y(1.2)], [X(-1.3), Y(2.2)]], 3).slice(0, 0), [X(-1.3), Y(1.2)], ...bot, [X(1.3), Y(1.2)], [X(1.1), Y(0.1)]]
            });
            for (const t of [-0.5, 0.1, 0.65]) out.ot.push({
              pts: [[X(t), Y(1.7)], [X(t + 0.05), Y(2.15)]],
              w: 1.3 * u
            });
          }
        } else {
          out.behind.push({
            pts: sm([[X(-1.0), Y(-0.6)], [X(-1.2), Y(0.3)], [X(-1.24), Y(1.75)], [X(-1.0), Y(2.0)], [X(1.0), Y(2.0)], [X(1.24), Y(1.75)], [X(1.2), Y(0.3)], [X(1.0), Y(-0.6)]], 4)
          });
          out.over.push(...capS(1.05, Ef));
          for (const s of [-1, 1]) out.over.push({
            pts: sm([[X(s * 1.02), Y(-0.3)], [X(s * 0.8), Y(-0.2)], [X(s * 0.82), Y(0.7)], [X(s * 0.92), Y(1.45)], [X(s * 1.06), Y(1.85)], [X(s * 1.2), Y(1.6)], [X(s * 1.18), Y(0.4)]])
          });
        }
        break;
      }
    case "sleek":
      {
        const peak = (x: number) => {
          const d = Math.abs((x - cx - sh) / a);
          return Y(-0.36 - 0.3 * Math.min(d / 0.45, 1) + 0.55 * Math.pow(d, 2.8));
        };
        const e = back ? Eb : side ? pl([[-1.2, 0.55], [-0.55, 0.5], [-0.3, -0.18], [0.1, -0.32], [0.6, -0.52], [1.2, -0.56]]) : peak;
        out.over.push(...capS(1.025, e, lift(0.03)));
        const hl: P2[] = [];
        for (let d = 238; d <= 300; d += step) hl.push(at(d, 0.9));
        out.ot.push({
          pts: hl,
          w: 3 * u,
          col: "rgba(255,255,255,0.4)"
        });
        if (back) {
          out.over.push({
            pts: disc(X(0), Y(0.3), 0.3 * a)
          });
          out.ot.push({
            pts: [[X(-0.22), Y(0.42)], [X(0), Y(0.5)], [X(0.22), Y(0.42)]],
            w: 1.2 * u
          });
        }
        break;
      }
    case "flattop":
      {
        out.over.push(...capS(1.03, E));
        const w = back || front ? 0.82 : 0.92;
        out.over.push({
          pts: [[XV(-w), Y(-0.55)], [XV(-w - 0.04), Y(-1.2)], [XV(-w + 0.04), Y(-1.3)], [XV(w - 0.04), Y(-1.3)], [XV(w + 0.04), Y(-1.2)], [XV(w), Y(-0.55)]],
          vol: true
        });
        break;
      }
    default:
      break;
  }
  return out;
};
const inkOpen = (c: HairCtx, pts: P2[], w0: number) => {
  const {
      p,
      cx,
      hc,
      thick
    } = c,
    g = p.g,
    o: P2[] = [],
    i2: P2[] = [];
  pts.forEach((q, i) => {
    const A = pts[Math.max(0, i - 1)],
      B = pts[Math.min(pts.length - 1, i + 1)];
    let nx = B[1] - A[1],
      ny = A[0] - B[0];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    const h = 0.5 * w0 * (1 + 0.45 * Math.cos(Math.atan2(q[1] - hc, q[0] - cx) - thick));
    o.push([q[0] + nx * h, q[1] + ny * h]);
    i2.push([q[0] - nx * h, q[1] - ny * h]);
  });
  p.path([...o, ...i2.reverse()], true);
  g.fillStyle = INK;
  g.fill();
};
const paint = (c: HairCtx, shapes: Shape[], ticks: Tick[], R: number) => {
  const {
      p,
      u,
      ow,
      thick,
      cx,
      hc,
      H
    } = c,
    g = p.g,
    yH = hc - 0.4 * H.b;
  let S = shapes;
  if (c.hat) S = S.filter(s => !s.vol && s.pts.some(q => q[1] > yH + u)).map(s => ({
    ...s,
    pts: s.pts.map(([x, y]) => [x, Math.max(y, yH)] as P2)
  }));
  for (const s of S) {
    const w0 = 1.8 * ow * (s.w ?? 1);
    if (s.ink) inkOpen(c, s.pts.slice(s.ink[0], s.ink[1] + 1), w0);else p.inkRing(s.pts, w0, thick);
  }
  for (const s of S) {
    g.save();
    p.path(s.pts, true);
    g.globalAlpha = s.alpha ?? 1;
    g.fillStyle = c.col;
    g.fill();
    g.globalAlpha = 1;
    g.clip();
    const [gx, gy] = p.P(cx + Math.cos(c.light) * 0.45 * R, hc + Math.sin(c.light) * 0.45 * R);
    const gr = g.createRadialGradient(gx, gy, 0, gx, gy, 1.25 * R);
    gr.addColorStop(0, "rgba(36,23,38,0)");
    gr.addColorStop(0.84, "rgba(36,23,38,0)");
    gr.addColorStop(1, "rgba(36,23,38,0.3)");
    g.fillStyle = gr;
    g.fillRect(cx - 5 * R, hc - 5 * R, 10 * R, 10 * R);
    g.restore();
  }
  for (const t of ticks) {
    if (c.hat && t.pts.every(q => q[1] < yH)) continue;
    if (t.col) p.stroke(t.pts, (t.w ?? 1.3 * u) + 1.6 * ow, INK);
    p.stroke(t.pts, t.w ?? 1.3 * u, t.col ?? INK);
  }
};
export const hairBehind = (c: HairCtx): void => {
  if (c.style === "none") return;
  const b = build(c);
  if (b.behind.length || b.bt.length) paint(c, b.behind, b.bt, b.R);
};
export const hairOver = (c: HairCtx): void => {
  if (c.style === "none") return;
  const b = build(c);
  if (b.over.length || b.ot.length) paint(c, b.over, b.ot, b.R);
};
