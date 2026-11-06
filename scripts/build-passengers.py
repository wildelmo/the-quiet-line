"""Four original, hand-authored seated spirits for The Quiet Line.

Run with the repository's portable Blender: --background --python this_file.
Shapes are specified in metres, Y up, +Z toward the aisle. The saved .blend
retains separate sewn/sculpted parts; glTF joins them only within pose groups.
"""
from pathlib import Path
import json
import math
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
def lerp(a,b,t): return a*(1-t)+b*t
def sample(values,t):
    t=min(1,max(0,t))*(len(values)-1)
    i=min(len(values)-2,int(t)); f=t-i
    a,b,c,d=[values[min(len(values)-1,max(0,j))] for j in (i-1,i,i+1,i+2)]
    return tuple(.5*((2*bb)+(-aa+cc)*f+(2*aa-5*bb+4*cc-dd)*f*f+(-aa+3*bb-3*cc+dd)*f*f*f) for aa,bb,cc,dd in zip(a,b,c,d))

TILES={'cloth':(.025,.525,.475,.975),'skin':(.525,.525,.975,.975),'bag':(.025,.025,.475,.475)}
mat=bpy.data.materials.new('Quiet Line — shared painted atlas and mineral pigments')
mat.use_nodes=True
nodes=mat.node_tree.nodes
bsdf=nodes.get('Principled BSDF')
bsdf.inputs['Roughness'].default_value=.92
bsdf.inputs['Specular IOR Level'].default_value=.20
tex=nodes.new('ShaderNodeTexImage')
tex.image=bpy.data.images.load(str(PUBLIC/'reader-material-atlas.png'))
tex.image.colorspace_settings.name='sRGB'
wash=nodes.new('ShaderNodeVertexColor');wash.layer_name='Pigment wash'
mul=nodes.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1
mat.node_tree.links.new(tex.outputs['Color'],mul.inputs[1])
mat.node_tree.links.new(wash.outputs['Color'],mul.inputs[2])
mat.node_tree.links.new(mul.outputs[0],bsdf.inputs['Base Color'])
mat.diffuse_color=(.43,.39,.25,1)
mat.use_backface_culling=True

names=['Sleeper','Moth','Gardener','Keeper']
head_pivots=[(0,1.03,.08),(0,1.00,.03),(0,1.20,.04),(0,1.14,.04)]
action_pivots=[(0,.73,.30),(0,.73,.23),(0,.79,.36),(0,.83,.37)]
groups={};pivots={};parents={}
for n,h,a in zip(names,head_pivots,action_pivots):
    pivots[n]=(0,0,0)
    for suffix,pivot,parent in [('Static',(0,0,0),n),('Body',(0,.62,0),n),('Head',h,n+'Body'),('Action',a,n+'Body')]:
        group=n+suffix;groups[group]=[];pivots[group]=pivot;parents[group]=parent

def mesh(name,verts,faces,group,tile='skin',tint=(1,1,1),uv=None,smooth=True):
    data=bpy.data.meshes.new(name);data.from_pydata([P(v) for v in verts],[],faces);data.update()
    bm=bmesh.new();bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    data.materials.append(mat)
    layer=data.uv_layers.new(name='Painted atlas');u0,v0,u1,v1=TILES[tile]
    bounds=[(min(v[a] for v in verts),max(v[a] for v in verts)) for a in range(3)]
    for face in data.polygons:
        face.use_smooth=smooth
        for li in face.loop_indices:
            vi=data.loops[li].vertex_index
            if uv is None:
                u=(verts[vi][0]-bounds[0][0])/max(.001,bounds[0][1]-bounds[0][0])
                v=(verts[vi][1]-bounds[1][0])/max(.001,bounds[1][1]-bounds[1][0])
            else:u,v=uv[vi]
            layer.data[li].uv=(lerp(u0,u1,u),lerp(v0,v1,v))
    color=data.color_attributes.new(name='Pigment wash',type='FLOAT_COLOR',domain='CORNER')
    data.color_attributes.active_color_index=0;data.color_attributes.render_color_index=0
    for c in color.data:c.color=(*tint,1)
    obj['authored_part']=name;obj['paint_region']=tile
    groups[group].append(obj)
    return obj

def loft(name,profiles,group,tile='skin',tint=(1,1,1),rings=16,sides=28,deform=None,cap=True):
    rings=max(1,round(rings*.85));sides=max(8,round(sides*.85))
    verts=[];uv=[]
    for j in range(rings+1):
        t=j/rings;y,cx,cz,rx,rz=sample(profiles,t)
        for i in range(sides):
            a=i/sides*math.tau;x=cx+rx*math.cos(a);z=cz+rz*math.sin(a)
            v=deform(t,a,x,y,z) if deform else (x,y,z)
            verts.append(v);uv.append((i/(sides-1),t))
    faces=[(j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i) for j in range(rings) for i in range(sides)]
    if cap:faces.extend([tuple(range(sides-1,-1,-1)),tuple(rings*sides+i for i in range(sides))])
    return mesh(name,verts,faces,group,tile,tint,uv)

