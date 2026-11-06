export const HOME = { x: -4.4, y: .9, z: 2.1 };
export const ROUTE_LENGTH = 1100;
export const TRAIN_SPEED = 3;
export function smoothSpeed(current, moving, dt, remaining = Infinity) {
  const target = moving ? Math.min(TRAIN_SPEED, Math.sqrt(Math.max(0, remaining) * .8)) : 0;
  return current + (target - current) * (1 - Math.exp(-Math.min(Math.max(dt, 0), .05) * .6));
}
// Route distance is independent of room-scale offsets, seats and snap turns.
export function advanceJourney(distance, speed, dt) {
  return Math.min(ROUTE_LENGTH, distance + Math.max(0, speed) * Math.min(Math.max(dt, 0), .05));
}
export function snapDirection(axis, latched) {
  if (Math.abs(axis) < .25) return { turn: 0, latched: false };
  if (!latched && Math.abs(axis) > .7) return { turn: -Math.sign(axis) * Math.PI / 6, latched: true };
  return { turn: 0, latched };
}
