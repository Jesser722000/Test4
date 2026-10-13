// ============================================================
//  RPLIDAR cable cover kit — v6 (fitted, fully enclosed)
//  Parametric OpenSCAD — all dimensions in mm.
//
//  Layout (top view, column in the middle, deck front edge at the bottom):
//
//        lidar ── lidar_run ──┐ side_strip (along the column's left face)
//                             │
//                             └──┐ 45° outside corner
//                                ├─ front_housing ─┐  (along the column front,
//                                                  │   board stands on edge)
//                                         deck_run │  (232 mm to the edge)
//                                                  │
//                                     edge_top / edge_drop  (over the edge)
//
//  Parts (set PART, or -D 'PART="front_housing"' on the CLI):
//    "lidar_run"      Low dome from the lidar; tapered nose at the lidar end.
//    "side_strip"     Quarter-round strip along the column's lidar-side face with a
//                     moulded T for the lidar run; grows into the housing
//                     profile and mitres round the column's front corner.
//    "front_housing"  Spans the column front face, hides the USB adapter
//                     board, and turns the USB cable out toward the edge.
//    "deck_run"       Dome from the housing to the deck edge.
//    "edge_top"       Elbow top half (on the deck, mitred at the edge).
//    "edge_drop"      Elbow bottom half (down the front face).
//    "preview" / "cutaway"   Pictures only.
//
//    "floor_plates"   One print with the six thin floors that click into the
//                     underside of each piece, so every run is a closed tube.
//    "underside"      Picture: housing flipped over with its floor lifted out.
//
//  Every part is already oriented for printing. No supports.
//  Joints: 1.75 mm filament offcuts as dowels (8 mm long).
// ============================================================

PART = "preview";

/* ---------- Measured on the robot ---------- */
col_w       = 84;    // column front face width            (3 5/16")
col_to_edge = 232;   // column front face -> deck front edge (9 1/8")
board_w     = 25.4;  // adapter board width                 (1")
board_len   = 40;    // board incl. white JST connector     (1 9/16")
plug_len    = 24;    // Logitech USB-C plug overmold        (~1")

/* ---------- Still to confirm (sensible defaults) ---------- */
side_len    = 80;    // side strip length along the column's left face
entry_at    = 20;    // lidar T, from the strip's rear end (= 60 mm behind the column front)
lidar_len   = 100;   // lidar run length (lidar mount sits ~120 mm left of the column)
// Which side the lidar is on, standing at the deck's front edge facing the column.
lidar_on_left = true;
edge_drop   = 30;    // how far down the deck front face to go

/* ---------- Cable channel (same everywhere) ---------- */
ch_w   = 9;      // lidar cable + USB-C cable side by side
ch_h   = 6.2;    // 5 mm clear once the 1.2 mm floor plate is in
wall   = 1.2;

/* ---------- Profiles ---------- */
bar_W  = 16;     // quarter-round strip: out from the column
bar_H  = 13;     //                      up the column
dome_a = 11;     // dome half width (22 wide)
dome_b = 9.5;    // dome height

/* ---------- Housing (board stands on edge, JST facing out) ---------- */
pocket_d  = 9;                              // board + JST height
pocket_h  = board_w + 2.6;                  // board standing on the floor plate + clearance
pocket_x0 = 4;                              // from the column's left corner
pocket_x1 = col_w - 4;                      // leaves a 4 mm end wall
hs_W      = 24;
hs_H      = 35;
exit_at   = pocket_x1 - 8;                  // USB cable turns out here
stub_len  = 10;                             // stubs stick out this far past the profile
taper     = 20;                             // side strip: strip -> housing profile

/* ---------- Elbow ---------- */
edge_run = 40;

/* ---------- Details ---------- */
tape_rec = 0.4;    // pockets for thin double-sided tape (sits flush)
pin_d    = 1.95;   // dowel holes for 1.75 mm filament
pin_len  = 4;

/* ---------- Floor plates (close the bottom of every piece) ---------- */
plate_t   = 1.2;   // thickness = depth of the recess, so it sits flush
plate_lip = 1.5;   // how far the plate overlaps past the channel each side
plate_clr = 0.1;   // press fit, per side

