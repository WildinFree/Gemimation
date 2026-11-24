import { Pen, bodyFront, bodySide, LAST, type Outfit, type FrontOpts, type SideOpts } from "../toon/toon";
import type { Expr } from "../toon/expressions";
import { ARM } from "../toon/limbs";
import { setLook } from "../toon/dna";
import { POSES } from "../toon/poses";
import { act, MODES, type Mode } from "../anim/face";
import type { LabChar } from "../types";
type Draw = (p: Pen) => void;
type Cell = {
  label?: string;
  draw: Draw;
  scale?: number;
  bust?: number;
  sil?: boolean;
  free?: boolean;
};
const BG = "#efe8dc",
  LABEL = "#4a3a4a",
  SIL = "#16121a";
const Y0 = -260,
  Y1 = 1000;
export const KEY_EXPR: Expr[] = ["neutral", "grin", "laugh", "shock", "angry", "skeptic", "teary", "nervous", "smug", "menace", "worried", "deadpan"];
const headOf = (o: Outfit, seed: number) => {
  const c = document.createElement("canvas");
  c.width = c.height = 4;
  bodyFront(new Pen(c.getContext("2d")!), o, {
    mode: "stand",
    seed
  });
  return {
    ...LAST
  };
};
const cell = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: Cell, kFull: number, o?: Outfit, seed = 1) => {
  const lh = c.label ? Math.max(18, Math.round(h * 0.045)) : 0,
    ih = h - lh - 4;
  const paint = (ctx: CanvasRenderingContext2D) => {
    if (c.bust && o) {
      const m = headOf(o, seed),
        span = c.bust * m.W,
        k = Math.min(w, ih) / span,
        cy = m.hc + 0.08 * m.HH;
      ctx.translate(w / 2 - 300 * k, ih / 2 - cy * k);
      ctx.scale(k, k);
    } else {
      const s = c.scale ?? 1,
        k = kFull;
      ctx.translate(w / 2 - 300 * k, ih - (Y1 - 975) * k - 975 * k);
      ctx.scale(k, k);
      ctx.translate(300, 975);
      ctx.scale(s, s);
      ctx.translate(-300, -975);
    }
    c.draw(new Pen(ctx));
  };
  if (c.sil) {
    const off = document.createElement("canvas");
    off.width = Math.ceil(w);
    off.height = Math.ceil(ih);
    const o2 = off.getContext("2d")!;
    paint(o2);
    o2.setTransform(1, 0, 0, 1, 0, 0);
    o2.globalCompositeOperation = "source-in";
    o2.fillStyle = SIL;
    o2.fillRect(0, 0, off.width, off.height);
    g.drawImage(off, x, y);
  } else {
    g.save();
    if (!c.free) {
      g.beginPath();
      g.rect(x, y, w, ih);
      g.clip();
    }
    g.translate(x, y);
    paint(g);
    g.restore();
  }
  if (c.label) {
    g.fillStyle = LABEL;
    g.font = `${lh * 0.8}px sans-serif`;
    g.textAlign = "center";
    g.fillText(c.label, x + w / 2, y + h - 6);
    g.textAlign = "left";
  }
};
const title = (g: CanvasRenderingContext2D, W: number, t: string, sub = "") => {
  g.fillStyle = "#2a1f2c";
  g.font = "bold 34px sans-serif";
  g.fillText(t, 24, 46);
  if (sub) {
    g.fillStyle = LABEL;
    g.font = "22px sans-serif";
    g.fillText(sub, 24, 78);
  }
  void W;
};
const front = (c: LabChar, x: Partial<FrontOpts> = {}): Draw => p => bodyFront(p, c.o, {
  mode: "stand",
  seed: c.seed ?? 1,
  ...x
});
const side = (c: LabChar, x: Partial<SideOpts> = {}): Draw => p => bodySide(p, c.o, {
  mode: "stand",
  seed: c.seed ?? 1,
  ...x
});
const action = (c: LabChar): Draw => front(c, c.act ?? {
  limbs: {
    arms: [ARM.hang, ARM.point]
  },
  facing: 1,
  expr: "grin"
});
function clear(canvas: HTMLCanvasElement) {
  const g = canvas.getContext("2d")!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = BG;
  g.fillRect(0, 0, canvas.width, canvas.height);
  return g;
}
function valid(cast: LabChar[]) {
  if (!cast.length) throw new Error("A review sheet needs at least one character");
}
export function drawLineup(canvas: HTMLCanvasElement, setName: string, cast: LabChar[], page = 0) {
  valid(cast);
  if (!Number.isInteger(page) || page < 0 || page > 5) throw new Error("Lineup page must be 0-5");
  const g = clear(canvas),
    W = canvas.width,
    H = canvas.height,
    f = page;
  const n = cast.length,
    top = 96;
  if (f <= 1) {
    title(g, W, `${setName}: lineup ${f === 0 ? "front" : "3/4"}`, "same scale, each figure at its own height");
    const need = Math.max(...cast.map(c => (975 - headOf(c.o, c.seed ?? 1).crown + 110) * (c.scale ?? 1))) + 40;
    const wide = (c: LabChar) => (c.scale ?? 1) * (c.o.dna?.widthK ?? 1) * (["wedge", "barrel", "box", "bell"].includes(c.o.dna?.body ?? "") ? 1.3 : 1) * (c.o.build === "stout" ? 1.25 : 1);
    const ws = cast.map(wide),
      sum = ws.reduce((x, y) => x + y, 0);
    const k = Math.min(W / (sum * 250), (H - top - 40) / need);
    let x0 = 0;
    cast.forEach((c, i) => {
      const cw = W * ws[i] / sum;
      cell(g, x0, top, cw, H - top, {
        label: c.name,
        scale: c.scale,
        free: true,
        draw: front(c, f ? {
          facing: i % 2 ? -1 : 1
        } : {})
      }, k);
      x0 += cw;
    });
  } else if (f === 2) {
    title(g, W, `${setName}: silhouettes`, "front / side / action, solid fill: must read at thumbnail size");
    const rh = (H - top) / 3,
      cw = W / n,
      k = Math.min(cw / 560, (rh - 30) / (Y1 - Y0));
    cast.forEach((c, i) => {
      cell(g, i * cw, top, cw, rh, {
        sil: true,
        scale: c.scale,
        draw: front(c)
      }, k);
      cell(g, i * cw, top + rh, cw, rh, {
        sil: true,
        scale: c.scale,
        draw: side(c)
      }, k);
      cell(g, i * cw, top + 2 * rh, cw, rh, {
        sil: true,
        label: c.name,
        scale: c.scale,
        draw: action(c)
      }, k);
    });
  } else if (f === 3) {
    title(g, W, `${setName}: heads`, "neutral, 3/4 then front, same head-width zoom");
    const cols = Math.ceil(Math.sqrt(2 * n * W / (H - top))),
      rows = Math.ceil(2 * n / cols),
      cw = W / cols,
      ch = (H - top) / rows;
    cast.flatMap(c => [{
      c,
      fc: 1 as const
    }, {
      c,
      fc: 0 as const
    }]).forEach(({
      c,
      fc
    }, i) => cell(g, i % cols * cw, top + Math.floor(i / cols) * ch, cw, ch, {
      label: `${c.name}${fc ? " 3/4" : ""}`,
      bust: 2.1,
      draw: front(c, {
        facing: fc
      })
    }, 1, c.o, c.seed));
  } else {
    const ex = KEY_EXPR.slice((f - 4) * 6, (f - 4) * 6 + 6);
    title(g, W, `${setName}: expressions`, "columns = characters, rows = expressions, 3/4 view");
    const lw = 130,
      cw = (W - lw) / n,
      ch = (H - top) / ex.length;
    ex.forEach((e, r) => {
      g.fillStyle = LABEL;
      g.font = "24px sans-serif";
      g.fillText(e, 12, top + r * ch + ch / 2);
      cast.forEach((c, j) => cell(g, lw + j * cw, top + r * ch, cw, ch, {
        label: r === 0 ? c.name : undefined,
        bust: 1.9,
        draw: front(c, {
          facing: 1,
          expr: e
        })
      }, 1, c.o, c.seed));
    });
  }
}
export function drawCharacterSheet(canvas: HTMLCanvasElement, setName: string, cast: LabChar[], who = 0) {
  valid(cast);
  const g = clear(canvas),
    W = canvas.width,
    H = canvas.height,
    c = cast[who];
  if (!c) throw new Error("Unknown character page");
  title(g, W, `${c.name}`, c.note ?? setName);
  const top = 90,
    rowA = 760,
    cw = W / 5,
    k = Math.min(cw / 560, (rowA - 30) / (Y1 - Y0));
  const views: Cell[] = [{
    label: "front",
    draw: front(c)
  }, {
    label: "3/4 left",
    draw: front(c, {
      facing: -1
    })
  }, {
    label: "3/4 right",
    draw: front(c, {
      facing: 1
    })
  }, {
    label: "side",
    draw: side(c)
  }, {
    label: "back",
    draw: front(c, {
      back: true
    })
  }];
  views.forEach((v, i) => cell(g, i * cw, top, cw, rowA, {
    ...v,
    scale: c.scale
  }, k));
  const yB = top + rowA + 10,
    hB = H - yB,
    ew = 1120,
    ecw = ew / 4,
    ech = hB / 2;
  KEY_EXPR.slice(0, 8).forEach((e, i) => cell(g, i % 4 * ecw, yB + Math.floor(i / 4) * ech, ecw, ech, {
    label: e,
    bust: 2.2,
    draw: front(c, {
      facing: i % 2 ? -1 : 1,
      expr: e
    })
  }, 1, c.o, c.seed));
  const G = c.acting?.gait,
    sc = c.scale ?? 1;
  const hs = G ? Math.round(hB * 0.47) : 0,
    yP = yB + hs,
    hP = hB - hs,
    sw = W - ew;
  const ks = Math.min(sw / 4 / 330, (hs - 34) / 960);
  const strip: Draw = p => [0, 0.25, 0.5, 0.75].forEach((ph, i) => {
    p.g.save();
    p.g.translate((i - 1.5) * (sw / 4 / (ks * sc)), 0);
    side(c, {
      gait: G,
      phase: ph,
      expr: "neutral"
    })(p);
    p.g.restore();
  });
  const poses: Cell[] = [{
    label: "point",
    draw: front(c, {
      facing: 1,
      expr: "smug",
      limbs: {
        arms: [ARM.hang, ARM.point]
      }
    })
  }, {
    label: "cheer",
    draw: front(c, {
      expr: "laugh",
      limbs: {
        arms: [ARM.cheer, ARM.cheer]
      }
    })
  }, {
    label: "shrug",
    draw: front(c, {
      facing: -1,
      expr: "skeptic",
      pose: "shrug",
      k: 1
    })
  }, ...(G ? [] : [{
    label: "walk",
    draw: side(c, {
      mode: "march",
      phase: 0.12,
      expr: "neutral"
    })
  }]), {
    label: "sil front",
    sil: true,
    draw: front(c)
  }, {
    label: "sil side",
    sil: true,
    draw: G ? side(c, {
      gait: G,
      phase: 0.12
    }) : side(c, {
      mode: "march",
      phase: 0.12
    })
  }, {
    label: "sil act",
    sil: true,
    draw: action(c)
  }];
  if (G) cell(g, ew, yB, sw, hs, {
    label: "walk (own gait: phase 0, .25, .5, .75)",
    draw: strip,
    scale: c.scale
  }, ks);
  const pw = sw / poses.length,
    kp = Math.min(pw / 560, (hP - 30) / (Y1 - Y0));
  poses.forEach((pc, i) => cell(g, ew + i * pw, yP, pw, hP, {
    ...pc,
    scale: c.scale
  }, kp));
}
export function drawFaceSheet(canvas: HTMLCanvasElement, cast: LabChar[], page = 0, mode: Mode = MODES.wild, ownOnly = false) {
  valid(cast);
  const g = clear(canvas),
    W = canvas.width,
    H = canvas.height,
    SETTLED = 48;
  setLook({});
  const c = cast[Math.min(page, cast.length - 1)],
    own = Object.keys(c.acting?.poses ?? {}),
    stock = ownOnly ? [] : Object.keys(POSES).filter(n => !own.includes(n)),
    names = [...own, ...stock];
  const top = 96,
    cols = 4,
    rows = Math.ceil(names.length / cols),
    cw = W / cols,
    ch = (H - top) / rows,
    lh = 26;
  g.fillStyle = "#2a1f2c";
  g.font = "bold 34px sans-serif";
  g.fillText(`${c.name ?? "character"}: ${own.length} own + ${stock.length} stock poses`, 24, 46);
  g.fillStyle = LABEL;
  g.font = "22px sans-serif";
  g.fillText(`settled at frame ${SETTLED}, X ${mode.X}`, 24, 80);
  bodyFront(new Pen(document.createElement("canvas").getContext("2d")!), c.o, {
    mode: "stand",
    seed: c.seed ?? 1
  });
  const crown = LAST.crown,
    HH = LAST.HH,
    span = 2.3 * HH,
    k = (ch - lh) / span;
  names.forEach((p, i) => {
    const x = i % cols * cw,
      y = top + Math.floor(i / cols) * ch;
    const a = act({
        c,
        x: 0.5,
        facing: 0,
        face: [{
          f: 0,
          pose: p
        }]
      }, SETTLED, 120, mode),
      st = a.stretch;
    g.save();
    g.beginPath();
    g.rect(x + 2, y + 2, cw - 4, ch - lh - 2);
    g.clip();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.translate(x + cw / 2, y + 0.42 * HH * k);
    g.scale(k / Math.sqrt(st), k * Math.sqrt(st));
    g.translate(-300, -crown);
    bodyFront(new Pen(g), c.o, {
      ...a.opts,
      seed: c.seed ?? 1
    });
    g.restore();
    g.fillStyle = LABEL;
    g.font = "20px sans-serif";
    g.textAlign = "center";
    g.fillText(own.includes(p) ? `${p} *own` : p, x + cw / 2, y + ch - 6);
    g.textAlign = "left";
  });
}
