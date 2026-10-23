import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { skyVertex, skyFragment, waterVertex, waterFragment } from './shaders.js';
import { createStation } from './station.js';

function random(seed){let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function woodTexture(){
  const c=document.createElement('canvas');c.width=128;c.height=512;const g=c.getContext('2d');const r=random(24);
  g.fillStyle='#a29471';g.fillRect(0,0,128,512);
  for(let i=0;i<600;i++){g.strokeStyle=`rgba(${r()>.5?'58,67,54':'222,212,171'},${.04+r()*.17})`;g.lineWidth=r()*1.5;let x=r()*128,y=r()*512;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+3,y+30,x-4,y+90,x+2,y+160);g.stroke();}
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;return texture;
}
export async function createWorld(scene, renderer){
  const texture=await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}assets/summer-sky.png`);
  texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1,48,24),new THREE.ShaderMaterial({uniforms:{skyMap:{value:texture}},vertexShader:skyVertex,fragmentShader:skyFragment,side:THREE.BackSide,depthWrite:false,depthTest:false}));
  sky.frustumCulled=false;sky.renderOrder=-10;scene.add(sky);
  const waterMaterial=new THREE.ShaderMaterial({uniforms:{skyMap:{value:texture},time:{value:0},calm:{value:1}},vertexShader:waterVertex,fragmentShader:waterFragment,transparent:true,depthWrite:false,side:THREE.FrontSide});
  const water=new THREE.Mesh(new THREE.PlaneGeometry(15000,15000),waterMaterial);water.rotation.x=-Math.PI/2;water.renderOrder=3;scene.add(water);
  scene.add(new THREE.HemisphereLight(0xe1f6ff,0x7e8f70,2.5));
  const sun=new THREE.DirectionalLight(0xfff0ca,2.4);sun.position.set(-200,450,-250);scene.add(sun);
  scene.fog=new THREE.FogExp2(0xa6d4dd,.00013);
  const wood=new THREE.MeshStandardMaterial({map:woodTexture(),color:0xb9a585,roughness:.95});
  const darkWood=new THREE.MeshStandardMaterial({color:0x5a6253,roughness:1});
  const enamel=new THREE.MeshStandardMaterial({color:0x42706e,roughness:.8});
  const roof=new THREE.MeshStandardMaterial({color:0x526d68,roughness:.95});
  const brass=new THREE.MeshStandardMaterial({color:0x9a875d,metalness:.35,roughness:.65});
  const metal=new THREE.MeshStandardMaterial({color:0x8b9f99,metalness:.38,roughness:.5});
  const concrete=new THREE.MeshStandardMaterial({color:0x999e8d,roughness:1});
  const batches=new Map();
  function box(x,y,z,w,h,d,mat,rz=0){const geo=new THREE.BoxGeometry(w,h,d);geo.rotateZ(rz);geo.translate(x,y,z);if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);}
  function pole(x,y,z,r,h,mat){const geo=new THREE.CylinderGeometry(r,r,h,8);geo.translate(x,y,z);if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);}
  createStation(scene);
  for(const x of [-.72,.72]){
    box(x,-.015,-570,.07,.12,1160,metal);
    box(x,-.08,-570,.14,.035,1160,darkWood);
  }
  const tieGeo=new THREE.BoxGeometry(2.1,.13,.2),tieCount=1500;
  const ties=new THREE.InstancedMesh(tieGeo,darkWood,tieCount);const dummy=new THREE.Object3D();
  for(let i=0;i<tieCount;i++){dummy.position.set(0,-.16,9-i*.78);dummy.updateMatrix();ties.setMatrixAt(i,dummy.matrix);}ties.instanceMatrix.needsUpdate=true;scene.add(ties);
  const bolts=new THREE.InstancedMesh(new THREE.BoxGeometry(.18,.055,.18),brass,600);
  for(let i=0;i<300;i++)for(let s=0;s<2;s++){dummy.position.set(s===0?-.72:.72,-.055,8-i*.78);dummy.updateMatrix();bolts.setMatrixAt(i*2+s,dummy.matrix);}scene.add(bolts);
  // Signal posts punctuate the distance without enclosing it.
  for(const z of [-85,-320,-720,-1100]){
    pole(2.8,1.65,z,.055,3.8,enamel);box(2.8,3.25,z,.55,.13,.13,wood);
    box(2.8,2.95,z,.28,.35,.25,enamel);
    const glass=new THREE.Mesh(new THREE.SphereGeometry(.09,10,6),new THREE.MeshBasicMaterial({color:0xffdfa1}));glass.position.set(2.8,3.0,z+.15);scene.add(glass);
    box(0,.13,z,2.8,.18,3,wood);
  }
  // Far-away, low silhouettes. Their small apparent size keeps the ocean immense.
  const r=random(71);const islandMat=new THREE.MeshStandardMaterial({color:0x6b9e99,roughness:1,flatShading:false});
  for(const [x,z,s] of [[-1700,-2200,1],[2200,-2800,1.4],[-2300,1700,.7],[1200,2400,.8]]){
    for(let j=0;j<7;j++){
      const rock=new THREE.SphereGeometry(1,16,8);rock.scale((80+r()*95)*s,(12+r()*28)*s,(70+r()*75)*s);rock.translate(x+j*95*s,-5,z+r()*100);
      if(!batches.has(islandMat))batches.set(islandMat,[]);batches.get(islandMat).push(rock);
    }
  }
  // A distant white house catches the eye, never becoming a nearby wall.
  box(210,3.7,-620,8,7,6,concrete);box(210,7.4,-620,9,.6,7,roof);
  for(const x of [207.8,210.5])box(x,4.1,-616.94,1.1,1.9,.12,enamel);
  for(const x of [206.5,213.5])pole(x,-.2,-620,.18,4,concrete);
  for(const [mat,geos] of batches){const merged=mergeGeometries(geos,false);if(merged){const mesh=new THREE.Mesh(merged,mat);scene.add(mesh);}geos.forEach(g=>g.dispose());}
  // A glass wind bell and its paper strip, animated only by the breeze.
  const bell=new THREE.Group();bell.position.set(-2.7,2.7,4.35);scene.add(bell);
  const bellBody=new THREE.Mesh(new THREE.SphereGeometry(.095,12,8,0,Math.PI*2,0,Math.PI*.65),new THREE.MeshStandardMaterial({color:0xc9e7de,transparent:true,opacity:.7,roughness:.25,side:THREE.DoubleSide}));bellBody.position.y=-.22;bell.add(bellBody);
  const string=new THREE.Mesh(new THREE.CylinderGeometry(.002,.002,.42,4),darkWood);string.position.y=-.21;bell.add(string);
  const paper=new THREE.Mesh(new THREE.PlaneGeometry(.055,.21),new THREE.MeshStandardMaterial({color:0xf4e9c8,side:THREE.DoubleSide}));paper.position.y=-.5;bell.add(paper);
  const birds=[];const wingGeo=new THREE.BufferGeometry();wingGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.6,.1,-.1,.16,0,.12],3));wingGeo.computeVertexNormals();
  const birdMat=new THREE.MeshBasicMaterial({color:0xf9f6db,side:THREE.DoubleSide});
  for(let i=0;i<12;i++){const group=new THREE.Group();const left=new THREE.Mesh(wingGeo,birdMat);const right=new THREE.Mesh(wingGeo,birdMat);right.scale.x=-1;group.add(left,right);scene.add(group);birds.push({group,left,right,phase:r()*6.28,radius:28+r()*90,height:8+r()*16});}
  const cart=new THREE.Group();
  const deck=new THREE.Mesh(new THREE.BoxGeometry(2.5,.13,2.4),wood);deck.position.y=-.08;cart.add(deck);
  for(const x of [-1.14,1.14]){
    for(const z of [-1.05,1.05]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.65,8),brass);p.position.set(x,.26,z);cart.add(p);}
    const rail=new THREE.Mesh(new THREE.BoxGeometry(.045,.045,2.15),brass);rail.position.set(x,.57,0);cart.add(rail);
  }
  cart.visible=false;scene.add(cart);
  return {sky,water,waterMaterial,cart,
    update(t,position){water.position.x=position.x;water.position.z=position.z;waterMaterial.uniforms.time.value=t;bell.rotation.z=Math.sin(t*.8)*.08;paper.rotation.y=Math.sin(t*.5)*.25;birds.forEach((b,i)=>{const a=t*.012+b.phase;b.group.position.set(Math.cos(a)*b.radius, b.height+Math.sin(a*3)*1.2,-70+Math.sin(a)*b.radius);b.group.rotation.y=-a;b.left.rotation.z=Math.sin(t*2.2+i)*.18;b.right.rotation.z=-b.left.rotation.z;});},
  };
}
