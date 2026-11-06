// Small, independent lives on the carriage floor. Decisions are seeded, but
// movement is integrated: skipping the scene clock never teleports a creature.
export const FLOOR_Y = .9;
export const FLOOR_BOUNDS = Object.freeze({ minX: -.63, maxX: .63, minZ: -6.35, maxZ: 7.18 });
// Conservative footprints around the actual exported shoes below y=1.05.
// The moth's feet hang above these creatures, so it needs no floor obstacle.
export const FLOOR_OBSTACLES = Object.freeze([
  { x: .65, z: -1.91, radius: .37 }, { x: .65, z: 2.4, radius: .37 },
  { x: -.65, z: 2.1, radius: .37 }, { x: .65, z: -4.5, radius: .37 },
].map(Object.freeze));
export const FLOOR_FUZZBALLS = Object.freeze([
  { id: 'cinder', size: 1.05, x: -.27, z: -4.95, yaw: .3, tempo: 1.1 },
  { id: 'pip', size: .9, x: .18, z: -2.75, yaw: 2.1, tempo: 1.23 },
  { id: 'bramble', size: 1.15, x: -.30, z: -.95, yaw: -.8, tempo: .88 },
  { id: 'mote', size: 1, x: .25, z: .75, yaw: -1.7, tempo: 1.05 },
  { id: 'smudge', size: .82, x: -.18, z: 3.05, yaw: 1.3, tempo: 1.18 },
  { id: 'button', size: 1.08, x: .31, z: 5.5, yaw: -2.6, tempo: .94 },
].map(Object.freeze));
const STEP = 1 / 90, MAX_SPEED = 1.35, ACCELERATION = 3.2, BRAKING = 4.4;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const angle = x => Math.atan2(Math.sin(x), Math.cos(x));
function random(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function segmentDistance(ax, az, bx, bz, x, z) {
  const dx = bx - ax, dz = bz - az;
  const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
  return Math.hypot(ax + t * dx - x, az + t * dz - z);
}

export function createFloorScurriers({ reducedMotion = false, seed = 73621 } = {}) {
  let remainder = 0;
  const actors = FLOOR_FUZZBALLS.map((d, i) => ({ ...d, radius: .055 * d.size,
    random: random(seed + i * 7919), speed: 0, vx: 0, vz: 0, stride: i * 1.73,
    phase: 'listening', wait: .35 + i * .31, turn: d.yaw, scan: .4 + i * .17,
    targetX: d.x, targetZ: d.z, cruise: 0, deadline: 0, moving: false,
    eyes: 1, blinkIn: 1.1 + i * .67, blinkAge: -1,
  }));
  function safe(a, x, z, obstacles, padding = 0) {
    const r = a.radius + padding, b = FLOOR_BOUNDS;
    return x >= b.minX + r && x <= b.maxX - r && z >= b.minZ + r && z <= b.maxZ - r &&
      obstacles.every(o => Math.hypot(x - o.x, z - o.z) > r + o.radius);
  }
  function clearPath(a, x, z, obstacles, padding = 0) {
    return safe(a, x, z, obstacles, padding) && obstacles.every(o =>
      segmentDistance(a.x, a.z, x, z, o.x, o.z) > Math.min(a.radius + o.radius + padding,
        Math.hypot(a.x - o.x, a.z - o.z) - 1e-8));
  }
  function rest(a) {
    a.moving = false; a.wait = .35 + a.random() ** 1.8 * 3.6 / a.tempo;
    a.phase = a.random() < .65 ? 'investigating' : 'listening';
    a.turn = a.yaw + (a.random() - .5) * 1.9; a.scan = .2 + a.random() * .9;
  }
  function choose(a, obstacles, viewer) {
    for (let attempt = 0; attempt < 28; attempt++) {
      const x = (a.random() - .5) * 1.02;
      let z = clamp(a.z + (a.random() - .5) * 5.8, -6.15, 6.95);
      // Some visits pass through the traveller's neighborhood, without a
      // second gaze encounter competing with the existing perch companions.
      if (viewer?.enabled && viewer.aboard && a.random() < .23) {
        z = clamp(viewer.position[2] + (a.random() - .5) * 3.6, -6.15, 6.95);
      }
      const distance = Math.hypot(x - a.x, z - a.z);
      if (distance < .26 || distance > 3.6 || !clearPath(a, x, z, obstacles, .035)) continue;
      if (actors.some(other => other !== a && Math.hypot(x - other.x, z - other.z) < .22)) continue;
      a.targetX = x; a.targetZ = z; a.moving = true;
      a.cruise = a.random() < .23 ? .26 + .17 * a.random() : clamp((.72 + .4 * a.random()) * a.tempo, .6, MAX_SPEED);
      a.phase = a.cruise < .5 ? 'poking around' : 'scurrying';
      a.deadline = distance / a.cruise + 2.2;
      return;
    }
    rest(a);
  }
  function tick(viewer) {
    const obstacles = [...FLOOR_OBSTACLES];
    if (viewer?.aboard && viewer.position?.every(Number.isFinite)) {
      // A seated traveller's shoes sit in front of their head. The reserve also
      // keeps the boarding spot clear; transitions never push creatures away.
      const x = clamp(viewer.position[0], -.48, .48), z = viewer.position[2];
      if (z > -6.3 && z < 7.2) obstacles.push({ x, z, radius: .25, viewer: true });
    }
    for (const a of actors) {
      // If a seat change places the personal-space reserve over a creature,
      // let it leave continuously instead of snapping it outside a new disk.
      const nearby = obstacles.filter(o => !o.viewer || Math.hypot(a.x - o.x, a.z - o.z) > a.radius + o.radius);
      a.blinkIn -= STEP;
      if (a.blinkIn <= 0) { a.blinkAge = 0; a.blinkIn = 2.4 + a.random() * 5; }
      if (a.blinkAge >= 0) { a.blinkAge += STEP; if (a.blinkAge > .19) a.blinkAge = -1; }
      a.eyes = a.blinkAge < 0 ? 1 : 1 - .9 * Math.sin(Math.PI * a.blinkAge / .19) ** 2;
      if (!a.moving) {
        a.wait -= STEP; a.scan -= STEP;
        if (a.scan <= 0) {
          const friend = actors.reduce((best, other) => other !== a &&
            Math.hypot(other.x - a.x, other.z - a.z) < Math.hypot(best.x - a.x, best.z - a.z) ? other : best,
          { x: 100, z: 100 });
          a.turn = a.random() < .42 ? Math.atan2(friend.x - a.x, friend.z - a.z) : a.yaw + (a.random() - .5) * 1.6;
          a.scan = .6 + a.random() * 1.3;
        }
        if (a.wait <= 0 && a.speed < .06) choose(a, nearby, viewer);
      }
      let dx = a.targetX - a.x, dz = a.targetZ - a.z;
      const distance = Math.hypot(dx, dz);
      let targetSpeed = 0;
      if (a.moving) {
        a.deadline -= STEP;
        if ((distance < .045 && a.speed < .13) || a.deadline < 0) rest(a);
        else {
          dx /= distance || 1; dz /= distance || 1;
          // A small lateral diversion starts before bodies touch. Static
          // footprints are already excluded from goals and straight paths.
          for (const other of actors) {
            if (other === a) continue;
            const ox = a.x - other.x, oz = a.z - other.z, gap = Math.hypot(ox, oz);
            if (gap < .55) {
              const strength = (1 - gap / .55) ** 2 * 2;
              dx += ox / (gap || 1) * strength; dz += oz / (gap || 1) * strength;
              if ((other.x - a.x) * Math.sin(a.yaw) + (other.z - a.z) * Math.cos(a.yaw) > 0) {
                // Consistent right-hand passing avoids symmetric head-on dithering.
                dx += Math.cos(a.yaw) * strength * .65; dz -= Math.sin(a.yaw) * strength * .65;
              }
            }
          }
          a.turn = Math.atan2(dx, dz);
          const alignment = Math.max(0, Math.cos(angle(a.turn - a.yaw)));
          targetSpeed = Math.min(a.cruise, Math.sqrt(2 * BRAKING * Math.max(0, distance - .025))) * alignment ** 2;
        }
      }
      a.yaw = angle(a.yaw + clamp(angle(a.turn - a.yaw), -STEP * 7, STEP * 7));
      a.speed += clamp(targetSpeed - a.speed, -BRAKING * STEP, ACCELERATION * STEP);
      const x = a.x + Math.sin(a.yaw) * a.speed * STEP, z = a.z + Math.cos(a.yaw) * a.speed * STEP;
      const peers = actors.filter(other => other !== a);
      const blocked = !clearPath(a, x, z, nearby) || peers.some(other =>
        segmentDistance(a.x, a.z, x, z, other.x, other.z) < a.radius + other.radius + .008);
      if (blocked) {
        a.speed = 0; a.vx = 0; a.vz = 0;
        rest(a); a.wait = .12 + a.random() * .45;
      } else {
        a.vx = (x - a.x) / STEP; a.vz = (z - a.z) / STEP;
        a.stride += Math.hypot(x - a.x, z - a.z) / (.13 * a.size) * Math.PI * 2;
        a.x = x; a.z = z;
      }
    }
  }
  const snapshot = () => actors.map(a => ({ id: a.id, size: a.size, radius: a.radius,
    position: [a.x, FLOOR_Y, a.z], facing: a.yaw, speed: a.speed,
    velocity: [a.vx, 0, a.vz], phase: a.phase, stride: a.stride, eyes: a.eyes,
  }));
  return {
    update(dt, viewer) {
      if (reducedMotion || !Number.isFinite(dt) || dt <= 0) return snapshot();
      remainder += Math.min(dt, .1);
      while (remainder + 1e-10 >= STEP) { tick(viewer); remainder -= STEP; }
      return snapshot();
    },
    get state() { return snapshot(); },
  };
}
