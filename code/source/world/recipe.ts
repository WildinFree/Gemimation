import * as THREE from "three";
import type { FilmWorld } from "../types";
import type { LabChar } from "../types";
import type { Shot } from "../camera/rig";
import { MOODS, type Mood, type MoodPreset } from "../light/moods";
import { person, setCardLight, type Act, type CamInfo, type Stage } from "../cast/cards";
import { CardLayer, type HeldFactory, type HatFactory } from "./cards";
import { LightRig, type SunFrame } from "./rig";
import { NOINK } from "../post/ink";
import { place, type Built } from "../assets/palette";
import { prop } from "../props";
import type { HeldKind } from "../toon/toon";
import type { V3 } from "../util";
export type PropPlacement = {
  source: string | (() => Built);
  at: V3;
  yaw?: number;
  contact?: number;
};
/** Build matching library or local props once and update them from absolute frame numbers. */
export function assembleProps(parent: THREE.Object3D, placements: readonly PropPlacement[]) {
  const built = placements.map(placement => {
    const item = typeof placement.source === "string" ? prop(placement.source) : placement.source();
    place(parent, item.obj, ...placement.at, placement.yaw ?? 0, placement.contact ?? 1);
    return item;
  });
  return {
    built,
    update: (f: number) => built.forEach(item => item.update?.(f))
  };
}
export type SceneFrame = {
  f: number;
  camera: CamInfo;
  stage: Stage;
  light: LightRig;
  actor: (name: string, action: Omit<Act, "i" | "o" | "okey" | "face"> & {
    face?: Act["face"];
  }) => void;
};
export type SetRecipe = (root: THREE.Group) => {
  update?: (frame: SceneFrame) => void;
} | void;
export type TakeRecipe = {
  set: string;
  mood: Mood;
  camera: (f: number) => Shot;
  sun: (f: number) => SunFrame;
  pose: (frame: SceneFrame) => void;
  actorShadow?: boolean;
};
export type WorldRecipe<Id extends string> = {
  cast: readonly LabChar[];
  sets: Record<string, SetRecipe>;
  takes: Record<Id, TakeRecipe>;
  moods?: Partial<Record<Mood, MoodPreset>>;
  practicals?: number;
  held?: Partial<Record<HeldKind, HeldFactory>>;
  hat?: HatFactory;
};
/** FilmWorld adapter for planned takes, shared lights, billboards and held-prop anchors. */
export function makeRecipeWorld<Id extends string>(recipe: WorldRecipe<Id>): FilmWorld<Id> {
  const root = new THREE.Group();
  const light = new LightRig(root, {
    practicals: recipe.practicals ?? 4
  });
  const cards = new CardLayer(root, recipe.held, recipe.hat);
  const cast = new Map(recipe.cast.map((character, index) => [character.name, {
    character,
    index
  }]));
  if (cast.size !== recipe.cast.length) throw new Error("Cast names must be unique");
  const sets = Object.fromEntries(Object.entries(recipe.sets).map(([name, build]) => {
    const group = new THREE.Group();
    root.add(group);
    return [name, {
      group,
      frame: build(group) || {}
    }];
  }));
  for (const take of Object.values<TakeRecipe>(recipe.takes)) {
    if (!sets[take.set]) throw new Error("Unknown take set: " + take.set);
  }
  const target = new THREE.Vector3();
  return {
    root,
    update(id, f, camera, scene) {
      const take = recipe.takes[id];
      if (!take) throw new Error("Unknown take: " + id);
      const pose = take.camera(f);
      camera.position.set(...pose.pos);
      camera.up.set(0, 1, 0);
      camera.lookAt(...pose.look);
      camera.rotateZ(THREE.MathUtils.degToRad(pose.roll ?? 0));
      camera.fov = pose.fov ?? 40;
      camera.near = 0.03;
      camera.far = 2500;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      camera.layers.enable(NOINK);
      target.set(...pose.look);
      const mood = recipe.moods?.[take.mood] ?? MOODS[take.mood];
      const sun = light.apply(mood, camera, scene, take.sun(f));
      light.practicalsOff();
      setCardLight(sun, mood);
      for (const [name, set] of Object.entries(sets)) set.group.visible = name === take.set;
      const camInfo: CamInfo = {
        pos: camera.position.clone(),
        right: new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion),
        up: new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion),
        sun: sun.clone()
      };
      const stage: Stage = {
        places: [],
        fx: [],
        held3d: []
      };
      const frame: SceneFrame = {
        f,
        camera: camInfo,
        stage,
        light,
        actor(name, action) {
          const record = cast.get(name);
          if (!record) throw new Error("Unknown cast member: " + name);
          const c = record.character;
          person(camInfo, {
            i: record.index,
            o: c.o,
            okey: name,
            seed: c.seed,
            scale: c.scale,
            ...action,
            face: action.face ?? [camera.position.x - action.p[0], camera.position.z - action.p[2]]
          }, f, stage);
        }
      };
      sets[take.set].frame?.update?.(frame);
      take.pose(frame);
      cards.sync(stage, camera, take.actorShadow ?? (take.mood === "golden" || take.mood === "morning"));
      return target;
    }
  };
}
