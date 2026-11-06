"""Sculpt the original Quiet Line newspaper reader and its editable source.

blender --background --python scripts/build-reader.py -- [--render]
All shape descriptions are in runtime metres: Y up, +Z facing the aisle.
Organic profiles, sewn panels and drapes are authored meshes, not primitives.
"""
from pathlib import Path
import argparse
import json
import math
import sys
import bpy
import bmesh
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/spirits"
PUBLIC = ROOT / "public/assets/spirits"
OUT.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)
parser = argparse.ArgumentParser()
parser.add_argument("--render", action="store_true")
opts = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for data in list(bpy.data.materials):
    bpy.data.materials.remove(data)

def P(p):
    return (p[0], -p[2], p[1])

def unP(p):
    return (p[0], p[2], -p[1])

def lerp(a, b, t):
    return a*(1-t)+b*t

def sample(values, t):
    """Bounded Catmull-Rom interpolation through deliberate shape landmarks."""
    t = min(1, max(0, t))*(len(values)-1)
    i = min(len(values)-2, int(t))
    f = t-i
    a, b, c, d = [values[min(len(values)-1,max(0,j))] for j in (i-1,i,i+1,i+2)]
    return tuple(.5*((2*bb)+(-aa+cc)*f+(2*aa-5*bb+4*cc-dd)*f*f+(-aa+3*bb-3*cc+dd)*f*f*f) for aa,bb,cc,dd in zip(a,b,c,d))

# Atlas image rows are inverted in Blender's bottom-left-origin UV space.
TILES = {"cloth":(.025,.525,.475,.975), "skin":(.525,.525,.975,.975),
         "bag":(.025,.025,.475,.475), "paper":(.51,.01,.99,.49)}
material=bpy.data.materials.new("Reader — original painted cloth, ivory, leather and newsprint")
material.use_nodes=True
nodes=material.node_tree.nodes
bsdf=nodes.get("Principled BSDF")
bsdf.inputs["Roughness"].default_value=.91
bsdf.inputs["Specular IOR Level"].default_value=.22
atlas_path=PUBLIC/"reader-material-atlas.png"
if not atlas_path.exists():
    raise FileNotFoundError(f"Original painted atlas is required: {atlas_path}")
tex=nodes.new("ShaderNodeTexImage")
tex.image=bpy.data.images.load(str(atlas_path))
tex.image.colorspace_settings.name="sRGB"
colors=nodes.new("ShaderNodeVertexColor")
colors.layer_name="Pigment wash"
multiply=nodes.new("ShaderNodeMixRGB")
multiply.blend_type="MULTIPLY"
multiply.inputs[0].default_value=1
material.node_tree.links.new(tex.outputs["Color"],multiply.inputs[1])
material.node_tree.links.new(colors.outputs["Color"],multiply.inputs[2])
material.node_tree.links.new(multiply.outputs[0],bsdf.inputs["Base Color"])
material.diffuse_color=(.22,.25,.30,1)
material.use_backface_culling=True

groups={name:[] for name in ["ReaderStatic","ReaderBody","ReaderHead","ReaderPaper","ReaderTurnPage","ReaderLeftHand","ReaderRightHand"]}
pivots={"ReaderRoot":(0,0,0),"ReaderStatic":(0,0,0),"ReaderBody":(0,.62,0),
        "ReaderHead":(0,1.20,.10),"ReaderPaper":(0,.90,.425),
        "ReaderTurnPage":(0,.90,.425),"ReaderLeftHand":(-.39,.86,.43),"ReaderRightHand":(.39,.88,.43)}
parents={"ReaderStatic":"ReaderRoot","ReaderBody":"ReaderRoot","ReaderHead":"ReaderBody","ReaderPaper":"ReaderBody",
         "ReaderTurnPage":"ReaderPaper","ReaderLeftHand":"ReaderPaper","ReaderRightHand":"ReaderPaper"}

