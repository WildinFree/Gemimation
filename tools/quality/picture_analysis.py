"""Optional picture-density, colour and haze diagnostics. Requires NumPy/Pillow. Numerical bands are starting diagnostics, not creative verdicts."""
import os, sys
import numpy as np
from PIL import Image
W, H = (540, 960)
GRID_C, GRID_R = (6, 10)
STRONG, WEAK = (0.08, 0.04)
BANDS = {'edge_share': (0.05, 0.22, 'cal', 'too flat / blurred (low) or noisy (high): few strong edges'), 'empty_lower': (0, 22, 'cal', 'empty cells below the sky rows: bare areas with no edge and no variance'), 'third_top': (0.02, 0.4, 'cal', 'far third has no detail'), 'third_mid': (0.05, 0.5, 'cal', 'middle third has no detail'), 'third_bot': (0.0, 0.4, 'cal', 'near third too busy (a bare or blurred near third is allowed: depth of field, plain floors; see empty_lower)'), 'haze_lift': (-0.05, 0.35, 'cal', 'far band darker or far lighter than the foreground: no distance haze'), 'haze_contrast': (0.3, 2.5, 'cal', 'far band flat against a busy foreground, or the foreground flat (bare lower half)'), 'sat_mean': (0.33, 0.58, 'cal', 'mean saturation (5.6 says .40-.50; house frames run .37-.51)'), 'v_mean': (0.45, 0.72, 'cal', 'mean brightness V (5.6 says .42-.50; house frames run .55-.66)'), 'dark1': (0.008, 0.2, 'cal', 'darkest 1 % luma: crushed to black (low) or lifted / no ink (high). 5.6 says .08-.15 but the plum ink lines put house frames at .02-.035'), 'ink_share': (0.012, 0.1, 'cal', 'plum ink pixels (4.1 says 2-2.6 %; house frames run 2.5-7.7 %): outlines missing (low) or smothering (high)')}
LIGHT_BANDS = {'day': {'y_p50': (0.45, 0.68, 'style', "4.1 day Y' p50 .571"), 'y_p99': (0.75, 1.0, 'cal', "4.1 day Y' p99 .967; house day frames .80-.96"), 'nonink_p5': (0.15, 1.0, 'style', '4.1 non-ink p5 .234: crushed blacks')}, 'golden': {'y_p50': (0.4, 0.62, 'style', "4.1 golden Y' p50 .516"), 'cool_share': (0.15, 0.4, 'style', '4.1 about 25 % violet / blue / magenta / rose (NOT calibrated: no golden frame measured)')}, 'night': {'y_p50': (0.15, 0.34, 'style', "4.1 night Y' p50 .243 (NOT calibrated)")}, 'interior': {'y_p50': (0.3, 0.58, 'cal', "4.1 interior Y' p50 .448; house interiors .36-.54")}}
INK = np.array([36, 23, 38], np.float32)

def load(path):
    im = Image.open(path).convert('RGB')
    if abs(im.width / im.height - 9 / 16) > 0.03:
        print(f'warn {os.path.basename(path)}: {im.width}x{im.height} is not 9:16', file=sys.stderr)
    if im.size != (W, H):
        im = im.resize((W, H), Image.BOX if im.width >= W else Image.BILINEAR)
    return np.asarray(im, np.float32) / 255

def sobel(g):
    p = np.pad(g, 1, mode='edge')
    gx = (p[:-2, 2:] + 2 * p[1:-1, 2:] + p[2:, 2:] - p[:-2, :-2] - 2 * p[1:-1, :-2] - p[2:, :-2]) / 8
    gy = (p[2:, :-2] + 2 * p[2:, 1:-1] + p[2:, 2:] - p[:-2, :-2] - 2 * p[:-2, 1:-1] - p[:-2, 2:]) / 8
    return np.hypot(gx, gy)

def hsv(rgb):
    mx, mn = (rgb.max(-1), rgb.min(-1))
    d = mx - mn
    s = np.where(mx > 0.06, d / np.maximum(mx, 1e-06), 0)
    r, g, b = (rgb[..., 0], rgb[..., 1], rgb[..., 2])
    h = np.zeros_like(mx)
    dd = np.maximum(d, 1e-06)
    h = np.where(mx == r, (g - b) / dd % 6, np.where(mx == g, (b - r) / dd + 2, (r - g) / dd + 4)) * 60
    return (h, s, mx)

