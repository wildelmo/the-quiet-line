"""Original little painted companions for The Quiet Line.

Run with the repository's portable Blender --background --python this_file.
Construction uses metres, Y up and +Z toward the aisle.  Every source sculpted
part is retained in the .blend; export joins only within the ten pose groups.
The existing reader atlas is packed unchanged and used with opaque pigment wash.
Fuzz eyes have one separate untextured chalk material so their white stays neutral.
"""
from pathlib import Path
import json
import math
import random
import struct
import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/spirits'
PUBLIC = ROOT / 'public/assets/spirits'
OUT.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for data in list(bpy.data.materials):
    bpy.data.materials.remove(data)

def P(p): return (p[0], -p[2], p[1])
def unP(p): return (p[0], p[2], -p[1])
def lerp(a, b, t): return a * (1 - t) + b * t

def sample(values, t):
    t = min(1, max(0, t)) * (len(values) - 1)
    i = min(len(values) - 2, int(t)); f = t - i
    a, b, c, d = [values[min(len(values) - 1, max(0, j))] for j in (i - 1, i, i + 1, i + 2)]
    return tuple(.5 * ((2 * bb) + (-aa + cc) * f + (2 * aa - 5 * bb + 4 * cc - dd) * f * f + (-aa + 3 * bb - 3 * cc + dd) * f * f * f) for aa, bb, cc, dd in zip(a, b, c, d))

TILES = {'ivory': (.525, .525, .975, .975), 'wood': (.025, .025, .475, .475)}
mat = bpy.data.materials.new('Quiet Line — opaque painted companions')
mat.use_nodes = True
nodes = mat.node_tree.nodes
bsdf = nodes.get('Principled BSDF')
bsdf.inputs['Roughness'].default_value = .94
bsdf.inputs['Specular IOR Level'].default_value = .17
bsdf.inputs['Alpha'].default_value = 1
tex = nodes.new('ShaderNodeTexImage')
tex.image = bpy.data.images.load(str(PUBLIC / 'reader-material-atlas.png'))
tex.image.colorspace_settings.name = 'sRGB'
wash = nodes.new('ShaderNodeVertexColor'); wash.layer_name = 'Pigment wash'
mul = nodes.new('ShaderNodeMixRGB'); mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1
mat.node_tree.links.new(tex.outputs['Color'], mul.inputs[1])
mat.node_tree.links.new(wash.outputs['Color'], mul.inputs[2])
mat.node_tree.links.new(mul.outputs[0], bsdf.inputs['Base Color'])
mat.diffuse_color = (.64, .58, .55, 1)
mat.use_backface_culling = True

eye_mat = bpy.data.materials.new('Chalk white fuzz eyes')
eye_mat.use_nodes = True
eye_bsdf = eye_mat.node_tree.nodes.get('Principled BSDF')
eye_bsdf.inputs['Roughness'].default_value = .94
eye_bsdf.inputs['Specular IOR Level'].default_value = .17
eye_bsdf.inputs['Alpha'].default_value = 1
eye_wash = eye_mat.node_tree.nodes.new('ShaderNodeVertexColor')
eye_wash.layer_name = 'Pigment wash'
eye_mat.node_tree.links.new(eye_wash.outputs['Color'], eye_bsdf.inputs['Base Color'])
eye_mat.diffuse_color = (1, 1, 1, 1)
eye_mat.use_backface_culling = True

pivots = {
    'Mouse': (0, 0, 0),
    'MouseBody': (0, .08, 0),
    'MouseHead': (0, .14, .015),
    'MouseEyes': (0, .168, .064),
    'MouseNose': (0, .151, .092),
    'MouseTail': (.044, .032, -.041),
    'Fuzz': (0, 0, 0),
    'FuzzBody': (0, 0, 0),
    'FuzzEyes': (0, .059, .038),
    'FuzzLeftLeg': (-.016, .027, .001),
    'FuzzRightLeg': (.016, .027, .001),
    'Perch': (0, 0, 0),
}
parents = {
    'MouseBody': 'Mouse', 'MouseHead': 'MouseBody',
    'MouseEyes': 'MouseHead', 'MouseNose': 'MouseHead',
    'MouseTail': 'Mouse', 'FuzzBody': 'Fuzz', 'FuzzEyes': 'FuzzBody',
    'FuzzLeftLeg': 'FuzzBody', 'FuzzRightLeg': 'FuzzBody',
}
groups = {name: [] for name in ['MouseBody', 'MouseHead', 'MouseEyes', 'MouseNose', 'MouseTail', 'FuzzBody', 'FuzzEyes', 'FuzzLeftLeg', 'FuzzRightLeg', 'Perch']}

