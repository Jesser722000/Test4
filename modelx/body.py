"""Tesla Model X (2021+) outer body as a signed distance field.

All profile numbers are full-size millimetres measured from the foremost point
of the front bumper (x, rearward), the centreline (y, to the car's left) and the
ground (z, up), at medium ride height on 20" wheels.  Hard numbers come from the
owner's manual (length 5057, wheelbase 2965, overhangs 988 / 1104, width 1999,
height 1680, track 1705 / 1710, tyres 265/45R20 front and 275/45R20 rear); the
silhouette points in between are estimates from the car's proportions.

sdf(x, y, z) returns an approximate signed distance in full-size mm (negative
inside).  build.py samples it on a grid in print units.
"""
import numpy as np
from scipy.interpolate import PchipInterpolator

# ---------------------------------------------------------------- hard numbers
L = 5057.0
HW = 1999.0 / 2
H = 1680.0
XF, XR = 988.0, 988.0 + 2965.0          # axle stations
TF, TR = 1705.0 / 2, 1710.0 / 2         # half track (wheel centre)
TIRE_F = dict(d=2 * 0.45 * 265 + 20 * 25.4, w=265.0)   # 746.5
TIRE_R = dict(d=2 * 0.45 * 275 + 20 * 25.4, w=275.0)   # 755.5
ZWF = TIRE_F['d'] / 2 - 10.0            # loaded wheel-centre height
ZWR = TIRE_R['d'] / 2 - 10.0
ARCH_F, ARCH_R = 432.0, 438.0           # wheel-arch radii


def P(pts):
    a = np.array(pts, float)
    return PchipInterpolator(a[:, 0], a[:, 1], extrapolate=True)


# ------------------------------------------------------------ side profiles
# lower body top along the centreline: nose roll-over, hood, cowl, then the
# beltline (hidden under the greenhouse) back to the ducktail
Z_A = P([(60, 700), (200, 845), (600, 915), (1000, 985), (1420, 1068),
         (1600, 1050), (2450, 1050), (3700, 1078), (4400, 1118), (4800, 1160), (4975, 1182), (5100, 1182)])
CROWN_A = P([(0, 45), (1300, 45), (1650, 18), (4500, 18), (5100, 30)])
# beltline (bottom of the side glass) at the body side
BELT = P([(1300, 1035), (1700, 1015), (2450, 1030), (3700, 1060), (4400, 1100), (4975, 1178)])
# underbody / rocker bottom
Z_BOT = P([(0, 330), (60, 240), (220, 205), (600, 195), (4500, 195), (4850, 230), (5000, 285), (5100, 330)])
# foremost x at each height (side view of the nose) and rearmost x (tail)
X_NOSE = P([(150, 140), (230, 62), (320, 18), (430, 2), (480, 0), (560, 4), (660, 22), (760, 70), (840, 170), (900, 300)])
X_TAIL = P([(150, 4900), (260, 4975), (300, 4995), (450, 5048), (650, 5057), (820, 5052), (950, 5040), (1060, 5020),
            (1140, 4998), (1182, 4980), (1260, 4930)])
# plan view: half-width of the lower body at its widest height
HW_PLAN = P([(-100, 975), (600, 990), (988, 999.5), (1500, 992), (2450, 988), (3400, 993), (3953, 999.5), (4500, 992), (5200, 975)])

# ------------------------------------------------------------- greenhouse
Z_ROOF = P([(1250, 960), (1420, 1068), (1700, 1245), (2000, 1425), (2300, 1580), (2450, 1638), (2650, 1676),
            (3000, 1680), (3400, 1666), (3750, 1636), (4250, 1565), (4500, 1490), (4750, 1345), (4975, 1182), (5100, 1100)])
CROWN_R = P([(1300, 25), (2000, 45), (2600, 60), (3800, 60), (4500, 50), (5000, 30)])
# half-width of the greenhouse where it meets the beltline
W_BELT = P([(1300, 700), (1420, 760), (1650, 905), (1900, 950), (2450, 958), (3700, 955), (4200, 920),
            (4600, 840), (4975, 690), (5100, 650)])
