// ============================================================
//  RPLIDAR cable cover kit — v3 "stealth"
//  Parametric OpenSCAD — all dimensions in mm.
//
//  One continuous, low, rounded cover that runs from the lidar, along
//  the bars (mast column / base housing), over the board, and down
//  into the electronics bay. Pieces join with hidden filament dowels.
//
//  Parts (set PART, or -D 'PART="bar_run_entry"' on the CLI):
//    "lidar_run"      Low dome from the lidar to the bar. Tapered nose
//                     at the lidar end; the cable slips out of its tip.
//    "bar_run_entry"  Quarter-round strip tucked into the bar/deck corner,
//                     with a moulded-in T where the lidar run joins.
//    "board_housing"  Board stands on edge against the bar; ends taper
//                     smoothly into the bar runs.
//    "bar_run_exit"   Bar strip that flows into a dome where the cable
//                     leaves the bar.
//    "deck_run"       Plain dome segment (cut to length with deck_len).
//    "edge_top"       Elbow, top half: lies on the deck, mitred at the edge.
//    "edge_drop"      Elbow, bottom half: goes down the front face.
//    "preview"        Assembled on a mock robot base.
//    "cutaway"        Board housing with the board and cables shown inside.
//
//  All parts are already oriented for printing. No supports.
//  Joints: 1.75 mm filament offcuts as dowels (cut to 8 mm).
// ============================================================

PART = "preview";

/* ---------- Cable channel (same everywhere) ---------- */
ch_w   = 9;      // two ~4 mm cables side by side
ch_h   = 5;
wall   = 1.2;    // wall between channel and the bar

/* ---------- Bar strip: quarter-round, back against the bar ---------- */
bar_W  = 16;     // how far it comes out onto the deck
bar_H  = 11;     // how high it sits on the bar

/* ---------- Deck dome: half-ellipse ---------- */
dome_a = 11;     // half width  (22 mm wide)
dome_b = 8;      // height

/* ---------- Board housing (board stands on its edge) ---------- */
pocket_d   = 9;    // board thickness incl. the JST connector
pocket_h   = 19;   // board width (standing up) + clearance
pocket_len = 85;   // board + USB-C plug overmold
hs_W       = 24;
hs_H       = 26;
hs_taper   = 20;   // smooth transition to the bar strip at each end

/* ---------- Piece lengths / options ---------- */
entry_len  = 70;   // bar_run_entry length
entry_at   = 35;   // where the lidar T joins, from the start
stub_len   = 15;   // how far the T sticks out past the bar strip
exit_len   = 40;   // bar_run_exit length along the bar
exit_T     = 25;   // length of the quarter-round -> dome transition
lidar_len  = 90;
lidar_fade = 25;   // tapered nose length
deck_len   = 60;
edge_run   = 40;   // elbow: length on top of the deck
edge_drop  = 30;   // elbow: length down the front face
// End mitres for bar_run_entry: 0 square, 1 inside corner, -1 outside corner
mitre_start = 0;
mitre_end   = 0;

/* ---------- Details ---------- */
tape_rec = 0.4;    // recess depth for thin double-sided tape (flush fit)
pin_d    = 1.95;   // dowel hole for 1.75 mm filament
pin_len  = 4;      // hole depth each side

$fn = 72;
eps = 0.01;
cy  = wall + ch_w/2;          // channel centre, measured out from the bar

// ------------------------------------------------------------
//  Profiles (u across, v up)
// ------------------------------------------------------------
function qpts(W, H, n = 48) =
    concat([[0, 0]], [for (i = [0:n]) let(t = 90 * i / n) [W * cos(t), H * sin(t)]]);
function dpts(a, b, n = 72) =
    [for (i = [0:n]) let(t = 180 * i / n) [a * cos(t), b * sin(t)]];

// Extrude a 2D profile along +X (u -> Y, v -> Z)
module along_x(len) rotate([90, 0, 90]) linear_extrude(len) children();

module qbar(len, W = bar_W, H = bar_H) along_x(len) polygon(qpts(W, H));
module dbar(len, a = dome_a, b = dome_b) along_x(len) polygon(dpts(a, b));

// Dowel holes — bar strip end face / dome end face, axis along X
module bar_pins(x) for (p = [[12.5, 2.5], [cy, 8]])
    translate([x, p[0], p[1]]) rotate([0, 90, 0]) cylinder(d = pin_d, h = 2 * pin_len, center = true, $fn = 24);
