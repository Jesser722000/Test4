"""Explicit (exact) solids: hinge hardware, wheels, mirrors, lettering.

Built with manifold3d.  Hinge parts are made in a canonical frame (axis = +Z,
u = +X, v = +Y, angles measured from u toward v) and moved onto each hinge.
"""
import numpy as np
import trimesh
from manifold3d import Manifold, Mesh, CrossSection, OpType
import geom

SEG = 64


def to_manifold(tm):
    m = Manifold(Mesh(vert_properties=np.asarray(tm.vertices, np.float32),
                      tri_verts=np.asarray(tm.faces, np.uint32)))
    if m.status().name != 'NoError':
        raise ValueError(f'mesh is not a manifold: {m.status()}')
    return m


def to_trimesh(m):
    me = m.to_mesh()
    return trimesh.Trimesh(np.array(me.vert_properties)[:, :3], np.array(me.tri_verts), process=False)


def union(ms):
    ms = [m for m in ms if m is not None and not m.is_empty()]
    return Manifold.batch_boolean(ms, OpType.Add) if ms else Manifold()


# ------------------------------------------------------------------ hinge frame
def frame(h):
    """3x4 matrix taking the canonical hinge frame to world."""
    return np.column_stack([h.u, h.v, h.a, h.o])


def revolve(pts, a0=0.0, a1=360.0):
    cs = CrossSection([np.asarray(pts, float)])
    if a1 - a0 >= 360:
        return cs.revolve(SEG, 360.0)
    return cs.revolve(max(8, int(SEG * (a1 - a0) / 360)), a1 - a0).rotate([0, 0, a0])


def ring(r0, r1, s0, s1, cone=0.0, rc=None):
    """solid of revolution r0 <= r <= r1, s0 + c(rc - r) <= s <= s1 + c(rc - r)."""
    rc = r1 if rc is None else rc
    if cone == 0:
        pts = [(r0, s0), (r1, s0), (r1, s1), (r0, s1)]
    else:
        f = lambda r: cone * (rc - r)
        pts = [(r0, s0 + f(r0)), (r1, s0 + f(r1)), (r1, s1 + f(r1)), (r0, s1 + f(r0))]
    return revolve(pts)


def wedge(r0, r1, s0, s1, a0, a1, cone=0.0, rc=None):
    rc = r1 if rc is None else rc
    f = lambda r: cone * (rc - r)
    return revolve([(r0, s0 + f(r0)), (r1, s0 + f(r1)), (r1, s1 + f(r1)), (r0, s1 + f(r0))], a0, a1)


def teardrop_bore(r, s0, s1):
    """bore with a 45 deg pointed top (world-up = canonical +Y for the falcon hinge)."""
    pts = [(r * np.cos(t), r * np.sin(t)) for t in np.radians(np.linspace(135, 405, 40))] + [(0, r * np.sqrt(2))]
    return CrossSection([pts]).extrude(s1 - s0).translate([0, 0, s0])


# ------------------------------------------------------------------ hold-open detent
# A cam on one door knuckle and a flexing follower beam cut free in the fixed web.
# The follower nub sits at world angle NUB; at angle theta it sees door-frame angle
# NUB - theta.  Notches at theta = 0 (closed) and theta = theta_max (open), a
# raised lobe in between, so the door clicks shut and clicks open and stays there.
NUB = 240.0
CAM_LO = geom.RING_R                 # notch bottoms
CAM_HI = geom.RING_R + 0.60          # lobe: 0.35 clearance + 0.25 interference
NUB_R = geom.RING_R + 0.35           # nub tip radius
BEAM_R = (CAM_HI + 0.35, CAM_HI + 1.35)
SLOT_R = (CAM_HI, BEAM_R[1] + 0.45)


def cam_r(phi, theta_max):
    """cam radius at door-frame angle phi (deg)."""
    c, o = NUB, NUB - theta_max
    pts = [(o - 15, CAM_HI), (o - 5, CAM_LO), (o + 5, CAM_LO), (o + 15, CAM_HI), (c - 15, CAM_HI),
           (c - 5, CAM_LO), (c + 5, CAM_LO), (c + 15, CAM_HI)]
    a = np.array(pts)
    return np.interp(np.mod(phi, 360), a[:, 0], a[:, 1], left=CAM_HI, right=CAM_HI)


