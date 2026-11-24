/** eye shapes: dot (default open), small (worried), lid (half-lidded deadpan), slit, happy (^ arc), dash (shut),
 *  squeeze (> <), shock (big white eye), shockHalf (blink of shock), spiral (dizzy), closed (serene arc + lashes),
 *  teary (wet pool + tear), sleepy (heavy lid + dark ring), side (pupil in the corner), up (eyes rolled up) */export type EyeK = "dot" | "small" | "lid" | "slit" | "happy" | "dash" | "squeeze" | "shock" | "shockHalf" | "spiral" | "closed" | "teary" | "sleepy" | "side" | "up" | "wide" | "wideLid" | "bead" | "beadLid";
/** mouth shapes; talk / talkFrown / talkPuff / mutter are open (talking) variants */
export type MouthK = "dash" | "frown" | "smirk" | "smile" | "smileWide" | "grin" | "laugh" | "o" | "O" | "wave" | "teeth" | "lick" | "smirkSide" | "puff" | "talk" | "talkFrown" | "talkPuff" | "mutter" | "cry";
export type Face = {
  eye: [EyeK, EyeK];
  brow: [number, number];
  brow2?: [number, number];
  mouth: MouthK;
  open?: MouthK;
  look?: number;
  cheeks?: number;
  sweat?: boolean;
};
export const FACE = {
  neutral: {
    eye: ["lid", "lid"],
    brow: [0, -1],
    mouth: "dash"
  },
  stern: {
    eye: ["lid", "lid"],
    brow: [7, -4],
    mouth: "frown"
  },
  grin: {
    eye: ["happy", "happy"],
    brow: [-3, -3],
    mouth: "grin"
  },
  laugh: {
    eye: ["squeeze", "squeeze"],
    brow: [-4, -4],
    mouth: "laugh"
  },
  whistle: {
    eye: ["dash", "dash"],
    brow: [-2, -4],
    mouth: "o"
  },
  nervous: {
    eye: ["small", "small"],
    brow: [-3, 2],
    mouth: "wave",
    sweat: true
  },
  nervous2: {
    eye: ["small", "small"],
    brow: [-3, 2],
    mouth: "wave"
  },
  shock: {
    eye: ["shock", "shock"],
    brow: [-7, -6],
    mouth: "O"
  },
  relief: {
    eye: ["happy", "happy"],
    brow: [-2, 1],
    mouth: "smileWide"
  },
  relief_open: {
    eye: ["up", "up"],
    brow: [-6, -3],
    mouth: "grin"
  },
  dazed: {
    eye: ["spiral", "spiral"],
    brow: [-3, 2],
    mouth: "wave"
  },
  pained: {
    eye: ["squeeze", "lid"],
    brow: [-3, 2],
    mouth: "teeth"
  },
  smile: {
    eye: ["dot", "dot"],
    brow: [0, -1],
    mouth: "smirk"
  },
  smile_closed: {
    eye: ["happy", "happy"],
    brow: [0, -1],
    mouth: "smile"
  },
  lick: {
    eye: ["dot", "dot"],
    brow: [0, -1],
    mouth: "lick"
  },
  skeptic: {
    eye: ["slit", "slit"],
    brow: [-7, -11],
    brow2: [4, 2],
    mouth: "smirk"
  },
  smug: {
    eye: ["lid", "lid"],
    brow: [-3, -7],
    brow2: [3, 0],
    mouth: "smirkSide",
    open: "grin"
  },
  menace: {
    eye: ["slit", "slit"],
    brow: [7, -5],
    mouth: "teeth"
  },
  gulp: {
    eye: ["small", "small"],
    brow: [-4, 3],
    mouth: "wave",
    sweat: true
  },
  angry: {
    eye: ["dot", "dot"],
    brow: [7, -4],
    mouth: "frown"
  },
  deadpan: {
    eye: ["slit", "slit"],
    brow: [0, 0],
    mouth: "dash"
  },
  asleep: {
    eye: ["dash", "dash"],
    brow: [1, -1],
    mouth: "smile"
  },
  oneEye: {
    eye: ["dash", "dot"],
    brow: [0, -4],
    mouth: "dash"
  },
  sick: {
    eye: ["spiral", "squeeze"],
    brow: [-3, 3],
    mouth: "wave"
  },
  sarcastic: {
    eye: ["lid", "lid"],
    brow: [-4, -7],
    brow2: [5, 1],
    mouth: "smirkSide",
    open: "smirkSide"
  },
  suppressLaugh: {
    eye: ["squeeze", "squeeze"],
    brow: [-3, -4],
    mouth: "puff",
    open: "talkPuff",
    cheeks: 1
  },
  puffShock: {
    eye: ["shock", "shock"],
    brow: [-7, -6],
    mouth: "puff",
    open: "talkPuff",
    cheeks: 1.4
  },
  swallow: {
    eye: ["squeeze", "squeeze"],
    brow: [-3, 2],
    mouth: "dash"
  },
  yawn: {
    eye: ["closed", "closed"],
    brow: [-1, 3],
    mouth: "O"
  },
  awake: {
    eye: ["shock", "shock"],
    brow: [-6, -3],
    mouth: "wave"
  },
  sleepy: {
    eye: ["sleepy", "sleepy"],
    brow: [3, 2],
    mouth: "dash"
  },
  eyesClosedMutter: {
    eye: ["closed", "closed"],
    brow: [1, -1],
    mouth: "dash",
    open: "mutter"
  },
  wink: {
    eye: ["dot", "happy"],
    brow: [-1, -5],
    brow2: [0, -3],
    mouth: "smirk"
  },
  proud: {
    eye: ["dot", "dot"],
    brow: [-4, -6],
    mouth: "smileWide"
  },
  teary: {
    eye: ["teary", "teary"],
    brow: [-6, 3],
    mouth: "cry"
  },
  worried: {
    eye: ["dot", "dot"],
    brow: [-8, 2],
    mouth: "frown",
    open: "talkFrown"
  },
  puzzled: {
    eye: ["dot", "dot"],
    brow: [-4, -8],
    brow2: [3, 0],
    mouth: "wave",
    open: "mutter"
  },
  plead: {
    eye: ["teary", "teary"],
    brow: [-8, 3],
    mouth: "wave",
    open: "mutter"
  },
  smirk: {
    eye: ["lid", "lid"],
    brow: [0, -5],
    brow2: [3, 1],
    mouth: "smirkSide",
    open: "smirkSide"
  },
  suspicious: {
    eye: ["side", "side"],
    brow: [5, -1],
    brow2: [-3, -5],
    mouth: "dash",
    look: 1.8
  }
} satisfies Record<string, Face>;
export type Expr = keyof typeof FACE;
/** every expression, in registry order (the lineup's expression matrix shows 12 of them) */

