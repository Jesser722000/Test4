// ============================================================
//  NightDock v2 — outlet mount for the Amazon Basics 4-port charger
//  and the LectroFan Classic, in the style of a HomePod outlet mount.
//  Parametric OpenSCAD — all dimensions in mm.
//
//  One printed piece, no moving parts:
//
//        ┌──────┐   sleeve: the charger slides in from the wall side,
//        │ char │   prongs out the back, ports facing DOWN
//        │ ger  │
//        ├──────┤   neck: room for the plugs; cables leave at the
//        │ neck │   sides or straight back
//     ┌──┴──────┴──┐
//     │  LectroFan │   cradle: buttons up, grille facing the room.
//     │  (octagon) │   Spare cord spools in a pan behind it.
//     └────────────┘
//
//  Parts (set PART, or -D 'PART="dock"' on the CLI):
//    "dock"     the print (lies on its back, no supports)
//    "preview"  mounted on a mock outlet      "travel"  packed
// ============================================================

PART = "preview";

/* ---------- Charger (measured) ---------- */
ch_T = 31.6;    // thickness (left–right on the wall)
ch_L = 72.7;    // prong end -> port end (vertical on the wall)
ch_D = 71.4;    // sticks out from the wall
ch_clr = 0.3;

/* ---------- LectroFan Classic (measured) ---------- */
lf_w  = 107.8;  // across the flats
lf_dg = 105.5;  // across the angled flats
lf_d  = 56.0;   // base to grille (spec 55.9). Yours may be ~52:
                // then stick 4 mm rubber feet on the base, see README
lf_clr = 0.8;

/* ---------- Dock ---------- */
wall   = 2.0;   // sleeve / neck walls
cw     = 2.2;   // cradle wall
neck_h = 36;    // room under the ports for the plug overmolds
pan_d  = 15.4;  // cord pan behind the LectroFan (also clears its DC plug)
lip_t  = 2.0;   // front ring thickness
lip_in = 3.0;   // bottom lip reach over the grille rim
catch_in = 2.2; // snap catches reach
col_r  = 5;     // rounded corners of the sleeve column
oct_r  = 3.5;   // rounded corners of the cradle
hub_d  = 40;    // cord spool hub

$fn = 72;
eps = 0.01;

// ---------------- derived ----------------
cx_i = ch_T/2 + ch_clr;  cx_o = cx_i + wall;
D    = ch_D + ch_clr + wall;                 // 73.7, front face of everything
y_top = ch_clr + wall;                       // top of the sleeve
y_ct  = -ch_L - neck_h;                      // neck floor = cradle top
lf_a = lf_w/2;  lf_c = lf_dg/2 * sqrt(2);    // octagon: |x|,|y| <= a and |x|+|y| <= c
flat_v = lf_c - lf_a;                        // half-length of a flat
Yc = y_ct - (cw + lf_clr + lf_a);            // LectroFan centre
lip_z0 = pan_d + lf_d + 0.3;                 // just in front of the LectroFan rim
Dc     = lip_z0 + lip_in + lip_t;            // cradle front (a little prouder than the sleeve)
bot_y  = Yc - lf_a - lf_clr - cw;            // bottom of the dock

module oct2d(a = lf_a, c = lf_c)
    polygon([[a, c-a], [c-a, a], [-(c-a), a], [-a, c-a], [-a, -(c-a)], [-(c-a), -a], [c-a, -a], [a, -(c-a)]]);
module rrect(x0, y0, x1, y1, r) translate([x0 + r, y0 + r]) offset(r = r) square([x1 - x0 - 2*r, y1 - y0 - 2*r]);
module box(p0, p1) translate(p0) cube([p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]]);
module at_lf() translate([0, Yc, 0]) children();
// on a cradle face: a = face normal angle (0 = +x). Local x runs along the face,
// local +y points INTO the cradle, origin on the inner face (at the clearance line).
function face_r(a) = (a % 90 == 45 ? lf_c / sqrt(2) : lf_a) + lf_clr;
module on_face(a) at_lf() rotate([0, 0, a]) translate([face_r(a), 0, 0]) rotate([0, 0, 90]) children();

