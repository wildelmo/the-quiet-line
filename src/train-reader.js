import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makeSpiritsTranslucent, SPIRIT_OPACITY } from './spirit-material.js';
export { SPIRIT_OPACITY } from './spirit-material.js';

export const READER_POSITION = Object.freeze([1, .9, -1.9]);
export const READER_YAW = -Math.PI / 2;
const CYCLE = 119;
const smooth = value => { const x = THREE.MathUtils.clamp(value, 0, 1); return x * x * (3 - 2 * x); };
const gesture = (time, start, end, ease) => smooth((time - start) / ease) * smooth((end - time) / ease);

// Curl a physical leaf rather than swinging a rigid 40cm board into the coat.
// Coordinates are relative to its gutter, before the reader's placement yaw.
export function readerPagePoint(x, y, z, progress, target = new THREE.Vector3()) {
  const angle = Math.PI * progress, arc = Math.sin(angle), u = THREE.MathUtils.clamp(x / .394, 0, 1);
  return target.set(
    x * Math.cos(angle) + .11 * Math.sin(Math.PI * u) * arc,
    y + .012 * Math.sin(Math.PI * u) * arc,
    z * Math.cos(angle) - (.21 * u + .015 * Math.sin(Math.PI * u)) * arc,
  );
}

// A small repertoire with long reading pauses. Time comes from the world's
// existing visible-frame clock, so a hidden tab cannot queue up gestures.
export function readerPoseAt(time, reducedMotion = false) {
  const pose = { phase: 'reading', breath: 0, bodyRoll: 0, headPitch: 0,
    headYaw: 0, paperPitch: 0, paperY: 0, pageTurn: 0, pageLift: 0, handCue: 0, turning: false };
  if (reducedMotion || !Number.isFinite(time)) return pose;
  const absolute = Math.max(0, time), t = absolute % CYCLE;
  pose.breath = Math.sin(absolute * .79) * .0025;
  pose.bodyRoll = Math.sin(absolute * .31 + .7) * .003;
  const glance = gesture(t, 42, 51, 2.4);
  const adjust = gesture(t, 96, 102, 1.8);
  pose.headPitch = -.13 * glance + .035 * adjust;
  pose.headYaw = -.22 * glance;
  pose.paperPitch = -.055 * glance + .045 * adjust;
  pose.paperY = -.014 * glance + .012 * adjust;
  if (glance > 0) pose.phase = 'watching the sea';
  else if (adjust > 0) pose.phase = 'settling the paper';
  for (const [start, duration] of [[16, 4.8], [72, 5.4]]) {
    pose.handCue = Math.max(pose.handCue, gesture(t, start - .65, start + 1, .5));
    const progress = (t - start) / duration;
    if (progress <= 0 || progress >= 1) continue;
    pose.phase = 'turning a page';
    pose.turning = true;
    pose.pageTurn = smooth(progress);
    pose.pageLift = Math.sin(Math.PI * pose.pageTurn) * .028;
    pose.paperPitch += Math.sin(Math.PI * progress) * .025;
    pose.headPitch += Math.sin(Math.PI * progress) * .045;
    break;
  }
  return pose;
}

// Separate attachment from loading so placement, pose and inherited carriage
// movement can be exercised with real Three.js transforms in Node tests.
export function attachReader(model, carriage, { reducedMotion = false, anisotropy = 1 } = {}) {
  const root = new THREE.Group();
  root.name = 'The newspaper reader';
  root.position.fromArray(READER_POSITION);
  root.rotation.y = READER_YAW;
  root.add(model);
  const names = ['ReaderBody', 'ReaderHead', 'ReaderPaper', 'ReaderTurnPage', 'ReaderLeftHand', 'ReaderRightHand'];
  const nodes = {};
  for (const name of names) {
    const node = model.getObjectByName(name);
    if (!node) throw new Error(`Newspaper reader asset is missing ${name}.`);
    nodes[name] = { node, position: node.position.clone(), quaternion: node.quaternion.clone() };
  }
  const materials = new Set();
  model.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      if (material.map) material.map.anisotropy = anisotropy;
      if (material.emissive) {
        material.emissive.copy(material.color);
        material.emissiveMap = material.map;
      }
    }
  });
  const pages = [];
  nodes.ReaderTurnPage.node.traverse(object => {
    if (!object.isMesh) return;
    const position = object.geometry.attributes.position;
    pages.push({ geometry: object.geometry, position, rest: position.array.slice() });
  });
  makeSpiritsTranslucent(model);
  carriage.add(root);
  const delta = new THREE.Quaternion(), angles = new THREE.Euler(), pagePoint = new THREE.Vector3();
  let pose = readerPoseAt(0, reducedMotion);
  function rotate(name, x = 0, y = 0, z = 0) {
    const item = nodes[name];
    item.node.quaternion.copy(item.quaternion).multiply(delta.setFromEuler(angles.set(x, y, z)));
  }
  function update(time, light = {}) {
    pose = readerPoseAt(time, reducedMotion);
    const body = nodes.ReaderBody;
    body.node.position.copy(body.position);
    body.node.position.y += pose.breath;
    rotate('ReaderBody', 0, 0, pose.bodyRoll);
    rotate('ReaderHead', pose.headPitch, pose.headYaw);
    const paper = nodes.ReaderPaper;
    paper.node.position.copy(paper.position);
    paper.node.position.y += pose.paperY;
    rotate('ReaderPaper', pose.paperPitch);
    const hand = nodes.ReaderRightHand;
    hand.node.position.copy(hand.position);
    hand.node.position.y += pose.handCue * .004;
    rotate('ReaderRightHand', 0, 0, -.09 * pose.handCue);
    const leaf = nodes.ReaderTurnPage;
    leaf.node.visible = pose.turning;
    leaf.node.position.copy(leaf.position);
    // The figure faces +Z: its body is behind the paper, on the -Z side.
    leaf.node.position.z -= pose.pageLift;
    rotate('ReaderTurnPage');
    if (pose.turning) for (const { geometry, position, rest } of pages) {
      for (let i = 0; i < position.count; i++) {
        readerPagePoint(rest[i * 3], rest[i * 3 + 1], rest[i * 3 + 2], pose.pageTurn, pagePoint);
        position.setXYZ(i, pagePoint.x, pagePoint.y, pagePoint.z);
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    }
    const warmth = THREE.MathUtils.clamp(light.lantern ?? 0, 0, 1);
    for (const material of materials) {
      if (material.emissive) material.emissiveIntensity = .055 + warmth * .025;
    }
  }
  update(0);
  return { root, update, material: materials.values().next().value, get state() {
    return { phase: pose.phase, turning: pose.turning, pageTurn: pose.pageTurn, reducedMotion, opacity: SPIRIT_OPACITY };
  } };
}

export async function createTrainReader(carriage, renderer, options = {}) {
  const { scene: model } = await new GLTFLoader().loadAsync(
    `${import.meta.env.BASE_URL}assets/spirits/newspaper-reader.glb`,
  );
  return attachReader(model, carriage, {
    ...options, anisotropy: Math.min(4, renderer.capabilities.getMaxAnisotropy()),
  });
}
