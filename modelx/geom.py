"""Voxel fields for the 1:24 print-in-place Model X.

Everything here is in print millimetres.  The car's outer surface comes from
body.sdf (full-size mm, scaled by 1/24).  Doors are cut out of it as shells;
each door's swept volume (closed -> fully open) is carved out of the body with a
clearance gap, so a door can never hit the body while it moves.

Axes: X rearward from the front bumper, Y to the car's right (Y = up x rearward), Z up,
bed at z = 0.  Doors are modelled on the +Y side (names ending _L) and mirrored.
"""
import numpy as np
from scipy import ndimage
from matplotlib.path import Path
import body

S = 24.0                       # scale 1:24
H = 0.2                        # voxel size

# ------------------------------------------------------------------ clearances
G = 0.50                       # door to body gap (all round; ~0.35+ after meshing)
T = 2.0                        # door skin thickness
M = 1.6                        # jamb flange left round each door opening

# ------------------------------------------------------------------ the grid
X0, X1 = -1.0, 212.0
Y0, Y1 = -43.2, 43.2
Z0, Z1 = -0.6, 71.4


def axes(h=H):
    xs = np.arange(X0, X1 + 1e-9, h)
    ys = np.arange(Y0, Y1 + 1e-9, h)
    zs = np.arange(Z0, Z1 + 1e-9, h)
    return xs, ys, zs


def body_field(h=H):
    xs, ys, zs = axes(h)
    F = np.empty((len(xs), len(ys), len(zs)), np.float32)
    Y, Z = np.meshgrid(ys * S, zs * S, indexing='ij')
    for i, x in enumerate(xs):
        F[i] = body.sdf(np.full_like(Y, x * S), Y, Z) / S
    # make it a true distance near the skin: divide by the gradient length, so that offsets
    # (door thickness, gaps) come out at their real size on every slope
    g2 = np.zeros_like(F)
    for ax in range(3):
        d = np.gradient(F, h, axis=ax)
        g2 += d * d
        del d
    np.sqrt(g2, out=g2)
    np.clip(g2, 0.35, 6.0, out=g2)
    F /= g2
    return F


# ------------------------------------------------------------------ 2-D helpers
def poly_sdf(poly, X, Z):
    """signed distance (negative inside) from points to a closed polygon in the x-z plane."""
    P = np.asarray(poly, float)
    pts = np.stack([X.ravel(), Z.ravel()], 1)
    d = np.full(len(pts), np.inf)
    for a, b in zip(P, np.roll(P, -1, 0)):
        ab = b - a
        t = np.clip(((pts - a) @ ab) / (ab @ ab), 0, 1)
        d = np.minimum(d, np.linalg.norm(pts - (a + t[:, None] * ab), axis=1))
    inside = Path(P).contains_points(pts)
    d[inside] *= -1
    return d.reshape(X.shape)


def arc(cx, cz, r, a0, a1, n=24):
    a = np.radians(np.linspace(a0, a1, n))
    return [(cx + r * np.cos(t), cz + r * np.sin(t)) for t in a]


def p(xr, zr):
    return (xr / S, zr / S)


# ------------------------------------------------------------------ doors
# Side-view outlines (full-size mm, converted).  The falcon outline runs up past
# the roof: its roof panel is bounded by the spine hinge instead.
Z_SILL = 14.6 * 24           # door bottoms sit on the black rocker strip


def q(pts):
    return [(x, z) for x, z in pts]


# Outlines traced from the reference: the front door runs from behind the front arch to the
# B-pillar (x ~113), its top edge follows the window frame; the falcon door runs from the
# B-pillar to the C-pillar, wraps the front of the rear arch and continues over the roof.
FRONT_POLY = q([(64.17, 14.6), (64.17, 45.8), (70, 49.3), (75, 52.6), (80, 55.6), (85, 58.3), (90, 60.6),
                (95, 62.7), (100, 64.0), (105, 65.0), (110, 65.8), (114.4, 66.2), (113.2, 47.0), (113.2, 14.6)])