def mesh(name, verts, faces, group, tint=(1, 1, 1), tile='ivory', uv=None, smooth=True):
    data = bpy.data.meshes.new(name)
    data.from_pydata([P(v) for v in verts], [], faces); data.update()
    bm = bmesh.new(); bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(data); bm.free()
    obj = bpy.data.objects.new(name, data); bpy.context.collection.objects.link(obj)
    data.materials.append(eye_mat if group == 'FuzzEyes' else mat)
    layer = data.uv_layers.new(name='Painted atlas'); u0, v0, u1, v1 = TILES[tile]
    bounds = [(min(v[a] for v in verts), max(v[a] for v in verts)) for a in range(3)]
    for face in data.polygons:
        face.use_smooth = smooth
        for li in face.loop_indices:
            vi = data.loops[li].vertex_index
            if uv is None:
                u = (verts[vi][0] - bounds[0][0]) / max(.001, bounds[0][1] - bounds[0][0])
                v = (verts[vi][1] - bounds[1][0]) / max(.001, bounds[1][1] - bounds[1][0])
            else: u, v = uv[vi]
            layer.data[li].uv = (lerp(u0, u1, u), lerp(v0, v1, v))
    color = data.color_attributes.new(name='Pigment wash', type='FLOAT_COLOR', domain='CORNER')
    data.color_attributes.active_color_index = 0; data.color_attributes.render_color_index = 0
    for c in color.data: c.color = (*tint, 1)
    obj['authored_part'] = name; obj['paint_region'] = tile
    groups[group].append(obj)
    return obj

def loft(name, profiles, group, tint=(1, 1, 1), rings=14, sides=24, deform=None, tile='ivory'):
    verts = []; uv = []
    for j in range(rings + 1):
        t = j / rings; y, cx, cz, rx, rz = sample(profiles, t)
        for i in range(sides):
            a = i / sides * math.tau
            x = cx + rx * math.cos(a); z = cz + rz * math.sin(a)
            verts.append(deform(t, a, x, y, z) if deform else (x, y, z))
            uv.append((i / (sides - 1), t))
    faces = [(j*sides+i, j*sides+(i+1)%sides, (j+1)*sides+(i+1)%sides, (j+1)*sides+i) for j in range(rings) for i in range(sides)]
    faces.extend([tuple(range(sides - 1, -1, -1)), tuple(rings*sides+i for i in range(sides))])
    return mesh(name, verts, faces, group, tint, tile, uv)

def tube(name, controls, group, tint=(1, 1, 1), radius=.003, sides=7, steps=10, ellipse=1, tile='ivory'):
    if len(controls[0]) == 3: controls = [(*p, radius) for p in controls]
    verts = []; uv = []
    for j in range(steps + 1):
        t = j / steps; c = sample(controls, t); p = Vector(c[:3]); r = max(.00006, c[3])
        tangent = Vector(sample(controls, min(1, t+.003))[:3]) - Vector(sample(controls, max(0, t-.003))[:3])
        tangent.normalize()
        guide = Vector((0, 1, 0)) if abs(tangent.y) < .92 else Vector((0, 0, 1))
        axis = tangent.cross(guide).normalized(); other = tangent.cross(axis).normalized()
        for i in range(sides):
            a = i / sides * math.tau
            verts.append(tuple(p + r*(math.cos(a)*axis + ellipse*math.sin(a)*other)))
            uv.append((i / (sides - 1), t))
    faces = [(j*sides+i, j*sides+(i+1)%sides, (j+1)*sides+(i+1)%sides, (j+1)*sides+i) for j in range(steps) for i in range(sides)]
    faces.extend([tuple(range(sides - 1, -1, -1)), tuple(steps*sides+i for i in range(sides))])
    return mesh(name, verts, faces, group, tint, tile, uv)

