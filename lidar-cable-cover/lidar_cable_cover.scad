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
//  Print orientation wrappers (flip upside-down onto the bed)
// ------------------------------------------------------------
module hub_print()     { translate([0, 0, hub_h]) rotate([180, 0, 0]) hub(); }
module raceway_print() { translate([0, 0, rw_h]) rotate([180, 0, 0]) raceway(); }
// edge: outer top of the run on the bed, drop leg standing up
module edge_print()    { translate([0, 0, rw_h]) rotate([180, 0, 0]) edge_wrap(); }

// ------------------------------------------------------------
//  Preview scene (installed orientation on a mock deck)
// ------------------------------------------------------------
module preview() {
    // deck (top at z=0, front face at x=0)
    color("#2e2e2e") translate([-400, -150, -6]) cube([400, 300, 6]);
    color("#2e2e2e") translate([-6, -150, -70]) cube([6, 300, 64]);
    // lidar on its mount (stand-in)
    color("#151515") translate([-330, 0, 0]) {
        translate([-40, -40, 0]) cube([80, 80, 3]);
        translate([-28, -28, 3]) cube([56, 56, 22]);
        translate([0, 0, 25]) cylinder(d = 56, h = 20);
    }
    color("#5a5a5a") {
        translate([-290, 0, 0]) raceway(50, true, false);   // lidar -> hub
        translate([-170, 0, 0]) hub();                      // board + cable coil
        translate([-100, 0, 0]) raceway(60, false, false);  // hub -> edge
        edge_wrap();                                        // over the edge
    }
}
// Hub seen from underneath, to show the inside
module hub_underside() { rotate([180, 0, 0]) hub(); }

if (PART == "hub")     hub_print();
if (PART == "raceway") raceway_print();
if (PART == "edge")    edge_print();
if (PART == "preview") preview();
if (PART == "hub_underside") hub_underside();