def mesh(name, verts, faces, group="ReaderBody", tile="cloth", uv=None, tint=(1,1,1), smooth=True, recalc=True):
    data=bpy.data.meshes.new(name)
    data.from_pydata([P(v) for v in verts],[],faces)
    data.update()
    if recalc:
        bm=bmesh.new()
        bm.from_mesh(data)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
        bm.to_mesh(data)
        bm.free()
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    data.materials.append(material)
    uv_layer=data.uv_layers.new(name="Painted atlas")
    bounds=[(min(v[a] for v in verts),max(v[a] for v in verts)) for a in range(3)]
    u0,v0,u1,v1=TILES[tile]
    for face in data.polygons:
        face.use_smooth=smooth
        for li in face.loop_indices:
            vi=data.loops[li].vertex_index
            if uv is not None:
                u,v=uv[vi]
            else:
                # Stable front projection, used only for small fittings.
                u=(verts[vi][0]-bounds[0][0])/max(.001,bounds[0][1]-bounds[0][0])
                v=(verts[vi][1]-bounds[1][0])/max(.001,bounds[1][1]-bounds[1][0])
            uv_layer.data[li].uv=(lerp(u0,u1,u),lerp(v0,v1,v))
    color=data.color_attributes.new(name="Pigment wash",type="FLOAT_COLOR",domain="CORNER")
    data.color_attributes.active_color_index=0
    data.color_attributes.render_color_index=0
    for c in color.data:
        c.color=(*tint,1)
    obj["paint_region"]=tile
    obj["authored_part"]=name
    groups[group].append(obj)
    return obj

def loft(name, profiles, rings=30, sides=48, group="ReaderBody", tile="cloth", tint=(1,1,1), deform=None, cap=True):
    # Profiles contain (height, centre x, centre z, half width, half depth).
    verts=[]; uv=[]
    for j in range(rings+1):
        t=j/rings
        y,cx,cz,rx,rz=sample(profiles,t)
        for i in range(sides):
            a=i/sides*math.tau
            x=cx+rx*math.cos(a)
            z=cz+rz*math.sin(a)
            if deform:
                x,y1,z=deform(t,a,x,y,z)
            else:
                y1=y
            verts.append((x,y1,z)); uv.append((i/(sides-1),t))
    faces=[]
    for j in range(rings):
        for i in range(sides):
            ni=(i+1)%sides
            faces.append((j*sides+i,j*sides+ni,(j+1)*sides+ni,(j+1)*sides+i))
    if cap:
        faces.extend([tuple(range(sides-1,-1,-1)),tuple(rings*sides+i for i in range(sides))])
    return mesh(name,verts,faces,group,tile,uv,tint)

def tube(name, controls, radius=.01, sides=10, steps=20, group="ReaderBody", tile="cloth", tint=(1,1,1), ellipse=1, folds=0, cap=True):
    # Controls are (x,y,z,radius), allowing knuckles, cuffs and tapered seams.
    steps=max(3,round(steps*.70))
    if len(controls[0])==3:
        controls=[(*p,radius) for p in controls]
    verts=[]; uv=[]; frames=[]
    for j in range(steps+1):
        t=j/steps
        c=sample(controls,t); p=Vector(c[:3]); r=c[3]
        tangent=Vector(sample(controls,min(1,t+.005))[:3])-Vector(sample(controls,max(0,t-.005))[:3])
        tangent.normalize()
        guide=Vector((0,1,0)) if abs(tangent.y)<.92 else Vector((0,0,1))
        axis=tangent.cross(guide).normalized()
        other=tangent.cross(axis).normalized()
        frames.append((p,axis,other,r))
        for i in range(sides):
            a=i/sides*math.tau
            pleat=1+folds*(.6*math.sin(a*7+t*2.8)+.4*math.sin(a*11-t*4))
            v=p+r*pleat*(math.cos(a)*axis+ellipse*math.sin(a)*other)
            verts.append(tuple(v)); uv.append((i/(sides-1),t))
    faces=[(j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i) for j in range(steps) for i in range(sides)]
    ends=cap if isinstance(cap,tuple) else (cap,cap)
    if ends[0]:
        faces.append(tuple(range(sides-1,-1,-1)))
    if ends[1]:
        faces.append(tuple(steps*sides+i for i in range(sides)))
    obj=mesh(name,verts,faces,group,tile,uv,tint)
    return obj,frames

def sheet(name, func, nx=24, ny=24, thickness=.006, group="ReaderBody", tile="cloth", tint=(1,1,1), flip_back=False):
    # A sewn panel has an actual reverse face and a continuous finite hem.
    verts=[]; uv=[]
    for side in [-1,1]:
        for j in range(ny+1):
            v=j/ny
            for i in range(nx+1):
                u=i/nx
                x,y,z=func(u,v)
                verts.append((x,y,z+side*thickness/2))
                uv.append((1-u if side==-1 and flip_back else u,v))
    stride=nx+1; plane=stride*(ny+1); faces=[]
    for j in range(ny):
        for i in range(nx):
            a=j*stride+i
            faces.extend([(a,a+stride,a+stride+1,a+1),(plane+a,plane+a+1,plane+a+stride+1,plane+a+stride)])
    boundary=list(range(stride))+[j*stride+nx for j in range(1,ny+1)]+[ny*stride+i for i in range(nx-1,-1,-1)]+[j*stride for j in range(ny-1,0,-1)]
    for i,a in enumerate(boundary):
        b=boundary[(i+1)%len(boundary)]
        faces.append((a,b,plane+b,plane+a))
    return mesh(name,verts,faces,group,tile,uv,tint)