def tube(name,controls,group,radius=.008,tile='skin',tint=(1,1,1),sides=8,steps=12,ellipse=1,folds=0,cap=True):
    steps=max(3,round(steps*.70));sides=max(5,round(sides*.85))
    if len(controls[0])==3:controls=[(*p,radius) for p in controls]
    verts=[];uv=[];frames=[]
    for j in range(steps+1):
        t=j/steps;c=sample(controls,t);p=Vector(c[:3]);r=c[3]
        tangent=Vector(sample(controls,min(1,t+.005))[:3])-Vector(sample(controls,max(0,t-.005))[:3])
        tangent.normalize();guide=Vector((0,1,0)) if abs(tangent.y)<.92 else Vector((0,0,1))
        axis=tangent.cross(guide).normalized();other=tangent.cross(axis).normalized()
        frames.append((p,axis,other,r))
        for i in range(sides):
            a=i/sides*math.tau;pleat=1+folds*(.7*math.sin(a*7+t*3)+.3*math.sin(a*11-t*5))
            verts.append(tuple(p+r*pleat*(math.cos(a)*axis+ellipse*math.sin(a)*other)));uv.append((i/(sides-1),t))
    faces=[(j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i) for j in range(steps) for i in range(sides)]
    ends=cap if isinstance(cap,tuple) else (cap,cap)
    if ends[0]:faces.append(tuple(range(sides-1,-1,-1)))
    if ends[1]:faces.append(tuple(steps*sides+i for i in range(sides)))
    return mesh(name,verts,faces,group,tile,tint,uv),frames

def sheet(name,func,group,tile='skin',tint=(1,1,1),nx=16,ny=10,thickness=.006):
    nx=max(4,round(nx*.80));ny=max(3,round(ny*.80))
    verts=[];uv=[]
    for sign in [-1,1]:
        for j in range(ny+1):
            for i in range(nx+1):
                u=i/nx;v=j/ny;x,y,z=func(u,v)
                verts.append((x,y,z+sign*thickness/2));uv.append((u,v))
    stride=nx+1;plane=stride*(ny+1);faces=[]
    for j in range(ny):
        for i in range(nx):
            a=j*stride+i;faces.extend([(a,a+stride,a+stride+1,a+1),(plane+a,plane+a+1,plane+a+stride+1,plane+a+stride)])
    boundary=list(range(stride))+[j*stride+nx for j in range(1,ny+1)]+[ny*stride+i for i in range(nx-1,-1,-1)]+[j*stride for j in range(ny-1,0,-1)]
    for i,a in enumerate(boundary):
        b=boundary[(i+1)%len(boundary)];faces.append((a,b,plane+b,plane+a))
    return mesh(name,verts,faces,group,tile,tint,uv)

def folds(t,a,x,y,z):
    f=(.008*math.sin(a*9+t*4)+.004*math.sin(a*15-t*3))*(.4+.6*math.sin(math.pi*t))
    return x+f*math.cos(a),y+.004*math.sin(a*3),z+f*math.sin(a)

def lap(name,group,width=.25,end=.15,tint=(1,1,1),tile='skin',rise=.76):
    profile=[(rise,.09,width*.80),(.64,.24,width*.94),(.565,.39,width),(.48,.435,width*1.02),(.30,.427,width*.97),(end,.39,width*.92)]
    def surface(u,v):
        y,z,w=sample(profile,v);x=(u*2-1)*w
        y+=.025*(math.exp(-((u-.26)/.17)**2)+math.exp(-((u-.73)/.17)**2))*math.exp(-((v-.4)/.23)**2)
        z+=(.015*math.sin(u*math.pi*10+v*2)+.007*math.sin(u*math.pi*17-v*3))*(.2+.8*v)
        y+=.013*math.sin(u*15+1)*v**4
        return x,y,z-.018*abs(2*u-1)**2
    sheet(name+' broad seated lap and pleated hem',surface,group,tile,tint,nx=24,ny=14)
    # The hidden hip volume stays well inside the returning side cloth. The
    # rounded knee end closes under the lap rather than creating a broad cap.
    tube(name+' compressed seated hips',[(0,.50,-.08,width*.48),(0,.515,.06,width*.72),(0,.52,.23,width*.72),(0,.515,.33,width*.60),(0,.505,.385,width*.20),(0,.50,.40,.006)],group,tile=tile,tint=tint,sides=24,steps=16,ellipse=.27)
    for s in [-1,1]:
        def side(u,v,s=s):
            x,y,z=surface(0 if s<0 else 1,v)
            return x-s*.028*u,y-.07*math.sin(v*math.pi)*math.sin(u*math.pi),lerp(z,lerp(-.09,.27,v),u)
        sheet(name+' returning side skirt',side,group,tile,tuple(c*.83 for c in tint),nx=4,ny=12)
    tube(name+' rolled hem',[surface(i/32,1) for i in range(33)],group,radius=.0035,tile=tile,tint=tuple(c*.66 for c in tint),sides=5,steps=32)
    return surface

def sleeve(name,group,controls,tint,tile='skin',size=1):
    obj,frames=tube(name+' bent sleeve with elbow drape',controls,group,tile=tile,tint=tint,sides=22,steps=15,ellipse=1.15,folds=.13,cap=(True,False))
    p,a,b,r=frames[-1]
    rim=[tuple(p+r*(math.cos(i/24*math.tau)*a+1.15*math.sin(i/24*math.tau)*b)) for i in range(25)]
    tube(name+' turned cuff',rim,group,radius=.004*size,tile=tile,tint=tuple(c*.60 for c in tint),sides=6,steps=24)
    return obj

