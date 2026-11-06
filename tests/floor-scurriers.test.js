import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Group, Matrix4, Vector3 } from 'three';
import { createFloorScurriers, FLOOR_BOUNDS, FLOOR_FUZZBALLS, FLOOR_OBSTACLES, FLOOR_Y } from '../src/floor-scurriers.js';
import { attachCompanions } from '../src/train-companions.js';
import { readGlb } from './helpers/glb.js';

const viewer = { aboard: true, enabled: true, position: [.86, 2.1, 0], direction: [-.7, -.7, 0] };
test('six scurriers explore independently without crossing feet, walls or one another', () => {
  for (const seed of [73621, 19, 98163]) {
    const controller = createFloorScurriers({ seed });
    let before = controller.state, different = 0;
    const travel = Array(6).fill(0), moving = Array(6).fill(0), peak = Array(6).fill(0), phases = new Set();
    for (let frame = 0; frame < 90 * 180; frame++) {
      const poses = controller.update(1 / 90, viewer);
      assert.equal(poses.length, 6);
      if (new Set(poses.map(p => p.phase)).size > 1) different++;
      for (const [i, p] of poses.entries()) {
        const [x, y, z] = p.position, r = p.radius, b = FLOOR_BOUNDS;
        assert(p.position.every(Number.isFinite)); assert.equal(y, FLOOR_Y);
        assert(x >= b.minX + r && x <= b.maxX - r && z >= b.minZ + r && z <= b.maxZ - r);
        for (const o of [...FLOOR_OBSTACLES, { x: .48, z: 0, radius: .25 }]) {
          assert(Math.hypot(x - o.x, z - o.z) >= r + o.radius - 1e-9, `${p.id} crosses a footprint`);
        }
        for (const other of poses.slice(i + 1)) {
          assert(Math.hypot(x - other.position[0], z - other.position[2]) >= r + other.radius + .0079);
        }
        const step = Math.hypot(x - before[i].position[0], z - before[i].position[2]);
        assert(step <= 1.35 / 90 + 1e-9, 'No teleport or impossible speed.');
        const turn = Math.atan2(Math.sin(p.facing - before[i].facing), Math.cos(p.facing - before[i].facing));
        assert(Math.abs(turn) <= 7 / 90 + 1e-9, 'Turns have a finite rate.');
        travel[i] += step; moving[i] += p.speed > .2 ? 1 : 0; peak[i] = Math.max(peak[i], p.speed); phases.add(p.phase);
      }
      before = poses;
    }
    travel.forEach(d => assert(d > 12, 'No permanent traffic jam.'));
    moving.forEach(n => assert(n / 16200 > .12 && n / 16200 < .85, 'Both activity and quiet time.'));
    peak.forEach(speed => assert(speed > .8 && speed <= 1.35));
    assert(different / 16200 > .9, 'Independent habits, not synchronized choreography.');
    assert(phases.has('poking around') && phases.has('investigating') && phases.has('listening') && phases.has('scurrying'));
  }
});

test('motion is consistent across frame rates; pause, reduced motion and clock gaps cannot queue movement', () => {
  const simulate = fps => {
    const c = createFloorScurriers();
    for (let i = 0; i < fps * 30; i++) c.update(1 / fps, viewer);
    return c.state;
  };
  assert.deepEqual(simulate(30), simulate(60)); assert.deepEqual(simulate(60), simulate(90));
  const still = createFloorScurriers({ reducedMotion: true }), before = still.state;
  for (const dt of [1 / 60, 10, NaN, Infinity, -1, 0]) assert.deepEqual(still.update(dt, viewer), before);
  const c = createFloorScurriers(), initial = c.state;
  for (const dt of [NaN, Infinity, -1, 0]) assert.deepEqual(c.update(dt, viewer), initial);
  const gap = createFloorScurriers(), bounded = createFloorScurriers();
  assert.deepEqual(gap.update(1000, viewer), bounded.update(.1, viewer));
  // A viewer teleport reserves new space without displacing a creature.
  const p = c.state[0].position;
  const next = c.update(1 / 90, { ...viewer, position: [p[0], 2.1, p[2]] });
  assert(Math.hypot(next[0].position[0] - p[0], next[0].position[2] - p[2]) <= 1.35 / 90);
});

