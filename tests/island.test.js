import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Box3 } from 'three';
import { createIsland, ISLAND_POSITION } from '../src/island.js';

test('the island stays fixed beside the travel corridor and its geometry remains finite',()=>{
  const island=createIsland(new Scene()),bounds=new Box3().setFromObject(island.root),meshes=[];
  island.root.traverse(o=>{if(o.isMesh)meshes.push(o);});
  assert(bounds.max.x < -20,'All land and trees must stay outside the teleport corridor.');
  assert(bounds.max.y<12&&bounds.min.z>-130&&bounds.max.z<-90);
  const buffers=meshes.map(m=>m.geometry.attributes.position.array);
  for(const time of [0,37,90,480,3600]){
    island.update(time,{lantern:time%2},{gust:.9});
    assert.deepEqual(island.root.position.toArray(),ISLAND_POSITION);
    meshes.forEach((m,i)=>{
      assert.equal(m.geometry.attributes.position.array,buffers[i]);
      assert(m.geometry.attributes.position.array.every(Number.isFinite));
    });
  }
  assert(meshes.length<=22,'Foliage and tiles should remain merged into a few pigment batches.');
});

test('reduced motion holds the trees and laundry still while window light still changes',()=>{
  const island=createIsland(new Scene(),{reducedMotion:true});
  const pose=()=>{const values=[];island.root.traverse(o=>{values.push(...o.quaternion.toArray());if(o.isMesh)values.push(...o.geometry.attributes.position.array);});return values;};
  island.update(0,{lantern:0},{gust:0});const before=pose();
  island.update(400,{lantern:1},{gust:1});assert.deepEqual(pose(),before);
  const lit=[];island.root.traverse(o=>{if(o.isMesh&&o.material.emissiveIntensity>1)lit.push(o);});assert(lit.length>0);
});
