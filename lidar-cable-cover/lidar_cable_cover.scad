// ============================================================
//  RPLIDAR cable + USB adapter board cover kit
//  Parametric OpenSCAD — all dimensions in mm.
//
//  Parts (set PART below, or pass -D 'PART="hub"' on the CLI):
//    "hub"      Open-bottom cover that drops over the green USB adapter
//               board and hides the coiled-up excess USB cable.
//               Snap-out knockouts let cables in/out wherever you need.
//    "raceway"  Low-profile cable channel cover (lidar -> hub, hub -> edge).
//    "edge"     Raceway that wraps over the deck edge and down the face,
//               so the USB cable disappears into the electronics bay.
//    "bar_raceway"  Wedge-shaped channel that tucks into the corner where a
//               bar (mast column / base housing) meets the deck, taped to both.
//    "bar_housing"  Same wedge, wider in the middle: hides the USB adapter
//               board against the bar, with tapered ends that blend into
//               the bar raceway.
//    "preview"  All parts laid out on a mock deck (for looking only).
//    "hub_underside"  The hub flipped over, to see the inside.
//
//  Every part is already oriented for printing: no supports needed.
// ============================================================

PART = "preview";

/* ---------- Hub cover ---------- */
hub_len     = 140;   // outside length (X)
hub_wid     = 85;    // outside width  (Y)
hub_h       = 20;    // outside height — keep below the lidar's scan window
hub_r       = 10;    // plan-view corner radius
hub_chamfer = 3;     // chamfer on the top edge
wall        = 2.4;   // side wall thickness
roof        = 2.4;   // top thickness

spool_od    = 30;    // post the spare USB cable is coiled around
spool_wall  = 2.4;
spool_pos   = [33, 6];   // post centre, relative to hub centre

pad         = 12;    // solid corner blocks (double-sided tape pads)

// Knockouts: cable slots along the bottom edge of the walls.
ko_w        = 11;    // slot width  (fits 2 cables side by side)
ko_h        = 8;     // slot height
ko_slit     = 0.6;   // gap around the snap-out plug
ko_web      = 1.0;   // wall left at the hinge line (snap it here)
// [side, offset along that side]   side: 0=-X end, 1=+X end, 2=-Y side, 3=+Y side
knockouts   = [[0, 0], [1, 0], [2, -35], [2, 35], [3, -35], [3, 35]];

/* ---------- Raceway (shared by "raceway" and "edge") ---------- */
rw_w        = 24;    // outside width
rw_h        = 8;     // outside height
rw_chamfer  = 3;     // top edge chamfers
ch_w        = 10;    // channel width  (two ~4 mm cables side by side)
ch_h        = 6;     // channel height
rw_len      = 120;   // straight piece length (fits most beds; print several)
ramp_start  = true;  // 45° ramp on the start end (cable emerges through it)
ramp_end    = false; // ramp on the far end (leave square to butt against hub)

/* ---------- Edge wrap ---------- */
edge_run    = 40;    // length lying on the top of the deck
edge_drop   = 30;    // length hanging down the front face
edge_cut    = 6;     // 45° chamfer on the outside corner

/* ---------- Bar-hugging pieces (run along the mast / base housing) ---------- */
// Cross-section (u = out from the bar face, v = up):
//   back face flat against the bar, flat top, 45° slope down to a thin lip on the deck.
bar_back    = 1.6;   // wall between the channel and the bar face
bar_H       = 13;    // height against the bar
bar_flat    = 9;     // flat top before the 45° slope
bar_lip     = 2;     // height of the front lip on the deck
bch_w       = 10;    // channel width (out from the bar)
bch_h       = 6.5;   // channel height
bar_len     = 120;   // piece length
// End cuts: 0 = square, 1 = 45° mitre for an inside corner (bar turns toward you),
//          -1 = 45° mitre for an outside corner (wrapping round the end of a bar).
// bar_len is measured along the bar face, so set it to the bar's length.
bar_start   = 0;
bar_end     = 0;
side_entry  = 40;    // where a flat raceway joins from the side (-1 = none)

