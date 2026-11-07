import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Matrix4, Vector3, Quaternion, Euler } from 'three';
import { HOME } from '../src/motion.js';
import { readHeadPose } from '../src/xr-pose.js';
import { createTrainRide, classifyTeleport, roofHeightAt, CARRIAGE_ROOF } from '../src/travel.js';
import { podSchedule, leap, VISIT, POD } from '../src/dolphins.js';
import { planeFlight, PLANE_COUNT } from '../src/paper-planes.js';

const pose = (x = 0, y = 1.65, z = 0, yaw = 0) => new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(0, yaw, 0)), new Vector3(1, 1, 1));
function fixture() {
  const rig = new Group(), root = new Group(), ticket = new Group();
  root.position.set(0, 0, -4); rig.position.set(HOME.x, HOME.y, HOME.z);
  const train = { root, anchors: { boarding: new Vector3(-.55, .9, 5), leftSeat: new Vector3(-.86, .9, 0), rightSeat: new Vector3(.86, .9, 0), roof: new Vector3(0, 3.7, 1.2) }, setDoorOpen(open) { this.doorOpen = open; } };
  return { rig, train, ride: createTrainRide({ rig, train, ticket }) };
}
const place = (ride, action, tracking) => { assert(ride.request(action), `${action} must be accepted`); assert(ride.commitPlacement(tracking)); ride.finishTransition(); };

test('the roof crown is nearly flat and lower toward the eaves', () => {
  assert.ok(Math.abs(roofHeightAt(0) - 3.7) < 1e-9);
  assert.ok(roofHeightAt(CARRIAGE_ROOF.halfWidth) < roofHeightAt(0) && roofHeightAt(CARRIAGE_ROOF.halfWidth) > 3.5);
});

test('a traveller can climb to the roof from the menu, stands at full height there, and comes back to a seat', () => {
  const f = fixture(), tracking = pose(0, 1.6, 0);
  assert.equal(f.ride.request('roof'), false, 'not from the platform');
  place(f.ride, 'board', tracking);
  place(f.ride, 'roof', tracking);
  assert.equal(f.ride.seat, 'roof'); assert.equal(f.ride.onRoof, true); assert.equal(f.ride.outdoors, true);
  assert.equal(f.ride.eyeHeight, 1.65); assert.equal(f.ride.floorHeight, 3.7);
  const head = new Vector3(), facing = new Vector3(); readHeadPose(f.rig, tracking, head, facing);
  assert.ok(Math.abs(head.y - (3.7 + 1.6)) < 1e-9, 'tracked height sits on the roof');
  assert.equal(f.ride.request('roof'), false, 'already there');
  assert.equal(f.ride.roofLabel, 'On the roof');
  place(f.ride, 'seat', tracking);
  assert.equal(f.ride.seat, 'left'); assert.equal(f.ride.outdoors, false); assert.equal(f.ride.eyeHeight, 1.2);
  assert.equal(f.ride.roofLabel, 'Stand on the roof');
});

test('the roof stays underfoot while the train travels and a stick step can land on it', () => {
  const f = fixture(), tracking = pose();
  place(f.ride, 'board', tracking); place(f.ride, 'roof', tracking);
  assert(f.ride.toggleJourney());
  for (let i = 0; i < 400; i++) f.ride.update(1 / 72);
  const head = new Vector3(), facing = new Vector3(); readHeadPose(f.rig, tracking, head, facing);
  assert.ok(Math.abs(head.z - (f.train.root.position.z + 1.2)) < 1e-6, 'carried along on the roof');
  const onto = classifyTeleport(new Vector3(.3, f.train.root.position.y + 3.6, f.train.root.position.z - 3), f.train.root, f.ride.distance);
  assert.ok(onto.roof && onto.allowed && !onto.inside);
  assert.ok(Math.abs(onto.anchor.y - roofHeightAt(.3)) < 1e-9);
  const edge = classifyTeleport(new Vector3(CARRIAGE_ROOF.halfWidth + .1, 3.6, f.train.root.position.z), f.train.root, f.ride.distance);
  assert.equal(edge.roof, false, 'the curved eaves are not a place to stand');
  const target = f.ride.teleport(tracking, new Vector3(-.2, 3.6, f.train.root.position.z + 4));
  assert.ok(target?.roof); assert.equal(f.ride.seat, 'roof'); assert.equal(f.ride.state, 'travelling');
  const down = f.ride.teleport(tracking, new Vector3(0, 0, f.train.root.position.z));
  assert.ok(down?.inside); assert.equal(f.ride.seat, null); assert.equal(f.ride.floorHeight, .9);
});

