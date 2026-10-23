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

export function placeTicket(ticket, head, facing, floorHeight) {
  forward.copy(facing);forward.y=0;
  if(forward.lengthSq()<.001)forward.set(0,0,-1);
  forward.normalize();
  ticket.position.copy(head).addScaledVector(forward,1.25);
  ticket.position.y=Math.max(floorHeight+.55,head.y-.65);
  ticket.rotation.set(-.32,Math.atan2(-forward.x,-forward.z),0,'YXZ');
}