module dome_pins(x, yc = 0) for (s = [-1, 1])
    translate([x, yc + s * 7.5, 2]) rotate([0, 90, 0]) cylinder(d = pin_d, h = 2 * pin_len, center = true, $fn = 24);

// ------------------------------------------------------------
//  Bar strip pieces (installed: deck z=0, bar face y=0, bar at y<0)
// ------------------------------------------------------------
module mitre_cut(x0, dir, mode) {
    if (mode != 0)
        translate([x0, 0, -1]) rotate([0, 0, dir * mode * 45])
            translate([dir > 0 ? 0 : -300, -150, 0]) cube([300, 300, 100]);
}

module bar_tape(x0, x1) {
    // back face (against the bar) and bottom strip (on the deck)
    translate([x0, -eps, 1.5]) cube([x1 - x0, tape_rec + eps, bar_H - 4]);
    translate([x0, wall + ch_w + 1, -eps]) cube([x1 - x0, bar_W - wall - ch_w - 2.5, tape_rec + eps]);
}

module bar_run(len, ms = 0, me = 0, entry = -1, stub = stub_len, exitT = 0) {
    x0 = ms == -1 ? -bar_W : 0;
    x1 = me == -1 ? len + bar_W : len;
    difference() {
        union() {
            translate([x0, 0, 0]) qbar(x1 - x0);
            if (entry >= 0)      // moulded-in T for the lidar run
                translate([entry, 0, 0]) rotate([0, 0, 90]) dbar(bar_W + stub);
            if (exitT > 0)       // flow from quarter-round into a dome
                hull() {
                    translate([len - eps, 0, 0]) qbar(eps);
                    translate([len + exitT - eps, cy, 0]) dbar(eps);
                }
        }
        // channel
        translate([x0 - 1, wall, -eps]) cube([x1 - x0 + exitT + 2, ch_w, ch_h + eps]);
        if (entry >= 0) {
            translate([entry - ch_w/2, wall, -eps]) cube([ch_w, bar_W + stub + 1, ch_h + eps]);
            translate([entry, bar_W + stub, 0]) rotate([0, 0, 90]) dome_pins(0);
        }
        bar_tape(max(x0, 0) + 2, min(x1, len) - 2);
        mitre_cut(0, -1, ms);
        if (exitT == 0) mitre_cut(len, 1, me);
        if (ms == 0) bar_pins(0);
        if (me == 0 && exitT == 0) bar_pins(len);
        if (exitT > 0) dome_pins(len + exitT, cy);
    }
}

module board_housing() {
    L = pocket_len + 2 * hs_taper;
    difference() {
        hull() {
            qbar(eps);
            translate([hs_taper, 0, 0]) qbar(pocket_len, hs_W, hs_H);
            translate([L - eps, 0, 0]) qbar(eps);
        }
        translate([-1, wall, -eps]) cube([L + 2, ch_w, ch_h + eps]);
        translate([hs_taper, wall, -eps]) cube([pocket_len, pocket_d, pocket_h + eps]);
        // tape pockets
        translate([hs_taper, -eps, 2]) cube([pocket_len, tape_rec + eps, hs_H - 8]);
        translate([hs_taper, wall + pocket_d + 1.5, -eps])
            cube([pocket_len, hs_W - wall - pocket_d - 4, tape_rec + eps]);
        bar_pins(0);
        bar_pins(L);
    }
}

// ------------------------------------------------------------
//  Dome pieces (installed: deck z=0, centred on y=0, along +X)
// ------------------------------------------------------------
module dome_tape(x0, x1) for (s = [-1, 1])
    translate([x0, s > 0 ? ch_w/2 + 2 : -dome_a + 1.2, -eps])
        cube([x1 - x0, dome_a - 1.2 - ch_w/2 - 2, tape_rec + eps]);

module deck_run(len, fade = 0) {
    difference() {
        hull() {
            if (fade > 0) dbar(eps, 7.5, 6.2);       // slim nose
            translate([fade, 0, 0]) dbar(len - fade);
        }
        translate([-1, -ch_w/2, -eps]) cube([len + 2, ch_w, ch_h + eps]);
        dome_tape(fade + 2, len - 2);
        if (fade == 0) dome_pins(0);
        dome_pins(len);
    }
}

