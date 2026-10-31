#!/usr/bin/env python3
"""Mechanical checks on the built parts: every door must swing from closed to fully
open without touching the body or the other doors, and must be clear of the body
when closed.  Usage: check.py <cache_dir> <voxel tag>"""
import sys, numpy as np, trimesh
import geom, parts
from parts import to_manifold, to_trimesh

C, tag = sys.argv[1], sys.argv[2]
body = to_manifold(trimesh.load(f'{C}/body_{tag}.stl'))
doors = {'front': (to_manifold(trimesh.load(f'{C}/door_front_L_{tag}.stl')), geom.front_hinge()),
         'falcon': (to_manifold(trimesh.load(f'{C}/door_falcon_L_{tag}.stl')), geom.falcon_hinge())}


def rotated(m, h, th):
    R = h.rot(th)
    t = h.o - R @ h.o
    return m.transform(np.column_stack([R, t]))


kh = doors['falcon'][1]
kh.segments = geom.segments(kh, 9)
# the detent nubs are meant to be pushed aside by the cam lobe: measure contact outside them
nub_zone = parts.union([parts.wedge(parts.NUB_R - 0.1, parts.CAM_HI + 0.1, a - 0.5, b + 0.5, parts.NUB - parts.NUB_HALF - 3, parts.NUB + parts.NUB_HALF + 3)
                        for i, (k, a, b) in enumerate(kh.segments) if i in (1, len(kh.segments) - 2)]).transform(parts.frame(kh))
body_x = {'front': body, 'falcon': body - nub_zone}
for name, (d, h) in doors.items():
    rows = []
    for th in np.arange(0, h.theta_max + 0.01, 1.0):
        v = (rotated(d, h, th) ^ body_x[name]).volume()
        rows.append((th, v))
    if name == 'falcon':
        det = [(th, (rotated(d, h, th) ^ nub_zone ^ body).volume()) for th in np.arange(0, h.theta_max + 0.01, 2.0)]
        on = [t for t, v in det if v > 1e-3]
        print(f'falcon detent: nubs pushed from {min(on):.0f} to {max(on):.0f} deg, free when closed (0 deg) '
              f'and in the open notch ({h.theta_max - 6:.0f}-{h.theta_max:.0f} deg): '
              f'{all(v < 1e-3 for t, v in det if t == 0 or t >= h.theta_max - 6)}')
    bad = [(t, v) for t, v in rows if v > 1e-3]
    gap = d.min_gap(body, 1.0)
    print(f'{name:7s} door (excluding detent nubs): volume {d.volume():8.1f} mm3, closed clearance {gap:.3f} mm, '
          f'interference over sweep: max {max(v for _, v in rows):.4f} mm3 at {max(rows, key=lambda r: r[1])[0]:.0f} deg')
    if bad:
        print('   angles with contact:', ', '.join(f'{t:.0f}:{v:.3f}' for t, v in bad[:12]))
# both falcons open together must not collide
d, h = doors['falcon']
dl = rotated(d, h, h.theta_max)
dr = dl.mirror([0, 1, 0])
print('falcon L vs R fully open overlap:', round((dl ^ dr).volume(), 4))
print('body genus', body.genus(), 'pieces', len(body.decompose()))