// ------------------------------------------------------------
//  SLEEVE + NECK (one rounded column), front edge chamfered
// ------------------------------------------------------------
module column_solid() hull() {
    linear_extrude(D - 2) rrect(-cx_o, y_ct - 1, cx_o, y_top, col_r);
    linear_extrude(D) rrect(-cx_o + 2, y_ct - 1, cx_o - 2, y_top - 2, col_r - 2);
}
module column_cuts() {
    box([-cx_i, y_ct, -1], [cx_i, ch_clr, D - wall]);                   // pocket + neck, open at the back
    for (s = [-1, 1], y = [-58, -44, -30])                              // side vents on the sleeve
        box([s * cx_i - 1.5, y, 12], [s * cx_i + 1.5, y + 2.6, 62]);
    for (s = [-1, 1])                                                   // cable exits at the neck sides
        hull() for (z = [12, 40]) translate([s * cx_i, y_ct + 10, z]) rotate([0, 90, 0]) cylinder(d = 9, h = 6, center = true);
    box([-5, y_ct - 2 * cw - 1, -1], [5, y_ct + 1, pan_d - 1]);         // cord notch: pan -> neck
}
module column_details() {
    // ledges the port face rests on, 45° underneath
    for (s = [-1, 1]) hull() {
        box([min(s*cx_i, s*(cx_i-3.5)), -ch_L - 1.6, 4], [max(s*cx_i, s*(cx_i-3.5)), -ch_L, D - wall - 3]);
        box([min(s*cx_i, s*(cx_i-0.5)), -ch_L - 5, 4], [max(s*cx_i, s*(cx_i-0.5)), -ch_L, D - wall - 3]);
    }
    // crush ribs grip the charger for travel
    for (s = [-1, 1], z = [8, 62])
        translate([s > 0 ? cx_i - 0.5 : -cx_i, -62, z - 0.8]) cube([0.5 + eps, 50, 1.6]);
}

// ------------------------------------------------------------
//  CRADLE
// ------------------------------------------------------------
module cradle_solid() hull() {
    at_lf() linear_extrude(Dc - 2) offset(r = oct_r) offset(delta = -oct_r) offset(r = lf_clr + cw) oct2d();
    at_lf() linear_extrude(Dc) offset(r = oct_r) offset(delta = -oct_r) offset(r = lf_clr + cw - 2) oct2d();
}
module cradle_cuts() {
    at_lf() translate([0, 0, -1]) linear_extrude(lip_z0 + 1) offset(r = lf_clr) oct2d();     // pocket + pan
    at_lf() translate([0, 0, lip_z0 - eps]) linear_extrude(Dc) offset(r = lf_clr - 0.4) oct2d(); // front opening
    // bottom lip stays; the four angled faces become flexible catches; the sides open
    for (a = [45, 135, 225, 315]) on_face(a) {
        for (s = [-1, 1]) box([s * 13 - 0.5, -cw - lf_clr - 1, 22], [s * 13 + 0.5, 2, Dc + 1]);  // slits
    }
    for (a = [0, 180]) on_face(a) {                                        // side windows
        hull() for (z = [26, 60]) translate([0, 0, z]) rotate([90, 0, 0]) cylinder(d = 14, h = 20, center = true);
        box([-flat_v - 1, -cw - lf_clr - 1, lip_z0 - 2], [flat_v + 1, 2, Dc + 1]);  // no lip on the sides
    }
    // rubber-foot spots on the back corners (optional 4–5 mm bumpers level it below the outlet plate)
    for (s = [-1, 1]) translate([s * 38, Yc - 38, -1]) cylinder(d = 12.9, h = 1.5);
}
module cradle_details() {
    // bottom lip over the grille rim, 45° underneath so it prints without support
    on_face(270) hull() {
        box([-flat_v - 2, -0.5, lip_z0 + lip_in], [flat_v + 2, lip_in, Dc]);
        box([-flat_v - 2, -0.5, lip_z0], [flat_v + 2, 0.2, Dc]);
    }
    // snap catches: 60° shoulder toward the LectroFan, long ramp toward the room
    for (a = [45, 135, 225, 315]) on_face(a) hull() {
        box([-11, -0.5, lip_z0], [11, 0.2, lip_z0 + eps]);
        box([-11, -0.5, lip_z0 + catch_in * 0.6], [11, catch_in, lip_z0 + catch_in * 0.6 + 1]);
        box([-11, -0.5, Dc - 0.4], [11, 0.2, Dc]);
    }
    // rear stops at the pan depth (45° wedges) + hub
    for (a = [45, 135, 225, 315, 270]) on_face(a) hull() {
        box([-6, -0.5, pan_d - eps], [6, 2.5, pan_d]);
        box([-6, -0.5, pan_d - 2.5], [6, 0.2, pan_d]);
    }
    at_lf() difference() {
        cylinder(d = hub_d, h = pan_d);
        translate([0, 0, -1]) cylinder(d = hub_d - 4, h = pan_d + 2);
    }
    for (s = [-1, 1]) at_lf() rotate([0, 0, s > 0 ? 0 : 180]) translate([hub_d/2 - 1, -3, 0]) cube([lf_a + lf_clr - hub_d/2 + 1.2, 6, 2.4]);
}

