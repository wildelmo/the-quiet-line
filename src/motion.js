export const WAYPOINTS = [
  { name: 'The little station', x: 0, y: 0.32, z: 4 },
  { name: 'Out in the blue', x: 0, y: 0.22, z: -85 },
  { name: 'The far signal', x: 0, y: 0.22, z: -320 },
];
export const ROUTE_END = -1100;
export function smoothSpeed(current, moving, dt) {
  return current + ((moving ? 1.35 : 0) - current) * (1 - Math.exp(-Math.min(dt, .05) * .75));
}
export function advanceJourney(z, speed, dt) { return Math.max(ROUTE_END, z - speed * Math.min(dt, .05)); }
export function snapDirection(axis, latched) {
  if (Math.abs(axis) < .25) return { turn: 0, latched: false };
  if (!latched && Math.abs(axis) > .7) return { turn: -Math.sign(axis) * Math.PI / 6, latched: true };
  return { turn: 0, latched };
}
export function validTeleport(point, origin) {
  return Number.isFinite(point.x) && Number.isFinite(point.z) && Math.abs(point.x) < 20 && point.z <= 8 && point.z >= ROUTE_END && Math.hypot(point.x - origin.x, point.z - origin.z) <= 35;
}
