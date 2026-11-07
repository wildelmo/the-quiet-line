import { Vector3 } from 'three';
import { readHeadPose } from './xr-pose.js';
import { HOME, ROUTE_LENGTH, advanceJourney, smoothSpeed } from './motion.js';

const head = new Vector3(), facing = new Vector3(), localFacing = new Vector3(), local = new Vector3();

// Where a visitor may step with the stick. Inside the carriage the floor is
// always walkable. Outside, the station, shore and nearby sea are open only
// while the train is at home: nobody steps off a train that has left.
export const CARRIAGE_INTERIOR = Object.freeze({ halfWidth: 1.25, halfLength: 7.6, floor: .9 });
// The barrel roof: a visitor may stand along its crown, where it is nearly flat.
export const CARRIAGE_ROOF = Object.freeze({ halfWidth: .95, halfLength: 7.1, spring: 3.10, rise: .60, curve: 1.49 });
export const roofHeightAt = x => CARRIAGE_ROOF.spring + CARRIAGE_ROOF.rise * Math.sqrt(Math.max(0, 1 - (x / CARRIAGE_ROOF.curve) ** 2));
export const TELEPORT_RANGE = 60;
export function classifyTeleport(point, trainRoot, distance) {
  local.copy(point).sub(trainRoot.position);
  const roof = local.y > CARRIAGE_ROOF.spring - .4 && Math.abs(local.x) <= CARRIAGE_ROOF.halfWidth && Math.abs(local.z) <= CARRIAGE_ROOF.halfLength;
  const inside = !roof && Math.abs(local.x) <= CARRIAGE_INTERIOR.halfWidth && Math.abs(local.z) <= CARRIAGE_INTERIOR.halfLength;
  const y = roof ? trainRoot.position.y + roofHeightAt(local.x) : inside ? trainRoot.position.y + CARRIAGE_INTERIOR.floor : point.y;
  const anchor = new Vector3(point.x, y, point.z);
  const home = distance <= 0;
  const near = Math.hypot(point.x - HOME.x, point.z - HOME.z) <= TELEPORT_RANGE;
  return { inside, roof, anchor, allowed: inside || roof || (home && near) };
}

// Place the tracked head horizontally once, retaining actual local-floor height.
// Leaning and walking after this explicit placement never move the train.
export function placeTraveller(rig, trackingHead, floorAnchor, worldYaw) {
  if (worldYaw !== undefined) {
    localFacing.set(0, 0, -1).transformDirection(trackingHead);
    rig.rotation.set(0, worldYaw - Math.atan2(-localFacing.x, -localFacing.z), 0);
  }
  rig.position.y = floorAnchor.y;
  readHeadPose(rig, trackingHead, head, facing);
  rig.position.x += floorAnchor.x - head.x;
  rig.position.z += floorAnchor.z - head.z;
  rig.updateWorldMatrix(true, true);
}

// The rig and train stay scene siblings; no station transform is accepted here.
export function translateTraveller(rig, train, ticket, delta) {
  rig.position.add(delta);
  train.position.add(delta);
  ticket.position.add(delta);
  rig.updateWorldMatrix(true, true);
}

export function createTrainRide({ rig, train, ticket }) {
  const origin = train.root.position.clone();
  const anchor = new Vector3(), delta = new Vector3();
  let state = 'platform', distance = 0, speed = 0, seat = null, floorY = HOME.y;
  let pending = null, committed = false, doorOpen = true;
  train.setDoorOpen(true);
  function doors(open) { doorOpen = open; train.setDoorOpen(open); }
  function pause() { speed = 0; if (state === 'travelling') state = 'paused'; }
  function request(action) {
    if (pending || !['board', 'seat', 'roof', 'home'].includes(action)) return false;
    if (action === 'board' && state !== 'platform') return false;
    if ((action === 'seat' || action === 'roof') && state === 'platform') return false;
    if (action === 'roof' && seat === 'roof') return false;
    pause(); pending = action; committed = false;
    return true;
  }
  function commitPlacement(trackingHead, worldYaw) {
    if (!pending || committed) return false;
    if (pending === 'home') {
      train.root.position.copy(origin); distance = 0; seat = null;
      state = 'platform'; doors(true); anchor.set(HOME.x, HOME.y, HOME.z);
    } else {
      if (pending === 'board') { seat = null; state = 'boarded'; }
      else {
        seat = pending === 'roof' ? 'roof' : seat === 'left' ? 'right' : 'left';
        state = distance >= ROUTE_LENGTH ? 'arrived' : distance > 0 ? 'paused' : 'seated';
      }
      anchor.copy(seat === 'roof' ? train.anchors.roof : train.anchors[seat ? `${seat}Seat` : 'boarding']);
      train.root.localToWorld(anchor);
    }
    placeTraveller(rig, trackingHead, anchor, worldYaw);
    floorY = anchor.y;
    committed = true;
    return true;
  }
  // A stick teleport never changes the train's place or its doors. Stepping
  // aboard counts as boarding; stepping off at the station is just that.
  function teleport(trackingHead, point) {
    if (pending) return null;
    const target = classifyTeleport(point, train.root, distance);
    if (!target.allowed) return null;
    seat = target.roof ? 'roof' : null;
    if (target.inside || target.roof) { if (state === 'platform') state = 'boarded'; }
    else state = 'platform';
    placeTraveller(rig, trackingHead, target.anchor);
    floorY = target.anchor.y;
    return target;
  }
  return {
    get state() { return state; }, get distance() { return distance; }, get speed() { return speed; },
    get seat() { return seat; }, get moving() { return state === 'travelling'; },
    get transitioning() { return pending !== null; }, get pending() { return pending; },
    get doorOpen() { return doorOpen; },
    get floorHeight() { return floorY; },
    get eyeHeight() { return seat && seat !== 'roof' ? 1.2 : 1.65; },
    get onRoof() { return seat === 'roof'; },
    get outdoors() { return state === 'platform' || seat === 'roof'; },
    get journeyLabel() {
      return state === 'platform' ? 'Board train' : state === 'travelling' ? 'Pause journey' : state === 'arrived' ? 'Journey complete' : distance > 0 ? 'Continue journey' : 'Depart';
    },
    get seatLabel() { return seat === 'left' ? 'Take right window seat' : seat === 'right' ? 'Take left window seat' : 'Choose window seat'; },
    get roofLabel() { return seat === 'roof' ? 'On the roof' : 'Stand on the roof'; },
    request, commitPlacement, teleport,
    finishTransition() { if (committed) { pending = null; committed = false; } },
    pause,
    toggleJourney() {
      if (pending || state === 'platform' || state === 'arrived') return false;
      if (state === 'travelling') pause();
      else { doors(false); state = 'travelling'; }
      return true;
    },
    update(dt) {
      if (pending || state !== 'travelling') return false;
      speed = smoothSpeed(speed, true, dt, ROUTE_LENGTH - distance);
      const next = advanceJourney(distance, speed, dt);
      delta.set(0, 0, distance - next);
      translateTraveller(rig, train.root, ticket, delta);
      distance = next;
      if (distance >= ROUTE_LENGTH) { state = 'arrived'; speed = 0; return true; }
      return false;
    },
  };
}