hs_pocket_w   = 22;  // board pocket, out from the bar (board lies flat)
hs_pocket_h   = 12;  // board pocket height (USB-C plug overmold is the tallest part)
hs_pocket_len = 85;  // board + plug length
hs_H          = 16;  // housing height against the bar
hs_flat       = 26;  // flat top before the 45° slope
hs_taper      = 18;  // length of each tapered end

$fn = 64;
eps = 0.01;

// ------------------------------------------------------------
//  Helpers
// ------------------------------------------------------------
module rrect(l, w, r) {
    offset(r = r) square([l - 2*r, w - 2*r], center = true);
}

// Raceway cross-section in (u = across, v = up) — the outside shape.
module rw_profile() {
    c = rw_chamfer;
    polygon([[-rw_w/2, 0], [rw_w/2, 0], [rw_w/2, rw_h - c],
             [rw_w/2 - c, rw_h], [-rw_w/2 + c, rw_h], [-rw_w/2, rw_h - c]]);
}

// Profile extruded along +X from x=0 to x=len (installed orientation).
module rw_bar(len) {
    rotate([90, 0, 90]) linear_extrude(len) rw_profile();
}

// ------------------------------------------------------------
//  HUB (modelled installed: deck at z=0, open side down)
// ------------------------------------------------------------
module hub_outer() {
    hull() {
        linear_extrude(hub_h - hub_chamfer) rrect(hub_len, hub_wid, hub_r);
        translate([0, 0, hub_h - eps])
            linear_extrude(eps) rrect(hub_len - 2*hub_chamfer,
                                      hub_wid - 2*hub_chamfer,
                                      hub_r - hub_chamfer);
    }
}

module hub_cavity() {
    translate([0, 0, -eps])
        linear_extrude(hub_h - roof + eps)
            rrect(hub_len - 2*wall, hub_wid - 2*wall, hub_r - wall);
}

// Places children on a wall: local X runs along the wall,
// local Y points outward, origin at the wall's outer face, z=0 at the deck.
module on_side(side, off) {
    if (side == 0) translate([-hub_len/2, off, 0]) rotate([0, 0, 90])  children();
    if (side == 1) translate([ hub_len/2, off, 0]) rotate([0, 0, -90]) children();
    if (side == 2) translate([off, -hub_wid/2, 0]) rotate([0, 0, 180]) children();
    if (side == 3) translate([off,  hub_wid/2, 0])                     children();
}

// Cuts that free a snap-out plug: two side slits + a score line on the inside.
module knockout_cuts() {
    // side slits, right through the wall
    for (sx = [-1, 1])
        translate([sx * (ko_w/2 + ko_slit/2) - ko_slit/2, -wall - 1, -eps])
            cube([ko_slit, wall + 2, ko_h + eps]);
    // score groove on the inside face along the top of the plug
    translate([-ko_w/2 - ko_slit, -wall - 1, ko_h - 0.6])
        cube([ko_w + 2*ko_slit, 1 + (wall - ko_web), 1.2]);
}

module hub() {
    difference() {
        union() {
            difference() { hub_outer(); hub_cavity(); }
            // corner tape pads
            intersection() {
                hub_outer();
                for (sx = [-1, 1], sy = [-1, 1])
                    translate([sx * (hub_len/2 - pad/2), sy * (hub_wid/2 - pad/2), (hub_h - roof)/2])
                        cube([pad, pad, hub_h - roof + eps], center = true);
            }
            // spool post
            translate([spool_pos[0], spool_pos[1], 0])
                cylinder(d = spool_od, h = hub_h - roof + eps);
        }
        // hollow the spool post (saves plastic, still a full ring of tape area)
        translate([spool_pos[0], spool_pos[1], -eps])
            cylinder(d = spool_od - 2*spool_wall, h = hub_h - roof - 1);
        for (k = knockouts) on_side(k[0], k[1]) knockout_cuts();
    }
}

