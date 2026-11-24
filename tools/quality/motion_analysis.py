"""Optional motion flags from video or frame images. Requires NumPy/Pillow, and an available video decoder for video input. Flags are heuristic; no visual approval is implied. Frame thresholds are calibrated at 30 fps."""
import os, subprocess, sys
import numpy as np
from PIL import Image
W, H = (360, 640)
STILL, MOVING = (0.3, 1.5)
LOCAL_DIFF, HOLD_FRAMES = (8, 30)

def read_frames(src):
    if os.path.isdir(src):
        names = sorted((f for f in os.listdir(src) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))))
        if not names:
            sys.exit('no frames in folder')
        for f in names:
            im = Image.open(os.path.join(src, f)).convert('L')
            yield (f, np.asarray(im.resize((W, H), Image.BOX if im.width >= W else Image.BILINEAR), np.float32))
        return
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={W}:{H}', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
    i = 0
    while True:
        b = p.stdout.read(W * H)
        if len(b) < W * H:
            break
        yield (f'{i:05d}', np.frombuffer(b, np.uint8).reshape(H, W).astype(np.float32))
        i += 1

def shift_of(prev, fr, win, box):
    x0, x1, y0, y1 = box
    a, b = (prev[y0:y1, x0:x1], fr[y0:y1, x0:x1])
    A = np.fft.fft2((a - a.mean()) * win)
    B = np.fft.fft2((b - b.mean()) * win)
    R = A.conj() * B
    R /= np.abs(R) + 1e-09
    c = np.fft.ifft2(R).real
    iy, ix = np.unravel_index(np.argmax(c), c.shape)
    hh, ww = c.shape
    c0 = c[iy, ix]
    par = lambda m, q: 0.0 if abs(m - 2 * c0 + q) < 1e-12 else 0.5 * (m - q) / (m - 2 * c0 + q)
    py = iy + par(c[(iy - 1) % hh, ix], c[(iy + 1) % hh, ix])
    px = ix + par(c[iy, (ix - 1) % ww], c[iy, (ix + 1) % ww])
    if py > hh / 2:
        py -= hh
    if px > ww / 2:
        px -= ww
    return (float(px), float(py))

def shift_img(a, dx, dy):
    ix, iy = (int(np.floor(dx)), int(np.floor(dy)))
    fx, fy = (dx - ix, dy - iy)
    r = lambda ox, oy: np.roll(a, (iy + oy, ix + ox), axis=(0, 1))
    return (1 - fy) * ((1 - fx) * r(0, 0) + fx * r(1, 0)) + fy * ((1 - fx) * r(0, 1) + fx * r(1, 1))

