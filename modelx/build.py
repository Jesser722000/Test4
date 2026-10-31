#!/usr/bin/env python3
"""Build the 1:24 Nebraska Huskers Model X: one print-in-place piece, four opening doors.

    python3 build.py [voxel_mm]          # default 0.2

Writes STL/3MF parts and preview renders into modelx/out/.  See README.md.
"""
import os, sys, time, json, gc, ctypes


def free_memory():
    """collect, then hand freed heap back to the OS (large numpy temporaries otherwise linger)."""
    gc.collect()
    try:
        ctypes.CDLL('libc.so.6').malloc_trim(0)
    except OSError:
        pass
import numpy as np
import trimesh
from scipy import ndimage
from skimage.measure import marching_cubes
from manifold3d import Manifold, CrossSection

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
    rss = int(open('/proc/self/statm').read().split()[1]) * 4096 / 2 ** 30
    print(f'[{time.time() - T0:7.1f}s {rss:4.1f}G]', *a, flush=True)


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


def mc(field, sb=None, level=0.0013):        # off-zero level: avoids degenerate cases on exact zeros
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
KH.segments = geom.segments(KH, geom.FALCON_SEGS)
KH.z_under = min(KH.o[2], KH.o[2] + KH.a[2] * KH.s1) - 2.2
log('front hinge axis', np.round(FH.o, 2), 'falcon axis', np.round(KH.o, 2), 'slab underside', round(KH.z_under, 2))

# ===================================================================== fields
F = cached('F', lambda: geom.body_field(H))
log('body field', F.shape)

SUB_F = sub((60, 118), (14, 43.2), (12, 71.4))
SUB_K = sub((114, 160), (0, 43.2), (12, 71.4))
D_F = cached('DF', lambda: geom.door_field(F, SUB_F, 'front', FH, H))
D_K = cached('DK', lambda: geom.door_field(F, SUB_K, 'falcon', KH, H))
log('door fields')

OUT_F = sub((55, 122), (0, 43.2), (10, 71.4))
OUT_K = sub((110, 162), (-12, 43.2), (10, 71.4))
S_F = cached('SF', lambda: geom.sweep_field(D_F, SUB_F, FH, OUT_F, H, step=0.5))
S_K = cached('SK', lambda: geom.sweep_field(D_K, SUB_K, KH, OUT_K, H, step=0.75))
log('sweeps')

B = F.copy()
def true_distance(S_):
    """swept field -> exact Euclidean distance to the swept volume (voxel accurate), so the
    clearance gap is its real size whatever the scale of the source field."""
    occ = S_ <= 0
    out = ndimage.distance_transform_edt(~occ, sampling=H) - ndimage.distance_transform_edt(occ, sampling=H)
    return out.astype(np.float32)


S_F = true_distance(S_F)
S_K = true_distance(S_K)
for S_, ob in ((S_F, OUT_F), (S_K, OUT_K)):
    i0, i1, j0, j1, k0, k1 = ob
    g = np.full(S_.shape, geom.G, np.float32)
    if S_ is S_K:      # 0.25 mm extra under the roof slab: its first layer bridges, so give it 3 empty layers
        Xs, Ys, Zs = np.meshgrid(xs[i0:i1], ys[j0:j1], zs[k0:k1], indexing='ij')
        g[(Zs > KH.z_under - 3.5) & (Ys > KH.o[1] + 0.5)] += 0.25
        del Xs, Ys, Zs
    S_ = g - S_
    B[i0:i1, j0:j1, k0:k1] = np.maximum(B[i0:i1, j0:j1, k0:k1], S_)
    jj0, jj1 = NY - j1, NY - j0
    B[i0:i1, jj0:jj1, k0:k1] = np.maximum(B[i0:i1, jj0:jj1, k0:k1], S_[:, ::-1, :])

