import { Matrix4, Vector3 } from 'three';

const composed = new Matrix4();
const before = new Vector3();
const after = new Vector3();
const forward = new Vector3();

// XRFrame's viewer transform is tracking-local. The rig supplies locomotion.
// ArrayCamera world getters must not be used: that camera has no rig parent.
export function readHeadPose(rig, trackingMatrix, position, direction) {
  rig.updateWorldMatrix(true, false);
  composed.multiplyMatrices(rig.matrixWorld, trackingMatrix);
  position.setFromMatrixPosition(composed);
  direction.set(0, 0, -1).transformDirection(composed);
}

export function snapAroundHead(rig, trackingMatrix, angle) {
  readHeadPose(rig, trackingMatrix, before, forward);
  rig.rotation.y += angle;
  readHeadPose(rig, trackingMatrix, after, forward);
  // The locomotion rig is a direct child of the untransformed scene.
  rig.position.add(before.sub(after));
  rig.updateWorldMatrix(true, false);
}

// Explicitly open the ticket at a consistent offset from the actual head.
// Its last horizontal yaw is a stable fallback when looking straight up/down;
// no floor clamp changes the placement for seated or very short visitors.
export function placeTicket(ticket, head, facing) {
  forward.copy(facing);forward.y=0;
  if(forward.lengthSq()<.001)forward.set(-Math.sin(ticket.rotation.y),0,-Math.cos(ticket.rotation.y));
  forward.normalize();
  ticket.position.copy(head).addScaledVector(forward,.9);
  ticket.position.y=head.y-.22;
  ticket.rotation.set(0,Math.atan2(-forward.x,-forward.z),0,'YXZ');
}

// The headset occasionally reports a floor that is not where the real floor is,
// most often when a session begins before the room's floor is established. The
// visitor then stands a metre or more above the boards, or sinks into them. A
// tracked head height no human could have is treated as a wrong floor: the rig
// is re-levelled so the eyes sit at standing height, and the correction eases
// away again once the headset reports a believable height.
export const STANDING_EYE_HEIGHT = 1.62;
export const PLAUSIBLE_HEAD_HEIGHT = Object.freeze({ min: .35, max: 2.3 });
export function levelCorrection(trackedHeight, current, dt) {
  if (!Number.isFinite(trackedHeight)) return current;
  const plausible = trackedHeight >= PLAUSIBLE_HEAD_HEIGHT.min && trackedHeight <= PLAUSIBLE_HEAD_HEIGHT.max;
  const target = plausible ? 0 : STANDING_EYE_HEIGHT - trackedHeight;
  const rate = plausible ? 2.5 : .9;
  const step = Math.min(Math.max(dt, 0), .1);
  return current + (target - current) * (1 - Math.exp(-step * rate));
}