# The soft body has uneven shoulders and compressed folds around a seated waist.
def body_fold(t,a,x,y,z):
    fold=(.011*math.sin(9*a+2.5*t)+.006*math.sin(15*a-5*t))*(.5+.5*math.sin(math.pi*t))
    x+=math.cos(a)*fold
    z+=math.sin(a)*fold
    y+=.008*math.sin(a*3+t*4)
    return x,y,z

loft("Coat continuous slouched body",[(.422,0,-.025,.222,.163),(.49,-.012,-.01,.252,.175),(.70,-.02,.0,.205,.151),(.88,-.012,-.006,.205,.14),(1.035,-.012,-.015,.244,.137),(1.12,-.005,.015,.18,.105),(1.18,.0,.042,.083,.065)],
     rings=24,sides=44,deform=body_fold)

# Compressed seated hips and thighs give the overlying cloth real weight on the
# cushion. This volume is deliberately broad at the seat and tapers at the knee.
verts=[];uv=[];rings=16;sides=28
seated_profile=[(-.10,.515,.195,.069),(-.04,.52,.237,.073),(.09,.54,.249,.088),(.24,.54,.261,.083),(.36,.515,.256,.073),(.441,.474,.222,.058)]
for j in range(rings+1):
    t=j/rings
    z,cy,rx,ry=sample(seated_profile,t)
    for i in range(sides):
        a=i/sides*math.tau
        fold=.006*math.sin(a*9+t*4)
        verts.append((-.012+(rx+fold)*math.cos(a),max(.433,cy+(ry+fold)*math.sin(a)),z))
        uv.append((i/(sides-1),t))
faces=[(j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i) for j in range(rings) for i in range(sides)]
faces.extend([tuple(range(sides)),tuple(rings*sides+i for i in range(sides))])
mesh("Compressed seated coat volume beneath lap",verts,faces,uv=uv,tint=(.88,.92,.98))

# Broad skirts drape from the waist across two knees, then drop in deep pleats.
lap_profile=[(.755,.09,.213),(.645,.22,.242),(.585,.36,.264),(.545,.445,.282),(.40,.455,.27),(.245,.424,.261),(.135,.40,.256)]
def drape(u,v):
    y,z,w=sample(lap_profile,v)
    x=(u*2-1)*w-.012
    wave=.018*math.sin(10*math.pi*u+v*2.1)+.011*math.sin(18*math.pi*u-v*3.4)
    knee=math.exp(-((u-.26)/.17)**2)+.96*math.exp(-((u-.75)/.15)**2)
    y+=.045*knee*math.exp(-((v-.44)/.2)**2)
    z+=wave*(.25+.75*math.sin(v*math.pi/2))
    y+=.019*math.sin(u*13.1+1.3)*v**5
    z-=.028*abs(2*u-1)**2
    return x,y,z
sheet("Weighted skirt over knees with scalloped hem",drape,nx=36,ny=22,thickness=.009)
for side in [-1,1]:
    def side_drape(u,v,s=side):
        x,y,z=drape(0 if s<0 else 1,v)
        back_z=lerp(-.055,.273,v)
        z=lerp(z,back_z,u)+.008*math.sin(v*16+u*4)*math.sin(u*math.pi)
        x+=s*(.012*math.sin(u*math.pi)-.021*u)
        y-=.13*math.sin(v*math.pi)**2*math.sin(u*math.pi/2)
        return x,y,z
    sheet("Coat side drape returning around seated thigh",side_drape,nx=7,ny=22,thickness=.006,tint=(.86,.91,.98))
# Second lower layer peeks below the right flap, breaking a uniform hem.
def under_drape(u,v):
    x=-.19+u*.39
    y=lerp(.38,.095,v)+.012*math.sin(u*14+1)*v
    z=.365+.019*math.sin(u*math.pi*7+v)*(.6+.4*v)
    return x,y,z
