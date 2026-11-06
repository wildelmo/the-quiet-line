"""Author the Quiet Line carriage in Blender and export its web-ready GLB.

Run: blender --background --python scripts/build-train.py -- [--render]
All dimensions are authored in the application's right-handed Y-up coordinates;
the converter P maps them to Blender's Z-up space before glTF export.
"""
from pathlib import Path
import argparse
import json
import math
import random
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/train"
PUBLIC = ROOT / "public/assets/train"
OUT.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)
args = argparse.ArgumentParser()
args.add_argument("--render", action="store_true")
opts = args.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
random.seed(48)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for block in list(bpy.data.materials):
    bpy.data.materials.remove(block)

def P(p):
    return (p[0], -p[2], p[1])

def linear(hex_color):
    c = [int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v < .04045 else ((v + .055) / 1.055) ** 2.4 for v in c) + (1,)

def material(name, color, roughness=.83, metalness=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = linear(color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metalness
    m.diffuse_color = linear(color)
    return m

atlas = material("Painted enamel, walnut and upholstery", "ffffff")
atlas_path = PUBLIC / "carriage-lived-in-atlas.png"
if not atlas_path.exists():
    raise FileNotFoundError(f"Painted atlas required: {atlas_path}")
tex = atlas.node_tree.nodes.new("ShaderNodeTexImage")
tex.image = bpy.data.images.load(str(atlas_path))
tex.image.colorspace_settings.name = "sRGB"
paint = atlas.node_tree.nodes.new("ShaderNodeVertexColor")
paint.layer_name = "Pigment wash"
mix = atlas.node_tree.nodes.new("ShaderNodeMixRGB")
mix.blend_type = "MULTIPLY"
mix.inputs[0].default_value = 1
atlas.node_tree.links.new(tex.outputs["Color"], mix.inputs[1])
atlas.node_tree.links.new(paint.outputs["Color"], mix.inputs[2])
atlas.node_tree.links.new(mix.outputs[0], atlas.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])
brass = material("Aged warm brass", "b59b64", .67, .28)
dark = material("Graphite running gear", "393b35", .92, .14)
lamp = material("Milk glass lamps", "efe3ba", .55)
lamp.node_tree.nodes.get("Principled BSDF").inputs["Emission Color"].default_value = linear("ffe2a5")
lamp.node_tree.nodes.get("Principled BSDF").inputs["Emission Strength"].default_value = .35
glass = material("Quiet single layer glass", "b8d8d4", .86)
glass.node_tree.nodes.get("Principled BSDF").inputs["Alpha"].default_value = .055
glass.surface_render_method = "DITHERED"
glass.use_transparency_overlap = False
glass.use_backface_culling = True

# Six square fields, three columns by two rows. Blender UV origin is lower left.
# Material fields retain a 3% inset; paper keeps its authored internal border.
TILES = {"maroon": (.01, .515, 1/3-.01, .985),
         "cream": (1/3+.01, .515, 2/3-.01, .985),
         "wood": (2/3+.01, .515, .99, .985),
         "red": (.01, .015, 1/3-.01, .485),
         "repaired_red": (1/3+.01, .015, 2/3-.01, .485),
         "route_notice": (2/3+4/1536, .25+4/1024, 1-4/1536, .5-4/1024),
         "pier_notice": (2/3+4/1536, 4/1024, 1-4/1536, .25-4/1024)}
parts = []
door_parts = {"DoorLeftForward": [], "DoorLeftRear": []}
active_door = None
detail_records = []
repaired_seats = []

def finish(obj, pigment="cream", mat=None, bevel=0, smooth=False, top_pigment=None):
    obj.data.materials.append(mat or atlas)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    if bevel:
        mod = obj.modifiers.new("Hand softened edges", "BEVEL")
        mod.width = bevel
        mod.segments = 3 if bevel >= .045 else 1
        mod.affect = "EDGES"
        bpy.ops.object.modifier_apply(modifier=mod.name)
        for face in obj.data.polygons:
            face.use_smooth = True
        norm = obj.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
        norm.keep_sharp = True
        bpy.ops.object.modifier_apply(modifier=norm.name)
    if smooth:
        for face in obj.data.polygons:
            face.use_smooth = True
    # Grain follows each face's longest dimension, rather than cross-cutting the
    # long boards. Selected repairs affect upward cushion faces only.
    uv = obj.data.uv_layers.new(name="Painted atlas") if not obj.data.uv_layers else obj.data.uv_layers.active
    coords = [v.co for v in obj.data.vertices]
    bounds = [(min(v[i] for v in coords), max(v[i] for v in coords)) for i in range(3)]
    for face in obj.data.polygons:
        face_pigment = top_pigment if top_pigment and face.normal.z > .85 else pigment
        u0, v0, u1, v1 = TILES[face_pigment]
        normal_axis = max(range(3), key=lambda i: abs(face.normal[i]))
        axes = [i for i in range(3) if i != normal_axis]
        if pigment == "wood":
            axes.sort(key=lambda a: bounds[a][1]-bounds[a][0])
        if obj.name.startswith("Worn longitudinal floorboard"):
            # The clean central band lies between both painted knots. A broad
            # 115-pixel sample retains fine cross-grain definition; near-full
            # vertical coverage stays continuous along each board, without UV
            # repeat seams or any new geometry/texture/shader work.
            board_index = int(obj.name.rsplit(" ", 1)[1])
            start = .35 + (board_index % 4) * .012
            u0, u1 = 2/3 + start/3, 2/3 + (start+.225)/3
            v0, v1 = .515 + (board_index % 3)*.003, .985-(board_index % 2)*.004
        for loop_idx in face.loop_indices:
            co = obj.data.vertices[obj.data.loops[loop_idx].vertex_index].co
            values = [(co[a] - bounds[a][0]) / max(.001, bounds[a][1] - bounds[a][0]) for a in axes]
            uv.data[loop_idx].uv = (u0 + values[0] * (u1 - u0), v0 + values[1] * (v1 - v0))
    obj["paint_region"] = pigment
    if top_pigment:
        obj["upward_paint_region"] = top_pigment
        obj["repair_normal_y_min"] = .85
    obj["authored_part"] = obj.name
    wash = {"cream": (.94,.95,.94,1), "maroon": (.78,.68,.69,1),
            "wood": (.60,.61,.58,1), "red": (.86,.73,.72,1),
            "route_notice": (1,1,1,1), "pier_notice": (1,1,1,1)}[pigment]
    if obj.name.startswith("Worn longitudinal floorboard"):
        wash = (.51,.55,.55,1)
    if pigment == "maroon" and ("roof" in obj.name.lower() or "eave" in obj.name.lower()):
        wash = (.42,.34,.41,1)
    if mat and mat != atlas:
        wash = (1,1,1,1)
    colors = obj.data.color_attributes.new(name="Pigment wash",type="FLOAT_COLOR",domain="CORNER")
    obj.data.color_attributes.active_color_index = len(obj.data.color_attributes)-1
    obj.data.color_attributes.render_color_index = len(obj.data.color_attributes)-1
    piece_variation = random.uniform(.977, 1.022)
    for face in obj.data.polygons:
        for loop_idx in face.loop_indices:
            co = obj.data.vertices[obj.data.loops[loop_idx].vertex_index].co
            x, y, z = co.x, co.z, -co.y
            shade = piece_variation
            if pigment == "red":
                # Soft sun fading follows the upper cloth and used seat face;
                # texture carries weave/repair, vertices carry only broad wash.
                shade *= .96 + .055*max(0, face.normal.z) + .035*max(0, min(1, (y-1.4)/.5))
            elif pigment == "wood":
                if "window sill" in obj.name or "bench end" in obj.name:
                    shade *= 1.05 + .085*max(0, face.normal.z)
                elif "bench plinth" in obj.name:
                    shade *= .78 + .18*max(0, min(1, (y-.91)/.24))
                elif obj.name.startswith("Worn longitudinal floorboard"):
                    under_bench = max(0, min(1, (abs(x)-.59)/.43))
                    in_bay = max(0, min(1, min(z+6.01, 4.05-z)/.18))
                    in_bay = max(in_bay, max(0, min(1, min(z-5.97, 7.27-z)/.18)))
                    shade *= 1-.23*under_bench*in_bay
            elif pigment in ("cream", "maroon"):
                # A quiet warmer rubbed bevel, never exposed rust or dirt.
                if max(abs(c) for c in face.normal) < .985:
                    shade *= 1.045
                if "dado" in obj.name or "Door lower panel" in obj.name:
                    shade *= .88 + .12*max(0, min(1, (y-.96)/.44))
            if mat and mat != atlas:
                shade = 1
            colors.data[loop_idx].color=tuple(min(1, v*shade) for v in wash[:3])+(1,)
    (door_parts[active_door] if active_door else parts).append(obj)
    obj.select_set(False)
    return obj

def mesh(name, verts, faces, pigment="cream", mat=None, bevel=0, smooth=False, top_pigment=None):
    data = bpy.data.meshes.new(name)
    data.from_pydata([P(p) for p in verts], [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return finish(obj, pigment, mat, bevel, smooth, top_pigment)

def box(name, pos, size, pigment="cream", mat=None, bevel=.015, tilt=0, top_pigment=None):
    x, y, z = pos
    w, h, d = [s / 2 for s in size]
    verts = []
    for a, b, c in [(-w,-h,-d),(w,-h,-d),(w,h,-d),(-w,h,-d),(-w,-h,d),(w,-h,d),(w,h,d),(-w,h,d)]:
        aa, bb = a * math.cos(tilt) - b * math.sin(tilt), a * math.sin(tilt) + b * math.cos(tilt)
        verts.append((x+aa,y+bb,z+c))
    return mesh(name, verts, [(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)], pigment, mat, bevel, top_pigment=top_pigment)

def tint(obj, rgb):
    """Static cloth/ink pigments share the same opaque painted atlas batch."""
    for color in obj.data.color_attributes["Pigment wash"].data:
        color.color = tuple(rgb)+(1,)
    return obj

def record_detail(name, objects, kind, **extra):
    points = [obj.matrix_world @ v.co for obj in objects for v in obj.data.vertices]
    app = [(v.x, v.z, -v.y) for v in points]
    detail_records.append({"id": name, "kind": kind,
        "bounds_m": {"min": [round(min(v[i] for v in app),5) for i in range(3)],
                     "max": [round(max(v[i] for v in app),5) for i in range(3)]},
        "triangles": sum(len(p.vertices)-2 for obj in objects for p in obj.data.polygons),
        **extra})

def tube(name, points, radius, pigment="wood", mat=None, sides=8, closed=False):
    points = [Vector(v) for v in points]
    verts = []
    for i, p in enumerate(points):
        tangent = points[(i+1)%len(points)]-points[i-1] if closed else points[min(i+1,len(points)-1)]-points[max(0,i-1)]
        tangent.normalize()
        axis = Vector((0,1,0)) if abs(tangent.y) < .9 else Vector((1,0,0))
        a = tangent.cross(axis).normalized()
        b = tangent.cross(a).normalized()
        verts.extend(tuple(p+radius*(math.cos(j*math.tau/sides)*a+math.sin(j*math.tau/sides)*b)) for j in range(sides))
    faces = []
    for i in range(len(points) if closed else len(points)-1):
        ni = (i+1)%len(points)
        for j in range(sides):
            faces.append((i*sides+j,i*sides+(j+1)%sides,ni*sides+(j+1)%sides,ni*sides+j))
    if not closed:
        faces.extend([tuple(range(sides-1,-1,-1)),tuple((len(points)-1)*sides+j for j in range(sides))])
    return mesh(name, verts, faces, pigment, mat, smooth=True)

def ring(name, x, y, z, r, radius=.015, mat=brass):
    return tube(name, [(x,y+math.cos(i*math.tau/20)*r,z+math.sin(i*math.tau/20)*r) for i in range(20)], radius, mat=mat, closed=True)

def rounded_rect(width, height, radius, steps=4):
    result=[]
    for cx, cy, start in [(width/2-radius,height/2-radius,0),(-width/2+radius,height/2-radius,90),(-width/2+radius,-height/2+radius,180),(width/2-radius,-height/2+radius,270)]:
        for i in range(steps+1):
            angle=math.radians(start+i*90/steps)
            result.append((cx+radius*math.cos(angle),cy+radius*math.sin(angle)))
    return result

def window_frame(name, side, z, width=1.34, height=1.24, y=2.26, x=None):
    x = side*1.416 if x is None else x
    outer = rounded_rect(width+.15,height+.15,.09)
    inner = rounded_rect(width,height,.055)
    n=len(outer)
    verts=[(x+depth, y+b,z+a) for depth in [-.065,.065] for outline in [outer,inner] for a,b in outline]
    faces=[]
    for i in range(n):
        j=(i+1)%n
        faces.extend([(i,j,2*n+j,2*n+i),(n+j,n+i,3*n+i,3*n+j),(j,i,n+i,n+j),(2*n+i,2*n+j,3*n+j,3*n+i)])
    mesh(name,verts,faces,"wood",bevel=.009)
    # Thin warm inner beading gives the opening a convincing recessed edge.
    tube(name+" inner bead",[(x-side*.074,y+b,z+a) for a,b in inner],.009,"cream",closed=True,sides=5)
    # Single pane: very low opacity; no transmission/refraction pass.
    mesh(name+" glass",[(x,y+b,z+a) for a,b in inner], [tuple(range(n))],mat=glass)

# Continuous floor, individual narrow boards, and a modest raised threshold.
box("Floor structural slab",(0,.805,0),(2.78,.15,15.6),"wood",bevel=.025)
for i in range(11):
    x=-1.25+i*.25
    # Joined top sections let contact pigment ease out at the bench ends. There
    # are no overlapping shadow cards, extra materials or runtime light passes.
    rows=[-7.7,-7.27,-7.09,-6.21,-5.97,-5.77,3.81,4.05,5.97,6.21,7.09,7.27,7.7]
    verts=[(xx,yy,zz) for zz in rows for xx,yy in
           [(x-.121,.882),(x+.121,.882),(x+.121,.900),(x-.121,.900)]]
    faces=[(3,2,1,0),tuple(4*(len(rows)-1)+j for j in range(4))]
    for j in range(len(rows)-1):
        for k in range(4):
            faces.append((j*4+k,j*4+(k+1)%4,(j+1)*4+(k+1)%4,(j+1)*4+k))
    mesh(f"Worn longitudinal floorboard {i:02}",verts,faces,"wood",bevel=.006)
box("Underframe",(0,.63,-.02),(2.48,.25,14.6),mat=dark,bevel=.07)
for z in [-5.25,5.25]:
    box("Bogie cast sideframe",(0,.36,z),(2.28,.24,1.86),mat=dark,bevel=.09)
    for dz in [-.56,.56]:
        tube("Axle",[(-1.14,.31,z+dz),(1.14,.31,z+dz)],.07,mat=dark,sides=10)
        for side in [-1,1]:
            tube("Steel wheel",[(side*.94,.31,z+dz),(side*1.075,.31,z+dz)],.30,mat=dark,sides=24)
            tube("Recessed wheel hub",[(side*1.08,.31,z+dz),(side*1.105,.31,z+dz)],.105,mat=brass,sides=12)
    for side in [-1,1]:
        for dz in [-.59,.59]:
            for spring_y in [.43,.47,.51]:
                box("Leaf suspension",(side*1.16,spring_y,z+dz),(.10,.027,.62),mat=dark,bevel=.01)

window_z=[-6.25,-4.65,-3.05,-1.45,.15,1.75,3.35,6.55]
for side in [-1,1]:
    # Lower panels stop at the boarding opening. The shell has real holes.
    for a,b in [(-7.2,4.30),(5.70,7.55)]:
        box("Maroon lower coachwork",(side*1.405,1.225,(a+b)/2),(.105,.79,b-a),"maroon",bevel=.025)
        box("Interior cream dado",(side*1.342,1.30,(a+b)/2),(.025,.60,b-a-.02),"cream",bevel=.006)
        box("Walnut window sill",(side*1.39,1.623,(a+b)/2),(.19,.075,b-a+.015),"wood",bevel=.025)
        box("Brass beltline",(side*1.466,1.622,(a+b)/2),(.017,.028,b-a),mat=brass,bevel=.007)
        box("Lower body rolled edge",(side*1.43,.885,(a+b)/2),(.10,.085,b-a),"maroon",bevel=.026)
        # Fine spaced ribs cast real restrained shadows in the body paint.
        for k in range(math.ceil((b-a)/.36)):
            zz=a+.18+k*.36
            if zz<b-.10:
                box("Pressed lower panel seam",(side*1.462,1.24,zz),(.010,.62,.012),"maroon",bevel=.004)
    box("Cream window header",(side*1.405,3.015,.15),(.12,.24,14.7),"cream",bevel=.025)
    # Fill only the spaces between the openings, not the windows themselves.
    openings=[(z-.745,z+.745) for z in window_z]+[(4.30,5.70)]
    openings.sort()
    cursor=-7.20
    for a,b in openings:
        if a>cursor:
            box("Cream window pillar",(side*1.405,2.265,(cursor+a)/2),(.12,1.29,a-cursor+.01),"cream",bevel=.016)
        cursor=max(cursor,b)
    if cursor<7.55:
        box("Cream end pillar",(side*1.405,2.265,(cursor+7.55)/2),(.12,1.29,7.55-cursor),"cream",bevel=.02)
    for zz in window_z:
        window_frame("Deep walnut window frame",side,zz)
    # Door surround remains stationary; only the left pair of leaves slides.
    for zz in [4.29,5.71]:
        box("Door jamb",(side*1.405,1.95,zz),(.17,2.13,.09),"cream",bevel=.025)
        box("Door jamb weather seal",(side*1.43,1.95,zz+(.045 if zz<5 else -.045)),(.09,2.06,.023),"wood",bevel=.008)
    box("Door overhead track",(side*1.47,3.045,5),(.12,.14,2.95),"maroon",bevel=.035)
    box("Boarding threshold",(side*1.48,.91,5),(.33,.055,1.44),mat=brass,bevel=.014)
    for index,zc in enumerate([4.65,5.35]):
        active_door=("DoorLeftForward" if index==0 else "DoorLeftRear") if side==-1 else None
        box("Door lower panel",(side*1.43,1.33,zc),(.09,.79,.683),"cream",bevel=.025)
        box("Door inset lower panel",(side*1.486,1.33,zc),(.025,.57,.48),"cream",bevel=.035)
        for edge in [-1,1]:
            box("Door stile",(side*1.43,2.32,zc+edge*.299),(.09,1.25,.085),"cream",bevel=.018)
        box("Door head",(side*1.43,2.925,zc),(.09,.13,.683),"cream",bevel=.018)
        # Smaller glazed inset formed by four wood pieces; no dark solid insert.
        for edge in [-1,1]:
            box("Door window bead",(side*1.43,2.31,zc+edge*.241),(.107,1.05,.033),"wood",bevel=.01)
            box("Door window bead",(side*1.43,2.31+edge*.51,zc),(.107,.035,.49),"wood",bevel=.01)
        # Door glass shares the painted mesh material budget by leaving this narrow opening clear.
        tube("Door pull",[(side*1.506,1.73,zc+( .21 if index==0 else -.21)),(side*1.506,1.99,zc+( .21 if index==0 else -.21))],.015,mat=brass)
        active_door=None

# A barrel roof and its independent interior liner, with rolled eaves.
def roof_shell(name, width, spring, rise, start, end, thickness, pigment):
    outline=[(-width*math.cos(i*math.pi/24),spring+rise*math.sin(i*math.pi/24)) for i in range(25)]
    verts=[(x,y+dy,z) for z in [start,end] for dy in [0,-thickness] for x,y in outline]
    n=len(outline)
    faces=[]
    for i in range(n-1):
        faces.extend([(i,i+1,2*n+i+1,2*n+i),(n+i+1,n+i,3*n+i,3*n+i+1),(i+1,i,n+i,n+i+1),(2*n+i,2*n+i+1,3*n+i+1,3*n+i)])
    faces.extend([(0,2*n,3*n,n),(n-1,2*n-1,4*n-1,3*n-1)])
    return mesh(name,verts,faces,pigment,smooth=True)
roof_shell("Continuous curved maroon roof",1.49,3.10,.60,-7.13,7.58,.07,"maroon")
roof_shell("Curved cream ceiling lining",1.335,3.08,.47,-7.0,7.45,.027,"cream")
for zz in [-7.13,7.58]:
    outline=[(-1.49*math.cos(i*math.pi/24),3.10+.60*math.sin(i*math.pi/24),zz) for i in range(25)]
    mesh("Closed maroon roof end cap",outline,[tuple(range(len(outline)))],"maroon")
for side in [-1,1]:
    mesh("Tapered maroon cab side",[(side*1.40,.88,-7.99),(side*1.40,1.68,-7.75),(side*1.40,1.68,-7.14),(side*1.40,.88,-7.14)],[(0,1,2,3)],"maroon")
    tube("Rolled roof eave",[(side*1.48,3.11,-7.15),(side*1.48,3.11,7.59)],.055,"maroon",sides=10)
    tube("Interior cornice",[(side*1.28,3.16,-6.95),(side*1.28,3.16,7.38)],.045,"wood",sides=8)
for zz in [-5,-1.8,1.4,4.6]:
    box("Roof ventilator base",(0,3.678,zz),(1.0,.07,.64),"maroon",bevel=.12)
    box("Low pressed roof ventilator",(0,3.708,zz),(.75,.10,.44),"maroon",bevel=.11)

# Sloping front, framed split windscreen and tapered cab cheeks.
front_low=[(-1.40,.88,-7.99),(1.40,.88,-7.99),(1.40,1.68,-7.75),(-1.40,1.68,-7.75)]
mesh("Sloping maroon cab apron",front_low,[(0,1,2,3)],"maroon")
box("Cab bumper",(0,.83,-8.00),(2.76,.18,.15),"maroon",bevel=.06)
for side in [-1,1]:
    mesh("Sloped cream cab cheek",[(side*1.40,1.65,-7.76),(side*1.40,3.13,-7.13),(side*1.40,3.13,-7.02),(side*1.40,1.65,-7.02)],[(0,1,2,3)],"cream")
    tube("Sloped windscreen outer post",[(side*1.36,1.66,-7.76),(side*1.36,3.11,-7.14)],.075,"cream",sides=8)
    tube("Headlamp housing",[(side*.96,1.24,-7.91),(side*.96,1.24,-7.985)],.13,mat=dark,sides=20)
    tube("Headlamp milk glass",[(side*.96,1.24,-7.990),(side*.96,1.24,-8.008)],.098,mat=lamp,sides=20)
    mesh("Cab side triangular glazing",[(side*1.408,1.77,-7.65),(side*1.408,2.98,-7.13),(side*1.408,1.77,-7.13)],[(0,1,2)],mat=glass)
tube("Windscreen lower sill",[(-1.35,1.69,-7.755),(1.35,1.69,-7.755)],.065,"cream")
tube("Windscreen upper arch",[(-1.35,3.105,-7.14),(0,3.20,-7.10),(1.35,3.105,-7.14)],.065,"cream")
for xx in [-1.23,0,1.23]:
    tube("Dark sloping windshield mullion",[(xx,1.78,-7.72),(xx,3.03,-7.18)],.034,"wood",sides=8)
for a,b in [(-1.23,0),(0,1.23)]:
    mesh("Front windscreen",[(a,1.78,-7.715),(b,1.78,-7.715),(b,3.03,-7.18),(a,3.03,-7.18)],[(0,1,2,3)],mat=glass)
    tube("Windscreen wiper",[(a+.18,1.83,-7.74),(a+.45,2.38,-7.50),(a+.66,2.55,-7.43)],.012,mat=dark,sides=6)
box("Driver walnut console",(0,1.45,-6.98),(2.16,.15,.54),"wood",bevel=.06)
box("Driver control binnacle",(-.60,1.60,-6.97),(.42,.18,.31),mat=dark,bevel=.04)
for xx in [-.74,-.59,-.44]:
    tube("Control knob",[(xx,1.7,-6.99),(xx,1.77,-6.99)],.025,mat=brass)
box("Cab partition lower",(0,1.23,-6.77),(2.51,.65,.075),"cream",bevel=.025)

# Rear vestibule, central glazed door and a distinct rounded end cap.
# The body surrounds the door instead of sitting behind it. A full-width body
# and this door both put their inner faces at z=7.49: exactly coplanar paint
# flickers between maroon and cream as the camera turns (depth fighting).
for side in [-1,1]:
    box("Rear lower side panel",(side*1.1325,1.22,7.55),(.535,.78,.12),"maroon",bevel=.06)
box("Rear lower door sill",(0,.885,7.55),(1.73,.11,.12),"maroon",bevel=.02)
for xx in [-1.16,1.16]:
    box("Rear cream endwall",(xx,2.35,7.54),(.51,1.48,.12),"cream",bevel=.05)
box("Rear door lower panel",(0,1.45,7.555),(1.73,1.02,.13),"cream",bevel=.04)
box("Rear door lintel",(0,3.05,7.555),(1.75,.19,.13),"cream",bevel=.04)
for xx in [-.84,.84]:
    box("Rear door jamb",(xx,2.35,7.555),(.10,1.29,.13),"wood",bevel=.02)
mesh("Rear glazed opening",[(-.79,1.96,7.55),(.79,1.96,7.55),(.79,2.96,7.55),(-.79,2.96,7.55)],[(0,1,2,3)],mat=glass)
box("Rear gangway buffer",(0,.66,7.80),(.80,.16,.36),mat=dark,bevel=.05)

# Paired long benches, each cushion modeled with round welting and a leaning back.
for side in [-1,1]:
    for bay_start,bay_end in [(-5.95,3.99),(6.03,7.21)]:
        length=bay_end-bay_start
        center=(bay_start+bay_end)/2
        box("Walnut bench plinth",(side*1.085,1.03,center),(.57,.24,length),"wood",bevel=.045)
        count=round(length/1.24)
        span=length/count
        for i in range(count):
            zz=bay_start+(i+.5)*span
            repair = bay_start == -5.95 and ((side == -1 and i == 3) or (side == 1 and i == 5))
            cushion=box("Soft shaped red seat cushion",(side*.997,1.255,zz),(.645,.19,span-.025),"red",bevel=.075,
                        top_pigment="repaired_red" if repair else None)
            if repair:
                repaired_seats.append({"center_m":[side*.997,1.255,round(zz,5)],
                    "size_m":[.645,.19,round(span-.025,5)],"top_y":1.35,
                    "atlas_region":"repaired_red","normal_y_min":.85})
            box("Sloped upholstered bench back",(side*1.248,1.61,zz),(.19,.65,span-.025),"red",bevel=.075,tilt=-side*.14)
            # Welt follows the cushion edge as actual narrow rounded geometry.
            edge=rounded_rect(span-.07,.598,.09,4)
            tube("Cushion stitched welt",[(side*.997+b,1.272,zz+a) for a,b in edge],.0065,"red",sides=5,closed=True)
        for zz in [bay_start-.025,bay_end+.025]:
            # A curved timber cheek and brass arm follow the upholstery contour.
            profile=[(.69,1.06),(.69,1.32),(.80,1.45),(1.04,1.47),(1.23,1.85),(1.37,1.85),(1.37,1.06)]
            verts=[(side*x,y,zz+dz) for dz in [-.043,.043] for x,y in profile]
            n=len(profile)
            faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
            mesh("Sculpted walnut bench end",verts,faces,"wood",bevel=.025)
            tube("Curved brass bench arm",[(side*.72,1.43,zz),(side*.80,1.50,zz),(side*1.04,1.52,zz),(side*1.22,1.79,zz)],.022,mat=brass,sides=8)
    tube("Overhead brass handrail",[(side*.83,3.15,-5.8),(side*.83,3.15,6.95)],.022,mat=brass)
    for zz in [-5.4,-3.8,-2.2,-.6,1.,2.6,6.55]:
        box("Woven hanging strap",(side*.83,2.989,zz),(.039,.29,.035),"wood",bevel=.009)
        ring("Aged brass hand ring",side*.83,2.748,zz,.105,.017)
    for zz in [-5.8,.5,6.95]:
        tube("Handrail ceiling bracket",[(side*.83,3.15,zz),(side*.83,3.38,zz)],.018,mat=brass)
    # Vestibule grab post sits beside the doorway, leaving the center clear.
    tube("Doorway vertical grab rail",[(side*1.13,1.04,4.05),(side*1.13,2.93,4.05)],.022,mat=brass)

for zz in [-4.6,-.5,3.6,6.6]:
    box("Ceiling lamp brass mount",(0,3.51,zz),(.42,.065,.63),mat=brass,bevel=.07)
    box("Ceiling milk glass diffuser",(0,3.465,zz),(.31,.082,.49),mat=lamp,bevel=.08)

authored_shell_triangles=sum(len(p.vertices)-2 for obj in parts+sum(door_parts.values(),[]) for p in obj.data.polygons)

# Small flat illustrations are mounted to the existing frame. Their opaque face
# sits 2 mm in front of the backing, with an explicit viewer-facing UV basis.
def notice(name, center, right, width, height, region):
    center, right = Vector(center), Vector(right)
    up = Vector((0,1,0))
    normal = right.cross(up)
    backing_center = center-normal*.008
    size = (.012,height+.026,width+.026) if abs(normal.x) > .5 else (width+.026,height+.026,.012)
    backing=box(name+" walnut mount",tuple(backing_center),size,"wood",bevel=.008)
    verts=[tuple(center+right*x+up*y) for x,y in
           [(-width/2,-height/2),(width/2,-height/2),(width/2,height/2),(-width/2,height/2)]]
    paper=mesh(name+" printed paper",verts,[(0,1,2,3)],region)
    u0,v0,u1,v1=TILES[region]
    for loop,uv in zip(paper.data.uv_layers.active.data,[(u0,v0),(u1,v0),(u1,v1),(u0,v1)]):
        loop.uv=uv
    tint(paper,(1,1,1))
    record_detail(name,[backing,paper],"illustrated_notice",center_m=list(center),
                  paper_size_m=[width,height],normal=list(normal),atlas_region=region,
                  uv_bounds=list(TILES[region]),front_vertices_m=verts,mount_gap_m=.002)

notice("Quiet Line route notice",(1.325,2.92,.18),(0,0,1),.68,.34,"route_notice")
notice("Lantern Pier rear notice",(0,1.64,7.472),(-1,0,0),.98,.49,"pier_notice")

# Carriage number uses a small editable Blender font outline converted to mesh.
# Ink and backing still use the same painted material, with no additional image.
plate=box("Carriage 03 enamel number plate",(0,3.055,7.480),(.182,.103,.012),"cream",bevel=.008)
font=bpy.data.curves.new("Carriage 03 native lettering","FONT")
font.body="03"
font.align_x="CENTER"
font.align_y="CENTER"
font.size=.075
font.resolution_u=2
font.extrude=0
lettering=bpy.data.objects.new("Carriage 03 native lettering",font)
bpy.context.collection.objects.link(lettering)
bpy.ops.object.select_all(action="DESELECT")
lettering.select_set(True)
bpy.context.view_layer.objects.active=lettering
bpy.ops.object.convert(target="MESH")
lettering=bpy.context.object
for vertex in lettering.data.vertices:
    local=vertex.co.copy()
    vertex.co=P((-local.x,3.055+local.y,7.472-local.z))
lettering.data.update()
finish(lettering)
tint(lettering,(.10,.16,.12))
record_detail("Carriage 03 number plate",[plate,lettering],"native_mesh_lettering",
              center_m=[0,3.055,7.472],normal=[0,0,-1],text="03")

# A cloth-wrapped lunch-sized parcel, deliberately away from passengers and the
# forward hopper's entire path. Three soft eight-sided rings make the folds.
parcel_parts=[]
cx,cz=-.98,-5.32
outline=[(-.15,-.16),(-.08,-.205),(.10,-.19),(.18,-.10),(.17,.13),(.08,.205),(-.12,.18),(-.18,.07)]
verts=[]
for yy,scale in [(1.351,.78),(1.405,1),(1.525,.87)]:
    verts.extend((cx+x*scale,yy+(i%3)*.006,cz+z*scale) for i,(x,z) in enumerate(outline))
verts.append((cx-.008,1.575,cz+.014))
faces=[tuple(range(7,-1,-1))]
for ring_index in range(2):
    for i in range(8):
        faces.append((ring_index*8+i,ring_index*8+(i+1)%8,(ring_index+1)*8+(i+1)%8,(ring_index+1)*8+i))
for i in range(8):
    faces.append((16+i,16+(i+1)%8,24))
faces=[tuple(reversed(face)) for face in faces]
parcel_parts.append(tint(mesh("Forgotten parcel gathered cloth",verts,faces,"cream",smooth=True),(.36,.57,.66)))
for dx,dz in [(-.075,-.008),(.058,.023)]:
    knot=tube("Parcel tied cloth ear",[(cx-.008,1.57,cz+.014),(cx+dx,1.61,cz+dz),(cx+dx*1.10,1.586,cz+dz+.035),(cx-.008,1.57,cz+.014)],.015,"cream",sides=5)
    parcel_parts.append(tint(knot,(.43,.65,.72)))
for dx,dz in [(-.15,-.16),(.10,-.19),(.17,.13),(-.12,.18)]:
    fold=mesh("Parcel gathered fold",[(cx+dx*.88,1.53,cz+dz*.88),(cx+dx*.88+.012,1.531,cz+dz*.88),
              (cx+.008,1.578,cz+.013),(cx-.008,1.578,cz+.013)],[(3,2,1,0)],"cream")
    parcel_parts.append(tint(fold,(.30,.49,.57)))
record_detail("Forgotten cloth parcel",parcel_parts,"static_belonging",support_y=1.35,
              center_m=[cx,1.46,cz],animated=False)

# A restrained folded scarf on the otherwise empty rear bench. It is a short
# solid cloth section with an uneven folded edge and a few modeled fringe ends.
scarf_parts=[]
cx,cz=1.0,6.43
outline=[(-.16,-.31),(.135,-.33),(.16,-.22),(.13,.02),(.155,.31),(-.135,.32),(-.155,.12),(-.14,-.10)]
verts=[(cx+x,yy,cz+z) for yy in [1.352,1.388] for x,z in outline]
verts.append((cx,1.412,cz-.025))
faces=[tuple(range(7,-1,-1))]
for i in range(8):
    faces.append((i,(i+1)%8,(i+1)%8+8,i+8))
    faces.append((8+i,8+(i+1)%8,16))
faces=[tuple(reversed(face)) for face in faces]
scarf_parts.append(tint(mesh("Forgotten folded sea-blue scarf",verts,faces,"cream",smooth=True),(.25,.46,.61)))
fold=mesh("Scarf turned-back fold",[(.85,1.389,6.20),(1.14,1.389,6.18),(1.13,1.419,6.36),(.86,1.412,6.37)],[(0,3,2,1)],"cream")
scarf_parts.append(tint(fold,(.37,.58,.68)))
for i in range(7):
    xx=.875+i*.039
    fringe=mesh("Scarf short woven fringe",[(xx,1.364,6.736),(xx+.014,1.364,6.735),
                (xx+.009,1.357,6.792-(i%3)*.006),(xx-.004,1.356,6.792-(i%3)*.006)],[(0,3,2,1)],"cream")
    scarf_parts.append(tint(fringe,(.37,.58,.68)))
record_detail("Forgotten folded scarf",scarf_parts,"static_belonging",support_y=1.35,
              center_m=[cx,1.38,cz],animated=False)

# Source file retains named individual components and a packed painted image.
scene=bpy.context.scene
scene.unit_settings.system="METRIC"
scene.unit_settings.scale_length=1
scene.world.color=(.25,.32,.38)
root=bpy.data.objects.new("Quiet Line carriage - authored source",None)
bpy.context.collection.objects.link(root)
for obj in parts:
    obj.parent=root
for name,objects in door_parts.items():
    parent=bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(parent)
    parent.parent=root
    parent["slide_direction_z"]=-1 if name.endswith("Forward") else 1
    for obj in objects:
        obj.parent=parent
root["application_axes"]="Y up, forward -Z; Blender source uses Z up"
root["boarding_anchor"]=[-.55,.9,5]
root["left_seat_anchor"]=[-.86,.9,0]
root["right_seat_anchor"]=[.86,.9,0]
root["door_slide_metres"]=.74
tex.image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"carriage.blend"))

# Join only the export scene by material and moving part. The original remains
# fully editable in carriage.blend; export merge avoids a draw for every detail.
def join_group(objects,name):
    if not objects:
        return None
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
        obj.parent=None
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join()
    obj=bpy.context.object
    obj.name=name
    return obj

exported=[]
# Source-only hierarchy names must not force the moving export meshes to .001.
for obj in list(bpy.data.objects):
    if obj.type == "EMPTY":
        bpy.data.objects.remove(obj,do_unlink=True)
static_groups=[([o for o in parts if o.data.materials[0]==mat],name) for mat,name in
    [(atlas,"PaintedCarriage"),(brass,"BrassFittings"),(dark,"RunningGear"),(glass,"WindowGlass"),(lamp,"CarriageLamps")]]
for objects,name in static_groups:
    obj=join_group(objects,name)
    if obj:
        exported.append(obj)
for name,objects in door_parts.items():
    # Doors use a single painted material even on the small handles: handles have
    # warm wood UVs and retain modeled shape, avoiding extra moving draw calls.
    for obj in objects:
        obj.data.materials.clear()
        obj.data.materials.append(atlas)
    exported.append(join_group(objects,name))
bpy.ops.object.select_all(action="DESELECT")
for obj in exported:
    obj.select_set(True)
for name,position in [("AnchorBoarding",(-.55,.9,5)),("AnchorLeftSeat",(-.86,.9,0)),("AnchorRightSeat",(.86,.9,0))]:
    anchor=bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(anchor)
    anchor.location=P(position)
    anchor.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(PUBLIC/"carriage.glb"),export_format="GLB",use_selection=True,export_yup=True,
    export_apply=True,export_texcoords=True,export_normals=True,export_materials="EXPORT",export_animations=False,
    export_vertex_color="ACTIVE",export_all_vertex_colors=False,
    export_extras=True,export_cameras=False,export_lights=False)