TUMBLE = P([(1300, 0.62), (1800, 0.47), (2600, 0.445), (3900, 0.445), (4600, 0.52), (5000, 0.62)])


def smax(a, b, k):
    h = np.clip(0.5 - 0.5 * (b - a) / k, 0.0, 1.0)
    return b + (a - b) * h + k * h * (1 - h)


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b + (a - b) * h - k * h * (1 - h)


def _plan_front(ay):
    u = np.clip(ay / HW, 0, 1.2)
    return 165 * u ** 2 + 290 * u ** 8, (2 * 165 * u + 8 * 290 * u ** 7) / HW


def _plan_rear(ay):
    u = np.clip(ay / HW, 0, 1.2)
    return 110 * u ** 2 + 260 * u ** 10, (2 * 110 * u + 10 * 260 * u ** 9) / HW


def _hw_lower(x, z):
    """half-width of the lower body at height z (widest ~880, tuck-under below, shoulder above)."""
    base = HW_PLAN(x)
    lo = np.clip((880 - z) / 630, 0, None)
    hi = np.clip((z - 880) / 150, 0, None)
    hw = base - 44 * lo ** 2 - 28 * hi ** 2
    dhw = 2 * 44 * lo / 630 - 2 * 28 * hi / 150     # d hw / dz
    return hw, dhw


def lower_body(x, y, z):
    ay = np.abs(y)
    hw, dhw = _hw_lower(x, z)
    f_side = (ay - hw) / np.sqrt(1 + dhw ** 2)
    zt = Z_A(x) - CROWN_A(x) * (ay / HW) ** 2
    f_top = (z - zt) / np.sqrt(1 + Z_A(x, 1) ** 2)
    f_bot = (Z_BOT(x) - z) / np.sqrt(1 + Z_BOT(x, 1) ** 2)
    pf, dpf = _plan_front(ay)
    f_front = (X_NOSE(z) + pf - x) / np.sqrt(1 + dpf ** 2 + X_NOSE(z, 1) ** 2)
    pr, dpr = _plan_rear(ay)
    f_rear = (x - X_TAIL(z) + pr) / np.sqrt(1 + dpr ** 2 + X_TAIL(z, 1) ** 2)
    a = smax(f_side, f_top, 110.0)        # shoulder / fender roll
    a = smax(a, f_bot, 55.0)              # rocker
    a = smax(a, f_front, 140.0)           # nose corners
    a = smax(a, f_rear, 110.0)            # tail corners
    return a


def greenhouse(x, y, z):
    ay = np.abs(y)
    belt = BELT(x)
    tb = TUMBLE(x)
    hw = W_BELT(x) - np.maximum(z - belt, 0) * tb
    f_side = (ay - hw) / np.sqrt(1 + tb ** 2)
    f_bot = (belt - 140) - z
    zr = Z_ROOF(x) - CROWN_R(x) * (ay / 700.0) ** 2
    f_top = (z - zr) / np.sqrt(1 + Z_ROOF(x, 1) ** 2)
    pr, dpr = _plan_rear(ay)
    f_rear = (x - X_TAIL(z) + pr) / np.sqrt(1 + dpr ** 2 + X_TAIL(z, 1) ** 2)
    f_front = 1280 - x
    g = smax(f_side, f_top, 85.0)         # roof rail
    g = smax(g, f_rear, 60.0)
    g = smax(g, f_front, 20.0)
    g = np.maximum(g, f_bot)
    return g


def arches(x, y, z):
    """positive outside the wheel-arch cut volumes, negative inside them."""
    out = np.full(np.broadcast(x, y, z).shape, 1e9)
    for xc, zc, r, t in ((XF, ZWF, ARCH_F, TF), (XR, ZWR, ARCH_R, TR)):
        d = np.sqrt((x - xc) ** 2 + (z - zc) ** 2) - r
        inner = (t - 175) - np.abs(y)              # well inner wall
        out = np.minimum(out, smax(d, inner, 30.0))
    return out


def sdf(x, y, z):
    b = smin(lower_body(x, y, z), greenhouse(x, y, z), 55.0)
    b = smax(b, -arches(x, y, z), 22.0)
    return b
