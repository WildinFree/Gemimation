import type { LabChar } from "../types";
import type { Outfit } from "../toon/toon";
import type { Dna } from "../toon/dna";
import type { Acting, Talk } from "../anim/face";
import type { ExPose } from "../toon/poses";
import { POSES } from "../toon/poses";
import { WALK, type Gait } from "../toon/limbs";
export type CharacterPart = {
  outfit?: Partial<Outfit>;
  dna?: Dna;
  acting?: Acting;
};
export type PosePatch = Omit<Partial<ExPose>, "mouth"> & {
  mouth?: Partial<ExPose["mouth"]>;
};
export type PoseRecipe = {
  base: string | ExPose;
  change?: PosePatch;
};
export type CharacterRecipe = {
  name: string;
  seed: number;
  scale?: number;
  note: string;
  parts?: readonly CharacterPart[];
  outfit?: Partial<Outfit>;
  dna?: Dna;
  acting?: Acting;
};
/** Make an independent pose from a proven expression, including nested mouth data. */
export function poseFrom(base: string | ExPose, change: PosePatch = {}): ExPose {
  const source = typeof base === "string" ? POSES[base] : base;
  if (!source) throw new Error("Unknown pose base: " + base);
  return structuredClone({
    ...source,
    ...change,
    mouth: {
      ...source.mouth,
      ...change.mouth
    },
    marks: {
      ...source.marks,
      ...change.marks
    }
  });
}
/** Explicit expression choices, talk and gait for a character. Stock drawing parts remain reusable. */
export function actingFrom(poses: Record<string, PoseRecipe>, talk: Talk, gait: Gait = WALK): Acting {
  return {
    poses: Object.fromEntries(Object.entries(poses).map(([name, recipe]) => [name, poseFrom(recipe.base, recipe.change)])),
    talk: structuredClone(talk),
    gait: structuredClone(gait)
  };
}
/** These are body fragments, leaving head, face, hair, wardrobe and performance to the brief. */
export const BODY_PARTS = {
  slender: {
    dna: {
      body: "stick",
      widthK: 0.92,
      legK: 1.1
    }
  },
  broad: {
    dna: {
      body: "wedge",
      widthK: 1.08,
      legK: 0.9
    }
  },
  rounded: {
    dna: {
      body: "barrel",
      widthK: 1.06,
      torsoK: 1.05
    }
  },
  draped: {
    dna: {
      body: "bell",
      torsoK: 1.05
    }
  }
} satisfies Record<string, CharacterPart>;
export const FACE_PARTS = {
  attentive: {
    dna: {
      eye: "wide",
      brow: "thin",
      nose: "button"
    }
  },
  reserved: {
    dna: {
      eye: "lid",
      brow: "taper",
      nose: "long"
    }
  },
  blunt: {
    dna: {
      eye: "bead",
      brow: "block",
      nose: "snub"
    }
  },
  tired: {
    dna: {
      eye: "sleepy",
      brow: "thin",
      nose: "tick"
    }
  }
} satisfies Record<string, CharacterPart>;
export const WARDROBE_PARTS = {
  collar: {
    dna: {
      top: "collar"
    }
  },
  workwear: {
    dna: {
      top: "overalls"
    }
  },
  formal: {
    dna: {
      top: "tie"
    }
  },
  casual: {
    dna: {
      top: "vneck"
    }
  }
} satisfies Record<string, CharacterPart>;
/** Later parts and explicit choices override earlier parts. Inputs are never mutated. */

export function makeCharacter(recipe: CharacterRecipe): LabChar {
  if (!recipe.name.trim() || !recipe.note.trim()) {
    throw new Error("A character needs a name and a story-role/design note");
  }
  if (!Number.isFinite(recipe.seed) || !Number.isFinite(recipe.scale ?? 1) || (recipe.scale ?? 1) <= 0) {
    throw new Error("Character seed and scale must be finite, with positive scale");
  }
  let outfit: Partial<Outfit> = {};
  let dna: Dna = {};
  let acting: Acting = {};
  const parts = [...(recipe.parts ?? []), recipe];
  for (const part of parts) {
    outfit = {
      ...outfit,
      ...part.outfit
    };
    dna = {
      ...dna,
      ...part.outfit?.dna,
      ...part.dna
    };
    if (part.acting) {
      acting = {
        poses: {
          ...acting.poses,
          ...part.acting.poses
        },
        talk: {
          ...acting.talk,
          ...part.acting.talk
        },
        gait: part.acting.gait ?? acting.gait
      };
    }
  }
  if (!outfit.jacket || !outfit.pants || !outfit.boots || !dna.head || !dna.body) {
    throw new Error("Choose jacket, pants, boots, head and body in the character recipe");
  }
  return structuredClone({
    name: recipe.name,
    note: recipe.note,
    seed: recipe.seed,
    scale: recipe.scale ?? 1,
    o: {
      ...outfit,
      dna
    } as Outfit,
    ...(parts.some(part => part.acting) ? {
      acting
    } : {})
  });
}