$fn = 72;
eps = 0.01;
cy  = wall + ch_w/2;
stub_out = hs_W + stub_len;                         // housing exit stub reach
deck_len = col_to_edge - stub_out - edge_run;       // = 158 with the defaults

// ------------------------------------------------------------
//  Profiles (u across, v up) and extrusion helpers
// ------------------------------------------------------------
function qpts(W, H, n = 48) =
    concat([[0, 0]], [for (i = [0:n]) let(t = 90 * i / n) [W * cos(t), H * sin(t)]]);
function dpts(a, b, n = 72) =
    [for (i = [0:n]) let(t = 180 * i / n) [a * cos(t), b * sin(t)]];

module along_x(len) rotate([90, 0, 90]) linear_extrude(len) children();
module qbar(len, W = bar_W, H = bar_H) along_x(len) polygon(qpts(W, H));
module dbar(len, a = dome_a, b = dome_b) along_x(len) polygon(dpts(a, b));

// Soft closed end: the profile shrinks 25 % over the last 3 mm.
module q_cap(x, dir, W, H) hull() {
    translate([x - dir * 3, 0, 0]) qbar(eps, W, H);
    translate([x, 0, 0]) qbar(eps, W * 0.75, H * 0.75);
}

module pin(p, axis_rot) translate(p) rotate(axis_rot)
    cylinder(d = pin_d, h = 2 * pin_len, center = true, $fn = 24);
module dome_pins(x, yc = 0) for (s = [-1, 1]) pin([x, yc + s * 7.5, 2], [0, 90, 0]);

// T-stub: a dome running out from the column face (+Y) at x, with its channel.
module stub(x, reach) translate([x, 0, 0]) rotate([0, 0, 90]) dbar(reach);
module stub_void(x, reach) {
    translate([x - ch_w/2, wall, -eps]) cube([ch_w, reach + 1, ch_h + eps]);
    translate([x, reach, 0]) rotate([0, 0, 90]) dome_pins(0);
}

// Pins across the 45° outside-corner joint between side_strip and front_housing.
// Given in front_housing coordinates (corner at the origin, joint plane x = -y).
corner_pins = [[16, 6], [5, 30]];          // [u out from face, v up]
module corner_pin_holes_housing()
    for (p = corner_pins) pin([-p[0], p[0], p[1]], [-90, 0, -45]);

// ------------------------------------------------------------
//  Floor plates: 2D outlines of each piece's underside opening (+ overlap)
// ------------------------------------------------------------
pw = ch_w + 2 * plate_lip;                 // plate width over a channel
py = wall + ch_w + plate_lip;              // plate reach out from the column face

module plate2d_dome(len) translate([0, -pw/2]) square([len, pw]);
module plate2d_side() {
    L = side_len;
    x0 = entry_at - pw/2;
    difference() {
        union() {
            translate([x0, wall + plate_clr]) square([L + hs_W - x0, py - wall - plate_clr]);
            translate([x0, wall + plate_clr]) square([pw, bar_W + stub_len - wall - plate_clr]);
        }
        translate([L, 0]) rotate(-45) translate([0, -150]) square(300);
    }
}
module plate2d_housing() difference() {
    union() {
        translate([-hs_W, wall + plate_clr]) square([pocket_x1 + plate_lip + hs_W, py - wall - plate_clr]);
        translate([exit_at - pw/2, wall + plate_clr]) square([pw, stub_out - wall - plate_clr]);
    }
    rotate(45) translate([-300, -150]) square(300);
}
module plate2d_edge_top() translate([-edge_run, -pw/2]) square([edge_run, pw]);
module plate2d_edge_drop() square([edge_drop, pw]);    // laid flat

// Recess for a plate in the underside (z = 0) of a piece
module plate_recess() translate([0, 0, -eps])
    linear_extrude(plate_t + eps) offset(delta = plate_clr) children();

