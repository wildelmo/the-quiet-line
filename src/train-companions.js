import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createCompanionAttention, turnToward } from './companion-attention.js';
import { createFloorScurriers, FLOOR_FUZZBALLS, FLOOR_Y } from './floor-scurriers.js';

export const FUZZ_BODY_HEIGHT = .09144;
export const MOUSE_POSITION = Object.freeze([1.215, 1.985, .45]);
export const PERCH_POSITION = Object.freeze([1.24, 1.985, .75]);
const point = (x, y, z) => Object.freeze([x, y, z]);
export const FUZZBALLS = Object.freeze([
  Object.freeze({ id: 'window-friend', size: 1, yaw: -Math.PI / 2, cycle: 43, start: 4,
    points: Object.freeze([point(1.23, 1.985, .86), point(1.23, 1.985, 1.16), point(1.21, 1.985, 1.02)]) }),
  Object.freeze({ id: 'forward-hopper', size: .94, yaw: Math.PI / 2, cycle: 47, start: 14,
    points: Object.freeze([point(-.94, 1.35, -4.12), point(-.94, 1.35, -3.72), point(-.88, 1.35, -3.94)]) }),
  Object.freeze({ id: 'doorway-hopper', size: 1.06, yaw: Math.PI / 2, cycle: 53, start: 8,
    points: Object.freeze([point(-.94, 1.35, 3.32), point(-.94, 1.35, 3.68), point(-.87, 1.35, 3.49)]) }),
]);
const smooth = value => { const x = THREE.MathUtils.clamp(value, 0, 1); return x * x * (3 - 2 * x); };
const pulse = (t, start, end, ease) => smooth((t - start) / ease) * smooth((end - t) / ease);
const blinkAt = (time, start) => 1 - .94 * Math.sin(Math.PI * THREE.MathUtils.clamp((time - start) / .24, 0, 1)) ** 2;

function keepPigmentInAmbientFill(material) {
  // Standard emissive maps omit vertex pigment. Without this, the warm ivory
  // atlas washes charcoal fur (and black pupils) pale when the lamps come on.
  material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `
      #include <emissivemap_fragment>
      #if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
        totalEmissiveRadiance *= vColor.rgb;
      #endif
    `);
  };
  material.customProgramCacheKey = () => 'companion-pigment-fill-v1';
}

// Closed three-hop paths, repeated in two short bursts per cycle. Positions are
// carriage-local, so a pause, a long ride or a frame-rate change cannot detach
// a creature from its ledge or cause a queued series of jumps.
export function fuzzPoseAt(index, time, reducedMotion = false) {
  const definition = FUZZBALLS[index];
  if (!definition) throw new Error(`Unknown fuzzball: ${index}`);
  const pose = { phase: 'resting', position: [...definition.points[0]], lift: 0,
    scaleX: 1, scaleY: 1, roll: 0, yaw: 0, eyes: 1 };
  if (reducedMotion || !Number.isFinite(time)) return pose;
  const t = Math.max(0, time) % definition.cycle;
  pose.eyes = blinkAt(t, 1.8 + index * 2);
  for (const burst of [definition.start, definition.start + 20]) {
    for (let leg = 0; leg < 3; leg++) {
      const start = burst + leg * 1.36, duration = .78 + leg * .045;
      const from = definition.points[leg], to = definition.points[(leg + 1) % 3];
      if (t >= start + duration + .25) { pose.position = [...to]; continue; }
      if (t < start - .18) return pose;
      pose.position = [...from];
      if (t < start) {
        const crouch = smooth((t - start + .18) / .18);
        pose.phase = 'crouching'; pose.scaleY = 1 - crouch * .28; pose.scaleX = 1 + crouch * .17;
      } else if (t <= start + duration) {
        const u = (t - start) / duration, along = smooth(u);
        pose.phase = 'hopping';
        pose.lift = FUZZ_BODY_HEIGHT * definition.size * [2.25, 2.65, 2.9][leg] * 4 * u * (1 - u);
        pose.position = from.map((value, axis) => THREE.MathUtils.lerp(value, to[axis], along));
        pose.position[1] += pose.lift;
        // Fast release from crouch, then a long soft apex and a small landing.
        const release = 1 - smooth(u / .13), stretch = Math.sin(Math.PI * u) ** 2;
        const landing = smooth((u - .88) / .12);
        pose.scaleY = 1 - release * .28 + stretch * .12 - landing * .23;
        pose.scaleX = 1 + release * .17 - stretch * .055 + landing * .14;
        const direction = Math.sign(to[2] - from[2]) || 1;
        pose.roll = Math.sin(Math.PI * u) * .055 * direction;
        pose.yaw = Math.sin(Math.PI * u) * .16 * direction;
      } else {
        const settle = 1 - smooth((t - start - duration) / .25);
        pose.position = [...to]; pose.phase = 'landing';
        pose.scaleY = 1 - .23 * settle; pose.scaleX = 1 + .14 * settle;
      }
      return pose;
    }
  }
  return pose;
}

