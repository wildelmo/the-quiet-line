import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// A small pod that keeps the train company on the open-sea side, leaping in
// turn, then peels away. At the station they pass far out now and then.
// Procedural bodies in two pigments, one merged mesh each; splashes are rings.
export const POD = 3;
export const VISIT = { seconds: 46, first: 28, every: [150, 260], side: 7.5, idle: { first: 140, every: [240, 360], side: 26 } };

export function podSchedule(time, visit, next, moving, random = Math.random) {
  // Returns the next {visit, next} for this frame. A visit is {start, mode}.
  if (visit) {
    if (time - visit.start >= VISIT.seconds) return { visit: null, next: time + VISIT.every[0] + random() * (VISIT.every[1] - VISIT.every[0]) };
    return { visit, next };
  }
  if (time >= next) return { visit: { start: time, mode: moving ? 'alongside' : 'passing' }, next };
  return { visit: null, next };
}

// Pure leap: height and pitch for dolphin `i` at age `age` seconds into a visit.
export function leap(i, age) {
  const period = 4.2 + i * .35, phase = (age + i * 1.4) % period;
  const air = 1.5, u = phase / air;
  if (phase > air) { const y = -1.1 + Math.sin((phase - air) / (period - air) * Math.PI) * -.5; return { y, pitch: Math.sin((phase - air) * 2) * .2, airborne: false, u: 0 }; }
  const y = -1.5 + 3.3 * 4 * u * (1 - u);
  return { y, pitch: (1 - 2 * u) * 1.1, airborne: y > 0, u };
}

function dolphinGeometry() {
  const parts = [];
  const add = (geometry, color) => {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    const colors = new Float32Array(g.attributes.position.count * 3), c = new THREE.Color(color);
    for (let k = 0; k < g.attributes.position.count; k++) { const y = g.attributes.position.getY(k); c.set(color).lerp(new THREE.Color('#dfe9ee'), THREE.MathUtils.clamp(-y * 4 + .2, 0, .8)).toArray(colors, k * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3)); parts.push(g);
  };
  const body = new THREE.SphereGeometry(1, 18, 12); body.scale(.19, .17, .95);
  const p = body.attributes.position;
  for (let k = 0; k < p.count; k++) { const z = p.getZ(k), taper = z < 0 ? 1 - .45 * (-z / .95) ** 1.5 : 1 - .25 * (z / .95) ** 3; p.setXYZ(k, p.getX(k) * taper, p.getY(k) * taper, z); }
  body.computeVertexNormals(); add(body, '#6d8ba6');
  const beak = new THREE.ConeGeometry(.055, .22, 10); beak.rotateX(Math.PI / 2); beak.translate(0, -.02, 1.0); add(beak, '#6d8ba6');
  const fin = new THREE.ConeGeometry(.09, .22, 4); fin.scale(1, 1, .35); fin.rotateX(-.5); fin.translate(0, .22, .1); add(fin, '#5d7a94');
  for (const side of [-1, 1]) { const flipper = new THREE.ConeGeometry(.07, .22, 4); flipper.scale(.5, 1, 1); flipper.rotateZ(side * 1.9); flipper.translate(side * .2, -.06, .35); add(flipper, '#5d7a94'); }
  const fluke = new THREE.ConeGeometry(.17, .18, 4); fluke.scale(1.6, 1, .25); fluke.rotateX(Math.PI / 2); fluke.translate(0, .02, -1.05); add(fluke, '#5d7a94');
  const merged = mergeGeometries(parts); parts.forEach(g => g.dispose()); return merged;
}

export function createDolphins(scene, { reducedMotion = false, random = Math.random, onSplash = () => {} } = {}) {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .55, emissive: '#6d8ba6', emissiveIntensity: .08 });
  const pod = new THREE.Group(); pod.name = 'The pod'; pod.visible = false; scene.add(pod);
  const geometry = dolphinGeometry();
  const dolphins = [], splashes = [];
  const splashMaterial = new THREE.MeshBasicMaterial({ color: '#f4fbff', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < POD; i++) {
    const mesh = new THREE.Mesh(geometry, material); mesh.scale.setScalar(1 + (i - 1) * .12); pod.add(mesh);
    dolphins.push({ mesh, wasAirborne: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(.3, .5, 24), splashMaterial.clone()); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; ring.visible = false; scene.add(ring);
    splashes.push({ ring, age: 10 });
  }
  let visit = null, next = VISIT.first;
  function update(time, dt, train, moving, viewerX) {
    const schedule = podSchedule(time, visit, next, moving, random); visit = schedule.visit; next = schedule.next;
    pod.visible = !!visit && !reducedMotion;
    for (const splash of splashes) {
      splash.age += dt; const a = splash.age;
      splash.ring.visible = a < 1.4; if (splash.ring.visible) { const s = .4 + a * 1.6; splash.ring.scale.set(s, s, 1); splash.ring.material.opacity = .55 * (1 - a / 1.4); }
    }
    if (!pod.visible) return;
    const age = time - visit.start, fade = Math.min(1, age / 6, (VISIT.seconds - age) / 8);
    const alongside = visit.mode === 'alongside';
    const side = alongside ? VISIT.side + (1 - fade) * 14 : VISIT.idle.side;
    const z = alongside ? train.position.z + 2 - age * .12 : train.position.z - 60 + age * 2.4;
    dolphins.forEach((d, i) => {
      const l = leap(i, age);
      const x = train.position.x + side + Math.sin(age * .5 + i) * .8 + i * 1.6, dz = z + i * 2.4 + Math.sin(age * .4 + i * 2) * 1.2;
      d.mesh.position.set(x, l.y, dz);
      d.mesh.rotation.set(-l.pitch, alongside ? 0 : Math.PI * .5 + .15, Math.sin(age * 3 + i) * .08, 'YXZ');
      if (l.airborne && !d.wasAirborne || !l.airborne && d.wasAirborne) {
        const splash = splashes[i]; splash.age = 0; splash.ring.position.set(d.mesh.position.x, .03, d.mesh.position.z);
        onSplash(THREE.MathUtils.clamp((d.mesh.position.x - viewerX) / 15, -1, 1), alongside ? .5 : .15);
      }
      d.wasAirborne = l.airborne;
    });
  }
  return { pod, update, get visiting() { return visit?.mode ?? null; } };
}
