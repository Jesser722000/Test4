#!/usr/bin/env python3
"""Small software renderer for product shots of the Model X print (numba z-buffer).

    render(path, parts, yaw, pitch, W=1600, H=1000, dist=None, fov=24)

parts: list of (trimesh.Trimesh, '#rrggbb').  World axes: X toward the rear of
the car, Y to the car's left, Z up.  yaw 0 looks at the car's left side.
"""
import numpy as np, trimesh
from numba import njit
from PIL import Image


@njit(cache=True)
def _raster(px, py, pz, shade, W, H, zbuf, img, fid, base):
    for i in range(px.shape[0]):
        xs = px[i]; ys = py[i]; zs = pz[i]
        x0 = max(int(np.floor(min(xs[0], xs[1], xs[2]))), 0)
        x1 = min(int(np.ceil(max(xs[0], xs[1], xs[2]))), W - 1)
        y0 = max(int(np.floor(min(ys[0], ys[1], ys[2]))), 0)
        y1 = min(int(np.ceil(max(ys[0], ys[1], ys[2]))), H - 1)
        if x1 < x0 or y1 < y0:
            continue
        ax, ay, bx, by, cx, cy = xs[0], ys[0], xs[1], ys[1], xs[2], ys[2]
        det = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay)
        if abs(det) < 1e-12:
            continue
        for yy in range(y0, y1 + 1):
            gy = yy + 0.5
            for xx in range(x0, x1 + 1):
                gx = xx + 0.5
                l1 = ((bx - gx) * (cy - gy) - (cx - gx) * (by - gy)) / det
                l2 = ((cx - gx) * (ay - gy) - (ax - gx) * (cy - gy)) / det
                l3 = 1.0 - l1 - l2
                if l1 < 0 or l2 < 0 or l3 < 0:
                    continue
                z = l1 * zs[0] + l2 * zs[1] + l3 * zs[2]
                if z < zbuf[yy, xx]:
                    zbuf[yy, xx] = z
                    img[yy, xx, 0] = shade[i, 0]
                    img[yy, xx, 1] = shade[i, 1]
                    img[yy, xx, 2] = shade[i, 2]
                    fid[yy, xx] = base + i


def _rot(axis, deg):
    return trimesh.transformations.rotation_matrix(np.radians(deg), axis)[:3, :3]


def render(path, parts, yaw=30.0, pitch=18.0, W=1600, H=1000, dist=None, fov=24.0,
           center=None, ss=2, bg=(0.955, 0.955, 0.95), outline=True):
    W2, H2 = W * ss, H * ss
    allv = np.vstack([m.vertices for m, _ in parts])
    lo, hi = allv.min(0), allv.max(0)
    c = (lo + hi) / 2 if center is None else np.asarray(center, float)
    if dist is None:
        dist = np.linalg.norm(hi - lo) * 1.9
    # camera: start looking along -Y at the car's left side (+Y), then orbit
    R = _rot([1, 0, 0], -pitch) @ np.array([[1, 0, 0], [0, 0, 1], [0, -1, 0]], float) @ _rot([0, 0, 1], -yaw)
    # R maps world->camera with camera looking along +z_cam
    f = (H2 / 2) / np.tan(np.radians(fov / 2))
    img = np.empty((H2, W2, 3), np.float64); img[:] = bg
    zbuf = np.full((H2, W2), np.inf)
    fid = np.full((H2, W2), -1, np.int64)
    key = np.array([-0.45, 0.6, -0.65]); key /= np.linalg.norm(key)
    fill = np.array([0.75, 0.05, -0.65]); fill /= np.linalg.norm(fill)
    base = 0
    for m, col in parts:
        rgb = np.array([int(col[i:i + 2], 16) for i in (1, 3, 5)]) / 255.0
        v = (m.vertices - c) @ R.T
        v[:, 2] += dist
        n = m.face_normals @ R.T
        tri = v[m.faces]
        view = -tri.mean(1); view /= np.linalg.norm(view, axis=1)[:, None]
        facing = (n * view).sum(1) > 0
        lam = np.clip(n @ key, 0, 1) * 0.72 + np.clip(n @ fill, 0, 1) * 0.28 + 0.3
        half = key + view; half /= np.linalg.norm(half, axis=1)[:, None]
        spec = np.clip((n * half).sum(1), 0, 1) ** 30 * 0.18
        shade = np.clip(lam[:, None] * rgb[None, :] + spec[:, None], 0, 1)
        px = -f * tri[:, :, 0] / tri[:, :, 2] + W2 / 2
        py = -f * tri[:, :, 1] / tri[:, :, 2] + H2 / 2
        pz = tri[:, :, 2]
        idx = np.nonzero(facing)[0]
        _raster(np.ascontiguousarray(px[idx]), np.ascontiguousarray(py[idx]), np.ascontiguousarray(pz[idx]),
                np.ascontiguousarray(shade[idx]), W2, H2, zbuf, img, fid, base)
        base += len(m.faces)
    if outline:
        # darken silhouette / depth discontinuities for a crisp look
        z = np.where(np.isfinite(zbuf), zbuf, 1e9)
        dz = np.maximum(np.abs(np.diff(z, axis=0, prepend=z[:1])), np.abs(np.diff(z, axis=1, prepend=z[:, :1])))
        edge = dz > 0.012 * dist
        img[edge] *= 0.35
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
    im.save(path)
    return path
