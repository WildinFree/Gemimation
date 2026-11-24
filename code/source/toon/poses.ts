import type { EyeK, Expr, MouthP, Marks } from "./expressions";
export type ExPose = {
  eye: [EyeK, EyeK];
  eyeK: number;
  brow: [number, number];
  brow2?: [number, number];
  browUp: number;
  mouth: MouthP;
  cheeks?: number;
  head: number;
  tilt: number;
  look: number;
  body: number;
  marks?: Marks;
  house: Expr;
  jaw?: number;
};
const M = (w: number, open: number, curve: number, x: Partial<MouthP> = {}): MouthP => ({
  w,
  open,
  curve,
  ...x
});
const P = (house: Expr, eye: [EyeK, EyeK], o: Partial<ExPose>): ExPose => ({
  eye,
  eyeK: 1,
  brow: [0, -1],
  browUp: 0,
  mouth: M(5.5, 0, 0),
  head: 1,
  tilt: 0,
  look: 0,
  body: 1,
  house,
  ...o
});
export const NEUTRAL = P("neutral", ["lid", "lid"], {});
export const POSES: Record<string, ExPose> = {
  neutral: NEUTRAL,
  listen: P("neutral", ["lid", "lid"], {
    brow: [-1, -2],
    mouth: M(5, 0, 0.2),
    tilt: 3
  }),
  grin: P("grin", ["happy", "happy"], {
    brow: [-3, -4],
    browUp: 2,
    mouth: M(12.5, 10, 1, {
      teeth: 1
    }),
    head: 1.04,
    body: 1.02
  }),
  laugh: P("laugh", ["squeeze", "squeeze"], {
    brow: [-4, -4],
    browUp: 3,
    mouth: M(15, 16, 1, {
      teeth: 1,
      tongue: 0.8
    }),
    head: 1.06,
    tilt: -6,
    jaw: 1.2
  }),
  smug: P("smug", ["lid", "lid"], {
    brow: [-3, -7],
    brow2: [3, 0],
    mouth: M(8, 0, 0.7, {
      skew: 0.9
    }),
    tilt: 5,
    marks: {
      sparkle: 0.7
    }
  }),
  shock: P("shock", ["shock", "shock"], {
    eyeK: 1.25,
    brow: [-8, -7],
    browUp: 5,
    mouth: M(9, 20, -0.2, {
      round: 0.6
    }),
    head: 1.14,
    body: 1.06,
    marks: {
      lines: 1
    }
  }),
  jawDrop: P("shock", ["dot", "dot"], {
    eyeK: 0.8,
    brow: [-6, -5],
    browUp: 4,
    mouth: M(10, 34, -0.5, {
      round: 0.25,
      tongue: 0.6
    }),
    head: 1.18,
    body: 0.98
  }),
  angry: P("angry", ["dot", "dot"], {
    eyeK: 1.05,
    brow: [9, -6],
    browUp: -2,
    mouth: M(9, 0, -0.8),
    head: 0.96,
    body: 0.98,
    marks: {
      vein: 0.6
    },
    jaw: 1.2
  }),
  shout: P("angry", ["dot", "dot"], {
    eyeK: 1.1,
    brow: [10, -7],
    mouth: M(13, 15, -0.9, {
      teeth: 1
    }),
    head: 1.05,
    marks: {
      vein: 1
    },
    jaw: 1.4
  }),
  fuming: P("menace", ["slit", "slit"], {
    brow: [10, -6],
    mouth: M(11, 3.5, -0.6, {
      teeth: 1
    }),
    head: 0.94,
    body: 0.97,
    marks: {
      vein: 1,
      steam: 1
    }
  }),
  eyeRoll: P("skeptic", ["up", "up"], {
    brow: [-5, -7],
    browUp: 3,
    mouth: M(7, 0, -0.3, {
      skew: -0.6
    }),
    tilt: -7,
    head: 1.02
  }),
  scoff: P("sarcastic", ["lid", "lid"], {
    brow: [-2, -6],
    brow2: [4, 1],
    mouth: M(6, 0, -0.2, {
      skew: 0.8
    }),
    cheeks: 0.6,
    tilt: 8,
    head: 0.98
  }),
  worried: P("worried", ["dot", "dot"], {
    eyeK: 0.9,
    brow: [-9, 3],
    browUp: 2,
    mouth: M(7, 0, -0.5, {
      wob: 1
    }),
    head: 0.97,
    marks: {
      sweat: 0.8
    },
    jaw: 0.7
  }),
  panic: P("awake", ["shock", "shock"], {
    eyeK: 1.1,
    brow: [-9, 4],
    browUp: 4,
    mouth: M(12, 8, -0.7, {
      wob: 0.6,
      teeth: 1
    }),
    head: 1.06,
    marks: {
      sweat: 1,
      lines: 0.5
    }
  }),
  cringe: P("pained", ["squeeze", "squeeze"], {
    brow: [-4, 4],
    mouth: M(15, 6, -0.5, {
      teeth: 1
    }),
    head: 0.88,
    body: 0.95,
    tilt: -5
  }),
  wail: P("teary", ["squeeze", "squeeze"], {
    brow: [-8, 4],
    browUp: 3,
    mouth: M(14, 18, -1, {
      tongue: 0.6
    }),
    head: 1.08,
    marks: {
      tears: 1
    },
    jaw: 1.3
  }),
  sheepish: P("nervous", ["side", "side"], {
    brow: [-5, 1],
    mouth: M(8, 0, 0.5, {
      wob: 0.6
    }),
    tilt: 6,
    look: 1.5,
    marks: {
      sweat: 0.7
    }
  }),
  suspicious: P("suspicious", ["side", "side"], {
    brow: [5, -1],
    brow2: [-3, -5],
    mouth: M(5, 0, -0.1, {
      skew: -0.4
    }),
    look: 1.8,
    head: 0.97
  }),
  evilGrin: P("menace", ["slit", "slit"], {
    brow: [8, -6],
    mouth: M(16, 9, 1.1, {
      teeth: 1
    }),
    head: 1.03,
    tilt: 4
  }),
  pout: P("worried", ["dot", "dot"], {
    brow: [-5, 2],
    mouth: M(4, 0, -0.8),
    cheeks: 1,
    head: 0.97
  }),
  excited: P("grin", ["dot", "dot"], {
    eyeK: 1.2,
    brow: [-7, -8],
    browUp: 4,
    mouth: M(13, 13, 1, {
      teeth: 0.8,
      tongue: 0.5
    }),
    head: 1.08,
    body: 1.04,
    marks: {
      sparkle: 0.6
    }
  }),
  deadpan: P("deadpan", ["slit", "slit"], {
    brow: [0, 0],
    mouth: M(6, 0, 0)
  }),
  conspire: P("smirk", ["lid", "lid"], {
    brow: [4, -3],
    brow2: [-2, -5],
    mouth: M(8, 0, 0.6, {
      skew: 0.6
    }),
    tilt: 8,
    head: 0.97,
    look: 1
  })
};
export type PoseName = keyof typeof POSES;
/** the expressions offered in the keep / maybe / drop gallery, in display order */

export const GALLERY: PoseName[] = ["grin", "laugh", "excited", "smug", "conspire", "evilGrin", "shock", "jawDrop", "panic", "worried", "sheepish", "cringe", "wail", "pout", "angry", "fuming", "eyeRoll", "scoff", "suspicious", "deadpan"];
/** mouth shapes for syllables (open, width, roundness, teeth, tongue); curve comes from the expression */

export const VIS: Record<string, Partial<MouthP>> = {
  m: {
    open: 0
  },
  a: {
    open: 11,
    w: 10,
    teeth: 0.6,
    tongue: 0.6
  },
  e: {
    open: 5.5,
    w: 12,
    teeth: 1
  },
  o: {
    open: 11,
    w: 7,
    round: 0.85
  },
  u: {
    open: 4.5,
    w: 4,
    round: 1
  },
  f: {
    open: 2.6,
    w: 8,
    teeth: 1
  },
  l: {
    open: 5.5,
    w: 8,
    tongue: 1,
    teeth: 0.5
  }
};
