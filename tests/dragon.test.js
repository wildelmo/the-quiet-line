import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { createDragon, dragonSpine } from '../src/dragon.js';

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