module dock() {
    difference() {
        union() { column_solid(); cradle_solid(); }
        column_cuts();
        cradle_cuts();
    }
    column_details();
    cradle_details();
}

// ------------------------------------------------------------
//  Preview props
// ------------------------------------------------------------
ch_ep = 21.7;  rec_pitch = 38.1;
oy = -ch_ep;
module outlet_plate() {
    color("#f6f4ef") translate([0, oy + rec_pitch/2, -4.5]) linear_extrude(4.5) offset(r = 2) square([69.85 - 4, 114.3 - 4], center = true);
    for (y = [oy, oy + rec_pitch]) color("#d7d2c8") translate([0, y, 0]) {
        for (s = [-1, 1]) translate([s * 6.35 - 1, -3.5, -0.2]) cube([2, 7, 0.4]);
        translate([0, -11.9, -0.2]) cylinder(d = 5, h = 0.4);
    }
}
module charger() color("#f4f4f2") translate([-ch_T/2, -ch_L, 0]) minkowski() {
    translate([2, 2, 2]) cube([ch_T - 4, ch_L - 4, ch_D - 4]); sphere(r = 2, $fn = 16);
}
module lectrofan() {
    color("#f2f2ef") at_lf() translate([0, 0, pan_d]) linear_extrude(lf_d - 0.6) oct2d();
    color("#c9c9c6") at_lf() translate([0, 0, pan_d + lf_d - 0.6]) linear_extrude(0.6) offset(r = -2.8) oct2d();
    color("#dcdcd8") for (x = [-14, 14]) translate([x, Yc + lf_a - 0.5, pan_d + 34]) rotate([-90, 0, 0]) scale([1, 1.7, 1]) cylinder(d = 9, h = 1.5);
}
module cord_coil() color("#ffffff") at_lf() for (k = [0 : 3])
    translate([0, 0, 1.5 + (k % 2) * 3.5]) rotate_extrude() translate([hub_d/2 + 2 + (k > 1 ? 3.4 : 0), 0]) square([3.2, 3.2]);
module cable(len) color("#f1f1f1") translate([6, -ch_L - len, 40]) { translate([-5, 0, -3.5]) cube([10, len, 7]); }

module upright() rotate([90, 0, 0]) children();
module preview() {
    outlet_plate(); charger(); lectrofan(); cord_coil();
    color("#f1f1f1") translate([-5, -ch_L - 30, 11]) cube([10, 30, 7]);     // LectroFan plug, port nearest the wall
    cable(34);
    color("#2b2b2b") dock();
}
module travel() { charger(); lectrofan(); color("#2b2b2b") dock(); }

if (PART == "dock")         dock();
else if (PART == "travel")  upright() travel();
else                        upright() preview();