// ------------------------------------------------------------
//  SIDE STRIP  (local: runs +X from its rear end to the column's
//  front corner at x = side_len; column face at y = 0, column at y < 0)
// ------------------------------------------------------------
module side_strip() {
    L = side_len;
    difference() {
        union() {
            q_cap(0, -1, bar_W, bar_H);
            translate([3, 0, 0]) qbar(L - taper - 3);
            hull() {                                   // grow into the housing profile
                translate([L - taper, 0, 0]) qbar(eps);
                translate([L, 0, 0]) qbar(hs_W, hs_W, hs_H);
            }
            stub(entry_at, bar_W + stub_len);
        }
        // keep x <= L + y  (45° outside corner)
        translate([L, 0, -1]) rotate([0, 0, -45]) translate([0, -150, 0]) cube([300, 300, 100]);
        // channel: from the lidar T to the corner
        translate([entry_at - ch_w/2, wall, -eps]) cube([L + hs_W, ch_w, ch_h + eps]);
        stub_void(entry_at, bar_W + stub_len);
        // tape pockets
        translate([6, -eps, 1.5]) cube([L - taper - 6, tape_rec + eps, bar_H - 4]);
        plate_recess() plate2d_side();
        // dowels to the housing (mirror of the housing's holes)
        for (p = corner_pins) pin([L + p[0], p[0], p[1]], [-90, 0, 45]);
    }
}

// ------------------------------------------------------------
//  FRONT HOUSING  (local: column front face at y = 0, column at y < 0,
//  x = 0 at the column's left corner, x = col_w at its right corner)
// ------------------------------------------------------------
module front_housing() {
    difference() {
        union() {
            translate([-hs_W, 0, 0]) qbar(col_w - 3 + hs_W, hs_W, hs_H);
            q_cap(col_w, 1, hs_W, hs_H);
            stub(exit_at, stub_out);
        }
        // keep x >= -y  (45° outside corner)
        rotate([0, 0, 45]) translate([-300, -150, -1]) cube([300, 300, 100]);
        // channel along the bottom, from the corner to the exit
        translate([-hs_W - 1, wall, -eps]) cube([exit_at + hs_W + 1, ch_w, ch_h + eps]);
        // board pocket
        translate([pocket_x0, wall, -eps]) cube([pocket_x1 - pocket_x0, pocket_d, pocket_h + eps]);
        stub_void(exit_at, stub_out);
        // tape pockets
        translate([pocket_x0, -eps, 2]) cube([pocket_x1 - pocket_x0, tape_rec + eps, hs_H - 8]);
        corner_pin_holes_housing();
        plate_recess() plate2d_housing();
    }
}

// ------------------------------------------------------------
//  DOME RUNS  (local: along +X, centred on y = 0)
// ------------------------------------------------------------
module dome_tape(x0, x1) for (s = [-1, 1])
    translate([x0, s > 0 ? ch_w/2 + 2 : -dome_a + 1.2, -eps])
        cube([x1 - x0, dome_a - 1.2 - ch_w/2 - 2, tape_rec + eps]);

module dome_run(len, fade = 0) {
    difference() {
        hull() {
            if (fade > 0) dbar(eps, 8.5, 8);         // slim nose
            translate([fade, 0, 0]) dbar(len - fade);
        }
        translate([-1, -ch_w/2, -eps]) cube([len + 2, ch_w, ch_h + eps]);
        if (fade == 0) dome_pins(0);
        dome_pins(len);
        plate_recess() plate2d_dome(len);
    }
}

// Elbow. Local: deck top z=0, deck front face x=0, deck at x<0, z<0.
module beyond_mitre() rotate([0, 45, 0]) translate([0, -100, -100]) cube(200);
module elbow_pins() for (s = [-1, 1]) pin([2, s * 7.5, 2], [0, 135, 0]);

module edge_top() {
    difference() {
        translate([-edge_run, 0, 0]) dbar(edge_run + dome_b);
        beyond_mitre();
        translate([-edge_run - 1, -ch_w/2, -eps]) cube([edge_run + 1 + ch_h, ch_w, ch_h + eps]);
        dome_pins(-edge_run);
        elbow_pins();
        plate_recess() plate2d_edge_top();
    }
}
module edge_drop() {
    difference() {
        intersection() {
            translate([0, 0, dome_b]) rotate([0, 90, 0]) dbar(edge_drop + dome_b);
            beyond_mitre();
        }
        translate([-eps, -ch_w/2, -edge_drop - 1]) cube([ch_h + eps, ch_w, edge_drop + 1 + ch_h]);
        elbow_pins();
        // floor plate on the back face (against the deck front)
        translate([-eps, -pw/2 - plate_clr, -edge_drop - 1])
            cube([plate_t + eps, pw + 2 * plate_clr, edge_drop + 1 + plate_clr]);
    }
}

