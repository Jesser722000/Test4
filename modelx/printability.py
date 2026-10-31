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
bad = [r for r in float_rows if r[2] is None or r[2] > 0.65]
ok = [r for r in float_rows if not (r[2] is None or r[2] > 0.65)]
print(f'  starting over a 1-3 layer gap (print-in-place, by design): {len(ok)}, total area {sum(r[1] for r in ok):.1f} mm2')
print(f'  floating higher than 3 layers: {len(bad)}')
for z, a, gap, x, y in sorted(bad, key=lambda r: -r[1])[:40]:
    print(f'    z={z:6.2f}  area={a:7.2f} mm2  gap={"none" if gap is None else f"{gap:.1f} mm"}  at x={x:6.1f} y={y:6.1f}')


# ---------------------------------------------------------------- moving parts vs body
# printability.py model.stl [layer] --parts body.stl door1.stl door2.stl ...
# Slices each part on its own and flags places where one part prints directly on top of
# another (fused) or with only one empty layer between them (likely to sag and stick),
# plus same-layer gaps the slicer may close.
if '--parts' in sys.argv:
    names = sys.argv[sys.argv.index('--parts') + 1:]
    P = []
    for n in names:
        mm = trimesh.load(n)
        ss = mm.section_multiplane(plane_origin=[0, 0, 0], plane_normal=[0, 0, 1], heights=zs)
        P.append([polys(s) for s in ss])
    print('\nmoving parts vs body:', ', '.join(n.split('/')[-1] for n in names))
    worst = []
    for a in range(len(P)):
        for b in range(len(P)):
            if a == b:
                continue
            for k in range(2, len(zs)):
                A, A1 = P[a][k], P[a][k - 1]
                if A.is_empty:
                    continue
                fused = A.intersection(P[b][k - 1]).area
                one = A.difference(A1.buffer(0.2)).intersection(P[b][k - 2]).difference(P[b][k - 1]).area
                if fused > 0.05 or one > 0.3:
                    worst.append((zs[k], names[a].split('/')[-1], names[b].split('/')[-1], fused, one))
            if a < b:
                for k in range(len(zs)):
                    A, Bk = P[a][k], P[b][k]
                    if A.is_empty or Bk.is_empty:
                        continue
                    d = A.distance(Bk)
                    if d < 0.25:
                        worst.append((zs[k], names[a].split('/')[-1], names[b].split('/')[-1], -d, 0))
    fz = [w for w in worst if w[3] > 0.05]
    oz = [w for w in worst if w[3] <= 0.05 and w[4] > 0.3]
    xy = [w for w in worst if w[3] < 0]
    print(f'  {len(fz)} layer(s) where a part prints directly on another (fused)')
    print(f'  {len(oz)} layer(s) where an unsupported region sits only one empty layer above another part')
    print(f'  {len(xy)} layer(s) with a same-layer gap under 0.25 mm')
    for z, a_, b_, f_, o_ in sorted(fz + oz, key=lambda w: -(w[3] + w[4]))[:25]:
        print(f'    z={z:6.2f}  {a_} over {b_}: fused {f_:.2f} mm2, one-layer gap {o_:.2f} mm2')
    for z, a_, b_, d_, _ in sorted(xy, key=lambda w: w[3])[:10]:
        print(f'    z={z:6.2f}  {a_} / {b_}: same-layer gap {-d_:.3f} mm')
