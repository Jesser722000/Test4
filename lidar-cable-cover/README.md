# RPLIDAR cable cover kit

Hides the lidar cable, the green USB adapter board and the spare USB-C cable on the robot deck.

| File | What it is | Print |
|---|---|---|
| `hub.stl` | 140 × 85 × 20 mm cover with an open bottom. It drops over the adapter board, and the spare USB cable coils around the post inside. | 1× |
| `raceway.stl` | 120 mm low cable channel (24 × 8 mm) with a 45° ramp on one end | 1–2× |
| `edge.stl` | Channel that goes over the deck edge and 30 mm down the front face | 1× |
| `lidar_cable_cover.scad` | Parametric source (OpenSCAD) | — |

![preview](render_preview.png)

## Measure these first (dimensions are estimated from photos)
1. **Adapter board + USB-C plug**: they must fit inside the hub (about 133 × 78 × 17 mm inside).
2. **Cable diameters**: the channel is 10 × 6 mm, which fits two cables of about 4 mm side by side.
3. **Lidar scan window height**: the hub (20 mm tall) must stay below the lidar's spinning window. Change `hub_h` if needed.
4. **Front face**: check where the cable enters the electronics bay. Set `edge_drop` to that depth.

To change something, edit the variables at the top of the `.scad` file and re-export:
`openscad -o hub.stl -D 'PART="hub"' lidar_cable_cover.scad` (PART = `hub` | `raceway` | `edge`).

## Printing
- The STLs are already oriented for printing (upside down) and need **no supports**.
- PLA or PETG, black matte. Use a 0.2 mm layer height, 3 walls and 15–20 % infill.

## Installing
1. **Pick the cable slots.** The hub has 6 snap-out knockouts along its bottom edge: one in each end and two in each long side. Snap out only the ones you need. Wiggle the plug with pliers and it breaks along the scored line. The rest stay closed so the box looks clean.
2. Stick the adapter board to the deck with a small foam tape pad. Coil the spare USB cable loosely (no tight bends), lay it on the deck and lower the hub over the board and the coil so the post sits in the middle of the coil. The cables leave through the open knockouts.
3. Mount the hub with VHB / 3M double-sided tape on the 4 corner pads and the bottom of the post. Mount the raceways with tape on the two strips beside the channel.
4. Lay the cables in first, then press the raceway down over them. Put the ramp end at the lidar so the cable comes up through it.
5. The edge piece fits over the deck's front edge. The USB cable runs down inside it into the bay.

Tip: if you can get a **short (25–30 cm) USB-C cable, ideally right-angle**, you won't have much slack to coil, and the hub can be made smaller (`hub_len`, `hub_wid`).