export function mousePoseAt(time, reducedMotion = false) {
  const pose = { phase: 'watching the sea', breath: 0, headYaw: 0, bodyYaw: 1.42, sway: 0,
    headPitch: 0, tailYaw: 0, eyes: 1, nose: 0 };
  if (reducedMotion || !Number.isFinite(time)) return pose;
  const absolute = Math.max(0, time), t = absolute % FUZZBALLS[0].cycle;
  const watching = Math.max(pulse(t, 3.4, 8.8, .6), pulse(t, 23.4, 28.8, .6));
  pose.breath = (1 + Math.sin(absolute * 1.1)) * .001;
  pose.sway = Math.sin(absolute * .65) * .012;
  pose.bodyYaw = THREE.MathUtils.lerp(1.42, .08, watching);
  pose.headYaw = .18 * Math.sin(absolute * .22) * (1 - watching) + .12 * watching;
  pose.headPitch = -.09 * watching * fuzzPoseAt(0, time).lift / .29;
  pose.tailYaw = .075 * Math.sin(absolute * 1.3) * Math.max(.3, watching);
  pose.eyes = Math.min(blinkAt(t, 10.4), blinkAt(t, 32.2));
  pose.nose = Math.sin(t * 26) * .0018 * pulse(t, 15, 16.2, .25);
  if (watching > 0) pose.phase = 'watching its hopping friend';
  return pose;
}