# ===================================================================== interior
Y_WALL = 8.0
Z_FLOOR = 16.6
DZ_SEAT = 2.0            # seats sit on the higher floor


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
    zc = 22.6 + DZ_SEAT
    cush = rbox(X, Y, Z, (x0 + 5.5, yc, (Z_FLOOR - 1 + zc) / 2), (5.5, 9.0, (zc - Z_FLOOR + 1) / 2), 1.1)
    bolster = rbox(X, Y, Z, (x0 + 5.5, yc, zc), (5.0, 9.0, 0.9), 0.9)
    back = rbox_tilt(X, Y, Z, (x0 + 11.6, yc, 34.6 + DZ_SEAT), (1.7, 9.0, 12.4), 1.2, 12)
    head = rbox(X, Y, Z, (x0 + 14.3, yc, 49.6 + DZ_SEAT), (1.5, 5.2, 2.9), 1.1)
    return vmin(cush, bolster, back, head)


INT_FIELDS = []          # (sub-box, field): cabin surfaces, 1.2 mm deep, for the black interior


def interior(B):
    # front cabin (both sides): footwell under a 45 deg dash, flat bridged headliner
    for side in (+1, -1):
        sb = sub((62, 116), (0, 43.2) if side > 0 else (-43.2, 0), (15, 64))
        i0, i1, j0, j1, k0, k1 = sb
        X, Y, Z = np.meshgrid(xs[i0:i1], ys[j0:j1], zs[k0:k1], indexing='ij')
        AY = np.abs(Y)
        f = F[i0:i1, j0:j1, k0:k1]
        sp = geom.poly_sdf(geom.FRONT_POLY, X[:, 0, :], Z[:, 0, :])[:, None, :]
        x_fw, x_dash, z_ceil = 66.6, 85.0, 59.5
        cav = vmax(f + geom.T + geom.G - 0.25, sp + geom.M, Y_WALL - AY, Z_FLOOR - Z, Z - z_ceil,
                   np.minimum(x_dash, x_fw + (Z - Z_FLOOR)) - X)
        b0 = B[i0:i1, j0:j1, k0:k1]            # body left after the doors' swept clearance
        b = np.maximum(b0, -cav)
        INT_FIELDS.append((sb, (cav - 1.2).astype(np.float32)))
        st = seat(X, AY, Z, 92.5, 21.6)
        if side < 0:       # left-hand drive: -Y is the car's left (Y = up x rearward)
            # steering wheel: a disc leaning back 25 deg whose lower edge grows out of the dash
            t = np.radians(25)
            dx, dz = X - 85.8, Z - 40.6
            lx, lz = dx * np.cos(t) - dz * np.sin(t), dx * np.sin(t) + dz * np.cos(t)
            rim = np.maximum(np.sqrt((Y + 21.6) ** 2 + lz ** 2) - 3.4, np.abs(lx) - 0.55)
            st = np.minimum(st, rim)
        B[i0:i1, j0:j1, k0:k1] = np.minimum(b, np.maximum(st, b0 + 0.6))   # seats stay 0.6 mm clear of every door's swing
    # second row (under the falcon doors)
    for side in (+1, -1):
        sb = sub((114, 160), (0, 43.2) if side > 0 else (-43.2, 0), (15, 68))
        i0, i1, j0, j1, k0, k1 = sb
        X, Y, Z = np.meshgrid(xs[i0:i1], ys[j0:j1], zs[k0:k1], indexing='ij')
        AY = np.abs(Y)
        f = F[i0:i1, j0:j1, k0:k1]
        sp = geom.poly_sdf(geom.FALCON_POLY, X[:, 0, :], Z[:, 0, :])[:, None, :]
        z_top = KH.z_under - 0.1
        z_ch = KH.z_under - 7.0
        cav = vmax(f + geom.T + geom.G - 0.25, sp + geom.M + np.maximum(0, Z - z_ch),
                   Y_WALL - AY, Z_FLOOR - Z, Z - z_top)
        b0 = B[i0:i1, j0:j1, k0:k1]            # body left after the doors' swept clearance
        b = np.maximum(b0, -cav)
        INT_FIELDS.append((sb, (cav - 1.2).astype(np.float32)))
        st = seat(X, AY, Z, 133.5, 21.2)
        B[i0:i1, j0:j1, k0:k1] = np.minimum(b, np.maximum(st, b0 + 0.6))   # seats stay 0.6 mm clear of every door's swing
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
        handle = [(2544, 994), (2690, 994), (2690, 1022), (2544, 1022)]
    else:
        handle = [(2846, 994), (2986, 994), (2986, 1022), (2846, 1022)]
    return carve(D, f, X, Y, Z, 'xz', handle, 0.35, mask=Y > 30)


