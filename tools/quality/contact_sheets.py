"""Optional labelled image-review sheets. Requires Pillow if executed. Review labels are not final-video text."""
import sys, os, re
from PIL import Image, ImageDraw, ImageFont
IMG = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
PAGE = 16

def natkey(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split('(\\d+)', s)]

def font(sz):
    try: return ImageFont.truetype('DejaVuSans.ttf',sz)
    except OSError: return ImageFont.load_default()

def collect(paths):
    out = []
    for p in paths:
        if os.path.isdir(p):
            out += [os.path.join(p, f) for f in sorted(os.listdir(p), key=natkey) if os.path.splitext(f)[1].lower() in IMG]
        else:
            out.append(p)
    return out

def load_flags(path):
    fl = {}
    if path and os.path.exists(path):
        for ln in open(path, encoding='utf8'):
            if ':' in ln and ln.strip():
                k, v = ln.split(':', 1)
                fl[k.strip()] = v.strip()
    return fl

def wrap(d, text, f, maxw):
    lines, cur = ([], '')
    for w in text.split():
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines

def build_sheet(items, title=None, cols=4, width=2400, flagged=None, pad=12):
    ims = [(l, Image.open(p).convert('RGB') if isinstance(p, str) else p.convert('RGB'), n) for l, p, n in items]
    cw = (width - pad * (cols + 1)) // cols
    ar = max((im.height / im.width for _, im, _ in ims))
    ch = round(cw * min(ar, 2.2))
    fs = max(14, cw // 22)
    f = font(fs)
    ff = font(max(14, fs - 2))
    probe = ImageDraw.Draw(Image.new('RGB', (4, 4)))
    cells = []
    for l, im, n in ims:
        s = min(cw / im.width, ch / im.height)
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        cells.append((l, im, wrap(probe, n, ff, cw) if n else []))
    rows = [cells[i:i + cols] for i in range(0, len(cells), cols)]
    rh = [ch + fs + 10 + max((len(c[2]) for c in r), default=0) * (fs + 2) for r in rows]
    head = fs * 2 + 14 if title or flagged is not None else 0
    S = Image.new('RGB', (width, head + sum(rh) + pad * (len(rows) + 1)), (24, 24, 28))
    d = ImageDraw.Draw(S)
    if head:
        hf = font(fs + 6)
        d.text((pad, 8), title or '', font=hf, fill=(240, 240, 240))
        if flagged is not None:
            msg = f'FLAGGED: {flagged}'
            d.text((width - pad - d.textlength(msg, font=hf), 8), msg, font=hf, fill=(255, 70, 70) if flagged else (120, 220, 120))
    y = head + pad
    for r, h in zip(rows, rh):
        for i, (l, im, nl) in enumerate(r):
            x = pad + i * (cw + pad)
            S.paste(im, (x + (cw - im.width) // 2, y + (ch - im.height) // 2))
            d.text((x, y + ch + 4), l, font=f, fill=(235, 235, 235))
            for k, t in enumerate(nl):
                d.text((x, y + ch + fs + 8 + k * (fs + 2)), t, font=ff, fill=(255, 80, 80))
        y += h + pad
    return S

def save_small(S, out, maxb=3000000):
    for sc in (1, 0.85, 0.7, 0.55):
        T = S if sc == 1 else S.resize((round(S.width * sc), round(S.height * sc)), Image.LANCZOS)
        T.save(out, quality=88)
        if os.path.getsize(out) <= maxb:
            break
    return T.size

def main():
    a = sys.argv[1:]
    if len(a) < 2:
        print(__doc__ or 'usage')
        sys.exit(1)
    out, srcs, cols, width, title, flags = (a[0], [], None, 2400, None, None)
    i = 1
    while i < len(a):
        if a[i] == '--cols':
            cols = int(a[i + 1])
            i += 1
        elif a[i] == '--width':
            width = int(a[i + 1])
            i += 1
        elif a[i] == '--title':
            title = a[i + 1]
            i += 1
        elif a[i] == '--flags':
            flags = a[i + 1]
            i += 1
        elif a[i] == '--labels':
            pass
        else:
            srcs.append(a[i])
        i += 1
    files = sorted(collect(srcs), key=lambda p: natkey(os.path.basename(p)))
    if not files:
        print('no images')
        sys.exit(1)
    fl = load_flags(flags)
    if cols is None:
        w, h = Image.open(files[0]).size
        cols = 4 if h > w * 1.2 else 3 if w < h * 1.9 else 2
    items = [(os.path.splitext(os.path.basename(p))[0], p) for p in files]
    items = [(l, p, fl.get(l)) for l, p in items]
    nflag = sum((1 for _, _, n in items if n))
    pages = [items[i:i + PAGE] for i in range(0, len(items), PAGE)]
    base, ext = os.path.splitext(out)
    for k, pg in enumerate(pages):
        S = build_sheet(pg, title=(title or '') + (f'  (page {k + 1}/{len(pages)})' if len(pages) > 1 else ''), cols=cols, width=width, flagged=nflag if flags else None)
        o = out if len(pages) == 1 else f"{base}_p{k + 1}{ext or '.jpg'}"
        print(o, save_small(S, o), os.path.getsize(o) // 1024, 'KB')
if __name__ == '__main__':
    main()
