import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Vector3, Quaternion } from 'three';
import { attachReader, readerPoseAt, READER_POSITION } from '../src/train-reader.js';

function fixture(options) {
  const model = new Group(), carriage = new Group();
  const names = ['ReaderBody', 'ReaderHead', 'ReaderPaper', 'ReaderTurnPage', 'ReaderLeftHand', 'ReaderRightHand'];
  for (const [index, name] of names.entries()) {
    const node = new Group(); node.name = name;
    node.position.set(.02 * index, .1 * index, .03 * index);
    node.rotation.x = .04 * index;
    (index === 0 ? model : model.getObjectByName('ReaderBody')).add(node);
  }
  return { model, carriage, reader: attachReader(model, carriage, options) };
}

test('the reader spends most of its time reading, with separate bounded gestures', () => {
  let reading = 0, turning = 0;
  for (let t = 0; t < 119; t += .05) {
    const pose = readerPoseAt(t);
    if (pose.phase === 'reading') reading++;
    if (pose.turning) turning++;
    for (const value of Object.values(pose)) if (typeof value === 'number') assert(Number.isFinite(value));
    assert(pose.pageTurn >= 0 && pose.pageTurn <= 1);
    assert(Math.abs(pose.breath) <= .0025);
    assert(Math.abs(pose.headYaw) <= .22);
    assert(Math.abs(pose.paperY) <= .014);
    if (pose.turning) assert.equal(pose.phase, 'turning a page');
  }
  assert(reading * .05 > 90, 'Long reading pauses should dominate the schedule.');
  assert(turning * .05 > 9 && turning * .05 < 11);
  assert.equal(readerPoseAt(18).phase, 'turning a page');
  assert.equal(readerPoseAt(46).phase, 'watching the sea');
  assert.equal(readerPoseAt(99).phase, 'settling the paper');
});

test('page turns advance smoothly and the cycle has no body or paper snap', () => {
  let previous = 0;
  for (let t = 16.001; t < 20.8; t += .01) {
    const pose = readerPoseAt(t);
    assert(pose.turning && pose.pageTurn >= previous);
    assert(pose.pageTurn - previous < .004);
    previous = pose.pageTurn;
  }
  for (let t = 0; t < 240; t += .05) {
    const a = readerPoseAt(t), b = readerPoseAt(t + 1 / 72);
    for (const key of ['breath', 'bodyRoll', 'headPitch', 'headYaw', 'paperPitch', 'paperY']) {
      assert(Math.abs(a[key] - b[key]) < .003, `${key} jumps at ${t}.`);
    }
  }
});

test('reduced motion holds a still reading pose and invalid clocks remain finite', () => {
  const still = readerPoseAt(0, true);
  for (const t of [0, 18, 46, 99, 119, 10000, NaN, Infinity]) {
    assert.deepEqual(readerPoseAt(t, true), still);
  }
  for (const t of [NaN, Infinity, -Infinity]) assert.deepEqual(readerPoseAt(t), still);
  const { reader, model } = fixture({ reducedMotion: true });
  reader.update(0);
  const before = model.toJSON();
  reader.update(75);
  assert.deepEqual(model.toJSON(), before);
  assert.equal(model.getObjectByName('ReaderTurnPage').visible, false);
});

test('the seated reader inherits carriage travel and preserves authored poses without drift', () => {
  const { reader, carriage, model } = fixture();
  assert.deepEqual(reader.root.position.toArray(), [...READER_POSITION]);
  reader.update(18);
  const head = model.getObjectByName('ReaderHead'), pose = head.quaternion.clone();
  for (let i = 0; i < 500; i++) reader.update(18);
  assert(head.quaternion.angleTo(pose) < 1e-7, 'Repeated updates must not accumulate rotations.');
  const before = reader.root.getWorldPosition(new Vector3());
  carriage.position.z = -1100;
  const after = reader.root.getWorldPosition(new Vector3());
  assert(Math.abs(after.z - before.z + 1100) < 1e-8);
  assert.equal(reader.root.parent, carriage);
  reader.update(0);
  const base = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), .04);
  assert(head.quaternion.angleTo(base) < 1e-7);
  assert.equal(model.getObjectByName('ReaderTurnPage').visible, false);
});