def cam_ring(theta_max, lo, hi):
    ph = np.linspace(0, 360, 721)[:-1]
    r = cam_r(ph, theta_max)
    pts = np.stack([r * np.cos(np.radians(ph)), r * np.sin(np.radians(ph))], 1)
    return CrossSection([pts]).extrude(hi - lo).translate([0, 0, lo])


def hinge_parts(h, cone=0.0, teardrop=False, detents=()):
    """returns dict of world-space manifolds for one hinge.
    detents: list of (door segment index, beam root s) for hold-open detents."""
    R, Rb, Rp, gax, Gc = geom.RING_R, geom.BORE_R, geom.PIN_R, geom.GAX, geom.G
    if cone:
        gax = gax * np.sqrt(2)          # keep the normal gap on 45 deg cones
    rc = R + Gc
    s0, s1 = h.s0, h.s1
    body_add, body_sub, door_add, door_sub = [], [], [], []
    body_add.append(ring(0, Rp, s0 - 1.2, s1 + 1.2))                                # pin
    body_add.append(wedge(rc - 0.05, geom.FIN_R + 0.8, s0 - 1.2, s1 + 1.2, *geom.FIN))  # web
    cams = dict(detents)
    beams, slots = [], []
    for i, (kind, a, b) in enumerate(h.segments):
        lo = a + gax / 2 if a > s0 + 1e-6 else s0 - 1.2
        hi = b - gax / 2 if b < s1 - 1e-6 else s1 + 1.2
        if kind == 'tab':
            body_add.append(ring(0, R, lo, hi, cone, rc))
            body_add.append(wedge(R - 0.6, rc + 0.05, lo, hi, *geom.FIN, cone=cone, rc=rc))
            door_sub.append(ring(0, rc, lo - gax, hi + gax, cone, rc))
        elif i in cams:
            root = cams[i]
            door_add.append(cam_ring(h.theta_max, lo, hi))
            body_sub.append(ring(Rp + 0.01, CAM_HI + Gc, lo - gax, hi + gax))
            if root < lo:       # beam rooted toward the start of the hinge
                sl, bm = (root, hi + gax), (root - 0.02, hi)
            else:               # rooted toward the end
                sl, bm = (lo - gax, root), (lo, root + 0.02)
            slots.append(wedge(SLOT_R[0], SLOT_R[1], *sl, geom.FIN[0] - 1, geom.FIN[1] + 1))
            beams.append(wedge(BEAM_R[0], BEAM_R[1], *bm, NUB - 15, NUB + 15))
            beams.append(wedge(NUB_R, BEAM_R[0] + 0.05, lo, hi, NUB - 4, NUB + 4))
        else:
            door_add.append(ring(Rb - 0.2, R, lo, hi, cone, rc))
            body_sub.append(ring(Rp + 0.01, rc, lo - gax, hi + gax, cone, rc))
    # door clears the web all along, with a little angular margin (not round the cams)
    web_clear = wedge(rc - 0.3, geom.FIN_R + 1.2, s0 - 1.4, s1 + 1.4, geom.FIN[0] - 9, geom.FIN[1] + 9)
    for i in cams:
        _, a, b = h.segments[i]
        web_clear = web_clear - ring(0, 10, a, b)
        # ...but keep clear of the follower beam
        door_sub.append(wedge(BEAM_R[0] - 0.35, BEAM_R[1] + 0.4, a, b, NUB - 15 - 8, NUB + 15 + 8))
    door_sub.append(web_clear)
    bore = teardrop_bore(Rb, s0 - 1.4, s1 + 1.4) if teardrop else ring(0, Rb, s0 - 1.4, s1 + 1.4)
    door_sub.append(bore)
    M = frame(h)
    out = {}
    for k, lst in (('body_add', body_add), ('body_sub', body_sub + slots), ('door_add', door_add), ('door_sub', door_sub)):
        out[k] = union(lst).transform(M)
    out['beams'] = union(beams).transform(M)
    return out


# ------------------------------------------------------------------ wheels
def tyre_profile(Rt, w, rim_r):
    """half cross-section of a tyre (r, y) with rounded shoulders, y = 0 at the tread centre."""
    pts = []
    sh = 1.6
    for t in np.linspace(0, 90, 10):
        a = np.radians(t)
        pts.append((Rt - sh + sh * np.cos(a), w / 2 - sh + sh * np.sin(a)))
    pts = [(rim_r, w / 2 - 0.4)] + pts[::-1]
    return pts


