#!/usr/bin/env python3
"""Measure a reference Model X mesh and turn it into the body shape used by the build.

The reference is a public 3D model of a 2021+ Model X (github.com/TariqKichawele/tesla-3D,
public/models/model-x.glb).  It is used only as a measuring tape: this script fetches it,
rasterises its outer skin into smoothed top/bottom height maps and a plan footprint, and
records which surfaces are glass / black trim / headlight.  The mesh itself is not copied
into this project; build.py lofts its own surface from these measurements.

    python3 ref.py            -> writes $MX_CACHE/ref_maps.npz
"""
import os, subprocess, warnings
import numpy as np
import trimesh
from numba import njit
from scipy import ndimage

warnings.filterwarnings('ignore')
CACHE = os.environ.get('MX_CACHE', '/tmp/mx_cache')
SRC = os.path.join(CACHE, 'ref_src')
GLB = os.path.join(SRC, 'tesla-3D', 'public', 'models', 'model-x.glb')
H = 0.2                                     # map resolution, print mm (1:24)

SKIP = {'tyre', 'tyre.bump', 'rims', 'TiresNuts.001', 'Brake disk.001', 'Disk.001', 'interiors', 'mirror'}
BLACK = {'Windows', 'Windows Border Plate.0', 'Gum Separators.001', 'BlackPlastic.001', 'LightAbsorb.001',
         'Chrome', 'RedBackLights.001', 'YellowBackLights.001'}
WHITE = {'WhiteFrontLights.001', 'UpperWhiteFrontLights.', 'Headlights.001', 'FrontBumperLIghtsShiel'}
GLASS = {'Windows'}


def fetch():
    if not os.path.exists(GLB):
        os.makedirs(SRC, exist_ok=True)
        subprocess.run(['git', 'clone', '-q', '--depth', '1', 'https://github.com/TariqKichawele/tesla-3D.git',
                        os.path.join(SRC, 'tesla-3D')], check=True)


def load():
    """triangles in print mm, car axes (X rearward from the nose, Y = up x rearward, Z up), plus material names."""
    s = trimesh.load(GLB)
    tris, mats, nodes = [], [], []
    for node in s.graph.nodes_geometry:
        T, g = s.graph[node]
        m = s.geometry[g]
        name = getattr(getattr(m.visual, 'material', None), 'name', '') or ''
        v = trimesh.transform_points(m.vertices, T)
        tris.append(v[m.faces])
        mats += [name[:22]] * len(m.faces)
        nodes += [node] * len(m.faces)
    P = np.concatenate(tris) * 1000 / 24.0               # metres -> print mm
    # reference: x lateral, y up, z length with the nose at +z
    X = P[..., 2].max() - P[..., 2]
    Y = -P[..., 0]                                        # keep the axes right-handed after flipping X
    Z = P[..., 1] - P[..., 1].min()
    tri = np.stack([X, Y, Z], -1)
    return tri, np.array(mats), np.array(nodes)


@njit(cache=True)
def _raster(tri, h, x0, y0, nx, ny, top, bot):
    for t in range(tri.shape[0]):
        ax, ay, az = tri[t, 0]; bx, by, bz = tri[t, 1]; cx, cy, cz = tri[t, 2]
        i0 = max(int((min(ax, bx, cx) - x0) / h), 0); i1 = min(int((max(ax, bx, cx) - x0) / h) + 1, nx - 1)
        j0 = max(int((min(ay, by, cy) - y0) / h), 0); j1 = min(int((max(ay, by, cy) - y0) / h) + 1, ny - 1)
        det = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay)
        if abs(det) < 1e-12:
            continue
        for i in range(i0, i1 + 1):
            px = x0 + i * h
            for j in range(j0, j1 + 1):
                py = y0 + j * h
                l1 = ((bx - px) * (cy - py) - (cx - px) * (by - py)) / det
                l2 = ((cx - px) * (ay - py) - (ax - px) * (cy - py)) / det
                l3 = 1.0 - l1 - l2
                if l1 < -1e-6 or l2 < -1e-6 or l3 < -1e-6:
                    continue
                z = l1 * az + l2 * bz + l3 * cz
                if z > top[i, j]:
                    top[i, j] = z
                if z < bot[i, j]:
                    bot[i, j] = z


def maps(tri):
    x0, y0 = -1.0, -48.0
    nx, ny = int(214 / H), int(96 / H)
    top = np.full((nx, ny), -1e9); bot = np.full((nx, ny), 1e9)
    _raster(np.ascontiguousarray(tri), H, x0, y0, nx, ny, top, bot)
    return x0, y0, top, bot