def hand(name,group,wrist,centre,side=1,scale=1,tint=(.94,.97,.88),curl=.02):
    wx,wy,wz=wrist;x,y,z=centre
    tube(name+' tapered wrist',[(wx,wy,wz,.025*scale),(x-side*.015*scale,y-.012*scale,z-.014*scale,.026*scale),(x,y,z,.029*scale)],group,tint=tint,sides=14,steps=7,ellipse=.65)
    tube(name+' soft palm',[(x,y-.018*scale,z,.025*scale),(x+side*.015*scale,y+.006*scale,z+.009*scale,.033*scale),(x+side*.024*scale,y+.023*scale,z+.007*scale,.020*scale)],group,tint=tint,sides=14,steps=7,ellipse=.64)
    for k in range(4):
        xx=x+side*(.010+k*.012)*scale;yy=y+.022*scale-(.007 if k==3 else 0)*scale
        tube(name+' curled finger '+str(k+1),[(xx,yy,z,.007*scale),(xx,yy+.017*scale,z+.020*scale,.0068*scale),(xx-side*.006*scale,yy+.005*scale,z+.033*scale,.0058*scale),(xx-side*.010*scale,yy-curl*scale,z+.029*scale,.0038*scale)],group,tint=tint,sides=7,steps=7,ellipse=.84)
    tube(name+' thumb',[(x-side*.008*scale,y-.014*scale,z+.007*scale,.009*scale),(x-side*.025*scale,y+.002*scale,z+.024*scale,.009*scale),(x-side*.018*scale,y+.021*scale,z+.029*scale,.004*scale)],group,tint=tint,sides=8,steps=8)

def shoe(name,group,cx,cy=.06,front=.60,back=.27,tint=(.42,.35,.28),turn=0,scale=1):
    verts=[];uv=[];rings=12;sides=20
    for j in range(rings+1):
        t=j/rings;z=lerp(back,front,t);w=.066*scale*math.sin(math.pi*t)**.5+.003;h=.052*scale*math.sin(math.pi*t)**.65+.003
        for i in range(sides):
            a=i/sides*math.tau
            verts.append((cx+w*math.cos(a)+turn*t,max(.012,cy+h*math.sin(a)+.017*math.exp(-((t-.24)/.22)**2)),z));uv.append((i/(sides-1),t))
    faces=[(j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i) for j in range(rings) for i in range(sides)]
    faces.extend([tuple(range(sides)),tuple(rings*sides+i for i in range(sides))])
    mesh(name+' shaped leather shoe',verts,faces,group,'bag',tint,uv)
    welt=[]
    # Follow the shoe's actual lower flank, including its raised heel. Using
    # maximum width at a lower fixed Y would leave an unattached oval ring.
    for s in [1,-1]:
        for j in range(rings+1):
            t=j/rings if s==1 else 1-j/rings
            w=.066*scale*math.sin(math.pi*t)**.5+.003
            h=.052*scale*math.sin(math.pi*t)**.65+.003
            centre=cy+.017*math.exp(-((t-.24)/.22)**2)
            angle=math.pi/5
            welt.append((cx+s*(w*math.cos(angle)-.0003)+turn*t,max(.012,centre-h*math.sin(angle)),lerp(back,front,t)))
    welt.append(welt[0]);tube(name+' stitched welt',welt,group,radius=.0017*scale,tile='skin',tint=(.30,.28,.21),sides=5,steps=36)
    for k in range(2):
        z=lerp(back,front,.32+k*.10)
        tube(name+' crossing lace',[(cx-.031*scale,cy+.060*scale-k*.005,z),(cx,cy+.069*scale-k*.006,z+.008),(cx+.031*scale,cy+.06*scale-k*.005,z)],group,radius=.0027*scale,tile='skin',tint=(.53,.46,.31),sides=5,steps=5)

def eye_stroke(name,group,points,tint=(.028,.033,.025),radius=.0028):
    tube(name,points,group,radius=radius,tint=tint,sides=6,steps=8,ellipse=.68)

def on_face(profiles,x,y,offset=.002,deform=None):
    """Place fine features on the actual custom face, including its tilt."""
    a=math.pi/2;t=.5
    def point(t,a):
        yy,cx,cz,rx,rz=sample(profiles,t)
        p=(cx+rx*math.cos(a),yy,cz+rz*math.sin(a))
        return deform(t,a,*p) if deform else p
    for _ in range(7):
        lo=0;hi=1
        for _ in range(22):
            t=(lo+hi)/2
            if point(t,a)[1]<y:lo=t
            else:hi=t
        lo=0;hi=math.pi
        for _ in range(22):
            a=(lo+hi)/2
            if point(t,a)[0]>x:lo=a
            else:hi=a
    xx,yy,z=point(t,a)
    return xx,yy,z+offset

# THE SLEEPER: a broad river traveller, low tilted face, old ochre overcoat.
g='SleeperBody';ochre=(.47,.29,.105)
loft('Sleeper broad slumped overcoat',[(.455,-.015,-.015,.28,.16),(.55,-.012,.015,.302,.17),(.75,-.025,.015,.285,.173),(.91,-.02,.0,.265,.16),(1.02,-.025,.005,.235,.135),(1.10,-.035,.04,.125,.085)],g,tint=ochre,rings=18,sides=32,deform=folds)
slap=lap('Sleeper',g,width=.293,end=.17,tint=ochre,rise=.77)
for s in [-1,1]:
    sleeve('Sleeper '+str(s),g,[(s*.20,.995,.015,.073),(s*.29,.94,.045,.105),(s*.335,.79,.13,.11),(s*.29,.735,.25,.097),(s*.18,.765,.35,.062)],ochre)
    sheet('Sleeper wide folded lapel',lambda u,v,s=s:(s*lerp(.035,.135,u)*(1-.23*v),lerp(.80,1.105,v),.16+.014*math.sin(u*math.pi)-.017*v),g,tint=(.32,.19,.065),nx=5,ny=8)
    tube('Sleeper lapel piping',[(s*.14,.82,.173),(s*.12,.96,.169),(s*.08,1.10,.147)],g,radius=.003,tint=(.66,.43,.17),sides=5,steps=10)
    tube('Sleeper trouser ankle',[(s*.15,.085,.34,.049),(s*.16,.24,.335,.057)],'SleeperStatic',tile='cloth',tint=(.76,.74,.65),sides=18,steps=8,folds=.12)
    shoe('Sleeper '+str(s),'SleeperStatic',s*.15,front=.61,turn=s*.02,scale=1.08)
