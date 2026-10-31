#!/usr/bin/env python3
"""Build the 1:24 Nebraska Huskers Model X: one print-in-place piece, four opening doors.

    python3 build.py [voxel_mm]          # default 0.2

Writes STL/3MF parts and preview renders into modelx/out/.  See README.md.
"""
import os, sys, time, json
import numpy as np
import trimesh
from scipy import ndimage
from skimage.measure import marching_cubes
from manifold3d import Manifold

import body, geom, parts
from parts import to_manifold, to_trimesh, union

H = float(sys.argv[1]) if len(sys.argv) > 1 else geom.H
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
CACHE = os.environ.get('MX_CACHE', '/tmp/mx_cache')
os.makedirs(OUT, exist_ok=True)
os.makedirs(CACHE, exist_ok=True)
T0 = time.time()


def log(*a):
    print(f'[{time.time() - T0:7.1f}s]', *a, flush=True)


def cached(name, fn):
    f = os.path.join(CACHE, f'{name}_{H:.3f}.npy')
    if os.path.exists(f):
        return np.load(f)
    a = fn()
    np.save(f, a)
    return a


xs, ys, zs = geom.axes(H)
NX, NY, NZ = len(xs), len(ys), len(zs)


def idx(arr, lo, hi):
    return int(np.searchsorted(arr, lo)), int(np.searchsorted(arr, hi))


def sub(xr, yr, zr):
    return idx(xs, *xr) + idx(ys, *yr) + idx(zs, *zr)


def mc(field, sb=None, level=0.0):
    if sb is None:
        sb = (0, NX, 0, NY, 0, NZ)
    i0, i1, j0, j1, k0, k1 = sb
    f = np.pad(field, 1, constant_values=1e3)
    v, fc, _, _ = marching_cubes(f, level, spacing=(H, H, H))
    v += np.array([xs[i0], ys[j0], zs[k0]]) - H
    return trimesh.Trimesh(v, fc, process=False)


def mirror_y(m):
    return m.mirror([0, 1, 0])


# ===================================================================== hinges
FH = geom.front_hinge()
FH.segments = geom.segments(FH, 7)
KH = geom.falcon_hinge()
KH.segments = geom.segments(KH, 9)
KH.z_under = min(KH.o[2], KH.o[2] + KH.a[2] * KH.s1) - 2.2
log('front hinge axis', np.round(FH.o, 2), 'falcon axis', np.round(KH.o, 2), 'slab underside', round(KH.z_under, 2))

# ===================================================================== fields
F = cached('F', lambda: geom.body_field(H))
log('body field', F.shape)

SUB_F = sub((60, 104), (14, 43.2), (10, 71.4))
SUB_K = sub((102, 160), (0, 43.2), (10, 71.4))
D_F = cached('DF', lambda: geom.door_field(F, SUB_F, 'front', FH, H))
D_K = cached('DK', lambda: geom.door_field(F, SUB_K, 'falcon', KH, H))
log('door fields')

OUT_F = sub((55, 108), (0, 43.2), (8, 71.4))
OUT_K = sub((100, 162), (-12, 43.2), (8, 71.4))
S_F = cached('SF', lambda: geom.sweep_field(D_F, SUB_F, FH, OUT_F, H, step=0.5))
S_K = cached('SK', lambda: geom.sweep_field(D_K, SUB_K, KH, OUT_K, H, step=0.75))
log('sweeps')

B = F.copy()
for S_, ob in ((S_F, OUT_F), (S_K, OUT_K)):
    i0, i1, j0, j1, k0, k1 = ob
    B[i0:i1, j0:j1, k0:k1] = np.maximum(B[i0:i1, j0:j1, k0:k1], geom.G - S_)
    jj0, jj1 = NY - j1, NY - j0
    B[i0:i1, jj0:jj1, k0:k1] = np.maximum(B[i0:i1, jj0:jj1, k0:k1], (geom.G - S_)[:, ::-1, :])

# ===================================================================== interior
Y_WALL = 8.0
Z_FLOOR = 14.6


