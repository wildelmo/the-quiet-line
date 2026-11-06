import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture, Vector3 } from 'three';
import { attachPassengers, passengerPoseAt, PASSENGERS } from '../src/train-passengers.js';

function fixture(options = {}) {
  const model = new Group(), carriage = new Group();
  for (const { id } of PASSENGERS) {
    const root = new Group(); root.name = id; model.add(root);
    for (const [index, part] of ['Body', 'Head', 'Action'].entries()) {
      const node = new Group(); node.name = id + part;
      node.position.set(.01 * index, .62 + .17 * index, .03 * index);
      node.rotation.x = .03 * index;
      (index ? root.getObjectByName(id + 'Body') : root).add(node);
      node.add(new Mesh(new BoxGeometry(.01, .01, .01), new MeshStandardMaterial({ map: new Texture() })));
    }
  }
  return { model, carriage, passengers: attachPassengers(model, carriage, options) };
}

test('four distinct passengers mostly rest, with gentle staggered gestures and continuous cycles', () => {
  assert.equal(new Set(PASSENGERS.map(p => p.id)).size, 4);
  assert.equal(new Set(PASSENGERS.map(p => p.start)).size, 4);
  for (const definition of PASSENGERS) {
    let resting = 0;
    for (let t = 0; t < definition.cycle * 2; t += .1) {
      const p = passengerPoseAt(definition.id, t), next = passengerPoseAt(definition.id, t + 1 / 72);
      if (p.phase === definition.resting) resting++;
      for (const [key, value] of Object.entries(p)) if (typeof value === 'number') {
        assert(Number.isFinite(value));
        assert(Math.abs(value - next[key]) < .003, `${definition.id} ${key} jumps at ${t}`);
      }
      assert(Math.abs(p.headYaw) <= .25);
      assert(Math.abs(p.breath) <= .0025);
      assert(Math.abs(p.actionY) <= .008);
    }
    assert(resting * .1 > definition.cycle * 1.7);
    assert.equal(passengerPoseAt(definition.id, definition.start + 5).phase, definition.gesture);
  }
});

test('reduced motion and invalid clocks hold every passenger still', () => {
  for (const { id } of PASSENGERS) {
    const still = passengerPoseAt(id, 0, true);
    for (const t of [15, 39, 70, 95, 163, 100000, NaN, Infinity]) {
      assert.deepEqual(passengerPoseAt(id, t, true), still);
    }
    for (const t of [NaN, Infinity, -Infinity]) assert.deepEqual(passengerPoseAt(id, t), still);
  }
  const { passengers } = fixture({ reducedMotion: true });
  const original = passengers.roots.map(root => root.toJSON());
  passengers.update(68);
  assert.deepEqual(passengers.roots.map(root => root.toJSON()), original);
});

test('all passengers inherit travel, share the atlas material and preserve authored pose without drift', () => {
  const material = new MeshStandardMaterial({ map: new Texture() });
  const { passengers, carriage } = fixture({ material });
  assert.equal(passengers.roots.length, 4);
  passengers.update(39);
  const positions = passengers.roots.map(root => root.getWorldPosition(new Vector3()));
  const states = passengers.roots.map(root => root.toJSON());
  for (let i = 0; i < 300; i++) passengers.update(39);
  assert.deepEqual(passengers.roots.map(root => root.toJSON()), states);
  carriage.position.z = -1100;
  passengers.roots.forEach((root, index) => {
    assert.equal(root.parent, carriage);
    assert.deepEqual(root.position.toArray(), [...PASSENGERS[index].position]);
    assert(Math.abs(root.getWorldPosition(new Vector3()).z - positions[index].z + 1100) < 1e-8);
    root.traverse(object => {
      if (!object.isMesh) return;
      if (object.userData.spiritDepth) {
        assert.equal(object.material.colorWrite, false);
        assert.equal(object.material.depthWrite, true);
        assert.equal(object.renderOrder, 4);
        assert.equal(object.geometry, object.parent.geometry);
      } else {
        assert.equal(object.material, material);
        assert.equal(object.material.opacity, .7);
        assert.equal(object.renderOrder, 5);
      }
    });
  });
});
