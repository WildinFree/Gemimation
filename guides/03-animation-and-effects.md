# Animation and effects

## Act the thought

Give each main a resting expression, three important reactions, a personal gait/gesture habit and a reason for each action. The habit reflects thinking: a held breath, one squinted eye while aiming, a tilted head, lip bite or concentrated tongue. Do not give everyone the same idle animation.

A significant action has a sequence:

**Notice -> read -> anticipate -> brief hold -> strike/action -> contact -> reaction -> settle.**

Let the head/eyes notice first. The body prepares against the coming motion. The action accelerates on an arc. Its contact is exact. Other parts follow with small delays, and the consequence changes the next pose. Reach, grip, lift, carry, lower and release are separate understandable actions; a prop must not teleport into a hand.

A gag normally has setup, anticipation, reveal, pause, reaction and recovery. The short pause before a reaction sells the joke. A listener looks at the actual event and reacts after seeing it, rather than mirroring the speaker's face.

## Animation principles

| Principle | Application |
|---|---|
| Squash/stretch | preserve apparent volume: taller becomes thinner; subtle on speech, stronger on landings and takes |
| Anticipation | counter-move before a major action: crouch, wind-up, lean back, intake of breath |
| Staging | one main idea; key gestures separate from the torso and sit against a readable background |
| Pose to pose | establish strong extremes first, then the arc, contact, breakdowns and settle |
| Follow-through | hair, headwear, cloth and held objects lag a moving body and settle after it |
| Slow in/out | ease ordinary movement; accelerate into a hit and settle after contact |
| Arcs | curved paths for heads, hands, thrown objects and camera journeys |
| Secondary action | a motivated blink, foot tap or hand cue supports the main action |
| Timing/weight | light things react fast; heavy things gather force and settle longer |
| Exaggeration | push the important beat; quieter neighbouring beats preserve contrast |
| Solid drawing | maintain head volume, feature placement, limb lengths, scale and view consistency |
| Appeal | specific personality, contrasting shapes, readable asymmetry and clear wants |

Animate smoothly at the chosen output frame rate, with no intentional dropped drawings or random line boil. Cartoon exaggeration can reshape the head/torso, but it must not turn line limbs into rubber or change the hand construction. A motion smear is a separate trail behind a fast action, not a broken body.

### Timing bands

Times below are seconds, with 30 fps examples for precision. Recalculate frame counts at other rates.

| Event | Starting timing |
|---|---|
| Fast pose arrival | 0.07-0.13 s (2-4 frames), then 0.2-0.4 s settle |
| Anticipation | 0.1-0.27 s, often 0.13-0.2 s for a counter-move |
| Small pre-strike hold | 0.03-0.07 s |
| Accelerating strike | 0.1-0.2 s; sharp contact can occupy one frame |
| Follow-through delay | 0.07-0.13 s between connected parts |
| Body/prop settle | 0.2-0.4 s |
| Turn that must read | 0.27-0.33 s; a comic snap turn may use 0.07-0.13 s |
| Light action | about 0.1-0.2 s |
| Heavy action | about 0.33-0.67 s plus a larger settle |
| Deliberate deadpan | about 1-2 s with quiet camera creep |

A small speech/acting bounce may reshape the body around 4-8%; a jump/hit 15-30%; a major gag can go further if its silhouette remains clear. Apply a brief squash from the soles on impact. For held stylized poses, place joints deliberately so limbs and round hands retain their construction.

Use quick arrival and slow settle for acting, distinct from the camera's more symmetric ease-in/out. A useful action-progress profile over 12 samples is 5, 16, 31, 48, 66, 79, 88, 93, 96, 98, 99, 100 percent. Add a small damped overshoot where it communicates weight. Do not apply one easing curve to every object.

## Faces, speech and holds

Choose expressions on key words, often every one or two important words in a close shot, rather than holding one face across a whole line or changing mechanically on every token. Blend to the next expression with a quick spring and small overshoot. A shock take can begin with about 0.17 s of anticipation. Use large, pushed faces for comedy and quieter shapes for sincerity.

Brows stay inside the face and below the hair. Under a brim, change eye or mouth shape when two brow-only poses would look identical. Match gaze to the target and maintain it through the reaction.

