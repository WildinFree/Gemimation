import type { Outfit } from "../toon/toon";
import type { Dna, HeadShape, BodyShape, RestEye, Nose, HairStyle, Posture } from "../toon/dna";
import { rng } from "../util";
import type { LabChar } from "../types";
/** extended skin ramp: the house four + three deeper tones */
export const SKIN7 = ["#ffe2c2", "#f5c9a0", "#ecd0b6", "#c99067", "#a8714a", "#8a5634", "#6a3e24"];
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
export const CAST1: LabChar[] = [C("maya", "20s, restless optimist: egg head, wide eyes, high ponytail = a forward-leaning exclamation mark", {
  jacket: "#2f9e8f",
  pants: "#e8b23a",
  boots: "#f4f1ea",
  skin: SKIN7[4],
  hair: "#2a1a14",
  lashes: true,
  earring: true
}, {
  head: "egg",
  eye: "wide",
  eyeK: 1.05,
  nose: "button",
  brow: "thin",
  hair: "ponytail",
  body: "bean",
  torsoK: 0.95,
  legK: 1.08,
  top: "stripes",
  topCol: "#f4f1ea"
}, 1.0, 3), C("nani", "70s, tiny sharp grandmother: pear head + pear body, bun, round glasses, hunched but quick", {
  jacket: "#9a7ab8",
  dress: "#8a6aa8",
  pants: "#5a4a5a",
  boots: "#6a4a34",
  skin: SKIN7[3],
  hair: "#ece6de",
  bangles: true
}, {
  head: "pear",
  eye: "bead",
  glasses: "round",
  nose: "button",
  brow: "thin",
  hair: "bun",
  body: "pear",
  posture: "hunch",
  age: 2,
  legK: 0.8,
  torsoK: 0.95
}, 0.8, 4), C("grump", "70s, retired clerk who hates everything: long head, horseshoe hair, big ears, hook nose, bushy brows", {
  jacket: "#8a6a4a",
  pants: "#4a4a44",
  boots: "#3a2a20",
  skin: SKIN7[1],
  hair: "#c8c2ba",
  build: "thin"
}, {
  head: "long",
  ears: "big",
  nose: "hook",
  brow: "bushy",
  browK: 1.2,
  hair: "horseshoe",
  eye: "lid",
  posture: "hunch",
  age: 2,
  body: "stick",
  widthK: 1.1,
  top: "vneck"
}, 0.97, 5), C("tank", "30s gym giant, gentle: tiny square head on a huge wedge torso, buzz cut, bead eyes", {
  jacket: "#d24a3a",
  pants: "#2e3440",
  boots: "#2a2a2a",
  skin: SKIN7[5],
  hair: "#1a120e",
  stubble: true,
  build: "stout"
}, {
  head: "square",
  headK: 0.82,
  eye: "bead",
  eyeK: 1.3,
  brow: "block",
  browK: 1.2,
  nose: "snub",
  hair: "buzz",
  body: "wedge",
  widthK: 1.08,
  legK: 0.85,
  posture: "proud",
  top: "vneck"
}, 1.22, 6), C("pixel", "16, anxious gamer: big bulb head, huge round glasses, bob, thin stick body", {
  jacket: "#4a5ab8",
  pants: "#2e2e3a",
  boots: "#e8e2d6",
  skin: SKIN7[0],
  hair: "#c06a2a",
  build: "slim"
}, {
  head: "bulb",
  headK: 1.14,
  eye: "wide",
  eyeK: 0.9,
  glasses: "round",
  nose: "none",
  brow: "thin",
  hair: "bob",
  body: "stick",
  ears: "small",
  freckles: true,
  posture: "slouch",
  top: "hoodie"
}, 0.9, 7), C("boss", "50s, pompous manager: barrel body, small round head, combover, curled moustache, puffed chest", {
  jacket: "#2a3a5a",
  pants: "#2a3a5a",
  boots: "#1e1a1a",
  skin: SKIN7[2],
  hair: "#3a2a20",
  moustache: "#3a2a20",
  curl: true,
  buttons: "#f0c24a",
  build: "stout"
}, {
  head: "round",
  headK: 0.86,
  eye: "lid",
  eyeK: 0.85,
  nose: "bulb",
  brow: "block",
  hair: "combover",
  body: "barrel",
  widthK: 1.06,
  legK: 0.72,
  posture: "proud",
  mole: true,
  top: "tie"
}, 1.02, 8), C("vex", "30s, smiling schemer: wedge head, sleek widow's peak, sleepy eyes, tall narrow bell dress", {
  jacket: "#5a1e3a",
  dress: "#6a2446",
  pants: "#2a1420",
  boots: "#1e1418",
  skin: SKIN7[2],
  hair: "#141018",
  lashes: true
}, {
  head: "wedge",
  eye: "sleepy",
  brow: "thin",
  nose: "long",
  hair: "sleek",
  body: "bell",
  widthK: 0.9,
  torsoK: 1.1,
  legK: 1.12
}, 1.08, 9), C("zuri", "8, fearless kid: round head, two puffs, wide eyes, deep skin, sunshine dress", {
  jacket: "#f2c230",
  dress: "#f0b020",
  pants: "#3a5a9a",
  boots: "#e2453c",
  skin: SKIN7[6],
  hair: "#1a100c",
  build: "kid"
}, {
  head: "round",
  headK: 1.06,
  eye: "wide",
  eyeK: 1.1,
  nose: "snub",
  brow: "taper",
  hair: "puffs"
}, 0.66, 10), C("rex", "20s punk drummer: long narrow head, magenta mohawk, unibrow, nose ring, slouching stick figure", {
  jacket: "#1e1c24",
  pants: "#3a3446",
  boots: "#6a1e2a",
  skin: SKIN7[1],
  hair: "#e0307a",
  nosering: true,
  build: "thin"
}, {
  head: "long",
  headK: 0.92,
  eye: "lid",
  brow: "uni",
  nose: "tick",
  hair: "mohawk",
  body: "stick",
  posture: "slouch",
  ears: "small",
  top: "zip"
}, 1.05, 11), C("rina", "40s, exhausted mum of four: soft round head, curly cloud hair, sleepy eyes, pear body in a cardigan", {
  jacket: "#d98a5a",
  pants: "#4a5a6a",
  boots: "#6a4a34",
  skin: SKIN7[3],
  hair: "#4a2a1a"
}, {
  head: "round",
  eye: "sleepy",
  eyeK: 1.05,
  nose: "button",
  brow: "taper",
  hair: "curly",
  body: "pear",
  widthK: 1.08,
  posture: "slouch",
  age: 1
}, 0.95, 12), C("sunny", "60s, beach hippie: bell head, grey ponytail + beard, rose shades, bulb nose, loose slouch", {
  jacket: "#e07a3a",
  pants: "#6a8a5a",
  boots: "#a87a4a",
  skin: SKIN7[2],
  hair: "#d8d2ca",
  beard: "#e4ded6",
  moustache: "#d4cec6"
}, {
  head: "bell",
  glasses: "shades",
  glassCol: "#c0506a",
  nose: "bulb",
  brow: "bushy",
  hair: "ponytail",
  body: "bean",
  posture: "slouch",
  age: 1,
  top: "stripes",
  topCol: "#f2c230"
}, 1.0, 13), C("dutt", "40s traffic cop: box body, square head, peaked cap, unibrow, moustache, rigid upright", {
  jacket: "#c8b48a",
  pants: "#6a5a3a",
  boots: "#2a1e16",
  skin: SKIN7[4],
  hair: "#1a120e",
  moustache: "#1a120e",
  hat: "cap",
  cap: "#2a3a6a",
  belt: "#3a2a1a",
  build: "stout"
}, {
  head: "square",
  eye: "bead",
  brow: "uni",
  browK: 1.3,
  nose: "long",
  hair: "buzz",
  body: "box",
  posture: "proud",
  ears: "small",
  top: "collar"
}, 1.06, 14)];
/** stylisation ladder: the same design at styl 0 (house default), 0.5, 1 (as designed), 1.5 (pushed) */

