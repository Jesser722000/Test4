// ============================================================
//  NightDock — outlet mount + travel caddy
//  Amazon Basics 4-port GaN charger  +  LectroFan Classic
//  Parametric OpenSCAD — all dimensions in mm.
//
//  Front view, mounted (LectroFan on the right, HAND = "R"):
//
//        ┌──┐  <- anchor tower: a plastic "dummy plug" slides here and
//        │▒▒│     grips the UPPER outlet, so the whole dock hangs from
//        ├──┤     two outlets instead of one weak charger plug
//        │  │┌────────────┐
//        │CH││  LectroFan │  <- buttons face up, grille faces the room,
//        │AR││  (octagon) │     slides in from the top and clicks in
//        │GER││           │
//        ├──┤│            │  <- spare LectroFan cord coils in a hidden
//        │▓▓│└────────────┘     pan behind the LectroFan
//        └──┘  <- port bay + cable comb: other cables exit underneath
//
//  The charger plugs into the LOWER outlet with its ports facing down.
//
//  Parts (set PART, or -D 'PART="frame"' on the CLI):
//    "frame"    The dock (prints flat on its back, no supports)
//    "anchor"   The dummy plug for the upper outlet (prints on its side)
//    "preview"  Mounted on a mock wall outlet
//    "travel"   Packed for travel (anchor parked in its garage)
// ============================================================

PART = "preview";
HAND = "R";            // LectroFan to the "R"ight or "L"eft of the charger

/* ---------- Charger (measured) ---------- */
ch_L   = 72.7;         // prong end -> port end (vertical on the wall)
ch_D   = 71.4;         // how far it sticks out from the wall
ch_T   = 31.6;         // thickness (left-right on the wall)
ch_ep  = 21.7;         // prong centre, measured down from the charger's top end
ch_clr = 0.35;         // pocket clearance per side (crush ribs take up the rest)
ch_top_clr = 0.4;

/* ---------- LectroFan Classic (measured) ---------- */
lf_w  = 107.8;         // across the left/right flats
lf_h  = 107.8;         // across the top/bottom flats (button face on top)
lf_dg = 105.5;         // across the angled flats
lf_d  = 56.0;          // base to grille. Spec is 55.9; if yours is shorter,
                       // stick rubber feet on the 4 marked spots (see README)
lf_clr = 0.8;

/* ---------- Outlet (US duplex, NEMA 5-15R) ---------- */
rec_pitch  = 38.1;     // centre-to-centre of the two outlets
anchor_travel = 7;     // +/- self-alignment of the dummy plug
blade_w    = 6.35;
blade_t    = 1.6;      // real plugs are 1.52; a hair thicker grips better
blade_len  = 15.9;
blade_pitch = 12.7;

/* ---------- Frame ---------- */
wall    = 1.8;
bay_h   = 46;          // room under the ports for plug overmolds
floor_t = 2;
pan_d   = 5.6;         // cord storage depth behind the LectroFan
panel_t = 1.6;
cw      = 2.2;         // cradle wall
lip_in  = 3.0;         // how far the front lips reach over the grille rim
lip_t   = 2.0;
comb    = [[26, 4.2], [40, 4.2], [54, 6.0]];   // [z, width] cable slots under the ports

$fn = 64;
eps = 0.01;

// ---------------- derived ----------------
cx_i = ch_T/2 + ch_clr;              // pocket half-width
cx_o = cx_i + wall;                  // column half-width
col_front_i = ch_D + ch_clr;
col_front_o = col_front_i + wall;
top_i = ch_top_clr;
top_o = top_i + wall;
ledge_y = -ch_L - 0.2;               // top of the ledges the port face rests on
bay_floor_top = ledge_y - bay_h;
bay_floor_bot = bay_floor_top - floor_t;

lf_a = lf_w/2;  lf_b = lf_h/2;  lf_c = lf_dg/2 * sqrt(2);   // angled flats: |x|+|y| = lf_c
flat_v = lf_c - lf_a;                // half-length of the left/right flats
Xc = cx_o + lf_clr + lf_a;           // LectroFan centre
Yc = bay_floor_bot + lf_b + lf_clr + cw;
bp_hx = lf_a + lf_clr + cw;          // backplate half sizes
bp_hy = lf_b + lf_clr + cw;
panel_z0 = pan_d;
panel_z1 = pan_d + panel_t;
lip_z0 = panel_z1 + lf_d + 0.3;
lip_z1 = lip_z0 + lip_t;