sheet("Inner coat skirt underlapping the outer hem",under_drape,nx=20,ny=8,thickness=.005,tint=(.61,.67,.75))
hem=[drape(i/64,1) for i in range(65)]
tube("Worn rolled coat hem",hem,radius=.0042,sides=6,steps=80,tile="bag",tint=(.54,.61,.72))
for side in [-1,1]:
    # A sewn side seam follows the turn over the knee.
    seam=[drape(.018 if side<0 else .982,i/15) for i in range(16)]
    tube("Long coat side seam",seam,radius=.003,sides=5,steps=30,tint=(1.15,1.12,1.04))

# Sleeves turn at a real elbow; their lower edge hangs rather than reading as a limb capsule.
for s in [-1,1]:
    offset=.013 if s>0 else 0
    controls=[(s*.15,1.055,-.015,.065),(s*.213,1.023,.018,.087),(s*.263,.981,.058,.109),(s*.302,.852,.145,.113),
              (s*.323,.818+offset,.24,.101),(s*.344,.851+offset,.348,.076)]
    _,frames=tube(("Left" if s<0 else "Right")+" hanging folded sleeve",controls,sides=30,steps=28,ellipse=1.23,folds=.14,cap=(True,False))
    p,a,b,r=frames[-1]
    rim=[tuple(p+r*(math.cos(i/32*math.tau)*a+1.23*math.sin(i/32*math.tau)*b)) for i in range(33)]
    tube("Turned sleeve cuff edge",rim,radius=.0055,sides=7,steps=36,tile="bag",tint=(.57,.63,.74))
    # Inner cuff is a dark, short tapered lining, with the pale wrist nested in it.
    tube("Sleeve shadow lining",[(s*.332,.846+offset,.318,.071),(s*.344,.851+offset,.352,.068)],sides=24,steps=3,ellipse=1.2,tint=(.35,.41,.52),cap=False)
    for k in [-1,0,1]:
        tube("Elbow weighted fold ridge",[(s*(.27+.014*k),.91,.148), (s*(.304+.018*k),.81+offset,.20), (s*(.336+.013*k),.83+offset,.303)],
             radius=.0055,sides=6,steps=14,tint=(1.08,1.07,1.03))

# High irregular collar and overlapping lapel, both truly hollow panels.
def collar(u,v):
    a=u*math.tau
    radius=lerp(.102,.092,v)
    x=radius*math.cos(a)
    z=.047+radius*.77*math.sin(a)
    y=lerp(1.112,1.288,v)-.052*max(0,math.sin(a))*v+.008*math.cos(a*3)
    return x,y,z
sheet("High open standing collar",collar,nx=32,ny=6,thickness=.009,tint=(.8,.86,.95))
tube("Soft collar rolled edge",[collar(i/48,1) for i in range(49)],radius=.0045,sides=6,steps=52,tile="bag",tint=(.7,.75,.82))
sheet("Overlapping coat front lapel",lambda u,v:(lerp(-.075,.055,u)+.015*math.sin(v*math.pi),lerp(.81,1.22,v),.142+.021*math.sin(u*math.pi)-.03*v),nx=6,ny=12,thickness=.008,tint=(.84,.89,.96))
sheet("Soft collar inner overlapping facing",lambda u,v:(lerp(-.087,.068,u),lerp(1.15,1.252,v)+.009*math.sin(u*math.pi),.13+.014*math.sin(u*math.pi)-.012*v),nx=8,ny=6,thickness=.007,tint=(.66,.74,.86))
for y in [.91,1.015,1.122]:
    tube("Small worn wooden coat toggle",[(-.014,y,.17),(.018,y+.003,.172)],radius=.010,sides=10,steps=3,tile="bag",tint=(.82,.77,.63))

# Slender neck emerges behind the pointed chin. The head is one custom seedpod surface.
tube("Quiet ivory neck",[(0,1.125,.055,.047),(-.008,1.20,.085,.043),(-.009,1.31,.145,.042)],sides=26,steps=12,group="ReaderHead",tile="skin",ellipse=.8,tint=(.78,.81,.76))
head_profile=[(1.215,-.008,.243,.009,.018),(1.26,-.013,.225,.050,.059),(1.346,-.017,.166,.099,.100),(1.416,-.012,.113,.131,.119),
              (1.506,.003,.067,.125,.108),(1.589,.023,.029,.097,.080),(1.665,.052,.003,.057,.049),(1.716,.084,-.014,.022,.020),(1.738,.103,-.025,.0018,.003)]
