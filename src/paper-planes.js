import * as THREE from 'three';
import { wrapAround } from './life.js';

// A few folded paper planes glide about the visitor on the same breeze as the
// petals: long shallow swoops, lazy banks, now and then a stall and a dip.
// One instanced mesh; nothing here is a creature, only paper and air.
export const PLANE_COUNT = 6, PLANE_RANGE = 22;

export function paperPlaneGeometry() {
  // Folded from a sheet: two wings from a central crease, with small keel flaps.
  const nose = [0, 0, .13], tail = [0, 0, -.1], keel = [0, -.035, -.02];
  const tri = (a, b, c) => [...a, ...b, ...c];
  const positions = new Float32Array([
    ...tri(nose, [-.085, .01, -.1], tail), ...tri(nose, tail, [.085, .01, -.1]),
    ...tri(nose, tail, keel), ...tri(nose, keel, tail),
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// Pure flight: where plane `i` is at `time`, before wrapping around the viewer.
export function planeFlight(i, time, breeze) {
  const phase = i * 1.7, slow = .55 + (i % 3) * .12;
  const heading = Math.sin(time * .11 * slow + phase) * 1.2 + Math.sin(time * .037 + phase * 2) * 2.2;
  const speed = 1.1 + .5 * Math.sin(time * .23 + phase);
  const bank = Math.sin(time * .5 * slow + phase) * .55;
  const stall = Math.max(0, Math.sin(time * .17 * slow + phase * 3) - .82) * 6;
  return {
    vx: Math.sin(heading) * speed + breeze.x * .25, vz: Math.cos(heading) * speed + breeze.z * .25,
    vy: Math.sin(time * .6 * slow + phase) * .25 - stall * .9 + .06,
    yaw: heading, roll: bank, pitch: -.12 + Math.sin(time * .6 * slow + phase) * .2 - stall * .5,
  };
}

export function createPaperPlanes(scene, { reducedMotion = false, random = Math.random } = {}) {
  const material = new THREE.MeshStandardMaterial({ color: '#fbf6e8', side: THREE.DoubleSide, roughness: 1, emissive: '#fbf6e8', emissiveIntensity: .06, flatShading: true });
  const planes = new THREE.InstancedMesh(paperPlaneGeometry(), material, PLANE_COUNT);
  planes.name = 'Paper planes'; planes.frustumCulled = false; scene.add(planes);
  const dummy = new THREE.Object3D();
  const state = [];
  for (let i = 0; i < PLANE_COUNT; i++) state.push({ x: (random() * 2 - 1) * PLANE_RANGE, y: 1.2 + random() * 5, z: (random() * 2 - 1) * PLANE_RANGE });
  function update(time, viewer, dt, breeze, visible = true) {
    planes.visible = visible;
    if (!visible) return;
    const t = reducedMotion ? 0 : time, step = reducedMotion ? 0 : dt;
    for (let i = 0; i < PLANE_COUNT; i++) {
      const p = state[i], flight = planeFlight(i, t, breeze);
      p.x = wrapAround(p.x + flight.vx * step, viewer.x, PLANE_RANGE);
      p.z = wrapAround(p.z + flight.vz * step, viewer.z, PLANE_RANGE);
      p.y = THREE.MathUtils.clamp(p.y + flight.vy * step, viewer.y - 1.2, viewer.y + 6);
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(flight.pitch, flight.yaw, flight.roll, 'YXZ');
      dummy.updateMatrix(); planes.setMatrixAt(i, dummy.matrix);
    }
    planes.instanceMatrix.needsUpdate = true;
  }
  return { planes, update };
}