for y in [.91,.82]:tube('Sleeper horn toggle',[(-.016,y,.20),(.021,y+.002,.20)],g,radius=.008,tile='bag',tint=(.39,.29,.16),sides=8,steps=3)

h='SleeperHead'
shead=[(1.025,-.035,.12,.058,.058),(1.06,-.04,.145,.14,.103),(1.15,-.04,.118,.202,.144),(1.25,-.018,.09,.215,.149),(1.34,-.008,.055,.184,.125),(1.395,-.024,.03,.11,.073),(1.412,-.041,.024,.025,.020)]
def sleep_shape(t,a,x,y,z):
    return x+.008*math.sin(a*3+t*4)*math.sin(math.pi*t),y+.013*math.cos(a)*math.sin(math.pi*t),z+.004*math.sin(a*7+t*3)
loft('Sleeper asymmetric riverstone face',shead,h,tint=(.79,.82,.64),rings=22,sides=36,deform=sleep_shape)
for s in [-1,1]:
    x=s*.089-.025;y=1.207+s*.007
    face=lambda xx,yy:on_face(shead,xx,yy,deform=sleep_shape)
    eye_stroke('Sleeper peacefully folded eye',h,[face(x-.030,y+.009),face(x-.016,y-.002),face(x+.001,y-.006),face(x+.026,y+.002)],radius=.0031)
    tube('Sleeper heavy upper eyelid',[face(x-.031,y+.016),face(x,y+.006),face(x+.027,y+.01)],h,radius=.005,tint=(.63,.67,.48),sides=7,steps=8)
    tube('Sleeper low cheek fold',[face(x-.032,1.149),face(x,1.138),face(x+.026,1.148)],h,radius=.0021,tint=(.52,.56,.39),sides=5,steps=8)
loft('Sleeper tiny soft nose',[(1.15,-.026,.263,.018,.013),(1.17,-.026,.269,.024,.018),(1.20,-.025,.256,.014,.012)],h,tint=(.72,.76,.57),rings=6,sides=14)
eye_stroke('Sleeper relaxed mouth',h,[on_face(shead,x,y,deform=sleep_shape) for x,y in [(-.056,1.102),(-.026,1.096),(.001,1.100)]],tint=(.31,.34,.23),radius=.0018)
def hatbrim(u,v):
    a=u*math.tau;r=lerp(.102,.203,v)
    return -.023+r*math.cos(a),1.353+.025*math.cos(a)+.012*math.sin(a*3)*v,.025+r*.72*math.sin(a)
sheet('Sleeper soft little hat brim',hatbrim,h,tile='bag',tint=(.42,.36,.26),nx=30,ny=3,thickness=.010)
loft('Sleeper crumpled little hat crown',[(1.355,-.026,.02,.13,.09),(1.395,-.038,.012,.116,.083),(1.46,-.062,.008,.089,.067),(1.472,-.078,.008,.060,.051)],h,tile='bag',tint=(.55,.48,.36),rings=10,sides=26,deform=folds)
tube('Sleeper faded hat ribbon',[(-.026+.131*math.cos(i/32*math.tau),1.378+.023*math.cos(i/32*math.tau),.020+.092*math.sin(i/32*math.tau)) for i in range(33)],h,radius=.009,tile='cloth',tint=(.61,.63,.56),sides=6,steps=32)

a='SleeperAction'
loft('Sleeper wide lap satchel',[(.58,0,.295,.18,.071),(.615,0,.30,.198,.081),(.73,-.005,.30,.193,.079),(.79,-.008,.289,.168,.067)],a,tile='bag',tint=(.52,.46,.36),rings=12,sides=24)
sheet('Sleeper curved satchel flap',lambda u,v:(lerp(-.178,.173,u),.80-v*.105-.012*math.sin(u*math.pi),.297+.083*math.sin(v*math.pi/2)),a,tile='bag',tint=(.66,.58,.44),nx=12,ny=5)
for s in [-1,1]:
    tube('Sleeper satchel buckle strap',[(s*.105,.79,.366),(s*.105,.67,.388)],a,radius=.009,tile='bag',tint=(.32,.27,.19),sides=6,steps=5,ellipse=.35)
    tube('Sleeper satchel buckle',[(s*.105-.013,.696,.393),(s*.105-.013,.722,.393),(s*.105+.013,.722,.393),(s*.105+.013,.696,.393),(s*.105-.013,.696,.393)],a,radius=.0025,tint=(.50,.39,.18),sides=5,steps=12)
hand('Sleeper resting left hand',a,(-.18,.77,.35),(-.080,.795,.371),side=1,tint=(.78,.82,.62),curl=.006)
hand('Sleeper resting right hand',a,(.18,.77,.35),(.031,.815,.382),side=-1,tint=(.82,.84,.66),curl=.006)

# THE MOTH: a small cocoon with folded patterned wings, perched tucked feet.
g='MothBody';moss=(.29,.33,.21)
loft('Moth small pear shaped wool body',[(.452,0,.015,.173,.125),(.53,0,.025,.196,.133),(.71,0,.035,.181,.12),(.89,0,.018,.149,.10),(1.015,0,.018,.079,.062)],g,tint=(.63,.63,.45),rings=16,sides=26,deform=folds)
lap('Moth short gathered underskirt',g,width=.18,end=.38,tint=(.54,.55,.37),rise=.74)
def wing(s,u,v):
    # Outer wing has a shoulder, angular folded elbow, scalloped lower tip.
    y,inner,outer,z=sample([(1.005,.018,.09,.06),(.94,.035,.215,.11),(.77,.022,.276,.20),(.55,.016,.258,.34),(.39,.020,.19,.365)],v)
    x=s*lerp(inner,outer,u)
    y+=.014*math.sin(u*math.pi*5)*v**3
    z+=.026*math.sin(u*math.pi)+.010*math.sin(u*math.pi*6+v*2)*v
    return x,y,z
