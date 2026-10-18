#!/usr/bin/env python3
"""Add scanned photos to the archive.

    python3 tools/add_scans.py ~/Scans/Richards
    python3 tools/add_scans.py ~/Scans/Richards --csv ~/Scans/Richards/photos.csv
    python3 tools/add_scans.py ~/Scans/Richards --csv photos.csv --replace-samples

For every image in the folder (jpg, png, tif, webp, heic if Pillow can read it) this writes
  site/photos/<id>-l.webp   the large version, up to 1600px, for the photo viewer
  site/photos/<id>-s.webp   the thumbnail, 560px on the long side, for collages and grids
and adds the photo to site/data/archive.js, oldest first.

Details come from the CSV when you give one. Columns (only "file" and "year" are needed):
  file, year, date, title, place, event, back
  - date:  how the date should read, e.g. "July 1976" or "Summer 1976" (default "About <year>")
  - event: photos with the same event text are grouped together on their year's page
  - back:  what is written on the back of the print (shown when the print is turned over)
Without a CSV the year is taken from the file name (1976-lake-dock.jpg) and the rest of
the name becomes the title.

--replace-samples removes the sample photos, sample film and sample events first and turns
off the "Sample imagery" labels. Run it once, with your first batch of real scans.

Needs Pillow:  python3 -m pip install pillow
"""
import argparse
import base64
import csv
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
DATA = SITE / "data" / "archive.js"
PHOTOS = SITE / "photos"
EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp", ".bmp", ".heic", ".heif"}
HEADER = (
    "/* The Richards family archive: every photo, home movie, event, and decade the site shows.\n"
    "   Replace the sample entries with real scans; see README.md for the fields. */\n"
)


def load_archive():
    text = DATA.read_text(encoding="utf-8")
    body = text.split("window.ARCHIVE = ", 1)[1].rstrip().rstrip(";")
    return json.loads(body)


def save_archive(archive):
    DATA.write_text(HEADER + "window.ARCHIVE = " + json.dumps(archive, indent=1, ensure_ascii=False) + ";\n", encoding="utf-8")


def slug(text):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or "photo"


def fit(img, long_side):
    w, h = img.size
    s = min(1.0, long_side / max(w, h))
    if s >= 1.0:
        return img.copy()
    return img.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)


def lqip(img):
    t = fit(img, 24)
    buf = io.BytesIO()
    t.save(buf, "WEBP", quality=40)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def tone(img):
    r, g, b = fit(img, 64).resize((1, 1), Image.BOX).getpixel((0, 0))[:3]
    return "#%02x%02x%02x" % (r, g, b)


def is_black_and_white(img):
    data = fit(img, 64).tobytes()
    n = len(data) // 3
    spread = sum(max(data[i:i + 3]) - min(data[i:i + 3]) for i in range(0, n * 3, 3)) / max(1, n)
    return spread < 10


