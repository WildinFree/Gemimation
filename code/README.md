# Optional animation engines

This folder preserves the useful drawing and scene code in executable form. It is an implementation option, not a prerequisite for following the creative guides.

## Choose the available route

| Available capability | Use |
|---|---|
| Image/video generation only | Use the guides and visual tests; source code remains optional reference |
| Browser JavaScript with Canvas | runtime/character-engine.js for the original character drawings, acting, gaits, camera maths and cast sheets |
| Browser JavaScript with WebGL | runtime/animation-engine.js for those features plus the dimensional world, lighting, materials, props and post effects |
| Python with image/numerical tools | The optional scripts in [tools/quality](../tools/quality/README.md) for contact sheets and diagnostic flags |
| Video encoding tools | Render explicit timestamps and encode the resulting frames with the supplied audio using available tools |
| Browser recording only | captureCanvas records a WebM preview and can attach supplied audio at unity gain; verify the resulting timing |

The two compact JavaScript builds are ready to embed as ordinary script content. Readable typed source is included separately; there is no need to read minified vendor code. Each exposes one global, **AnimatedShorts**. Choose one build per page. The larger build includes its rendering libraries and needs no network request, package installation, server or original project. Canvas/DOM is required; WebGL is required only for the 3D path. A Python-only runtime cannot execute these browser engines directly.

[The self-contained demo](../examples/browser-demo.html) embeds the complete build. It demonstrates Canvas people, a lit 3D set, time-of-day transition, loop, silhouettes, turnaround and face sheets. Its sample scene and people are prototypes, not story requirements or a finished film. Its controls are outside the captured canvas.

Keep a clear distinction between code execution available to a model and executable HTML available in its output viewer. If neither can run a browser, do not ask for a local setup: use the strongest available generation method and retain this code as reference.

## What is preserved

- Original head/body design parameters, wardrobe, hair, face/eye/mouth drawing, plum linework and skin palettes.
- Continuous face rig, expression poses, syllable/viseme logic, blinks, gestures, hose limbs, inverse kinematics and planted gaits.
- Character composition helpers and optional design examples.
- Camera stations, pushes, tracking, orbits, cranes, momentum, aim lag, impact kicks, projection and eye-trace calculations.
- Transition spans/layers, moving blends, time-passage masks, flash/whip state and loop pre-roll.
- Procedural surfaces, palette, geometry, rounded props, period examples, buildings, street dressing, vegetation, sky, water and distance.
- Scene lights, moods, contact/card shading, outlines, depth of field, bloom, grading and directional transition blur.
- Character review sheets and browser-native rendering/capture adapters.

The 42 copied engine modules retain their drawing/math implementations. The surrounding app shells were replaced with small native browser adapters. Optional example props/characters are resources, not an instruction to reuse previous work.

## How to read the code efficiently

Start with [API.md](API.md) and the readable [demo script](../examples/browser-demo.js). Use the runtime files to execute the engine; do not load their bundled library code into the model context just to use them. Open only a relevant source module when changing an implementation.

source/ mirrors functional topics: toon, anim, camera, characters, world, assets, props, light, look and post. browser/ contains the new host adapters; types.ts contains the standalone data contracts. Source types help adaptation; the supplied JavaScript builds already run without a compiler.

Core animation functions use a 30-fps reference clock. Feed them seconds * 30 to preserve their established timing. A Film may declare a different internal fps only if its keys, cycles and durations are retimed consistently. For a 60-fps output of a 30-fps film, renderAt(outputFrame / 60) evaluates the original timeline at fractional reference frames.

## Rendering and export

createFilmPlayer returns renderFrame, renderAt, play, pause and dispose. Explicit timestamp rendering is the reliable source for deterministic frame export; interactive playback and capture can drop steps when rendering is slow.

Capture returns its chosen MIME type, drawn/expected frame counts and skipped steps. It does not guarantee frame-exact output, native 2K detail, loudness compliance or an inspected final film. Browser audio decoding/encoding may resample; supplied narration is connected at unity gain with no normalization or voice effects. Added sounds/mixing remain the chosen production method's responsibility.

A full resolution still or frame sequence can be generated from the canvas with normal image export. Retain all final quality checks. Any generation/transcoding path must be checked for timing, missing frames and voice changes.

## Port and licenses

This edition is derived from engine version 4.7.0, adapted for this independent package. Host-app hooks, project paths, installation/sync code, model routing and agent orchestration are excluded. Relevant operational principles remain in the creative guides.

The package LICENSE covers its own code and instructions. The complete runtime bundles additionally contain Three.js and postprocessing, with their notices in [licenses/three-LICENSE.txt](licenses/three-LICENSE.txt) and [licenses/postprocessing-LICENSE.txt](licenses/postprocessing-LICENSE.txt). Reference-image rights remain described in [the reference index](../references/README.md).