for s in [-1,1]:
    sheet('Moth folded wing cloak '+str(s),lambda u,v,s=s:wing(s,u,v),g,tint=(.37,.39,.25),nx=14,ny=16,thickness=.009)
    tube('Moth cloak scalloped edge',[wing(s,1,i/24) for i in range(25)],g,radius=.005,tint=(.66,.64,.41),sides=6,steps=24)
    for f in [.27,.55,.80]:
        tube('Moth stitched wing vein',[wing(s,f,i/18) for i in range(19)],g,radius=.003,tint=(.68,.65,.43),sides=5,steps=18)
    # Nested almond-shaped woven eyespots follow the wing surface.
    for factor,color,r in [(1,(.20,.24,.16),.010),(.63,(.82,.73,.45),.007),(.29,(.26,.30,.20),.006)]:
        pts=[]
        for i in range(33):
            ang=i/32*math.tau;u=.65+factor*.19*math.cos(ang);v=.59+factor*.075*math.sin(ang)
            x,y,z=wing(s,u,v);pts.append((x,y,z+.009))
        tube('Moth woven wing eyespot',pts,g,radius=r,tint=color,sides=6,steps=28)
    tube('Moth cloak lower embroidered band',[tuple(list(wing(s,i/24,.84))[:2]+[wing(s,i/24,.84)[2]+.007]) for i in range(25)],g,radius=.005,tint=(.72,.67,.42),sides=5,steps=24)
    sleeve('Moth tucked sleeve '+str(s),g,[(s*.11,.90,.03,.048),(s*.17,.80,.10,.062),(s*.12,.72,.21,.048),(s*.069,.735,.27,.035)],(.63,.63,.45),size=.8)
    tube('Moth tucked wool stocking',[(s*.10,.45,.24,.039),(s*.11,.36,.35,.035),(s*.105,.29,.385,.032)],'MothStatic',tint=(.61,.61,.42),sides=16,steps=10,folds=.09)
    shoe('Moth small '+str(s),'MothStatic',s*.10,cy=.264,back=.335,front=.51,tint=(.44,.43,.31),turn=s*.012,scale=.65)

h='MothHead'
loft('Moth heart shaped ivory hood',[(.951,0,.105,.023,.033),(.995,0,.092,.096,.074),(1.09,0,.054,.142,.099),(1.21,0,.023,.134,.10),(1.285,.004,.007,.083,.071),(1.31,.008,.002,.023,.026)],h,tint=(.88,.90,.74),rings=20,sides=30,deform=lambda t,a,x,y,z:(x,y+.015*math.cos(a*2)*math.sin(math.pi*t),z+.004*math.sin(a*9)*math.sin(math.pi*t)))
loft('Moth recessed ivory facial shield',[(.997,0,.166,.015,.012),(1.036,0,.166,.060,.029),(1.117,0,.14,.085,.038),(1.195,0,.115,.073,.031),(1.232,0,.098,.035,.021)],h,tint=(1.03,1.02,.86),rings=14,sides=24)
for s in [-1,1]:
    loft('Moth little dark eye',[(1.077,s*.037,.185,.006,.004),(1.085,s*.038,.188,.009,.006),(1.105,s*.039,.183,.008,.005),(1.111,s*.039,.180,.003,.003)],h,tint=(.026,.035,.029),rings=6,sides=12)
    tube('Moth antenna stem',[(s*.055,1.265,.01,.006),(s*.094,1.37,.012,.005),(s*.151,1.46,.025,.0035),(s*.18,1.49,.04,.0015)],h,tint=(.41,.46,.30),sides=7,steps=14)
    for k in range(7):
        t=.15+k*.105;x=s*(.058+.115*t);y=1.29+.205*t;z=.014+.018*t
        for f in [-1,1]:
            tube('Moth feathery antenna branch',[(x,y,z,.0027),(x+s*f*(.019*(1-.5*t)),y+.017,z+.005,.0018),(x+s*f*(.027*(1-.5*t)),y+.024,z+.007,.0007)],h,tint=(.57,.60,.40),sides=5,steps=4)
eye_stroke('Moth tiny mouth',h,[(-.009,1.035,.197),(0,1.032,.199),(.009,1.035,.197)],tint=(.30,.35,.24),radius=.0013)
hand('Moth little left hand','MothAction',(-.071,.735,.265),(-.043,.738,.294),side=1,scale=.64,tint=(.94,.96,.77),curl=.004)
hand('Moth little right hand','MothAction',(.071,.735,.265),(.033,.744,.300),side=-1,scale=.64,tint=(.94,.96,.77),curl=.004)