_rxp, _rzp, _rrp = 164.59, 16.28, 22.1
FALCON_POLY = (q([(117.6, 14.6), (117.6, 47.0), (120.5, 66.4), (120.5, 87.5), (156.25, 87.5), (156.25, 67.17),
                  (153.92, 44.25)]) +
               [(_rxp + _rrp * np.cos(t), _rzp + _rrp * np.sin(t)) for t in np.radians(np.linspace(135, 184.4, 16))])


class Hinge:
    """A hinge line.  a = axis direction, u = 'away from the fixed side', v = outward.
    Opening is a rotation of +theta about a (right hand), which turns u toward v."""

    def __init__(self, origin, a, u, s0, s1, theta_max):
        self.o = np.asarray(origin, float)
        self.a = np.asarray(a, float) / np.linalg.norm(a)
        u = np.asarray(u, float)
        u = u - self.a * (u @ self.a)
        self.u = u / np.linalg.norm(u)
        self.v = np.cross(self.a, self.u)
        self.s0, self.s1, self.theta_max = s0, s1, theta_max

    def local(self, X, Y, Z):
        d = np.stack([X - self.o[0], Y - self.o[1], Z - self.o[2]], -1)
        return d @ self.a, d @ self.u, d @ self.v

    def rot(self, deg):
        """3x3 rotation about the axis direction."""
        t = np.radians(deg)
        a = self.a
        K = np.array([[0, -a[2], a[1]], [a[2], 0, -a[0]], [-a[1], a[0], 0]])
        return np.eye(3) + np.sin(t) * K + (1 - np.cos(t)) * K @ K

    def mirrored(self):
        f = np.array([1, -1, 1.0])
        h = Hinge(self.o * f, -self.a * f, self.u * f, self.s0, self.s1, self.theta_max)
        h.segments = getattr(self, 'segments', None)
        return h


# hinge hardware (print mm)
PIN_R = 1.30          # pin radius (2.6 mm pin)
BORE_R = 1.65         # door knuckle bore (0.35 radial clearance)
RING_R = 2.55         # knuckle outer radius
GAX = 0.35            # axial gap between knuckles
FIN = (215.0, 265.0)  # angular zone (deg from u toward v) of the fixed-side web
FIN_R = 5.2           # web reaches this far out from the axis
KEEP_OUT = (125.0, 275.0)  # door material removed from this zone near the axis
FALCON_SEGS = 7            # knuckles along the falcon hinge


def front_hinge():
    # vertical axis just behind the door's front edge, 3 mm inside the skin
    x_a = 1540 / S + 1.0
    z_mid = 650 / S
    y_skin = float(body.sdf(np.array([x_a * S]), np.array([0.0]), np.array([z_mid * S]))[0])  # placeholder
    # find skin y at (x_a, z_mid) by bisection
    lo, hi = 30.0, 43.0
    for _ in range(40):
        mid = (lo + hi) / 2
        f = body.sdf(np.array([x_a * S]), np.array([mid * S]), np.array([z_mid * S]))[0]
        lo, hi = (mid, hi) if f < 0 else (lo, mid)
    y_skin = lo
    h = Hinge((x_a, y_skin - 3.0, 0.0), (0, 0, 1), (1, 0, 0), 15.4, 43.4, 72.0)
    h.y_skin = y_skin
    return h


def falcon_hinge():
    # along the roof spine, 3 mm under the roof at the ends of the door
    yh = 5.2
    def roof(xp):
        return float(body.ref_top(np.array([xp]), np.array([yh]))[0])
    xa, xb = 120.5 + 1.2, 156.25 - 1.2
    za, zb = roof(xa) - 3.0, roof(xb) - 3.0
    a = np.array([xb - xa, 0, zb - za])
    h = Hinge((xa, yh, za), a, (0, 1, 0), 0.0, np.linalg.norm(a), 80.0)
    return h


def segments(h, n, lead_tab=True):
    """split the hinge length into n alternating segments: 'tab' (body) and 'door'."""
    edges = np.linspace(h.s0, h.s1, n + 1)
    kinds = ['tab' if (i % 2 == 0) == lead_tab else 'door' for i in range(n)]
    return list(zip(kinds, edges[:-1], edges[1:]))


