import { Pen, bodyFront, bodySide } from "../toon/toon";
import { act, MODES, type Track } from "../anim/face";
import { gaitOf } from "../anim/face";
import type { LabChar } from "../types";
export function drawCharacter(ctx: CanvasRenderingContext2D, c: LabChar, o: {
  x: number;
  groundY: number;
  pixelsPerUnit?: number;
  frame?: number;
  view?: "front" | "left" | "right" | "side" | "back";
  expression?: string;
  track?: Track;
  phase?: number;
  mode?: string;
  silhouette?: boolean;
}) {
  if (o.silhouette) {
    const cv = document.createElement("canvas");
    cv.width = ctx.canvas.width;
    cv.height = ctx.canvas.height;
    const cg = cv.getContext("2d")!;
    drawCharacter(cg, c, {
      ...o,
      silhouette: false
    });
    cg.globalCompositeOperation = "source-in";
    cg.fillStyle = "#241726";
    cg.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(cv, 0, 0);
    return;
  }
  const f = o.frame ?? 48;
  const facing = o.view === "left" ? -1 : o.view === "right" ? 1 : 0;
  const track: Track = o.track ?? {
    c,
    x: 0,
    facing,
    face: [{
      f: -1000,
      pose: o.expression ?? "neutral"
    }]
  };
  const acted = act(track, f, 120, MODES[o.mode ?? "wild"] ?? MODES.wild);
  const scale = (o.pixelsPerUnit ?? 0.5) * (c.scale ?? 1);
  ctx.save();
  ctx.translate(o.x, o.groundY);
  const stretch = Math.max(0.01, acted.stretch);
  ctx.scale(scale / Math.sqrt(stretch), scale * Math.sqrt(stretch));
  ctx.translate(-300, -975);
  if (o.view === "side") {
    bodySide(new Pen(ctx), c.o, {
      mode: "stand",
      seed: c.seed ?? 1,
      expr: acted.sideExpr,
      talk: acted.sideTalk,
      gait: gaitOf(c),
      phase: o.phase ?? 0
    });
  } else {
    bodyFront(new Pen(ctx), c.o, {
      ...acted.opts,
      seed: c.seed ?? 1,
      back: o.view === "back"
    });
  }
  ctx.restore();
}
