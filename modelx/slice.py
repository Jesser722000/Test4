#!/usr/bin/env python3
"""Make the print files for a Creality K2 Plus / K2 Pro from stl/*.stl.

  print/modelx_huskers_3color.3mf      red / white / black parts on filaments 1 / 2 / 3
                                       (open in Creality Print with the CFS, or OrcaSlicer)
  print/modelx_huskers_1swap.3mf       one-colour model with a colour change at the beltline
  print/modelx_K2_1swap_PLA.gcode      ready to print on any K2: red, pauses once for black
  print/modelx_K2_CFS_3color_EXPERIMENTAL.gcode   three-colour G-code for the CFS (untested)
"""
import os, re, subprocess, sys
import trimesh
import export3mf

HERE = os.path.dirname(os.path.abspath(__file__))
P = os.environ.get('MX_PRINT', os.path.join(HERE, 'print'))
os.makedirs(P, exist_ok=True)
RED, WHITE, BLACK = '#C8102E', '#F3EFE6', '#1A1A1A'
Z_SWAP = 45.0          # first black layer: the side-glass beltline

base = open(os.path.join(HERE, 'print', 'k2_base.ini')).read()


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
    'filament_density': '1.24',
    'retract_before_travel': '0.6',     # no ooze hairs across the hinge gaps
    'wipe': '1',
}
one = dict(common, filament_colour=RED, extruder_colour=RED,
           color_change_gcode='M117 Load BLACK PLA, then resume\\nPAUSE')
def x3(v):
    return ','.join([v] * 3)


three = dict(common,
             nozzle_diameter=x3('0.4'), extruder_colour=f'{RED};{WHITE};{BLACK}', filament_colour=f'{RED};{WHITE};{BLACK}',
             filament_type='PLA;PLA;PLA', filament_diameter=x3('1.75'), filament_density=x3('1.24'),
             filament_max_volumetric_speed=x3('20'),
             temperature=x3('220'), first_layer_temperature=x3('225'), bed_temperature=x3('60'),
             first_layer_bed_temperature=x3('60'), fan_always_on=x3('1'), min_fan_speed=x3('100'),
             max_fan_speed=x3('100'), bridge_fan_speed=x3('100'), disable_fan_first_layers=x3('1'),
             slowdown_below_layer_time=x3('4'), min_print_speed=x3('20'),
             retract_length=x3('0.8'), retract_before_travel=x3('0.6'), wipe=x3('1'), retract_speed=x3('40'), deretract_speed=x3('40'), retract_lift=x3('0.2'),
             retract_length_toolchange=x3('2'), retract_restart_extra_toolchange=x3('0'),
             single_extruder_multi_material='1', wipe_tower='0',
             cooling_tube_length='0', cooling_tube_retraction='0', parking_pos_retraction='0',
             extra_loading_move='0', single_extruder_multi_material_priming='0',
             filament_ramming_parameters='; '.join(['"120 100 | 0.05 0.05"'] * 3),
             filament_cooling_moves=x3('0'), filament_loading_speed=x3('28'), filament_unloading_speed=x3('90'),
             start_gcode='M140 S0\\nM104 S0\\nSTART_PRINT EXTRUDER_TEMP=[first_layer_temperature[initial_tool]] '
                         'BED_TEMP=[first_layer_bed_temperature[initial_tool]]',
             # park clear of the part, let the firmware's T command (cut, unload, load, purge into the
             # chute) do the change, come back down. Nothing moves for the first tool at layer_z = 0.
             toolchange_gcode='{if layer_z > 0}G1 Z{layer_z+0.4} F600\\nG1 X0 Y245 F30000\\n{endif}'
                              'T[next_extruder]\\n{if layer_z > 0}G1 Z{layer_z} F600\\n{endif}')

for name, o in (('k2_pla_1swap.ini', one), ('k2_pla_cfs_3color_experimental.ini', three)):
    open(os.path.join(P, name), 'w').write(ini(o))

S = os.environ.get('MX_OUT', os.path.join(HERE, 'stl'))
red, white, black, onec = (trimesh.load(os.path.join(S, f'modelx_{c}.stl')) for c in ('red', 'white', 'black', 'one_color'))
f3 = os.path.join(P, 'modelx_huskers_3color.3mf')
f1 = os.path.join(P, 'modelx_huskers_1swap.3mf')
export3mf.write(f3, [('red', red, 1), ('white', white, 2), ('black', black, 3)], name='ModelX_Huskers')
export3mf.write(f1, [('model', onec, 1)], name='ModelX_Huskers_1swap', color_change=(Z_SWAP, 1, BLACK))
print('3mf written')

if '--no-gcode' in sys.argv:
    sys.exit()


def run(cfg, src, out):
    cmd = ['prusa-slicer', '--load', os.path.join(P, cfg), '--export-gcode', '-o', out, '--center', '150,150', src]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(r.stdout[-1500:], r.stderr[-1500:])
    return r.returncode


run('k2_pla_1swap.ini', f1, os.path.join(P, 'modelx_K2_1swap_PLA.gcode'))
run('k2_pla_cfs_3color_experimental.ini', f3, os.path.join(P, 'modelx_K2_CFS_3color_EXPERIMENTAL.gcode'))