// Elbow over the deck edge. Installed: deck top z=0, front face x=0,
// deck at x<0, z<0. Split on the 45° plane x = z; dowels across the joint.
module beyond_mitre() rotate([0, 45, 0]) translate([0, -100, -100]) cube(200);
module elbow_pins() for (s = [-1, 1])
    translate([2, s * 7.5, 2]) rotate([0, 135, 0]) cylinder(d = pin_d, h = 2 * pin_len, center = true, $fn = 24);

module edge_top() {
    difference() {
        translate([-edge_run, 0, 0]) dbar(edge_run + dome_b);
        beyond_mitre();
        translate([-edge_run - 1, -ch_w/2, -eps]) cube([edge_run + 1 + ch_h, ch_w, ch_h + eps]);
        dome_tape(-edge_run + 2, -2);
        dome_pins(-edge_run);
        elbow_pins();
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
    }
}

// ------------------------------------------------------------
//  Print orientation
// ------------------------------------------------------------
module print_part() {
    if (PART == "lidar_run")     deck_run(lidar_len, lidar_fade);
    if (PART == "deck_run")      deck_run(deck_len);
    if (PART == "bar_run_entry") bar_run(entry_len, mitre_start, mitre_end, entry_at);
    if (PART == "bar_run_exit")  bar_run(exit_len, 0, 0, -1, 0, exit_T);
    if (PART == "board_housing") board_housing();
    if (PART == "edge_top")      edge_top();
    // contact face (against the deck front) down on the bed
    if (PART == "edge_drop")     rotate([0, -90, 0]) edge_drop();
}

// ------------------------------------------------------------
//  Preview scenes
// ------------------------------------------------------------
module mock_board() {
    color("#2f8f4e") translate([5, wall + 1, 1]) cube([40, 1.6, 16]);       // PCB on edge
    color("#eeeeee") translate([0, wall + 2.6, 4]) cube([7, 5, 9]);          // JST
    color("#444444") translate([45, wall + 1.5, 5]) cube([30, 6.5, 9]);      // USB-C plug
}

module preview() {
    hs_L = pocket_len + 2 * hs_taper;
    bx0 = -330;                       // bar start
    bx1 = bx0 + entry_len + hs_L + exit_len;
    // deck and robot
    color("#2a2a2a") translate([-420, -150, -6]) cube([420, 320, 6]);
    color("#2a2a2a") translate([-6, -150, -70]) cube([6, 320, 64]);
    color("#161616") translate([bx0, -90, 0]) cube([bx1 - bx0, 90, 70]);
    color("#161616") translate([-280, -75, 0]) cube([70, 60, 320]);
    color("#121212") translate([bx0 + entry_at, 120, 0]) {
        translate([-40, -40, 0]) cube([80, 80, 3]);
        translate([-28, -28, 3]) cube([56, 56, 22]);
        translate([0, 0, 25]) cylinder(d = 56, h = 20);
    }
    color("#3b3b3b") {
        stub_end = bar_W + stub_len;
        translate([bx0 + entry_at, 80, 0]) rotate([0, 0, -90]) deck_run(80 - stub_end, lidar_fade);
        translate([bx0, 0, 0]) bar_run(entry_len, 0, 0, entry_at);
        translate([bx0 + entry_len, 0, 0]) board_housing();
        translate([bx0 + entry_len + hs_L, 0, 0]) bar_run(exit_len, 0, 0, -1, 0, exit_T);
        gap = -edge_run - (bx1 + exit_T);
        translate([bx1 + exit_T, cy, 0]) deck_run(gap);
        translate([0, cy, 0]) { edge_top(); edge_drop(); }
    }
}

module cutaway() {
    difference() {
        color("#3b3b3b") board_housing();
        translate([-1, -1, 10]) cube([200, 60, 40]);   // slice the top off
    }
    translate([hs_taper + 3, 0, 0]) mock_board();
    color("#111") translate([-5, cy - 2.2, 2]) rotate([0, 90, 0]) cylinder(d = 3.5, h = hs_taper + 8);
    color("#111") translate([hs_taper + 78, cy + 2, 2]) rotate([0, 90, 0]) cylinder(d = 4, h = hs_taper + 15);
}

if (PART == "preview")      preview();
else if (PART == "cutaway") cutaway();
else print_part();
