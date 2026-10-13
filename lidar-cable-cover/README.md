# RPLIDAR cable cover kit

Hides the lidar cable and the green USB adapter board by running them along the black bars on the deck (the mast column and its base housing). The covers tuck into the corner where a bar meets the deck.

| File | What it is | Print |
|---|---|---|
| `bar_raceway.stl` | 120 mm wedge-shaped channel, 20 mm deep × 13 mm tall. Its back sits flat against the bar and its front slopes down at 45° to the deck. It has a side opening 40 mm from the start for the cable coming from the lidar. | 1–3× |
| `bar_housing.stl` | Same wedge, but 40 × 16 mm in the middle, to hide the adapter board and its USB-C plug against the bar. Its tapered ends blend into the bar raceway. | 1× |
| `raceway.stl` | 120 mm flat channel (24 × 8 mm) with a 45° ramp on one end, for the short open stretch from the lidar to the bar | 1× |
| `edge.stl` | Channel that goes over the deck edge and 30 mm down the front face | 1× |
| `hub.stl` | *(Optional, from the first version)* 140 × 85 mm box that also stores the coiled-up spare USB cable | — |
| `lidar_cable_cover.scad` | Parametric source (OpenSCAD) | — |

**Routing:** lidar → `raceway` (short, flat) → side opening in `bar_raceway` → along the bar → `bar_housing` (over the board) → `bar_raceway` → `edge` → down into the electronics bay.

**Turning corners along a bar:** set `bar_start` / `bar_end` in the `.scad` file. Use `1` for an inside corner (where two bars meet) or `-1` to wrap around the end of a bar. Each setting cuts a 45° mitre, so two pieces meet cleanly. Set `bar_len` to the length of that bar face. Set `side_entry` (mm from the start) to where the lidar cable joins, or `-1` for no opening.

![preview](render_preview.png)

## Measure these first (dimensions are estimated from photos)
1. **Adapter board + USB-C plug**: they must fit in the housing pocket (85 long × 22 deep × 12 tall mm). Set `hs_pocket_*` to change it.
2. **Cable diameters**: the channel is 10 × 6 mm, which fits two cables of about 4 mm side by side.
3. **Bar lengths**: measure each bar face the cable will follow and set `bar_len`.
4. **Front face**: check where the cable enters the electronics bay. Set `edge_drop` to that depth.

To change something, edit the variables at the top of the `.scad` file and re-export:
`openscad -o hub.stl -D 'PART="hub"' lidar_cable_cover.scad` (PART = `bar_raceway` | `bar_housing` | `raceway` | `edge` | `hub`).

## Printing
- The STLs are already oriented for printing and need **no supports**. The bar pieces print flat side down. The others print upside down.
- PLA or PETG, black matte. Use a 0.2 mm layer height, 3 walls and 15–20 % infill.

## Installing
1. Stick the adapter board to the deck right against the bar, using a small foam tape pad.
2. Lay the cables into the corner where the bar meets the deck.
3. Put VHB / 3M double-sided tape on the back face (bar side) and the front strip (deck side) of each bar piece. Press each piece into the corner over the cables.
4. Bring the lidar cable over in the flat `raceway`. Put its ramp end at the lidar and butt the other end against the side opening of the bar raceway.
5. Where the cable leaves the bar, the `edge` piece takes it over the deck edge and into the bay.
6. Coil the spare USB cable and fasten it with a velcro strap **inside the electronics bay** where it's out of sight. (Or use the optional `hub` to coil it up on the deck.)

Tip: if you can get a **short (25–30 cm) USB-C cable, ideally right-angle**, you won't have much slack to coil, and the hub can be made smaller (`hub_len`, `hub_wid`).
