# Optional image and video diagnostics

These are adapted copies of useful review scripts. They do not require the original project or any model-specific tools. They are optional; use them only when the required capabilities already exist. Otherwise inspect the actual media using available playback/image tools. No installation is part of this skill.

capabilities.available() reports available Pillow, NumPy, ffmpeg and ffprobe support without installing anything.

| Module | Useful interface | Available capability |
|---|---|---|
| contact_sheets.py | build_sheet([(label,image,note), ...], title, cols, width); save_small(image,path) | Pillow |
| picture_analysis.py | load(imagePath), measure(array,light), check(metrics,light,colour) | NumPy + Pillow |
| motion_analysis.py | run(videoOrFrames, fps=30, out=None, show_speeds=False) | NumPy + Pillow; ffmpeg for encoded video |
| video_qa.py | inspect_video(videoPath, outputFolder, metadata=None) | NumPy + Pillow + ffmpeg/ffprobe |

Call these functions inside any available Python runtime. The files also retain simple optional command-line entry points with generic input/output arguments, for runtimes that support them; no fixed directory or terminal workflow is required.

Use the image-analysis sequence load(path) -> measure(rgb, light) -> check(metrics, light, colour). load resizes to 540 pixels wide by 960 high and returns normalized RGB floats. Direct arrays must have shape (960,540,3), finite float values in 0-1; other inputs raise a clear error instead of returning misleading metrics.

Picture diagnostics flag edge density, empty regions, colour, ink share and likely depth/haze imbalance. Their numerical bands are inherited starting points. Judge intentional negative space, night scenes and unusual compositions visually.

Motion analysis uses subpixel phase correlation for translation, finds still spans, abrupt linear motion and missing settles, and heuristically flags unchanged central content. It cannot identify a character reliably. An orbit, zoom or strong parallax can fool it. Frame-duration/speed thresholds are calibrated for 30 fps; use a 30-fps analysis sequence or interpret different rates appropriately. Flags mean inspect this range, never reject/approve automatically.

Video QA checks encoded specs, available audio/loudness/silence measures, every low-resolution decoded frame, luma/saturation, probable black/white/pop/frozen ranges and per-shot colour. It writes numbered contact sheets, a report and numeric per-frame data. These are review artifacts, not final-video captions.

Optional metadata uses frame intervals: shots [{id,a,b}], xfade [[a,b]], planned [[a,b]] and flash [a,b]. Those ranges suppress intended transition/change warnings. Review flags and final output at full resolution; low-resolution statistics cannot see a missing finger, a grip error or an expression's meaning.

No script transcribes narration, invents cues or grants a quality pass.