export const EXPRS = Object.keys(FACE) as Expr[];
export const faceOf = (e: Expr): Face => FACE[e] as Face;
/** default open (talking) variant of a closed mouth */

export const openOf = (m: MouthK): MouthK => m === "dash" || m === "teeth" ? "talk" : m === "frown" || m === "cry" ? "talkFrown" : m === "smirk" || m === "smile" || m === "smileWide" ? "grin" : m === "grin" ? "laugh" : m === "o" ? "O" : m === "puff" ? "talkPuff" : m;
/** the talking mouth of a face; never the same shape as the closed one, so a talking face always moves */

export const talkMouth = (F: Face): MouthK => {
  const o = F.open ?? openOf(F.mouth);
  return o === F.mouth ? "talk" : o;
};
/** blink half-way state of an eye kind */

export const halfLid = (k: EyeK): EyeK => k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k === "wide" ? "wideLid" : k === "bead" ? "beadLid" : k;
const NO_BLINK: ReadonlySet<EyeK> = new Set<EyeK>(["happy", "up", "squeeze", "spiral", "closed", "sleepy", "teary"]);
/** the eye kind to draw at blink amount lid (0 open .. 1 shut) */

export const eyeKind = (k: EyeK, lid: number): EyeK => lid >= 1 && !NO_BLINK.has(k) ? "dash" : lid > 0 ? halfLid(k) : k;
export const lidOf = (b: boolean | number | undefined) => b === true ? 1 : Number(b) || 0;
/** expressions whose eyes are shut: blinks are skipped */

export const eyesShut = (e: Expr) => {
  const k = faceOf(e).eye;
  return k[0] === "dash" && k[1] === "dash" || k[0] === "closed";
};
/** parametric mouth: w half-width and open height in face units, curve +1 smile .. -1 frown, skew +1 = right corner up,
 *  teeth / tongue 0..1, round 0..1 pulls it into an O, wob = wavy closed line (nervous) */

export type MouthP = {
  w: number;
  open: number;
  curve: number;
  skew?: number;
  teeth?: number;
  tongue?: number;
  round?: number;
  wob?: number;
};
/** cartoon marks (emanata, never letters), each 0..1 */

export type Marks = {
  vein?: number;
  steam?: number;
  lines?: number;
  tears?: number;
  sweat?: number;
  sparkle?: number;
};
export type FaceFx = {
  eye?: [EyeK, EyeK];
  eyeK?: number;
  brow?: [number, number];
  brow2?: [number, number];
  browUp?: number;
  mouth?: MouthP;
  cheeks?: number;
  headSt?: number;
  marks?: Marks;
  t?: number;
};
