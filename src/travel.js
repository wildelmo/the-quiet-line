import { Vector3 } from 'three';
import { readHeadPose } from './xr-pose.js';
import { HOME, ROUTE_LENGTH, advanceJourney, smoothSpeed } from './motion.js';

const head = new Vector3(), facing = new Vector3(), localFacing = new Vector3();

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
  let state = 'platform', distance = 0, speed = 0, seat = null;
  let pending = null, committed = false, doorOpen = true;
  train.setDoorOpen(true);
  function doors(open) { doorOpen = open; train.setDoorOpen(open); }
  function pause() { speed = 0; if (state === 'travelling') state = 'paused'; }
  function request(action) {
    if (pending || !['board', 'seat', 'home'].includes(action)) return false;
    if (action === 'board' && state !== 'platform') return false;
    if (action === 'seat' && state === 'platform') return false;
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
        seat = seat === 'left' ? 'right' : 'left';
        state = distance >= ROUTE_LENGTH ? 'arrived' : distance > 0 ? 'paused' : 'seated';
      }
      anchor.copy(train.anchors[seat ? `${seat}Seat` : 'boarding']);
      train.root.localToWorld(anchor);
    }
    placeTraveller(rig, trackingHead, anchor, worldYaw);
    committed = true;
    return true;
  }
  return {
    get state() { return state; }, get distance() { return distance; }, get speed() { return speed; },
    get seat() { return seat; }, get moving() { return state === 'travelling'; },
    get transitioning() { return pending !== null; }, get pending() { return pending; },
    get doorOpen() { return doorOpen; },
    get floorHeight() { return state === 'platform' ? HOME.y : train.root.position.y + train.anchors.boarding.y; },
    get eyeHeight() { return seat ? 1.2 : 1.65; },
    get journeyLabel() {
      return state === 'platform' ? 'Board train' : state === 'travelling' ? 'Pause journey' : state === 'arrived' ? 'Journey complete' : distance > 0 ? 'Continue journey' : 'Depart';
    },
    get seatLabel() { return seat ? `Take ${seat === 'left' ? 'right' : 'left'} window seat` : 'Choose window seat'; },
    request, commitPlacement,
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