export const STYL: LabChar[] = ["grump", "tank", "vex"].flatMap(n => {
  const c = CAST1.find(x => x.name === n)!;
  return [0, 0.5, 1, 1.5].map(s => ({
    ...c,
    name: `${n} ${s}`,
    o: {
      ...c.o,
      dna: {
        ...c.o.dna,
        styl: s
      }
    }
  }));
});
const byName = (n: string) => CAST1.find(x => x.name === n)!;
export const ALT: LabChar[] = [{
  ...byName("maya"),
  name: "hero A"
}, C("hero B", "hero as the small cute one: big round head, bob, house dot eyes, freckles, stick body", {
  jacket: "#e8644a",
  pants: "#2f5f8a",
  boots: "#f4f1ea",
  skin: SKIN7[1],
  hair: "#7a3a1a"
}, {
  head: "round",
  headK: 1.16,
  eye: "dot",
  nose: "snub",
  hair: "bob",
  body: "stick",
  freckles: true,
  legK: 0.9
}, 0.9, 21), C("hero C", "hero as the cool tall one: long head, curly cloud, lashes, box overalls, long legs", {
  jacket: "#f2c230",
  pants: "#2f6f6a",
  boots: "#2a1e16",
  skin: SKIN7[5],
  hair: "#1a100c",
  lashes: true,
  earring: true
}, {
  head: "long",
  headK: 0.95,
  eye: "lid",
  nose: "button",
  brow: "thin",
  hair: "curly",
  body: "box",
  widthK: 0.9,
  legK: 1.2,
  top: "overalls",
  topCol: "#2f6f6a"
}, 1.06, 22), {
  ...byName("nani"),
  name: "granny A"
}, C("granny B", "severe headmistress granny: long head, sleek bun, half glasses, proud, tall bell dress", {
  jacket: "#3a4a5a",
  dress: "#2e3e4e",
  pants: "#2a2a30",
  boots: "#1e1a1a",
  skin: SKIN7[2],
  hair: "#e4e0da",
  pearls: true
}, {
  head: "long",
  eye: "sleepy",
  glasses: "half",
  nose: "long",
  brow: "thin",
  hair: "bun",
  body: "bell",
  widthK: 0.85,
  posture: "proud",
  age: 2
}, 0.98, 23), C("granny C", "jolly round granny: big round head, white curls, cat glasses, barrel body, tiny legs", {
  jacket: "#e07a9a",
  pants: "#5a4a5a",
  boots: "#6a4a34",
  skin: SKIN7[4],
  hair: "#f0ece6",
  bangles: true
}, {
  head: "round",
  headK: 1.12,
  eye: "bead",
  eyeK: 1.2,
  glasses: "cat",
  glassCol: "#c0306a",
  nose: "button",
  hair: "curly",
  body: "barrel",
  legK: 0.6,
  age: 1
}, 0.78, 24), {
  ...byName("vex"),
  name: "villain A"
}, C("villain B", "tiny mastermind: huge bulb head, bald, square glasses, bead eyes, stick body", {
  jacket: "#3a6a3a",
  pants: "#1e2a1e",
  boots: "#141414",
  skin: SKIN7[0],
  hair: "#2a2a2a",
  build: "slim"
}, {
  head: "bulb",
  headK: 1.3,
  eye: "bead",
  eyeK: 1.1,
  glasses: "square",
  nose: "tick",
  brow: "thin",
  hair: "bald",
  body: "stick",
  ears: "small"
}, 0.82, 25), C("villain C", "hulking enforcer: small square head, flattop, unibrow, barrel body, short legs", {
  jacket: "#4a4a52",
  pants: "#2a2a30",
  boots: "#141414",
  skin: SKIN7[3],
  hair: "#1a120e",
  stubble: true,
  build: "stout"
}, {
  head: "square",
  headK: 0.78,
  eye: "bead",
  eyeK: 1.25,
  brow: "uni",
  browK: 1.3,
  nose: "snub",
  hair: "flattop",
  body: "barrel",
  widthK: 1.1,
  legK: 0.8,
  posture: "proud"
}, 1.24, 26)];
/** a new outfit from a DNA starter (CAST1 or ALT by name): the starter's outfit with `o` on top and `dna` merged into
 *  its DNA. Use a starter only if it suits the new character brief. */