def vmax(*a):
    r = a[0]
    for b in a[1:]:
        r = np.maximum(r, b)
    return r


def vmin(*a):
    r = a[0]
    for b in a[1:]:
        r = np.minimum(r, b)
    return r


def rbox(X, Y, Z, c, he, r):
    q = np.abs(np.stack([X - c[0], Y - c[1], Z - c[2]], -1)) - (np.asarray(he) - r)
    return np.linalg.norm(np.maximum(q, 0), axis=-1) + np.minimum(q.max(-1), 0) - r


def rbox_tilt(X, Y, Z, c, he, r, lean):
    """box leaning back (top toward +x) by `lean` degrees."""
    t = np.radians(lean)
    dx, dz = X - c[0], Z - c[2]
    lx = dx * np.cos(t) - dz * np.sin(t)
    lz = dx * np.sin(t) + dz * np.cos(t)
    return rbox(lx, Y - c[1], lz, (0, 0, 0), he, r)


def seat(X, Y, Z, x0, yc, front=True):
    """forward-facing bucket seat; x0 = front edge of the cushion."""
    cush = rbox(X, Y, Z, (x0 + 5.5, yc, (Z_FLOOR - 1 + 22.6) / 2), (5.5, 9.0, (22.6 - Z_FLOOR + 1) / 2), 1.1)
    bolster = rbox(X, Y, Z, (x0 + 5.5, yc, 22.6), (5.0, 9.0, 0.9), 0.9)
    back = rbox_tilt(X, Y, Z, (x0 + 11.6, yc, 34.6), (1.7, 9.0, 12.4), 1.2, 12)
    head = rbox(X, Y, Z, (x0 + 14.3, yc, 49.6), (1.5, 5.2, 2.9), 1.1)
    return vmin(cush, bolster, back, head)


def interior(B):
    # front cabin (both sides): footwell under a 45 deg dash, flat bridged headliner
    for side in (+1, -1):
        sb = sub((62, 104), (0, 43.2) if side > 0 else (-43.2, 0), (13, 60))
        i0, i1, j0, j1, k0, k1 = sb
        X, Y, Z = np.meshgrid(xs[i0:i1], ys[j0:j1], zs[k0:k1], indexing='ij')
        AY = np.abs(Y)
        f = F[i0:i1, j0:j1, k0:k1]
        sp = geom.poly_sdf(geom.FRONT_POLY, X[:, 0, :], Z[:, 0, :])[:, None, :]
        x_fw, x_dash, z_ceil = 66.6, 79.5, 54.0
        cav = vmax(f + geom.T + geom.G - 0.25, sp + geom.M, Y_WALL - AY, Z_FLOOR - Z, Z - z_ceil,
                   np.minimum(x_dash, x_fw + (Z - Z_FLOOR)) - X)
        b = np.maximum(B[i0:i1, j0:j1, k0:k1], -cav)
        st = seat(X, AY, Z, 84.0, 21.6)
        if side > 0:       # left-hand drive: wheel on the left
            # steering wheel: a disc leaning back 25 deg whose lower edge grows out of the dash
            t = np.radians(25)
            dx, dz = X - 80.3, Z - 37.6
            lx, lz = dx * np.cos(t) - dz * np.sin(t), dx * np.sin(t) + dz * np.cos(t)
            rim = np.maximum(np.sqrt((Y - 21.6) ** 2 + lz ** 2) - 3.4, np.abs(lx) - 0.55)
            st = np.minimum(st, rim)
        B[i0:i1, j0:j1, k0:k1] = np.minimum(b, np.maximum(st, f + 0.6))
    # second row (under the falcon doors)
    for side in (+1, -1):
        sb = sub((102, 160), (0, 43.2) if side > 0 else (-43.2, 0), (13, 66))
        i0, i1, j0, j1, k0, k1 = sb
        X, Y, Z = np.meshgrid(xs[i0:i1], ys[j0:j1], zs[k0:k1], indexing='ij')
        AY = np.abs(Y)
        f = F[i0:i1, j0:j1, k0:k1]
        sp = geom.poly_sdf(geom.FALCON_POLY, X[:, 0, :], Z[:, 0, :])[:, None, :]
        z_top = KH.z_under - 0.1
        z_ch = KH.z_under - 7.0
        cav = vmax(f + geom.T + geom.G - 0.25, sp + geom.M + np.maximum(0, Z - z_ch),
                   Y_WALL - AY, Z_FLOOR - Z, Z - z_top)
        b = np.maximum(B[i0:i1, j0:j1, k0:k1], -cav)
        st = seat(X, AY, Z, 128.6, 21.2)
        B[i0:i1, j0:j1, k0:k1] = np.minimum(b, np.maximum(st, f + 0.6))
    return B


