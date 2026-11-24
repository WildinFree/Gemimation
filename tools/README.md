# Optional timing helper

animation_helpers.py is one dependency-free Python module for any available code-execution environment. It is optional: all creative work can proceed from the guides without it. It does not render video, install software, call an external service or depend on a previous project.

| Function | Input | Result |
|---|---|---|
| audio_info(source) | uploaded PCM WAV file path or binary file object | channels, sample rate, sample count and exact duration |
| timing_map(words, fps=30, duration=None) | supplied word records: word/text, start, end in seconds, optional unique id | occurrence IDs, rounded frames and suggested arrival/reaction windows |
| audit_plan(plan) | the plan format below | structural errors/warnings; never a visual pass |
| review_schedule(plan, every_frame=False) | valid plan | numbered frames/times at take boundaries, keys, risks, transitions and the replay seam |
| smootherstep(u), snap(u) | normalized progress | portable camera-ease and acting-progress curves |

The audio reader accepts PCM WAV only. Other audio formats stay usable by the model's own audio tools; the helper neither converts nor requires conversion. It does not listen, transcribe, detect syllables, measure loudness or invent word timings.

Read or execute the module in the code tool if available. A minimal programmatic use is:

    import animation_helpers as ah
    mapped = ah.timing_map(supplied_word_records, fps=30, duration=audio_duration)
    issues = ah.audit_plan(plan)
    review = ah.review_schedule(plan)

No terminal step is required. The same operations are available through process_request(request), returning a JSON-compatible result. Actions are audio-info (source), timing-map (words, optional fps/duration) and review-plan (plan, optional every_frame). If the file is run as a script, it reads one request as JSON from standard input and writes the result as JSON.

## Plan format

See [timed-beat-plan.json](../examples/timed-beat-plan.json).

- fps: positive frame rate. duration: positive total seconds.
- takes: id, start/end in seconds, optional keyframes (seconds) and risks (start/end ranges).
- transitions: kind, time (centre), duration, optional anchor (audio-word time).
- events: time, nonempty label and optional word_id.
- word_ids: optional list of known IDs from the supplied timing map. Unknown references fail validation; without a table, references are reported as unverified.

Take intervals include their start and exclude their end. They cover the final timeline without gaps or overlapping ownership. Extra generation/compositing overlap sits around their shared boundary; it is not a second owned timeline interval.

The review schedule includes every frame within a transition/risk range, samples each take's first/middle/last, includes its first/last three frames and neighbouring camera keys, and includes the first/last replay frames. every_frame=True returns the full frame list. The selected schedule is a navigation aid and cannot certify unlisted frames.

All times must be finite, in range and in seconds. Repeated word text receives different occurrence IDs. Values are not extrapolated from an assumed speaking rate.

## Limits

These helpers only catch timing/plan structure and arithmetic errors. A valid plan can still have poor staging, broken characters or bad synchronization. Review the actual picture and recording using [06 Quality](../guides/06-quality.md).

## Image and video checks

The [optional quality tools](quality/README.md) preserve contact sheets, picture/motion diagnostics and encoded-video analysis. Use only the capabilities already present in the execution environment. The [browser engines](../code/README.md) provide character drawing, 3D scenes and optional capture.
