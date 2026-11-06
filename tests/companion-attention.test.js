import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Vector3, Box3 } from 'three';
import { createCompanionAttention } from '../src/companion-attention.js';
import { attachCompanions, FUZZBALLS, FUZZ_BODY_HEIGHT, MOUSE_POSITION, fuzzPoseAt } from '../src/train-companions.js';
import { readGlb } from './helpers/glb.js';

const make = options => createCompanionAttention(FUZZBALLS, FUZZ_BODY_HEIGHT, fuzzPoseAt, MOUSE_POSITION, options);
function viewerFor(index, position = [.86, 2.1, 0]) {
  const target = [...(index === 3 ? MOUSE_POSITION : FUZZBALLS[index].points[0])];
  target[1] += index === 3 ? .17 : FUZZ_BODY_HEIGHT * FUZZBALLS[index].size * .65;
  const direction = target.map((v, axis) => v - position[axis]);
  const length = Math.hypot(...direction);
  return { position, direction: direction.map(v => v / length), enabled: true, aboard: true };
}

test('steady looking invites one encounter, with approach, eye contact, retreat, peek and a closed return', () => {
  for (const index of [0, 1, 2]) {
    const controller = make(), viewer = viewerFor(index, index === 2 ? [-.55, 2.55, 5] : [.86, 2.1, 0]);
    const phases = new Set(); let previous, encounters = 0, wasActive = false, maxLift = 0;
    for (let t = 0; t < 34; t += .01) {
      const result = controller.update(t, .01, viewer), p = result.fuzzballs[index];
      const engaged = result.state.engaged === FUZZBALLS[index].id;
      if (engaged && !wasActive) encounters++;
      wasActive = engaged;
      if (engaged) { phases.add(p.phase); maxLift = Math.max(maxLift, p.lift); }
      assert(result.fuzzballs.filter(p => /you|gaze|scurrying|peeking|returning/.test(p.phase)).length <= 1);
      if (previous) {
        assert(Math.hypot(...p.position.map((v, axis) => v - previous.position[axis])) < .035, `Position snaps for ${index} at ${t}`);
        assert(Math.abs(Math.atan2(Math.sin(p.facing - previous.facing), Math.cos(p.facing - previous.facing))) < .2, `Facing snaps at ${t}`);
      }
      previous = p;
    }
    assert.equal(encounters, 1, 'Sustained looking must not repeatedly startle the creature.');
    assert.deepEqual([...phases], ['noticing you', 'approaching you', 'meeting your gaze', 'scurrying away', 'peeking back', 'returning to its game']);
    assert(maxLift / (FUZZ_BODY_HEIGHT * FUZZBALLS[index].size) > 2.2);
  }
});

test('passing glances, menus, station and reduced motion do not invite reactions or queue skipped time', () => {
  for (const variant of ['away', 'brief', 'menu', 'station', 'reduced']) {
    const controller = make({ reducedMotion: variant === 'reduced' });
    for (let frame = 0; frame < 900; frame++) {
      const viewer = viewerFor(0);
      if (variant === 'away' || (variant === 'brief' && frame % 20 > 5)) viewer.direction = [0, 0, -1];
      if (variant === 'menu') viewer.enabled = false;
      if (variant === 'station') viewer.aboard = false;
      assert.equal(controller.update(frame / 60, 1 / 60, viewer).state.engaged, null, variant);
    }
  }
  const controller = make(), viewer = viewerFor(0);
  for (const time of [10000, 20000, NaN, Infinity]) {
    const result = controller.update(time, 30, viewer);
    assert.equal(result.state.engaged, null);
    assert(result.fuzzballs.every(p => p.position.every(Number.isFinite) && Number.isFinite(p.facing)));
  }
});

test('mouse shares a short glance and returns to the view; ambient fuzzballs also watch outside', () => {
  const controller = make(), viewer = viewerFor(3); let peak = 0, ended = false;
  for (let t = 0; t < 13; t += .02) {
    const result = controller.update(t, .02, viewer);
    if (result.mouse) {
      assert.equal(result.state.engaged, 'mouse');
      peak = Math.max(peak, result.mouse.amount);
      assert(!result.fuzzballs.some(p => /you|gaze/.test(p.phase)));
    } else if (peak > 0) ended = true;
  }
  assert.equal(peak, 1); assert(ended);
  const ambient = make().update(16, 0);
  assert.equal(ambient.fuzzballs[0].phase, 'watching the view');
  assert(Math.abs(ambient.fuzzballs[0].facing - Math.PI / 2) < .01);
});

test('actual encounter geometry stays on safe supports and follows translated and rotated carriages', () => {
  const { model } = readGlb(new URL('../public/assets/spirits/companions.glb', import.meta.url));
  const carriage = new Group(); carriage.position.set(24, 0, -1100); carriage.rotation.y = .7;
  const companions = attachCompanions(model, carriage);
  const v = new Vector3(), inverse = carriage.matrixWorld.clone();
  const bounds = root => {
    const box = new Box3();
    root.traverse(object => {
      const p = object.geometry?.attributes.position;
      for (let i = 0; i < (p?.count ?? 0); i++) box.expandByPoint(v.fromBufferAttribute(p, i).applyMatrix4(object.matrixWorld).applyMatrix4(inverse));
    });
    return box;
  };
  for (const index of [0, 1, 2, 3]) {
    const local = viewerFor(index, index === 2 ? [-.55, 2.55, 5] : [.86, 2.1, 0]);
    carriage.updateWorldMatrix(true, true); inverse.copy(carriage.matrixWorld).invert();
    const viewer = { ...local, position: new Vector3(...local.position).applyMatrix4(carriage.matrixWorld),
      direction: new Vector3(...local.direction).transformDirection(carriage.matrixWorld) };
    let engaged = false;
    for (let frame = 0; frame < 60 * 55; frame++) {
      const time = index * 55 + frame / 60;
      companions.update(time, {}, 1 / 60, viewer);
      if (companions.state.attention.engaged === (index === 3 ? 'mouse' : FUZZBALLS[index].id)) engaged = true;
      if (frame % 15) continue;
      carriage.updateWorldMatrix(true, true);
      const mouse = bounds(companions.mouse);
      assert(mouse.min.y > 1.982 && mouse.max.y < 2.25);
      // The nose and curled tail may overhang; the feet remain on the perch.
      assert(mouse.min.x > 1.06 && mouse.max.x < 1.39 && mouse.min.z > .20 && mouse.max.z < .69);
      companions.fuzzballs.forEach((root, i) => {
        const box = bounds(root), support = FUZZBALLS[i].points[0][1];
        assert(box.min.y >= support - .002 && box.max.y < support + .4, `Fuzz ${i}, time ${time}, ${companions.state.fuzzballs[i].phase}, bounds ${box.min.y}..${box.max.y}, support ${support}`);
        if (i === 0) {
          assert(box.min.x > 1.11 && box.max.x < 1.36 && box.min.z > .68 && box.max.z < 1.29);
          assert(!box.intersectsBox(mouse));
        } else {
          assert(box.min.x > -1.12 && box.max.x < -.79);
          assert(i === 1 ? box.min.z > -4.45 && box.max.z < -3.53 : box.min.z > 3.05 && box.max.z < 4.19);
        }
      });
    }
    assert(engaged, `Actor ${index} must react through the transformed carriage coordinates.`);
  }
});