def blocks(a, k=8):
    h, w = a.shape
    return a[:h // k * k, :w // k * k].reshape(h // k, k, w // k, k).mean((1, 3))

def quiet_limit(speed):
    return 0.005 + 0.015 * np.minimum(speed, 4)

def rolling_median(a, k=5):
    pad = np.pad(a, k // 2, mode='edge')
    return np.array([np.median(pad[i:i + k]) for i in range(len(a))])

def spans(mask, minlen):
    r, s = ([], None)
    for k, v in enumerate(list(mask) + [False]):
        if v and s is None:
            s = k
        if not v and s is not None:
            if k - s >= minlen:
                r.append((s, k))
            s = None
    return r

def analyse(src):
    x0, x1, y0, y1 = (int(W * 0.1), int(W * 0.9), int(H * 0.1), int(H * 0.9))
    win = np.outer(np.hanning(y1 - y0), np.hanning(x1 - x0))
    box = (x0, x1, y0, y1)
    cx0, cx1, cy0, cy1 = (int(W * 0.25), int(W * 0.75), int(H * 0.25), int(H * 0.75))
    names, sp, loc, full, cut = ([], [], [], [], [])
    prev = None
    for name, fr in read_frames(src):
        names.append(name)
        if prev is None:
            sp.append(np.nan)
            loc.append(np.nan)
            full.append(np.nan)
            cut.append(False)
        else:
            h0 = np.histogram(prev, 32, (0, 256))[0] / prev.size
            h1 = np.histogram(fr, 32, (0, 256))[0] / fr.size
            full.append(float(np.abs(fr - prev).mean()))
            if np.abs(h0 - h1).sum() > 0.45:
                sp.append(np.nan)
                loc.append(np.nan)
                cut.append(True)
            else:
                dx, dy = shift_of(prev, fr, win, box)
                sp.append(2 * float(np.hypot(dx, dy)))
                cut.append(False)
                comp = shift_img(prev, dx, dy)
                d = np.abs(blocks(fr[cy0:cy1, cx0:cx1]) - blocks(comp[cy0:cy1, cx0:cx1]))
                loc.append(float((d > LOCAL_DIFF).mean()))
        prev = fr
    return (names, np.array(sp), np.array(loc), np.array(full), np.array(cut))

def run(src, fps=30, out=None, show_speeds=False):
    names, sp, loc, full, cut = analyse(src)
    n = len(names)
    ok = ~np.isnan(sp)
    flags = []
    sc = np.where(ok, sp, 99)
    for a, b in spans(sc < STILL, 10):
        fd = float(np.nanmean(full[a:b]))
        note = 'the frame is frozen (frame diff %.2f)' % fd if fd < 0.15 else 'no camera translation, but the frame changes (frame diff %.2f): a push-in, an orbit or only the subject moving; verify the camera in the frames' % fd
        flags.append((a, b - 1, 'STILL SPAN', f'STILL SPAN {b - a} frames ({(b - a) / fps:.1f} s) under {STILL} px/f: {note}'))
    sm = np.where(ok, sp, 0)
    for a, b in spans(sm >= MOVING, 12):
        seg = sm[a:b]
        k = max(3, len(seg) // 5)
        mid = seg[k:len(seg) - k]
        if len(mid) < 4:
            continue
        med = float(np.median(mid))
        cv = float(mid.std() / max(mid.mean(), 1e-06))
        if cv >= 0.25:
            continue
        start_ok = a > 0 and ok[a - 1] and (not cut[a])
        end_ok = b < n and bool(ok[b])
        abrupt_in = start_ok and seg[:3].mean() > 0.6 * med
        abrupt_out = end_ok and seg[-3:].mean() > 0.6 * med
        if abrupt_in or abrupt_out:
            what = ' and '.join((w for w, f in (('abrupt start (no ease in)', abrupt_in), ('abrupt stop (no ease out)', abrupt_out)) if f))
            flags.append((a, b - 1, 'LINEAR MOVE', f'LINEAR MOVE {b - a} frames at about {med:.1f} px/f (CV {cv:.2f}): {what}'))
    last = -9
    for i in range(1, n - 3):
        if i <= last:
            continue
        if not (ok[i] and sm[i] >= 6 and (sm[i - 1] >= 0.6 * sm[i])):
            continue
        j = next((j for j in (i + 1, i + 2) if ok[j] and sm[j] < 0.6), None)
        if j is not None and all(ok[i + 1:j + 1]):
            last = j
            flags.append((i, j, 'MISSING SETTLE', f'MISSING SETTLE {sm[i]:.1f} px/f to {sm[j]:.1f} in {j - i} frame(s), no deceleration (ignore if it is an impact kick)'))
    score = np.where(np.isnan(loc), 1.0, loc - quiet_limit(np.where(ok, sp, 0)))
    q2 = rolling_median(score, 5) < 0
    q2 &= ~np.isnan(loc)
    for a, b in spans(q2, HOLD_FRAMES + 1):
        flags.append((a, b - 1, 'CHARACTER HOLD?', f'CHARACTER HOLD? (heuristic) {b - a} frames ({(b - a) / fps:.1f} s) with almost no change in the centre after cancelling camera shift (mean {np.nanmean(loc[a:b]) * 100:.2f} % of pixels): look at who is acting'))
    flags.sort()
    secs = n / fps
    cuts = int(cut.sum())
    stem = os.path.splitext(os.path.basename(src.rstrip('/\\')))[0]
    base = os.path.basename(src.rstrip('/\\'))
    print(f'motion_gate: flag-only. {base}: {n} frames, {secs:.1f} s at {fps:g} fps, {cuts} hard cut(s). Speeds are px/f in 720-wide units (translation analysis). (d) is a heuristic, not a character detector. No flags does not mean approved.')
    if ok.any():
        print(f'camera speed: median {np.nanmedian(sp):.1f}, p90 {np.nanpercentile(sp, 90):.1f}, max {np.nanmax(sp):.1f} px/f; moving (>= 2) {100 * np.nanmean(sp[ok] >= 2):.0f} %')
    if show_speeds:
        print('speeds:', ' '.join(('--' if np.isnan(v) else f'{v:.1f}' for v in sp)))
    lines = []
    for a, b, kind, msg in flags:
        print(f'  f{a}-{b} ({a / fps:.2f}-{(b + 1) / fps:.2f} s)  {msg}')
        fs = os.path.splitext(names[a])[0] if os.path.isdir(src) else f'{stem}_f{a:04d}'
        lines.append(f'{fs}: frames {a}-{b}: {msg}')
    print(f'{len(flags)} flag(s).' if flags else '0 flags (not an approval).')
    if out:
        open(out, 'w', encoding='utf-8').write('\n'.join(lines) + ('\n' if lines else ''))
    return flags
if __name__ == '__main__':
    a = sys.argv[1:]
    if not a or a[0] in ('-h', '--help'):
        print(__doc__)
        sys.exit()
    opt = lambda f: a[a.index(f) + 1] if f in a else None
    run(a[0], float(opt('--fps') or 30), opt('--out'), '--speeds' in a)
