import type { Outfit } from "../toon/toon";
import type { Dna } from "../toon/dna";
import type { LabChar } from "../types";
import { SKIN7, CAST1 } from "./archetypes";
const C = (name: string, note: string, o: Partial<Outfit> & {
  jacket: string;
}, dna: Dna, scale = 1, seed = 1): LabChar => ({
  name,
  note,
  o: {
    boots: "#4a3426",
    pants: "#3e4452",
    ...o,
    dna
  },
  scale,
  seed
});
/** row 1 = the bright side (hero, strong hero, prestige, child, mother); row 2 = the shadow side (villain, brute, poor, sad) */

export const STORY: LabChar[] = [C("asha", "young hero: egg head, wide eyes, ponytail, bright blue", {
  jacket: "#2a8fd0",
  pants: "#e8e0d0",
  boots: "#8a4a2a",
  skin: SKIN7[4],
  hair: "#24160f"
}, {
  head: "egg",
  eye: "wide",
  nose: "button",
  brow: "thin",
  hair: "ponytail",
  body: "bean",
  torsoK: 0.95,
  legK: 1.06,
  top: "vneck",
  tone: "hero"
}, 1.0, 3), C("bram", "strong hero: square jaw, wedge torso, proud, open eyes, bright red", {
  jacket: "#d8402e",
  pants: "#2e3a52",
  boots: "#3a2a20",
  skin: SKIN7[5],
  hair: "#1a120e",
  build: "stout"
}, {
  head: "square",
  headK: 0.88,
  eye: "dot",
  brow: "block",
  nose: "snub",
  hair: "quiff",
  body: "wedge",
  widthK: 1.05,
  legK: 0.92,
  posture: "proud",
  top: "collar",
  topCol: "#f4f1ea",
  tone: "hero"
}, 1.2, 6), C("queen", "prestige: tall, upright, emerald dress, gold trim and chain", {
  jacket: "#1f8a6a",
  dress: "#1f8a6a",
  pants: "#1f5a4a",
  boots: "#6a4a2a",
  skin: SKIN7[1],
  hair: "#3a2414",
  trim: "#f0c24a",
  chain: true,
  earring: true
}, {
  head: "egg",
  eye: "lid",
  brow: "thin",
  nose: "button",
  hair: "bun",
  body: "bell",
  torsoK: 1.08,
  posture: "proud",
  tone: "prestige"
}, 1.08, 15), C("kiki", "child: round head, puffs, wide eyes, sunshine dress", {
  jacket: "#f2c230",
  dress: "#f0b020",
  pants: "#3a5a9a",
  boots: "#e2453c",
  skin: SKIN7[6],
  hair: "#1a100c",
  build: "kid"
}, {
  head: "round",
  headK: 1.08,
  eye: "wide",
  eyeK: 1.1,
  nose: "snub",
  brow: "taper",
  hair: "puffs",
  tone: "hero"
}, 0.66, 10), C("ma", "mother: round head, curly cloud, pear body, warm cardigan", {
  jacket: "#e0884a",
  pants: "#4a5a6a",
  boots: "#6a4a34",
  skin: SKIN7[2],
  hair: "#4a2a1a"
}, {
  head: "round",
  eye: "dot",
  nose: "button",
  brow: "taper",
  hair: "curly",
  body: "pear",
  widthK: 1.05,
  tone: "neutral"
}, 0.95, 12), C("morva", "villain: wedge head, sleek widow's peak, sleepy eyes, hook nose, tall dress + cape, one red accent", {
  jacket: "#5a2a6a",
  dress: "#5a2a6a",
  pants: "#2a1420",
  boots: "#1e1418",
  skin: SKIN7[0],
  hair: "#141018",
  cape: "#4a2a5a",
  belt: "#c0303a",
  lashes: true
}, {
  head: "wedge",
  eye: "sleepy",
  brow: "thin",
  browK: 1.1,
  nose: "hook",
  hair: "sleek",
  body: "bell",
  widthK: 0.9,
  torsoK: 1.12,
  legK: 1.1,
  top: "collar",
  topCol: "#c0303a",
  tone: "evil"
}, 1.1, 9), C("grul", "henchman: tiny square head, wedge torso, unibrow, bead eyes, flattop", {
  jacket: "#3a6a4a",
  pants: "#2e2e34",
  boots: "#1e1a1a",
  skin: SKIN7[3],
  hair: "#1a120e",
  stubble: true,
  build: "stout"
}, {
  head: "square",
  headK: 0.78,
  eye: "bead",
  eyeK: 1.2,
  brow: "uni",
  browK: 1.3,
  nose: "long",
  hair: "flattop",
  body: "wedge",
  widthK: 1.1,
  legK: 0.85,
  posture: "proud",
  top: "zip",
  tone: "evil"
}, 1.2, 16), C("tomas", "poor: long head, thin stick body, slouch, patched jacket, stubble", {
  jacket: "#7a5a3a",
  pants: "#5a5a4a",
  boots: "#4a3a2a",
  skin: SKIN7[1],
  hair: "#5a4030",
  stubble: true
}, {
  head: "long",
  headK: 0.94,
  eye: "lid",
  brow: "taper",
  nose: "long",
  ears: "big",
  hair: "sidepart",
  body: "bean",
  widthK: 0.92,
  posture: "slouch",
  worn: true,
  tone: "poor"
}, 0.98, 17), C("lila", "sad: bean head, long hair, sleepy eyes, drooping slouch, cool hoodie", {
  jacket: "#6a8ab0",
  pants: "#4a5060",
  boots: "#5a5a64",
  skin: SKIN7[4],
  hair: "#2a1e18"
}, {
  head: "bean",
  eye: "sleepy",
  brow: "taper",
  nose: "button",
  hair: "long",
  body: "bean",
  posture: "slouch",
  top: "hoodie",
  tone: "sad"
}, 0.93, 18)];
const swap = (cast: LabChar[], ch: Record<string, Partial<Dna>>) => cast.map(c => ch[c.name] ? {
  ...c,
  o: {
    ...c.o,
    dna: {
      ...c.o.dna,
      ...ch[c.name]
    }
  }
} : c);
/** same cast, but the villain, henchman and strong hero get soft rounded shapes (shape test) */