B = interior(B)
log('interior')


# ===================================================================== surface detail
def seg_dist(P, A, Bp):
    """distance from 2-D points P (..., 2) to an open polyline."""
    d = np.full(P.shape[:-1], np.inf)
    for a, b in zip(A[:-1], A[1:]):
        ab = b - a
        t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1)
        d = np.minimum(d, np.linalg.norm(P - (a + t[..., None] * ab), axis=-1))
    return d


def carve(field, f, X, Y, Z, plane, shape, depth, width=None, mask=None):
    """cut a groove (open polyline, width) or recess (closed polygon) `depth` deep into the
    surface, shape given in full-size mm in one projection plane ('xy', 'xz' or 'yz', |y|)."""
    pts = np.asarray(shape, float) / 24.0
    AY = np.abs(Y)
    U = {'xy': (X, AY), 'xz': (X, Z), 'yz': (AY, Z)}[plane]
    P = np.stack(np.broadcast_arrays(*U), -1)
    if width is not None:
        g = seg_dist(P, pts, None) - width / 2
    else:
        from matplotlib.path import Path
        inside = Path(pts).contains_points(P.reshape(-1, 2)).reshape(P.shape[:-1])
        g = seg_dist(P, np.vstack([pts, pts[:1]]), None) * np.where(inside, -1, 1)
    cut = np.maximum(g, -f - depth)
    if mask is not None:
        cut = np.where(mask, cut, 1e3)
    return np.maximum(field, -cut)


def body_details(B):
    # front: headlights, lower intake, corner air curtains, frunk lid
    i0, i1, j0, j1, k0, k1 = sb = sub((-1, 64), (-43.2, 43.2), (6, 46))
    X, Y, Z = np.meshgrid(xs[i0:i1], ys[j0:j1], zs[k0:k1], indexing='ij')
    f = F[i0:i1, j0:j1, k0:k1]
    b = B[i0:i1, j0:j1, k0:k1]
    front = X < 700 / 24
    head = [(545, 708), (620, 742), (770, 790), (900, 812), (955, 796), (948, 756), (830, 726), (640, 700), (560, 694)]
    b = carve(b, f, X, Y, Z, 'yz', head, 0.55, mask=front)
    intake = [(-1, 255), (560, 255), (600, 300), (560, 400), (-1, 400)]
    b = carve(b, f, X, Y, Z, 'yz', intake, 0.9, mask=X < 300 / 24)
    curtain = [(700, 330), (790, 330), (800, 560), (720, 560)]
    b = carve(b, f, X, Y, Z, 'yz', curtain, 0.7, mask=front)
    lid = [(1385, 0), (1385, 700), (900, 650), (420, 600), (240, 560), (205, 300), (200, 0)]
    b = carve(b, f, X, Y, Z, 'xy', lid, 0.4, width=0.42, mask=Z > 24)
    B[i0:i1, j0:j1, k0:k1] = b
    # rear: taillights, liftgate shut lines, diffuser
    i0, i1, j0, j1, k0, k1 = sub((150, 212), (-43.2, 43.2), (8, 70))
    X, Y, Z = np.meshgrid(xs[i0:i1], ys[j0:j1], zs[k0:k1], indexing='ij')
    f = F[i0:i1, j0:j1, k0:k1]
    b = B[i0:i1, j0:j1, k0:k1]
    rear = X > 4780 / 24
    tail = [(390, 1018), (900, 1012), (985, 1050), (960, 1098), (420, 1092)]
    b = carve(b, f, X, Y, Z, 'yz', tail, 0.45, mask=rear)
    gate = [(0, 850), (820, 850), (870, 1000), (880, 1160)]
    b = carve(b, f, X, Y, Z, 'yz', gate, 0.4, width=0.42, mask=rear)
    b = carve(b, f, X, Y, Z, 'xy', [(4255, 0), (4255, 760)], 0.4, width=0.42, mask=Z > 60)
    side = [(4255, 1540), (4600, 1430), (4880, 1250), (4975, 1170)]
    b = carve(b, f, X, Y, Z, 'xz', side, 0.4, width=0.42, mask=(np.abs(Y) > 24) & (X > 175))
    diff = [(-1, 270), (620, 270), (600, 340), (-1, 340)]
    b = carve(b, f, X, Y, Z, 'yz', diff, 0.6, mask=X > 4950 / 24)
    B[i0:i1, j0:j1, k0:k1] = b
    return B


