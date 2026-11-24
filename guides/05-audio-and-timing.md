# Audio and timing

## Use the actual recording

Listen before assigning exact times. Obtain word/phrase timing from available audio capabilities or supplied alignment. Check the start, middle, end, stressed words and long pauses against the waveform/playback if accessible. Correct transcription/alignment errors; never present guessed timings as measured.

The script preserves intended wording and meaning. The audio determines the actual performance timing. If the two disagree materially, identify the exact mismatch. Do not replace the voice, regenerate speech, time-stretch it, trim words, rearrange sentences or change its level.

Build visuals from time zero even if the voice begins slightly later. A first-word delay around 0.03-0.13 s works well, but accept a supplied longer lead-in by filling it with meaningful action. Request changed audio only if it is truly necessary; never silently edit it.

Use seconds as the portable timing source, with frames derived from the chosen rate. At 30 fps, one frame is about 0.0333 s. Nearest-frame alignment uses floor(seconds * fps + 0.5). An interval includes its start and excludes its end; final frame count is ceil(duration * fps). Distinguish a last visible frame from the exclusive ending timestamp.

## Cue relationships

| Cue | Placement relative to the audio/picture |
|---|---|
| Camera arrival | approximately 0.17 s before the important word |
| Reaction/contact | zero to 0.1 s before the stressed word |
| Mouth opening | zero to one frame before the audible syllable |
| Object operation after reveal | about 0.067 s after the camera lands |
| Transition centre | within about 0.067 s of its anchor word |
| Impact SFX | at visible contact/peak, independent of sentence boundaries |
| Whoosh | follow the travel, with peak at the fast crossing/handoff |
| Light/magic accent | reveal the named object's change on its actual beat |

These are perceptual bands. A pause, delayed reaction or unexpected early hit can be an intentional gag. Do not blindly snap every cue to the start of a printed word.

Keep three layers of timing separate: narration/words, picture actions/camera, and sound events. Give repeated words unique occurrence IDs so a cue does not attach to the wrong "then" or "it."

For a useful cue map record: event ID, exact anchor/occurrence, time, action, camera arrival/contact, expression, light/effect, SFX, and confidence. Whole words do not reveal precise phonemes; infer syllables only when necessary, then check by ear.

## Pacing to speech

Do not illustrate every noun with a new cut. Group phrases into complete visual thoughts and connected actions. A mechanism explanation follows its chain of force. A causal phrase shows cause and effect with enough time to recognize both.

Rest on the information while the voice delivers it, with camera creep and motivated acting. Put major motion on the stressed idea, then allow reaction. Build a punchline with anticipation and a small reading pause rather than cramming it into the last few frames.

Clip-duration limits are production constraints, not story beats. Divide a long take at compatible motion/state points, provide transition overlap where possible, and preserve the original absolute audio timing when joining clips. Recheck timing after every generation or edit because generated motion may not obey the requested duration precisely.

## Sound design

After picture timing is stable, give visible impacts, landings, swings, appearances, pops and light flares appropriate sounds. Use an environmental bed appropriate to each place and a restrained whoosh for a fast camera/object move. Do not add a conspicuous sound to every tiny facial gesture.

Choose music for the story's rhythm and emotional arc. It must support the voice and play through the last visible frame without an outro sting. Use sounds you have permission to use and retain necessary credits; disclose generated sound/music when applicable.

Start music roughly 5-10 dB below the voice, then judge intelligibility in every section. Duck music under speech and control sharp SFX independently; do not turn the voice down to make room. Loudness normalization and gain numbers from other recordings are not transferable recipes.

If loudness tools exist, roughly -14 LUFS integrated and true peak at or below -1 dBTP are useful delivery references. Preserve the supplied voice level: if that conflicts with a peak/loudness target, adjust added tracks where possible and report the conflict rather than silently modifying narration. Do not claim a measured loudness result from listening alone.

Mix duration follows the picture and preserves all speech. A 48 kHz audio deliverable is suitable when format control is available; use the strongest supported clean audio encoding. Check dialogue on small speakers/headphones and at low playback volume. Music and SFX must never conceal a syllable or punchline.

The [optional helper](../tools/README.md) maps supplied timestamps and plans review frames. It does not transcribe speech, identify syllables from audio or mix sound.