// anchor (dummy plug) — blade centre relative to the frame
anc_c   = rec_pitch - ch_ep;         // nominal height above the charger's top end
anc_min = anc_c - anchor_travel;
anc_max = anc_c + anchor_travel;
ins_hx  = 11.2;                      // plate half-width
ins_up  = 11.0;                      // plate reaches this far above the blade centre
ins_pt  = 3.0;                       // plate thickness
neck_hx = 2.3;  neck_up = 2.0;
head_hx = 7.0;  head_up = 7.0;  head_t = 3.0;
tw_z0 = ins_pt + 0.2;                // tower wall sits in front of the plate
tw_z1 = tw_z0 + 2.0;
gap_hx = ins_hx + 0.3 + 1.5;         // ±1.5 sideways float
sl_y0 = anc_min - blade_w/2 - 0.4;
sl_y1 = anc_max + neck_up + 0.4;
kh_y0 = sl_y1 + 1.6;
kh_y1 = kh_y0 + blade_w/2 + head_up + 1.0;
tw_top = kh_y1 + 3.0;

// right-hand cradle flap (springs out to let the LectroFan slide in)
flap_x0 = Xc + lf_a + lf_clr;
flap_x1 = Xc + bp_hx;
catch_p = 4.0;
catch_y0 = Yc + flat_v + catch_p - lf_clr + 0.5;
flap_y0 = Yc - flat_v + 4;
flap_y1 = catch_y0 + 1.0 + catch_p + 7;

// insert garage (parks the dummy plug for travel)
gar_y1 = -6;  gar_y0 = gar_y1 - 21;
gar_zc = 29;  gar_w = 8.5;

// ------------------------------------------------------------
module oct2d(a = lf_a, b = lf_b, c = lf_c)
    polygon([[a, c-a], [c-b, b], [-(c-b), b], [-a, c-a],
             [-a, -(c-a)], [-(c-b), -b], [c-b, -b], [a, -(c-a)]]);
module rrect(hx, hy, r) offset(r = r) square([2*(hx - r), 2*(hy - r)], center = true);
module at_lf() translate([Xc, Yc]) children();
module box(p0, p1) translate(p0) cube([p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]]);
// box with rounded edges in the two directions that are not its thinnest
module win_box(p0, p1, r) {
    d = [p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]];
    t = min(d);
    if (d[0] == t) translate(p0) rotate([90, 0, 90]) linear_extrude(d[0]) offset(r = r) offset(delta = -r) square([d[1], d[2]]);
    else if (d[2] == t) translate(p0) linear_extrude(d[2]) offset(r = r) offset(delta = -r) square([d[0], d[1]]);
    else translate(p0) rotate([90, 0, 0]) translate([0, 0, -d[1]]) linear_extrude(d[1]) offset(r = r) offset(delta = -r) square([d[0], d[2]]);
}

// ------------------------------------------------------------
//  CHARGER COLUMN + PORT BAY
// ------------------------------------------------------------
vent_ys = [for (y = [-66 : 6 : -8]) y];

module column_solid() box([-cx_o, bay_floor_bot, 0], [cx_o, top_o, col_front_o]);

module column_cuts() {
    // pocket + bay, open at the back for the prongs
    box([-cx_i, bay_floor_top, -1], [cx_i, top_i, col_front_i]);
    // windows: lighter, and they let the charger breathe
    // front: slots run across, so each bar between them is a short bridge
    for (y = [-68 : 5.5 : -10]) box([-11.5, y, col_front_i - 1], [11.5, y + 3, col_front_o + 1]);
    // side walls: tall arched slots (arch tops print without support)
    for (s = [-1, 1], y = [-63, -52, -41, -30, -19]) if (s > 0 || y < gar_y0 - 6) {
        x0 = s < 0 ? -cx_o - 1 : cx_i - 0.5;
        translate([x0, y, 0]) rotate([90, 0, 90]) linear_extrude(wall + 1.5) hull() {
            translate([0, 16]) circle(d = 7);
            translate([0, 54]) circle(d = 7);
        }
    }
    // cable comb: slots in the bay floor, open to the outer side
    for (s = comb) {
        box([-cx_o - 1, bay_floor_bot - 1, s[0] - s[1]/2], [4, bay_floor_top + eps, s[0] + s[1]/2]);
        box([-cx_o - 1, bay_floor_bot - 1, s[0] - s[1]/2], [-cx_i + eps, bay_floor_top + 8, s[0] + s[1]/2]);
    }
    // LectroFan cord passes from the cord pan into the bay (laid in from the back)
    box([cx_i - 1, -100, -1], [cx_o + 1, -82, pan_d]);
    // relief for the wall-plate screw head
    box([-6, top_i - 0.1, -1], [6, top_o + 0.1, 2.2]);
}