# THE GARDENER: long folded ears, sage smock, a terracotta cutting on the lap.
g='GardenerBody';sage=(.29,.40,.29)
loft('Gardener narrow work smock',[(.45,0,-.015,.205,.14),(.55,-.005,.005,.224,.144),(.76,-.008,-.01,.178,.13),(.98,-.006,-.018,.177,.115),(1.12,-.003,.005,.191,.11),(1.20,0,.027,.078,.063)],g,tint=sage,rings=18,sides=28,deform=folds)
glap=lap('Gardener apron',g,width=.235,end=.24,tint=sage,rise=.80)
sheet('Gardener apron bib',lambda u,v:(lerp(-.118,.118,u)*(1-.12*v),lerp(.73,1.13,v),.15+.015*math.sin(u*math.pi)-.025*v),g,tint=(.36,.46,.32),nx=8,ny=10)
for s in [-1,1]:
    sleeve('Gardener '+str(s),g,[(s*.135,1.10,.0,.058),(s*.21,1.035,.038,.08),(s*.253,.89,.14,.078),(s*.23,.80,.25,.067),(s*.141,.83,.35,.047)],sage)
    tube('Gardener apron strap',[(s*.11,.80,.172),(s*.105,1.09,.14),(s*.115,1.16,.075),(s*.135,1.12,-.034)],g,radius=.011,tint=(.22,.31,.21),sides=6,steps=13,ellipse=.28)
    tube('Gardener apron side stitch',[glap(.12 if s<0 else .88,i/16) for i in range(17)],g,radius=.0026,tint=(.55,.59,.39),sides=5,steps=20)
    tube('Gardener trouser bent shin',[(s*.12,.12,.35,.043),(s*.12,.31,.34,.049),(s*.14,.49,.31,.061)],'GardenerStatic',tile='cloth',tint=(.63,.73,.66),sides=18,steps=10,folds=.12)
    shoe('Gardener '+str(s),'GardenerStatic',s*.12,cy=.06,front=.60,turn=s*.008,tint=(.35,.32,.24),scale=.93)
sheet('Gardener useful sewn apron pocket',lambda u,v:(lerp(-.09,.09,u),lerp(.68,.81,v)-.012*math.sin(u*math.pi),.274-.047*v+.016*math.sin(u*math.pi)*math.sin(v*math.pi)),g,tint=(.25,.35,.24),nx=8,ny=5)
tube('Gardener pocket hem',[(-.09,.81,.228),(0,.797,.245),(.09,.81,.228)],g,radius=.003,tint=(.52,.57,.37),sides=5,steps=12)

h='GardenerHead'
tube('Gardener curved neck nested in collar',[(0,1.195,.038,.032),(.002,1.235,.051,.033),(.009,1.28,.086,.030),(.009,1.315,.111,.025)],h,sides=20,steps=12,ellipse=.88,tint=(.86,.92,.76))
def gardener_collar(u,v):
    a=u*math.tau;r=lerp(.075,.057,v)
    return r*math.cos(a),lerp(1.155,1.248,v)-.023*max(0,math.sin(a))*v+.004*math.cos(a*3),.035+r*.77*math.sin(a)
sheet('Gardener soft standing collar',gardener_collar,'GardenerBody',tint=(.25,.35,.24),nx=26,ny=5,thickness=.007)
tube('Gardener collar turned edge',[gardener_collar(i/32,1) for i in range(33)],'GardenerBody',radius=.0035,tint=(.42,.50,.33),sides=5,steps=32)
loft('Gardener gentle asymmetric face',[(1.235,.012,.17,.018,.023),(1.28,.004,.154,.064,.064),(1.36,-.006,.105,.106,.092),(1.455,-.004,.06,.102,.086),(1.52,.013,.031,.066,.063),(1.538,.022,.022,.027,.029)],h,tint=(.96,1.01,.86),rings=21,sides=30,deform=lambda t,a,x,y,z:(x+.004*math.sin(a*3+t*4),y+.006*math.cos(a),z+.003*math.sin(a*7)))
for s in [-1,1]:
    # Flattened folded leaves, not cylindrical animal-ear primitives.
    controls=[(s*.065,1.46,.008,.033),(s*.102,1.55,-.012,.036),(s*.126,1.66,-.025,.026),(s*.119,1.75,-.006,.008),(s*.10,1.767,.016,.0015)] if s<0 else [(s*.067,1.46,.009,.032),(s*.108,1.54,-.005,.034),(s*.163,1.635,.010,.027),(s*.181,1.70,.045,.009),(s*.169,1.72,.064,.0015)]
    tube('Gardener long folded ear',controls,h,tint=(.87,.95,.75),sides=16,steps=14,ellipse=.31)
    inner=[(x,y,z+.010,r*.44) for x,y,z,r in controls]
    tube('Gardener warm inner ear',inner,h,tint=(.62,.68,.47),sides=8,steps=12,ellipse=.16)
    x=s*.045-.005;y=1.354+s*.005
    eye_stroke('Gardener attentive eye',h,[(x-.012,y,.190),(x,y+.002,.196),(x+.013,y+.003,.190)],radius=.0027)
    tube('Gardener lifted brow',[(x-.015,y+.028,.181),(x,y+.031,.187),(x+.015,y+.027,.180)],h,radius=.0023,tint=(.55,.62,.45),sides=5,steps=7)
eye_stroke('Gardener small content mouth',h,[(-.012,1.277,.217),(.002,1.275,.22),(.014,1.280,.214)],tint=(.31,.37,.26),radius=.0016)

a='GardenerAction'
loft('Gardener terracotta pot',[(.655,0,.368,.063,.060),(.675,0,.368,.067,.064),(.80,0,.368,.092,.087),(.818,0,.368,.094,.089)],a,tint=(.59,.255,.125),rings=10,sides=28,cap=False)
tube('Gardener rolled pottery rim',[(.094*math.cos(i/32*math.tau),.814,.368+.089*math.sin(i/32*math.tau)) for i in range(33)],a,radius=.009,tint=(.73,.34,.17),sides=7,steps=32)
loft('Gardener pot soil',[(.801,0,.368,.087,.082),(.806,0,.368,.087,.082)],a,tile='bag',tint=(.17,.17,.12),rings=1,sides=24)
for i,(dx,dy,dz,w) in enumerate([(-.13,.21,-.018,.041),(.095,.28,-.052,.044),(.13,.16,.052,.048),(-.06,.32,.035,.040),(.02,.23,.095,.040)]):
    start=(0,.81,.368);end=(dx,.81+dy,.368+dz)
    tube('Gardener cutting curved stem '+str(i),[start,(dx*.25,.81+dy*.55,.368+dz*.3),end],a,radius=.003,tint=(.17,.29,.14),sides=6,steps=8)
    def leaf(u,v,dx=dx,dy=dy,dz=dz,w=w):
        t=.38+.62*v;half=w*math.sin(math.pi*v)**.7
        return dx*t+(u*2-1)*half,.81+dy*t+.018*math.sin(math.pi*v)*(1-abs(2*u-1)),.368+dz*t+.025*math.sin(math.pi*v)-.018*abs(2*u-1)
    sheet('Gardener sculpted pointed leaf '+str(i),leaf,a,tint=(.20+.035*(i%2),.36+.035*(i%3),.17),nx=4,ny=9,thickness=.0025)
    tube('Gardener leaf central vein',[leaf(.5,j/10) for j in range(11)],a,radius=.0015,tint=(.44,.53,.25),sides=5,steps=10)