export const STORY_SOFT = swap(STORY, {
  morva: {
    head: "round",
    nose: "button",
    eye: "dot",
    brow: "taper",
    body: "bean",
    widthK: 1
  },
  grul: {
    head: "round",
    headK: 0.95,
    eye: "dot",
    brow: "taper",
    nose: "snub",
    body: "barrel",
    widthK: 1
  },
  bram: {
    head: "round",
    headK: 0.95,
    brow: "taper",
    body: "barrel",
    widthK: 1
  }
});
/** same cast, but kids and women get angular (square / long) shapes instead of round ones (rounding test) */

export const STORY_ANGULAR = swap(STORY, {
  asha: {
    head: "long",
    body: "stick"
  },
  queen: {
    head: "long",
    body: "box"
  },
  kiki: {
    head: "square",
    headK: 1
  },
  ma: {
    head: "square",
    body: "box"
  },
  lila: {
    head: "long",
    body: "stick"
  }
});
const role: Record<string, Partial<Dna>> = {
  maya: {
    tone: "hero"
  },
  tank: {
    tone: "hero"
  },
  zuri: {
    tone: "hero"
  },
  boss: {
    tone: "prestige"
  },
  vex: {
    tone: "evil"
  },
  rex: {
    tone: "evil"
  },
  grump: {
    tone: "poor",
    worn: true
  },
  rina: {
    tone: "sad"
  }
};
export const STORY2 = swap(CAST1.filter(c => role[c.name]).sort((a, b) => Object.keys(role).indexOf(a.name) - Object.keys(role).indexOf(b.name)), role);
export const STORY_SETS: Record<string, LabChar[]> = {
  story: STORY,
  soft: STORY_SOFT,
  angular: STORY_ANGULAR,
  story2: STORY2
};
