export type HeadShape = "bean" | "round" | "egg" | "pear" | "square" | "long" | "wedge" | "bulb" | "bell";
export type BodyShape = "bean" | "pear" | "wedge" | "barrel" | "stick" | "box" | "bell";
export type RestEye = "lid" | "dot" | "wide" | "bead" | "sleepy";
export type Nose = "none" | "tick" | "button" | "long" | "hook" | "bulb" | "snub";
export type Ears = "none" | "small" | "big";
export type Glasses = "round" | "square" | "cat" | "half" | "shades";
export type BrowStyle = "taper" | "block" | "bushy" | "thin" | "uni";
export type HairStyle = "none" | "bald" | "horseshoe" | "buzz" | "sidepart" | "combover" | "quiff" | "spiky" | "mohawk" | "afro" | "puffs" | "bun" | "ponytail" | "bob" | "long" | "curly" | "sleek" | "flattop";
export type Posture = "upright" | "hunch" | "proud" | "slouch";
/** story role: drives the clothing palette (never skin or hair) */
export type Tone = "neutral" | "hero" | "prestige" | "evil" | "poor" | "sad";
/** front-of-torso detail (replaces the default button row) */
export type Top = "buttons" | "plain" | "stripes" | "tie" | "vneck" | "zip" | "collar" | "hoodie" | "overalls";
export type Dna = {
  styl?: number;
  head?: HeadShape;
  headK?: number;
  torsoK?: number;
  legK?: number;
  widthK?: number;
  body?: BodyShape;
  posture?: Posture;
  eye?: RestEye;
  eyeK?: number;
  eyeGap?: number;
  brow?: BrowStyle;
  browK?: number;
  nose?: Nose;
  ears?: Ears;
  glasses?: Glasses;
  glassCol?: string;
  hair?: HairStyle;
  age?: number;
  freckles?: boolean;
  mole?: boolean;
  top?: Top;
  topCol?: string;
  tone?: Tone;
  worn?: boolean;
};
type ShapeP = {
  hw: number;
  nTop: number;
  nBot: number;
  egg: number;
  aK: number;
};
/** head presets: H/W, crown and jaw exponents, egg taper (neg = narrow chin), width multiplier */
export const HEAD: Record<HeadShape, ShapeP> = {
  bean: {
    hw: 0.94,
    nTop: 1.75,
    nBot: 2.3,
    egg: -0.12,
    aK: 1
  },
  round: {
    hw: 0.98,
    nTop: 2.0,
    nBot: 2.0,
    egg: 0,
    aK: 1.04
  },
  egg: {
    hw: 1.16,
    nTop: 2.05,
    nBot: 1.85,
    egg: -0.2,
    aK: 0.92
  },
  pear: {
    hw: 0.98,
    nTop: 1.7,
    nBot: 2.7,
    egg: 0.24,
    aK: 1.04
  },
  square: {
    hw: 0.96,
    nTop: 2.7,
    nBot: 3.6,
    egg: 0.04,
    aK: 1.0
  },
  long: {
    hw: 1.38,
    nTop: 2.2,
    nBot: 2.5,
    egg: -0.06,
    aK: 0.86
  },
  wedge: {
    hw: 1.1,
    nTop: 2.4,
    nBot: 1.55,
    egg: -0.34,
    aK: 0.98
  },
  bulb: {
    hw: 0.76,
    nTop: 2.3,
    nBot: 2.4,
    egg: 0.02,
    aK: 1.16
  },
  bell: {
    hw: 1.0,
    nTop: 1.6,
    nBot: 3.2,
    egg: 0.32,
    aK: 1.0
  }
};
type BodyP = {
  nTop: number;
  nBot: number;
  egg: number;
  twK: number;
};
export const BODY: Record<BodyShape, BodyP> = {
  bean: {
    nTop: 2.2,
    nBot: 2.6,
    egg: 0.12,
    twK: 1
  },
  pear: {
    nTop: 1.9,
    nBot: 2.6,
    egg: 0.38,
    twK: 1.12
  },
  wedge: {
    nTop: 3.4,
    nBot: 3.2,
    egg: -0.26,
    twK: 1.3
  },
  barrel: {
    nTop: 2.0,
    nBot: 2.1,
    egg: 0.06,
    twK: 1.42
  },
  stick: {
    nTop: 2.4,
    nBot: 2.4,
    egg: 0.0,
    twK: 0.6
  },
  box: {
    nTop: 3.4,
    nBot: 3.6,
    egg: 0.04,
    twK: 1.12
  },
  bell: {
    nTop: 1.8,
    nBot: 3.4,
    egg: 0.5,
    twK: 1.15
  }
};
const L = (a: number, b: number, t: number) => a + (b - a) * t;
/** Global look knobs. LOOK_DEFAULT is the house look settled by the character lab A/B picks; setLook() is only for A/B test pages. */

export type Look = {
  ink: number;
  limb: number;
  eye: number;
  head: number;
  legs: number;
  shade: number;
  blush: number;
  nose: number;
  styl?: number;
  sat: number;
  tone: number;
  bright: number;
  evil: "muted" | "rich";
  sad: "cool" | "grey";
  worn: number;
};
export const LOOK_DEFAULT: Look = {
  ink: 1,
  limb: 1,
  eye: 1.15,
  head: 1.07,
  legs: 1,
  shade: 1,
  blush: 0,
  nose: 1,
  sat: 1.15,
  tone: 1,
  bright: 1,
  evil: "rich",
  sad: "cool",
  worn: 1
};
export const LOOK: Look = {
  ...LOOK_DEFAULT
};
export const setLook = (l: Partial<Look> = {}) => {
  Object.assign(LOOK, LOOK_DEFAULT, {
    styl: undefined
  }, l);
};
export const stylOf = (d?: Dna) => d?.styl ?? LOOK.styl ?? 1;
/** a multiplier pushed by styl: 1 at styl 0, k at styl 1 */

