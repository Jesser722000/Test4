"""Turn the upscaled sample prints into web images and write site/data/archive.js.

Usage: python export_photos.py --up <dir of upscaled pngs> --site <site dir>

For every photo in tools/photos.json this writes:
  site/photos/<id>-s.webp   small, 560px on the long side, for collages and grids
  site/photos/<id>-l.webp   large, up to 1600px, for the photo viewer
and a tiny blurred preview that is inlined into archive.js so pages paint instantly.
A light film grain is added, stronger for older decades, so the sample prints read as scans.
"""
import argparse
import base64
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent


def grain_amount(year):
    if year < 1960:
        return 7.0
    if year < 1980:
        return 5.5
    if year < 2000:
        return 3.5
    return 2.0


def add_grain(img, sigma, seed):
    rng = np.random.default_rng(seed)
    a = np.asarray(img).astype(np.float32)
    n = rng.normal(0, sigma, a.shape[:2]).astype(np.float32)
    n_img = Image.fromarray(np.clip(n * 4 + 128, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.55))
    n = (np.asarray(n_img).astype(np.float32) - 128) / 4
    a = a + n[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def fit(img, long_side):
    w, h = img.size
    s = min(1.0, long_side / max(w, h))
    if s >= 1.0:
        return img.copy()
    return img.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)


def lqip(img):
    t = img.copy()
    t.thumbnail((24, 24), Image.LANCZOS)
    buf = io.BytesIO()
    t.save(buf, "WEBP", quality=40)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--up", required=True)
    ap.add_argument("--site", required=True)
    args = ap.parse_args()
    spec = json.loads((HERE / "photos.json").read_text())
    up = Path(args.up)
    site = Path(args.site)
    (site / "photos").mkdir(parents=True, exist_ok=True)
    photos = []
    for i, (pid, year, date, approx, title, place, event, back) in enumerate(spec["photos"]):
        src = Image.open(up / f"{pid}.png").convert("RGB")
        g = grain_amount(year)
        large = add_grain(fit(src, 1600), g, 1000 + i)
        small = add_grain(fit(src, 560), g * 0.8, 2000 + i)
        large.save(site / "photos" / f"{pid}-l.webp", "WEBP", quality=80, method=6)
        small.save(site / "photos" / f"{pid}-s.webp", "WEBP", quality=78, method=6)
        rgb = np.asarray(fit(src, 64)).reshape(-1, 3).mean(axis=0)
        photos.append({
            "id": pid, "year": year, "date": date, "approx": approx, "title": title, "place": place,
            "event": event, "back": back, "w": large.size[0], "h": large.size[1],
            "src": f"photos/{pid}-l.webp", "thumb": f"photos/{pid}-s.webp",
            "lqip": lqip(src), "tone": "#%02x%02x%02x" % tuple(int(c) for c in rgb),
            "bw": bool(np.asarray(fit(src, 64)).astype(int).std(axis=2).mean() < 6),
        })
        print(pid, large.size, small.size, flush=True)
    events = [
        {"id": e[0], "year": e[1], "title": e[2], "date": e[3], "place": e[4], "description": e[5]}
        for e in spec["events"]
    ]
    decades = [{"decade": d[0], "tagline": d[1]} for d in spec["decades"]]
    movie_path = HERE / "film.json"
    movies = json.loads(movie_path.read_text()) if movie_path.exists() else []
    archive = {
        "family": "Richards",
        "headline": "A thousand little moments.",
        "subtitle": "Find your place in our story.",
        "subtitleMobile": "Your family, through the years.",
        "sample": True,
        "decades": decades,
        "featured": spec["featured"],
        "events": events,
        "photos": photos,
        "movies": movies,
    }
    out = site / "data" / "archive.js"
    out.parent.mkdir(parents=True, exist_ok=True)
    body = json.dumps(archive, indent=1, ensure_ascii=False)
    out.write_text(
        "/* The Richards family archive: every photo, home movie, event, and decade the site shows.\n"
        "   Replace the sample entries with real scans; see README.md for the fields. */\n"
        "window.ARCHIVE = " + body + ";\n"
    )
    print("wrote", out, len(photos), "photos")


if __name__ == "__main__":
    main()