def wheel(xc, zc, yc, Rt, w, side=+1, front=True):
    """tyre + 5 double-spoke aero wheel. yc = wheel centre-plane y (outer face at yc + w/2)."""
    rim_r = 10.6 if front else 10.5
    # tyre (revolved about its own axis = Z in canonical, then turned to world Y)
    half = tyre_profile(Rt, w, rim_r)
    prof = [(r, y) for r, y in half] + [(r, -y) for r, y in half[::-1]]
    tyre = CrossSection([np.array(prof[::-1])]).revolve(96, 360.0)    # counter-clockwise
    # tread grooves
    for gy in (-2.4, 0.0, 2.4):
        tyre = tyre - ring(Rt - 0.35, Rt + 1, gy - 0.25, gy + 0.25)
    # sidewall-to-rim: wheel face recessed 0.9 mm in from the tyre's outer face
    face = w / 2 - 0.9
    disc = ring(0, rim_r + 0.2, -w / 2 + 0.6, face - 1.2)                    # barrel / backing
    lip = ring(rim_r - 0.9, rim_r + 0.2, face - 1.2, face)                    # rim lip
    hub = ring(0, 2.6, face - 1.2, face + 0.1)                                # centre cap
    spokes = []
    for k in range(5):
        for off in (-7.5, 7.5):
            ang = k * 72 + off
            # tapered spoke: wide at the rim, narrow at the hub
            sp = CrossSection([np.array([(2.0, -0.55), (rim_r - 0.6, -1.25), (rim_r - 0.6, 1.25), (2.0, 0.55)])])
            spokes.append(sp.extrude(1.0).translate([0, 0, face - 1.2]).rotate([0, 0, ang]))
    w_ = union([tyre, disc, lip, hub] + spokes)
    # canonical Z -> world +Y (outer face toward the outside of the car)
    M = np.array([[1, 0, 0, xc], [0, 0, side, yc], [0, -side, 0, zc]], float)
    if side < 0:
        M = np.array([[1, 0, 0, xc], [0, 0, -1, yc], [0, 1, 0, zc]], float)
    w_ = w_.transform(M)
    # flatten the contact patch on the bed
    return w_.trim_by_plane([0, 0, 1], 0.0)


# ------------------------------------------------------------------ lettering
def text_section(txt, height, font='DejaVu Serif', weight='bold'):
    """CrossSection of text, cap height ~ `height`, centred on the origin."""
    from matplotlib.textpath import TextPath
    from matplotlib.font_manager import FontProperties
    tp = TextPath((0, 0), txt, size=10, prop=FontProperties(family=font, weight=weight))
    polys = [np.asarray(p) for p in tp.to_polygons() if len(p) > 2]
    cs = CrossSection(polys, fillrule=__import__('manifold3d').FillRule.EvenOdd)
    b = cs.bounds()
    sc = height / (b[3] - b[1])
    cs = cs.scale([sc, sc])
    b = cs.bounds()
    return cs.translate([-(b[0] + b[2]) / 2, -(b[1] + b[3]) / 2])


# ------------------------------------------------------------------ mirrors
def mirror_housing(side=+1):
    """door mirror on the left front door (side=+1), wedge underside <= 55 deg."""
    def balls(pts, r=0.6):
        return Manifold.batch_hull([Manifold.sphere(r, 16).translate(p) for p in pts])
    stalk = balls([(x, y, z) for x in (70.2, 73.4) for y in (39.6, 42.4) for z in (41.6, 44.9)], 0.5)
    house = balls([(x, y, z) for x in (68.7, 75.3) for y, z in ((41.7, 49.2), (46.8, 49.2), (41.9, 44.7), (46.8, 48.1))])
    m = union([stalk, house])
    return m if side > 0 else m.mirror([0, 1, 0])


def text_solid(txt, height, M, z0, z1, font='DejaVu Serif'):
    """text extruded from z0 to z1 in its own frame, then placed with 3x4 matrix M."""
    cs = text_section(txt, height, font)
    return cs.extrude(z1 - z0).translate([0, 0, z0]).transform(np.asarray(M, float))