def oval(name, centre, size, group, tint, rings=9, sides=16, tilt=0):
    # Individually shaped oval surfaces are reserved for eyes, toes and muzzle.
    cx, cy, cz = centre; rx, ry, rz = size
    profiles = []
    for i in range(9):
        a = -.5*math.pi + math.pi*i/8
        profiles.append((cy+ry*math.sin(a), cx+tilt*math.sin(a), cz, max(.00015, rx*math.cos(a)), max(.00015, rz*math.cos(a))))
    return loft(name, profiles, group, tint, rings, sides)

# MOUSE. A squashy pear body, overlapping cheek sculpture and small fur sweeps.
TAUPE = (.66, .60, .65)
LIGHT_TAUPE = (.76, .69, .75)
PINK = (.98, .47, .56)
PALE = (1.08, 1.04, 1.13)
INK = (.009, .012, .016)

def body_fur(t, a, x, y, z):
    ripple = (.0011*math.sin(7*a+3*t) + .0006*math.sin(13*a-4*t)) * math.sin(math.pi*t)
    return x+ripple*math.cos(a), y+.0007*math.sin(a*3)*math.sin(math.pi*t), z+ripple*math.sin(a)

loft('Mouse plump pear with soft haunches', [
    (.012, 0, -.005, .030, .027), (.025, 0, -.009, .054, .043),
    (.051, -.002, -.009, .070, .056), (.080, -.003, -.009, .067, .056),
    (.109, 0, -.004, .051, .043), (.135, 0, .001, .037, .031),
    (.151, .001, .004, .019, .019),
], 'MouseBody', TAUPE, rings=19, sides=32, deform=body_fur)

# A quiet cream breast follows the belly rather than making a separate ball.
loft('Mouse pale brushed belly', [
    (.021, 0, .031, .015, .008), (.036, 0, .040, .030, .013),
    (.066, -.001, .042, .039, .014), (.095, .001, .034, .030, .013),
    (.116, 0, .028, .016, .009), (.125, 0, .024, .004, .003),
], 'MouseBody', (.91, .85, .89), rings=13, sides=24)

for s in (-1, 1):
    # Elbows emerge from the haunches and curl inward in a relaxed resting pose.
    tube('Mouse tucked forearm '+str(s), [
        (s*.044, .104, .006, .014), (s*.060, .088, .020, .015),
        (s*.057, .070, .043, .012), (s*.037, .065, .059, .008),
    ], 'MouseBody', TAUPE, sides=12, steps=11, ellipse=.85)
    oval('Mouse tiny pink hand '+str(s), (s*.030, .067, .061), (.013, .008, .007), 'MouseBody', PINK, rings=7, sides=12, tilt=s*.003)
    for k in range(3):
        tube('Mouse resting little finger '+str(s)+' '+str(k), [(s*(.025+k*.004), .063, .066, .0020), (s*(.023+k*.004), .068, .069, .0017)], 'MouseBody', (.99,.56,.62), sides=5, steps=3)
    # Flattened soles reach exactly Y=0, with visible pink toe tips.
    loft('Mouse planted pink foot '+str(s), [
        (0, s*.038, .024, .012, .017), (.003, s*.039, .027, .016, .022),
        (.010, s*.039, .027, .015, .021), (.017, s*.035, .015, .010, .012),
        (.021, s*.032, .008, .006, .006),
    ], 'MouseBody', PINK, rings=7, sides=16)
    for k in range(3):
        tube('Mouse little toe seam '+str(s)+' '+str(k), [(s*.039+(k-1)*.006,.006,.046),(s*.039+(k-1)*.006,.010,.043)], 'MouseBody', (.55,.25,.30), radius=.00065, sides=5, steps=3)

def face_shape(t, a, x, y, z):
    cheek = math.exp(-((t-.33)/.20)**2)
    return x + .0019*math.cos(3*a)*cheek, y+.001*math.cos(a)*math.sin(math.pi*t), z+.003*max(0,math.sin(a))*cheek

