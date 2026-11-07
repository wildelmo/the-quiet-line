import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

// A small pod that keeps the train company on the open-sea side, leaping in
// turn, then peels away. At the station they pass far out now and then.
// The dolphin is Quaternius's rigged low-poly fish-pack dolphin (CC0), with
// its own swim cycle; see ASSETS.md. Splashes are rings on the water.
export const POD = 3;
export const VISIT = { seconds: 46, first: 28, every: [150, 260], side: 7.5, idle: { first: 140, every: [240, 360], side: 26 } };
// The asset is about 9.3m long in its own units; a bottlenose is nearer 2.5m.
export const DOLPHIN_SCALE = .27;
export const DOLPHIN_ASSET = 'assets/sea/dolphin.glb';

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

// Sea-blue back, cream belly: the pack's flat greys recoloured to this water.
export function paintDolphin(root) {
  root.traverse(object => {
    if (!object.isMesh && !object.isSkinnedMesh) return;
    object.frustumCulled = false; object.castShadow = false; object.receiveShadow = false;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      material.metalness = 0; material.roughness = .6;
      material.color.set(material.name === 'Bottom' ? '#eef3f5' : '#5f7d99');
      material.emissive.copy(material.color); material.emissiveIntensity = .07;
    }
  });
}

export function createDolphins(scene, { reducedMotion = false, random = Math.random, onSplash = () => {}, loader = new GLTFLoader() } = {}) {
  const pod = new THREE.Group(); pod.name = 'The pod'; pod.visible = false; scene.add(pod);
  const dolphins = [], splashes = [];
  const splashMaterial = new THREE.MeshBasicMaterial({ color: '#f4fbff', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < POD; i++) {
    const holder = new THREE.Group(); holder.scale.setScalar(DOLPHIN_SCALE * (1.05 + (i - 1) * .1)); pod.add(holder);
    dolphins.push({ holder, mixer: null, wasAirborne: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(.3, .5, 24), splashMaterial.clone()); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; ring.visible = false; scene.add(ring);
    splashes.push({ ring, age: 10 });
  }
  let loaded = false;
  loader.loadAsync(`${import.meta.env.BASE_URL}${DOLPHIN_ASSET}`).then(gltf => {
    const clip = gltf.animations.find(a => /swim/i.test(a.name)) ?? gltf.animations[0];
    dolphins.forEach((d, i) => {
      const body = cloneSkinned(gltf.scene); paintDolphin(body); d.holder.add(body);
      if (clip) { d.mixer = new THREE.AnimationMixer(body); const action = d.mixer.clipAction(clip); action.time = i * .37; action.play(); }
    });
    loaded = true;
  }).catch(error => console.warn('The pod stayed away:', error));
  let visit = null, next = VISIT.first;
  function update(time, dt, train, moving, viewerX) {
    const schedule = podSchedule(time, visit, next, moving, random); visit = schedule.visit; next = schedule.next;
    pod.visible = !!visit && !reducedMotion && loaded;
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
      d.holder.position.set(x, l.y, dz);
      // Nose forward: alongside, that is the train's way (-z); passing, across the view.
      d.holder.rotation.set(l.pitch, alongside ? Math.PI : Math.PI * .5 + .15, Math.sin(age * .9 + i) * .06, 'YXZ');
      if (d.mixer) { d.mixer.timeScale = l.airborne ? .55 : 1.3; d.mixer.update(dt); }
      if (l.airborne !== d.wasAirborne) {
        const splash = splashes[i]; splash.age = 0; splash.ring.position.set(d.holder.position.x, .03, d.holder.position.z);
        onSplash(THREE.MathUtils.clamp((d.holder.position.x - viewerX) / 15, -1, 1), alongside ? .5 : .15);
      }
      d.wasAirborne = l.airborne;
    });
  }
  return { pod, update, get visiting() { return visit?.mode ?? null; }, get loaded() { return loaded; } };
}