# the measured skin already carries the lights, intake and shut lines


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
free_memory()
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
del B, K, dF, dK, D_F, D_K, S_F, S_K, body_m, door_f, door_k     # ~2.5 GB of voxels no longer needed
free_memory()

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
WELLS = []
WHEEL_ENV = []           # slightly oversize wheel volumes for the black colour region
for xc, zc, t, tire in ((body.XF / 24, body.ZWF / 24, body.TF / 24, body.TIRE_F), (body.XR / 24, body.ZWR / 24, body.TR / 24, body.TIRE_R)):
    Rt, w = tire['d'] / 2 / 24, tire['w'] / 24
    for side in (+1, -1):
        wl = parts.wheel(xc, zc, side * t, Rt, w, side=side, front=(xc < 100))
        axle = parts.ring(0, 4.2, 0, 4.5).transform(np.array([[1, 0, 0, xc], [0, 0, side, side * (t - w / 2 - 3.6)], [0, -side, 0, zc]], float))
        WHEELS.append(union([wl, axle]))
    # wheel-well liner (black): the arch surfaces, kept just inside the fender's outer face
    ar = (body.ARCH_F if xc < 100 else body.ARCH_R) / 24 + 0.7
    yin = (t * 24 - 175) / 24 - 1.0
    cyl = Manifold.cylinder(40.8 - yin, ar, ar, 96).rotate([-90, 0, 0]).translate([xc, yin, zc])
    WELLS += [cyl, cyl.mirror([0, 1, 0])]
    y0w, y1w = t - w / 2 - 4.2, t + w / 2 + 0.1
    env = Manifold.cylinder(y1w - y0w, Rt + 0.05, Rt + 0.05, 128).rotate([-90, 0, 0]).translate([xc, y0w, zc])
    WHEEL_ENV += [env, env.mirror([0, 1, 0])]
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
Z_DOOR_CUT = geom.Z_SILL / 24 + 0.6
DOOR_F = solid(DOOR_F.trim_by_plane([0, 0, 1], Z_DOOR_CUT), 'front door')
DOOR_K = solid(DOOR_K.trim_by_plane([0, 0, 1], Z_DOOR_CUT), 'falcon door')
BODY = solid(BODY, 'body')

np.save(os.path.join(CACHE, f'meta_{H:.3f}.npy'), np.array([KH.z_under]))
for name, m in (('body', BODY), ('door_front_L', DOOR_F), ('door_falcon_L', DOOR_K)):
    to_trimesh(m).export(os.path.join(CACHE, f'{name}_{H:.3f}.stl'))
log('saved raw parts')


# ---- breakaway print ties: tiny bridges across the door gap so no door can shift or swing
# while it prints (the falcon doors stand on their own for ~250 layers before their roof hinge
# forms).  They sit 0.9-1.5 mm deep in the gap, hidden from outside; the first opening snaps them.
def skin_y(x, z):
    lo, hi = 30.0, 43.2
    for _ in range(40):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if body.sdf(np.array([x * 24]), np.array([mid * 24]), np.array([z * 24]))[0] < 0 else (lo, mid)
    return lo


def tie_box(x0, x1, z0, z1, xc, zc, d0=0.9, d1=1.5):
    ys_ = skin_y(xc, zc)
    return Manifold.cube([x1 - x0, d1 - d0, z1 - z0]).translate([x0, ys_ - d1, z0])


ZS = geom.Z_SILL / 24
ties = []
for xt in (74.0, 104.0, 123.0, 132.0, 139.0):                              # bottom edges, posts up from the sill
    ties.append(tie_box(xt - 0.3, xt + 0.3, ZS + 0.33, ZS + 1.83, xt, ZS + 1.0, 1.0, 1.6))
