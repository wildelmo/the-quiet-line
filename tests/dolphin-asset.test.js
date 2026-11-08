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

test('a leaping dolphin leaves the water nose-first and re-enters nose-first, travelling the train\'s way', async () => {
  const { leap, leapRotation } = await import('../src/dolphins.js');
  const nose = () => new Vector3(0, 0, 1); // the model's nose lies along local +z
  const rising = leap(0, .3), falling = leap(0, 1.2);
  assert.ok(rising.airborne && falling.airborne);
  const up = nose().applyEuler(leapRotation(rising.pitch, true)), down = nose().applyEuler(leapRotation(falling.pitch, true));
  assert.ok(up.y > .3, `nose climbs on the way out: ${up.y.toFixed(2)}`);
  assert.ok(down.y < -.3, `nose points down on the way back in: ${down.y.toFixed(2)}`);
  assert.ok(up.z < 0 && down.z < 0, 'and the nose keeps pointing along -z, the train\'s direction, throughout');
  const level = nose().applyEuler(leapRotation(0, true));
  assert.ok(Math.abs(level.y) < 1e-9 && level.z < -.99, 'swimming level, nose dead ahead');
});