loft('Mouse broad round-cheeked face', [
    (.116, 0, .018, .019, .021), (.128, 0, .020, .045, .034),
    (.143, -.001, .014, .060, .046), (.160, 0, .005, .055, .049),
    (.179, .001, -.002, .043, .040), (.191, .002, -.004, .027, .027),
    (.195, .001, -.004, .008, .010),
], 'MouseHead', LIGHT_TAUPE, rings=20, sides=32, deform=face_shape)

def ear(name, s):
    # Sculpted solid cup, gently skewed outward with a broad rounded top.
    cx=s*.048; cy=.201; cz=-.004
    def point(r, a, front=True):
        shape=1+.035*math.sin(3*a+.6)+.025*math.cos(2*a)
        x=cx+.029*r*math.cos(a)*shape+s*.005*r*math.sin(a)
        y=cy+.032*r*math.sin(a)*shape
        z=cz-s*.10*(x-cx)+(.008+.007*math.sin(r*math.pi*.7) if front else -.002-.003*(1-r*r))
        return x,y,z
    sides=28; rings=6; verts=[]; uv=[]
    for front in [False,True]:
        for j in range(rings+1):
            r=max(.002,j/rings)
            for i in range(sides):
                a=i/sides*math.tau; verts.append(point(r,a,front)); uv.append((.5+.45*r*math.cos(a),.5+.45*r*math.sin(a)))
    plane=(rings+1)*sides;faces=[]
    for side in range(2):
        base=side*plane
        for j in range(rings):
            for i in range(sides):
                a=base+j*sides+i;b=base+j*sides+(i+1)%sides
                faces.append((a,b,b+sides,a+sides))
        faces.append(tuple(base+i for i in range(sides)))
    for i in range(sides):
        a=rings*sides+i;b=rings*sides+(i+1)%sides;faces.append((a,b,plane+b,plane+a))
    mesh(name+' rounded fur cup',verts,faces,'MouseHead',TAUPE,uv=uv)
    # Pink inset is a separate shallow cup with a closed back, nested in shell.
    verts=[];uv=[];faces=[];plane=6*sides
    for offset in [-.0003,.0006]:
        for j in range(6):
            r=max(.002,j/5)*.76
            for i in range(sides):
                a=i/sides*math.tau;x,y,z=point(r,a)
                verts.append((x,y,z+offset));uv.append((.5+.4*r*math.cos(a),.5+.4*r*math.sin(a)))
    for side in range(2):
        base=side*plane
        faces.extend([(base+j*sides+i,base+j*sides+(i+1)%sides,base+(j+1)*sides+(i+1)%sides,base+(j+1)*sides+i) for j in range(5) for i in range(sides)])
        faces.append(tuple(base+i for i in range(sides)))
    for i in range(sides):
        a=5*sides+i;b=5*sides+(i+1)%sides;faces.append((a,b,plane+b,plane+a))
    mesh(name+' rose concave inset',verts,faces,'MouseHead',PINK,uv=uv)

ear('Mouse left ear',-1); ear('Mouse right ear',1)

for s in [-1,1]:
    # Soft muzzle lobes sink into the cheek sculpture, with generous cheek volume.
    oval('Mouse pale muzzle cheek '+str(s), (s*.017, .142, .065), (.026,.018,.020), 'MouseHead', PALE, rings=10, sides=20, tilt=-s*.002)
    for k in range(3):
        x=s*(.050+.003*k); y=.133+k*.007; z=.029-.004*k
        tube('Mouse soft cheek fur '+str(s)+' '+str(k), [(x,y,z,.0055),(x+s*.008,y-.001,z+.001,.0042),(x+s*(.011-.001*k),y+.005,z+.003,.0003)], 'MouseHead', LIGHT_TAUPE, sides=6, steps=5, ellipse=.65)
    # Dark bead eyes sit high enough to keep the face young and welcoming.
    oval('Mouse black bead eye '+str(s), (s*.030, .168+s*.0007, .042), (.006,.0073,.005), 'MouseEyes', INK, rings=9, sides=16)
    oval('Mouse small eye catchlight '+str(s), (s*.030-.0014, .1708+s*.0007, .0463), (.0014,.0017,.0007), 'MouseEyes', (1.3,1.5,1.9), rings=5, sides=8)
    tube('Mouse subtle brow fur '+str(s), [(s*.022,.181,.031,.0025),(s*.031,.184,.021,.0029),(s*.038,.182,.014,.0004)], 'MouseHead', TAUPE, sides=6, steps=6, ellipse=.65)