def main():
    fetch()
    tri, mats, nodes = load()
    c = tri.mean(1)
    mirror = (c[:, 0] > 64) & (c[:, 0] < 82) & (np.abs(c[:, 1]) > 41.3) & (c[:, 2] > 42) & (c[:, 2] < 54)
    keep = ~np.isin(mats, list(SKIP)) & ~mirror                  # wheels, interior and door mirrors left out
    x0, y0, top, bot = maps(tri[keep])
    # side map: half-width of the skin at every (x, z), seen from the side
    T = tri[keep]
    sideT = np.stack([T[..., 0], T[..., 2], np.abs(T[..., 1])], -1)
    nxz, nzz = int(214 / H), int(76 / H)
    wid = np.full((nxz, nzz), -1e9); dummy = np.full((nxz, nzz), 1e9)
    _raster(np.ascontiguousarray(sideT), H, x0, -2.0, nxz, nzz, wid, dummy)
    foot = top > -1e8
    # symmetric: the reference is meant to be symmetric; average the halves
    foot = foot | foot[:, ::-1]
    top = np.maximum(top, top[:, ::-1]); bot = np.minimum(bot, bot[:, ::-1])
    foot = ndimage.binary_closing(foot, iterations=3)
    foot = ndimage.binary_fill_holes(foot)
    foot = ndimage.binary_opening(foot, iterations=2)
    # smooth the skin a little (panel gaps, badges) but keep the form
    def smooth(a, fill, s):
        a = np.where(foot & (np.abs(a) < 1e8), a, np.nan)
        m = ~np.isnan(a)
        idx = ndimage.distance_transform_edt(~m, return_distances=False, return_indices=True)
        a = a[tuple(idx)]
        return ndimage.gaussian_filter(a, s)
    top = smooth(top, 0, 1.6)
    bot = smooth(bot, 0, 1.6)
    # close slots narrower than ~2 mm (seams between glass and paint that open onto the interior)
    top = np.where(foot, ndimage.grey_closing(top, size=(11, 11)), top)
    bot = np.where(foot, ndimage.grey_opening(bot, size=(11, 11)), bot)
    top, bot = ndimage.gaussian_filter(top, 1.0), ndimage.gaussian_filter(bot, 1.0)
    sfoot = ndimage.binary_fill_holes(ndimage.binary_closing(wid > -1e8, iterations=3))
    w = np.where(sfoot & (wid > -1e8), wid, np.nan)
    m = ~np.isnan(w)
    idx = ndimage.distance_transform_edt(~m, return_distances=False, return_indices=True)
    wid = ndimage.gaussian_filter(w[tuple(idx)], 1.6)
    wid = ndimage.gaussian_filter(np.where(sfoot, ndimage.grey_closing(wid, size=(11, 11)), wid), 1.0)
    sedt = (ndimage.distance_transform_edt(~sfoot) - ndimage.distance_transform_edt(sfoot)) * H
    # material samples for the colour split: points on black / white surfaces
    def samples(sel, n_per_mm2=3.0):
        T = tri[sel]
        a = 0.5 * np.linalg.norm(np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0]), axis=1)
        k = np.random.default_rng(0).poisson(a * n_per_mm2) + 1
        r = np.random.default_rng(1)
        idx = np.repeat(np.arange(len(T)), k)
        u, v = r.random(len(idx)), r.random(len(idx))
        f = u + v > 1
        u[f], v[f] = 1 - u[f], 1 - v[f]
        p = T[idx, 0] + u[:, None] * (T[idx, 1] - T[idx, 0]) + v[:, None] * (T[idx, 2] - T[idx, 0])
        return np.vstack([p, p * [1, -1, 1]]).astype(np.float32)
    blk = samples(np.isin(mats, list(BLACK)) & keep)
    wht = samples(np.isin(mats, list(WHITE)) & keep)
    pnt = samples(np.isin(mats, ['CarPaint', 'Tesla Logo.001', 'BackLightsShield.001', 'Plaque']) & keep, 1.0)
    gls = samples(np.isin(mats, list(GLASS)) & keep, 1.0)
    os.makedirs(CACHE, exist_ok=True)
    np.savez_compressed(os.path.join(CACHE, 'ref_maps.npz'), x0=x0, y0=y0, h=H, top=top.astype(np.float32),
                        wid=wid.astype(np.float32), z0=-2.0, sside=sedt.astype(np.float32),
                        bot=bot.astype(np.float32), foot=foot, black=blk, white=wht, paint=pnt, glass=gls)
    print('ref maps', top.shape, 'footprint x', np.round([x0 + H * np.nonzero(foot.any(1))[0][[0, -1]]], 2),
          'black pts', len(blk), 'white pts', len(wht))


if __name__ == '__main__':
    main()
