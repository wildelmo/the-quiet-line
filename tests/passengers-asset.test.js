import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Group, Quaternion, Vector3 } from 'three';
import { attachPassengers, PASSENGERS } from '../src/train-passengers.js';
import { readGlb } from './helpers/glb.js';

const readAsset = () => readGlb(new URL('../public/assets/spirits/passengers.glb', import.meta.url));

test('four original exported passengers have valid geometry and share one painted atlas', () => {
  const { file, json, values, model } = readAsset();
  let triangles = 0, primitives = 0;
  for (const mesh of json.meshes) for (const primitive of mesh.primitives) {
    primitives++;
    const vertices = values(primitive.attributes.POSITION);
    const indices = values(primitive.indices).flat();
    assert.equal(indices.length % 3, 0);
    assert(indices.every(index => Number.isInteger(index) && index >= 0 && index < vertices.length));
    assert(values(primitive.attributes.TEXCOORD_0).flat().every(value => value >= -.001 && value <= 1.001));
    triangles += indices.length / 3;
  }
  assert(triangles > 4000 && triangles <= 60000, `${triangles} triangles exceeds the four-passenger budget.`);
  assert(primitives <= 24);
  assert(file.length < 8 * 1024 * 1024);
  assert.equal(json.images.length, 1);
  assert.equal(json.materials.length, 1);
  assert.notEqual(json.materials[0].alphaMode, 'BLEND');
  model.updateWorldMatrix(true, true);
  for (const { id } of PASSENGERS) for (const part of ['', 'Body', 'Head', 'Action']) {
    const node = model.getObjectByName(id + part);
    assert(node, `Missing ${id + part}`);
    assert(node.getWorldQuaternion(new Quaternion()).angleTo(new Quaternion()) < .0001);
  }
});

test('actual passenger meshes remain seated, separated, clear of the aisle, doorway and visitor seats', () => {
  const { model } = readAsset(), carriage = new Group();
  const passengers = attachPassengers(model, carriage);
  const point = new Vector3();
  for (const time of [0, 17, 39, 68, 95, 130, 150, 500]) {
    passengers.update(time);
    carriage.updateWorldMatrix(true, true);
    const boxes = passengers.roots.map((root, index) => {
      const box = new Box3();
      root.traverse(object => {
        const positions = object.geometry?.attributes.position;
        for (let i = 0; i < (positions?.count ?? 0); i++) box.expandByPoint(point.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld));
      });
      assert(!box.isEmpty());
      assert(box.min.y >= .88 && box.max.y < 2.85, `${root.name}: floor/ceiling ${box.min.y}, ${box.max.y}`);
      const side = Math.sign(PASSENGERS[index].position[0]);
      assert(side > 0 ? box.min.x > .22 && box.max.x < 1.36 : box.max.x < -.22 && box.min.x > -1.36,
        `${root.name}: aisle/wall ${box.min.x}, ${box.max.x}`);
      assert(box.min.z > -6.5 && box.max.z < 4, `${root.name}: end/doorway clearance`);
      assert(box.max.z < -.9 || box.min.z > .9, `${root.name}: visitor seat clearance`);
      return box;
    });
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) assert(!boxes[i].intersectsBox(boxes[j]));
    // Existing reader and its bag occupy the right-bench interval below.
    const reader = new Box3(new Vector3(.22, .9, -2.5), new Vector3(1.3, 2.7, -1.2));
    for (const box of boxes) assert(!box.intersectsBox(reader));
  }
});
