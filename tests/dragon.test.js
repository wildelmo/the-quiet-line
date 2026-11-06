import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { createDragon, dragonSpine } from '../src/dragon.js';
import { dragonFrame, DRAGON_FLIGHT, flightDistance } from '../src/dragon-flight.js';

test('the faster route completes a vertical loop without frame flips, including its closing seam',()=>{
  const p=new Vector3(),right=new Vector3(),up=new Vector3(),forward=new Vector3(),previous=new Vector3();
  let inverted=false,high=false;
  for(let time=0;time<DRAGON_FLIGHT.length/DRAGON_FLIGHT.speed*2+.5;time+=1/72){
    dragonFrame(time,0,p,right,up,forward);
    if(time)assert(previous.dot(up)>.995,'Transported frames must turn continuously through vertical and the repeat seam.');
    assert(Math.abs(right.dot(up))<1e-6&&Math.abs(up.dot(forward))<1e-6);
    assert(Math.abs(up.length()-1)<1e-6&&Math.abs(forward.length()-1)<1e-6);
    const speed=(flightDistance(time+1/72)-flightDistance(time))*72;
    assert(speed>6.7&&speed<7.7,'Cruise should be lively but not accelerate abruptly.');
    inverted ||= up.y<-.8;high ||= p.y>90;previous.copy(up);
  }
  assert(inverted&&high,'The route must include the full vertical loop.');
});

test('dragon flight stays above the sea, distant from the viewer, and continuous',()=>{
  const p=new Vector3(),q=new Vector3();
  for(let time=0;time<250;time+=.5)for(let along=0;along<=58;along+=2){
    dragonSpine(time,along,p);dragonSpine(time+1/72,along,q);
    assert(p.toArray().every(Number.isFinite));
    assert(p.y>16,'The dragon must stay above the station.');
    assert(Math.hypot(p.x,p.z)>50,'The dragon must not rush into personal space.');
    assert(p.distanceTo(q)<.15,'Flight must not jump between adjacent headset frames.');
  }
});

test('dragon animation reuses geometry, stays finite, and honors reduced motion',()=>{
  const scene=new Scene(),dragon=createDragon(scene),still=createDragon(scene,{reducedMotion:true});
  const meshes=[];dragon.root.traverse(o=>{if(o.isMesh)meshes.push(o);});
  const buffers=meshes.map(o=>o.geometry.attributes.position.array);
  const stillBody=still.root.children.find(o=>o.isMesh&&!o.isInstancedMesh);
  const before=Array.from(stillBody.geometry.attributes.position.array);
  for(const t of [0,10,60,120,240,3600]){
    dragon.update(t,new Vector3(0,.32,-320),1/72);
    still.update(t,new Vector3(),1/72);
    meshes.forEach((mesh,i)=>{
      assert.equal(mesh.geometry.attributes.position.array,buffers[i]);
      assert(mesh.geometry.attributes.position.array.every(Number.isFinite));
      assert(mesh.quaternion.toArray().every(Number.isFinite));
    });
  }
  assert.deepEqual(Array.from(stillBody.geometry.attributes.position.array),before);
  // Catch accidental per-lock meshes or high-detail replacements in the XR path.
  assert(meshes.length<=24);
});