Mouth shapes follow audible syllables and consonants. Use closed/lip-pressed, open, wide, round, teeth/lip and tongue shapes where the sound needs them; opening follows an envelope rather than a rectangular on/off switch. Lead speech by zero to one frame. A shout opens more than a mutter. Stressed syllables may add a brow pop, small nod or tilt. If only word timings are available, mark inferred syllables as estimates and check them by ear.

Natural blinks are brief, roughly 0.13 s, at irregular intervals around 0.5-2.3 s. They can bridge ordinary expression changes. Do not blink away the eyes at the peak of a shock take.

One or two drawn emotion marks are enough: sweat, tears, steam, shock rays, a vein or a sparkle. No letters or explanatory icons.

During a hold, allow slow subtle breathing, tiny gaze/head drift and purposeful blinks. Example drift scale: about 0.8% of body height in breathing and 1.3 degrees of head tilt over a long cycle. Give people different phases. Hair, hat and prop follow-through should settle rather than wobble forever. A deadpan is a deliberate still performance within a living scene, not a frozen export.

## Walks and physical contact

Pick gait from intention: stroll, march, bouncy, swagger, waddle, tiptoe, exhausted shuffle or purposeful run. A normal step is about 0.3-0.4 s. Faster, smaller or slower steps can express personality.

The stance foot stays planted while the body passes it. Travel distance, stride length and step count agree. If driving animation mathematically, derive gait phase from distance travelled rather than letting a time cycle play while the person glides. Retune stride to end on a whole planted step. Sideways travel uses a side/three-quarter body direction; a front-facing person sliding sideways is not a walk.

Arms swing opposite the legs. Body bob is around 3-7% of height with a slight lean changing across the step. Keep the contact/weight-transfer progression readable; do not let a bob curve make soles penetrate the ground. Stop with a final footfall and 0.2-0.33 s settle.

Hands end exactly on touched objects. A held prop follows the hand through pose changes and turns, while its parts remain joined. Wheels rotate with travelled distance. Seated people fit their seat, and riders move with their mount. Preserve these relationships across generated clip boundaries.

If using code or procedural animation, the same timestamp must recreate the same state. Use repeatable variation and test seeking backward, revisiting times and loop pre-roll. Equivalent control is a continuity requirement for generated clips too.

## Effects that earn their place

An effect explains a hit, speed, value, emotion or transformation. Build three layers when appropriate:

1. **Main shape:** a flat cartoon burst, ring, trail or puff, drawn in the visual language.
2. **Secondary pieces:** uneven small debris, particles, sparks or dust following arcs and gravity.
3. **Light:** a motivated glow and spill onto surroundings if the source emits light.

Then synchronize the camera response and sound with the peak. Effects sit in scene perspective: ground rings lie on the ground, airborne shapes face/read against the camera, size reduces with distance. They do not become a sticker pasted over the whole screen.

| Beat | Suitable effect |
|---|---|
| Impact/landing | tapered shock ring, burst, dust, a few debris pieces and a short camera kick |
| Fast swing/travel | smear arc behind the motion, selective speed lines and directional blur |
| Precious object/reveal | a few twinkles and one thin horizontal highlight streak |
| Realisation | one head-side sparkle and a restrained snap-in |
| Magic/heat | local colour-state change, coloured spill, a trail or growing glow |
| Weather/air | sparse rain, drifting motes, steam or smoke tinted to the scene |
| Strong emotion | brief sweat, steam, tears, shock lines or face tint returning to normal |

On the named object, sweep light over its surface in roughly 0.37-0.47 s or use a brief decaying glow pulse. Metal/glass gets one thin horizontal streak, not a cross-shaped stock flare. Reserve sparkle for meaning; sprinkling it everywhere destroys emphasis.

Effects attack in 0.03-0.1 s and decay over 0.27-0.67 s. A pop-in may overshoot 10-20% before settling. Shrink, scatter, thin or fade an effect away instead of one-frame disappearance. Use a large/medium/small hierarchy around 1:3:6, odd counts and uneven spacing. Let debris land and smoke respect ceilings.

Phone-sized accents need roughly 4% of frame height; a major impact may use 15-40%. Keep the speaking face and beat object visible. Use coloured smoke and scene-related accents rather than realistic fire, grey stock smoke, identical evenly spaced particles or arbitrary glitter. At most two secondary accents should compete with the main effect.

Effects never manufacture an unrelated smoke-cloud, star or shape transition cover. Use the motivated scene handoffs in [04 Transitions](04-transitions-and-continuity.md).
