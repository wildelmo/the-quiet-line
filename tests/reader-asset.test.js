import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Group, Quaternion, Vector3 } from 'three';
import { attachReader, SPIRIT_OPACITY } from '../src/train-reader.js';

import { readGlb } from './helpers/glb.js';
const readAsset = () => readGlb(new URL('../public/assets/spirits/newspaper-reader.glb', import.meta.url));

test('the shipped spirit has finite textured geometry and bounded asset cost', () => {
  const { file, json, values } = readAsset();
  let triangles = 0, primitives = 0;
  for (const mesh of json.meshes) for (const primitive of mesh.primitives) {
    primitives++;
    assert.equal(primitive.mode ?? 4, 4);
    const vertices = values(primitive.attributes.POSITION);
    assert(vertices.length > 0);
    const uv = values(primitive.attributes.TEXCOORD_0);
    assert.equal(uv.length, vertices.length);
    assert(uv.flat().every(value => value >= -.001 && value <= 1.001));
    const indices = primitive.indices === undefined ? vertices.map((_, i) => i) : values(primitive.indices).flat();
    assert.equal(indices.length % 3, 0);
    assert(indices.every(i => Number.isInteger(i) && i >= 0 && i < vertices.length));
    triangles += indices.length / 3;
  }
  assert(triangles > 1000 && triangles <= 40000, `${triangles} triangles exceeds the reader budget.`);
  assert(primitives <= 22, `${primitives} mesh primitives exceeds the reader budget.`);
  assert(file.length < 6 * 1024 * 1024);
  assert.equal(json.images.length, 1, 'Reuse one painted atlas rather than duplicate texture memory.');
  assert(json.images[0].bufferView !== undefined && json.images[0].uri === undefined);
  for (const material of json.materials) {
    assert.notEqual(material.alphaMode, 'BLEND');
    assert((material.pbrMetallicRoughness?.roughnessFactor ?? 1) >= .65);
  }
});

test('the exported pose nodes keep the reader inside the carriage and clear of both visitor seats', () => {
  const { model } = readAsset(), carriage = new Group();
  for (const name of ['ReaderBody', 'ReaderHead', 'ReaderPaper', 'ReaderTurnPage']) {
    const node = model.getObjectByName(name);
    assert(node, `${name} must survive the Blender export.`);
    model.updateWorldMatrix(true, true);
    assert(node.getWorldQuaternion(new Quaternion()).angleTo(new Quaternion()) < .0001,
      `${name} must expose Y-up pose axes.`);
  }
  const reader = attachReader(model, carriage);
  for (const time of [0, 16.01, 17, 18.4, 19.8, 20.79, 46, 74.7, 99, 119]) {
    reader.update(time);
    carriage.updateWorldMatrix(true, true);
    const bounds = new Box3();
    const visit = object => {
      if (!object.visible) return;
      const positions = object.geometry?.attributes.position;
      for (let i = 0; i < (positions?.count ?? 0); i++) bounds.expandByPoint(new Vector3().fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld));
      object.children.forEach(visit);
    };
    visit(reader.root);
    assert(!bounds.isEmpty());
    assert(bounds.min.y >= .88 && bounds.max.y <= 2.85, `Floor/ceiling clearance at t=${time}.`);
    assert(bounds.min.x > .1 && bounds.max.x < 1.36, `Aisle/wall clearance at t=${time}: ${bounds.min.x}, ${bounds.max.x}.`);
    assert(bounds.max.z < -.9 && bounds.min.z > -3, `Seat/door clearance at t=${time}.`);
  }
});

test('the actual turning leaf curls on the reader-facing side and clears the coat', () => {
  const { model } = readAsset(), carriage = new Group();
  const reader = attachReader(model, carriage);
  const leaf = model.getObjectByName('ReaderTurnPage');
  const paper = model.getObjectByName('ReaderPaper');
  const meshes = [];
  leaf.traverse(object => { if (object.isMesh && !object.userData.spiritDepth) meshes.push(object); });
  assert(meshes.length > 0);
  const restMiddle = meshes.flatMap(mesh => {
    const positions = mesh.geometry.attributes.position;
    return Array.from({ length: positions.count }, (_, i) => new Vector3().fromBufferAttribute(positions, i));
  }).filter(point => Math.abs(point.y) < .025);
  const restZ = restMiddle.reduce((sum, point) => sum + point.z, 0) / restMiddle.length;
  for (const time of [16.1, 16.6, 17.2, 18.4, 19.6, 20.2, 20.7]) {
    reader.update(time);
    carriage.updateWorldMatrix(true, true);
    const paperInverse = paper.matrixWorld.clone().invert();
    const points = meshes.flatMap(mesh => {
      const positions = mesh.geometry.attributes.position;
      return Array.from({ length: positions.count }, (_, i) => new Vector3()
        .fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).applyMatrix4(paperInverse));
    });
    // The paper's gutter is .425m ahead of the body's origin. The coat front
    // at newspaper height lies behind z=.16; a 2cm gap survives the whole turn.
    assert(Math.min(...points.map(point => point.z)) > -.245, `Page clips coat at ${time}`);
    const middle = points.filter(point => Math.abs(point.y) < .025);
    assert(middle.reduce((sum, point) => sum + point.z, 0) / middle.length < restZ - .0002,
      `Page must sweep toward the reader, not the aisle, at ${time}`);
    assert(points.every(point => Number.isFinite(point.x + point.y + point.z)));
  }
  reader.update(18.4);
  const snapshot = meshes[0].geometry.attributes.position.array.slice();
  for (let i = 0; i < 20; i++) reader.update(18.4);
  assert.deepEqual(meshes[0].geometry.attributes.position.array, snapshot, 'Curl must not accumulate.');
});

test('the shared runtime spirit material is thirty percent translucent', () => {
  const { model } = readAsset();
  const reader = attachReader(model, new Group());
  assert.equal(SPIRIT_OPACITY, .7);
  assert.equal(reader.material.opacity, .7);
  assert.equal(reader.material.transparent, true);
  assert.equal(reader.material.depthWrite, false);
  assert.equal(reader.state.opacity, .7);
  reader.update(46, { lantern: 1 });
  assert.equal(reader.material.opacity, .7, 'Night lighting must preserve translucency.');
});
