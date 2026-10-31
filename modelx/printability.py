#!/usr/bin/env python3
"""Layer-by-layer printability check (no supports).

For every 0.2 mm layer, find regions that start in mid-air (an island with no
material in the layer below) and measure how far below the nearest material is.
Print-in-place parts are meant to start 0.4 mm (two layers) above the part under
them; anything floating higher than that, or any big unsupported island, is
reported.

    printability.py model.stl [layer]
"""
import sys
import numpy as np
import trimesh
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union

m = trimesh.load(sys.argv[1])
LH = float(sys.argv[2]) if len(sys.argv) > 2 else 0.2
top = m.bounds[1, 2]
zs = np.arange(LH / 2, top, LH)
secs = m.section_multiplane(plane_origin=[0, 0, 0], plane_normal=[0, 0, 1], heights=zs)


def polys(s):
    if s is None:
        return MultiPolygon()
    ps = [p for p in s.polygons_full if p.area > 0.02]
    return unary_union(ps).buffer(0) if ps else MultiPolygon()


L = [polys(s) for s in secs]
float_rows = []
for k in range(1, len(L)):
    cur, below = L[k], L[k - 1]
    if cur.is_empty:
        continue
    geoms = cur.geoms if hasattr(cur, 'geoms') else [cur]
    for g in geoms:
        if g.area < 0.3 or g.intersects(below):
            continue
        # island: how far down is material under its footprint?
        gap = None
        for j in range(k - 1, -1, -1):
            if g.intersects(L[j]):
                gap = (k - j - 1) * LH
                break
        c = g.centroid
        float_rows.append((zs[k], g.area, gap, c.x, c.y))

print(f'{len(L)} layers, {len(float_rows)} islands that start without material directly below')
bad = [r for r in float_rows if r[2] is None or r[2] > 0.45]
ok = [r for r in float_rows if not (r[2] is None or r[2] > 0.45)]
print(f'  starting over a 1-2 layer gap (print-in-place, by design): {len(ok)}, total area {sum(r[1] for r in ok):.1f} mm2')
print(f'  floating higher than 2 layers: {len(bad)}')
for z, a, gap, x, y in sorted(bad, key=lambda r: -r[1])[:40]:
    print(f'    z={z:6.2f}  area={a:7.2f} mm2  gap={"none" if gap is None else f"{gap:.1f} mm"}  at x={x:6.1f} y={y:6.1f}')
