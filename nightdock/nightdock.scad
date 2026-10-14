// ============================================================
//  NightDock v3 — outlet mount for the Amazon Basics 4-port charger
//  and the LectroFan Classic. Parametric OpenSCAD, mm.
//
//  Two parts: the DOCK and a SPOOL disc that closes the back.
//    sleeve   rounded, the charger slides in from the wall side, ports down
//    neck     narrow waist with a cable slot each side
//    cradle   rounded octagon with a continuous front bezel; the
//             LectroFan loads from the BACK, then the spool snaps in
//             behind it: it holds the LectroFan in and carries the cord.
//
//  PART = "dock" | "spool" | "preview" | "back" | "parts"
// ============================================================

PART = "preview";

/* ---------- Charger (measured) ---------- */
ch_T = 31.6;  ch_L = 72.7;  ch_D = 71.4;  ch_clr = 0.3;

/* ---------- LectroFan Classic (measured) ---------- */
lf_w = 107.8;  lf_dg = 105.5;  lf_d = 56.0;  lf_clr = 0.8;

/* ---------- Dock ---------- */
wall  = 2.0;   cw = 2.0;
neck_h = 36;   nx_o = 12;  nx_i = 9.5;      // waist: outer / inner half-width
pan_d = 16.5;                               // cord pan behind the LectroFan
bez_in = 3.0;  bez_t = 2.6;                 // front bezel reach / thickness
sr = 6;        // sleeve edge radius
cr = 12;       // cradle corner radius
fr = 3;        // front edge fillet
hub_d = 36;    // cord posts sit on this circle

$fn = 96;
eps = 0.01;

// ---------------- derived ----------------
cx_i = ch_T/2 + ch_clr;  cx_o = cx_i + wall;
D  = ch_D + ch_clr + wall;                   // sleeve front
y_top = ch_clr + wall;
y_ct  = -ch_L - wall - neck_h;               // cradle outer top / neck bottom
lf_a = lf_w/2;  lf_c = lf_dg/2 * sqrt(2);
Yc = y_ct - (cw + lf_clr + lf_a);
bez_z = pan_d + lf_d + 0.3;                  // bezel underside
Dc = bez_z + bez_in + bez_t;                 // cradle front
spool_t = 1.6;

module oct2d(a = lf_a, c = lf_c)
    polygon([[a, c-a], [c-a, a], [-(c-a), a], [-a, c-a], [-a, -(c-a)], [-(c-a), -a], [c-a, -a], [a, -(c-a)]]);
module box(p0, p1) translate(p0) cube([p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]]);
module at_lf() translate([0, Yc, 0]) children();
module roct(o, r = cr) offset(r = r) offset(delta = -r) offset(r = o) oct2d();

// rounded box, flat at the back (z = 0), with a fillet on the front edges
module rbox(x0, y0, x1, y1, zf, r) intersection() {
    hull() for (x = [x0 + r, x1 - r], y = [y0 + r, y1 - r], z = [r - 10, zf - r]) translate([x, y, z]) sphere(r = r);
    box([x0 - 1, y0 - 1, 0], [x1 + 1, y1 + 1, zf + 1]);
}
// extrude a 2D shape 0..zf with a front fillet of radius r (stepped)
module fillet_extrude(zf, r, n = 8) hull() {
    linear_extrude(eps) children();
    for (i = [0 : n]) {
        t = i / n;  dz = r * (1 - cos(90 * t));  di = r * (1 - sin(90 * t));
        translate([0, 0, zf - r + dz - eps]) linear_extrude(eps) offset(delta = -di) children();
    }
}

// ------------------------------------------------------------
//  DOCK
// ------------------------------------------------------------
module sleeve_solid() rbox(-cx_o, -ch_L - wall, cx_o, y_top, D, sr);
module neck_solid()   rbox(-nx_o, y_ct - 4, nx_o, -ch_L + 4, D - 1, 5);
module cradle_solid() at_lf() fillet_extrude(Dc, fr) roct(lf_clr + cw);
// concave fillets where the neck meets the sleeve and the cradle (molded look)
module web(y, up, w) for (s = [-1, 1]) translate([s * nx_o, y, 0]) difference() {
    translate([s < 0 ? -w : -0.6, up > 0 ? -0.6 : -w, 1.5]) cube([w + 0.6, w + 0.6, D - 4.5]);
    translate([s * w, up * w, 0]) cylinder(r = w, h = D);
}
module webs() { web(y_ct, 1, 8); }