for xe, sgn, zt in ((113.2, -1, 26.0), (113.2, -1, 40.0), (117.6, 1, 26.0), (117.6, 1, 42.0)):  # B-pillar edges
    a, b_ = sorted((xe + sgn * 0.2, xe + sgn * 1.65))
    ties.append(tie_box(a, b_, zt - 0.2, zt + 0.2, xe + sgn, zt))
(xa_, za_), (xb_, zb_) = geom.FALCON_POLY[7], geom.FALCON_POLY[6]      # C-pillar edge of the falcon door
for zt in (34.0, 41.0):                                                   # falcon rear edge (C-pillar)
    xe = xa_ + (zt - za_) * (xb_ - xa_) / (zb_ - za_)
    ties.append(tie_box(xe - 1.65, xe - 0.2, zt - 0.2, zt + 0.2, xe - 1, zt))
TIES = union(ties)
TIES = union([TIES, TIES.mirror([0, 1, 0])])
to_trimesh(TIES).export(os.path.join(CACHE, f'ties_{H:.3f}.stl'))
BODY = union([BODY, TIES])
log('print ties', len(ties) * 2)

# the colour work does not need sub-0.01 mm detail
BODY, DOOR_F, DOOR_K = (m.simplify(0.015) for m in (BODY, DOOR_F, DOOR_K))
free_memory()


# ===================================================================== colours
# Red paint, black glass / tyres / trim / interior like the real car, white Huskers accents.
STL_DIR = os.environ.get('MX_OUT', os.path.join(HERE, 'stl'))


def skin(xr, yr, zr, depth):
    """the outer `depth` mm of the car's surface inside a box."""
    sb = sub(xr, yr, zr)
    i0, i1, j0, j1, k0, k1 = sb
    f = F[i0:i1, j0:j1, k0:k1]
    return to_manifold(mc(np.maximum(f, -f - depth), sb))


def deep(sb, depth):
    """everything more than `depth` under the car's surface inside a sub-box."""
    i0, i1, j0, j1, k0, k1 = sb
    return to_manifold(mc(F[i0:i1, j0:j1, k0:k1] + depth, sb))


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


def ccw(pts):
    a = np.asarray(pts, float) / 24.0
    area = 0.5 * np.sum(a[:, 0] * np.roll(a[:, 1], -1) - np.roll(a[:, 0], -1) * a[:, 1])
    return a if area > 0 else a[::-1]


def yz_prism(poly, x0, x1):
    """a front/rear-view outline (|y|, z in full-size mm) pushed along x, both sides."""
    m = CrossSection([ccw(poly)]).extrude(x1 - x0).transform(np.array([[0, 0, 1, x0], [1, 0, 0, 0], [0, 1, 0, 0]], float))
    return union([m, m.mirror([0, 1, 0])])


def xz_prism(poly, y0, y1):
    """a side-view outline (x, z in full-size mm) pushed along y from y0 to y1 (y0 < y1)."""
    return CrossSection([ccw(poly)]).extrude(y1 - y0).transform(
        np.array([[1, 0, 0, 0], [0, 0, -1, y1], [0, 1, 0, 0]], float))



