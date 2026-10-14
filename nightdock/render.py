#!/usr/bin/env python3
"""Tiny software renderer: lit, anti-aliased product shots from STL files.
Usage: render.py out.png WIDTH HEIGHT yaw pitch dist  stl:color[:alpha] ...
Camera orbits the scene centre; +Y is up (the wall is the X-Y plane, Z toward the room)."""
import sys, numpy as np, trimesh
from PIL import Image, ImageFilter

out, W, H = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
yaw, pitch, dist = [float(v) for v in sys.argv[4:7]]
SS = 2                                   # supersampling
W2, H2 = W * SS, H * SS

parts = []
for spec in sys.argv[7:]:
    f, col = spec.split(':')[:2]
    m = trimesh.load(f)
    rgb = np.array([int(col[i:i+2], 16) for i in (0, 2, 4)]) / 255.0
    parts.append((m, rgb))

allv = np.vstack([m.vertices for m, _ in parts])
center = (allv.min(0) + allv.max(0)) / 2
center[1] += float(sys.argv[7].split(':')[2]) if len(sys.argv[7].split(':')) > 2 else 0

def rot(axis, a):
    return trimesh.transformations.rotation_matrix(np.radians(a), axis)[:3, :3]
R = rot([1, 0, 0], -pitch) @ rot([0, 1, 0], yaw + 180)   # world -> camera (camera looks along +z, so turn the scene round)

fov = 28.0
f = (H2 / 2) / np.tan(np.radians(fov / 2))
img = np.ones((H2, W2, 3)) * np.array([0.955, 0.955, 0.95])
zbuf = np.full((H2, W2), np.inf)

key = np.array([-0.45, 0.7, 0.55]); key /= np.linalg.norm(key)
fill = np.array([0.6, 0.2, 0.75]); fill /= np.linalg.norm(fill)
rim = np.array([0.2, -0.3, -0.9]); rim /= np.linalg.norm(rim)

for m, rgb in parts:
    v = (m.vertices - center) @ R.T
    v[:, 2] += dist
    n = (m.face_normals @ R.T)
    tri = v[m.faces]                                  # (F,3,3)
    # back-face cull + simple lighting per face
    view = -tri.mean(1); view /= np.linalg.norm(view, axis=1)[:, None]
    facing = (n * view).sum(1) > 0
    lam = np.clip(n @ key, 0, 1) * 0.9 + np.clip(n @ fill, 0, 1) * 0.35 + np.clip(n @ rim, 0, 1) * 0.3 + 0.22
    half = key + view; half /= np.linalg.norm(half, axis=1)[:, None]
    spec = np.clip((n * half).sum(1), 0, 1) ** 40 * 0.25
    shade = np.clip(lam[:, None] * rgb[None, :] + spec[:, None], 0, 1)
    # project
    px = f * tri[:, :, 0] / tri[:, :, 2] + W2 / 2
    py = -f * tri[:, :, 1] / tri[:, :, 2] + H2 / 2
    pz = tri[:, :, 2]
    for i in np.nonzero(facing)[0]:
        xs, ys, zs = px[i], py[i], pz[i]
        x0, x1 = int(max(np.floor(xs.min()), 0)), int(min(np.ceil(xs.max()), W2 - 1))
        y0, y1 = int(max(np.floor(ys.min()), 0)), int(min(np.ceil(ys.max()), H2 - 1))
        if x1 < x0 or y1 < y0: continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        (ax, ay), (bx, by), (cx, cy) = (xs[0], ys[0]), (xs[1], ys[1]), (xs[2], ys[2])
        det = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay)
        if abs(det) < 1e-9: continue
        l1 = ((bx - gx) * (cy - gy) - (cx - gx) * (by - gy)) / det
        l2 = ((cx - gx) * (ay - gy) - (ax - gx) * (cy - gy)) / det
        l3 = 1 - l1 - l2
        inside = (l1 >= 0) & (l2 >= 0) & (l3 >= 0)
        if not inside.any(): continue
        z = l1 * zs[0] + l2 * zs[1] + l3 * zs[2]
        sub = zbuf[y0:y1 + 1, x0:x1 + 1]
        upd = inside & (z < sub)
        sub[upd] = z[upd]
        img[y0:y1 + 1, x0:x1 + 1][upd] = shade[i]

# soft contact shadow look: darken background slightly under geometry
im = Image.fromarray((img * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
im.save(out)
print('saved', out)