def seed_shape(t,a,x,y,z):
    # Quiet long ridges and a flattened facial plane: no sphere silhouette.
    ripple=.0032*math.sin(a*7+t*3)+.0019*math.sin(a*13-t*4)
    x+=math.cos(a)*ripple*math.sin(math.pi*t)
    z+=math.sin(a)*ripple*math.sin(math.pi*t)
    if math.sin(a)>.25:
        z-=.010*math.sin(a)**4*math.exp(-((t-.39)/.20)**2)
    return x,y,z
loft("Asymmetric bowed seedpod face",head_profile,rings=32,sides=44,group="ReaderHead",tile="skin",deform=seed_shape,tint=(1.05,1.025,.96))
def face_point(x,y,offset=.0006):
    lo=0;hi=1
    for _ in range(32):
        t=(lo+hi)/2
        if sample(head_profile,t)[0]<y: lo=t
        else: hi=t
    yy,cx,cz,rx,rz=sample(head_profile,t)
    a=math.acos(max(-1,min(1,(x-cx)/rx)))
    for _ in range(5):
        xx,_,_=seed_shape(t,a,cx+rx*math.cos(a),yy,cz+rz*math.sin(a))
        a+=(xx-x)/max(.01,rx*math.sin(a))
    xx,yy,z=seed_shape(t,a,cx+rx*math.cos(a),yy,cz+rz*math.sin(a))
    return xx,yy,z+offset
for s in [-1,1]:
    # Eyes are short curved ink strokes, intentionally low on the long face.
    eye=[]
    for j in range(7):
        u=j/6
        x=s*.058+(u-.5)*.032
        y=1.366+.003*math.cos((u-.5)*math.pi)+s*.003
        x,y,z=face_point(x,y)
        eye.append((x,y,z,.0018+.0012*math.sin(u*math.pi)))
    tube("Sleepy ink eye",eye,sides=7,steps=10,group="ReaderHead",tile="skin",tint=(.018,.023,.024),ellipse=.54)
    tube("Upper eyelid soft ridge",[face_point(p[0],p[1]+.0045,.0003) for p in eye],radius=.0017,sides=6,steps=10,group="ReaderHead",tile="skin",tint=(.72,.73,.64))
tube("Small contemplative mouth",[face_point(-.018,1.264),face_point(-.008,1.262),face_point(.001,1.265)],radius=.0012,sides=6,steps=8,group="ReaderHead",tile="skin",tint=(.13,.14,.12))

# Ankle cloth and intentionally asymmetric, narrow worn shoes are stationary.
for s in [-1,1]:
    cx=s*.128
    tube("Ivory wrapped ankle",[(cx,.085,.351,.043),(cx,.18,.346,.043),(cx,.25,.325,.049)],sides=22,steps=9,group="ReaderStatic",tile="skin",tint=(.70,.71,.63))
    for k in range(3):
        points=[(cx+.043*math.cos(i/28*math.tau),.135+k*.018,.345+.036*math.sin(i/28*math.tau)) for i in range(29)]
        tube("Ankle wrap seam",points,radius=.0024,sides=5,steps=28,group="ReaderStatic",tile="skin",tint=(.48,.49,.42))
    # A shoe is a curved loaf-shaped closed surface varying along its length.
    verts=[];uv=[];rings=16;sides=24
    for j in range(rings+1):
        t=j/rings
        z=lerp(.245,.60+(s+1)*.006,t)
        width=.064*math.sin(math.pi*t)**.45+.004
        height=.052*math.sin(math.pi*t)**.65+.004
        centre_y=.047+.024*math.exp(-((t-.24)/.24)**2)
        for i in range(sides):
            a=i/sides*math.tau
            x=cx+width*math.cos(a)+s*.009*t
            y=max(.015,centre_y+height*math.sin(a))
            verts.append((x,y,z));uv.append((i/(sides-1),t))
    faces=[(j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i) for j in range(rings) for i in range(sides)]
    faces.extend([tuple(range(sides)),tuple(rings*sides+i for i in range(sides))])
    mesh("Weathered leather walking shoe",verts,faces,"ReaderStatic","bag",uv,(.47,.39,.30))
    welt=[]
    for flank in [1,-1]:
        for j in range(25):
            t=j/24 if flank==1 else 1-j/24
            width=.064*math.sin(math.pi*t)**.45+.004
            welt.append((cx+flank*width+s*.009*t,.022,lerp(.245,.60+(s+1)*.006,t)))
    welt.append(welt[0])
    tube("Hand stitched shoe welt",welt,radius=.0024,sides=5,steps=48,group="ReaderStatic",tile="bag",tint=(.61,.50,.37))
    for k in range(3):
        z=.345+k*.026
        tube("Shoe cotton lace",[(cx-.034,.109-k*.005,z),(cx,.118-k*.006,z+.01),(cx+.034,.109-k*.005,z)],radius=.0032,sides=5,steps=10,group="ReaderStatic",tile="skin",tint=(.45,.40,.29))

