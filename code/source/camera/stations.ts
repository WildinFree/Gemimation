import { V3, glide, lerp, lerp3 } from "../util";
import type { Shot } from "./rig";
import { pushK } from "./rig";
export type Station = {
  f: number;
  pos: V3;
  look: V3;
  fov?: number;
  lead?: number;
  hold?: number;
  travel?: number;
  via?: V3[];
  roll?: number;
  creep?: number;
  drift?: V3;
  driftLook?: number;
  land?: number;
};
type Rest = {
  a: number;
  hold: number;
  pos: V3;
  look: V3;
  fov: number;
  creep: number;
  drift: V3;
  dl: number;
};
type Knot = {
  at: number;
  look: V3;
  fov: number;
};
type Travel = {
  d: number;
  a: number;
  pts: V3[];
  cum: number[];
  knots: {
    frac: number;
    look: V3;
    fov: number;
  }[];
  roll: number;
};
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const crSeg = (p0: V3, p1: V3, p2: V3, p3: V3, t: number): V3 => {
  const kn = (a: V3, b: V3) => Math.max(1e-4, Math.sqrt(dist(a, b)));
  const t0 = 0,
    t1 = t0 + kn(p0, p1),
    t2 = t1 + kn(p1, p2),
    t3 = t2 + kn(p2, p3),
    tt = lerp(t1, t2, t);
  const L = (a: V3, b: V3, ta: number, tb: number, x: number) => lerp3(a, b, (x - ta) / (tb - ta));
  const a1 = L(p0, p1, t0, t1, tt),
    a2 = L(p1, p2, t1, t2, tt),
    a3 = L(p2, p3, t2, t3, tt);
  const b1 = L(a1, a2, t0, t2, tt),
    b2 = L(a2, a3, t1, t3, tt);
  return L(b1, b2, t1, t2, tt);
};
const build = (list: Station[]) => {
  const S = [...list].sort((x, y) => x.f - y.f);
  let nRest = 0;
  const info = S.map(s => ({
    s,
    a: s.f - (s.lead ?? 5),
    hold: s.hold ?? 21
  }));
  const isRest = info.map((x, i) => i === 0 || i === info.length - 1 || x.hold > 0);
  const rests: Rest[] = [],
    travels: Travel[] = [];
  let pend: typeof info = [];
  info.forEach((x, i) => {
    if (!isRest[i]) {
      pend.push(x);
      return;
    }
    const s = x.s;
    const r0: Rest = {
      a: x.a,
      hold: x.hold > 0 ? x.hold : 21,
      pos: s.pos,
      look: s.look,
      fov: s.fov ?? 40,
      creep: s.creep ?? 0.0015,
      drift: s.drift ?? defaultDrift(s.pos, s.look, nRest++),
      dl: s.driftLook ?? DRIFT_LOOK
    };
    rests.push(s.land === undefined ? r0 : landed(r0, s.land));
    if (rests.length > 1) {
      const prev = rests[rests.length - 2],
        cur = rests[rests.length - 1];
      const free = cur.a - (prev.a + prev.hold);
      const tv = Math.max(1, Math.min(s.travel ?? Math.min(90, free), free)),
        d = cur.a - tv;
      const p0 = restAt(prev, d, 0),
        pts: V3[] = [p0.pos],
        marks: {
          idx: number;
          look: V3;
          fov: number;
        }[] = [];
      for (const pt of pend) {
        for (const v of pt.s.via ?? []) pts.push(v);
        marks.push({
          idx: pts.length,
          look: pt.s.look,
          fov: pt.s.fov ?? 40
        });
        pts.push(pt.s.pos);
      }
      for (const v of s.via ?? []) pts.push(v);
      marks.push({
        idx: pts.length,
        look: cur.look,
        fov: cur.fov
      });
      pts.push(cur.pos);
      pend = [];
      const N = 24,
        dense: V3[] = [],
        idxAt: number[] = [];
      const P = [lerp3(pts[0], pts[1], -1), ...pts, lerp3(pts[pts.length - 1], pts[pts.length - 2], -1)];
      for (let j = 0; j < pts.length - 1; j++) {
        idxAt[j] = dense.length;
        for (let k = 0; k < N; k++) dense.push(crSeg(P[j], P[j + 1], P[j + 2], P[j + 3], k / N));
      }
      idxAt[pts.length - 1] = dense.length;
      dense.push(pts[pts.length - 1]);
      const cum = [0];
      for (let k = 1; k < dense.length; k++) cum.push(cum[k - 1] + dist(dense[k], dense[k - 1]));
      const tot = cum[cum.length - 1] || 1;
      const knots = [{
        frac: 0,
        look: prev.look,
        fov: prev.fov
      }, ...marks.map(m => ({
        frac: cum[idxAt[m.idx]] / tot,
        look: m.look,
        fov: m.fov
      }))];
      travels.push({
        d,
        a: cur.a,
        pts: dense,
        cum,
        knots,
        roll: s.roll ?? 0
      });
    }
  });
  return {
    rests,
    travels
  };
};
/** the default rest drift: horizontal, perpendicular to the view, DRIFT_ARC rad/s times the distance to the look point */

