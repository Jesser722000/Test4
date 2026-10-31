#!/usr/bin/env python3
"""Make the print files for a Creality K2 Plus / K2 Pro from stl/*.stl.

  print/modelx_huskers_2color.3mf      red + white parts with filament 1 / 2 assigned
                                       (open in Creality Print with the CFS, or OrcaSlicer)
  print/modelx_huskers_1swap.3mf       one-colour model with a colour change at the beltline
  print/modelx_K2_1swap_PLA.gcode      ready to print on any K2: red, pauses once for white
  print/modelx_K2_CFS_2color_EXPERIMENTAL.gcode   two-colour G-code for the CFS (untested)
"""
import os, re, subprocess, sys
import trimesh
import export3mf

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, 'print')
os.makedirs(P, exist_ok=True)
RED, WHITE = '#C8102E', '#F3EFE6'
Z_SWAP = 44.6          # first white layer tops out here: just above the hood/windshield join

base = open(os.path.join(HERE, '..', 'nightdock', 'print', 'creality_k2_black_pla.ini')).read()


def ini(over, src=base):
    lines = src.splitlines()
    out, seen = [], set()
    for ln in lines:
        m = re.match(r'^(\w+)\s*=', ln)
        if m and m.group(1) in over:
            k = m.group(1)
            out.append(f'{k} = {over[k]}')
            seen.add(k)
        elif ln.startswith('#'):
            continue
        else:
            out.append(ln)
    out += [f'{k} = {v}' for k, v in over.items() if k not in seen]
    return '\n'.join(out) + '\n'


common = {
    'printer_notes': 'Creality K2 Plus / K2 Pro',
    'perimeters': '3', 'top_solid_layers': '5', 'bottom_solid_layers': '4',
    'fill_density': '12%', 'fill_pattern': 'gyroid',
    'thick_bridges': '0',                 # keep the 0.4 mm gaps under the falcon-door roofs open
    'bridge_speed': '30', 'bridge_fan_speed': '100',
    'elefant_foot_compensation': '0.1',
    'support_material': '0',
    'brim_width': '3', 'brim_type': 'outer_only',
    'seam_position': 'aligned',
    'gcode_label_objects': 'disabled',
    'pause_print_gcode': 'PAUSE',
}
one = dict(common, filament_colour=RED, extruder_colour=RED,
           color_change_gcode='M117 Load WHITE PLA, then resume\\nPAUSE')
two = dict(common,
           nozzle_diameter='0.4,0.4', extruder_colour=f'{RED};{WHITE}', filament_colour=f'{RED};{WHITE}',
           filament_type='PLA;PLA', filament_diameter='1.75,1.75', filament_max_volumetric_speed='20,20',
           temperature='220,220', first_layer_temperature='225,225', bed_temperature='60,60',
           first_layer_bed_temperature='60,60', fan_always_on='1,1', min_fan_speed='100,100',
           max_fan_speed='100,100', bridge_fan_speed='100,100', disable_fan_first_layers='1,1',
           slowdown_below_layer_time='4,4', min_print_speed='20,20',
           retract_length='0.8,0.8', retract_speed='40,40', deretract_speed='40,40', retract_lift='0.2,0.2',
           retract_length_toolchange='2,2', retract_restart_extra_toolchange='0,0',
           single_extruder_multi_material='1', wipe_tower='0',
           cooling_tube_length='0', cooling_tube_retraction='0', parking_pos_retraction='0',
           extra_loading_move='0', single_extruder_multi_material_priming='0',
           filament_ramming_parameters='"120 100 | 0.05 0.05"; "120 100 | 0.05 0.05"',
           filament_cooling_moves='0,0', filament_loading_speed='28,28', filament_unloading_speed='90,90',
           start_gcode='M140 S0\\nM104 S0\\nSTART_PRINT EXTRUDER_TEMP=[first_layer_temperature[initial_tool]] '
                       'BED_TEMP=[first_layer_bed_temperature[initial_tool]]',
           toolchange_gcode='G1 Z{layer_z+0.4} F600\\nG1 X0 Y245 F30000\\nG1 Z{layer_z} F600')

for name, o in (('k2_pla_1swap.ini', one), ('k2_pla_cfs_2color_experimental.ini', two)):
    open(os.path.join(P, name), 'w').write(ini(o))

red = trimesh.load(os.path.join(HERE, 'stl', 'modelx_red.stl'))
white = trimesh.load(os.path.join(HERE, 'stl', 'modelx_white.stl'))
onec = trimesh.load(os.path.join(HERE, 'stl', 'modelx_one_color.stl'))
f2 = os.path.join(P, 'modelx_huskers_2color.3mf')
f1 = os.path.join(P, 'modelx_huskers_1swap.3mf')
export3mf.write(f2, [('red', red, 1), ('white', white, 2)], name='ModelX_Huskers')
export3mf.write(f1, [('model', onec, 1)], name='ModelX_Huskers_1swap', color_change=(Z_SWAP, 1, WHITE))
print('3mf written')

if '--no-gcode' in sys.argv:
    sys.exit()


def run(cfg, src, out):
    cmd = ['prusa-slicer', '--load', os.path.join(P, cfg), '--export-gcode', '-o', out, '--center', '150,150', src]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(r.stdout[-1500:], r.stderr[-1500:])
    return r.returncode


run('k2_pla_1swap.ini', f1, os.path.join(P, 'modelx_K2_1swap_PLA.gcode'))
run('k2_pla_cfs_2color_experimental.ini', f2, os.path.join(P, 'modelx_K2_CFS_2color_EXPERIMENTAL.gcode'))