# Small slouched satchel on the cushion, sewn shape with flap and carrying handle.
bag_start=len(groups["ReaderStatic"])
def bag_shape(t,a,x,y,z):
    # Squared but supple profile, with compressed bottom corners.
    x=.351+math.copysign(abs(math.cos(a))**.48,math.cos(a))*(.096-.012*t)+.004*math.sin(t*8+a*3)
    z=.036+math.copysign(abs(math.sin(a))**.48,math.sin(a))*(.073-.004*t)+.005*math.sin(t*9+a*4)
    return x,y,z
loft("Travelling satchel sewn body",[(.023,.351,.036,.096,.073),(.06,.351,.036,.098,.075),(.19,.347,.037,.092,.07),(.293,.343,.032,.078,.06),(.307,.342,.03,.073,.055)],
     rings=14,sides=24,group="ReaderStatic",tile="bag",deform=bag_shape,tint=(.80,.72,.59))
sheet("Satchel overlapping curved flap",lambda u,v:(.264+u*.165, .317-v*.12-.016*math.sin(u*math.pi)*v, .047+.076*math.sin(v*math.pi/2)),nx=12,ny=8,thickness=.006,group="ReaderStatic",tile="bag",tint=(.89,.80,.66))
for x in [.284,.406]:
    tube("Satchel front fastening strap",[(x,.29,.109),(x-.002,.208,.127),(x,.076,.111)],radius=.009,sides=6,steps=12,group="ReaderStatic",tile="bag",tint=(.50,.43,.32),ellipse=.31)
    buckle=[(x-.014,.19,.135),(x-.014,.216,.135),(x+.014,.216,.135),(x+.014,.19,.135),(x-.014,.19,.135)]
    tube("Quiet aged brass satchel buckle",buckle,radius=.003,sides=6,steps=16,group="ReaderStatic",tile="skin",tint=(.55,.39,.17))
tube("Supple satchel carrying handle",[(.296,.302,.025,.011),(.307,.36,.023,.009),(.354,.375,.02,.009),(.391,.348,.019,.009),(.405,.295,.025,.011)],
     sides=8,steps=24,group="ReaderStatic",tile="bag",tint=(.45,.39,.30),ellipse=.5)
tube("Satchel loose shoulder strap",[(.275,.21,-.028),(.276,.10,-.093),(.34,.024,-.114),(.44,.032,-.07),(.447,.16,.015),(.417,.28,.032)],radius=.011,sides=6,steps=32,group="ReaderStatic",tile="bag",tint=(.43,.37,.28),ellipse=.32)
for part in groups["ReaderStatic"][bag_start:]:
    for vertex in part.data.vertices:
        vertex.co+=Vector(P((.12,.43,0)))

# One complete front-page painting per leaf. Both physical faces carry print.
# Gutter is lower than the outer edges, so the spread has an organic shallow V.
def paper_surface(x,v,front_offset=0):
    y=.90+(v-.5)*.414+.018*abs(x/.397)+.006*math.sin(x*12+v*4)
    z=.425+.040*abs(x/.397)-.035*(v-.5)+.008*math.sin(v*math.pi)*math.sin(abs(x)*6)+front_offset
    return x,y,z
for side in [-1,1]:
    def panel(u,v,s=side):
        return paper_surface(s*(.002+u*.395),v)
    leaf=sheet("Newspaper left leaf" if side<0 else "Newspaper right leaf",panel,nx=12,ny=10,thickness=.0018,group="ReaderPaper",tile="paper",flip_back=True)
    if side<0:
        for datum in leaf.data.uv_layers.active.data:
            datum.uv.x=1.5-datum.uv.x
            datum.uv.y=.01+(datum.uv.y-.01)*.73
    # Three narrow staggered fore-edges show that the spread contains several leaves.
    for k in range(2):
        tube("Newspaper layered lower fore-edge",[paper_surface(side*(.005+i/20*.392),0,-.0025-k*.002) for i in range(21)],radius=.00085,sides=4,steps=24,group="ReaderPaper",tile="skin",tint=(.79,.70,.51))