module column_details() {
    // ledges the port face rests on (clear of the ports)
    for (s = [-1, 1]) {
        x0 = s * cx_i;  x1 = s * (cx_i - 3.5);
        box([min(x0, x1), ledge_y - 1.6, 0], [max(x0, x1), ledge_y, col_front_i]);
    }
    // crush ribs grip the charger
    for (s = [-1, 1], z = [7, 64])
        translate([s > 0 ? cx_i - 0.45 : -cx_i, -65, z - 0.75]) cube([0.45 + eps, 58, 1.5]);
}

// ------------------------------------------------------------
//  ANCHOR TOWER (slot for the dummy plug)
// ------------------------------------------------------------
module tower_solid() box([-cx_o, top_o - eps, 0], [cx_o, tw_top, tw_z1]);

module tower_cuts() {
    box([-gap_hx, top_o, -1], [gap_hx, tw_top + 1, tw_z0]);           // plate rides here
    box([-neck_hx - 0.3, sl_y0, tw_z0 - 0.5], [neck_hx + 0.3, sl_y1, tw_z1 + 1]);   // slot
    box([-neck_hx + 0.15, sl_y1 - eps, tw_z0 - 0.5], [neck_hx - 0.15, kh_y0 + eps, tw_z1 + 1]); // detent throat
    box([-head_hx - 0.5, kh_y0, tw_z0 - 0.5], [head_hx + 0.5, kh_y1, tw_z1 + 1]);  // keyhole
}

// ------------------------------------------------------------
//  LECTROFAN HOLSTER: backplate with cord pan, cradle, lips, flap
// ------------------------------------------------------------
module holster_solid() {
    // backplate (cord pan behind, LectroFan seat in front)
    at_lf() linear_extrude(panel_z1) rrect(bp_hx, bp_hy, 6);
    // cradle walls: everything below the top of the side flats
    intersection() {
        at_lf() translate([0, 0, panel_z1 - eps]) linear_extrude(lip_z1 - panel_z1 + eps)
            difference() { offset(r = lf_clr + cw) oct2d(); offset(r = lf_clr) oct2d(); }
        box([-200, -300, -1], [Xc + 200, Yc + flat_v, 200]);
    }
    // flap: right wall carries on up to the catch
    box([flap_x0, Yc + flat_v - 1, 0], [flap_x1, flap_y1, lip_z1 - 8]);
}

module holster_cuts() {
    // cord pan (open toward the wall)
    at_lf() translate([0, 0, -1]) linear_extrude(pan_d + 1) offset(r = lf_clr) oct2d();
    // hollow corner cells
    intersection() {
        at_lf() translate([0, 0, -1]) linear_extrude(pan_d + 1) difference() {
            rrect(bp_hx - 1.6, bp_hy - 1.6, 4.4);
            offset(r = lf_clr + 1.6) oct2d();
        }
        box([cx_o, -300, -2], [300, 300, pan_d + 1]);
    }
    // push-out hole in the middle
    at_lf() translate([0, 0, -1]) cylinder(d = 16.8, h = panel_z1 + 2);
    // cord drops from the LectroFan's top face into the pan
    box([Xc - 4, Yc + lf_b - 3, -1], [Xc + 4, Yc + bp_hy + 1, panel_z1 + 1]);
    // cord leaves the pan toward the port bay (lower-left corner)
    box([cx_o - 0.5, -98, -1], [cx_o + 12, -86, pan_d - 0.6]);
    // windows in the three bottom cradle faces
    for (f = [[-90, lf_b, 2*(lf_c - lf_b) - 14], [-135, lf_c/sqrt(2), lf_dg/sqrt(2)*0 + 46.9 - 16],
              [-45, lf_c/sqrt(2), 46.9 - 16]])
        at_lf() rotate(f[0]) translate([f[1] - 2, 0, 0]) rotate([0, 90, 0])
            linear_extrude(lf_clr + cw + 6) hull() {
                translate([-(panel_z1 + 7 + f[2]/2), 0]) circle(d = f[2]);
                translate([-(lip_z0 - 7 - f[2]/2), 0]) circle(d = f[2]);
            }
    // free the right flap: slit along its inner side and across its top
    box([flap_x0 - 1.0, flap_y0, -1], [flap_x0, flap_y1 + 1, lip_z1 + 1]);
    box([flap_x0 - 1.0, flap_y1, -1], [flap_x1 + 1, flap_y1 + 1.0, lip_z1 + 1]);
    // rubber-foot spots: LectroFan side (4) and wall side (2)
    for (sx = [-1, 1], sy = [-1, 1]) at_lf()
        translate([sx * 30, sy * 30, panel_z1 - 0.5]) cylinder(d = 12.9, h = 1);
    for (sy = [-1, 1]) at_lf()
        translate([bp_hx - 12, sy * (bp_hy - 12), -1]) cylinder(d = 12.9, h = 1.5);
}

