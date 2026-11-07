import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Once in a day, around golden hour, something enormous and slow passes high
// through the cloud banks: a pale whale, fins spread like wings, calling once
// or twice across the water. It is far, it is rare, and it never comes closer.
export const CROSSING = { seconds: 170, cooldown: 900, altitude: 150, distance: 300, span: 1300, scale: 2.3 };

// Pure schedule. The whale sets out when golden light arrives and at least a
// cooldown has passed since its last crossing; it never starts in the dark.
export function whaleSchedule(time, golden, state) {
  if (state.start !== null) {
    if (time - state.start >= CROSSING.seconds) return { start: null, last: time };
    return state;
  }
  if (golden > .55 && time - state.last >= CROSSING.cooldown) return { start: time, last: state.last };
  return state;
}

export function whaleGeometry() {
  const parts = [];
  const back = new THREE.Color('#c3d1df'), belly = new THREE.Color('#f3f5f7'), tint = new THREE.Color();
  const add = (geometry) => {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    const p = g.attributes.position, colors = new Float32Array(p.count * 3);
    for (let k = 0; k < p.count; k++) tint.copy(belly).lerp(back, THREE.MathUtils.clamp(p.getY(k) / 3.2 + .55, 0, 1)).toArray(colors, k * 3);
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3)); parts.push(g);
  };
  const body = new THREE.SphereGeometry(1, 28, 18); body.scale(3.4, 3.0, 19);
  const p = body.attributes.position;
  for (let k = 0; k < p.count; k++) {
    const z = p.getZ(k), s = z / 19;
    const taper = s < 0 ? 1 - .72 * (-s) ** 1.6 : 1 - .35 * s ** 2.2;
    const throat = 1 + .12 * Math.max(0, s) * (p.getY(k) < 0 ? 1 : 0);
    p.setXYZ(k, p.getX(k) * taper * throat, p.getY(k) * taper, z);
  }
  body.computeVertexNormals(); add(body);
  for (const side of [-1, 1]) {
    const fin = new THREE.SphereGeometry(1, 14, 8); fin.scale(9, .45, 2.6);
    const q = fin.attributes.position;
    for (let k = 0; k < q.count; k++) { const x = q.getX(k) / 9; q.setXYZ(k, q.getX(k), q.getY(k) * (1 - .6 * Math.abs(x)) - Math.abs(x) * 2.2 * Math.abs(x), q.getZ(k) * (1 - .45 * Math.abs(x))); }
    fin.computeVertexNormals(); fin.rotateY(side * .35); fin.translate(side * 8.5, -.8, 4); add(fin);
  }
  const fluke = new THREE.SphereGeometry(1, 16, 6); fluke.scale(8.5, .35, 3);
  const f = fluke.attributes.position;
  for (let k = 0; k < f.count; k++) { const x = f.getX(k) / 8.5; f.setXYZ(k, f.getX(k), f.getY(k), f.getZ(k) * (1 - .55 * Math.abs(x)) - Math.abs(x) * 1.6); }
  fluke.computeVertexNormals(); fluke.translate(0, .3, -18.5); add(fluke);
  for (const side of [-1, 1]) { const eye = new THREE.SphereGeometry(.28, 8, 6); eye.translate(side * 2.6, .2, 12.5); add(eye); }
  const merged = mergeGeometries(parts); parts.forEach(g => g.dispose()); return merged;
}

export function createSkyWhale(scene, { reducedMotion = false, onEvent = () => {} } = {}) {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, emissive: '#dfe6ee', emissiveIntensity: .12, fog: true });
  const whale = new THREE.Mesh(whaleGeometry(), material);
  whale.name = 'The sky whale'; whale.visible = false; whale.frustumCulled = false; whale.scale.setScalar(CROSSING.scale); scene.add(whale);
  let state = { start: null, last: -CROSSING.cooldown }, direction = 1, zBase = 0, called = 0;
  function update(time, viewer, dt, light) {
    const next = whaleSchedule(time, light.golden, state);
    if (next.start !== null && state.start === null) { direction = Math.random() < .5 ? -1 : 1; zBase = viewer.z; called = 0; onEvent('whale', light); }
    state = next;
    whale.visible = state.start !== null;
    if (!whale.visible) return;
    const age = time - state.start, u = age / CROSSING.seconds, t = reducedMotion ? 0 : time;
    const x = direction * (u * 2 - 1) * CROSSING.span;
    const bow = Math.sin(u * Math.PI);
    whale.position.set(x, CROSSING.altitude + bow * 40 + Math.sin(t * .11) * 6, zBase - CROSSING.distance - bow * 140);
    whale.rotation.set(Math.sin(t * .09) * .06 - .04, direction > 0 ? Math.PI / 2 : -Math.PI / 2, Math.sin(t * .07) * .08, 'YXZ');
    whale.rotation.y += direction * (u - .5) * .5;
    if (age > 18 * (called + 1) && called < 3) { called++; onEvent('whale-call', light); }
  }
  return { whale, update, get crossing() { return state.start !== null; } };
}