hand('Gardener left supporting hand',a,(-.14,.83,.35),(-.102,.768,.404),side=1,scale=.88,tint=(.90,.97,.78),curl=.016)
hand('Gardener right supporting hand',a,(.14,.83,.35),(.089,.766,.412),side=-1,scale=.88,tint=(.90,.97,.78),curl=.016)

# THE KEEPER: narrow umber hood and cupped hands guarding a little sea shell.
g='KeeperBody';rust=(.40,.205,.115)
loft('Keeper long narrow robe',[(.45,.0,-.006,.179,.139),(.55,-.008,.01,.192,.144),(.76,-.014,-.014,.160,.13),(.99,-.009,-.02,.163,.122),(1.14,0,-.005,.176,.109),(1.21,.005,.025,.098,.074)],g,tint=rust,rings=18,sides=28,deform=folds)
klap=lap('Keeper',g,width=.215,end=.095,tint=rust,rise=.80)
sheet('Keeper overlapping robe stole',lambda u,v:(lerp(-.10,.025,u)+.014*math.sin(v*math.pi),lerp(.28,1.19,v),lerp(.424,.13,v)+.013*math.sin(u*math.pi)+.008*math.sin(v*14)),g,tint=(.30,.135,.075),nx=6,ny=18)
for s in [-1,1]:
    sleeve('Keeper '+str(s),g,[(s*.12,1.105,.0,.058),(s*.19,1.035,.02,.079),(s*.244,.88,.11,.087),(s*.209,.774,.24,.076),(s*.118,.823,.355,.046)],rust)
    tube('Keeper sleeve falling fold',[(s*.20,.98,.075),(s*.25,.83,.15),(s*.19,.772,.28)],g,radius=.0045,tint=(.56,.29,.16),sides=5,steps=12)
    tube('Keeper bent boot upper',[(s*.115,.075,.34,.046),(s*.127,.19,.32,.045),(s*.131,.29,.285,.039)],'KeeperStatic',tile='bag',tint=(.35,.29,.20),sides=18,steps=10,folds=.08)
    shoe('Keeper pointed '+str(s),'KeeperStatic',s*.115,cy=.052,back=.27,front=.615,turn=s*.021,tint=(.31,.26,.19),scale=.87)
    tube('Keeper boot top binding',[(s*.131+.040*math.cos(i/20*math.tau),.275,.289+.036*math.sin(i/20*math.tau)) for i in range(21)],'KeeperStatic',radius=.004,tile='bag',tint=(.52,.43,.29),sides=5,steps=20)

h='KeeperHead'
loft('Keeper shadowed oval face',[(1.115,-.004,.12,.014,.021),(1.16,-.007,.12,.058,.047),(1.26,-.010,.102,.077,.051),(1.36,-.009,.075,.067,.048),(1.402,-.006,.055,.028,.024)],h,tile='skin',tint=(.037,.048,.043),rings=18,sides=26)
# A deeply folded hood is a closed ring sheet with a wide back and narrow opening.
def hood(u,v):
    a=u*math.tau
    # Around opening: top is tapered and off centre, chin hangs toward chest.
    xo=.103*math.cos(a)-.008;yo=1.263+.173*math.sin(a);zo=.153-.020*math.sin(a)
    xb=.148*math.cos(a)+.014;yb=1.285+.226*math.sin(a);zb=-.077+.028*math.sin(a)
    x=lerp(xo,xb,math.sin(v*math.pi/2));y=lerp(yo,yb,math.sin(v*math.pi/2));z=lerp(zo,zb,v)
    z+=.011*math.sin(a*9+v*5)*math.sin(v*math.pi)
    y+=.010*math.cos(a*3+v*2)*math.sin(v*math.pi)
    return x,y,z
sheet('Keeper deep cowl hood with opening',hood,h,tint=(.37,.17,.094),nx=32,ny=10,thickness=.008)
loft('Keeper hood closed back',[(1.075,.014,-.075,.035,.037),(1.15,.015,-.068,.125,.052),(1.30,.014,-.068,.148,.060),(1.45,.014,-.057,.108,.052),(1.514,.014,-.047,.025,.022)],h,tint=(.32,.147,.080),rings=14,sides=24,deform=folds)
tube('Keeper rolled hood opening',[hood(i/40,0) for i in range(41)],h,radius=.008,tint=(.56,.285,.15),sides=7,steps=40)
for s in [-1,1]:
    x=s*.029-.009
    loft('Keeper pale quiet eye',[(1.242,x,.155,.003,.002),(1.247,x,.158,.0055,.0035),(1.260,x,.157,.005,.003),(1.264,x,.153,.002,.002)],h,tint=(1.08,1.13,.93),rings=5,sides=10)
    tube('Keeper cowl shoulder fold',[(s*.084,1.15,.144),(s*.13,1.12,.07),(s*.151,1.17,-.02)],h,radius=.006,tint=(.49,.23,.12),sides=6,steps=10)