def ref_regions(h=0.4):
    """black / white volumes: every point takes the finish of the nearest reference surface
    (glass, black trim, lights or paint)."""
    from scipy.spatial import cKDTree
    R = body.ref_maps()
    gx, gy, gz = geom.axes(h)
    X3, Y3, Z3 = np.meshgrid(gx, gy, gz, indexing='ij')
    pts = np.stack([X3, Y3, Z3], -1).reshape(-1, 3)
    fi = (body.ref_sdf(pts[:, 0] * 24, pts[:, 1] * 24, pts[:, 2] * 24) / 24).reshape(X3.shape)
    del pts
    shell = (fi < 0.6) & (fi > -2.5)                 # classify the skin only...
    P = np.stack([X3[shell], Y3[shell], Z3[shell]], -1)
    db, _ = cKDTree(R['black']).query(P, workers=-1, distance_upper_bound=6.0)
    dw, _ = cKDTree(R['white']).query(P, workers=-1, distance_upper_bound=3.0)
    dp, _ = cKDTree(R['paint']).query(P, workers=-1, distance_upper_bound=6.0)
    db, dw, dp = (np.minimum(d, 10.0) for d in (db, dw, dp))     # misses come back as inf
    fb = np.full(X3.shape, 9.0, np.float32); fw = fb.copy()
    fb[shell] = np.clip(db - np.minimum(dp, dw), -3, 3)
    fw[shell] = np.clip(np.maximum(dw - np.minimum(dp, db), dw - 1.2), -3, 3)
    deep = fi <= -2.5                                # ...and let the inside take the nearest skin's colour
    _, idx = ndimage.distance_transform_edt(~shell, return_indices=True)
    fb[deep] = fb[tuple(i[deep] for i in idx)]
    fw[deep] = 1.0
    del idx
    out = []
    for fld in (fb, fw):
        fld = ndimage.gaussian_filter(fld, 0.6) + 1e-4 * np.sin(np.arange(fld.size, dtype=np.float32).reshape(fld.shape))
        f = np.pad(fld, 1, constant_values=9.0)
        v, fc, _, _ = marching_cubes(f, 0.0137, spacing=(h, h, h))
        v += np.array([gx[0], gy[0], gz[0]]) - h
        out.append(to_manifold(trimesh.Trimesh(v, fc, process=False)))
    return out


WG, HEAD = (m.simplify(0.03) for m in ref_regions())
free_memory()
TRIM = Manifold()
ROT_HOOD = [[0, 1, 0, 33.0], [-1, 0, 0, 0], [0, 0, 1, 0]]          # reads from the front, centred on the hood
ROT_TAIL = [[0, 0, 1, 0], [1, 0, 0, 0], [0, 1, 0, 39.2]]           # reads from behind, on the badge panel
hood_n = parts.text_solid('N', 9.0, ROT_HOOD, 25, 60) ^ skin((26, 40), (-7, 7), (30, 50), 0.8)
tail_t = parts.text_solid('HUSKERS', 4.0, ROT_TAIL, 195, 215, font='DejaVu Sans') ^ skin((196, 212), (-16, 16), (35, 44), 0.7)
roof_skin = skin((110, 165), (-30, 30), (62, 71.4), 0.8)
roof_n = {s_: parts.text_solid('N', 10.0, [[0, -1, 0, 138.0], [1, 0, 0, s_ * 17.0], [0, 0, 1, 0]], 60, 72) ^ roof_skin
          for s_ in (+1, -1)}
UNDER = Manifold.cube([220, 100, 10.0]).translate([-5, -50, -1.0])         # underbody / keel, z < 9
INTERIOR = union([to_manifold(mc(fld, sb)) for sb, fld in INT_FIELDS]).simplify(0.03)
INT_FIELDS.clear()
handle_skin = skin((100, 130), (28, 43.2), (39, 45), 0.9)
HANDLES = {+1: union([xz_prism([(2544, 994), (2690, 994), (2690, 1022), (2544, 1022)], 30, 43.2),
                      xz_prism([(2846, 994), (2986, 994), (2986, 1022), (2846, 1022)], 30, 43.2)]) ^ handle_skin}
HANDLES[-1] = HANDLES[+1].mirror([0, 1, 0])
DEEP = {'front': deep(SUB_F, geom.T - 0.6), 'falcon': deep(SUB_K, geom.T - 0.6)}
# the front hinge sits in a ~2 mm channel at the fender / door seam: make it a dark shut line
SEAM = Manifold.cube([2.6, 7.0, 29.6]).translate([FH.o[0] - 2.8, FH.y_skin - 5.0, 12.6])
SEAM = union([SEAM, SEAM.mirror([0, 1, 0])])
ENG_SKIN = skin((20, 212), (-30, 30), (28, 71.4), 0.5)
del F                    # the body field is not needed past this point
free_memory()
log('colour regions')

DOOR_FR = DOOR_F.mirror([0, 1, 0])
DOOR_KR = DOOR_K.mirror([0, 1, 0])
DOORS = {'front_L': DOOR_F, 'front_R': DOOR_FR, 'falcon_L': DOOR_K, 'falcon_R': DOOR_KR}