for k in range(3):
    x=-.009+k*.006
    tube('Mouse little forehead tuft '+str(k), [(x,.189,-.005,.004),(x-.004,.197,-.002,.003),(x-.007,.199,.004,.0003)], 'MouseHead', LIGHT_TAUPE, sides=6, steps=5, ellipse=.75)

loft('Mouse small rose button nose', [(.147,0,.084,.002,.002),(.149,0,.089,.006,.005),(.153,0,.089,.007,.006),(.156,0,.086,.004,.003)], 'MouseNose', (.83,.34,.42), rings=6, sides=14)
tube('Mouse tiny mouth stem', [(0,.148,.085),(0,.138,.084)], 'MouseHead', (.31,.21,.24), radius=.00085, sides=5, steps=4)
for s in [-1,1]:
    tube('Mouse little smile '+str(s), [(0,.138,.083),(s*.005,.135,.082),(s*.009,.136,.079)], 'MouseHead', (.40,.27,.30), radius=.00075, sides=5, steps=5)

tube('Mouse curling rose tail', [
    (.044,.032,-.041,.0050),(.067,.023,-.068,.0046),(.099,.013,-.075,.0040),
    (.130,.008,-.063,.0036),(.141,.009,-.039,.0032),(.135,.014,-.019,.0026),
    (.116,.021,-.018,.0020),(.106,.026,-.034,.0011),
], 'MouseTail', (.84,.45,.51), sides=10, steps=34, ellipse=.95)

# FUZZ. A low lopsided core with broad, short, bent tufts instead of radial spikes.
CHARCOAL=(.018,.024,.034)
FUZZ_LIGHT=(.028,.034,.043)
def fuzzy_shape(t,a,x,y,z):
    f=(.0018*math.sin(7*a+t*5)+.0010*math.sin(11*a-t*7))*math.sin(math.pi*t)
    return x+f*math.cos(a),y+.0015*math.sin(a*3+t*2)*math.sin(math.pi*t),z+f*math.sin(a)

loft('Fuzz soft lopsided charcoal body', [
    (.020,.001,0,.016,.014),(.028,-.002,-.001,.031,.025),
    (.046,-.003,-.001,.039,.030),(.064,-.001,-.002,.036,.029),
    (.080,.003,-.003,.026,.023),(.088,.006,-.003,.012,.012),
    (.090,.007,-.003,.002,.002),
], 'FuzzBody',CHARCOAL,rings=16,sides=28,deform=fuzzy_shape)

rng=random.Random(317)
for k in range(34):
    # Fibonacci positions avoid a pufferfish's rows; the front eye area stays clear.
    v=(k+.5)/34; ny=1-2*v; a=k*2.3999632297
    radial=math.sqrt(max(0,1-ny*ny)); nx=radial*math.cos(a); nz=radial*math.sin(a)
    if nz>.50 and abs(nx)<.70 and -.05<ny<.55: continue
    p=Vector((-.001+.035*nx,.054+.033*ny,-.002+.028*nz))
    outward=Vector((nx,ny*.85,nz)).normalized()
    # Wisps curve sideways/down at the end; widths and tips are deliberately uneven.
    curl=Vector((-.5*nz+.2, .15 if ny<.35 else -.18, .5*nx)).normalized()
    length=rng.uniform(.007,.013)
    q=p+outward*length*.58+curl*length*.18
    r=p+outward*length*.82+curl*length*.65
    tube('Fuzz soft bent wisp '+str(k), [(*p,rng.uniform(.0035,.0055)),(*q,.0028),(*r,.00025)], 'FuzzBody',FUZZ_LIGHT if k%4==0 else CHARCOAL,sides=6,steps=5,ellipse=.8)