export const fromArchetype = (name: string, o: Partial<Outfit> = {}, dna: Partial<Dna> = {}): Outfit => {
  const c = [...CAST1, ...ALT].find(x => x.name === name);
  if (!c) throw new Error(`fromArchetype: no starter named "${name}"`);
  return {
    ...c.o,
    ...o,
    dna: {
      ...c.o.dna,
      ...dna
    }
  };
};
const HEADS: HeadShape[] = ["bean", "round", "egg", "pear", "square", "long", "wedge", "bulb", "bell"];
const BODIES: BodyShape[] = ["bean", "pear", "wedge", "barrel", "stick", "box", "bell"];
const EYES: RestEye[] = ["lid", "dot", "wide", "bead", "sleepy"];
const NOSES: Nose[] = ["tick", "button", "long", "hook", "bulb", "snub"];
const HAIRS: HairStyle[] = ["bald", "buzz", "sidepart", "combover", "quiff", "spiky", "afro", "puffs", "bun", "ponytail", "bob", "long", "curly", "sleek", "flattop"];
const POSTURES: Posture[] = ["upright", "hunch", "proud", "slouch"];
/** a background crowd: n seeded DNA characters, each with its own head and body shape (never the same shape on both),
 *  proportions, eyes, nose, hair, posture and height, dressed from the short's palette. Returns LabChar records
 *  (`o`, `seed`, `scale`), so a crowd also goes straight onto the character sheets. */

