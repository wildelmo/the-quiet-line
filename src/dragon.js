import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { dragonFrame } from './dragon-flight.js';
export { dragonSpine } from './dragon-flight.js';

const RINGS=144, SIDES=16, LENGTH=58;

function plume(points, radius, sides=7) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const segments=points.length*4;
  const geometry=new THREE.TubeGeometry(curve,segments,radius,sides,false);
  const position=geometry.attributes.position,center=new THREE.Vector3(),v=new THREE.Vector3();
  for(let i=0;i<=segments;i++) {
    curve.getPointAt(i/segments,center);
    const taper=Math.max(.015,Math.pow(1-i/segments,.72));
    for(let j=0;j<=sides;j++) {
      const k=i*(sides+1)+j;v.fromBufferAttribute(position,k).sub(center).multiplyScalar(taper).add(center);
      position.setXYZ(k,v.x,v.y,v.z);
    }
  }
  geometry.computeVertexNormals();return geometry;
}

// Broad, slightly cupped locks catch light like painted fur. A closed surface
// keeps the mane readable from either eye and when the dragon rolls upside down.
function furLock(length,width,rise,sweep=0) {
  const positions=[],indices=[],steps=12,sides=8;
  for(let i=0;i<=steps;i++){
    const t=i/steps;
    const w=Math.max(.004,width*(.24+.92*Math.sin(Math.PI*t))*(1-t)**.4);
    for(let j=0;j<=sides;j++){
      const a=j/sides*Math.PI*2;
      positions.push(sweep*t*t+Math.cos(a)*w,
        rise*Math.sin(t*Math.PI*.82)+Math.sin(a)*w*.27,-length*t);
      if(i<steps&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

// The head and feet are merged by pigment; the mane is instanced. No images,
// transparent fur cards, shadows, or new render passes are needed in stereo.
export function createDragon(scene,{reducedMotion=false}={}) {
  const root=new THREE.Group();root.name='Cloud dancer';scene.add(root);
  const pigment=color=>new THREE.MeshStandardMaterial({color,roughness:1,emissive:color,emissiveIntensity:.2});
  const pearl=pigment('#edf5f0'),jade=pigment('#51a99b'),deep=pigment('#35796f');
  const horn=pigment('#c5ba91'),green=pigment('#84af65'),black=pigment('#203a42');
  const earPink=pigment('#cbb7c9'),highlight=pigment('#f8faf1');
  function sculpt(parent,build) {
    const batches=new Map();
    const add=(geo,mat,p=[0,0,0],scale=[1,1,1],rotation=[0,0,0])=>{
      const g=geo.index?geo.toNonIndexed():geo;if(g!==geo)geo.dispose();
      g.deleteAttribute('uv');
      g.scale(...scale);g.rotateX(rotation[0]);g.rotateY(rotation[1]);g.rotateZ(rotation[2]);g.translate(...p);
      if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(g);
    };
    const oval=(p,scale,mat)=>add(new THREE.SphereGeometry(1,16,10),mat,p,scale);
    build(add,oval);
    for(const [mat,geos] of batches){parent.add(new THREE.Mesh(mergeGeometries(geos),mat));geos.forEach(g=>g.dispose());}
  }
  const head=new THREE.Group();root.add(head);
  sculpt(head,(add,oval)=>{
    oval([0,.12,.12],[1.05,1.02,1.65],pearl);
    oval([0,.05,1.55],[.68,.56,1.45],pearl);
    oval([0,-.24,2.55],[.49,.36,1.00],pearl);
    oval([0,-.52,2.2],[.43,.14,1.17],deep);
    oval([0,-.64,2.15],[.47,.21,1.13],pearl);
    oval([0,-.21,3.42],[.28,.20,.17],earPink);
    for(const side of [-1,1]) {
      oval([side*.27,-.07,3.24],[.065,.045,.09],deep);
      // Almond eyes, a green iris and a small unlit catchlight.
      oval([side*.91,.32,.92],[.10,.22,.43],black);
      oval([side*.985,.34,.94],[.07,.17,.35],highlight);
      oval([side*1.04,.34,1.02],[.045,.155,.18],green);
      oval([side*1.073,.34,1.06],[.024,.12,.058],black);
      oval([side*1.093,.40,1.12],[.014,.038,.043],highlight);
      add(plume([[side*.77,.61,1.42],[side*1.02,.63,.86],[side*1.17,.72,.25]],.12),pearl);
      // Tall tapered ears soften the old antler-and-comb silhouette.
      const ear=furLock(1.28,.48,1.55,side*.18);ear.rotateX(-.35);ear.rotateZ(-side*.35);
      add(ear,pearl,[side*.83,.69,-.35]);
      const inner=furLock(.97,.28,1.27,side*.12);inner.rotateX(-.35);inner.rotateZ(-side*.35);
      add(inner,earPink,[side*.83,.73,-.23]);
      // Swept antlers, with a branching tine and warm ivory tips.
      add(plume([[side*.56,.94,-.5],[side*.72,2.05,-.85],[side*.95,3.25,-1.65],[side*1.13,3.7,-2.1]],.19),horn);
      add(plume([[side*.79,2.5,-1.12],[side*1.12,2.86,-1.26],[side*1.27,3.15,-1.65]],.09),horn);
      // Layered locks sweep backward from cheeks and neck.
      for(let i=0;i<6;i++) {
        add(furLock(3.2+(i%3)*.4,.57,.65,side*.85),i%3===0?deep:jade,
          [side*.64,.62-i*.27,-.65-i*.04],[1,1,1],[0,side*.24,side*(.28+i*.15)]);
      }
      for(let i=0;i<3;i++)add(furLock(1.8+i*.3,.35,.36,side*.24),pearl,
        [side*.78,-.15-i*.23,.06],[1,1,1],[0,side*.35,side*.5]);
    }
    add(furLock(2.9,.58,-.55),pearl,[0,-.66,.6]);
    for(let i=0;i<5;i++)add(furLock(3.4+Math.cos(i)*.3,.52,1.05,(i-2)*.16),i%2?jade:deep,[(i-2)*.3,.82,-.38]);
  });
  head.scale.setScalar(1.18);
  const whiskers=[];
  for(const side of [-1,1]) {
    const mesh=new THREE.Mesh(plume([[side*.47,-.18,2.65],[side*2.2,-.12,2.4],[side*3.6,.45,1.2],[side*4.7,1.15,-1.6],[side*4.3,.9,-4.7],[side*3.6,.4,-6.8]],.065,6),highlight);
    head.add(mesh);whiskers.push(mesh);
  }

  const positions=new Float32Array((RINGS+1)*(SIDES+1)*3),normals=new Float32Array(positions.length),colors=new Float32Array(positions.length),indices=[];
  const belly=new THREE.Color('#d6e3df'),back=new THREE.Color('#e3f3ed'),flank=new THREE.Color('#f3f6ea'),tint=new THREE.Color();
  for(let i=0;i<=RINGS;i++)for(let j=0;j<=SIDES;j++) {
    const a=j/SIDES*Math.PI*2,y=Math.sin(a),k=(i*(SIDES+1)+j)*3;
    tint.copy(y<-.3?belly:flank).lerp(back,Math.max(0,y)*.72);
    // Quiet belly plates and broad pigment shifts, without a noisy scale texture.
    const plate=y<-.45?.04*(.5+.5*Math.cos(i*Math.PI*.75)):0;
    tint.multiplyScalar(1-plate-.014*Math.cos(i*.43+j*.7));tint.toArray(colors,k);
    if(i<RINGS&&j<SIDES){const n=i*(SIDES+1)+j;indices.push(n,n+SIDES+1,n+1,n+1,n+SIDES+1,n+SIDES+2);}
  }
  const bodyGeo=new THREE.BufferGeometry();bodyGeo.setIndex(indices);
  bodyGeo.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  bodyGeo.setAttribute('normal',new THREE.BufferAttribute(normals,3).setUsage(THREE.DynamicDrawUsage));
  bodyGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const body=new THREE.Mesh(bodyGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,emissive:'#d4e9e1',emissiveIntensity:.16}));body.frustumCulled=false;root.add(body);

  const maneCount=64;
  const lockA=furLock(3.15,.62,1.05,.18);
  const lockB=furLock(2.65,.42,.62,-.35);lockB.rotateZ(.45);lockB.translate(-.2,-.05,.15);
  const maneGeo=mergeGeometries([lockA,lockB]);lockA.dispose();lockB.dispose();
  const mane=new THREE.InstancedMesh(maneGeo,jade,maneCount);
  for(let i=0;i<maneCount;i++)mane.setColorAt(i,new THREE.Color().setRGB(.88+(i%3)*.055,.96, .94+(i%2)*.04));
  mane.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mane.frustumCulled=false;root.add(mane);
  const feet=[];
  for(const along of [10,29])for(const side of [-1,1]) {
    const foot=new THREE.Group();
    sculpt(foot,(add,oval)=>{
      add(plume([[0,0,0],[side*1.1,-.6,-.3],[side*1.7,-1.7,.4],[side*2,-2,1.5]],.39),pearl);
      oval([side*2,-2,1.45],[.52,.24,.58],pearl);
      for(let toe=0;toe<3;toe++) {
        const x=side*2+(toe-1)*.33;
        add(plume([[x,-2,1.5],[x,-2.1,2],[x,-2.28,2.27]],.14),horn);
      }
    });
    root.add(foot);feet.push({foot,along,side});
  }
  const tail=new THREE.Group();root.add(tail);
  sculpt(tail,add=>{
    for(let i=0;i<7;i++) {
      const a=(i-3)*.4;
      add(plume([[0,0,0],[Math.sin(a)*.8,Math.cos(a)*.6,-1.2],[Math.sin(a)*1.4,Math.cos(a)*.8,-3],[Math.sin(a)*1.1,.4,-5]],.35),i%2?pearl:jade);
    }
  });

  const p=new THREE.Vector3(),forward=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),basis=new THREE.Matrix4(),dummy=new THREE.Object3D();
  const radius=along=>1.16*Math.pow(Math.max(.001,1-along/LENGTH),.62)*(.92+.18*Math.sin(along/LENGTH*Math.PI));
  function frame(t,along) {
    dragonFrame(t,along,p,right,up,forward);
    basis.makeBasis(right,up,forward);
  }
  function update(time,viewer,dt=.016) {
    // Follow the journey's region, never the gaze. Teleports do not snap the dragon.
    root.position.z+=(viewer.z-root.position.z)*(1-Math.exp(-Math.min(dt,.05)*.22));
    const t=reducedMotion?0:time;
    for(let i=0;i<=RINGS;i++) {
      const along=i/RINGS*LENGTH;frame(t,along);const r=radius(along);
      for(let j=0;j<=SIDES;j++) {
        const a=j/SIDES*Math.PI*2,c=Math.cos(a),s=Math.sin(a),k=(i*(SIDES+1)+j)*3;
        const nx=right.x*c+up.x*s,ny=right.y*c+up.y*s,nz=right.z*c+up.z*s;
        positions[k]=p.x+r*nx;positions[k+1]=p.y+r*ny;positions[k+2]=p.z+r*nz;
        normals[k]=nx;normals[k+1]=ny;normals[k+2]=nz;
      }
    }
    bodyGeo.attributes.position.needsUpdate=true;bodyGeo.attributes.normal.needsUpdate=true;
    frame(t,0);head.position.copy(p);head.quaternion.setFromRotationMatrix(basis);
    whiskers.forEach((mesh,i)=>{mesh.rotation.z=reducedMotion?0:Math.sin(t*1.05+i)*.12;mesh.rotation.y=reducedMotion?0:Math.sin(t*.65+i)*.055;});
    for(let i=0;i<maneCount;i++) {
      const along=2+i/(maneCount-1)*(LENGTH-3);frame(t,along);
      dummy.position.copy(p).addScaledVector(up,radius(along)*.9);dummy.quaternion.setFromRotationMatrix(basis);
      dummy.rotateZ(reducedMotion?0:Math.sin(t*1.5-i*.36)*.20);
      const s=(.45+.65*Math.pow(1-along/LENGTH,.5))*(1+.12*Math.sin(i*2.4));dummy.scale.set(s,s,s);dummy.updateMatrix();mane.setMatrixAt(i,dummy.matrix);
    }
    mane.instanceMatrix.needsUpdate=true;
    feet.forEach(({foot,along,side})=>{frame(t,along);foot.position.copy(p);foot.quaternion.setFromRotationMatrix(basis);foot.rotateZ(side*(.2+(reducedMotion?0:Math.sin(t*.65-along*.15)*.2)));});
    frame(t,LENGTH);tail.position.copy(p);tail.quaternion.setFromRotationMatrix(basis);
  }
  update(0,new THREE.Vector3(),0);
  return {root,update};
}
