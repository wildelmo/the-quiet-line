import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Matrix4, Vector3, Quaternion, Euler } from 'three';
import { HOME, ROUTE_LENGTH } from '../src/motion.js';
import { readHeadPose } from '../src/xr-pose.js';
import { createTrainRide, classifyTeleport, CARRIAGE_INTERIOR, TELEPORT_RANGE } from '../src/travel.js';

const pose = (x = 0, y = 1.65, z = 0, yaw = 0) => new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(0, yaw, 0)), new Vector3(1, 1, 1));
function fixture() {
  const rig = new Group(), root = new Group(), ticket = new Group();
  root.position.set(0, 0, -4); rig.position.set(HOME.x, HOME.y, HOME.z);
  const train = { root, anchors: { boarding: new Vector3(-.55, .9, 5), leftSeat: new Vector3(-.86, .9, 0), rightSeat: new Vector3(.86, .9, 0) }, setDoorOpen(open) { this.doorOpen = open; } };
  return { rig, train, ticket, ride: createTrainRide({ rig, train, ticket }) };
}
const headOf = (rig, tracking) => { const head = new Vector3(), facing = new Vector3(); readHeadPose(rig, tracking, head, facing); return head; };

test('the carriage floor is walkable anywhere inside, and lands on the floor height', () => {
  const root = new Group(); root.position.set(0, 0, -40);
  const inside = classifyTeleport(new Vector3(.9, .4, -40 + 6), root, 36);
  assert.equal(inside.inside, true); assert.equal(inside.allowed, true);
  assert.equal(inside.anchor.y, CARRIAGE_INTERIOR.floor);
  const beyondWall = classifyTeleport(new Vector3(CARRIAGE_INTERIOR.halfWidth + .05, 0, -40), root, 36);
  assert.equal(beyondWall.inside, false);
});

test('the shore, platform and nearby sea are open while the train is home, and closed once it has left', () => {
  const root = new Group(); root.position.set(0, 0, -4);
  const sea = classifyTeleport(new Vector3(12, 0, 20), root, 0);
  assert.equal(sea.allowed, true); assert.equal(sea.inside, false); assert.equal(sea.anchor.y, 0);
  const shore = classifyTeleport(new Vector3(-7, .55, 3), root, 0);
  assert.equal(shore.anchor.y, .55);
  assert.equal(classifyTeleport(new Vector3(HOME.x + TELEPORT_RANGE + 1, 0, HOME.z), root, 0).allowed, false, 'too far');
  root.position.z = -4 - 300;
  assert.equal(classifyTeleport(new Vector3(12, 0, -280), root, 300).allowed, false, 'nobody steps off a train that has left');
  assert.equal(classifyTeleport(new Vector3(.3, 0, -304), root, 300).allowed, true, 'but the floor of the moving carriage is fine');
});

test('stepping aboard with the stick counts as boarding, stepping off returns to the platform, and doors are untouched', () => {
  const f = fixture(), tracking = pose(0, 1.5, 0);
  assert.equal(f.train.doorOpen, true);
  const aboard = f.ride.teleport(tracking, new Vector3(.4, 0, -4 + 2));
  assert.ok(aboard?.inside);
  assert.equal(f.ride.state, 'boarded'); assert.equal(f.ride.seat, null); assert.equal(f.train.doorOpen, true);
  const head = headOf(f.rig, tracking);
  assert.ok(Math.abs(head.x - .4) < 1e-9 && Math.abs(head.z - (-2)) < 1e-9, 'the head lands where the reticle was');
  assert.ok(Math.abs(head.y - (.9 + 1.5)) < 1e-9, 'tracked height is kept above the carriage floor');
  assert.equal(f.ride.floorHeight, .9);
  const off = f.ride.teleport(tracking, new Vector3(8, 0, 12));
  assert.ok(off && !off.inside);
  assert.equal(f.ride.state, 'platform'); assert.equal(f.ride.floorHeight, 0);
  assert.equal(f.ride.teleport(tracking, new Vector3(0, 0, 400)), null, 'out of range is refused');
  assert.equal(f.ride.state, 'platform');
});

test('a seated traveller who steps away keeps the journey but loses the seat', () => {
  const f = fixture(), tracking = pose();
  assert(f.ride.request('board')); assert(f.ride.commitPlacement(tracking)); f.ride.finishTransition();
  assert(f.ride.request('seat')); assert(f.ride.commitPlacement(tracking)); f.ride.finishTransition();
  assert(f.ride.toggleJourney());
  for (let i = 0; i < 600; i++) f.ride.update(1 / 72);
  assert.ok(f.ride.distance > 5 && f.ride.distance < ROUTE_LENGTH);
  const target = f.ride.teleport(tracking, new Vector3(-.5, 0, f.train.root.position.z - 5));
  assert.ok(target?.inside);
  assert.equal(f.ride.state, 'travelling'); assert.equal(f.ride.seat, null); assert.equal(f.ride.moving, true);
  assert.equal(f.ride.teleport(tracking, new Vector3(20, 0, f.train.root.position.z)), null);
  assert.equal(f.ride.state, 'travelling');
});

test('a teleport is refused during a placement transition', () => {
  const f = fixture(), tracking = pose();
  assert(f.ride.request('board'));
  assert.equal(f.ride.teleport(tracking, new Vector3(0, 0, -4)), null);
  assert(f.ride.commitPlacement(tracking)); f.ride.finishTransition();
  assert.ok(f.ride.teleport(tracking, new Vector3(0, 0, -4)));
});
