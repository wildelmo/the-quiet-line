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
// The pitch follows the arc of travel, nose up on the way out and down on the
// way back in, so the body reads as a porpoising dive rather than a pivot.
export function leap(i, age) {
  const period = 4.2 + i * .35, phase = (age + i * 1.4) % period;
  const air = 1.5, u = phase / air;
  if (phase > air) {
    const w = (phase - air) / (period - air);
    const y = -1.1 - .5 * Math.sin(w * Math.PI);
    return { y, pitch: -.5 * Math.cos(w * Math.PI) * Math.PI / (period - air) * .35, airborne: false, u: 0 };
  }
  const y = -1.5 + 3.3 * 4 * u * (1 - u);
  const vy = 3.3 * 4 * (1 - 2 * u) / air;
  return { y, pitch: Math.atan2(vy, 6.5), airborne: y > 0, u };
}

// A dolphin's profile, revolved: rostrum, melon, deep chest, slim peduncle.
function dolphinGeometry() {
  const parts = [];
  const back = new THREE.Color('#5f7d99'), flank = new THREE.Color('#9fb6c8'), belly = new THREE.Color('#eef3f5'), tint = new THREE.Color();
  const add = (geometry) => {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    const p = g.attributes.position, colors = new Float32Array(p.count * 3);
    for (let k = 0; k < p.count; k++) {
      const y = p.getY(k);
      tint.copy(y < -.02 ? belly : flank).lerp(back, THREE.MathUtils.clamp(y * 5 + .3, 0, 1)).toArray(colors, k * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3)); parts.push(g);
  };
  const profile = [[.012, 1.12], [.045, 1.02], [.075, .93], [.125, .8], [.165, .6], [.19, .3], [.195, 0], [.18, -.3], [.14, -.55], [.09, -.78], [.055, -.95], [.04, -1.05], [.03, -1.1]];
  const body = new THREE.LatheGeometry(profile.map(([r, z]) => new THREE.Vector2(r, z)), 20);
  body.rotateX(-Math.PI / 2); // profile axis from +y to +z: nose forward along +z
  body.computeVertexNormals(); add(body);
  const fin = (points, depth) => { const shape = new THREE.Shape(); shape.moveTo(...points[0]); for (const [x, y, cx, cy] of points.slice(1)) cx === undefined ? shape.lineTo(x, y) : shape.quadraticCurveTo(cx, cy, x, y); shape.closePath(); const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g; };
  // Dorsal fin: swept back, drawn in the (z, y) plane then turned to stand on the back.
  const dorsal = fin([[.14, 0], [.02, .17, .12, .16], [-.14, .22, -.06, .23], [-.22, 0, -.2, .1]], .028);
  dorsal.rotateY(Math.PI / 2); dorsal.translate(0, .16, .02); add(dorsal);
  // Flukes: horizontal, two lobes with a notch, drawn in the (x, z) plane.
  const flukes = fin([[0, .06], [.26, .12, .1, .16], [.3, -.02, .34, .08], [.03, -.06, .14, -.07], [-.03, -.06], [-.3, -.02, -.14, -.07], [-.26, .12, -.34, .08], [0, .06, -.1, .16]], .02);
  flukes.rotateX(Math.PI / 2); flukes.translate(0, 0, -1.12); add(flukes);
  // Flippers: small swept paddles low on the chest.
  for (const side of [-1, 1]) {
    const flipper = fin([[0, 0], [.2, -.05, .1, .02], [.22, -.13, .24, -.09], [.02, -.08, .1, -.14]], .02);
    flipper.rotateZ(side * -.9); flipper.rotateY(side > 0 ? 0 : Math.PI); flipper.translate(side * .12, -.1, .45); add(flipper);
  }
  for (const side of [-1, 1]) { const eye = new THREE.SphereGeometry(.016, 8, 6); eye.translate(side * .1, .03, .82); add(eye); }
  const merged = mergeGeometries(parts); parts.forEach(g => g.dispose()); return merged;
}

// The tail beats up and down in the vertex shader: the bend grows from the
// chest to the flukes, so the head stays steady while the body swims.
function swimmingMaterial() {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .5, emissive: '#5f7d99', emissiveIntensity: .07 });
  material.userData.swim = { value: 0 }; material.userData.beat = { value: 1 };
  material.onBeforeCompile = shader => {
    shader.uniforms.swim = material.userData.swim; shader.uniforms.beat = material.userData.beat;
    shader.vertexShader = 'uniform float swim; uniform float beat;\n' + shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      float tailward = clamp((.35 - position.z) / 1.45, 0.0, 1.0);
      float bend = sin(swim - position.z * 1.9) * beat * .16 * tailward * tailward;
      transformed.y += bend;
      transformed.z -= bend * bend * .6;
    `);
  };
  material.customProgramCacheKey = () => 'quiet-line-dolphin-swim-v1';
  return material;
}

export function createDolphins(scene, { reducedMotion = false, random = Math.random, onSplash = () => {} } = {}) {
  const pod = new THREE.Group(); pod.name = 'The pod'; pod.visible = false; scene.add(pod);
  const geometry = dolphinGeometry();
  const dolphins = [], splashes = [];
  const splashMaterial = new THREE.MeshBasicMaterial({ color: '#f4fbff', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < POD; i++) {
    const material = swimmingMaterial();
    const mesh = new THREE.Mesh(geometry, material); mesh.scale.setScalar(1.15 + (i - 1) * .12); pod.add(mesh);
    dolphins.push({ mesh, material, wasAirborne: false });
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
      // Nose forward: alongside, that is the train's way (-z); passing, across the view.
      d.mesh.rotation.set(l.pitch, alongside ? Math.PI : Math.PI * .5 + .15, Math.sin(age * .9 + i) * .06, 'YXZ');
      d.material.userData.swim.value = reducedMotion ? 0 : time * (l.airborne ? 4 : 7.5) + i * 2.1;
      d.material.userData.beat.value = l.airborne ? .35 : 1;
      if (l.airborne && !d.wasAirborne || !l.airborne && d.wasAirborne) {
        const splash = splashes[i]; splash.age = 0; splash.ring.position.set(d.mesh.position.x, .03, d.mesh.position.z);
        onSplash(THREE.MathUtils.clamp((d.mesh.position.x - viewerX) / 15, -1, 1), alongside ? .5 : .15);
      }
      d.wasAirborne = l.airborne;
    });
  }
  return { pod, update, get visiting() { return visit?.mode ?? null; } };
}
