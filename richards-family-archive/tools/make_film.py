"""Make the sample 8mm home movie from the upscaled stills.

Usage: python make_film.py --up <dir of upscaled pngs> --site <site dir>

Writes site/media/summer-1976.mp4 (960x540, 24 fps, quiet projector soundtrack),
site/media/summer-1976.vtt (captions), a poster and chapter thumbnails,
and tools/film.json with the movie entry for archive.js.
"""
import argparse
import json
import math
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
W, H, FPS = 960, 540, 24
SR = 44100

# (still id, start s, end s, zoom from, zoom to, pan x from, pan x to, pan y from, pan y to)
SHOTS = [
    ("d03", 1.5, 8.5, 1.04, 1.16, 0.40, 0.58, 0.50, 0.55),
    ("d05", 8.5, 15.5, 1.18, 1.04, 0.50, 0.50, 0.58, 0.48),
    ("d23", 15.5, 22.5, 1.06, 1.14, 0.62, 0.42, 0.55, 0.52),
    ("d09", 22.5, 29.0, 1.05, 1.15, 0.45, 0.55, 0.50, 0.56),
    ("h66", 29.0, 38.0, 1.16, 1.03, 0.55, 0.48, 0.52, 0.50),
    ("d20", 38.0, 46.0, 1.03, 1.15, 0.50, 0.42, 0.45, 0.52),
    ("d12", 46.0, 52.0, 1.12, 1.03, 0.42, 0.56, 0.55, 0.50),
    ("d04", 52.0, 59.0, 1.04, 1.16, 0.38, 0.52, 0.55, 0.60),
    ("m32", 59.0, 67.0, 1.15, 1.04, 0.55, 0.45, 0.50, 0.50),
    ("d19", 67.0, 76.0, 1.03, 1.14, 0.55, 0.62, 0.40, 0.48),
    ("v08", 76.0, 87.0, 1.02, 1.12, 0.45, 0.55, 0.50, 0.48),
    ("v01", 87.0, 94.0, 1.10, 1.02, 0.50, 0.50, 0.55, 0.50),
    ("v02", 94.0, 101.0, 1.03, 1.13, 0.40, 0.55, 0.50, 0.55),
    ("m30", 101.0, 107.0, 1.14, 1.04, 0.52, 0.48, 0.45, 0.50),
    ("v04", 107.0, 113.0, 1.03, 1.15, 0.50, 0.50, 0.48, 0.45),
    ("v03", 113.0, 120.0, 1.12, 1.03, 0.55, 0.45, 0.55, 0.50),
    ("v05", 120.0, 127.0, 1.03, 1.13, 0.45, 0.52, 0.45, 0.42),
    ("d21", 127.0, 136.5, 1.02, 1.12, 0.50, 0.50, 0.50, 0.55),
]
DURATION = 138.0
CHAPTERS = [("The drive", 0.0, "d03"), ("At the cabin", 38.0, "d20"), ("Down by the water", 76.0, "v08")]
CAPTIONS = [
    (2.0, 7.0, "Here we go. The drive up to the lake."),
    (16.0, 21.0, "That van got us everywhere that summer."),
    (39.0, 44.0, "The cabin. Same as it ever was."),
    (53.0, 58.0, "Campfire, first night."),
    (60.0, 66.0, "[Guitar playing]"),
    (77.0, 81.0, "Everybody in!"),
    (81.5, 86.0, "[Laughter and splashing]"),
    (108.0, 112.5, "Even the dog went in."),
    (128.0, 134.0, "Last paddle before dark."),
]


def ease(t):
    return t * t * (3 - 2 * t)


def load_still(up, sid):
    img = Image.open(up / f"{sid}.png").convert("RGB")
    # Cover a 16:9 frame with room to zoom.
    s = max(W * 1.3 / img.width, H * 1.3 / img.height)
    img = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
    return img


def frame_for(img, zoom, px, py, jx, jy):
    # Window that covers the frame at the given zoom, in source pixels.
    base = min(img.width / W, img.height / H)
    win_w, win_h = W * base / zoom, H * base / zoom
    cx = px * img.width
    cy = py * img.height
    x0 = min(max(0, cx - win_w / 2 + jx), img.width - win_w)
    y0 = min(max(0, cy - win_h / 2 + jy), img.height - win_h)
    return img.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + win_w, y0 + win_h))