module holster_details() {
    // hub the spare cord winds round (two rings hold up the panel)
    at_lf() difference() {
        union() { cylinder(d = 44, h = pan_d + eps); cylinder(d = 20, h = pan_d + eps); }
        translate([0, 0, -1]) cylinder(d = 40.8, h = pan_d + 2);
    }
    at_lf() difference() {
        cylinder(d = 20, h = pan_d + eps);
        translate([0, 0, -1]) cylinder(d = 16.8, h = pan_d + 2);
    }
    // wall-side foot bosses in the two right corner cells
    for (sy = [-1, 1]) at_lf() translate([bp_hx - 12, sy * (bp_hy - 12), 0]) difference() {
        cylinder(d = 15, h = pan_d + eps);
        translate([0, 0, -1]) cylinder(d = 12.9, h = 1.5);
    }
    // front lips over the grille rim (same reach as the cradle + the column side)
    intersection() {
        at_lf() translate([0, 0, lip_z0]) linear_extrude(lip_t)
            difference() { offset(r = lf_clr + cw) oct2d(); offset(r = lf_clr - lip_in) oct2d(); }
        box([cx_o - 0.5, -300, -1], [flap_x1 + 1, Yc + flat_v, 200]);
    }
    // catch on the flap: ramp on top, square shoulder underneath
    translate([0, 0, panel_z1 + 10]) linear_extrude(lf_d - 20)
        polygon([[flap_x0 + eps, catch_y0], [flap_x0 - catch_p, catch_y0],
                 [flap_x0 - catch_p, catch_y0 + 1.0], [flap_x0 + eps, catch_y0 + 1.0 + catch_p]]);
    // finger grip on top of the flap
    box([flap_x0 - 0.01, flap_y1 - 3, lip_z1 - 18], [flap_x1 + 2.5, flap_y1, lip_z1 - 8]);
    // cord keepers at the back edge of the pan (cord pushes past them)
    for (a = [0 : 45 : 315]) if (a != 90 && a != 225 && a != 0)
        at_lf() rotate(a) translate([lf_a + lf_clr - 2.4, -4, 0]) cube([2.6, 8, 1.0]);
    for (a = [45 : 90 : 315])
        at_lf() rotate(a) translate([22 - eps, -4, 0]) cube([2.4, 8, 1.0]);
}

// ------------------------------------------------------------
//  GARAGE for the dummy plug (outer side of the column)
// ------------------------------------------------------------
module garage_solid()
    hull() {
        box([-cx_o - eps, gar_y0, 8], [-cx_o + 0.5, gar_y1, 40]);
        box([-cx_o - gar_w, gar_y0, 16.5], [-cx_o + 0.5, gar_y1, 40]);
    }
module garage_cuts()
    for (s = [-1, 1])
        box([-cx_o - gar_w/2 - (blade_w + 0.5)/2, gar_y1 - blade_len - 1.2, gar_zc + s * blade_pitch/2 - (blade_t + 0.5)/2],
            [-cx_o - gar_w/2 + (blade_w + 0.5)/2, gar_y1 + 1, gar_zc + s * blade_pitch/2 + (blade_t + 0.5)/2]);

// ------------------------------------------------------------
module frame_R() {
    difference() {
        union() { column_solid(); tower_solid(); holster_solid(); garage_solid(); }
        column_cuts();
        tower_cuts();
        holster_cuts();
        garage_cuts();
    }
    column_details();
    holster_details();
}
module frame() { if (HAND == "L") mirror([1, 0, 0]) frame_R(); else frame_R(); }

