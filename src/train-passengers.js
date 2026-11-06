import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makeSpiritsTranslucent, SPIRIT_OPACITY } from './spirit-material.js';

export const PASSENGERS = Object.freeze([
  Object.freeze({ id: 'Sleeper', name: 'The river sleeper', position: Object.freeze([1, .9, 2.4]), yaw: -Math.PI / 2, cycle: 137, start: 62, duration: 12, resting: 'sleeping', gesture: 'settling into sleep' }),
  Object.freeze({ id: 'Moth', name: 'The little moth', position: Object.freeze([-1, .9, -2.8]), yaw: Math.PI / 2, cycle: 131, start: 12, duration: 10, resting: 'watching the water', gesture: 'following a distant cloud' }),
  Object.freeze({ id: 'Gardener', name: 'The seedling keeper', position: Object.freeze([-1, .9, 2.1]), yaw: Math.PI / 2, cycle: 151, start: 34, duration: 13, resting: 'holding a seedling', gesture: 'tending the seedling' }),
  Object.freeze({ id: 'Keeper', name: 'The tide keeper', position: Object.freeze([1, .9, -4.5]), yaw: -Math.PI / 2, cycle: 163, start: 90, duration: 12, resting: 'holding a keepsake', gesture: 'turning a keepsake' }),
]);

const smooth = value => { const x = THREE.MathUtils.clamp(value, 0, 1); return x * x * (3 - 2 * x); };

export function passengerPoseAt(id, time, reducedMotion = false) {
  const definition = PASSENGERS.find(passenger => passenger.id === id);
  if (!definition) throw new Error(`Unknown train passenger: ${id}`);
  const pose = { phase: definition.resting, breath: 0, bodyRoll: 0, headPitch: 0,
    headYaw: 0, headRoll: 0, actionPitch: 0, actionRoll: 0, actionY: 0 };
  if (reducedMotion || !Number.isFinite(time)) return pose;
  const absolute = Math.max(0, time), t = absolute % definition.cycle;
  const amount = smooth((t - definition.start) / 3) * smooth((definition.start + definition.duration - t) / 3);
  const offset = PASSENGERS.indexOf(definition) * 1.9;
  pose.breath = Math.sin(absolute * (id === 'Sleeper' ? .57 : .73) + offset) * .0025;
  pose.bodyRoll = Math.sin(absolute * .27 + offset) * .0018;
  if (amount > 0) pose.phase = definition.gesture;
  switch (id) {
    case 'Sleeper':
      pose.headPitch = amount * .075;
      pose.headRoll = amount * .025;
      break;
    case 'Moth':
      pose.headYaw = amount * .25;
      pose.headRoll = amount * -.065;
      break;
    case 'Gardener':
      pose.headPitch = amount * .10;
      pose.headYaw = amount * -.045;
      pose.actionPitch = amount * -.035;
      pose.actionY = amount * .008;
      break;
    case 'Keeper':
      pose.headPitch = amount * .085;
      pose.actionRoll = amount * .055;
      pose.actionY = amount * .006;
      break;
  }
  return pose;
}

export function attachPassengers(model, carriage, { reducedMotion = false, material } = {}) {
  const characters = PASSENGERS.map(definition => {
    const root = model.getObjectByName(definition.id);
    if (!root) throw new Error(`Passenger asset is missing ${definition.id}.`);
    const nodes = {};
    for (const part of ['Body', 'Head', 'Action']) {
      const node = root.getObjectByName(`${definition.id}${part}`);
      if (!node) throw new Error(`Passenger asset is missing ${definition.id}${part}.`);
      nodes[part] = { node, position: node.position.clone(), quaternion: node.quaternion.clone() };
    }
    root.position.fromArray(definition.position);
    root.rotation.y = definition.yaw;
    carriage.add(root);
    return { definition, root, nodes, pose: passengerPoseAt(definition.id, 0, reducedMotion) };
  });
  const replacedMaterials = new Set(), replacedMaps = new Set();
  for (const { root } of characters) root.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    if (!material) return;
    for (const old of Array.isArray(object.material) ? object.material : [object.material]) {
      if (old === material) continue;
      replacedMaterials.add(old);
      if (old.map && old.map !== material.map) replacedMaps.add(old.map);
    }
    // All five figures use the same painted atlas and matte lighting recipe.
    // Sharing the actual material also avoids four duplicate GPU texture sets.
    object.material = material;
  });
  for (const old of replacedMaterials) old.dispose();
  for (const map of replacedMaps) { map.dispose(); map.image?.close?.(); }
  for (const { root } of characters) makeSpiritsTranslucent(root);
  const delta = new THREE.Quaternion(), angles = new THREE.Euler();
  function apply(item, x = 0, y = 0, z = 0, lift = 0) {
    item.node.position.copy(item.position);
    item.node.position.y += lift;
    item.node.quaternion.copy(item.quaternion).multiply(delta.setFromEuler(angles.set(x, y, z)));
  }
  function update(time) {
    for (const character of characters) {
      const p = character.pose = passengerPoseAt(character.definition.id, time, reducedMotion);
      apply(character.nodes.Body, 0, 0, p.bodyRoll, p.breath);
      apply(character.nodes.Head, p.headPitch, p.headYaw, p.headRoll);
      apply(character.nodes.Action, p.actionPitch, 0, p.actionRoll, p.actionY);
    }
  }
  update(0);
  return { roots: characters.map(character => character.root), update, get state() {
    return characters.map(({ definition, pose }) => ({ id: definition.id, name: definition.name, phase: pose.phase, reducedMotion, opacity: SPIRIT_OPACITY }));
  } };
}

export async function createTrainPassengers(carriage, options = {}) {
  const { scene } = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}assets/spirits/passengers.glb`);
  return attachPassengers(scene, carriage, options);
}
