import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, Group, Quaternion, Vector3 } from 'three';
import { attachCompanions, FUZZBALLS, FUZZ_BODY_HEIGHT } from '../src/train-companions.js';
import { readGlb } from './helpers/glb.js';

const readAsset = () => readGlb(new URL('../public/assets/spirits/companions.glb', import.meta.url));
const metadata = JSON.parse(readFileSync(new URL('../assets/spirits/companions-metadata.json', import.meta.url)));

test('little companions have bounded opaque painted geometry and truly white untextured eyes', () => {
  const { file, json, values, model } = readAsset();
  let triangles = 0, primitives = 0;
  for (const mesh of json.meshes) for (const primitive of mesh.primitives) {
    primitives++;
    const vertices = values(primitive.attributes.POSITION), indices = values(primitive.indices).flat();
    assert(indices.every(index => Number.isInteger(index) && index >= 0 && index < vertices.length));
    assert.equal(indices.length % 3, 0);
    triangles += indices.length / 3;
    assert(primitive.attributes.COLOR_0 !== undefined);
    if (primitive.attributes.TEXCOORD_0 !== undefined) assert(values(primitive.attributes.TEXCOORD_0).flat().every(value => value >= -.001 && value <= 1.001));
  }
  assert(triangles > 2000 && triangles <= 18000);
  assert(primitives <= 10);
  assert(file.length < 4 * 1024 * 1024);
  assert.equal(json.images.length, 1);
  assert.equal(json.materials.length, 2);
  for (const material of json.materials) assert.equal(material.alphaMode ?? 'OPAQUE', 'OPAQUE');
  const eyes = json.materials.find(material => material.name === 'Chalk white fuzz eyes');
  assert(eyes);
  assert.equal(eyes.pbrMetallicRoughness.baseColorTexture, undefined);
  assert.deepEqual(eyes.pbrMetallicRoughness.baseColorFactor ?? [1, 1, 1, 1], [1, 1, 1, 1]);
  assert(Math.abs(FUZZ_BODY_HEIGHT - metadata.characters.Fuzz.bounds_m.size[1]) < .000005);
  model.updateWorldMatrix(true, true);
  for (const name of ['Mouse', 'MouseBody', 'MouseHead', 'MouseEyes', 'MouseNose', 'MouseTail', 'Fuzz', 'FuzzBody', 'FuzzEyes', 'Perch']) {
    const node = model.getObjectByName(name);
    assert(node, `Missing ${name}`);
    assert(node.getWorldQuaternion(new Quaternion()).angleTo(new Quaternion()) < .0001);
  }
});

test('actual mouse, perch and hopping geometry stay on their supports, away from visitor seats and other passengers', () => {
  const { model } = readAsset(), carriage = new Group();
  const companions = attachCompanions(model, carriage);
  const point = new Vector3();
  const bounds = root => {
    const box = new Box3();
    root.traverse(object => {
      const p = object.geometry?.attributes.position;
      for (let i = 0; i < (p?.count ?? 0); i++) box.expandByPoint(point.fromBufferAttribute(p, i).applyMatrix4(object.matrixWorld));
    });
    return box;
  };
  for (const time of [0, 3.95, 4.39, 5.77, 7.15, 8.4, 10.9, 14.39, 16.8, 24.4, 35, 43, 94]) {
    companions.update(time);
    carriage.updateWorldMatrix(true, true);
    const mouse = bounds(companions.mouse), perch = bounds(companions.perch);
    assert(mouse.min.y >= 1.983 && mouse.max.y < 2.24);
    assert(mouse.min.x > 1.1 && mouse.max.x < 1.37);
    assert(mouse.min.z > .20 && mouse.max.z < .65);
    assert(perch.min.x >= 1.11 && perch.max.x <= 1.37 && perch.min.z > .12 && perch.max.z < 1.38);
    assert(Math.abs(perch.max.y - 1.985) < .0001);
    companions.fuzzballs.forEach((root, index) => {
      const box = bounds(root), support = FUZZBALLS[index].points[0][1];
      assert(box.min.y >= support - .002, `Fuzz ${index} goes through its support at ${time}`);
      assert(box.max.y < support + FUZZ_BODY_HEIGHT * FUZZBALLS[index].size * 4.2);
      if (index === 0) {
        assert(box.min.x > 1.11 && box.max.x < 1.36 && box.min.z > .79 && box.max.z < 1.25);
        assert(!box.intersectsBox(mouse));
      } else {
        assert(box.min.x > -1.13 && box.max.x < -.73, `Fuzz ${index} leaves its cushion`);
        assert(index === 1 ? box.min.z > -4.22 && box.max.z < -3.60 : box.min.z > 3.20 && box.max.z < 3.78);
      }
      assert(box.min.x > .1 || box.max.x < -.1, 'The centre aisle stays open.');
    });
  }
});
