import * as THREE from 'three';

// A far-off train glides over the sea; a small plane is going somewhere slowly.
// Painted clouds live in shaders.js and cloud-dancer.js. These visitors follow
// a calm schedule, with staggered first arrivals.

export const TRAIN_CROSSING = { halfWidth: 760, seconds: 118, ahead: 380, height: 0, first: 75, every: [230, 330] };
export const PLANE_CROSSING = { halfWidth: 1100, seconds: 140, ahead: 400, first: 170, every: [280, 420] };

// Pure scheduling: where along the crossing a visitor is for a given elapsed
// time, or null while it is away. `start` is when the current crossing began.
export function crossingProgress(time, start, seconds) {
  if (start === null || time < start) return null;
  const progress = (time - start) / seconds;
  return progress >= 1 ? null : progress;
}
export function nextCrossing(time, every, random = Math.random) {
  return time + every[0] + random() * (every[1] - every[0]);
}

export function createSkyLife(scene, { reducedMotion = false, random = Math.random, onEvent = () => {} } = {}) {
  const group = new THREE.Group();group.name = 'Sky life';scene.add(group);

  // A far train with warm windows. Evening makes it glow; by day it is a quiet silhouette.
  const train = new THREE.Group();train.visible = false;group.add(train);
  const hull = new THREE.MeshStandardMaterial({ color: '#2b3a3a', roughness: .9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: '#5c5248', roughness: 1 });
  const windowMat = new THREE.MeshStandardMaterial({ color: '#f4e2b6', emissive: '#ffcf7a', emissiveIntensity: 0, roughness: 1 });
  for (let car = 0; car < 4; car++) {
    const x = (car - 1.5) * 13.4;
    const body = new THREE.Mesh(new THREE.BoxGeometry(12.6, 3.1, 2.9), hull);body.position.set(x, 1.9, 0);train.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(12.9, .5, 3.2), roofMat);roof.position.set(x, 3.65, 0);train.add(roof);
    for (const side of [-1, 1]) {
      const windows = new THREE.Mesh(new THREE.BoxGeometry(car === 0 ? 7.5 : 11, 1.1, .08), windowMat);
      windows.position.set(x + (car === 0 ? 2 : 0), 2.25, side * 1.5);train.add(windows);
    }
  }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.45, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff2c4' }));lamp.position.set(-27.5, 2, 0);train.add(lamp);
  let trainStart = null, trainNext = TRAIN_CROSSING.first, trainZ = 0, trainDirection = 1;

  // A little cheerful plane, high and far, with a spinning propeller.
  const plane = new THREE.Group();plane.visible = false;plane.scale.setScalar(1.7);group.add(plane);
  const cream = new THREE.MeshStandardMaterial({ color: '#f1e3bf', roughness: .8 });
  const yellow = new THREE.MeshStandardMaterial({ color: '#e8b84d', roughness: .8 });
  const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(.9, 6.5, 4, 10), cream);fuselage.rotation.z = Math.PI / 2;plane.add(fuselage);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.2, .18, 13), yellow);wing.position.set(.6, .5, 0);plane.add(wing);
  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(1.3, .14, 4.2), yellow);tailWing.position.set(-3.6, .3, 0);plane.add(tailWing);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.7, .14), yellow);fin.position.set(-3.7, 1.1, 0);plane.add(fin);
  const propeller = new THREE.Mesh(new THREE.BoxGeometry(.12, 2.6, .25), new THREE.MeshStandardMaterial({ color: '#4a4036' }));propeller.position.set(4.25, 0, 0);plane.add(propeller);
  const floats = new THREE.Mesh(new THREE.CapsuleGeometry(.35, 4.5, 3, 6), cream);floats.rotation.z = Math.PI / 2;floats.position.set(.3, -1.5, 0);plane.add(floats);
  let planeStart = null, planeNext = PLANE_CROSSING.first, planeZ = 0, planeDirection = -1;

  function update(time, viewer, dt, light) {
    const t = reducedMotion ? 0 : time;
    // Train crossing, from one side of the sea to the other, well ahead of the viewer.
    if (trainStart === null && time >= trainNext) {
      trainStart = time;trainZ = viewer.z - TRAIN_CROSSING.ahead;trainDirection = random() < .5 ? -1 : 1;
      train.visible = true;onEvent('train', light);
    }
    const trainProgress = crossingProgress(time, trainStart, TRAIN_CROSSING.seconds);
    if (trainProgress === null && trainStart !== null) { trainStart = null;train.visible = false;trainNext = nextCrossing(time, TRAIN_CROSSING.every, random); }
    if (trainProgress !== null) {
      train.position.set(trainDirection * (trainProgress * 2 - 1) * TRAIN_CROSSING.halfWidth, TRAIN_CROSSING.height, trainZ);
      train.rotation.y = trainDirection > 0 ? 0 : Math.PI;
      windowMat.emissiveIntensity = 1.6 * light.lantern;
    }

    if (planeStart === null && time >= planeNext) {
      planeStart = time;planeZ = viewer.z - PLANE_CROSSING.ahead;planeDirection = random() < .5 ? -1 : 1;
      plane.visible = true;onEvent('plane', light);
    }
    const planeProgress = crossingProgress(time, planeStart, PLANE_CROSSING.seconds);
    if (planeProgress === null && planeStart !== null) { planeStart = null;plane.visible = false;planeNext = nextCrossing(time, PLANE_CROSSING.every, random); }
    if (planeProgress !== null) {
      const x = planeDirection * (planeProgress * 2 - 1) * PLANE_CROSSING.halfWidth;
      const bow = Math.sin(planeProgress * Math.PI);
      plane.position.set(x, 120 + bow * 60, planeZ - bow * 140);
      plane.rotation.set(0, planeDirection > 0 ? 0 : Math.PI, Math.sin(t * .6) * .06 + .06, 'YXZ');
      plane.rotation.y += planeDirection * (planeProgress - .5) * .45;
      propeller.rotation.x += dt * 38;
    }
  }
  return { group, update, train, plane, get visitors() { return { train: trainStart !== null, plane: planeStart !== null }; } };
}