def door_details(D, sb, kind):
    i0, i1, j0, j1, k0, k1 = sb
    X, Y, Z = np.meshgrid(xs[i0:i1], ys[j0:j1], zs[k0:k1], indexing='ij')
    f = F[i0:i1, j0:j1, k0:k1]
    if kind == 'front':
        handle = [(2150, 958), (2290, 958), (2290, 985), (2150, 985)]
    else:
        handle = [(3330, 962), (3470, 962), (3470, 989), (3330, 989)]
    return carve(D, f, X, Y, Z, 'xz', handle, 0.35, mask=Y > 30)


B = body_details(B)
log('surface details')


# ===================================================================== keel
def keel(B, z_cap=15.0):
    """45 deg self-supporting fill under every downward face below z_cap."""
    occ = B < 0
    kt = int(np.searchsorted(zs, z_cap))
    cur = occ[:, :, kt]
    st = np.ones((3, 3), bool)
    add = np.zeros(occ.shape, bool)
    for k in range(kt - 1, -1, -1):
        er = ndimage.binary_erosion(cur, structure=st, border_value=0)
        add[:, :, k] = er & ~occ[:, :, k]
        cur = occ[:, :, k] | er
    return add


K = keel(B)
B = np.where(K, np.minimum(B, -0.5 * H), B)
B[:, :, zs < 0] = np.maximum(B[:, :, zs < 0], 0.5 * H)      # flat on the bed
log('keel voxels', int(K.sum()))

# ===================================================================== meshes
body_m = mc(B)
log('body mesh', len(body_m.faces))
dF = door_details(D_F.copy(), SUB_F, 'front')
dK = door_details(D_K.copy(), SUB_K, 'falcon')
door_f = mc(dF, SUB_F)
door_k = mc(dK, SUB_K)
log('door meshes', len(door_f.faces), len(door_k.faces))

BODY = to_manifold(body_m)
DOOR_F = to_manifold(door_f)
DOOR_K = to_manifold(door_k)

# ---- hinge hardware
hp_f = parts.hinge_parts(FH, cone=1.0)
hp_k = parts.hinge_parts(KH, cone=0.0, teardrop=True, detents=[(1, 3.0), (len(KH.segments) - 2, KH.s1 - 3.0)])
for hp in (hp_f, hp_k):
    BODY = union([BODY, hp['body_add'], hp['body_add'].mirror([0, 1, 0])])
    BODY = BODY - hp['body_sub'] - hp['body_sub'].mirror([0, 1, 0])
    BODY = union([BODY, hp['beams'], hp['beams'].mirror([0, 1, 0])])
DOOR_F = union([DOOR_F, hp_f['door_add']]) - hp_f['door_sub']
DOOR_K = union([DOOR_K, hp_k['door_add']]) - hp_k['door_sub']
log('hinges')