turn_leaf=sheet("Curved printable turning leaf",lambda u,v:paper_surface(.002+u*.392,v,-.009-.014*math.sin(u*math.pi)),nx=16,ny=12,thickness=.001,group="ReaderTurnPage",tile="paper",flip_back=True)
for datum in turn_leaf.data.uv_layers.active.data:
    datum.uv.y=.01+(datum.uv.y-.01)*.73

# Four individual fingers bend over each paper edge. The thumb remains behind it.
for s,group in [(-1,"ReaderLeftHand"),(1,"ReaderRightHand")]:
    yy=.865+(.019 if s>0 else 0)
    tube("Pale tapered wrist",[(s*.337,yy-.018,.330,.029),(s*.365,yy-.003,.389,.027),(s*.39,yy,.44,.026)],sides=18,steps=12,group=group,tile="skin",ellipse=.69,tint=(.90,.93,.86))
    # Palm is a flattened organic tapered surface.
    tube("Quiet hand palm",[(s*.381,yy-.018,.434,.025),(s*.405,yy+.002,.451,.031),(s*.407,yy+.030,.456,.020)],sides=20,steps=10,group=group,tile="skin",ellipse=.63,tint=(.98,.98,.89))
    for finger in range(4):
        y=yy+.038-finger*.015
        startx=s*(.407+(.003 if finger in [1,2] else 0))
        length=.040-(.007 if finger==3 else 0)
        controls=[(startx,y,.457,.0082), (s*.410,y+.002,.475,.0081), (s*.388,y-.001,.482,.0071),
                  (s*(.407-length),y-.004,.477,.0062),(s*(.404-length),y-.006,.469,.004)]
        tube("Finger wrapped around newspaper",controls,sides=8,steps=12,group=group,tile="skin",ellipse=.78,tint=(1.02,1.0,.91))
        tube("Small finger knuckle crease",[(s*.398,y+.004,.482),(s*.395,y+.006,.483)],radius=.0012,sides=5,steps=3,group=group,tile="skin",tint=(.53,.54,.45))
    tube("Thumb gripping paper reverse",[(s*.388,yy-.02,.445,.011),(s*.38,yy+.006,.440,.010),(s*.374,yy+.029,.441,.008),(s*.368,yy+.036,.447,.004)],sides=10,steps=14,group=group,tile="skin",ellipse=.74,tint=(.91,.93,.83))

# Every pose node has identity basis axes. Geometry is baked relative to its pivot.
# glTF's Y-up conversion then yields identity quaternions, not -90-degree wrappers.
pose={}
for name,pivot in pivots.items():
    obj=bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(obj)
    if name in parents:
        obj.parent=pose[parents[name]]
        parent_pivot=pivots[parents[name]]
    else:
        parent_pivot=(0,0,0)
    obj.location=P(tuple(pivot[i]-parent_pivot[i] for i in range(3)))
    obj.empty_display_type="PLAIN_AXES"
    obj.empty_display_size=.05
    obj["runtime_pivot_m"]=pivot
    pose[name]=obj
for group,objects in groups.items():
    offset=Vector(P(pivots[group]))
    for obj in objects:
        for v in obj.data.vertices:
            v.co-=offset
        obj.parent=pose[group]
        obj.location=(0,0,0)
pose["ReaderRoot"]["application_axes"]="Y up, +Z facing; source Blender Z up"
pose["ReaderRoot"]["seat_cushion_height_m"]=.45
pose["ReaderTurnPage"]["runtime_hidden_at_rest"]=True
pose["ReaderTurnPage"]["turn_axis"]="local Y, 0 to +pi; reader-facing -Z half-space"
pose["ReaderRoot"]["original_asset"]="Original custom mesh sculpture; no downloaded model or extracted geometry"
scene=bpy.context.scene
scene.unit_settings.system="METRIC"
scene.unit_settings.scale_length=1
tex.image.pack()
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"newspaper-reader.blend"))

# The saved source retains every sewn component. Only the export is combined.
exported=[]
for group,objects in groups.items():
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:
        bpy.ops.object.join()
    obj=bpy.context.object
    obj.name=group+"Mesh"
    exported.append(obj)