for s in [-1,1]:
    leg_group = 'FuzzLeftLeg' if s < 0 else 'FuzzRightLeg'
    tube('Fuzz skinny bent leg '+str(s),[(s*.016,.027,.001,.0020),(s*.019,.013,.003,.0017),(s*.016,.003,.009,.0016)],leg_group,CHARCOAL,sides=6,steps=8)
    tube('Fuzz little grounded foot '+str(s),[(s*.016,.002,.005,.0016),(s*.017,.0018,.014,.0016),(s*.024,.0012,.018,.0010)],leg_group,CHARCOAL,sides=6,steps=7,ellipse=.55)
    # Chalk-white eyes and dark pupils share one untextured matte material.
    oval('Fuzz white eyeball '+str(s),(s*.014,.059+s*.0009,.028),(.0122,.0147,.0085),'FuzzEyes',(1,1,1),rings=11,sides=20,tilt=-s*.001)
    oval('Fuzz small black pupil '+str(s),(s*.014+.001,.058+s*.0009,.0360),(.0043,.0057,.0021),'FuzzEyes',(.004,.006,.008),rings=8,sides=12)
    oval('Fuzz pupil glint '+str(s),(s*.014-.0003,.060+s*.0009,.0378),(.0010,.0012,.0004),'FuzzEyes',(1,1,1),rings=4,sides=7)

# PERCH. A warm thin timber ledge with rounded edges and compact carved brackets.
def perch_section(inset):
    # Rounded rectangle in Y/Z, sampled around four genuinely curved corners.
    points=[]; rad=.006
    for cy,cz,start in [(-.006,-.114,math.pi*.5),(-.022,-.114,math.pi),(-.022,.114,math.pi*1.5),(-.006,.114,0)]:
        for j in range(5):
            a=start+j/4*math.pi/2
            y=cy+rad*math.sin(a);z=cz+rad*math.cos(a)
            points.append((-.014+(y+.014)*(1-inset/.014),z*(1-inset/.12)))
    return points

verts=[];uv=[]
for x,inset in [(-.62,.0035),(-.618,.001),(-.615,0),(.615,0),(.618,.001),(.62,.0035)]:
    for y,z in perch_section(inset): verts.append((x,y,z));uv.append(((x+.62)/1.24,(z+.12)/.24))
sides=20; faces=[(j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i) for j in range(5) for i in range(sides)]
faces.extend([tuple(range(sides-1,-1,-1)),tuple(5*sides+i for i in range(sides))])
mesh('Perch softly rounded timber ledge',verts,faces,'Perch',(.62,.44,.29),'wood',uv)
for s in [-1,1]:
    x=s*.43
    tube('Perch curved compact bracket '+str(s),[(x,-.026,.060,.008),(x,-.034,.020,.009),(x,-.055,-.040,.010),(x,-.068,-.086,.009),(x,-.031,-.092,.008)],'Perch',(.46,.31,.20),sides=8,steps=13,ellipse=.65,tile='wood')

# Bind identity-axis nodes after sculpting. Preserve the approved leg vertices
# exactly by countertranslating their mesh children beneath the new hip pivots.
pose={}
for name,pivot in pivots.items():
    obj=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(obj)
    parent=parents.get(name);origin=pivots[parent] if parent else (0,0,0)
    if parent:obj.parent=pose[parent]
    obj.location=P(tuple(pivot[i]-origin[i] for i in range(3)))
    obj.empty_display_type='PLAIN_AXES';obj.empty_display_size=.015
    obj['runtime_pivot_m']=pivot;pose[name]=obj
for group,objects in groups.items():
    offset=Vector(P(pivots[group]))
    for obj in objects:
        obj.parent=pose[group]
        if group in ('FuzzLeftLeg', 'FuzzRightLeg'):
            obj.location=-offset
        else:
            for vert in obj.data.vertices:vert.co-=offset
            obj.location=(0,0,0)
for name in ['Mouse','Fuzz','Perch']:
    pose[name]['application_axes']='Y up, +Z facing; source Blender Z up'
    pose[name]['original_asset']='Original custom mesh sculpture; no downloaded or extracted geometry'
    pose[name]['opaque']=True
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
tex.image.pack();bpy.context.view_layer.update()
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'companions.blend'))

exported=[];by_root={n:[] for n in ['Mouse','Fuzz','Perch']}
source_parts={g:len(objects) for g,objects in groups.items()}
for group,objects in groups.items():
    assert objects,group
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:bpy.ops.object.join()
    obj=bpy.context.object;obj.name=group+'Mesh';exported.append(obj)
    by_root[next(n for n in by_root if group.startswith(n))].append(obj)