test('the pod visits on a calm schedule, swims alongside only while the train moves, and leaps clear of the water', () => {
  let state = { visit: null, next: VISIT.first };
  state = podSchedule(10, state.visit, state.next, true, () => .5); assert.equal(state.visit, null);
  state = podSchedule(VISIT.first, state.visit, state.next, true, () => .5);
  assert.equal(state.visit?.mode, 'alongside');
  state = podSchedule(VISIT.first + VISIT.seconds + 1, state.visit, state.next, true, () => .5);
  assert.equal(state.visit, null); assert.ok(state.next > VISIT.first + VISIT.seconds + VISIT.every[0]);
  state = podSchedule(state.next, state.visit, state.next, false, () => .5);
  assert.equal(state.visit?.mode, 'passing');
  for (let i = 0; i < POD; i++) {
    let highest = -Infinity, lowest = Infinity;
    for (let age = 0; age < 40; age += .05) { const l = leap(i, age); highest = Math.max(highest, l.y); lowest = Math.min(lowest, l.y); assert.equal(l.airborne, l.y > 0); }
    assert.ok(highest > 1.2 && highest < 2.2, `leaps clear: ${highest}`);
    assert.ok(lowest < -1 && lowest > -2, `dives under: ${lowest}`);
  }
});

test('paper planes glide gently: bounded speed, lazy banks, never a nosedive', () => {
  const breeze = { x: 1.5, z: .4, gust: .5 };
  for (let i = 0; i < PLANE_COUNT; i++) for (let t = 0; t < 300; t += .25) {
    const f = planeFlight(i, t, breeze);
    assert.ok(Math.hypot(f.vx, f.vz) < 2.6 && Math.hypot(f.vx, f.vz) > .2, 'a glide, not a dart');
    assert.ok(Math.abs(f.vy) < 1.3 && Math.abs(f.roll) < .7 && f.pitch > -1.0 && f.pitch < .3);
  }
});

test('the sky whale crosses once around golden hour, then rests for a long while', async () => {
  const { whaleSchedule, CROSSING } = await import('../src/sky-whale.js');
  let state = { start: null, last: -CROSSING.cooldown };
  state = whaleSchedule(100, 0, state); assert.equal(state.start, null, 'not at noon');
  state = whaleSchedule(200, .9, state); assert.equal(state.start, 200, 'sets out in golden light');
  state = whaleSchedule(300, .9, state); assert.equal(state.start, 200, 'keeps crossing');
  state = whaleSchedule(200 + CROSSING.seconds, .9, state); assert.equal(state.start, null); assert.equal(state.last, 200 + CROSSING.seconds);
  state = whaleSchedule(200 + CROSSING.seconds + 10, .9, state); assert.equal(state.start, null, 'golden light alone does not bring it straight back');
  state = whaleSchedule(200 + CROSSING.seconds + CROSSING.cooldown, .9, state); assert.ok(state.start !== null, 'after a long rest it may return');
  state = whaleSchedule(state.start + CROSSING.seconds, .9, state);
  state = whaleSchedule(state.last + CROSSING.cooldown + 1, 0, state); assert.equal(state.start, null, 'never in the dark or at noon');
});