export const pushK = (d: Dna | undefined, k: number | undefined) => k === undefined ? 1 : L(1, k, stylOf(d));
export const headParams = (d?: Dna): ShapeP => {
  const t = stylOf(d),
    a = HEAD.bean,
    b = HEAD[d?.head ?? "bean"];
  return {
    hw: L(a.hw, b.hw, t),
    nTop: Math.max(1.3, L(a.nTop, b.nTop, t)),
    nBot: Math.max(1.3, L(a.nBot, b.nBot, t)),
    egg: L(a.egg, b.egg, t),
    aK: L(1, b.aK, t)
  };
};
export const bodyParams = (d?: Dna): BodyP => {
  const t = stylOf(d),
    a = BODY.bean,
    b = BODY[d?.body ?? "bean"];
  return {
    nTop: Math.max(1.4, L(a.nTop, b.nTop, t)),
    nBot: Math.max(1.4, L(a.nBot, b.nBot, t)),
    egg: L(a.egg, b.egg, t),
    twK: L(1, b.twK, t)
  };
};
/** posture: [torso lean deg (toward facing), head drop in HH, head forward in HH (side view)] */

export const postureOf = (d?: Dna): [number, number, number] => {
  const t = stylOf(d);
  switch (d?.posture) {
    case "hunch":
      return [14 * t, 0.16 * t, 0.22 * t];
    case "proud":
      return [-6 * t, -0.04 * t, -0.04 * t];
    case "slouch":
      return [6 * t, 0.1 * t, 0.1 * t];
    default:
      return [0, 0, 0];
  }
};
const hx = (c: string) => {
  const n = parseInt(c.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
};
const toHex = (r: number, g: number, b: number) => "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
/** sat: saturation multiplier, val: value multiplier, tint: colour mixed in by amt (keeps the value, shifts the hue) */

export const grade = (c: string, sat: number, val: number, tint?: string, amt = 0) => {
  if (!/^#[0-9a-f]{6}$/i.test(c)) return c;
  let [r, g, b] = hx(c);
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  r = (l + (r - l) * sat) * val;
  g = (l + (g - l) * sat) * val;
  b = (l + (b - l) * sat) * val;
  if (tint && amt) {
    const [tr, tg, tb] = hx(tint),
      l2 = 0.3 * r + 0.59 * g + 0.11 * b,
      lt = 0.3 * tr + 0.59 * tg + 0.11 * tb,
      k = lt ? l2 / lt : 1;
    r += (tr * k - r) * amt;
    g += (tg * k - g) * amt;
    b += (tb * k - b) * amt;
  }
  return toHex(r, g, b);
};
type Grade = {
  sat: number;
  val: number;
  tint?: string;
  amt?: number;
};
export const TONES: Record<string, Grade> = {
  neutral: {
    sat: 1,
    val: 1
  },
  hero: {
    sat: 1.25,
    val: 1.06
  },
  prestige: {
    sat: 1.2,
    val: 1.03,
    tint: "#f0c24a",
    amt: 0.08
  },
  evil_muted: {
    sat: 0.55,
    val: 0.74,
    tint: "#3b2c52",
    amt: 0.3
  },
  evil_rich: {
    sat: 1.2,
    val: 0.66,
    tint: "#4a1f62",
    amt: 0.25
  },
  poor: {
    sat: 0.5,
    val: 0.86,
    tint: "#8f7856",
    amt: 0.4
  },
  sad_cool: {
    sat: 0.5,
    val: 0.96,
    tint: "#6a8cc0",
    amt: 0.55
  },
  sad_grey: {
    sat: 0.15,
    val: 0.94,
    tint: "#8c8782",
    amt: 0.5
  }
};
const CLOTH = ["jacket", "pants", "boots", "hat", "cap", "dress", "sash", "apron", "cape", "belt", "patka", "brocade"];
/** a copy of the outfit with cloth colours graded by LOOK.sat and the role tone (DNA characters only) */

export const toneOutfit = <T extends {
  dna?: Dna;
},>(o: T): T => {
  const d = o.dna;
  if (!d) return o;
  const t = LOOK.tone,
    key = d.tone === "evil" ? "evil_" + LOOK.evil : d.tone === "sad" ? "sad_" + LOOK.sad : d.tone ?? "neutral";
  let g = TONES[key] ?? TONES.neutral;
  if ((d.tone === "hero" || d.tone === "prestige") && !LOOK.bright) g = TONES.neutral;
  const sat = LOOK.sat * L(1, g.sat, t),
    val = L(1, g.val, t),
    amt = (g.amt ?? 0) * t;
  if (sat === 1 && val === 1 && !amt) return o;
  const out = {
    ...o
  } as Record<string, unknown>;
  for (const k of CLOTH) if (typeof out[k] === "string" && !(d.tone === "evil" && k === "belt")) out[k] = grade(out[k] as string, sat, val, g.tint, amt);
  if (d.topCol && d.tone !== "evil") out.dna = {
    ...d,
    topCol: grade(d.topCol, sat, val, g.tint, amt)
  };
  return out as T;
};
