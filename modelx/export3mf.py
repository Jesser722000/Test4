"""Write PrusaSlicer-format 3MF files.

One object made of several volumes, each with its own extruder.  Creality Print
and OrcaSlicer read these through their PrusaSlicer importer and keep the
per-volume filament assignment.  An optional colour change by height is stored
the way PrusaSlicer stores it.
"""
import zipfile
import numpy as np

CT = ('<?xml version="1.0" encoding="UTF-8"?>\n'
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>'
      '</Types>')
RELS = ('<?xml version="1.0" encoding="UTF-8"?>\n'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Target="/3D/3dmodel.model" Id="rel0" '
        'Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')


def write(path, volumes, name='ModelX', config=None, color_change=None):
    """volumes: list of (volume name, trimesh, extruder 1-based).
    color_change: (print_z, extruder, '#rrggbb') for a single-extruder colour change."""
    verts, tris, ranges = [], [], []
    off = 0
    first = 0
    for vname, m, ext in volumes:
        v = np.asarray(m.vertices, float)
        f = np.asarray(m.faces, np.int64) + off
        verts.append(v)
        tris.append(f)
        ranges.append((vname, first, first + len(f) - 1, ext))
        off += len(v)
        first += len(f)
    V = np.vstack(verts)
    T = np.vstack(tris)
    vx = '\n'.join(f'<vertex x="{a:.4f}" y="{b:.4f}" z="{c:.4f}"/>' for a, b, c in V)
    tx = '\n'.join(f'<triangle v1="{a}" v2="{b}" v3="{c}"/>' for a, b, c in T)
    model = ('<?xml version="1.0" encoding="UTF-8"?>\n'
             '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" '
             'xmlns:slic3rpe="http://schemas.slic3r.org/3mf/2017/06">\n'
             '<metadata name="slic3rpe:Version3mf">1</metadata>\n'
             '<metadata name="Application">PrusaSlicer-2.7.2</metadata>\n'
             f'<metadata name="Title">{name}</metadata>\n'
             '<resources>\n<object id="1" type="model">\n<mesh>\n<vertices>\n' + vx +
             '\n</vertices>\n<triangles>\n' + tx + '\n</triangles>\n</mesh>\n</object>\n</resources>\n'
             '<build>\n<item objectid="1" printable="1"/>\n</build>\n</model>\n')
    cfg = ['<?xml version="1.0" encoding="UTF-8"?>\n<config>\n<object id="1" instances_count="1">',
           f' <metadata type="object" key="name" value="{name}"/>']
    for vname, a, b, ext in ranges:
        cfg += [f' <volume firstid="{a}" lastid="{b}">',
                f'  <metadata type="volume" key="name" value="{vname}"/>',
                '  <metadata type="volume" key="volume_type" value="ModelPart"/>',
                f'  <metadata type="volume" key="extruder" value="{ext}"/>',
                '  <mesh edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>',
                ' </volume>']
    cfg += ['</object>\n</config>\n']
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.writestr('[Content_Types].xml', CT)
        z.writestr('_rels/.rels', RELS)
        z.writestr('3D/3dmodel.model', model)
        z.writestr('Metadata/Slic3r_PE_model.config', '\n'.join(cfg))
        if config:
            z.writestr('Metadata/Slic3r_PE.config', config)
        if color_change:
            zc, ext, col = color_change
            z.writestr('Metadata/Prusa_Slicer_custom_gcode_per_print_z.xml',
                       '<?xml version="1.0" encoding="utf-8"?>\n<custom_gcodes_per_print_z>\n'
                       f'<code print_z="{zc:.3f}" type="0" extruder="{ext}" color="{col}" extra="" gcode="M600"/>\n'
                       '<mode value="SingleExtruder"/>\n</custom_gcodes_per_print_z>\n')