def measure(rgb, light=None):
    rgb = np.asarray(rgb)
    if rgb.shape != (H, W, 3) or not np.issubdtype(rgb.dtype, np.floating):
        raise ValueError('Use load(path) first, or supply a 960x540 RGB float array normalized to 0-1')
    if not np.isfinite(rgb).all() or rgb.min() < 0 or rgb.max() > 1:
        raise ValueError('RGB values must be finite and normalized to 0-1')
    y = rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    g = sobel(y)
    m = {}
    m['edge_share'] = float((g > STRONG).mean())
    ch, cw = (H // GRID_R, W // GRID_C)
    empty = []
    for r in range(GRID_R):
        for c in range(GRID_C):
            gs = g[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]
            ys = y[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]
            if (gs > WEAK).mean() < 0.006 and ys.std() < 0.02:
                empty.append((r, c))
    m['empty_cells'] = empty
    m['empty_lower'] = sum((1 for r, c in empty if r >= 3))
    for name, a, b in (('third_top', 0, 1), ('third_mid', 1, 2), ('third_bot', 2, 3)):
        m[name] = float((g[H * a // 3:H * b // 3] > WEAK).mean())
    far, low = (y[int(H * 0.25):int(H * 0.4)], y[H // 2:])
    m['haze_lift'] = float(far.mean() - low.mean())
    m['haze_contrast'] = float(far.std() / max(low.std(), 1e-06))
    h, s, v = hsv(rgb)
    m['sat_mean'] = float(s.mean())
    m['v_mean'] = float(v.mean())
    m['dark1'] = float(np.percentile(y, 1))
    ink = np.sqrt(((rgb * 255 - INK) ** 2).sum(-1)) < 40
    m['ink_share'] = float(ink.mean())
    m['y_p50'] = float(np.percentile(y, 50))
    m['y_p99'] = float(np.percentile(y, 99))
    m['nonink_p5'] = float(np.percentile(y[~ink], 5)) if (~ink).any() else 0.0
    cool = (h >= 240) & (h <= 345) & (s > 0.15) | (h >= 330) & (s > 0.15)
    m['cool_share'] = float(cool.mean())
    return m

def check(m, light, colour=True):
    bands = dict(BANDS)
    if not colour:
        for k in ('sat_mean', 'v_mean', 'dark1'):
            bands.pop(k)
    bands.update(LIGHT_BANDS.get(light, {}) if light else {})
    out = []
    for k, (lo, hi, src, why) in bands.items():
        v = m[k]
        if not lo <= v <= hi:
            out.append((k, v, lo, hi, src, why))
    return out

def main():
    a = sys.argv[1:]
    if not a or a[0] in ('-h', '--help'):
        print(__doc__)
        return
    opt = lambda f: a[a.index(f) + 1] if f in a else None
    out, light, verbose, colour = (opt('--out'), opt('--light'), '--metrics' in a, '--no-colour' not in a)
    skip = {i for f in ('--out', '--light') if f in a for i in (a.index(f), a.index(f) + 1)}
    paths = []
    for i, p in enumerate(a):
        if i in skip or p.startswith('--'):
            continue
        if os.path.isdir(p):
            paths += [os.path.join(p, f) for f in sorted(os.listdir(p)) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
        else:
            paths.append(p)
    if not paths:
        print('no stills given')
        sys.exit(2)
    print(f"density_gate: flag-only, {len(paths)} still(s), light={light or 'day (default bands)'}. A still with no flags is NOT approved.\n")
    lines, nflag = ([], 0)
    for p in paths:
        stem = os.path.splitext(os.path.basename(p))[0]
        m = measure(load(p), light)
        fl = check(m, light, colour)
        msgs = []
        for k, v, lo, hi, src, why in fl:
            if k == 'empty_lower':
                msgs.append(f"{m['empty_lower']} empty cells below the sky (limit {hi}): " + ' '.join((f'r{r}c{c}' for r, c in [e for e in m['empty_cells'] if e[0] >= 3][:10])) + (' ...' if m['empty_lower'] > 10 else ''))
            else:
                msgs.append(f'{k} {v:.3f} outside {lo}-{hi} ({why}; {src})')
        print(f'{stem}: ' + ('FLAG' if msgs else 'no flags'))
        if verbose or msgs:
            print('  ' + '  '.join((f'{k}={m[k]:.3f}' for k in ('edge_share', 'third_top', 'third_mid', 'third_bot', 'haze_lift', 'haze_contrast', 'sat_mean', 'v_mean', 'dark1', 'ink_share', 'y_p50', 'y_p99', 'nonink_p5', 'cool_share'))) + f"  empty={len(m['empty_cells'])}(lower {m['empty_lower']})")
        for s in msgs:
            print('  - ' + s)
        if msgs:
            nflag += 1
            lines.append(f'{stem}: ' + '; '.join(msgs))
    print(f'\n{nflag} of {len(paths)} flagged. Flags mean look here; no flags does not mean approved.')
    if out:
        open(out, 'w', encoding='utf-8').write('\n'.join(lines) + ('\n' if lines else ''))
if __name__ == '__main__':
    main()
