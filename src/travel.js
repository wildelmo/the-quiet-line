import { Vector3 } from 'three';
import { readHeadPose } from './xr-pose.js';

const head = new Vector3(), facing = new Vector3();

// The physical play-space origin is not necessarily where the person stands.
// Board at their current horizontal head position, keeping the tracked height.
// Do this only when boarding/repositioning, so leaning or walking still works.
export function boardTravelDeck(rig, trackingHead, deck) {
  readHeadPose(rig, trackingHead, head, facing);
  deck.position.set(head.x, rig.position.y, head.z);
  deck.rotation.set(0, 0, 0);
}

// Rejoin the full station from an observation deck. Its original boarding spot
// is (0, .32, 4); preserve that relationship at the viewer's current location.
export function boardStation(rig, trackingHead, station) {
  readHeadPose(rig, trackingHead, head, facing);
  station.position.set(head.x, rig.position.y - .32, head.z - 4);
}

// One translation carries the camera/controller rig, platform, and ticket.
// The platform is independent of head tracking and snap-turn pivot corrections.
export function translateTraveller(rig, deck, ticket, delta) {
  rig.position.add(delta);
  deck.position.add(delta);
  ticket.position.add(delta);
  rig.updateWorldMatrix(true, true);
}
