# RPLIDAR cable cover kit (v6 – fitted, fully enclosed)

This is the same route as v4: from the lidar, around the column ("neck"), across its front face over the USB adapter board, then out to the deck edge and down the side the cable already goes. The difference is that **every piece is now a closed tube**. A thin floor plate clicks into a flush recess underneath each piece, so the cables are fully enclosed and the covers don't rely on the robot's surfaces to close them.

![assembled](render_preview.png)

| Floor plate lifted out (housing, upside down) | Board in the housing (cutaway) |
|---|---|
| ![underside](render_underside.png) | ![cutaway](render_cutaway.png) |

## Parts (print 1 of each)
| File | What it is |
|---|---|
| `lidar_run.stl` | Low dome from the lidar, with a tapered nose at the lidar |
| `side_strip.stl` | Strip along the column's lidar-side face. It has a built-in T-junction for the lidar run and wraps the front corner on a pinned 45° joint. |
| `front_housing.stl` | Runs across the column's front face (84 mm). The board stands on its edge inside, and the USB cable turns out toward the edge. |
| `deck_run.stl` | 158 mm dome from the housing to the edge piece |
| `edge_top.stl` + `edge_drop.stl` | Two-piece elbow that goes over the deck edge |
| `floor_plates.stl` | **All six floors in one print**, 1.2 mm thick |

## Measurements used
| What | Value |
|---|---|
| Column front face | 3 5/16" (84 mm) |
| Column front → deck edge | 9 1/8" (232 mm). Housing stub 34 + deck run 158 + edge piece 40 = 232. |
| Board | 1" × 1 9/16" (25.4 × 40 mm), plus a 1" (24 mm) Logitech plug |
| Lidar position | ~120 mm left of the column and ~60 mm behind its front (estimated from the photo) |

## Cable channel
The channel is 9 mm wide by 5 mm high once the floor is in, which fits the lidar cable and the USB-C cable side by side. The covers are a bit taller than in v4 to make room for the floor: the strips are 13 mm tall, the domes 9.5 mm and the housing 35 mm.

## Printing
- Every STL is already oriented for printing and needs **no supports**.
- Matte black PLA or PETG. Use 0.16–0.2 mm layers, 3 walls and 20 % infill.
- Set the seam to "rear" or "aligned".
- If the floor plates are too tight or too loose in their recesses, change `plate_clr` (currently 0.1 mm per side).

## Assembly
1. **Dowels:** cut 1.75 mm filament into 8 mm pieces and press them into the end holes to line the pieces up.
2. **Board:** stand the board in the housing pocket, with the JST connector at the lidar end and the components facing away from the column.
3. **Cables:** turn each piece upside down, lay the cables in the channel, and press its floor plate in. Now each run is a closed tube.
4. **Tape:** stick the pieces down with thin double-sided tape in the recesses on the back and bottom faces.
5. **Elbow:** dowel `edge_top` and `edge_drop` together at the mitre and fit them over the deck edge.

The lidar is assumed to be on the **left**, standing at the deck front edge facing the column. Set `lidar_on_left = false` to mirror the kit.