test('shoe avoidance footprints contain actual exported low passenger geometry', () => {
  const v = new Vector3();
  const cases = [
    ['newspaper-reader', [['ReaderRoot', 1, -1.9, -Math.PI / 2, 0]]],
    ['passengers', [['Sleeper', 1, 2.4, -Math.PI / 2, 1], ['Gardener', -1, 2.1, Math.PI / 2, 2], ['Keeper', 1, -4.5, -Math.PI / 2, 3]]],
  ];
  for (const [file, definitions] of cases) {
    const { model } = readGlb(new URL(`../public/assets/spirits/${file}.glb`, import.meta.url));
    for (const [name, x, z, yaw, obstacle] of definitions) {
      const root = model.getObjectByName(name), o = FLOOR_OBSTACLES[obstacle]; let tested = 0;
      root.position.set(x, .9, z); root.rotation.y = yaw; root.updateWorldMatrix(true, true);
      root.traverse(object => {
        const positions = object.geometry?.attributes.position;
        for (let i = 0; i < (positions?.count ?? 0); i++) {
          v.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld);
          if (v.y < 1.05) { assert(Math.hypot(v.x - o.x, v.z - o.z) < o.radius); tested++; }
        }
      });
      assert(tested > 0);
    }
  }
});

test('actual instanced creatures keep a foot on the floor, fit collision radii and follow a moving carriage', () => {
  const { model } = readGlb(new URL('../public/assets/spirits/companions.glb', import.meta.url));
  const carriage = new Group(); carriage.position.set(30, 0, -1100); carriage.rotation.y = .8;
  const companions = attachCompanions(model, carriage);
  assert.equal(companions.floorMeshes.length, 4);
  for (const mesh of companions.floorMeshes) {
    assert(mesh.isInstancedMesh); assert.equal(mesh.count, 6); assert.equal(mesh.material.opacity, 1);
    assert.equal(mesh.parent.parent, carriage);
  }
  const v = new Vector3(), instance = new Matrix4(), world = new Matrix4(), inverse = new Matrix4();
  for (let frame = 0; frame < 90 * 25; frame++) {
    companions.update(frame / 90, {}, 1 / 90);
    if (frame % 15) continue;
    carriage.updateWorldMatrix(true, true); inverse.copy(carriage.matrixWorld).invert();
    const state = companions.state.floor;
    for (let i = 0; i < 6; i++) {
      const box = new Box3();
      for (const mesh of companions.floorMeshes) {
        mesh.getMatrixAt(i, instance); world.multiplyMatrices(mesh.matrixWorld, instance);
        const p = mesh.geometry.attributes.position;
        for (let n = 0; n < p.count; n++) {
          v.fromBufferAttribute(p, n).applyMatrix4(world).applyMatrix4(inverse); box.expandByPoint(v);
          assert(Math.hypot(v.x - state[i].position[0], v.z - state[i].position[2]) < state[i].radius,
            `${state[i].id} geometry leaves its collision radius`);
        }
      }
      assert(Math.abs(box.min.y - .9003) < 1e-6, `Foot support ${box.min.y}`);
      assert(box.max.y < 1.02);
    }
  }
  const matrices = companions.floorMeshes.map(mesh => [...mesh.instanceMatrix.array]);
  companions.update(1000000, {}, 0);
  assert.deepEqual(companions.floorMeshes.map(mesh => [...mesh.instanceMatrix.array]), matrices);
  assert.equal(FLOOR_FUZZBALLS.length, 6);
});
