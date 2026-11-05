import * as THREE from 'three';

// Things that cross the sky now and then: a few near painted clouds drifting on
// the wind, a far-off train gliding over the sea, and a small plane going
// somewhere slowly. Visitors appear on a calm schedule, never all at once.

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

function cloudTexture(seed) {
  let s = seed;const rand = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const canvas = document.createElement('canvas');canvas.width = 256;canvas.height = 192;
  const ctx = canvas.getContext('2d');
  // Gouache cumulus: a flat lavender underside, a dome of cream lobes, sunlit tops.
  const base = 138;
  const puff = (x, y, r, shade) => {
    const g = ctx.createRadialGradient(x, y, r * .15, x, y, r);
    g.addColorStop(0, shade);g.addColorStop(.8, shade);g.addColorStop(1, shade + '00');
    ctx.fillStyle = g;ctx.beginPath();ctx.arc(x, y, r, 0, Math.PI * 2);ctx.fill();
  };
  for (let x = 44; x <= 212; x += 14) puff(x, base - 6 + rand() * 4, 18 + rand() * 6, '#c4cfe6');
  const lobes = [];
  for (let i = 0; i < 14; i++) {
    const x = 50 + rand() * 156, dome = Math.sin(Math.PI * (x - 30) / 196);
    lobes.push({ x, y: base - 12 - dome * (42 + rand() * 30), r: 20 + rand() * 16 + dome * 8 });
  }
  lobes.sort((a, b) => b.y - a.y);
  for (const lobe of lobes) puff(lobe.x, lobe.y, lobe.r, lobe.y > base - 40 ? '#e6e5ee' : '#fdf8ec');
  for (const lobe of lobes.slice(-5)) puff(lobe.x - lobe.r * .15, lobe.y - lobe.r * .3, lobe.r * .7, '#ffffff');
  const texture = new THREE.CanvasTexture(canvas);texture.colorSpace = THREE.SRGBColorSpace;return texture;
}

export function createSkyLife(scene, { reducedMotion = false, random = Math.random, onEvent = () => {} } = {}) {
  const group = new THREE.Group();group.name = 'Sky life';scene.add(group);

  // Near clouds, placed between the viewer and the painted horizon for depth.
  const cloudMaterials = [0, 1, 2].map(i => new THREE.SpriteMaterial({ map: cloudTexture(911 + i * 37), transparent: true, depthWrite: false, fog: true, opacity: .85 }));
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    const sprite = new THREE.Sprite(cloudMaterials[i % 3]);
    const angle = i / 9 * Math.PI * 2 + random() * .5, distance = 520 + random() * 700;
    const scale = 110 + random() * 150;
    sprite.scale.set(scale, scale * .75, 1);
    sprite.renderOrder = -5;
    clouds.push({ sprite, angle, distance, height: 70 + random() * 120, drift: .35 + random() * .5 });
    group.add(sprite);
  }

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
    for (const cloud of clouds) {
      const angle = cloud.angle + t * .0018 * cloud.drift;
      cloud.sprite.position.set(viewer.x + Math.cos(angle) * cloud.distance, cloud.height, viewer.z + Math.sin(angle) * cloud.distance);
    }
    const cloudTint = light.cloudTint;
    for (const material of cloudMaterials) material.color.copy(cloudTint);

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
  return { group, update, clouds, train, plane, get visitors() { return { train: trainStart !== null, plane: planeStart !== null }; } };
}