bpy.context.view_layer.update()
all_points=[unP(obj.matrix_world@v.co) for obj in exported for v in obj.data.vertices]
minimum=[min(p[i] for p in all_points) for i in range(3)]
maximum=[max(p[i] for p in all_points) for i in range(3)]
assert minimum[0]>=-.625 and maximum[0]<=.625,(minimum,maximum)
assert minimum[1]>=-.001 and maximum[1]<=1.75,(minimum,maximum)
assert minimum[2]>=-.23 and maximum[2]<=.70,(minimum,maximum)
bpy.ops.object.select_all(action="DESELECT")
for obj in exported+list(pose.values()):
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(PUBLIC/"newspaper-reader.glb"),export_format="GLB",use_selection=True,
    export_yup=True,export_apply=True,export_texcoords=True,export_normals=True,export_materials="EXPORT",
    export_animations=False,export_vertex_color="ACTIVE",export_all_vertex_colors=False,export_extras=True,
    export_cameras=False,export_lights=False)
triangles=sum(sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in exported)
metadata={"name":"The Quiet Line — newspaper reader","generator":"scripts/build-reader.py","blender":bpy.app.version_string,
    "coordinates":{"up":"Y","forward":"+Z","origin":"floor","seat_cushion_height_m":.45},
    "bounds_m":{"min":minimum,"max":maximum,"size":[maximum[i]-minimum[i] for i in range(3)]},
    "mesh_count":len(exported),"primitives":len(exported),"triangles":triangles,"materials":1,
    "glb_bytes":(PUBLIC/"newspaper-reader.glb").stat().st_size,
    "texture_dimensions":list(tex.image.size),"atlas_regions_blender_uv":TILES,
    "estimated_rgba8_texture_with_mipmaps_mib":round(tex.image.size[0]*tex.image.size[1]*4*4/3/1024**2,2),
    "nodes":{name:{"parent":parents.get(name),"world_pivot_m":list(pivot),"local_position_m":[pivot[i]-pivots[parents[name]][i] if name in parents else pivot[i] for i in range(3)],"local_rotation_quaternion_xyzw":[0,0,0,1]} for name,pivot in pivots.items()},
    "page_turn":{"node":"ReaderTurnPage","axis":"local Y","radians":[0,math.pi],"side":"reader-facing -Z","hidden_at_rest":True,"leaf_width_m":.392,"both_sides_printed":True},
    "notes":["Original editable custom mesh geometry; the generated concept informed silhouette and material only.","Opaque matte shared atlas; finite cloth hems, fingers, seams, paper thickness and printed reverse sides.","Source retains named individual components. Export combines by pose node into seven shared-material meshes.","Construction counts are not measured Quest performance. Inspect the GLB in the application."]}
(OUT/"reader-metadata.json").write_text(json.dumps(metadata,indent=2)+"\n")
print("READER_STATS "+json.dumps(metadata))

if opts.render:
    # One bounded source review. Runtime hides the optional leaf at rest as well.
    pose["ReaderTurnPage"].hide_render=True
    for obj in pose["ReaderTurnPage"].children:
        obj.hide_render=True
    scene.render.engine="CYCLES"
    scene.cycles.samples=32
    scene.render.resolution_x=1100
    scene.render.resolution_y=1200
    scene.render.resolution_percentage=100
    scene.view_settings.view_transform="Standard"
    scene.world.use_nodes=True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value=(.48,.59,.66,1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value=.65
    for name,pos,power,size in [("Broad window daylight",(-3,4,4),450,5),("Warm carriage fill",(3,2,1),170,4)]:
        data=bpy.data.lights.new(name,"AREA");data.energy=power;data.shape="DISK";data.size=size
        light=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(light)
        light.location=P(pos)
        light.rotation_euler=(Vector(P((0,.85,.15)))-light.location).to_track_quat("-Z","Y").to_euler()
    camera_data=bpy.data.cameras.new("Reader review camera")
    camera=bpy.data.objects.new("Reader review camera",camera_data)
    bpy.context.collection.objects.link(camera);scene.camera=camera
    camera.location=P((-2.1,1.75,4.3))
    camera.rotation_euler=(Vector(P((0,.89,.15)))-camera.location).to_track_quat("-Z","Y").to_euler()
    camera_data.type="ORTHO";camera_data.ortho_scale=1.95
    scene.render.image_settings.file_format="PNG"
    scene.render.filepath=str(ROOT/".impeccable/review/reader-model-three-quarter.png")
    bpy.ops.render.render(write_still=True)