triangles=sum(sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in exported)
metadata={"name":"The Quiet Line original carriage","generator":"scripts/build-train.py","blender":bpy.app.version_string,
    "coordinates":{"up":"Y","forward":"-Z","home":[0,0,-4]},
    "dimensions_m":{"body_width":2.92,"length":16.1,"floor_height":.9,"roof_height":3.758,"seat_cushion_top":1.35},
    "anchors":{"boarding":[-.55,.9,5],"leftSeat":[-.86,.9,0],"rightSeat":[.86,.9,0]},
    "door":{"center_z":5,"clear_width":1.35,"height":2.08,"slide_distance":.74,"nodes":["DoorLeftForward","DoorLeftRear"]},
    "mesh_count":len(exported),"triangles":triangles,"materials":len({obj.data.materials[0].name for obj in exported}),
    "texture_dimensions":list(tex.image.size),"estimated_rgba8_texture_with_mipmaps_mib":round(tex.image.size[0]*tex.image.size[1]*4*4/3/1024**2,2),
    "atlas":"carriage-lived-in-atlas.png","atlas_regions_uv":{key:list(value) for key,value in TILES.items()},
    "repaired_seats":repaired_seats,"details":detail_records,
    "triangle_breakdown":{"carriage_shell_and_fittings":authored_shell_triangles,
        "notices_and_number_plate":sum(d["triangles"] for d in detail_records if d["kind"]!="static_belonging"),
        "static_belongings":sum(d["triangles"] for d in detail_records if d["kind"]=="static_belonging")},
    "surface_treatment":{"upholstery":"Faded woven cloth; two repairs on upward cushion faces only.",
        "timber":"Longitudinal grain, broad knot-free floor samples, gently rubbed sill and end surfaces.",
        "floor_uv":{"sample_width_pixels":115.2,"sample_height_pixels_range":[471.04,481.28],
            "mapping":"Continuous near-full-height clean central grain; no texture repeats or added geometry.",
            "base_vertex_pigment":[.51,.55,.55]},
        "contact_shading":"Static corner colors in floor/bench/trim geometry; no shadow textures or passes.",
        "enamel":"Warm rubbed bevel pigment and restrained doorway fading.",
        "runtime_cost":"All new objects join the existing opaque atlas batch; no new animation, lights or render passes."},
    "glb_bytes":(PUBLIC/"carriage.glb").stat().st_size,
    "notes":["Original geometry; visual references inform material and proportion, no extracted model parts.","Real window openings and single-layer low-opacity glazing; no transmission pass.","Counts are construction statistics, not Quest hardware performance measurements."]}
