export type C3 = [number, number, number];
export type Mood = "day" | "morning" | "warm" | "golden" | "overcast" | "dream" | "night" | "flash";
export type MoodPreset = {
  dir: C3;
  lit: C3;
  shade: C3;
  lift: C3;
  lambert: number;
  sideK: number;
  term: number;
  charTint: C3;
  charShade: number;
  charGrad: number;
  bodyGrad: number;
  sideTint: C3;
  actorShadow: boolean;
  fog: string;
  fogNear: number;
  fogFar: number;
  sunCol: string;
  sunI: number;
  sky: string;
  ground: string;
  hemiI: number;
  bias: number;
  normalBias: number;
  contact: C3;
  skyGrad: {
    c: string[];
    e: number[];
  };
  cloud: {
    lit: string;
    mid: string;
    shade: string;
  } | null;
  bounce: C3;
  sat: number;
};
const n3 = (v: C3): C3 => {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const DAY_CLOUD = {
  lit: "#fbf8f1",
  mid: "#e1e5f3",
  shade: "#c3cbe9"
};
export const MOODS: Record<Mood, MoodPreset> = {
  day: {
    dir: n3([-0.45, 0.75, 0.55]),
    lit: [1.58, 1.5, 1.33],
    shade: [0.34, 0.33, 0.42],
    lift: [0.05, 0.06, 0.11],
    lambert: 0.35,
    sideK: 0.84,
    term: 0.2,
    charTint: [1.0, 0.94, 0.92],
    charShade: 0.86,
    charGrad: 0.07,
    bodyGrad: 0.2,
    sideTint: [0.92, 0.9, 0.96],
    actorShadow: false,
    fog: "#b8d0ec",
    fogNear: 25,
    fogFar: 420,
    sunCol: "#fff3e0",
    sunI: 2.8,
    sky: "#dcecff",
    ground: "#b49a78",
    hemiI: 0.55,
    bias: -0.00025,
    normalBias: 0.015,
    contact: [0.2, 0.21, 0.33],
    skyGrad: {
      c: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"],
      e: [0, 3, 8, 16, 40]
    },
    cloud: DAY_CLOUD,
    bounce: [0, 0, 0],
    sat: 1.08
  },
  morning: {
    dir: n3([-0.8, 0.36, 0.45]),
    lit: [1.7, 1.45, 1.1],
    shade: [0.4, 0.38, 0.52],
    lift: [0.05, 0.05, 0.1],
    lambert: 0.32,
    sideK: 0.86,
    term: 0.14,
    charTint: [1.0, 0.92, 0.84],
    charShade: 0.86,
    charGrad: 0.09,
    bodyGrad: 0.22,
    sideTint: [0.9, 0.88, 0.98],
    actorShadow: false,
    fog: "#e6dcd2",
    fogNear: 30,
    fogFar: 500,
    sunCol: "#ffd9a8",
    sunI: 3.2,
    sky: "#f2e6dc",
    ground: "#a88a70",
    hemiI: 0.5,
    bias: -0.0003,
    normalBias: 0.015,
    contact: [0.28, 0.24, 0.34],
    skyGrad: {
      c: ["#f6dcc0", "#e2d6dc", "#b8cbe6", "#8eb2e2", "#6a98d8"],
      e: [0, 3, 9, 18, 40]
    },
    cloud: {
      lit: "#fff2e0",
      mid: "#eedfe4",
      shade: "#c8c6e2"
    },
    bounce: [0.04, 0.025, 0.0],
    sat: 1.06
  },
  warm: {
    dir: n3([-0.78, 0.55, 0.3]),
    lit: [1.55, 1.38, 1.12],
    shade: [0.6, 0.5, 0.54],
    lift: [0.06, 0.05, 0.07],
    lambert: 0.3,
    sideK: 0.88,
    term: 0.18,
    charTint: [1.0, 0.95, 0.9],
    charShade: 0.88,
    charGrad: 0.07,
    bodyGrad: 0.2,
    sideTint: [0.94, 0.9, 0.94],
    actorShadow: false,
    fog: "#cfe0f0",
    fogNear: 60,
    fogFar: 900,
    sunCol: "#fff0d6",
    sunI: 2.6,
    sky: "#ffe8cc",
    ground: "#9a7a60",
    hemiI: 0.55,
    bias: -0.0003,
    normalBias: 0.012,
    contact: [0.36, 0.28, 0.3],
    skyGrad: {
      c: ["#e8eef0", "#c4dcef", "#9cc4ec", "#74a8e2", "#548fdb"],
      e: [0, 3, 8, 16, 40]
    },
    cloud: {
      lit: "#fffaf0",
      mid: "#eee8ee",
      shade: "#d0d0e8"
    },
    bounce: [0.04, 0.03, 0.01],
    sat: 1.06
  },
  golden: {
    dir: n3([-0.82, 0.32, 0.2]),
    lit: [1.9, 1.3, 0.74],
    shade: [0.54, 0.42, 0.48],
    lift: [0.06, 0.04, 0.08],
    lambert: 0.3,
    sideK: 0.86,
    term: 0.1,
    charTint: [1.0, 0.86, 0.72],
    charShade: 0.84,
    charGrad: 0.1,
    bodyGrad: 0.24,
    sideTint: [0.86, 0.8, 0.95],
    actorShadow: false,
    fog: "#f0c69a",
    fogNear: 20,
    fogFar: 360,
    sunCol: "#ffb06a",
    sunI: 4.0,
    sky: "#f4c2a0",
    ground: "#8a6a60",
    hemiI: 0.5,
    bias: -0.0004,
    normalBias: 0.015,
    contact: [0.3, 0.22, 0.32],
    skyGrad: {
      c: ["#ffd08a", "#f7b27a", "#e8987c", "#c4848e", "#8a6f8a"],
      e: [0, 4, 10, 20, 40]
    },
    cloud: {
      lit: "#ffd2a8",
      mid: "#f2a08f",
      shade: "#a98fc4"
    },
    bounce: [0.06, 0.03, 0.0],
    sat: 1.1
  },
  overcast: {
    dir: n3([-0.3, 0.9, 0.35]),
    lit: [1.18, 1.18, 1.2],
    shade: [0.56, 0.56, 0.66],
    lift: [0.06, 0.06, 0.09],
    lambert: 0.32,
    sideK: 0.88,
    term: 0.22,
    charTint: [0.97, 0.97, 1.0],
    charShade: 0.9,
    charGrad: 0.06,
    bodyGrad: 0.18,
    sideTint: [0.94, 0.94, 0.98],
    actorShadow: false,
    fog: "#c4ccd8",
    fogNear: 18,
    fogFar: 300,
    sunCol: "#eef0f6",
    sunI: 1.6,
    sky: "#d4dae6",
    ground: "#8a8490",
    hemiI: 0.7,
    bias: -0.0003,
    normalBias: 0.015,
    contact: [0.3, 0.3, 0.38],
    skyGrad: {
      c: ["#c4ccd8", "#b8c2d2", "#a8b4c8", "#98a6be", "#8898b4"],
      e: [0, 3, 8, 16, 40]
    },
    cloud: {
      lit: "#e8ecf2",
      mid: "#cfd5e0",
      shade: "#aab2c4"
    },
    bounce: [0.0, 0.0, 0.01],
    sat: 0.98
  },
  dream: {
    dir: n3([-0.85, 0.3, 0.42]),
    lit: [1.45, 0.66, 0.5],
    shade: [0.2, 0.15, 0.32],
    lift: [0.06, 0.03, 0.12],
    lambert: 0.3,
    sideK: 0.84,
    term: 0.1,
    charTint: [1.0, 0.76, 0.7],
    charShade: 0.82,
    charGrad: 0.12,
    bodyGrad: 0.26,
    sideTint: [0.8, 0.72, 0.95],
    actorShadow: false,
    fog: "#5a3a6a",
    fogNear: 8,
    fogFar: 26,
    sunCol: "#ff7a4a",
    sunI: 4.0,
    sky: "#c08090",
    ground: "#5a3a50",
    hemiI: 0.5,
    bias: -0.0004,
    normalBias: 0.015,
    contact: [0.22, 0.12, 0.28],
    skyGrad: {
      c: ["#ff9a6a", "#e2707a", "#a85a86", "#6a4a86", "#3a3070"],
      e: [0, 4, 10, 20, 40]
    },
    cloud: {
      lit: "#ffb08a",
      mid: "#c8708a",
      shade: "#6a5090"
    },
    bounce: [0.05, 0.0, 0.04],
    sat: 1.0
  },
  night: {
    dir: n3([-0.8, 0.45, 0.35]),
    lit: [0.55, 0.68, 1.15],
    shade: [0.13, 0.13, 0.27],
    lift: [0.03, 0.03, 0.08],
    lambert: 0.32,
    sideK: 0.86,
    term: 0.12,
    charTint: [0.9, 0.9, 1.0],
    charShade: 0.8,
    charGrad: 0.12,
    bodyGrad: 0.24,
    sideTint: [1.0, 0.82, 0.7],
    actorShadow: false,
    fog: "#24304e",
    fogNear: 40,
    fogFar: 600,
    sunCol: "#b8ccff",
    sunI: 2.2,
    sky: "#4a5a90",
    ground: "#3a2430",
    hemiI: 0.32,
    bias: -0.0004,
    normalBias: 0.015,
    contact: [0.2, 0.2, 0.34],
    skyGrad: {
      c: ["#3a4a78", "#2e3c6a", "#22305a", "#1a244a", "#121a38"],
      e: [0, 4, 10, 20, 40]
    },
    cloud: null,
    bounce: [0.03, 0.01, 0.0],
    sat: 1.0
  },
  flash: {
    dir: n3([-0.7, 0.5, 0.4]),
    lit: [0.95, 0.92, 1.12],
    shade: [0.26, 0.24, 0.4],
    lift: [0.05, 0.04, 0.1],
    lambert: 0.3,
    sideK: 0.86,
    term: 0.14,
    charTint: [0.94, 0.92, 1.0],
    charShade: 0.84,
    charGrad: 0.1,
    bodyGrad: 0.22,
    sideTint: [0.88, 0.84, 1.0],
    actorShadow: false,
    fog: "#5a5878",
    fogNear: 20,
    fogFar: 300,
    sunCol: "#d8d8ff",
    sunI: 2.4,
    sky: "#8a88b0",
    ground: "#4a4050",
    hemiI: 0.42,
    bias: -0.0004,
    normalBias: 0.015,
    contact: [0.24, 0.22, 0.36],
    skyGrad: {
      c: ["#8a88b0", "#76769e", "#5e608a", "#484a74", "#32345c"],
      e: [0, 4, 10, 20, 40]
    },
    cloud: null,
    bounce: [0.02, 0.01, 0.03],
    sat: 0.9
  }
};
/** a copy of a mood with overrides (e.g. a scene's own sun direction or fog range) */

export const moodWith = (m: Mood, o: Partial<MoodPreset>): MoodPreset => ({
  ...MOODS[m],
  ...o
});