module dock_cuts() {
    box([-cx_i, -ch_L, -1], [cx_i, ch_clr, D - wall]);                     // charger pocket, open at the back
    box([-nx_i, y_ct + cw - 1, -1], [nx_i, -ch_L + 1, D - wall]);           // neck interior
    // hidden air gaps: side and top walls stop 3.5 mm short of the wall
    for (s = [-1, 1]) box([s * cx_i - 1.2 * s + (s < 0 ? -wall - 1 : 0), -ch_L + 8, -1], [s * cx_i - 1.2 * s + (s < 0 ? 0 : wall + 1), ch_clr - 8, 3.5]);
    box([-cx_i + 8, ch_clr - 0.1, -1], [cx_i - 8, y_top + 1, 3.5]);
    // neck cable slots
    for (s = [-1, 1]) hull() for (z = [20, 50]) translate([s * nx_o, y_ct + 18, z]) rotate([0, 90, 0]) cylinder(d = 11, h = 8, center = true);
    // LectroFan pocket + pan, open at the back; bezel with a 45° underside
    at_lf() translate([0, 0, -1]) linear_extrude(bez_z + 1) offset(r = lf_clr) oct2d();
    at_lf() hull() {
        translate([0, 0, bez_z - eps]) linear_extrude(eps) offset(r = lf_clr) oct2d();
        translate([0, 0, bez_z + bez_in]) linear_extrude(eps) offset(r = lf_clr - bez_in) oct2d();
    }
    at_lf() translate([0, 0, bez_z + bez_in - eps]) linear_extrude(Dc) offset(r = lf_clr - bez_in) oct2d();
    // cord notch: pan -> neck (above the spool disc)
    box([-5, Yc + lf_a - 1, spool_t + 0.6], [5, y_ct + cw + 1, pan_d - 1]);
    // spool snap dimples on the four flats
    for (a = [0, 90, 180, 270]) at_lf() rotate([0, 0, a]) translate([lf_a + lf_clr - 0.7, 0, 3.2]) rotate([0, 90, 0]) cylinder(d = 7.5, h = 3);
    // rubber bumper spots, back lower corners
    for (s = [-1, 1]) translate([s * 36, Yc - 36, -1]) cylinder(d = 12.9, h = 1.5);
}
module dock_details() {
    for (s = [-1, 1], z = [10, 60])   // crush ribs for the charger
        translate([s > 0 ? cx_i - 0.5 : -cx_i, -60, z - 0.8]) cube([0.5 + eps, 46, 1.6]);
}
module dock() {
    difference() {
        union() { sleeve_solid(); neck_solid(); cradle_solid(); webs(); }
        dock_cuts();
    }
    dock_details();
}

// ------------------------------------------------------------
//  SPOOL: octagonal disc that snaps into the back of the cradle.
//  Three posts carry the spare cord and are the rear stop for the LectroFan.
// ------------------------------------------------------------
post_h = pan_d - spool_t;     // make this 4 mm longer for a 52 mm LectroFan
module spool() {
    difference() {
        union() {
            linear_extrude(spool_t) roct(lf_clr - 0.25, cr - 2);
            for (a = [0, 90, 180, 270]) rotate([0, 0, a]) translate([lf_a + lf_clr - 0.25 - 1.4, -6, 0]) {
                cube([1.4, 12, 4.6]);                                                 // snap finger
                translate([1.4, 6, 3.2]) rotate([0, 90, 0]) cylinder(d = 6, h = 0.6);     // bump
            }
            for (a = [90, 210, 330]) rotate([0, 0, a]) translate([hub_d/2, 0, 0]) cylinder(d = 8, h = post_h);
        }
        translate([0, 0, -1]) cylinder(d = 24, h = 10);                                  // finger hole
        for (a = [0, 90, 180, 270]) rotate([0, 0, a]) translate([lf_a + lf_clr - 0.25 - 1.4 - 1.2, -7, -1]) cube([1.2, 14, 6]);  // finger relief
    }
}

// ------------------------------------------------------------
//  Preview props
// ------------------------------------------------------------
ch_ep = 21.7;  rec_pitch = 38.1;  oy = -ch_ep;
module outlet_plate() {
    color("#f3f1ec") translate([0, oy + rec_pitch/2, -4.5]) linear_extrude(4.5) offset(r = 3) square([69.85 - 6, 114.3 - 6], center = true);
    for (y = [oy, oy + rec_pitch]) color("#d2cec6") translate([0, y, 0]) {
        for (s = [-1, 1]) translate([s * 6.35 - 1, -3.5, -0.2]) cube([2, 7, 0.4]);
        translate([0, -11.9, -0.2]) cylinder(d = 5, h = 0.4);
    }
}
module charger() color("#f4f4f2") translate([-ch_T/2, -ch_L, 0]) minkowski() { translate([2, 2, 2]) cube([ch_T - 4, ch_L - 4, ch_D - 4]); sphere(r = 2, $fn = 16); }
module lectrofan() {
    color("#f2f2ef") at_lf() translate([0, 0, pan_d]) linear_extrude(lf_d - 0.6) oct2d();
    color("#cfcfcb") at_lf() translate([0, 0, pan_d + lf_d - 0.6]) linear_extrude(0.6) offset(r = -2.8) oct2d();
    color("#e4e4e0") for (x = [-14, 14]) translate([x, Yc + lf_a - 0.5, pan_d + 34]) rotate([-90, 0, 0]) scale([1, 1.7, 1]) cylinder(d = 9, h = 1.5);
}
module cord_coil() color("#ffffff") at_lf() for (k = [0 : 2]) translate([0, 0, spool_t + 0.3 + k * 3.4]) rotate_extrude() translate([hub_d/2 + 4 + k, 0]) square([3.1, 3.1]);
module cable(x, len, z) color("#f1f1f1") translate([x, -ch_L - len, z]) translate([-4.5, 0, -3.2]) cube([9, len, 6.4]);

module upright() rotate([90, 0, 0]) children();
module preview() {
    outlet_plate(); charger(); lectrofan(); cord_coil();
    cable(0, 28, 11); cable(0, 33, 40);
    color("#2a2a2a") dock();
    color("#2a2a2a") at_lf() spool();
}
module back_view() { color("#2a2a2a") dock(); color("#3a3a3a") at_lf() spool(); lectrofan(); cord_coil(); }

if (PART == "dock")          dock();
else if (PART == "spool")    spool();
else if (PART == "parts")    { dock(); translate([0, Yc, 0]) translate([0, -140, 0]) spool(); }
else if (PART == "back")     upright() back_view();
else                         upright() preview();
