import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture, Vector3 } from 'three';
import { attachCompanions, fuzzPoseAt, mousePoseAt, FUZZBALLS, FUZZ_BODY_HEIGHT } from '../src/train-companions.js';

function fixture(options) {
  const model = new Group(), carriage = new Group();
  for (const name of ['Mouse', 'Perch', 'Fuzz']) {
    const root = new Group(); root.name = name; model.add(root);
    const parts = name === 'Mouse' ? ['Body', 'Head', 'Eyes', 'Nose', 'Tail'] : name === 'Fuzz' ? ['Body', 'Eyes', 'LeftLeg', 'RightLeg'] : ['Wood'];
    for (const [index, part] of parts.entries()) {
      const node = new Group(); node.name = name + part;
      node.position.set(index * .003, index * .01, index * .002);
      node.rotation.x = index * .03;
      const surface = new MeshStandardMaterial({ map: name === 'Fuzz' && part === 'Eyes' ? null : new Texture() });
      if (name === 'Fuzz' && part === 'Eyes') surface.name = 'Chalk white fuzz eyes';
      node.add(new Mesh(new BoxGeometry(.01, .01, .01), surface));
      (part !== 'Body' && name === 'Fuzz' ? root.getObjectByName('FuzzBody') : root).add(node);
    }
  }
  return { carriage, companions: attachCompanions(model, carriage, options) };
}

test('each travelling hop rises two to three body heights, lands on its support and closes the route', () => {
  FUZZBALLS.forEach((definition, index) => {
    for (const burst of [definition.start, definition.start + 20]) for (let leg = 0; leg < 3; leg++) {
      const start = burst + leg * 1.36, duration = .78 + leg * .045;
      const peak = fuzzPoseAt(index, start + duration / 2);
      const ratio = peak.lift / (FUZZ_BODY_HEIGHT * definition.size);
      assert(ratio >= 2 && ratio <= 3, `${definition.id} jump/body ratio ${ratio}`);
      assert.equal(peak.phase, 'hopping');
      assert(Math.abs(peak.position[1] - definition.points[0][1] - peak.lift) < 1e-10);
      assert.deepEqual(fuzzPoseAt(index, start + duration + .251).position, [...definition.points[(leg + 1) % 3]]);
    }
    assert.deepEqual(fuzzPoseAt(index, definition.cycle - .001).position, [...definition.points[0]]);
    assert.deepEqual(fuzzPoseAt(index, definition.cycle).position, [...definition.points[0]]);
    let resting = 0;
    for (let t = 0; t < definition.cycle; t += .05) if (fuzzPoseAt(index, t).phase === 'resting') resting += .05;
    assert(resting / definition.cycle > .75, 'Long pauses must separate the hop bursts.');
  });
});

test('hopping transforms remain continuous at takeoff, landing, resting intervals and cycle boundaries', () => {
  FUZZBALLS.forEach((definition, index) => {
    for (let t = 0; t < definition.cycle * 2; t += .007) {
      const a = fuzzPoseAt(index, t), b = fuzzPoseAt(index, t + .001);
      for (let axis = 0; axis < 3; axis++) assert(Math.abs(a.position[axis] - b.position[axis]) < .003);
      for (const key of ['scaleX', 'scaleY', 'roll', 'yaw', 'eyes']) assert(Math.abs(a[key] - b[key]) < .025, `${definition.id} ${key} jumps at ${t}`);
      assert(a.position.every(Number.isFinite));
      assert(a.position[1] >= definition.points[0][1]);
      assert(a.scaleY >= .70 && a.scaleY <= 1.13);
    }
  });
  assert.equal(mousePoseAt(5).phase, 'watching its hopping friend');
  assert.equal(mousePoseAt(20).phase, 'watching the sea');
});

test('reduced motion rests all companions and handles invalid clocks without a jump queue', () => {
  for (const time of [5, 10, 16, 25, 35, 53, 100000, NaN, Infinity]) {
    assert.deepEqual(mousePoseAt(time, true), mousePoseAt(0, true));
    FUZZBALLS.forEach((_, index) => assert.deepEqual(fuzzPoseAt(index, time, true), fuzzPoseAt(index, 0, true)));
  }
  for (const time of [NaN, Infinity, -Infinity]) {
    assert.deepEqual(mousePoseAt(time), mousePoseAt(0, true));
    FUZZBALLS.forEach((_, index) => assert.deepEqual(fuzzPoseAt(index, time), fuzzPoseAt(index, 0, true)));
  }
  const { companions } = fixture({ reducedMotion: true });
  const roots = [companions.mouse, ...companions.fuzzballs];
  const before = roots.map(root => root.toJSON());
  companions.update(25);
  assert.deepEqual(roots.map(root => root.toJSON()), before);
});

test('solid companions reuse atlas and fuzz geometry, preserve adult opacity and stay attached without drift', () => {
  const adult = new MeshStandardMaterial({ map: new Texture(), opacity: .7, transparent: true, depthWrite: false });
  const { companions, carriage } = fixture({ material: adult });
  assert.equal(adult.opacity, .7);
  assert.equal(adult.transparent, true);
  assert.notEqual(companions.material, adult);
  assert.equal(companions.material.map, adult.map);
  assert.equal(companions.material.opacity, 1);
  assert.equal(companions.material.transparent, false);
  assert.equal(companions.material.depthWrite, true);
  const geometries = companions.fuzzballs.map(root => root.getObjectByName('FuzzBody').children[0].geometry);
  assert.equal(geometries[0], geometries[1]); assert.equal(geometries[0], geometries[2]);
  const eyes = companions.fuzzballs.map(root => root.getObjectByName('FuzzEyes').children[0].material);
  assert.equal(eyes[0], eyes[1]); assert.equal(eyes[0], eyes[2]);
  assert.equal(eyes[0].name, 'Chalk white fuzz eyes');
  assert.equal(eyes[0].map, null, 'White eyes must not inherit the warm cloth texture.');
  assert.equal(eyes[0].opacity, 1);
  companions.update(5.6);
  const roots = [companions.mouse, companions.perch, ...companions.fuzzballs];
  const positions = roots.map(root => root.getWorldPosition(new Vector3()));
  const poses = roots.map(root => root.toJSON());
  for (let i = 0; i < 300; i++) companions.update(5.6);
  assert.deepEqual(roots.map(root => root.toJSON()), poses);
  carriage.position.z = -1100;
  roots.forEach((root, index) => {
    assert.equal(root.parent, carriage);
    assert(Math.abs(root.getWorldPosition(new Vector3()).z - positions[index].z + 1100) < 1e-8);
  });
});
