import { MathUtils } from 'three';

const smooth = x => { x = MathUtils.clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const mix = (a, b, t) => a.map((value, axis) => MathUtils.lerp(value, b[axis], t));
export const turnToward = (from, to, amount) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * amount;
const yawTo = (from, to) => Math.atan2(to[0] - from[0], to[2] - from[2]);
const validVector = value => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
const bump = (t, start, end) => smooth((t - start) / 2) * smooth((end - t) / 2);

function lookingAt(viewer, point, maxDistance) {
  const delta = point.map((value, axis) => value - viewer.position[axis]);
  const distance = Math.hypot(...delta), length = Math.hypot(...viewer.direction);
  if (distance < .25 || distance > maxDistance || length < .5) return false;
  return delta.reduce((sum, value, axis) => sum + value * viewer.direction[axis], 0) / (distance * length) > .975;
}

// All targets live on one existing support. The closest point is deliberately
// modest: creatures never jump into the aisle, onto a visitor, or through glass.
function destinations(index, home, viewer) {
  const near = [...home], far = [...home];
  if (index === 0) {
    near[0] = 1.18;
    near[2] = MathUtils.clamp(viewer[2], .75, 1.22);
    far[0] = 1.25;
    far[2] = near[2] < .9 ? 1.21 : .85;
  } else {
    const bounds = index === 1 ? [-4.38, -3.60] : [3.12, 4.12];
    const direction = Math.sign(viewer[2] - home[2]) || 1;
    near[2] = MathUtils.clamp(home[2] + direction * (index === 1 ? .32 : .52), ...bounds);
    far[2] = MathUtils.clamp(home[2] - direction * .19, ...bounds);
    near[0] = -.86; far[0] = -1.01;
  }
  return { near, far };
}

function twoHops(from, to, age, duration, height) {
  const half = duration / 2, leg = Math.min(1, Math.floor(age / half));
  const a = mix(from, to, leg / 2), b = mix(from, to, (leg + 1) / 2);
  const t = age - leg * half, flight = half - .30;
  const pose = { position: a, lift: 0, scaleX: 1, scaleY: 1, roll: 0, yaw: 0, eyes: 1 };
  if (t < .12) {
    const crouch = smooth(t / .12);
    pose.scaleY -= .24 * crouch; pose.scaleX += .13 * crouch;
  } else if (t < .12 + flight) {
    const u = (t - .12) / flight, arc = Math.sin(Math.PI * u);
    pose.position = mix(a, b, smooth(u));
    pose.lift = height * 2.3 * 4 * u * (1 - u);
    pose.position[1] += pose.lift;
    pose.scaleY += .12 * arc - .24 * (1 - smooth(u / .14)) - .2 * smooth((u - .87) / .13);
    pose.scaleX -= .05 * arc - .13 * (1 - smooth(u / .14)) - .12 * smooth((u - .87) / .13);
    pose.roll = .035 * arc;
  } else {
    pose.position = b;
    const settle = 1 - smooth((t - .12 - flight) / .18);
    pose.scaleY -= .2 * settle; pose.scaleX += .12 * settle;
  }
  return pose;
}

/** One shared invitation at a time, using head direction rather than eye tracking.
 * Ambient clocks freeze per actor during an encounter, then resume at the same
 * grounded pose. The attention clock advances only by bounded rendered time.
 */
export function createCompanionAttention(definitions, bodyHeight, poseAt, mousePosition, { reducedMotion = false } = {}) {
  const offsets = definitions.map(() => 0), dwell = [0, 0, 0, 0];
  let clock = 0, nextEncounter = 0, settled = 0, active = null, lastTime = 0;

  function ambient(index, time) {
    const d = definitions[index], pose = poseAt(index, time, reducedMotion);
    const t = Math.max(0, time) % d.cycle;
    const outside = reducedMotion ? 0 : Math.max(bump(t, d.start + 7, d.start + 18), bump(t, d.start + 27, d.cycle - 1));
    pose.facing = d.yaw + pose.yaw + Math.PI * outside;
    if (pose.phase === 'resting' && outside > .5) pose.phase = 'watching the view';
    return pose;
  }

  function update(time, dt, viewer) {
    const validTime = Number.isFinite(time);
    if (validTime) lastTime = time;
    else time = lastTime;
    const step = validTime && Number.isFinite(dt) ? MathUtils.clamp(dt, 0, .1) : 0;
    clock += step;
    const available = !reducedMotion && validTime && viewer?.enabled && viewer.aboard
      && validVector(viewer.position) && validVector(viewer.direction);
    settled = available ? settled + step : 0;
    if (active) {
      active.age += step;
      if (available) active.viewer = mix(active.viewer, viewer.position, 1 - Math.exp(-step * 3));
      if (active.age >= (active.index === 3 ? 5.4 : 10.7)) {
        if (active.index < 3) offsets[active.index] = time - active.held;
        active = null; nextEncounter = clock + 24; dwell.fill(0);
      }
    }
    const poses = definitions.map((_, index) => ambient(index,
      active?.index === index ? active.held : time - offsets[index]));

    if (!active && available && settled > 2.2 && clock >= nextEncounter) {
      for (let index = 0; index < 4; index++) {
        const position = index === 3 ? mousePosition : poses[index].position;
        const target = [...position]; target[1] += index === 3 ? .17 : bodyHeight * definitions[index].size * .65;
        const onHome = index === 3 || (poses[index].phase !== 'hopping' && poses[index].phase !== 'crouching'
          && poses[index].phase !== 'landing' && Math.hypot(...position.map((v, axis) => v - definitions[index].points[0][axis])) < .001);
        const noticed = onHome && lookingAt(viewer, target, index === 3 ? 3 : index === 1 ? 5.5 : 4.5);
        dwell[index] = noticed ? dwell[index] + step : Math.max(0, dwell[index] - step * 2);
        if (dwell[index] < (index === 1 ? 1.2 : .65)) continue;
        const home = [...position];
        active = { index, age: 0, held: time - (offsets[index] ?? 0), home, viewer: [...viewer.position],
          facing: index === 3 ? 1.42 : poses[index].facing,
          ...(index < 3 ? destinations(index, home, viewer.position) : {}) };
        dwell.fill(0); break;
      }
    } else if (!available) dwell.fill(0);

    let mouse = null;
    if (active?.index === 3) {
      const amount = smooth(active.age / 1.4) * (1 - smooth((active.age - 3.2) / 1.8));
      mouse = { amount, facing: yawTo(mousePosition, active.viewer), phase: 'sharing a quiet glance' };
    } else if (active) {
      const { index, age, home, near, far } = active;
      const height = bodyHeight * definitions[index].size;
      let p = { ...poses[index], position: [...home], lift: 0, eyes: 1, roll: 0, yaw: 0, scaleX: 1, scaleY: 1 };
      let desired = yawTo(home, active.viewer);
      if (age < .8) {
        p.phase = 'noticing you';
        p.facing = turnToward(active.facing, desired, smooth(age / .8));
      } else {
        if (age < 3.2) {
          Object.assign(p, twoHops(home, near, age - .8, 2.4, height)); p.phase = 'approaching you';
          desired = yawTo(p.position, active.viewer);
        } else if (age < 4.6) {
          p.position = [...near]; p.phase = 'meeting your gaze';
          p.roll = Math.sin(Math.PI * smooth((age - 3.2) / 1.4)) * .14;
          p.position[1] += Math.abs(Math.sin(p.roll)) * .027 * definitions[index].size;
          desired = yawTo(near, active.viewer);
        } else if (age < 6.3) {
          Object.assign(p, twoHops(near, far, age - 4.6, 1.7, height)); p.phase = 'scurrying away';
          desired = turnToward(yawTo(near, active.viewer), yawTo(near, far), smooth((age - 4.6) / .3));
        } else if (age < 8.3) {
          p.position = [...far]; p.phase = 'peeking back';
          desired = turnToward(yawTo(near, far), yawTo(far, active.viewer), smooth((age - 6.3) / .6));
        } else {
          Object.assign(p, twoHops(far, home, age - 8.3, 2.4, height)); p.phase = 'returning to its game';
          const returnYaw = turnToward(yawTo(far, active.viewer), yawTo(far, home), smooth((age - 8.3) / .4));
          desired = turnToward(returnYaw, poses[index].facing, smooth((age - 9.7) / 1));
        }
        p.facing = desired;
      }
      poses[index] = p;
    }
    return { fuzzballs: poses, mouse,
      state: { engaged: active ? active.index === 3 ? 'mouse' : definitions[active.index].id : null,
        phase: active?.index === 3 ? mouse.phase : active ? poses[active.index].phase : 'quiet',
        age: active?.age ?? 0 } };
  }
  return { update };
}
