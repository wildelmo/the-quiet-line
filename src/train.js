import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createTrainReader } from './train-reader.js';
import { createTrainPassengers } from './train-passengers.js';
import { createTrainCompanions } from './train-companions.js';

export const TRAIN_HOME = [0, 0, -4];
export const TRAIN_FLOOR = .9;

/** Original Blender carriage. Anchors are carriage-local floor positions. */
export async function createTrain(scene, renderer, { reducedMotion = false } = {}) {
  const { scene: root } = await new GLTFLoader().loadAsync(
    `${import.meta.env.BASE_URL}assets/train/carriage.glb`,
  );
  root.name = 'Quiet Line carriage';
  root.position.fromArray(TRAIN_HOME);
  const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const lamps = [];
  root.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (material.map) material.map.anisotropy = anisotropy;
      if (material.name === 'Quiet single layer glass') {
        material.transparent = true;
        material.opacity = .055;
        material.depthWrite = false;
        material.side = THREE.DoubleSide;
        object.renderOrder = 1;
      } else if (material.name === 'Milk glass lamps') {
        lamps.push(material);
      } else {
        // A very small pigment-colored ambient fill preserves the brushwork in
        // the covered interior without requiring extra realtime point lights.
        material.emissive.copy(material.color);
        material.emissiveMap = material.map;
        material.emissiveIntensity = .055;
      }
    }
  });
  const forward = root.getObjectByName('DoorLeftForward');
  const rear = root.getObjectByName('DoorLeftRear');
  const doorLeaves = [
    { object: forward, direction: -1, base: forward.position.clone() },
    { object: rear, direction: 1, base: rear.position.clone() },
  ];
  let doorTarget = 1;
  let doorAmount = 1;
  function placeDoors() {
    for (const { object, direction, base } of doorLeaves) {
      object.position.copy(base);
      object.position.z += direction * .74 * doorAmount;
      object.position.x -= .045 * doorAmount;
    }
  }
  placeDoors();
  const reader = await createTrainReader(root, renderer, { reducedMotion });
  const passengers = await createTrainPassengers(root, { reducedMotion, material: reader.material });
  const companions = await createTrainCompanions(root, { reducedMotion, material: reader.material });
  scene.add(root);
  return {
    root,
    get reader() { return reader.state; },
    get travellers() { return passengers.state; },
    get companions() { return companions.state; },
    anchors: {
      boarding: new THREE.Vector3(-.55, TRAIN_FLOOR, 5),
      leftSeat: new THREE.Vector3(-.86, TRAIN_FLOOR, 0),
      rightSeat: new THREE.Vector3(.86, TRAIN_FLOOR, 0),
      roof: new THREE.Vector3(0, 3.70, 1.2),
    },
    setDoorOpen(open) {
      doorTarget = open ? 1 : 0;
      if (reducedMotion) {
        doorAmount = doorTarget;
        placeDoors();
      }
    },
    update(time, dt, light, viewer) {
      reader.update(time, light);
      passengers.update(time);
      companions.update(time, light, dt, viewer);
      doorAmount = THREE.MathUtils.damp(doorAmount, doorTarget, 7, Math.min(dt, .1));
      if (Math.abs(doorAmount - doorTarget) < .001) doorAmount = doorTarget;
      placeDoors();
      const warmth = light?.lantern ?? 0;
      for (const material of lamps) material.emissiveIntensity = .15 + warmth * 1.5;
    },
  };
}