# ---- wheels
WHEELS = []
for xc, zc, t, tire in ((body.XF / 24, body.ZWF / 24, body.TF / 24, body.TIRE_F), (body.XR / 24, body.ZWR / 24, body.TR / 24, body.TIRE_R)):
    Rt, w = tire['d'] / 2 / 24, tire['w'] / 24
    for side in (+1, -1):
        wl = parts.wheel(xc, zc, side * t, Rt, w, side=side, front=(xc < 100))
        axle = parts.ring(0, 4.2, 0, 4.5).transform(np.array([[1, 0, 0, xc], [0, 0, side, side * (t - w / 2 - 3.6)], [0, -side, 0, zc]], float))
        WHEELS.append(union([wl, axle]))
BODY = union([BODY] + WHEELS)
log('wheels')

DOOR_F = union([DOOR_F, parts.mirror_housing(+1)])
log('mirrors')


def solid(m, name):
    """keep the real part, drop sub-mm3 slivers left by the booleans."""
    ps = sorted(m.decompose(), key=lambda p: -abs(p.volume()))
    keep = [p for p in ps if abs(p.volume()) > 1.0]
    if len(keep) < len(ps):
        log(f'{name}: dropped {len(ps) - len(keep)} sliver(s) of {sum(abs(p.volume()) for p in ps[len(keep):]):.4f} mm3')
    return union(keep)


# the door's bottom edge is bevelled to a knife edge at the skin: take off that sliver so it
# can't graze the sill (it is thinner than one extrusion line anyway)
Z_DOOR_CUT = geom.Z_SILL / 24 + 0.35
DOOR_F = solid(DOOR_F.trim_by_plane([0, 0, 1], Z_DOOR_CUT), 'front door')
DOOR_K = solid(DOOR_K.trim_by_plane([0, 0, 1], Z_DOOR_CUT), 'falcon door')
BODY = solid(BODY, 'body')

np.save(os.path.join(CACHE, f'meta_{H:.3f}.npy'), np.array([KH.z_under]))
for name, m in (('body', BODY), ('door_front_L', DOOR_F), ('door_falcon_L', DOOR_K)):
    to_trimesh(m).export(os.path.join(CACHE, f'{name}_{H:.3f}.stl'))
log('saved raw parts')


# ===================================================================== colours
def skin(xr, yr, zr, depth):
    """the outer `depth` mm of the car's surface inside a box."""
    sb = sub(xr, yr, zr)
    i0, i1, j0, j1, k0, k1 = sb
    f = F[i0:i1, j0:j1, k0:k1]
    return to_manifold(mc(np.maximum(f, -f - depth), sb))


def greenhouse_region(h=0.4):
    """volume where the greenhouse (glass) dominates the lower body and lies above the
    beltline: side glass, windshield, roof and rear glass."""
    gx, gy, gz = geom.axes(h)
    W = np.empty((len(gx), len(gy), len(gz)), np.float32)
    Yg, Zg = np.meshgrid(gy * 24, gz * 24, indexing='ij')
    for i, x in enumerate(gx):
        Xg = np.full_like(Yg, x * 24)
        g = (body.greenhouse(Xg, Yg, Zg) - body.lower_body(Xg, Yg, Zg)) / 24
        W[i] = np.maximum(g + 0.25, body.BELT(x * 24) / 24 - gz[None, :])
    f = np.pad(W, 1, constant_values=1e3)
    v, fc, _, _ = marching_cubes(f, 0.0, spacing=(h, h, h))
    v += np.array([gx[0], gy[0], gz[0]]) - h
    return to_manifold(trimesh.Trimesh(v, fc, process=False))


