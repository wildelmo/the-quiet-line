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
atlas_path = PUBLIC / "carriage-material-atlas.png"
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

# Image quadrant UVs are inset to avoid mipmap bleed. Blender UV origin is lower left.
TILES = {"maroon": (.035, .535, .465, .965), "cream": (.535, .535, .965, .965),
         "wood": (.035, .035, .465, .465), "red": (.535, .035, .965, .465)}
parts = []
door_parts = {"DoorLeftForward": [], "DoorLeftRear": []}
active_door = None

def finish(obj, pigment="cream", mat=None, bevel=0, smooth=False):
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
    # A coherent per-face box projection gives each shaped component real paint.
    # Longitudinal grain follows the object's longest local face dimension.
    uv = obj.data.uv_layers.new(name="Painted atlas") if not obj.data.uv_layers else obj.data.uv_layers.active
    coords = [v.co for v in obj.data.vertices]
    bounds = [(min(v[i] for v in coords), max(v[i] for v in coords)) for i in range(3)]
    u0, v0, u1, v1 = TILES[pigment]
    for face in obj.data.polygons:
        normal_axis = max(range(3), key=lambda i: abs(face.normal[i]))
        axes = [i for i in range(3) if i != normal_axis]
        for loop_idx in face.loop_indices:
            co = obj.data.vertices[obj.data.loops[loop_idx].vertex_index].co
            values = [(co[a] - bounds[a][0]) / max(.001, bounds[a][1] - bounds[a][0]) for a in axes]
            uv.data[loop_idx].uv = (u0 + values[0] * (u1 - u0), v0 + values[1] * (v1 - v0))
    obj["paint_region"] = pigment
    obj["authored_part"] = obj.name
    wash = {"cream": (.93,.93,.91,1), "maroon": (.78,.64,.69,1), "wood": (.56,.55,.53,1), "red": (.88,.72,.74,1)}[pigment]
    if pigment == "maroon" and ("roof" in obj.name.lower() or "eave" in obj.name.lower()):
        wash = (.42,.34,.41,1)
    if mat and mat != atlas:
        wash = (1,1,1,1)
    colors = obj.data.color_attributes.new(name="Pigment wash",type="FLOAT_COLOR",domain="CORNER")
    obj.data.color_attributes.active_color_index = len(obj.data.color_attributes)-1
    obj.data.color_attributes.render_color_index = len(obj.data.color_attributes)-1
    for color in colors.data:
        color.color=wash
    (door_parts[active_door] if active_door else parts).append(obj)
    obj.select_set(False)
    return obj

def mesh(name, verts, faces, pigment="cream", mat=None, bevel=0, smooth=False):
    data = bpy.data.meshes.new(name)
    data.from_pydata([P(p) for p in verts], [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return finish(obj, pigment, mat, bevel, smooth)

def box(name, pos, size, pigment="cream", mat=None, bevel=.015, tilt=0):
    x, y, z = pos
    w, h, d = [s / 2 for s in size]
    verts = []
    for a, b, c in [(-w,-h,-d),(w,-h,-d),(w,h,-d),(-w,h,-d),(-w,-h,d),(w,-h,d),(w,h,d),(-w,h,d)]:
        aa, bb = a * math.cos(tilt) - b * math.sin(tilt), a * math.sin(tilt) + b * math.cos(tilt)
        verts.append((x+aa,y+bb,z+c))
    return mesh(name, verts, [(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)], pigment, mat, bevel)

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
    box(f"Worn longitudinal floorboard {i:02}",(x,.891,0),(.242,.018,15.4),"wood",bevel=.006)
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
box("Rear lower body",(0,1.22,7.55),(2.80,.78,.12),"maroon",bevel=.06)
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
            box("Soft shaped red seat cushion",(side*.997,1.255,zz),(.645,.19,span-.025),"red",bevel=.075)
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