a='KeeperAction'
hand('Keeper cupped left hand',a,(-.118,.823,.355),(-.055,.820,.402),side=1,scale=.92,tint=(.61,.69,.56),curl=.012)
hand('Keeper cupped right hand',a,(.118,.823,.355),(.045,.821,.412),side=-1,scale=.92,tint=(.63,.70,.58),curl=.012)
# A small ribbed spiral shell is recognisable in silhouette without emissive light.
loft('Keeper little sea shell',[(.847,.002,.431,.012,.018),(.859,.002,.436,.037,.033),(.883,-.003,.433,.033,.030),(.908,-.011,.424,.018,.019),(.921,-.014,.415,.003,.005)],a,tint=(.82,.91,.80),rings=11,sides=22,deform=lambda t,a,x,y,z:(x+.002*math.cos(a*10),y,z+.002*math.sin(a*10)))
for k in range(7):
    angle=k/7*math.pi
    tube('Keeper shell radiating rib',[(.002+.032*math.cos(angle),.859,.436+.030*math.sin(angle)),(-.003+.027*math.cos(angle),.884,.433+.025*math.sin(angle)),(-.012,.917,.419)],a,radius=.0016,tint=(.46,.63,.55),sides=5,steps=7)

# Bind identity-axis pose nodes after construction, with world pivots baked into
# vertex positions. glTF Y-up conversion preserves identity rest rotations.
pose={}
for name,pivot in pivots.items():
    obj=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(obj)
    parent=parents.get(name);origin=pivots[parent] if parent else (0,0,0)
    if parent:obj.parent=pose[parent]
    obj.location=P(tuple(pivot[i]-origin[i] for i in range(3)))
    obj.empty_display_type='PLAIN_AXES';obj.empty_display_size=.04
    obj['runtime_pivot_m']=pivot;pose[name]=obj
for group,objects in groups.items():
    offset=Vector(P(pivots[group]))
    for obj in objects:
        for vert in obj.data.vertices:vert.co-=offset
        obj.parent=pose[group];obj.location=(0,0,0)
for n in names:
    pose[n]['application_axes']='Y up, +Z facing; source Blender Z up'
    pose[n]['seat_cushion_height_m']=.45
    pose[n]['original_asset']='Original custom mesh sculpture; no downloaded or extracted geometry'
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
tex.image.pack();bpy.context.view_layer.update()
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'passengers.blend'))

exported=[];by_character={n:[] for n in names}
for group,objects in groups.items():
    assert objects,group
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:bpy.ops.object.join()
    obj=bpy.context.object;obj.name=group+'Mesh';exported.append(obj)
    by_character[next(n for n in names if group.startswith(n))].append(obj)
bpy.context.view_layer.update()

def measure(objects):
    points=[unP(obj.matrix_world@v.co) for obj in objects for v in obj.data.vertices]
    minimum=[min(p[i] for p in points) for i in range(3)];maximum=[max(p[i] for p in points) for i in range(3)]
    return {'bounds_m':{'min':minimum,'max':maximum,'size':[maximum[i]-minimum[i] for i in range(3)]},'mesh_count':len(objects),'primitives':len(objects),'triangles':sum(sum(len(p.vertices)-2 for p in obj.data.polygons) for obj in objects)}

characters={n:measure(objects) for n,objects in by_character.items()}
for n,m in characters.items():
    lo=m['bounds_m']['min'];hi=m['bounds_m']['max']
    assert lo[0]>=-.55 and hi[0]<=.55,(n,lo,hi)
    assert lo[1]>=.01 and hi[1]<=1.78,(n,lo,hi)
    assert lo[2]>=-.22 and hi[2]<=.68,(n,lo,hi)
summary=measure(exported)
assert summary['triangles']<=60000,summary
assert len(exported)<=24
bpy.ops.object.select_all(action='DESELECT')
for obj in exported+list(pose.values()):obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(PUBLIC/'passengers.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_animations=False,export_vertex_color='ACTIVE',export_all_vertex_colors=False,export_extras=True,export_cameras=False,export_lights=False)
size=(PUBLIC/'passengers.glb').stat().st_size
assert size<8*1024*1024,size
metadata={'name':'The Quiet Line — four original seated spirit passengers','generator':'scripts/build-passengers.py','blender':bpy.app.version_string,'coordinates':{'up':'Y','forward':'+Z','origin':'floor','seat_cushion_height_m':.45},**summary,'characters':characters,'materials':1,'glb_bytes':size,'source_blend_bytes':(OUT/'passengers.blend').stat().st_size,'texture_dimensions':list(tex.image.size),'atlas':'public/assets/spirits/reader-material-atlas.png','atlas_regions_blender_uv':TILES,'nodes':{name:{'parent':parents.get(name),'world_pivot_m':list(pivot),'local_position_m':[pivot[i]-(pivots[parents[name]][i] if name in parents else 0) for i in range(3)],'local_rotation_quaternion_xyzw':[0,0,0,1]} for name,pivot in pivots.items()},'notes':['Original editable custom mesh sculpture; each source part is named and retained.','Each root starts at the origin; runtime places four separate passengers.','One unchanged shared atlas with per-vertex mineral pigment washes.','Export joins only by pose group: static, body, head, and hands plus held object.','Moth feet deliberately hang above the floor; all four hips sit on the .45 m cushion.','No animation, camera, light, or secondary material exported.','Construction counts are not measured device performance.']}
(OUT/'passengers-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
print('PASSENGER_STATS '+json.dumps(metadata))
