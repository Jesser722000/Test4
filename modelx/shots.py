#!/usr/bin/env python3
"""Product shots: shots.py <cache_dir> <voxel tag> <out_dir>"""
import sys, os, numpy as np, trimesh
import geom
from render import render
from PIL import Image

C, tag, O = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(O, exist_ok=True)
RED, WH, BLK = '#c8102e', '#f3efe6', '#262626'
COL = {'red': RED, 'white': WH, 'black': BLK}
def ld(n):
    m = trimesh.load(os.path.join(C, f'{n}_{tag}.stl'))
    return m if isinstance(m, trimesh.Trimesh) and len(m.faces) else None



body = [(ld(f'body_{c}'), COL[c]) for c in COL if ld(f'body_{c}') is not None]
FH, KH = geom.front_hinge(), geom.falcon_hinge()


def mir_h(h):
    return h.mirrored()


def door(k, th):
    h = {'front_L': FH, 'falcon_L': KH, 'front_R': FH.mirrored(), 'falcon_R': KH.mirrored()}[k]
    out = []
    for c, col in COL.items():
        m = ld(f'door_{k}_{c}')
        if m is None:
            continue
        m = m.copy()
        R = h.rot(th * h.theta_max)
        m.vertices = (m.vertices - h.o) @ R.T + h.o
        out.append((m, col))
    return out


def scene(f=0.0, fl=None, fr=None):
    s = list(body)
    for k in ('front_L', 'front_R', 'falcon_L', 'falcon_R'):
        a = f
        if fl is not None and k.endswith('L'): a = fl
        if fr is not None and k.endswith('R'): a = fr
        s += door(k, a)
    return s


shots = {
    'hero': (scene(0), -36, 16, 22),
    'open': (scene(1.0), -36, 18, 24),
    'open_rear': (scene(1.0), -145, 20, 24),
    'open_top': (scene(1.0), -10, 62, 24),
    'side': (scene(0), 0, 0, 10),
    'front': (scene(0), 90, 6, 10),
    'rear': (scene(0), -90, 6, 10),
    'top': (scene(0), 0, 89.9, 10),
}
for n, (sc, yaw, pitch, fov) in shots.items():
    render(os.path.join(O, f'shot_{n}.png'), sc, yaw=yaw, pitch=pitch, W=1600, H=950, fov=fov,
           dist=None if fov > 12 else 1250)
    print('shot', n, flush=True)