// ------------------------------------------------------------
//  ANCHOR (dummy plug). Outlet coords: blade centre at the origin,
//  z = 0 on the outlet face, blades point into the wall (-z).
// ------------------------------------------------------------
module blade() hull() {
    translate([-blade_t/2, -blade_w/2, -blade_len + 1.5]) cube([blade_t, blade_w, blade_len - 1.5 + eps]);
    translate([-blade_t/2 + 0.3, -blade_w/2, -blade_len]) cube([blade_t - 0.6, blade_w - 1.2, eps]);
}
module anchor() {
    translate([-ins_hx, -blade_w/2, 0]) cube([2 * ins_hx, blade_w/2 + ins_up, ins_pt]);
    for (s = [-1, 1]) translate([s * blade_pitch/2, 0, 0]) blade();
    translate([-neck_hx, -blade_w/2, ins_pt - eps]) cube([2 * neck_hx, blade_w/2 + neck_up, tw_z1 + 0.4 - ins_pt + 2*eps]);
    difference() {
        translate([-head_hx, -blade_w/2, tw_z1 + 0.4]) cube([2 * head_hx, blade_w/2 + head_up, head_t]);
        for (x = [-4.5 : 1.5 : 4.5]) translate([x - 0.35, -blade_w/2 - 1, tw_z1 + 0.4 + head_t - 0.6]) cube([0.7, 20, 1]);
    }
}
// on its side: blades become fins standing on the bed (strong along their length)
module anchor_print() translate([0, 0, blade_w/2]) rotate([90, 0, 0]) anchor();

// ------------------------------------------------------------
//  PREVIEW props
// ------------------------------------------------------------
oy = -ch_ep;                                     // lower outlet centre, frame coords
module wall_and_outlet() {
    color("#f6f4ef") translate([0, oy + rec_pitch/2, -5]) linear_extrude(5)
        offset(r = 2) square([69.85 - 4, 114.3 - 4], center = true);
    for (y = [oy, oy + rec_pitch]) color("#d7d2c8") translate([0, y, 0]) {
        for (s = [-1, 1]) translate([s * blade_pitch/2 - 1, -3.5, -0.2]) cube([2, 7, 0.4]);
        translate([0, -11.9, -0.2]) cylinder(d = 5, h = 0.4);
    }
    color("#9a958d") translate([0, oy + rec_pitch/2, 0]) cylinder(d = 8, h = 1.2);
}
module charger() color("#f4f4f2") {
    translate([-ch_T/2, -ch_L, 0]) minkowski() {
        translate([2, 2, 2]) cube([ch_T - 4, ch_L - 4, ch_D - 4]);
        sphere(r = 2, $fn = 16);
    }
}
module plug(z, len) color("#f1f1f1") translate([0, ledge_y - len, z]) {
    translate([-5, 0, -3.5]) cube([10, len, 7]);
    translate([-1.8, -60, -1.8]) cube([3.6, 60, 3.6]);
}
module lectrofan() {
    color("#f2f2ef") at_lf() translate([0, 0, panel_z1]) linear_extrude(lf_d - 0.6) oct2d();
    color("#c9c9c6") at_lf() translate([0, 0, panel_z1 + lf_d - 0.6]) linear_extrude(0.6) offset(r = -2.8) oct2d();
    // buttons on the top face
    color("#dcdcd8") for (x = [-14, 14]) translate([Xc + x, Yc + lf_b - 0.5, panel_z1 + 34]) rotate([-90, 0, 0])
        scale([1, 1.7, 1]) cylinder(d = 9, h = 1.5);
}
module cord_coil() color("#ffffff") at_lf() for (k = [0 : 3])
    translate([0, 0, 1.5]) rotate_extrude() translate([24.5 + k * 2.2, 0]) square([1.8, 3.4]);

module preview() {
    wall_and_outlet();
    charger();
    translate([0, oy, 0]) for (s = [-1, 1]) color("#b8b8b8")
        translate([s * blade_pitch/2 - 0.75, -3.2, -12]) cube([1.5, 6.4, 12]);
    plug(40, 36);     // phone cable out through the comb
    color("#f1f1f1") translate([0, ledge_y - 33, 13]) translate([-5, 0, -3.5]) cube([10, 33, 7]);   // LectroFan plug
    lectrofan();
    cord_coil();
    color("#2b2b2b") frame();
    color("#3a3a3a") translate([0, oy + rec_pitch, 0]) anchor();
}
module travel() {
    charger();
    lectrofan();
    color("#2b2b2b") frame();
    // anchor parked: plate on the garage roof, blades down in their sheaths
    color("#3a3a3a") translate([-cx_o - gar_w/2, gar_y1, gar_zc]) rotate([-90, 0, 0]) rotate([0, 0, 90]) anchor();
}

// pictures are shown standing up (wall vertical, room toward the viewer)
module upright() rotate([90, 0, 0]) children();

if (PART == "frame")             frame();
else if (PART == "anchor")       anchor_print();
else if (PART == "travel")       upright() travel();
else if (PART == "frame_view")   upright() color("#2b2b2b") frame();
else if (PART == "back_view")    upright() { color("#2b2b2b") frame(); cord_coil(); }
else                             upright() preview();
