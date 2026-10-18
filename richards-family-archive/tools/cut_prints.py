"""Cut the sample prints out of the concept mockups, straighten them, and upscale them 4x.

Usage:
  python cut_prints.py --crops crops.json --mockups <dir with decade.png, mobile.png, home.png, movie.png>
                       --out <dir> [--model RealESRGAN_x4plus.pth] [--only id,id,...]

Writes <out>/raw/<id>.png (straightened crop) and <out>/up/<id>.png (upscaled, if a model is given).
"""
import argparse
import json
import math
import os
from pathlib import Path

import cv2
import numpy as np


def cream_mask(img):
    b, g, r = [img[..., i].astype(np.int16) for i in range(3)]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    lum = (r + g + b) / 3
    return (((lum > 165) & ((mx - mn) < 60) & (r >= b - 8)).astype(np.uint8)) * 255


def estimate_tilt(region, box_w, box_h):
    """Median small angle of the long straight border lines around a print, in degrees."""
    mask = cream_mask(region)
    edges = cv2.Canny(mask, 50, 150)
    min_len = int(0.45 * min(box_w, box_h))
    lines = cv2.HoughLinesP(edges, 1, np.pi / 720, threshold=max(20, min_len // 2), minLineLength=min_len, maxLineGap=6)
    if lines is None:
        return 0.0
    angles = []
    for x1, y1, x2, y2 in np.asarray(lines).reshape(-1, 4):
        a = math.degrees(math.atan2(y2 - y1, x2 - x1))
        if a > 90:
            a -= 180
        if a < -90:
            a += 180
        if abs(a) < 8:
            angles.append(a)
        elif abs(abs(a) - 90) < 8:
            angles.append(a - 90 if a > 0 else a + 90)
    if len(angles) < 2:
        return 0.0
    return float(np.median(angles))


def cut(img, box, margin=16):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    H, W = img.shape[:2]
    ex0, ey0 = max(0, x0 - margin), max(0, y0 - margin)
    ex1, ey1 = min(W, x1 + margin), min(H, y1 + margin)
    region = img[ey0:ey1, ex0:ex1]
    ang = estimate_tilt(region, w, h)
    if abs(ang) < 0.5:
        return img[y0:y1, x0:x1].copy(), 0.0
    cx, cy = (x0 + x1) / 2 - ex0, (y0 + y1) / 2 - ey0
    m = cv2.getRotationMatrix2D((cx, cy), ang, 1.0)
    rot = cv2.warpAffine(region, m, (region.shape[1], region.shape[0]), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    trim = math.ceil(abs(math.sin(math.radians(ang))) * min(w, h) * 0.5) + 1
    rx0, ry0 = int(round(cx - w / 2)) + trim, int(round(cy - h / 2)) + trim
    rx1, ry1 = int(round(cx + w / 2)) - trim, int(round(cy + h / 2)) - trim
    return rot[ry0:ry1, rx0:rx1].copy(), ang


def load_upscaler(model_path):
    import torch
    from spandrel import ModelLoader
    torch.set_num_threads(max(1, os.cpu_count() or 1))
    model = ModelLoader().load_from_file(model_path).eval()
    return model


def upscale(model, bgr, tile=192, pad=12):
    import torch
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    H, W = rgb.shape[:2]
    scale = model.scale
    out = np.zeros((H * scale, W * scale, 3), np.float32)
    with torch.inference_mode():
        for ty in range(0, H, tile):
            for tx in range(0, W, tile):
                x0, y0 = max(0, tx - pad), max(0, ty - pad)
                x1, y1 = min(W, tx + tile + pad), min(H, ty + tile + pad)
                t = torch.from_numpy(rgb[y0:y1, x0:x1].transpose(2, 0, 1)).unsqueeze(0)
                r = model(t).squeeze(0).clamp(0, 1).numpy().transpose(1, 2, 0)
                cx0, cy0 = (tx - x0) * scale, (ty - y0) * scale
                cw, ch = (min(W, tx + tile) - tx) * scale, (min(H, ty + tile) - ty) * scale
                out[ty * scale:ty * scale + ch, tx * scale:tx * scale + cw] = r[cy0:cy0 + ch, cx0:cx0 + cw]
    return cv2.cvtColor((out * 255.0 + 0.5).astype(np.uint8), cv2.COLOR_RGB2BGR)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--crops", required=True)
    ap.add_argument("--mockups", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--model")
    ap.add_argument("--only")
    args = ap.parse_args()
    spec = json.loads(Path(args.crops).read_text())
    out = Path(args.out)
    (out / "raw").mkdir(parents=True, exist_ok=True)
    (out / "up").mkdir(parents=True, exist_ok=True)
    only = set(args.only.split(",")) if args.only else None
    imgs = {k: cv2.imread(str(Path(args.mockups) / f"{k}.png")) for k in spec["sources"]}
    model = load_upscaler(args.model) if args.model else None
    report = {}
    for cid, src, box in spec["crops"]:
        if only and cid not in only:
            continue
        crop, ang = cut(imgs[src], box)
        cv2.imwrite(str(out / "raw" / f"{cid}.png"), crop)
        report[cid] = {"angle": round(ang, 2), "size": [crop.shape[1], crop.shape[0]]}
        if model is not None:
            dest = out / "up" / f"{cid}.png"
            if crop.shape[1] > 700:
                big = cv2.resize(crop, (crop.shape[1] * 2, crop.shape[0] * 2), interpolation=cv2.INTER_LANCZOS4)
                cv2.imwrite(str(dest), big)
            else:
                cv2.imwrite(str(dest), upscale(model, crop))
        print(cid, report[cid], flush=True)
    (out / "report.json").write_text(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