bpy.context.view_layer.update()

def measure(objects):
    points=[unP(obj.matrix_world@v.co) for obj in objects for v in obj.data.vertices]
    minimum=[min(p[i] for p in points) for i in range(3)];maximum=[max(p[i] for p in points) for i in range(3)]
    return {'bounds_m':{'min':minimum,'max':maximum,'size':[maximum[i]-minimum[i] for i in range(3)]},'mesh_count':len(objects),'primitives':len(objects),'triangles':sum(sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in objects)}

characters={n:measure(objects) for n,objects in by_root.items()}
summary=measure(exported)
assert summary['triangles']<=18000,summary
assert len(exported)<=10
assert characters['Mouse']['bounds_m']['min'][1]>=-.00001
assert characters['Mouse']['bounds_m']['max'][1]<=.245
assert characters['Fuzz']['bounds_m']['max'][1]<=.107
assert characters['Perch']['bounds_m']['min'][1]>=-.080
assert abs(characters['Perch']['bounds_m']['max'][1])<.00001
bpy.ops.object.select_all(action='DESELECT')
for obj in exported+list(pose.values()):obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(PUBLIC/'companions.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_animations=False,export_vertex_color='ACTIVE',export_all_vertex_colors=False,export_extras=True,export_cameras=False,export_lights=False)
binary=(PUBLIC/'companions.glb').read_bytes();size=len(binary)
gltf=json.loads(binary[20:20+struct.unpack_from('<I',binary,12)[0]])
assert len(gltf['materials'])==2
assert len(gltf['images'])==1
assert all(m.get('alphaMode','OPAQUE')=='OPAQUE' for m in gltf['materials'])
assert next(m for m in gltf['materials'] if m['name']=='Chalk white fuzz eyes')['pbrMetallicRoughness'].get('baseColorTexture') is None
assert sum(len(m['primitives']) for m in gltf['meshes'])==10
assert size<4*1024*1024,size
metadata={
    'name':'The Quiet Line — original painted little companions',
    'generator':'scripts/build-companions.py','blender':bpy.app.version_string,
    'coordinates':{'up':'Y','forward':'+Z','origin':'each root at ground; perch top Y=0'},
    **summary,'characters':characters,'materials':len(gltf['materials']),'images':len(gltf['images']),
    'alpha_mode':'OPAQUE','glb_bytes':size,'source_blend_bytes':(OUT/'companions.blend').stat().st_size,
    'source_parts_by_pose_group':source_parts,
    'texture_dimensions':list(tex.image.size),'atlas':'public/assets/spirits/reader-material-atlas.png',
    'atlas_regions_blender_uv':TILES,
    'nodes':{name:{'parent':parents.get(name),'world_pivot_m':list(pivot),'local_position_m':[pivot[i]-(pivots[parents[name]][i] if name in parents else 0) for i in range(3)],'local_rotation_quaternion_xyzw':[0,0,0,1],'local_scale':[1,1,1]} for name,pivot in pivots.items()},
    'notes':[
        'Original editable sculptures; separate named source parts retained in the .blend.',
        'All three roots remain at origin. Runtime places the mouse and perch and clones Fuzz.',
        'One unchanged reader atlas; one opaque atlas material and one untextured matte eye material.',
        'Chalk white fuzz eyes uses white eyeball and dark pupil vertex colors and has no texture.',
        'Mouse cheek and brow tufts, cupped ears, pink paws and curled tail are actual solid geometry.',
        'Fuzz uses short bent tapered wisps and white eyes; no alpha planes, hair simulation or emission.',
        'FuzzLeftLeg and FuzzRightLeg pivot at their authored hips with identity rest axes; local X swings the legs forward/back.',
        'Leg mesh children countertranslate their hip pivots to preserve the approved geometry and rest bounds exactly.',
        'MouseEyes and FuzzEyes support blink scaling on local Y. MouseNose supports a small twitch.',
        'Perch top is Y=0, width X=1.24 m, depth Z=.24 m, underside within .08 m.',
        'No animation, camera or light is exported.',
        'Construction counts are not measured device performance.',
    ],
}
(OUT/'companions-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
print('COMPANION_STATS '+json.dumps(metadata))