export const crowd = (n: number, seed: number, pal: {
  cloth: string[];
  pants?: string[];
  hair?: string[];
  skins?: string[];
}, extra: Partial<Outfit> = {}): LabChar[] => {
  const r = rng(seed),
    pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length) % a.length],
    k = (lo: number, hi: number) => lo + (hi - lo) * r();
  return Array.from({
    length: n
  }, (_, i) => {
    const head = pick(HEADS);
    let body = pick(BODIES);
    while (body === head) body = pick(BODIES);
    const age = r() < 0.25 ? 2 : r() < 0.3 ? 1 : 0,
      kid = r() < 0.12;
    const hair = age === 2 ? "#d8d2ca" : pick(pal.hair ?? ["#2a1a14", "#3a2a20", "#5a3626", "#1a120e", "#7a3a1a"]);
    const o: Outfit = {
      jacket: pick(pal.cloth),
      pants: pick(pal.pants ?? ["#3e4452", "#4a4a44", "#2e3440", "#5a4a3a"]),
      boots: "#4a3426",
      skin: pick(pal.skins ?? SKIN7),
      hair,
      build: kid ? "kid" : body === "barrel" || body === "box" ? "stout" : body === "stick" ? "thin" : undefined,
      ...(r() < 0.25 && !kid ? {
        moustache: hair
      } : {}),
      ...extra,
      dna: {
        head,
        body,
        eye: pick(EYES),
        nose: pick(NOSES),
        hair: pick(HAIRS),
        posture: pick(POSTURES),
        age,
        headK: k(0.86, 1.14),
        widthK: k(0.9, 1.1),
        legK: k(0.85, 1.12),
        torsoK: k(0.92, 1.08)
      }
    };
    return {
      name: `crowd ${i + 1}`,
      o,
      seed: 100 + Math.floor(r() * 900),
      scale: kid ? k(0.62, 0.72) : k(0.9, 1.12)
    };
  });
};