// The model is drawn with the lidar on the right; mirror for a left-hand lidar.
module handed() { if (lidar_on_left) mirror([1, 0, 0]) children(); else children(); }

// ------------------------------------------------------------
//  Print orientation (flat side down; elbow drop on its back)
// ------------------------------------------------------------
// Mirror a plate with its piece, then shift it back to x >= 0 for the bed.
module bed_handed(x_lo, x_hi) {
    if (lidar_on_left) translate([x_hi, 0]) mirror([1, 0]) children();
    else translate([-x_lo, 0]) children();
}

module floor_plates() {
    linear_extrude(plate_t) {
        translate([0, 0])    plate2d_dome(deck_len);
        translate([0, 16])   plate2d_dome(lidar_len);
        translate([110 + edge_run, 16]) plate2d_edge_top();
        translate([160, 16 - pw/2]) plate2d_edge_drop();
        translate([0, 26])   bed_handed(entry_at - pw/2, side_len + hs_W) plate2d_side();
        translate([0, 58])   bed_handed(-hs_W, pocket_x1 + plate_lip) plate2d_housing();
    }
}

module print_part() {
    if (PART == "floor_plates")  floor_plates();
    if (PART == "lidar_run")     dome_run(lidar_len, 25);
    if (PART == "side_strip")    handed() side_strip();
    if (PART == "front_housing") handed() front_housing();
    if (PART == "deck_run")      dome_run(deck_len);
    if (PART == "edge_top")      edge_top();
    if (PART == "edge_drop")     rotate([0, -90, 0]) edge_drop();
}

// ------------------------------------------------------------
//  Preview: global = front_housing coordinates. Column occupies
//  x 0..col_w, y < 0; the deck front edge is at y = col_to_edge.
// ------------------------------------------------------------
module mock_board() {
    x = pocket_x0 + 2;
    color("#2f8f4e") translate([x + 6, wall + 0.5, 0.5]) cube([board_len - 6, 1.6, board_w]);  // PCB
    color("#eeeeee") translate([x, wall + 2.1, 8]) cube([6, 6, 12]);                          // JST
    color("#555555") translate([x + board_len, wall + 0.5, 7]) cube([plug_len, 6.5, 12]);     // plug
}

module preview() {
    ye = -side_len + entry_at;               // lidar T, global y
    xs = -(bar_W + stub_len);                // end of the lidar T stub
    color("#262626") translate([-300, -200, -6]) cube([500, 200 + col_to_edge, 6]);
    color("#262626") translate([-300, col_to_edge - 6, -70]) cube([500, 6, 64]);
    color("#141414") translate([0, -110, 0]) cube([col_w, 110, 380]);           // column
    color("#141414") translate([col_w, -110, 0]) cube([110, 80, 55]);           // base bar
    color("#101010") translate([xs - lidar_len - 45, ye, 0]) {                  // lidar
        translate([-40, -40, 0]) cube([80, 80, 3]);
        translate([-28, -28, 3]) cube([56, 56, 22]);
        translate([0, 0, 25]) cylinder(d = 56, h = 20);
    }
    color("#3b3b3b") {
        translate([xs - lidar_len, ye, 0]) dome_run(lidar_len, 25);
        translate([0, -side_len, 0]) rotate([0, 0, 90]) side_strip();
        front_housing();
        translate([exit_at, stub_out, 0]) rotate([0, 0, 90]) dome_run(deck_len);
        translate([exit_at, col_to_edge, 0]) rotate([0, 0, 90]) { edge_top(); edge_drop(); }
    }
}

module cutaway() {
    difference() {
        color("#3b3b3b") front_housing();
        translate([-40, -1, 14]) cube([200, 80, 40]);
    }
    color("#6a6a6a") linear_extrude(plate_t) plate2d_housing();
    translate([0, 0, plate_t]) mock_board();
}

module underside() {
    rotate([180, 0, 0]) {
        color("#3b3b3b") front_housing();
        color("#7a7a7a") translate([0, 0, -25]) linear_extrude(plate_t) plate2d_housing();
    }
}

if (PART == "preview")      handed() preview();
else if (PART == "cutaway") handed() cutaway();
else if (PART == "underside") handed() underside();
else print_part();