(OUT/"carriage-metadata.json").write_text(json.dumps(metadata,indent=2)+"\n")
print("CARRIAGE_STATS "+json.dumps(metadata))

if opts.render:
    # A bounded asset review: one exterior and one actual seated interior angle.
    scene.render.engine="CYCLES"
    scene.cycles.samples=24
    scene.render.resolution_x=1400
    scene.render.resolution_y=900
    scene.render.resolution_percentage=100
    scene.view_settings.view_transform="Standard"
    scene.world.use_nodes=True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value=(.40,.61,.74,1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value=.8
    light_data=bpy.data.lights.new("Review daylight","AREA")
    light_data.energy=1800
    light_data.shape="DISK"
    light_data.size=10
    light_obj=bpy.data.objects.new("Review daylight",light_data)
    bpy.context.collection.objects.link(light_obj)
    light_obj.location=P((-4,9,-6))
    light_obj.rotation_euler=(Vector(P((0,0,0)))-light_obj.location).to_track_quat("-Z","Y").to_euler()
    camera_data=bpy.data.cameras.new("Review camera")
    camera=bpy.data.objects.new("Review camera",camera_data)
    bpy.context.collection.objects.link(camera)
    scene.camera=camera
    review=ROOT/".impeccable/review"
    review.mkdir(parents=True,exist_ok=True)
    for name,pos,target,lens in [("train-model-exterior",(-15,7,-17),(0,1.6,0),48),("train-model-interior",(-.76,2.15,1.2),(.9,2.20,-2.6),25)]:
        camera.location=P(pos)
        camera.rotation_euler=(Vector(P(target))-camera.location).to_track_quat("-Z","Y").to_euler()
        camera_data.lens=lens
        scene.render.filepath=str(review/(name+".png"))
        bpy.ops.render.render(write_still=True)