def vignette():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    d = ((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2
    return np.clip(1.0 - 0.32 * d ** 1.4, 0.45, 1.0)[..., None]


def projector_audio(seconds, rng):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.zeros(n, np.float32)
    # Motor hum.
    out += 0.010 * np.sin(2 * np.pi * 60 * t) + 0.006 * np.sin(2 * np.pi * 120 * t + 0.4)
    # Fan hiss, softly low-passed.
    hiss = rng.normal(0, 1, n).astype(np.float32)
    k = np.ones(24, np.float32) / 24
    out += 0.012 * np.convolve(hiss, k, mode="same")
    # Shutter clatter at 18 frames a second, with spin-up over the first second.
    click = np.exp(-np.linspace(0, 9, int(0.006 * SR))).astype(np.float32)
    pos = 0.15
    while pos < seconds - 0.05:
        rate = 18.0 * min(1.0, 0.35 + pos / 1.2)
        i = int(pos * SR)
        burst = rng.normal(0, 1, click.size).astype(np.float32) * click * (0.05 + 0.015 * rng.random())
        out[i:i + burst.size] += burst[: max(0, n - i)]
        pos += 1.0 / rate * (1 + 0.04 * (rng.random() - 0.5))
    fade = np.minimum(1.0, np.minimum(t / 0.6, (seconds - t) / 1.5)).astype(np.float32)
    out *= np.clip(fade, 0, 1)
    return np.clip(out, -1, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--up", required=True)
    ap.add_argument("--site", required=True)
    args = ap.parse_args()
    up, site = Path(args.up), Path(args.site)
    media = site / "media"
    media.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(1976)
    stills = {sid: load_still(up, sid) for sid, *_ in SHOTS}
    vig = vignette()
    grain_bank = [rng.normal(0, 1.4, (H // 2, W // 2)).astype(np.float32) for _ in range(12)]

    audio = projector_audio(DURATION, rng)
    wav = media / "_audio.raw"
    (np.clip(audio, -1, 1) * 32767).astype("<i2").tofile(wav)

    out_mp4 = media / "summer-1976.mp4"
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", str(wav),
        "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-tune", "film", "-pix_fmt", "yuv420p", "-profile:v", "high",
        "-movflags", "+faststart", "-g", "48",
        "-c:a", "aac", "-b:a", "64k", "-shortest", str(out_mp4),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    total = int(DURATION * FPS)
    weave_x = weave_y = 0.0
    flicker = 1.0
    dust = []
    saved = {}
    for f in range(total):
        t = f / FPS
        shot = next((s for s in SHOTS if s[1] <= t < s[2]), None)
        weave_x = 0.82 * weave_x + rng.normal(0, 0.55)
        weave_y = 0.82 * weave_y + rng.normal(0, 0.75)
        flicker = 0.7 * flicker + 0.3 * (1 + rng.normal(0, 0.035))
        if shot is None:
            # Leader and run-out: dark, flickering, with a warm light leak.
            leak = 0.0
            if t < 1.5:
                leak = max(0.0, math.sin(t / 1.5 * math.pi)) * 0.55
            elif t > 136.5:
                leak = max(0.0, 1 - (t - 136.5) / 1.5) * 0.25
            a = np.zeros((H, W, 3), np.float32)
            a[..., 0] = 255 * leak * flicker
            a[..., 1] = 170 * leak * flicker
            a[..., 2] = 90 * leak * flicker
        else:
            sid, t0, t1, z0, z1, x0, x1, y0, y1 = shot
            p = ease((t - t0) / (t1 - t0))
            img = frame_for(stills[sid], z0 + (z1 - z0) * p, x0 + (x1 - x0) * p, y0 + (y1 - y0) * p, weave_x, weave_y)
            a = np.asarray(img).astype(np.float32)
            # Warm 70s print look: lifted blacks, warm highlights.
            a = a * np.array([1.04, 1.0, 0.92], np.float32) + np.array([10, 6, 2], np.float32)
            a *= flicker
            # Flash frames right after a cut, like a camera starting up.
            since = t - t0
            if since < 2 / FPS:
                a = a * 0.55 + np.array([255, 235, 200], np.float32) * 0.45
            elif since < 4 / FPS:
                a = a * 0.85 + np.array([255, 230, 190], np.float32) * 0.15
            # Fade at the very end.
            if t > 134.5:
                a *= max(0.0, 1 - (t - 134.5) / 2.0)
            if sid not in saved and since > 2.5:
                saved[sid] = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        a *= vig
        g = grain_bank[rng.integers(len(grain_bank))]
        g = np.repeat(np.repeat(g, 2, axis=0), 2, axis=1)
        a += g[..., None]
        # Occasional dust and hairs.
        if rng.random() < 0.06:
            dust.append([rng.integers(0, W), rng.integers(0, H), rng.integers(1, 4), rng.integers(1, 3), rng.random() < 0.5])
        for d in dust:
            x, y, r, life, dark = d
            a[max(0, y - r):y + r, max(0, x - r):x + r] = 25 if dark else 235
            d[3] -= 1
        dust = [d for d in dust if d[3] > 0]
        proc.stdin.write(np.clip(a, 0, 255).astype(np.uint8).tobytes())
    proc.stdin.close()
    proc.wait()
    wav.unlink(missing_ok=True)

    # Poster and chapter thumbnails from the rendered look.
    saved["v08"].save(media / "summer-1976-poster.webp", "WEBP", quality=82)
    for i, (title, start, sid) in enumerate(CHAPTERS):
        thumb = saved[sid].copy()
        thumb.thumbnail((360, 203), Image.LANCZOS)
        thumb.save(media / f"summer-1976-ch{i + 1}.webp", "WEBP", quality=80)

    def ts(s):
        m, sec = divmod(s, 60)
        return f"00:{int(m):02d}:{sec:06.3f}"

    vtt = ["WEBVTT", ""]
    for i, (a, b, text) in enumerate(CAPTIONS, 1):
        vtt += [str(i), f"{ts(a)} --> {ts(b)}", text, ""]
    (media / "summer-1976.vtt").write_text("\n".join(vtt))

    film = [{
        "id": "summer-1976",
        "title": "Summer, on film.",
        "label": "Sample film",
        "date": "July 1976",
        "year": 1976,
        "event": "lake-1976",
        "description": "A weekend at the lake, captured on Dad's 8mm camera. Long days, cold water and even longer laughter.",
        "src": "media/summer-1976.mp4",
        "poster": "media/summer-1976-poster.webp",
        "captions": "media/summer-1976.vtt",
        "duration": DURATION,
        "format": "8mm film",
        "chapters": [
            {"title": title, "start": start, "thumb": f"media/summer-1976-ch{i + 1}.webp"}
            for i, (title, start, _) in enumerate(CHAPTERS)
        ],
        "photos": ["v01", "v02", "v03", "v04", "v05"],
    }]
    (HERE / "film.json").write_text(json.dumps(film, indent=1))
    print("film written", out_mp4, out_mp4.stat().st_size)


if __name__ == "__main__":
    main()
