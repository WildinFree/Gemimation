export async function captureCanvas(canvas: HTMLCanvasElement, renderAt: (seconds: number) => void, options: {
  duration: number;
  fps?: number;
  audio?: Blob;
  bitsPerSecond?: number;
}) {
  const fps = options.fps ?? 30;
  if (!(fps > 0) || !Number.isFinite(fps) || !(options.duration > 0) || !Number.isFinite(options.duration)) throw new Error("Positive finite fps/duration required");
  if (!canvas.captureStream || typeof MediaRecorder === "undefined") throw new Error("Canvas recording is unavailable");
  const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(s => MediaRecorder.isTypeSupported(s));
  if (!mimeType) throw new Error("No supported WebM recording format");
  const stream = canvas.captureStream(fps),
    chunks: Blob[] = [];
  let context: AudioContext | undefined, source: AudioBufferSourceNode | undefined;
  let raf = 0;
  try {
    if (options.audio) {
      context = new AudioContext();
      const decoded = await context.decodeAudioData(await options.audio.arrayBuffer());
      source = context.createBufferSource();
      source.buffer = decoded;
      const destination = context.createMediaStreamDestination();
      source.connect(destination);
      destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
      await context.resume();
    }
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: options.bitsPerSecond ?? 12_000_000
    });
    const done = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = event => reject(event);
    });
    recorder.ondataavailable = event => {
      if (event.data.size) chunks.push(event.data);
    };
    renderAt(0);
    recorder.start();
    const start = performance.now();
    source?.start();
    let drawn = 0,
      previous = -1,
      skipped = 0;
    await new Promise<void>((resolve, reject) => {
      const tick = () => {
        try {
          const t = (performance.now() - start) / 1000;
          const frame = Math.min(Math.ceil(options.duration * fps) - 1, Math.floor(t * fps));
          if (frame !== previous) {
            skipped += Math.max(0, frame - previous - 1);
            renderAt(frame / fps);
            drawn++;
            previous = frame;
          }
          if (t >= options.duration) {
            resolve();
            return;
          }
          raf = requestAnimationFrame(tick);
        } catch (error) {
          reject(error);
        }
      };
      tick();
    }).catch(error => {
      recorder.stop();
      throw error;
    });
    recorder.stop();
    await done;
    return {
      blob: new Blob(chunks, {
        type: recorder.mimeType
      }),
      mimeType: recorder.mimeType,
      drawn_frames: drawn,
      expected_frames: Math.ceil(options.duration * fps),
      skipped_steps: skipped,
      timing: "Real-time capture; inspect duration and frame pacing. For exact offline output, render every frame separately."
    };
  } finally {
    cancelAnimationFrame(raf);
    source?.stop();
    stream.getTracks().forEach(track => track.stop());
    await context?.close();
  }
}