export function attachCompanions(model, carriage, { reducedMotion = false, material } = {}) {
  function requireNode(root, name) {
    const node = root.getObjectByName(name);
    if (!node) throw new Error(`Little companion asset is missing ${name}.`);
    return node;
  }
  const mouse = requireNode(model, 'Mouse'), perch = requireNode(model, 'Perch'), fuzz = requireNode(model, 'Fuzz');
  const meshes = [], originals = new Set(), originalMaps = new Set(), eyeMaterials = new Set();
  model.traverse(object => { if (object.isMesh) meshes.push(object); });
  const painted = (material ?? meshes[0]?.material)?.clone();
  if (!painted) throw new Error('Little companions need a painted material.');
  painted.name = 'Solid painted little companions';
  painted.opacity = 1; painted.transparent = false; painted.depthWrite = true;
  keepPigmentInAmbientFill(painted);
  for (const mesh of meshes) {
    if (mesh.material.name === 'Chalk white fuzz eyes') {
      eyeMaterials.add(mesh.material);
      mesh.material.emissive?.copy(mesh.material.color);
      keepPigmentInAmbientFill(mesh.material);
      continue;
    }
    for (const old of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      originals.add(old);
      if (old.map && old.map !== painted.map) originalMaps.add(old.map);
    }
    mesh.material = painted;
    mesh.castShadow = false; mesh.receiveShadow = false; mesh.renderOrder = 0;
  }
  for (const old of originals) if (old !== material) old.dispose();
  for (const map of originalMaps) { map.dispose(); map.image?.close?.(); }
  const remember = node => ({ node, position: node.position.clone(), quaternion: node.quaternion.clone(), scale: node.scale.clone() });
  const mouseNodes = Object.fromEntries(['Body', 'Head', 'Eyes', 'Nose', 'Tail'].map(part => [part, remember(requireNode(mouse, `Mouse${part}`))]));
  mouse.position.fromArray(MOUSE_POSITION); mouse.rotation.y = 1.42;
  perch.position.fromArray(PERCH_POSITION); perch.rotation.y = -Math.PI / 2;
  carriage.add(mouse, perch);
  const fuzzballs = FUZZBALLS.map((definition, index) => {
    const root = index ? fuzz.clone(true) : fuzz;
    const body = remember(requireNode(root, 'FuzzBody')), eyes = remember(requireNode(root, 'FuzzEyes'));
    root.name = definition.id;
    root.scale.setScalar(definition.size);
    carriage.add(root);
    return { root, body, eyes, pose: fuzzPoseAt(index, 0, reducedMotion) };
  });
  const floor = createFloorScurriers({ reducedMotion });
  // Pose six lightweight rig hierarchies off-scene, then render their shared
  // geometry in four instanced draws instead of adding 24 separate draws.
  const floorRigs = FLOOR_FUZZBALLS.map(definition => {
    const root = fuzz.clone(true); root.name = definition.id;
    root.scale.setScalar(definition.size); root.position.set(0, 0, 0); root.rotation.set(0, 0, 0);
    const body = remember(requireNode(root, 'FuzzBody')), eyes = remember(requireNode(root, 'FuzzEyes'));
    const legs = ['Left', 'Right'].map(side => remember(requireNode(root, `Fuzz${side}Leg`)));
    const parts = [], feet = [];
    root.traverse(object => { if (object.isMesh) parts.push(object); });
    // Cache foot vertices once; their actual posed lowest point sets the root
    // height. One foot always meets the boards, even on a turn or at a stop.
    legs.forEach(leg => leg.node.traverse(object => {
      if (object.isMesh) feet.push({ mesh: object, positions: object.geometry.attributes.position });
    }));
    return { root, body, eyes, legs, parts, feet };
  });
  const floorGroup = new THREE.Group(); floorGroup.name = 'Floor scurriers'; carriage.add(floorGroup);
  const floorMeshes = floorRigs[0].parts.map(part => {
    const mesh = new THREE.InstancedMesh(part.geometry, part.material, floorRigs.length);
    mesh.name = `Floor ${part.name}`;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Conservative carriage-local bounds cover every permitted floor pose.
    mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, .96, .42), 7.4);
    floorGroup.add(mesh); return mesh;
  });
  const footVertex = new THREE.Vector3();
  let floorPoses = floor.state;
  const delta = new THREE.Quaternion(), angles = new THREE.Euler();
  function rotate(item, x = 0, y = 0, z = 0) {
    item.node.quaternion.copy(item.quaternion).multiply(delta.setFromEuler(angles.set(x, y, z)));
  }
  let mousePose = mousePoseAt(0, reducedMotion);
  const attention = createCompanionAttention(FUZZBALLS, FUZZ_BODY_HEIGHT, fuzzPoseAt, MOUSE_POSITION, { reducedMotion });
  const viewerPosition = new THREE.Vector3(), viewerDirection = new THREE.Vector3(), inverseCarriage = new THREE.Matrix4();
  const localViewer = { position: [0, 0, 0], direction: [0, 0, -1], aboard: false, enabled: false };
  let attentionState = { engaged: null, phase: 'quiet', age: 0 };
  function update(time, light = {}, dt = 0, viewer) {
    localViewer.enabled = !!viewer?.enabled;
    localViewer.aboard = !!viewer?.aboard;
    if (viewer?.position && viewer?.direction) {
      carriage.updateWorldMatrix(true, false);
      inverseCarriage.copy(carriage.matrixWorld).invert();
      viewerPosition.copy(viewer.position).applyMatrix4(inverseCarriage).toArray(localViewer.position);
      viewerDirection.copy(viewer.direction).transformDirection(inverseCarriage).toArray(localViewer.direction);
    } else localViewer.enabled = false;
    const response = attention.update(time, dt, localViewer);
    attentionState = response.state;
    mousePose = mousePoseAt(time, reducedMotion);
    if (response.mouse) {
      mousePose.bodyYaw = turnToward(mousePose.bodyYaw, response.mouse.facing, response.mouse.amount);
      mousePose.headYaw *= 1 - response.mouse.amount;
      mousePose.phase = response.mouse.phase;
    }
    mouse.rotation.y = mousePose.bodyYaw;
    mouseNodes.Body.node.position.copy(mouseNodes.Body.position);
    mouseNodes.Body.node.position.y += mousePose.breath;
    rotate(mouseNodes.Body, 0, 0, mousePose.sway);
    rotate(mouseNodes.Head, mousePose.headPitch, mousePose.headYaw);
    rotate(mouseNodes.Tail, 0, mousePose.tailYaw);
    mouseNodes.Eyes.node.scale.copy(mouseNodes.Eyes.scale);
    mouseNodes.Eyes.node.scale.y *= mousePose.eyes;
    mouseNodes.Nose.node.position.copy(mouseNodes.Nose.position);
    mouseNodes.Nose.node.position.y += mousePose.nose;
    fuzzballs.forEach((ball, index) => {
      const p = ball.pose = response.fuzzballs[index];
      ball.root.position.fromArray(p.position);
      ball.root.rotation.y = p.facing;
      ball.body.node.scale.copy(ball.body.scale).multiply(newScale.set(p.scaleX, p.scaleY, p.scaleX));
      rotate(ball.body, 0, 0, p.roll);
      ball.eyes.node.scale.copy(ball.eyes.scale);
      ball.eyes.node.scale.y *= p.eyes;
    });
    floorPoses = floor.update(Number.isFinite(time) ? dt : 0, localViewer);
    floorRigs.forEach((ball, index) => {
      const p = floorPoses[index], running = Math.min(1, p.speed / .5);
      const swing = Math.sin(p.stride) * .58 * running;
      ball.root.position.set(p.position[0], 0, p.position[2]);
      ball.root.rotation.y = p.facing;
      rotate(ball.body, -.07 * running, 0, Math.sin(p.stride) * .028 * running);
      ball.legs.forEach((leg, side) => rotate(leg, side ? -swing : swing));
      ball.eyes.node.scale.copy(ball.eyes.scale); ball.eyes.node.scale.y *= p.eyes;
      ball.root.updateWorldMatrix(false, true);
      let sole = Infinity;
      for (const foot of ball.feet) for (let i = 0; i < foot.positions.count; i++) {
        sole = Math.min(sole, footVertex.fromBufferAttribute(foot.positions, i).applyMatrix4(foot.mesh.matrixWorld).y);
      }
      ball.root.position.y = FLOOR_Y - sole + .0003;
      ball.root.updateWorldMatrix(false, true);
      ball.parts.forEach((part, partIndex) => floorMeshes[partIndex].setMatrixAt(index, part.matrixWorld));
    });
    floorMeshes.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; });
    if (painted.emissive) painted.emissiveIntensity = .055 + THREE.MathUtils.clamp(light.lantern ?? 0, 0, 1) * .025;
    for (const eyes of eyeMaterials) eyes.emissiveIntensity = .055 + THREE.MathUtils.clamp(light.lantern ?? 0, 0, 1) * .025;
  }
  const newScale = new THREE.Vector3();
  update(0);
  return { mouse, perch, fuzzballs: fuzzballs.map(ball => ball.root), floorRigs: floorRigs.map(ball => ball.root), floorMeshes,
    material: painted, update, get state() {
    return { mouse: { phase: mousePose.phase, facing: mousePose.bodyYaw, opacity: 1 }, attention: { ...attentionState },
      fuzzballs: fuzzballs.map((ball, index) => ({ id: FUZZBALLS[index].id, phase: ball.pose.phase,
        position: [...ball.pose.position], facing: ball.pose.facing, lift: ball.pose.lift, bodyHeight: FUZZ_BODY_HEIGHT * FUZZBALLS[index].size, opacity: 1 })),
      floor: floorPoses.map(p => ({ ...p, position: [...p.position], velocity: [...p.velocity], opacity: 1 })), reducedMotion };
  } };
}

export async function createTrainCompanions(carriage, options = {}) {
  const { scene } = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}assets/spirits/companions.glb`);
  return attachCompanions(scene, carriage, options);
}