// ------------------------------------------------------------
//  STRAIGHT RACEWAY (installed: base at z=0, runs along +X)
// ------------------------------------------------------------
module raceway(len = rw_len, rs = ramp_start, re = ramp_end) {
    difference() {
        rw_bar(len);
        // channel
        translate([-1, -ch_w/2, -eps]) cube([len + 2, ch_w, ch_h + eps]);
        // 45° ramps: plane through the bottom edge of the end
        if (rs)
            translate([0, 0, 0]) rotate([0, -45, 0])
                translate([-rw_h * 2, -rw_w, 0]) cube([rw_h * 2, rw_w * 2, rw_h * 3]);
        if (re)
            translate([len, 0, 0]) rotate([0, 45, 0])
                translate([0, -rw_w, 0]) cube([rw_h * 2, rw_w * 2, rw_h * 3]);
    }
}

// ------------------------------------------------------------
//  EDGE WRAP (installed: deck top at z=0, deck front face at x=0,
//  deck occupies x<0, z<0; run lies on top, drop hangs at x>=0)
// ------------------------------------------------------------
module edge_wrap() {
    // half-space x - z >= 0 (beyond the 45° mitre line through the corner)
    module beyond_mitre() rotate([0, 45, 0]) translate([0, -100, -100]) cube(200);
    difference() {
        union() {
            // horizontal run, extended through the corner, cut at the mitre
            difference() {
                translate([-edge_run, 0, 0]) rw_bar(edge_run + rw_h);
                beyond_mitre();
            }
            // vertical drop: profile whose base faces -X, running down
            intersection() {
                translate([0, 0, rw_h]) rotate([0, 90, 0]) rw_bar(edge_drop + rw_h);
                beyond_mitre();
            }
        }
        // outside corner chamfer
        translate([rw_h, 0, rw_h]) rotate([0, 45, 0])
            cube([edge_cut * sqrt(2), 2*rw_w, edge_cut * sqrt(2)], center = true);
        // L-shaped channel
        translate([-edge_run - 1, -ch_w/2, -eps]) cube([edge_run + 1 + ch_h, ch_w, ch_h + eps]);
        translate([-eps, -ch_w/2, -edge_drop - 1]) cube([ch_h + eps, ch_w, edge_drop + 1 + ch_h]);
    }
}

// ------------------------------------------------------------
//  BAR-HUGGING PIECES (installed: deck at z=0, bar face at y=0,
//  bar occupies y<0, piece runs along +X)
// ------------------------------------------------------------
// Wedge cross-section: H tall at the bar, `flat` wide on top, 45° down to `lip`.
function wedge_w(H, flat) = flat + (H - bar_lip);
module wedge_profile(H, flat) {
    polygon([[0, 0], [wedge_w(H, flat), 0], [wedge_w(H, flat), bar_lip],
             [flat, H], [0, H]]);
}
module wedge_bar(len, H, flat) {
    rotate([90, 0, 90]) linear_extrude(len) wedge_profile(H, flat);
}

// Removes everything past a 45° plan-view mitre at x = x0.
// dir = +1 cuts the far end, -1 the start; mode 1 inside corner, -1 outside.
module mitre_cut(x0, dir, mode) {
    if (mode != 0)
        translate([x0, 0, -1]) rotate([0, 0, dir * mode * 45])
            translate([dir > 0 ? 0 : -300, -150, 0]) cube([300, 300, 100]);
}

module bar_channel(len) {
    translate([-1, bar_back, -eps]) cube([len + 2, bch_w, bch_h + eps]);
}

