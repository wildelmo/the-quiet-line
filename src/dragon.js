import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const RINGS=112, SIDES=12, LENGTH=58;
const UP=new THREE.Vector3(0,1,0);

// A delayed flight curve makes every part follow the head, with an additional
// traveling ripple through the spine. Coordinates are meters, not screen space.
export function dragonSpine(time, along, out=new THREE.Vector3()) {
  const phase=(time-along/5)*.052+.12;
  const wave=Math.sin(along*.19-time*.72)*Math.sin(Math.PI*along/LENGTH);
  return out.set(94*Math.sin(phase),27+7*Math.sin(phase*2)+wave*3.4,
    -112+57*Math.cos(phase)+wave*2.2);
}

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

// The head and feet are merged by pigment; the mane is instanced. No images,
// transparent fur cards, shadows, or new render passes are needed in stereo.
export function createDragon(scene,{reducedMotion=false}={}) {
  const root=new THREE.Group();root.name='Cloud dancer';scene.add(root);
  const pigment=color=>new THREE.MeshStandardMaterial({color,roughness:1,emissive:color,emissiveIntensity:.13});
  const pearl=pigment('#e9eed7'),jade=pigment('#528f86'),deep=pigment('#244f50');
  const horn=pigment('#d2b788'),gold=pigment('#ddb05a'),black=pigment('#183639');
  function sculpt(parent,build) {
    const batches=new Map();
    const add=(geo,mat,p=[0,0,0],scale=[1,1,1],rotation=[0,0,0])=>{
      const g=geo.index?geo.toNonIndexed():geo;if(g!==geo)geo.dispose();
      g.scale(...scale);g.rotateX(rotation[0]);g.rotateY(rotation[1]);g.rotateZ(rotation[2]);g.translate(...p);
      if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(g);
    };
    const oval=(p,scale,mat)=>add(new THREE.SphereGeometry(1,16,10),mat,p,scale);
    build(add,oval);
    for(const [mat,geos] of batches){parent.add(new THREE.Mesh(mergeGeometries(geos),mat));geos.forEach(g=>g.dispose());}
  }
  const head=new THREE.Group();root.add(head);
  sculpt(head,(add,oval)=>{
    oval([0,.15,.25],[1.14,1.05,1.8],pearl);
    oval([0,-.18,1.85],[.78,.52,1.28],pearl);
    oval([0,-.62,1.7],[.64,.16,1.1],jade);
    oval([0,-.76,1.66],[.68,.21,1.07],pearl);
    oval([0,.02,2.85],[.62,.27,.35],jade);
    for(const side of [-1,1]) {
      oval([side*.4,.18,2.96],[.12,.075,.08],deep);
      oval([side*.95,.38,1.03],[.15,.31,.43],deep);
      oval([side*1.065,.41,1.1],[.075,.22,.28],gold);
      oval([side*1.125,.43,1.15],[.035,.145,.085],black);
      oval([side*1.15,.5,1.2],[.02,.055,.055],pearl);
      add(plume([[side*.72,.78,1.55],[side*1.1,.91,.75],[side*1.45,.95,-.1]],.21),jade);
      // Swept antlers, with a branching tine and warm ivory tips.
      add(plume([[side*.68,.9,-.35],[side*1.05,2.1,-.7],[side*1.45,3.2,-1.55],[side*1.7,3.7,-1.35]],.24),horn);
      add(plume([[side*1.03,2,-.7],[side*1.9,2.55,-.6],[side*2.15,2.8,-.9]],.15),horn);
      add(plume([[side*.85,.5,-.55],[side*1.9,.65,-1.3],[side*2.25,1,-2.1]],.43),jade);
      // Layered locks sweep backward from cheeks and neck.
      for(let i=0;i<5;i++) {
        add(plume([[side*.7,.6-i*.35,-.8],[side*(1.45+i*.08),.7-i*.4,-1.8],[side*(1.1+i*.08),.8-i*.4,-3.5-i*.18]],.34),jade);
      }
    }
    add(plume([[0,-.6,1.1],[0,-1.3,.1],[0,-1.7,-1.7],[0,-1.3,-3]],.43),pearl);
    for(let i=0;i<5;i++)add(plume([[(i-2)*.35,.95,-.4],[(i-2)*.45,1.7,-1.5],[(i-2)*.3,1.3,-3.5]],.32),jade);
  });
  const whiskers=[];
  for(const side of [-1,1]) {
    const mesh=new THREE.Mesh(plume([[side*.55,-.15,2.5],[side*2.2,-.15,2.2],[side*3.5,.45,.8],[side*4.4,1.35,-1.5],[side*5.3,1.1,-3]],.09,6),pearl);
    head.add(mesh);whiskers.push(mesh);
  }

  const positions=new Float32Array((RINGS+1)*(SIDES+1)*3),normals=new Float32Array(positions.length),colors=new Float32Array(positions.length),indices=[];
  const belly=new THREE.Color('#ede6c8'),back=new THREE.Color('#91b7a5'),flank=new THREE.Color('#d5e5ce'),tint=new THREE.Color();
  for(let i=0;i<=RINGS;i++)for(let j=0;j<=SIDES;j++) {
    const a=j/SIDES*Math.PI*2,y=Math.sin(a),k=(i*(SIDES+1)+j)*3;
    tint.copy(y<-.3?belly:flank).lerp(back,Math.max(0,y)*.72);
    tint.multiplyScalar(1-.035*Math.cos(i*.8));tint.toArray(colors,k);
    if(i<RINGS&&j<SIDES){const n=i*(SIDES+1)+j;indices.push(n,n+SIDES+1,n+1,n+1,n+SIDES+1,n+SIDES+2);}
  }
  const bodyGeo=new THREE.BufferGeometry();bodyGeo.setIndex(indices);
  bodyGeo.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  bodyGeo.setAttribute('normal',new THREE.BufferAttribute(normals,3).setUsage(THREE.DynamicDrawUsage));
  bodyGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const body=new THREE.Mesh(bodyGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,emissive:'#99b5a0',emissiveIntensity:.1}));body.frustumCulled=false;root.add(body);

  const maneCount=58;
  const lockA=plume([[0,0,0],[.08,.6,-.35],[.12,.95,-1.3],[0,.35,-2.6]],.28);
  const lockB=plume([[-.12,0,0],[-.3,.35,-.35],[-.35,.55,-1],[-.2,.15,-1.9]],.21);
  const maneGeo=mergeGeometries([lockA,lockB]);lockA.dispose();lockB.dispose();
  const mane=new THREE.InstancedMesh(maneGeo,jade,maneCount);
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

  const p=new THREE.Vector3(),ahead=new THREE.Vector3(),forward=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),basis=new THREE.Matrix4(),dummy=new THREE.Object3D();
  const radius=along=>1.05*Math.pow(Math.max(.001,1-along/LENGTH),.62)*(.88+.2*Math.sin(along/LENGTH*Math.PI));
  function frame(t,along) {
    dragonSpine(t,along,p);dragonSpine(t,along-.12,ahead);
    forward.copy(ahead).sub(p).normalize();right.crossVectors(UP,forward).normalize();up.crossVectors(forward,right);
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
    whiskers.forEach((mesh,i)=>{mesh.rotation.z=reducedMotion?0:Math.sin(t*.7+i)*.09;});
    for(let i=0;i<maneCount;i++) {
      const along=2+i/(maneCount-1)*(LENGTH-3);frame(t,along);
      dummy.position.copy(p).addScaledVector(up,radius(along)*.9);dummy.quaternion.setFromRotationMatrix(basis);
      dummy.rotateZ(reducedMotion?0:Math.sin(t*1.1-i*.4)*.15);
      const s=(.45+.65*Math.pow(1-along/LENGTH,.5))*(1+.12*Math.sin(i*2.4));dummy.scale.set(s,s,s);dummy.updateMatrix();mane.setMatrixAt(i,dummy.matrix);
    }
    mane.instanceMatrix.needsUpdate=true;
    feet.forEach(({foot,along,side})=>{frame(t,along);foot.position.copy(p);foot.quaternion.setFromRotationMatrix(basis);foot.rotateZ(side*(.2+(reducedMotion?0:Math.sin(t*.65-along*.15)*.2)));});
    frame(t,LENGTH);tail.position.copy(p);tail.quaternion.setFromRotationMatrix(basis);
  }
  update(0,new THREE.Vector3(),0);
  return {root,update};
}
