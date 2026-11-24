import * as THREE from "three";
import { EffectComposer, EffectPass, RenderPass, BloomEffect, BlendFunction, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { WORLD, cartoonFrame } from "../look/cartoon";
import { MOODS } from "../light/moods";
import { LensBlur } from "../post/lensblur";
import { GradeEffect, GRADES, gradeFor } from "../post/grade";
import { TransitionEffect } from "../post/transition";
import { txAt } from "../camera/transitions";
import type { Film } from "../types";
export async function createFilmPlayer<Id>(film: Film<Id>, canvas: HTMLCanvasElement, options: {
  width?: number;
  height?: number;
  lens?: boolean;
  bloom?: boolean;
  grade?: boolean;
} = {}) {
  if (!(film.total > 0) || !Number.isInteger(film.total) || !Number.isFinite(film.fps ?? 30) || !((film.fps ?? 30) > 0)) throw new Error("Film needs positive total and fps");
  await film.load?.();
  canvas.width = options.width ?? 1080;
  canvas.height = options.height ?? 1920;
  const g = canvas.getContext("2d")!;
  if (!g) throw new Error("Canvas 2D output is unavailable");
  WORLD.look = "cartoon";
  const slots: any[] = [];
  let raf = 0,
    disposed = false;
  const masked = document.createElement("canvas");
  masked.width = canvas.width;
  masked.height = canvas.height;
  function slot(index: number) {
    if (slots[index]) return slots[index];
    const cv = document.createElement("canvas");
    const renderer = new THREE.WebGLRenderer({
      canvas: cv,
      antialias: false,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(1);
    renderer.setSize(canvas.width, canvas.height, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(40, canvas.width / canvas.height, .03, 2500);
    const world = film.makeWorld();
    scene.add(world.root);
    const lens = new LensBlur({
      maxCoC: 24,
      nearScale: 1.2
    });
    const grade = new GradeEffect(GRADES.day, 1),
      tx = new TransitionEffect();
    const bloom = new BloomEffect({
      blendFunction: BlendFunction.ADD,
      intensity: .4,
      luminanceThreshold: 1.25,
      luminanceSmoothing: .2,
      mipmapBlur: true,
      levels: 6,
      radius: .6
    });
    const mip = bloom.mipmapBlurPass,
      resize = mip.setSize.bind(mip);
    mip.setSize = (w: number, h: number) => resize(Math.round(1920 * w / Math.max(h, 1)), 1920);
    const composer = new EffectComposer(renderer, {
      multisampling: 4,
      frameBufferType: THREE.HalfFloatType
    });
    composer.addPass(new RenderPass(scene, camera));
    if (options.lens !== false) {
      composer.addPass(new EffectPass(camera, lens.pre));
      composer.addPass(new EffectPass(camera, lens.main));
    }
    composer.addPass(new EffectPass(camera, ...(options.bloom !== false ? [bloom] : []), new ToneMappingEffect({
      mode: ToneMappingMode.NEUTRAL
    }), ...(options.grade !== false ? [grade] : [])));
    if (film.tx?.some(t => t.kind === "whip")) composer.addPass(new EffectPass(camera, tx));
    composer.setSize(canvas.width, canvas.height);
    return slots[index] = {
      renderer,
      scene,
      camera,
      world,
      lens,
      grade,
      tx,
      composer
    };
  }
  function pause() {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  function renderFrame(frame: number) {
    if (disposed) throw new Error("Player is disposed");
    if (!Number.isFinite(frame)) throw new Error("Frame must be finite");
    const f = Math.max(0, Math.min(film.total - 1e-6, frame));
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    g.fillStyle = film.background ?? "#1e1a22";
    g.fillRect(0, 0, canvas.width, canvas.height);
    const layers = film.layersAt(f);
    if (layers.length > 2) throw new Error("Film supports at most two transition layers");
    layers.forEach((layer, index) => {
      const s = slot(index),
        local = f + (layer.dt ?? 0);
      const target = s.world.update(layer.id, local, s.camera, s.scene);
      cartoonFrame(s.renderer, s.scene, s.world.root, s.camera, canvas.width, canvas.height, MOODS[film.moodOf(layer.id)].sunCol);
      const depth = film.dofAt(local),
        forward = new THREE.Vector3();
      s.camera.getWorldDirection(forward);
      const focus = depth.focus ? new THREE.Vector3(...depth.focus(local)) : target.clone();
      s.lens.focus = Math.max(.2, focus.sub(s.camera.position).dot(forward));
      s.lens.cInf = depth.cInf;
      gradeFor(s.grade, film.moodOf(layer.id));
      s.tx.set(txAt(film.tx, f));
      s.composer.render(1 / (film.fps ?? 30));
      let picture: HTMLCanvasElement = s.renderer.domElement;
      if (layer.mask) {
        const match = /#000 ([\d.-]+)%, transparent ([\d.-]+)%/.exec(layer.mask);
        if (!match) throw new Error("Unsupported transition mask; expected the supplied vertical time-pass gradient");
        const a = Number(match[1]) / 100,
          b = Number(match[2]) / 100;
        const mg = masked.getContext("2d")!;
        mg.globalCompositeOperation = "source-over";
        mg.clearRect(0, 0, masked.width, masked.height);
        mg.drawImage(picture, 0, 0);
        const gradient = mg.createLinearGradient(0, a * masked.height, 0, b * masked.height);
        gradient.addColorStop(0, "#000");
        gradient.addColorStop(1, "transparent");
        mg.globalCompositeOperation = "destination-in";
        mg.fillStyle = gradient;
        mg.fillRect(0, 0, masked.width, masked.height);
        mg.globalCompositeOperation = "source-over";
        picture = masked;
      }
      g.globalAlpha = layer.alpha;
      g.drawImage(picture, 0, 0);
    });
    const flash = txAt(film.tx, f);
    if (flash.flash > 0) {
      g.globalAlpha = flash.flash;
      g.fillStyle = flash.flashCol;
      g.fillRect(0, 0, canvas.width, canvas.height);
    }
    g.globalAlpha = 1;
    return canvas;
  }
  const duration = film.total / (film.fps ?? 30);
  return {
    canvas,
    duration,
    renderFrame,
    renderAt(seconds: number) {
      return renderFrame(seconds * (film.fps ?? 30));
    },
    play() {
      pause();
      const start = performance.now();
      const tick = () => {
        renderFrame((performance.now() - start) / 1000 % duration * (film.fps ?? 30));
        raf = requestAnimationFrame(tick);
      };
      tick();
    },
    pause,
    dispose() {
      pause();
      if (disposed) return;
      disposed = true;
      slots.forEach(s => {
        s.composer.dispose();
        s.renderer.dispose();
      });
    }
  };
}