def angle_in(phi, zone):
    a, b = np.radians(zone[0]), np.radians(zone[1])
    ph = np.mod(phi - a, 2 * np.pi)
    return ph <= (b - a)


def door_field(F, sub, kind, hinge, h=H):
    """door shell field on the sub-grid `sub` = (i0, i1, j0, j1, k0, k1) of the global grid."""
    xs, ys, zs = axes(h)
    i0, i1, j0, j1, k0, k1 = sub
    X, Y, Z = np.meshgrid(xs[i0:i1], ys[j0:j1], zs[k0:k1], indexing='ij')
    f = F[i0:i1, j0:j1, k0:k1]
    poly = FRONT_POLY if kind == 'front' else FALCON_POLY
    sp = poly_sdf(poly, X[:, 0, :], Z[:, 0, :])[:, None, :]
    s, du, dv = hinge.local(X, Y, Z)
    r = np.sqrt(du ** 2 + dv ** 2)
    phi = np.arctan2(dv, du)
    if kind == 'front':
        shell = np.maximum(f, -f - T)
        # thick hinge strip at the front edge, reaching 3 mm past the axis
        strip = np.maximum.reduce([f, du - 4.5, -du - 2.0, -dv - 3.0, (hinge.s0 - 0.4) - Z, Z - (hinge.s1 + 0.2)])
        D = np.minimum(shell, strip)
        D = np.maximum(D, sp - f)                       # outline, bevelled 45 deg with depth
        D = np.maximum(D, 25.0 - Y)                     # the front door is only the outer skin...
        arcd = np.minimum(-du, r - 3.0)                  # nothing ahead of the axis beyond r = 3
        D = np.maximum(D, arcd)
    else:
        z_under = hinge.z_under
        # flat bridged underside, plus a 45 deg keel along its inboard edge so the bridge
        # lines are anchored on both sides (the keel grows from a single line over the spine)
        keel = np.maximum(0.0, 2.0 - np.abs(Y - 7.5))
        slab = np.maximum(f, z_under - keel - Z)
        D = np.minimum(np.maximum(f, -f - T), slab)
        D = np.maximum(D, sp - f)
        arcd = np.minimum(-du, r - 3.0)                  # inboard of the axis only within r = 3
        D = np.maximum(D, arcd)
    # clear the hinge core: a tunnel round the axis and the fixed-side web zone
    in_len = (s > hinge.s0 - 0.5) & (s < hinge.s1 + 0.5)
    tunnel = np.where(in_len, (RING_R + G) - r, -1e3)
    for kd, a, b in hinge.segments:
        if kd == 'door':
            m = (s > a + GAX) & (s < b - GAX)
            tunnel = np.where(m, 2.0 - r, tunnel)
    D = np.maximum(D, tunnel)
    keep = in_len & angle_in(phi, KEEP_OUT) & (r < FIN_R + 0.6)
    D = np.where(keep, np.maximum(D, 0.3), D)
    return D.astype(np.float32)


def sweep_field(D, sub, hinge, sub_out, h=H, step=1.0):
    """min over opening angles of the door field, sampled on sub-grid `sub_out`."""
    xs, ys, zs = axes(h)
    i0, i1, j0, j1, k0, k1 = sub
    o0, o1, p0, p1, q0, q1 = sub_out
    X, Y, Z = np.meshgrid(xs[o0:o1], ys[p0:p1], zs[q0:q1], indexing='ij')
    P = np.stack([X, Y, Z], -1).reshape(-1, 3) - hinge.o
    out = np.full(P.shape[0], 1e3, np.float32)
    org = np.array([xs[i0], ys[j0], zs[k0]])
    for th in np.arange(0.0, hinge.theta_max + 3.0 + 1e-6, step):      # 3 deg past full open for margin
        Rm = hinge.rot(-th)                 # world point -> door frame at angle th
        q = P @ Rm.T + hinge.o
        idx = ((q - org) / h).T
        v = ndimage.map_coordinates(D, idx, order=1, mode='constant', cval=1e3)
        np.minimum(out, v, out=out)
    return out.reshape(X.shape)
