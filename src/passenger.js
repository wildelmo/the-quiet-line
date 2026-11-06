import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { dragonSpine } from './dragon.js';

const smooth = x => { const t=THREE.MathUtils.clamp(x,0,1); return t*t*(3-2*t); };

export function passengerAt(time, reducedMotion=false) {
  if(reducedMotion)return {visible:true,opacity:1,arrival:1,departure:0,phase:'resting'};
  const t=((time%420)+420)%420-38;
  if(t<0||t>=100)return {visible:false,opacity:0,arrival:0,departure:0,phase:'away'};
  return {
    visible:true,opacity:smooth(t/4)*(1-smooth((t-96)/4)),
    arrival:smooth(t/14),departure:smooth((t-83)/17),
    phase:t<14?'arriving':t<83?'watching':'leaving',
  };
}

// An original sea-glass traveller with a folded leaf cap and a little blank
// brass ticket. It is a physical bench companion, never a screen overlay.
export function createPassenger(station, dragon, {reducedMotion=false}={}) {
  const root=new THREE.Group();root.name='The tide passenger';station.add(root);
  const pigment=color=>new THREE.MeshStandardMaterial({color,roughness:1,
    emissive:color,emissiveIntensity:.12,transparent:true,depthWrite:true});
  const glass=pigment('#92bfb0'),cream=pigment('#e6ebcb'),ink=pigment('#244b4b');
  const leaf=pigment('#628b69'),brass=pigment('#d5b371');
  const materials=[glass,cream,ink,leaf,brass];
  const body=new THREE.Group();root.add(body);
  const head=new THREE.Group();head.position.y=.14;body.add(head);
  const oval=(parent,scale,position,material)=>{
    const geo=new THREE.SphereGeometry(1,16,12);geo.scale(...scale);geo.translate(...position);
    const mesh=new THREE.Mesh(geo,material);parent.add(mesh);return mesh;
  };
  oval(body,[.14,.19,.12],[0,.03,0],glass);
  oval(body,[.105,.12,.035],[0,.02,.105],cream);
  oval(head,[.125,.12,.108],[0,.015,0],glass);
  const eyes=new THREE.Group();head.add(eyes);
  for(const side of [-1,1]){
    oval(eyes,[.011,.017,.006],[side*.041,.024,.101],ink);
    oval(body,[.035,.075,.038],[side*.115,-.02,.065],glass);
  }
  const footGeometries=[];
  for(const side of [-1,1]){
    const geo=new THREE.SphereGeometry(1,12,8);geo.scale(.041,.027,.065);geo.translate(side*.065,-.15,.07);footGeometries.push(geo);
  }
  body.add(new THREE.Mesh(mergeGeometries(footGeometries),glass));footGeometries.forEach(g=>g.dispose());
  const cap=new THREE.Mesh(new THREE.ConeGeometry(.17,.065,7),leaf);cap.position.set(-.01,.13,0);cap.rotation.z=.16;head.add(cap);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.006,.009,.065,5),brass);stem.position.set(-.01,.18,0);stem.rotation.z=-.4;head.add(stem);
  const ticket=new THREE.Mesh(new THREE.BoxGeometry(.065,.091,.008),brass);ticket.position.set(.015,-.025,.145);ticket.rotation.z=-.2;body.add(ticket);
  const cord=new THREE.Mesh(new THREE.TorusGeometry(.043,.003,4,14,Math.PI),ink);cord.position.set(.008,.046,.117);cord.rotation.z=.1;body.add(cord);
  // Water renders in the transparent pass at order 3. Render the traveller
  // afterward and write depth so its opaque paint also occludes its own parts.
  root.traverse(object=>{if(object.isMesh)object.renderOrder=4;});
  const from=new THREE.Vector3(-3.7,.56,6.45),seat=new THREE.Vector3(-4.40,.98,5.52),to=new THREE.Vector3(-3.05,.48,6.9);
  const target=new THREE.Vector3();
  let state=passengerAt(0,reducedMotion);
  function update(time,dt,light){
    state=passengerAt(time,reducedMotion);root.visible=state.visible;
    if(!root.visible)return;
    for(const material of materials){material.opacity=state.opacity;material.emissiveIntensity=.10+light.lantern*.12;}
    root.position.lerpVectors(from,seat,state.arrival).lerp(to,state.departure);
    const t=reducedMotion?0:time;
    const travelling=(1-state.arrival)+state.departure;
    body.position.y=reducedMotion?0:Math.sin(Math.PI*state.arrival)*.16+Math.sin(Math.PI*state.departure)*.12;
    body.rotation.z=reducedMotion?0:Math.sin(t*2.8)*.045*travelling;
    root.rotation.y=Math.PI*.5;
    body.scale.y=1+Math.sin(t*1.3)*.015;
    // Track the dragon in station-local space even while the station travels.
    dragonSpine(t,0,target).add(dragon.root.position);
    station.updateWorldMatrix(true,false);station.worldToLocal(target);target.sub(root.position);
    const yaw=THREE.MathUtils.clamp(Math.atan2(target.x,target.z)-root.rotation.y,-.65,.65);
    const pitch=-THREE.MathUtils.clamp(Math.atan2(target.y,Math.hypot(target.x,target.z)),0,.45);
    const ease=reducedMotion?1:1-Math.exp(-Math.min(dt,.05)*1.8);
    head.rotation.y+=(yaw-head.rotation.y)*ease;head.rotation.x+=(pitch-head.rotation.x)*ease;
    eyes.scale.y=reducedMotion?1:1-.92*Math.max(0,Math.sin(t*.61))**90;
  }
  update(0,0,{lantern:0});
  return {root,update,get state(){return state;}};
}
