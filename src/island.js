import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// The island belongs to the landscape. Travelling down the rails brings it
// alongside, then leaves it behind; it never follows or turns toward the eye.
export const ISLAND_POSITION = Object.freeze([-41, 0, -112]);

export function createIsland(scene, { reducedMotion = false } = {}) {
  const root = new THREE.Group(); root.name = 'The little house by the line';
  root.position.fromArray(ISLAND_POSITION); root.rotation.y = -.23; scene.add(root);
  let seed = 618;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
  const pigment = color => new THREE.MeshStandardMaterial({ color, vertexColors: true, roughness: 1 });
  const grass = pigment('#678b39'), earth = pigment('#7c8061'), plaster = pigment('#e3d9b2');
  const roof = pigment('#a85b3c'), timber = pigment('#62664b'), leaves = pigment('#487142');
  const trim = pigment('#d7c89a'), glass = pigment('#365d59');
  glass.emissive.set('#ffbb60');
  const batches = new Map(), tint = new THREE.Color();
  function add(geometry, material, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], parent = root) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g !== geometry) geometry.dispose();
    g.deleteAttribute('uv'); g.scale(...scale); g.rotateX(rotation[0]); g.rotateY(rotation[1]); g.rotateZ(rotation[2]); g.translate(...position);
    const colors = new Float32Array(g.attributes.position.count * 3), shade = .89 + random() * .17;
    const bounds = new THREE.Box3().setFromBufferAttribute(g.attributes.position);
    for (let i = 0; i < colors.length / 3; i++) {
      const height = (g.attributes.position.getY(i) - bounds.min.y) / Math.max(.01, bounds.max.y - bounds.min.y);
      tint.setRGB(shade * (.86 + height * .14), shade * (.91 + height * .09), shade * .91).toArray(colors, i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    if (!batches.has(parent)) batches.set(parent, new Map());
    const bucket = batches.get(parent);
    if (!bucket.has(material)) bucket.set(material, []);
    bucket.get(material).push(g);
  }
  const box = (p, s, m, rotation = [0, 0, 0], parent = root) => add(new THREE.BoxGeometry(...s), m, p, undefined, rotation, parent);
  const oval = (p, s, m, parent = root) => add(new THREE.SphereGeometry(1, 14, 9), m, p, s, undefined, parent);
  function branch(points, radius, parent = root) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const g = new THREE.TubeGeometry(curve, 12, radius, 7, false), v = new THREE.Vector3(), center = new THREE.Vector3();
    for (let i = 0; i <= 12; i++) {
      curve.getPointAt(i / 12, center);
      for (let j = 0; j <= 7; j++) {
        const index = i * 8 + j;
        v.fromBufferAttribute(g.attributes.position, index).sub(center).multiplyScalar(1 - i / 12 * .86).add(center);
        g.attributes.position.setXYZ(index, v.x, v.y, v.z);
      }
    }
    g.computeVertexNormals(); add(g, timber, undefined, undefined, undefined, parent);
  }
  // An uneven low shoreline, with the darker bank continuing below the water.
  function land(sx, sy, sz, y, mat) {
    const g = new THREE.SphereGeometry(1, 64, 20), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x);
      const edge = 1 + .045 * Math.sin(a * 5 + .4) + .026 * Math.cos(a * 9);
      p.setXYZ(i, x * sx * edge, p.getY(i) * sy + y, z * sz * edge);
    }
    g.computeVertexNormals(); add(g, mat);
  }
  land(13.1, 1.25, 7.8, -.7, earth); land(12.6, 1.02, 7.3, -.01, grass);

  // Cream plaster, tall narrow windows, a clay-tile roof and two little chimneys.
  box([-4, 1.02, 0], [6.05, .34, 4.8], earth);
  box([-4, 3.14, 0], [5.45, 4.0, 4.25], plaster);
  const gable = new THREE.Shape(); gable.moveTo(-2.725, 0); gable.lineTo(2.725, 0); gable.lineTo(0, 1.6); gable.closePath();
  add(new THREE.ExtrudeGeometry(gable, { depth: 4.25, bevelEnabled: false }), plaster, [-4, 5.14, -2.125]);
  const slope = Math.atan2(1.6, 2.725);
  for (const side of [-1, 1]) {
    box([-4 + side * 1.49, 5.92, 0], [3.49, .18, 5.05], roof, [0, 0, -side * slope]);
    for (let row = 0; row < 8; row++) for (let col = 0; col < 13; col++) {
      const x = .13 + row * .40;
      box([-4 + side * x, 6.78 - x * Math.tan(slope), -2.38 + col * .395], [.48, .10, .38], roof, [0, 0, -side * slope]);
    }
  }
  add(new THREE.CylinderGeometry(.14, .14, 5.25, 9), roof, [-4, 6.81, 0], undefined, [Math.PI / 2, 0, 0]);
  for (const [x, z] of [[-5.65, -1.2], [-2.6, .8]]) {
    box([x, 6.58, z], [.52, 1.95, .56], plaster);
    box([x, 7.58, z], [.66, .16, .7], roof);
    box([x, 7.68, z], [.39, .055, .43], timber);
  }
  // Windows on both the front and railway-facing side stay legible as we pass.
  function window(p, side = false) {
    const group = new THREE.Group(); group.position.fromArray(p); group.rotation.y = side ? Math.PI / 2 : 0; root.add(group);
    box([0, 0, 0], [.78, 1.24, .08], timber, undefined, group);
    box([0, 0, .055], [.64, 1.08, .025], glass, undefined, group);
    for (const x of [-.38, 0, .38]) box([x, 0, .085], [.055, 1.25, .06], trim, undefined, group);
    for (const y of [-.61, 0, .61]) box([0, y, .09], [.8, .055, .065], trim, undefined, group);
    box([0, -.68, .15], [.94, .12, .29], trim, undefined, group);
  }
  for (const x of [-5.65, -2.35]) for (const y of [2.28, 4.25]) window([x, y, 2.14]);
  for (const z of [-1.2, 1.2]) for (const y of [2.28, 4.25]) window([-1.26, y, z], true);
  box([-4, 2.07, 2.16], [.84, 1.9, .12], timber);
  box([-4, 2.39, 2.24], [.55, .73, .035], glass);
  oval([-3.72, 1.95, 2.27], [.045, .045, .04], trim);
  for (let i = 0; i < 3; i++) box([-4, .86 + i * .12, 2.75 - i * .18], [1.45, .16, .8], earth);

  // A wind-shaped crown: many overlapping irregular masses, merged per tree.
  const crowns = [];
  function tree(x, z, height, width, phase) {
    const trunk = new THREE.Group(); trunk.position.set(x, .65, z); root.add(trunk);
    branch([[0, 0, 0], [.05, height * .3, 0], [.55, height * .65, -.12], [1.1, height * .84, .02]], height * .043, trunk);
    const crown = new THREE.Group(); crown.position.set(.4, height * .46, 0); trunk.add(crown); crowns.push({ crown, phase });
    for (let i = 0; i < 5; i++) {
      const a = i * 2.4;
      branch([[0, -.4, 0], [Math.cos(a) * width * .32, height * .12, Math.sin(a) * width * .28], [.7 + Math.cos(a) * width * .65, height * .27, Math.sin(a) * width * .55]], height * .017, crown);
    }
    for (let i = 0; i < 44; i++) {
      const a = random() * Math.PI * 2, radius = Math.sqrt(random()), top = 1 - radius * radius;
      const size = .66 + random() * .62;
      const geometry = new THREE.IcosahedronGeometry(1, 2), p = geometry.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const px = p.getX(k), py = p.getY(k), pz = p.getZ(k);
        const ripple = 1 + .08 * Math.sin(px * 9 + pz * 7) * Math.cos(py * 8);
        p.setXYZ(k, px * ripple, py * ripple, pz * ripple);
      }
      geometry.computeVertexNormals();
      add(geometry, leaves, [.7 + Math.cos(a) * width * radius, height * (.12 + top * .28), Math.sin(a) * width * radius * .72], [size * 1.2, size * .86, size], undefined, crown);
    }
  }
  tree(5, -.9, 8.2, 3.3, 0); tree(-9, -2, 5.2, 1.85, 1.8); tree(8.4, 1.5, 4.4, 1.7, 3.1);
  for (const [x, z] of [[-7, 1.8], [-.6, -2.7], [8, -3.4]]) oval([x, 1.1, z], [1.4, .8, .95], leaves);

  // A bench in the shade and a few stepping stones tell a small, quiet story.
  for (let i = 0; i < 4; i++) box([4.5, 1.52, 3.05 + i * .16], [2.2, .08, .13], timber);
  for (const x of [3.65, 5.35]) {
    for (const z of [3.08, 3.48]) box([x, 1.22, z], [.11, .6, .11], timber);
    box([x, 1.85, 2.99], [.10, 1.03, .10], timber);
  }
  for (const y of [1.91, 2.15]) box([4.5, y, 3.01], [2.3, .16, .09], timber);
  for (let i = 0; i < 8; i++) oval([-4 + i * .8, .92 - i * .025, 3.4 + Math.sin(i * .45) * .8], [.45, .055, .31], earth);

  // A clothesline catches the same breeze as the station's paper streamers.
  branch([[-.6, .7, -3.5], [-.6, 2.6, -3.5]], .06);
  branch([[3.8, .7, -3.5], [3.8, 2.6, -3.5]], .06);
  branch([[-.6, 2.6, -3.5], [1.6, 2.42, -3.5], [3.8, 2.6, -3.5]], .018);
  const laundry = [];
  for (let i = 0; i < 3; i++) {
    const geometry = new THREE.PlaneGeometry(.76, .95, 5, 5); geometry.translate(0, -.475, 0);
    const material = new THREE.MeshStandardMaterial({ color: ['#e8e0be', '#91b6a4', '#ce9c7d'][i], roughness: 1, side: THREE.DoubleSide });
    const cloth = new THREE.Mesh(geometry, material); cloth.position.set(.25 + i * 1.15, 2.46, -3.5); root.add(cloth); laundry.push(cloth);
  }

  // Merge even the window groups into the root's pigment batches. Tree crowns
  // stay separate for a tiny wind sway; no individual leaf draw calls.
  for (const [parent, materials] of batches) for (const [material, geometries] of materials) {
    if (parent !== root && !crowns.some(c => c.crown === parent) && !parent.children.some(c => crowns.some(t => t.crown === c))) {
      parent.updateMatrix(); geometries.forEach(g => g.applyMatrix4(parent.matrix));
      if (!batches.get(root).has(material)) batches.get(root).set(material, []);
      batches.get(root).get(material).push(...geometries); materials.delete(material);
    }
  }
  for (const [parent, materials] of batches) for (const [material, geometries] of materials) {
    if (!geometries.length) continue;
    const mesh = new THREE.Mesh(mergeGeometries(geometries), material); parent.add(mesh); geometries.forEach(g => g.dispose());
  }

  function update(time, light, breeze = { gust: .5 }) {
    const t = reducedMotion ? 0 : time;
    for (const { crown, phase } of crowns) crown.rotation.z = reducedMotion ? 0 : -.012 - Math.sin(t * .65 + phase) * .012 * (.5 + breeze.gust);
    for (let i = 0; i < laundry.length; i++) {
      const p = laundry[i].geometry.attributes.position;
      for (let j = 0; j < p.count; j++) {
        const drop = -p.getY(j);
        p.setZ(j, reducedMotion ? 0 : drop * (.12 + breeze.gust * .14) + Math.sin(p.getX(j) * 5 - t * 1.9 + i) * drop * .07);
      }
      p.needsUpdate = true; laundry[i].geometry.computeVertexNormals();
    }
    glass.emissiveIntensity = light.lantern * 1.25;
  }
  return { root, update };
}
