import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { readGlb } from './helpers/glb.js';
import { DOLPHIN_SCALE, DOLPHIN_ASSET } from '../src/dolphins.js';

const asset = new URL(`../public/${DOLPHIN_ASSET}`, import.meta.url);

test('the shipped dolphin is a small rigged model with a swim cycle, nose along +z', () => {
  const { json, model } = readGlb(asset);
  let triangles = 0;
  for (const mesh of json.meshes) for (const p of mesh.primitives) triangles += (p.indices !== undefined ? json.accessors[p.indices].count : json.accessors[p.attributes.POSITION].count) / 3;
  assert.ok(triangles > 100 && triangles < 2000, `low poly: ${triangles}`);
  assert.equal(json.images?.length ?? 0, 0, 'no textures to download');
  assert.equal(json.skins?.length, 1, 'rigged');
  assert.ok(json.animations?.some(a => /swim/i.test(a.name)), 'has a swim clip');
  assert.ok(json.meshes[0].primitives[0].attributes.JOINTS_0 !== undefined, 'skinned');
  model.updateMatrixWorld(true);
  const head = model.getObjectByName('Head').getWorldPosition(new Vector3()), tail = model.getObjectByName('Tail').getWorldPosition(new Vector3());
  assert.ok(head.z > tail.z + 4, 'the nose points along +z, so the pod turns it toward the train\'s way');
  const length = (head.z - tail.z) * 1.35 * DOLPHIN_SCALE;
  assert.ok(length > 2 && length < 3.2, `about a bottlenose in length at the chosen scale: ${length.toFixed(2)}m`);
});
