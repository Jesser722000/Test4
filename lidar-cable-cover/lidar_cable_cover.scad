// ============================================================
//  RPLIDAR USB adapter pod — v5 (standalone)
//  Parametric OpenSCAD — all dimensions in mm.
//
//  A self-contained pod that sits on the deck on its own. The base
//  tray holds the green USB adapter board in a cradle and has a post
//  to coil the spare USB cable around. The lid snaps on. The lidar
//  cable comes in through one round port and the USB cable leaves
//  through another; when the lid is on, each port closes into a neat
//  round grommet around the cable.
//
//  Parts (set PART, or -D 'PART="pod_base"' on the CLI):
//    "pod_base"   Tray: board cradle, coil post, cable ports.
//    "pod_lid"    Snap-on lid (prints upside down).
//    "preview"    Closed pod.   "exploded"   Lid lifted, board shown.
//
//  Both parts are already oriented for printing. No supports.
// ============================================================

PART = "preview";

/* ---------- Measured parts ---------- */
board_w   = 25.4;   // adapter board width                (1")
board_len = 40;     // board incl. white JST connector    (1 9/16")
plug_len  = 24;     // Logitech USB-C plug overmold       (~1")
plug_w    = 12;     // plug overmold width
cable_d   = 4;      // thickest cable (USB-C)

/* ---------- Pod ---------- */
in_L    = 98;       // inside length (X)
in_W    = 80;       // inside width  (Y)
in_H    = 13;       // inside height (board + plug ~10, 3 layers of coiled cable)
wall    = 2.4;
floor_t = 2;
roof_t  = 2;
corner_r = 12;      // plan-view corner radius
top_ch  = 3;        // chamfer round the top of the lid
base_h  = 10;       // height of the base tray (the seam line)

/* ---------- Coil post ---------- */
post_od  = 38;      // keeps the USB cable's bend gentle
post_wall = 2;

/* ---------- Cable ports ---------- */
port_d = 5;         // round grommet hole when the lid is on
// [wall, offset along it]  wall: 0 = -X end, 1 = +X end, 2 = front (-Y), 3 = back (+Y)
// Lidar port sits right at the JST connector; USB port faces the way the cable goes now.
lidar_port = [3, -35];
usb_port   = [2, -5];

/* ---------- Fit ---------- */
lip_h   = 3.5;      // lid lip that drops inside the base wall
lip_t   = 1.2;
clear   = 0.15;     // per side
bump_r  = 0.5;      // snap detents

$fn = 72;
eps = 0.01;

L = in_L + 2 * wall;
W = in_W + 2 * wall;
H = floor_t + in_H + roof_t;

bx0 = -in_L/2 + 1.5;                 // board cradle: left edge
by0 = in_W/2 - 5 - board_len;        // board: plug end (JST end is toward +Y)
post_c = [in_L/2 - post_od/2 - 15.5, 0];

// ------------------------------------------------------------
module rrect(l, w, r) offset(r = r) square([l - 2*r, w - 2*r], center = true);

// Place children on a wall: local X runs along the wall, local Y points
// outward, origin on the outer face, z = 0 at the bottom of the pod.
module on_wall(side, off) {
    if (side == 0) translate([-L/2, off, 0]) rotate([0, 0, 90])  children();
    if (side == 1) translate([ L/2, off, 0]) rotate([0, 0, -90]) children();
    if (side == 2) translate([off, -W/2, 0]) rotate([0, 0, 180]) children();
    if (side == 3) translate([off,  W/2, 0])                     children();
}

port_z = floor_t + port_d/2;         // port centre height
module port_slot()                   // U-slot through the base wall
    translate([0, -wall - 1, 0]) rotate([-90, 0, 0]) linear_extrude(wall + 2) {
        translate([0, -port_z]) circle(d = port_d);
        translate([-port_d/2, -base_h - 1]) square([port_d, base_h + 1 - port_z]);
    }
module port_tab()                    // lid tab that closes the top of the slot
    translate([0, -wall, 0]) rotate([-90, 0, 0]) linear_extrude(wall - 0.2) difference() {
        translate([-(port_d - 0.3)/2, -base_h - 1]) square([port_d - 0.3, base_h - port_z + 1]);
        translate([0, -port_z]) circle(d = port_d);
    }

bump_xs = [-25, 25];

