import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Box3 } from 'three';
import { createStationShore, STATION_POSITION } from '../src/shore.js';

test('the raised station bank stays beside the carriage clearance and above the sea',()=>{
  const shore=createStationShore(new Scene()),box=new Box3().setFromObject(shore);
  assert(box.max.x < -1.45,'The shore and boarding sill must not enter the carriage body.');
  assert(box.max.y>.6&&box.min.y<0,'The bank must rise out of the water.');
  assert.deepEqual(STATION_POSITION,[-3.4,.6,-3]);
  shore.traverse(o=>{if(o.isMesh)assert(o.geometry.attributes.position.array.every(Number.isFinite));});
  const terrain=shore.children[0].geometry;
  assert(terrain.attributes.normal.getY(81*3+10)>.5,'The grassy bank must face upward.');
});