WG = greenhouse_region()
ROT_HOOD = [[0, 1, 0, 53.4], [-1, 0, 0, 0], [0, 0, 1, 0]]          # reads from the front
ROT_TAIL = [[0, 0, 1, 0], [1, 0, 0, 0], [0, 1, 0, 43.3]]           # reads from behind
hood_n = parts.text_solid('N', 9.0, ROT_HOOD, 30, 50) ^ skin((46, 60), (-6, 6), (36, 48), 0.8)
tail_t = parts.text_solid('HUSKERS', 2.8, ROT_TAIL, 195, 215) ^ skin((198, 212), (-12, 12), (40, 47), 0.6)
roof_skin = skin((100, 160), (-30, 30), (62, 71.4), 0.8)
spine_skin = skin((100, 160), (-6, 6), (62, 71.4), 1.5)
roof_n = {s_: parts.text_solid('N', 10.0, [[0, -1, 0, 130.5], [1, 0, 0, s_ * 17.0], [0, 0, 1, 0]], 60, 72) ^ roof_skin
          for s_ in (+1, -1)}
stripe = Manifold.cube([156.5 - 104.0, 2 * 4.95, 12]).translate([104.0, -4.95, 60]) ^ spine_skin
log('decals')

DOOR_FR = DOOR_F.mirror([0, 1, 0])
DOOR_KR = DOOR_K.mirror([0, 1, 0])
DOORS = {'front_L': DOOR_F, 'front_R': DOOR_FR, 'falcon_L': DOOR_K, 'falcon_R': DOOR_KR}

white = [union([(BODY ^ WG) - stripe, BODY ^ hood_n, BODY ^ tail_t])]
red = [BODY - white[0]]
for k, d in DOORS.items():
    side = +1 if k.endswith('L') else -1
    w = d ^ WG
    if k.startswith('falcon'):
        w = w - roof_n[side]
    else:
        w = union([w, d ^ parts.mirror_housing(side)])
    white.append(w)
    red.append(d - w)
    to_trimesh(w.simplify(0.012)).export(os.path.join(CACHE, f'door_{k}_white_{H:.3f}.stl'))
    to_trimesh((d - w).simplify(0.012)).export(os.path.join(CACHE, f'door_{k}_red_{H:.3f}.stl'))
to_trimesh(white[0].simplify(0.012)).export(os.path.join(CACHE, f'body_white_{H:.3f}.stl'))
to_trimesh(red[0].simplify(0.012)).export(os.path.join(CACHE, f'body_red_{H:.3f}.stl'))
RED, WHITE = union(red), union(white)
log('colour split  red %.1f cm3  white %.1f cm3' % (RED.volume() / 1000, WHITE.volume() / 1000))

# one-colour version: same solid, lettering engraved 0.5 mm instead of inlaid
ALL = union([BODY] + list(DOORS.values()))
eng = union([hood_n, tail_t, roof_n[1], roof_n[-1]])
ONE = ALL - (eng ^ skin((40, 212), (-30, 30), (36, 71.4), 0.5))
log('one-colour solid')


def export(m, path, tol=0.012):
    t = to_trimesh(m.trim_by_plane([0, 0, 1], 0.0).simplify(tol))       # flat on the bed at z = 0
    t.export(path)
    return t


os.makedirs(os.path.join(HERE, 'stl'), exist_ok=True)
tr = export(RED, os.path.join(HERE, 'stl', 'modelx_red.stl'))
tw = export(WHITE, os.path.join(HERE, 'stl', 'modelx_white.stl'))
to = export(ONE, os.path.join(HERE, 'stl', 'modelx_one_color.stl'))
for n, m in DOORS.items():
    to_trimesh(m.simplify(0.012)).export(os.path.join(CACHE, f'door_{n}_{H:.3f}.stl'))
to_trimesh(BODY.simplify(0.012)).export(os.path.join(CACHE, f'body_final_{H:.3f}.stl'))
json.dump({'h': H, 'z_under': KH.z_under, 'red_tris': len(tr.faces), 'white_tris': len(tw.faces),
           'bounds': to.bounds.tolist(), 'red_cm3': RED.volume() / 1000, 'white_cm3': WHITE.volume() / 1000},
          open(os.path.join(OUT, 'stats.json'), 'w'), indent=1)
log('exported', len(tr.faces), len(tw.faces), len(to.faces), 'bounds', np.round(to.bounds, 2).tolist())