// ------------------------------------------------------------
//  BASE (as installed: bottom on the deck at z = 0)
// ------------------------------------------------------------
module pod_base() {
    difference() {
        union() {
            // shell with a small chamfer at the bed (no elephant's foot)
            hull() {
                linear_extrude(eps) rrect(L - 1.6, W - 1.6, corner_r - 0.8);
                translate([0, 0, 0.8]) linear_extrude(base_h - 0.8) rrect(L, W, corner_r);
            }
        }
        translate([0, 0, floor_t]) linear_extrude(base_h) rrect(in_L, in_W, corner_r - wall);
        for (p = [lidar_port, usb_port]) on_wall(p[0], p[1]) port_slot();
        // snap dimples on the long walls
        for (x = bump_xs, s = [-1, 1])
            translate([x, s * in_W/2, base_h - lip_h/2]) sphere(r = bump_r + 0.1, $fn = 24);
        // finger notch at the seam, +X end
        translate([L/2 - 1, -7, base_h - 1.5]) cube([2, 14, 2]);
        // shallow pocket under the floor for double-sided tape
        translate([0, 0, -eps]) linear_extrude(0.4 + eps) rrect(L - 16, W - 16, corner_r - 6);
    }
    // board cradle: side rails + a saddle each side of the plug
    for (x = [bx0 - 1.4, bx0 + board_w + 0.2])
        translate([x, by0 + 2, floor_t - eps]) cube([1.2, board_len - 8, 2.5]);
    for (s = [-1, 1])
        translate([bx0 + board_w/2 + s * (plug_w/2 + 0.4) - (s < 0 ? 1.5 : 0),
                   by0 - plug_len + 4, floor_t - eps]) cube([1.5, plug_len - 10, 4]);
    // coil post
    translate([post_c[0], post_c[1], floor_t - eps]) difference() {
        cylinder(d = post_od, h = in_H - 0.5);
        translate([0, 0, 1]) cylinder(d = post_od - 2 * post_wall, h = in_H);
    }
}

// ------------------------------------------------------------
//  LID (modelled in place, sitting on the base)
// ------------------------------------------------------------
module pod_lid() {
    il = in_L - 2 * clear;
    iw = in_W - 2 * clear;
    difference() {
        union() {
            // shell
            difference() {
                hull() {
                    translate([0, 0, base_h]) linear_extrude(H - base_h - top_ch) rrect(L, W, corner_r);
                    translate([0, 0, H - eps]) linear_extrude(eps)
                        rrect(L - 2 * top_ch, W - 2 * top_ch, corner_r - top_ch);
                }
                // lid wall = base wall + lip, so the lip grows out of it
                translate([0, 0, base_h - eps]) linear_extrude(H - roof_t - base_h + eps)
                    rrect(il - 2 * lip_t, iw - 2 * lip_t, corner_r - wall - clear - lip_t);
            }
            // lip that drops inside the base
            translate([0, 0, base_h - lip_h]) linear_extrude(lip_h + eps) difference() {
                rrect(il, iw, corner_r - wall - clear);
                rrect(il - 2 * lip_t, iw - 2 * lip_t, corner_r - wall - clear - lip_t);
            }
            // snap bumps
            for (x = bump_xs, s = [-1, 1])
                translate([x, s * (iw/2 - 0.1), base_h - lip_h/2]) sphere(r = bump_r, $fn = 24);
            // port tabs
            for (p = [lidar_port, usb_port]) on_wall(p[0], p[1]) port_tab();
            // ring that centres in the coil post
            translate([post_c[0], post_c[1], floor_t + in_H - 2.5]) difference() {
                cylinder(d = post_od - 2 * post_wall - 0.4, h = 3);
                translate([0, 0, -1]) cylinder(d = post_od - 2 * post_wall - 3, h = 5);
            }
        }
        // clear the lip where the cables pass
        for (p = [lidar_port, usb_port]) on_wall(p[0], p[1])
            translate([-port_d/2 - 1, -wall - lip_t - 1, 0]) cube([port_d + 2, lip_t + 1.5, base_h + eps]);
    }
}

// ------------------------------------------------------------
//  Previews
// ------------------------------------------------------------
module mock_board() {
    color("#2f8f4e") translate([bx0, by0, floor_t]) cube([board_w, board_len - 6, 1.6]);
    color("#eeeeee") translate([bx0 + 3, by0 + board_len - 7, floor_t + 1.6]) cube([board_w - 6, 7, 6]);
    color("#555555") translate([bx0 + board_w/2 - plug_w/2, by0 - plug_len, floor_t + 0.5]) cube([plug_w, plug_len, 6.5]);
    // lidar cable in through the back port
    color("#151515") hull() {
        translate([bx0 + board_w/2, by0 + board_len, floor_t + 3]) sphere(d = 3);
        translate([bx0 + board_w/2, W/2 + 15, port_z]) sphere(d = 3);
    }
    // USB cable coiled round the post, tail out of the front port
    color("#333333") translate([post_c[0], post_c[1], floor_t + 2])
        for (k = [0:2]) translate([0, 0, k * 3.6])
            rotate_extrude() translate([post_od/2 + 3 + k * 1.5, 0]) circle(d = cable_d);
}

module preview() {
    color("#2b2b2b") pod_base();
    color("#333333") pod_lid();
}
module exploded() {
    color("#2b2b2b") pod_base();
    mock_board();
    color("#333333") translate([0, 0, 45]) pod_lid();
}

module print_part() {
    if (PART == "pod_base") pod_base();
    if (PART == "pod_lid")  translate([0, 0, H]) rotate([180, 0, 0]) pod_lid();
}

if (PART == "preview")       preview();
else if (PART == "exploded") exploded();
else print_part();