export const DRIFT_ARC = 1.3 * Math.PI / 180;
/** default share of the rest drift the look point follows: the subject slides slowly in frame, so the rest reads as moving */

export const DRIFT_LOOK = 0.75;
const defaultDrift = (pos: V3, look: V3, i: number): V3 => {
  const vx = look[0] - pos[0],
    vz = look[2] - pos[2],
    h = Math.hypot(vx, vz);
  if (h < 1e-6) return [0, 0, 0];
  const sp = DRIFT_ARC * dist(pos, look) * (i % 2 ? -1 : 1);
  return [-vz / h * sp, 0, vx / h * sp];
};
const driftT = (t: number) => (t <= 0 ? 0 : t < 6 ? t * t / 12 : t - 3) / 30;
const landed = (r: Rest, e: number): Rest => {
  const dr = driftT(e - r.a),
    k = pushK(e, r.a, r.creep);
  const look: V3 = [r.look[0] - r.drift[0] * r.dl * dr, r.look[1] - r.drift[1] * r.dl * dr, r.look[2] - r.drift[2] * r.dl * dr];
  const pos: V3 = [0, 1, 2].map(i => look[i] + (r.pos[i] - r.drift[i] * dr - look[i]) / k) as V3;
  return {
    ...r,
    pos,
    look
  };
};
const restAt = (r: Rest, f: number, roll: number): Shot => {
  const k = pushK(f, r.a, r.creep),
    dr = driftT(f - r.a);
  const pos: V3 = [r.look[0] + (r.pos[0] - r.look[0]) * k + r.drift[0] * dr, r.look[1] + (r.pos[1] - r.look[1]) * k + r.drift[1] * dr, r.look[2] + (r.pos[2] - r.look[2]) * k + r.drift[2] * dr];
  const ld = r.dl * dr,
    look: V3 = [r.look[0] + r.drift[0] * ld, r.look[1] + r.drift[1] * ld, r.look[2] + r.drift[2] * ld];
  return {
    pos,
    look,
    fov: r.fov,
    roll
  };
};
export const stations = (list: Station[]) => {
  const {
    rests,
    travels
  } = build(list);
  return (f: number): Shot => {
    let ri = 0;
    for (let i = 0; i < rests.length; i++) if (f >= rests[i].a) ri = i;
    for (let i = 0; i < travels.length; i++) {
      const t = travels[i];
      if (f >= t.d && f < t.a) {
        const e = glide((f - t.d) / (t.a - t.d)),
          tot = t.cum[t.cum.length - 1],
          s = e * tot;
        let lo = 0,
          hi = t.cum.length - 1;
        while (hi - lo > 1) {
          const m = lo + hi >> 1;
          if (t.cum[m] <= s) lo = m;else hi = m;
        }
        const seg = t.cum[hi] - t.cum[lo],
          pos = lerp3(t.pts[lo], t.pts[hi], seg > 0 ? (s - t.cum[lo]) / seg : 0);
        const fr = tot > 0 ? s / tot : e;
        let j = 0;
        while (j < t.knots.length - 2 && fr > t.knots[j + 1].frac) j++;
        const A = t.knots[j],
          B = t.knots[j + 1],
          u = B.frac > A.frac ? Math.min(1, Math.max(0, (fr - A.frac) / (B.frac - A.frac))) : 1;
        return {
          pos,
          look: lerp3(A.look, B.look, u),
          fov: lerp(A.fov, B.fov, u),
          roll: t.roll * Math.sin(Math.PI * e)
        };
      }
    }
    return restAt(rests[ri], f, 0);
  };
};
/** planning checks: rest intervals {a, b} and travel intervals {d, a} in frames (rests per 10 s, longest travel) */

export const stationsInfo = (list: Station[]) => {
  const {
    rests,
    travels
  } = build(list);
  return {
    rests: rests.map((r, i) => ({
      a: r.a,
      b: i < travels.length ? travels[i].d : r.a + r.hold
    })),
    travels: travels.map(t => ({
      d: t.d,
      a: t.a
    }))
  };
};
