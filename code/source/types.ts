import type * as THREE from "three";
import type { Outfit, FrontOpts } from "./toon/toon";
import type { Acting } from "./anim/face";
import type { V3 } from "./util";
import type { Mood } from "./light/moods";
import type { Tx } from "./camera/transitions";
export type LabChar = {
  name: string;
  o: Outfit;
  seed?: number;
  scale?: number;
  note?: string;
  pose?: FrontOpts;
  act?: FrontOpts;
  acting?: Acting;
};
export interface FilmWorld<Id> {
  root: THREE.Object3D;
  update(id: Id, f: number, camera: THREE.PerspectiveCamera, scene: THREE.Scene): THREE.Vector3;
}
export type Film<Id> = {
  total: number;
  fps?: number;
  makeWorld: () => FilmWorld<Id>;
  layersAt: (f: number) => {
    id: Id;
    alpha: number;
    dt?: number;
    mask?: string;
  }[];
  dofAt: (f: number) => {
    cInf: number;
    focus?: (f: number) => V3;
  };
  moodOf: (id: Id) => Mood;
  tx?: Tx[];
  background?: string;
  load?: () => Promise<unknown>;
};