module bar_raceway(len = bar_len, ms = bar_start, me = bar_end, entry = side_entry) {
    W = wedge_w(bar_H, bar_flat);
    // an outside mitre has to reach W past the bar's end at the front lip
    x0 = ms == -1 ? -W : 0;
    x1 = me == -1 ? len + W : len;
    difference() {
        translate([x0, 0, 0]) wedge_bar(x1 - x0, bar_H, bar_flat);
        translate([x0, 0, 0]) bar_channel(x1 - x0);
        // side entry: notch through the front lip for a flat raceway
        if (entry >= 0)
            translate([entry - ch_w/2 - 0.5, bar_back + bch_w - 1, -eps])
                cube([ch_w + 1, W, bch_h + eps]);
        mitre_cut(0, -1, ms);
        mitre_cut(len, 1, me);
    }
}

module bar_housing() {
    L = hs_pocket_len + 2 * hs_taper;
    difference() {
        hull() {
            translate([hs_taper, 0, 0]) wedge_bar(hs_pocket_len, hs_H, hs_flat);
            wedge_bar(eps, bar_H, bar_flat);
            translate([L - eps, 0, 0]) wedge_bar(eps, bar_H, bar_flat);
        }
        bar_channel(L);
        translate([hs_taper, bar_back, -eps]) cube([hs_pocket_len, hs_pocket_w, hs_pocket_h + eps]);
    }
}

// ------------------------------------------------------------
//  Print orientation wrappers (flip upside-down onto the bed)
// ------------------------------------------------------------
module hub_print()     { translate([0, 0, hub_h]) rotate([180, 0, 0]) hub(); }
module raceway_print() { translate([0, 0, rw_h]) rotate([180, 0, 0]) raceway(); }
// bar pieces print as installed: flat bottom on the bed, bridges over the channel
module bar_raceway_print() { bar_raceway(); }
module bar_housing_print() { bar_housing(); }
// edge: outer top of the run on the bed, drop leg standing up
module edge_print()    { translate([0, 0, rw_h]) rotate([180, 0, 0]) edge_wrap(); }

// ------------------------------------------------------------
//  Preview scene (installed orientation on a mock deck)
// ------------------------------------------------------------
module preview() {
    hs_L = hs_pocket_len + 2 * hs_taper;
    // deck (top at z=0, front face at x=0)
    color("#2e2e2e") translate([-400, -150, -6]) cube([400, 300, 6]);
    color("#2e2e2e") translate([-6, -150, -70]) cube([6, 300, 64]);
    // the bar (mast base housing) — occupies y<0
    color("#1c1c1c") translate([-300, -90, 0]) cube([260, 90, 60]);
    color("#1c1c1c") translate([-200, -70, 0]) cube([60, 60, 300]);
    // lidar on its mount (stand-in)
    color("#151515") translate([-260, 110, 0]) {
        translate([-40, -40, 0]) cube([80, 80, 3]);
        translate([-28, -28, 3]) cube([56, 56, 22]);
        translate([0, 0, 25]) cylinder(d = 56, h = 20);
    }
    W = wedge_w(bar_H, bar_flat);
    color("#5a5a5a") {
        // lidar -> side entry of the bar raceway
        translate([-260, 110 - 40, 0]) rotate([0, 0, -90]) raceway(110 - 40 - W, true, false);
        translate([-300, 0, 0]) bar_raceway(70, 0, 0, 40);
        translate([-230, 0, 0]) bar_housing();
        translate([-230 + hs_L, 0, 0]) bar_raceway(-40 - (-230 + hs_L), 0, 0, -1);
        translate([0, bar_back + bch_w/2, 0]) edge_wrap();
    }
}
// Hub seen from underneath, to show the inside
module hub_underside() { rotate([180, 0, 0]) hub(); }

if (PART == "hub")     hub_print();
if (PART == "raceway") raceway_print();
if (PART == "edge")    edge_print();
if (PART == "bar_raceway") bar_raceway_print();
if (PART == "bar_housing") bar_housing_print();
if (PART == "preview") preview();
if (PART == "hub_underside") hub_underside();
