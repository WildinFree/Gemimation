# Engine API map

Load one runtime build and use its global AnimatedShorts, abbreviated E below. This page describes useful entry points; typed source supplies full signatures.

## Character construction and drawing

    const C = E.characters;
    const person = C.makeCharacter({
      name: "Story-specific name", note: "Role and design direction", seed: 3, scale: 1,
      parts: [C.BODY_PARTS.slender, C.FACE_PARTS.attentive, C.WARDROBE_PARTS.workwear],
      outfit: { jacket:"#df7745", pants:"#31485b", boots:"#493a31", skin:"#c99067", hair:"#2b2021" },
      dna: { head:"egg", hair:"ponytail", posture:"upright" },
      acting: C.actingFrom({
        neutral:{base:"listen"}, grin:{base:"grin"},
        shock:{base:"shock"}, deadpan:{base:"deadpan"}
      }, {jaw:0.9,w:1.05})
    });

Parts are editable parameters, not mandatory stock identities. poseFrom accepts a stock pose name or a saved pose object and a nested mouth/mark patch. makeCharacter returns an independent record with name, o (outfit/DNA), seed, scale and acting. Inputs are not mutated.

drawCharacter(context, person, options) draws into an existing Canvas 2D context. Options include x, groundY, pixelsPerUnit (default 0.5 design-to-screen scale), frame, view (front/left/right/side/back), expression, mode (wild/push), track, phase and silhouette. Placement is at the soles; the character's own scale is also applied. A profile uses the selected gait at phase. For repeated pixel comparisons, create a Canvas context with willReadFrequently:true before drawing.

Lower-level toon.Pen, toon.bodyFront and toon.bodySide preserve the original drawing functions. dna controls identity and global look knobs; hair, expressions, poses and limbs provide the underlying libraries. Do not replace the prescribed round hands/line limbs with detailed anatomy.

### Acting

A Track contains c, x, facing (-1/0/1) and face keys such as [{f:0,pose:"neutral"},{f:30,pose:"shock",take:true}]. Optional syl, arms, blinks, turns and ph supply syllables, gestures, blink keys, turns and independent drift phase.

acting.act(track, frame, period, acting.MODES.wild) evaluates a complete performance. Its result includes 2D draw options and a stretch amount. acting.cardFields(result) provides compatible 3D actor-card fields. acting.poseOf, gaitOf and walkAt resolve individual performance data.

motion supplies SNAP, snap, snapAt, tr, dip, ring, arcUp and action. Keep its asymmetric quick acting arrival distinct from the camera's symmetric glide. limbs supplies ARM, rig, posed, gait, WALK/RUN/MARCH, IK and drawing helpers.

### Review sheets

- drawLineup(canvas, title, cast, page): pages 0 front, 1 three-quarter, 2 silhouettes, 3 heads, 4-5 expression matrix.
- drawCharacterSheet(canvas, title, cast, characterIndex): turnaround, key expressions, gait/poses and silhouettes. A 2400 x 1500 canvas suits its layout.
- drawFaceSheet(canvas, cast, characterIndex, mode, ownOnly): own reactions plus available stock expressions, normally on a 1080 x 1920 canvas.

Sheet labels are for review only. They do not belong in the rendered story.

## Cameras and transitions

camera provides runKeys, dolly, orbit, arc, track, crane, pushK and other camera/momentum helpers. A camera Shot has pos, look and optional fov/roll. Positions/look points are three-number world vectors; fov and roll are degrees unless an individual function states otherwise. Some low-level orbit angles are radians: consult the typed signature.

stations.stations(keys) creates an absolute-frame camera function. Its keys describe arrival frames, positions/look points, reading holds, travel and optional via/roll/drift choices. A station is an arrival, not a departure.

transitions.makeTxLayersAt(shots, transitions, total) maps a frame to at most two layers. Shots use id, a (inclusive start), b (exclusive end). A transition uses kind, f and optional n; kinds are cut, blend, dissolve, flash, whip, through, timePass and loop. The resulting layers carry id, alpha, optional dt pre-roll and a supported time-passage mask.

transitions.txSpan and txAt supply ranges and flash/blur state. Other helpers provide screen projection, basis, eye-trace checks, through-camera motion and lens-crossing paths. Keep the written transition rules as the creative standard.

## 3D world

The full engine exposes THREE and the original geometry/material libraries.

- shapes: rounded boxes, smooth revolved profiles, tubes, cylinders, spheres and seeded variation.
- palette: PAL families, tint, part, place, grp and useful light-source components.
- props: prop(key) and the available period dictionaries. Keys describe optional examples, such as victorian/teapot.
- worldBuild: Batch, surface helpers, plants, banners, sight lines and path-clearance checks.
- houses, street and far: dimensional architecture, street details and atmospheric scenery.
- look: house surfaces, smooth outlines, environment reflections and cartoonFrame.
- lighting/lightRig: moods and the scene's sky, sun, fill, atmosphere and practical lights.
- cards/actorCards/cardShading: grounded character cards, held-prop/hat anchors, effects and scene tint.
- grade/lens/transitionPost: the original image effects.

makeRecipeWorld in worldRecipes accepts cast, sets and takes. Each set receives a THREE.Group and builds once; it may return update(frame). Each take declares set, mood, camera(f), sun(f) and pose(frame). The sun callback returns centre (THREE.Vector3), radius and optional direction.

The frame passed to callbacks has f, camera, stage, light and actor(name, action). An action supplies p [x,y,z] and optional rig/card fields. Identity seed and scale come from the cast. Facing defaults toward the camera. Keep updates pure functions of frame, including revisited/negative frames.

worldRecipes.assembleProps(parent, placements) builds an optional named prop or a supplied factory at each at/yaw position. It returns built plus update(f). Factories return {obj,update?}. Hero parts remain attached and respond at their own hinges.

## Browser film player

A Film has total (exclusive frame count), optional fps (default 30), makeWorld, layersAt, dofAt and moodOf. It may add tx, background and async load.

    const player = await E.createFilmPlayer(film, outputCanvas, {
      width:1440, height:2560, lens:true, bloom:true, grade:true
    });
    player.renderAt(1.2);
    player.renderFrame(36);

The output is a single Canvas containing the complete layer blend, time-passage mask, flash, outline, lens blur, tone mapping, bloom and grade. The player caches world/renderer instances and re-evaluates frame state. Call pause before an external export loop and dispose when finished.

camera, mood and dofAt callbacks remain story-specific. The player supplies rendering plumbing; it does not invent the storyboard, camera direction, cues or quality verdict.

## Browser recording

    const result = await E.captureCanvas(canvas, seconds => player.renderAt(seconds), {
      duration:player.duration, fps:30, audio:suppliedAudioBlob
    });

The optional audio Blob is decoded using the browser's available formats and connected at unity gain. No voice generation, normalization or effects are applied. No audio is added if absent. The return object contains blob, mimeType, drawn_frames, expected_frames, skipped_steps and a timing limitation. Save the Blob using the available output mechanism.

This is real-time preview recording. If steps are skipped or precise final encoding is available elsewhere, export each explicit frame and combine with the original audio using that encoder. Check the final file's duration, pacing, clarity and sound.