# anything that would print as a loose crumb (simplification can pinch off thin slivers) goes
FLOAT = union([p for p in union([BODY] + list(DOORS.values())).decompose() if abs(p.volume()) < 10.0])
if not FLOAT.is_empty():
    log('removing loose crumbs', round(FLOAT.volume(), 3), 'mm3')
    BODY = BODY - FLOAT
    DOORS = {k: d - FLOAT for k, d in DOORS.items()}

def clean(m, min_vol):
    return union([p for p in m.decompose() if abs(p.volume()) > min_vol])


def export(m, path, tol=0.012, min_vol=0.02):
    t = to_trimesh(clean(m.trim_by_plane([0, 0, 1], 0.0).simplify(tol), min_vol))   # flat on the bed at z = 0
    t.export(path)
    return t



os.makedirs(STL_DIR, exist_ok=True)
# one-colour version (manual swap red -> black at the beltline): lettering engraved 0.5 mm
ALL = union([BODY] + list(DOORS.values()))
eng = union([hood_n, tail_t, roof_n[1], roof_n[-1]])
ONE = clean(ALL - (eng ^ ENG_SKIN), 10.0)
log('one-colour solid')
log('one-colour export')
to = export(ONE, os.path.join(STL_DIR, 'modelx_one_color.stl'), min_vol=10.0)
log('one-colour exported')
del ALL, ONE
free_memory()

COLS = ('red', 'white', 'black')
PIECES = {c: [] for c in COLS}


def split(name, part, black, white, red_force=None):
    w = part ^ white
    b = (part ^ black) - w
    if red_force is not None:
        w, b = w - red_force, b - red_force
    r = part - b - w
    for c, m in zip(COLS, (r, w, b)):
        PIECES[c].append(m)
        to_trimesh(m.simplify(0.012)).export(os.path.join(CACHE, f'{name}_{c}_{H:.3f}.stl'))
    log('split', name)


split('body', BODY, union([WG, union(WHEEL_ENV), UNDER, union(WELLS), INTERIOR, TRIM, SEAM]), union([hood_n, tail_t, HEAD]))
for k, d in DOORS.items():
    side = +1 if k.endswith('L') else -1
    dp = DEEP['front' if k.startswith('front') else 'falcon']
    if side < 0:
        dp = dp.mirror([0, 1, 0])
    white = roof_n[side] if k.startswith('falcon') else Manifold()
    # the falcon door's roof section is a fixed glass panel on the real car
    roof_glass = Manifold.cube([36.0, 26.0, 8.0]).translate([120.3, 4.0 if side > 0 else -30.0, 64.8])
    split(f'door_{k}', d, union([WG, dp, HANDLES[side], SEAM] + ([roof_glass] if k.startswith('falcon') else [])), white,
          red_force=parts.mirror_housing(side) if k.startswith('front') else None)


# merge, export and free one colour at a time (the merged volumes are large)
del WG, HEAD, INTERIOR, DEEP, WELLS, WHEEL_ENV
free_memory()
tris, vols = [], []
for c in COLS:
    # the parts never touch (doors sit in their gaps), so concatenating them is enough
    parts_c = [clean(m.trim_by_plane([0, 0, 1], 0.0).simplify(0.012), 0.02) for m in PIECES[c]]
    PIECES[c] = None
    vols.append(sum(p.volume() for p in parts_c) / 1000)
    t = trimesh.util.concatenate([to_trimesh(p) for p in parts_c if not p.is_empty()])
    t.export(os.path.join(STL_DIR, f'modelx_{c}.stl'))
    tris.append(len(t.faces))
    del parts_c, t
    free_memory()
log('colour split  red %.1f  white %.1f  black %.1f cm3' % tuple(vols))
json.dump({'h': H, 'z_under': KH.z_under, 'tris': tris, 'bounds': to.bounds.tolist(), 'cm3': vols},
          open(os.path.join(OUT, 'stats.json'), 'w'), indent=1)
log('exported', tris, len(to.faces), 'bounds', np.round(to.bounds, 2).tolist())