def read_csv(path):
    rows = {}
    with open(path, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            row = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
            if row.get("file"):
                rows[Path(row["file"]).name.lower()] = row
    return rows


def details_for(path, row):
    """Year, date, title and the rest, from the CSV row or the file name."""
    stem = path.stem
    year = None
    if row and row.get("year"):
        m = re.search(r"(18|19|20)\d\d", row["year"])
        year = int(m.group(0)) if m else None
    if year is None:
        m = re.search(r"(18|19|20)\d\d", stem)
        year = int(m.group(0)) if m else None
    if year is None:
        return None
    guess = re.sub(r"(18|19|20)\d\d", " ", stem)
    guess = re.sub(r"[_\-.]+", " ", guess).strip()
    guess = re.sub(r"\s+", " ", guess)
    title = (row or {}).get("title") or (guess[:1].upper() + guess[1:] if guess else f"From {year}")
    date = (row or {}).get("date")
    return {
        "year": year,
        "date": date or f"About {year}",
        "approx": not date,
        "title": title,
        "place": (row or {}).get("place", ""),
        "event_text": (row or {}).get("event", ""),
        "back": (row or {}).get("back", ""),
    }


def main():
    ap = argparse.ArgumentParser(description="Add scanned photos to the Richards family archive.")
    ap.add_argument("folder", help="folder of scanned images")
    ap.add_argument("--csv", help="spreadsheet with a row per photo (file, year, date, title, place, event, back)")
    ap.add_argument("--replace-samples", action="store_true", help="remove the sample photos and film first")
    args = ap.parse_args()

    folder = Path(args.folder).expanduser()
    files = sorted(p for p in folder.iterdir() if p.suffix.lower() in EXTS)
    if not files:
        sys.exit(f"No images found in {folder}")
    rows = read_csv(Path(args.csv).expanduser()) if args.csv else {}

    archive = load_archive()
    if args.replace_samples:
        for p in archive["photos"]:
            for size in ("s", "l"):
                f = PHOTOS / f"{p['id']}-{size}.webp"
                if f.exists():
                    f.unlink()
        archive.update(photos=[], events=[], movies=[], featured={}, sample=False)
        archive.pop("hero", None)

    PHOTOS.mkdir(parents=True, exist_ok=True)
    taken = {p["id"] for p in archive["photos"]}
    events = {e["id"]: e for e in archive["events"]}
    by_text = {e["title"].lower(): e["id"] for e in archive["events"]}
    added = skipped = 0
    for path in files:
        info = details_for(path, rows.get(path.name.lower()))
        if not info:
            print(f"  skipped {path.name}: no year (put it in the file name or the CSV)")
            skipped += 1
            continue
        try:
            img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
        except Exception as e:  # noqa: BLE001 - report and keep going
            print(f"  skipped {path.name}: {e}")
            skipped += 1
            continue
        pid = slug(f"{info['year']}-{info['title']}")[:48]
        base, n = pid, 2
        while pid in taken:
            pid, n = f"{base}-{n}", n + 1
        taken.add(pid)

        large, small = fit(img, 1600), fit(img, 560)
        large.save(PHOTOS / f"{pid}-l.webp", "WEBP", quality=82, method=6)
        small.save(PHOTOS / f"{pid}-s.webp", "WEBP", quality=80, method=6)

        event_id = None
        if info["event_text"]:
            key = info["event_text"].lower()
            event_id = by_text.get(key) or (key if key in events else None)
            if not event_id:
                event_id = slug(f"{info['event_text']}-{info['year']}")
                events[event_id] = {
                    "id": event_id, "year": info["year"], "title": info["event_text"],
                    "date": info["date"], "place": info["place"], "description": "",
                }
                by_text[key] = event_id
        archive["photos"].append({
            "id": pid, "year": info["year"], "date": info["date"], "approx": info["approx"],
            "title": info["title"], "place": info["place"], "event": event_id, "back": info["back"],
            "w": large.size[0], "h": large.size[1],
            "src": f"photos/{pid}-l.webp", "thumb": f"photos/{pid}-s.webp",
            "lqip": lqip(img), "tone": tone(img), "bw": is_black_and_white(img),
        })
        added += 1
        print(f"  added {path.name} -> {pid} ({info['year']})")

    archive["photos"].sort(key=lambda p: (p["year"], p["id"]))
    archive["events"] = sorted(events.values(), key=lambda e: (e["year"], e["id"]))
    known = {d["decade"] for d in archive["decades"]}
    for p in archive["photos"]:
        d = p["year"] // 10 * 10
        if d not in known:
            archive["decades"].append({"decade": d, "tagline": ""})
            known.add(d)
    archive["decades"].sort(key=lambda d: d["decade"])
    save_archive(archive)
    print(f"Done: {added} added, {skipped} skipped, {len(archive['photos'])} photos in the archive.")
    print("Open site/index.html through a local server (npm run serve) to check, then upload the site folder.")


if __name__ == "__main__":
    main()
