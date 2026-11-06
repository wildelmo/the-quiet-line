import * as THREE from 'three';

// Small living things close to the visitor. Everything here is instanced or a
// handful of tiny meshes, so the whole layer costs a few draw calls.

const PETAL_COUNT = 110, PETAL_RANGE = 26;
const FIREFLY_COUNT = 70, SEALIGHT_COUNT = 48;

// A steady summer breeze with slow gusts. Pure, so it can be shared and tested.
export function wind(time) {
  const gust = .55 + .45 * Math.sin(time * .17) * Math.sin(time * .071 + 1.3);
  return { x: 1.3 + gust * 1.4, z: .35 + .5 * Math.sin(time * .09), gust };
}
// Keep a drifting particle inside a box around the viewer by wrapping it over.
export function wrapAround(value, centre, range) {
  let v = value;
  while (v < centre - range) v += range * 2;
  while (v > centre + range) v -= range * 2;
  return v;
}

export function createLife(scene, station, { reducedMotion = false, random = Math.random } = {}) {
  const dummy = new THREE.Object3D();

  // Petals: pale pink paper-thin ovals, tumbling on the wind from somewhere unseen.
  const petalGeo = new THREE.CircleGeometry(.032, 7);petalGeo.scale(1, 1.55, 1);
  const petalMat = new THREE.MeshBasicMaterial({ color: '#ffe3ea', side: THREE.DoubleSide, transparent: true, opacity: .88, fog: true });
  const petals = new THREE.InstancedMesh(petalGeo, petalMat, PETAL_COUNT);petals.frustumCulled = false;scene.add(petals);
  const petalState = [];
  for (let i = 0; i < PETAL_COUNT; i++) petalState.push({
    x: (random() * 2 - 1) * PETAL_RANGE, y: .4 + random() * 7, z: (random() * 2 - 1) * PETAL_RANGE,
    phase: random() * 6.28, spin: (random() * 2 - 1) * 2.2, fall: .18 + random() * .25, sway: .6 + random() * .8,
  });

  // Butterflies at the plant pots: two wings each, with a lazy wandering loop.
  const wingGeo = new THREE.CircleGeometry(.045, 6);wingGeo.translate(.04, 0, 0);
  const butterflies = [];
  for (let i = 0; i < 3; i++) {
    const colour = ['#fff9e1', '#fbe6a8', '#f7f1ff'][i];
    const mat = new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide });
    const group = new THREE.Group();
    const left = new THREE.Mesh(wingGeo, mat), right = new THREE.Mesh(wingGeo, mat);
    right.rotation.y = Math.PI;group.add(left, right);group.rotation.x = -Math.PI / 2;
    const anchor = new THREE.Group();anchor.position.set([-2.65, -5.05, -5.05][i], 1.05, [4.03, 3.35, 6.86][i]);anchor.add(group);
    station.add(anchor);
    butterflies.push({ group, left, right, phase: random() * 6.28, speed: .5 + random() * .3 });
  }

  // Fireflies around the station and soft blue sea-lights above the water.
  const sparkGeo = new THREE.SphereGeometry(.02, 6, 5);
  const fireflyMat = new THREE.MeshBasicMaterial({ color: '#ffd978', transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false });
  const fireflies = new THREE.InstancedMesh(sparkGeo, fireflyMat, FIREFLY_COUNT);fireflies.frustumCulled = false;station.add(fireflies);
  const fireflyState = [];
  for (let i = 0; i < FIREFLY_COUNT; i++) fireflyState.push({ x: -7 + random() * 10, y: .5 + random() * 3.2, z: .5 + random() * 8.5, phase: random() * 6.28, rate: .6 + random() * 1.4 });
  const seaMat = new THREE.MeshBasicMaterial({ color: '#8fd8ff', transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false });
  const seaLights = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 6, 5), seaMat, SEALIGHT_COUNT);seaLights.frustumCulled = false;scene.add(seaLights);
  const seaState = [];
  for (let i = 0; i < SEALIGHT_COUNT; i++) seaState.push({ x: (random() * 2 - 1) * 40, z: (random() * 2 - 1) * 40, phase: random() * 6.28, rate: .25 + random() * .5 });

  function update(time, viewer, dt, light, sharedBreeze) {
    const t = reducedMotion ? 0 : time;
    const breeze = sharedBreeze || wind(t);
    const motion = reducedMotion ? 0 : dt;
    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = petalState[i];
      p.x += (breeze.x * .9 + Math.sin(t * p.sway + p.phase) * .6) * motion;
      p.z += (breeze.z + Math.cos(t * p.sway * .7 + p.phase) * .5) * motion;
      p.y += (Math.sin(t * 1.3 + p.phase * 2) * .35 - p.fall) * motion;
      p.x = wrapAround(p.x, viewer.x, PETAL_RANGE);p.z = wrapAround(p.z, viewer.z, PETAL_RANGE);
      if (p.y < .25) p.y = 5 + random() * 4;
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(t * p.spin + p.phase, t * p.spin * .7, Math.sin(t + p.phase) * 1.2);
      dummy.updateMatrix();petals.setMatrixAt(i, dummy.matrix);
    }
    petals.instanceMatrix.needsUpdate = true;petalMat.opacity = .88 - .45 * light.night;

    for (const b of butterflies) {
      const a = t * b.speed + b.phase;
      b.group.position.set(Math.cos(a) * .32 + Math.sin(a * 2.3) * .12, .22 + Math.sin(a * 1.7) * .18 + Math.max(0, Math.sin(a * 5.1)) * .1, Math.sin(a) * .3);
      b.group.rotation.z = -a + Math.PI / 2;
      const flap = reducedMotion ? .5 : Math.sin(t * 15 + b.phase) * .95;
      b.left.rotation.y = flap;b.right.rotation.y = Math.PI - flap;
    }

    const glow = light.fireflies;
    fireflyMat.opacity = .9 * glow;seaMat.opacity = .75 * glow;
    fireflies.visible = glow > .01;seaLights.visible = glow > .01;
    if (fireflies.visible) {
      for (let i = 0; i < FIREFLY_COUNT; i++) {
        const f = fireflyState[i];
        const pulse = Math.max(0, Math.sin(t * f.rate + f.phase)) ** 3;
        const s = glow * (.35 + 1.0 * pulse);
        dummy.position.set(f.x + Math.sin(t * .31 + f.phase) * 1.1, f.y + Math.sin(t * .47 + f.phase * 2) * .5, f.z + Math.cos(t * .27 + f.phase) * 1.1);
        dummy.rotation.set(0, 0, 0);dummy.scale.setScalar(s);dummy.updateMatrix();fireflies.setMatrixAt(i, dummy.matrix);
      }
      fireflies.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < SEALIGHT_COUNT; i++) {
        const f = seaState[i];
        const pulse = .5 + .5 * Math.sin(t * f.rate + f.phase);
        dummy.position.set(wrapAround(f.x + t * .12, viewer.x, 40), .25 + pulse * 1.6 + Math.sin(t * .2 + f.phase) * .4, wrapAround(f.z + Math.sin(t * .05 + f.phase) * 3, viewer.z, 40));
        dummy.rotation.set(0, 0, 0);dummy.scale.setScalar(glow * (.3 + pulse * 1.1));dummy.updateMatrix();seaLights.setMatrixAt(i, dummy.matrix);
      }
      seaLights.instanceMatrix.needsUpdate = true;
    }
  }
  return { update, petals, butterflies, fireflies, seaLights };
}
