import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const STATION_POSITION = Object.freeze([-3.4, .6, -3]);

// A permanent bank beneath the station. Its eastern edge leaves a clear gap
// beside the carriage; the railway continues out across the shallow sea.
export function createStationShore(scene) {
  const root = new THREE.Group(); root.name = 'The fixed station shoreline'; scene.add(root);
  const positions = [], colors = [], indices = [], segments = 80, rings = 12;
  const grass = new THREE.Color('#778c50'), earth = new THREE.Color('#a69a72'), wet = new THREE.Color('#657b6c'), tint = new THREE.Color();
  for (let ring = 0; ring <= rings; ring++) {
    const r = ring / rings;
    for (let j = 0; j <= segments; j++) {
      const a = j / segments * Math.PI * 2;
      const irregular = 1 + .055 * Math.sin(a * 5 + .6) + .027 * Math.cos(a * 9);
      const x = Math.min(-1.95, -7.9 + Math.cos(a) * 5.9 * r * irregular);
      const z = 1.5 + Math.sin(a) * 8.9 * r * irregular;
      const y = .62 - .82 * Math.pow(r, 5) + Math.sin(a * 3) * r * .025;
      positions.push(x, y, z);
      tint.copy(grass).lerp(earth, THREE.MathUtils.smoothstep(r, .7, .95));
      tint.lerp(wet, THREE.MathUtils.smoothstep(r, .92, 1));
      tint.multiplyScalar(.97 + Math.sin(x * 2.3 + z * .8) * .025).toArray(colors, colors.length);
      if (ring < rings && j < segments) {
        const k = ring * (segments + 1) + j;
        indices.push(k, k + 1, k + segments + 1, k + 1, k + segments + 2, k + segments + 1);
      }
    }
  }
  const terrain = new THREE.BufferGeometry(); terrain.setIndex(indices);
  terrain.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  terrain.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); terrain.computeVertexNormals();
  root.add(new THREE.Mesh(terrain, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })));

  // A worn stone path and a small sill at the boarding edge. The sill belongs
  // to the stationary bank, not the train or the user's tracking origin.
  const stones = [], stoneMaterial = new THREE.MeshStandardMaterial({ color: '#a7a389', roughness: 1 });
  const groundAt = (x, z) => {
    const a = Math.atan2((z - 1.5) / 8.9, (x + 7.9) / 5.9);
    const r = Math.hypot((x + 7.9) / 5.9, (z - 1.5) / 8.9) / (1 + .055 * Math.sin(a * 5 + .6) + .027 * Math.cos(a * 9));
    return .62 - .82 * Math.pow(r, 5) + Math.sin(a * 3) * r * .025;
  };
  for (let i = 0; i < 9; i++) {
    const stone = new THREE.SphereGeometry(1, 10, 6);
    stone.scale(.38 + (i % 3) * .045, .06, .29); stone.rotateY(i * .7);
    const x = -6 - Math.sin(i * .38) * .5, z = 4.6 + i * .48;
    stone.translate(x, groundAt(x, z) + .025, z); stones.push(stone);
  }
  for (const [x, z, scale] of [[-11.8, -2.4, .4], [-11.2, 6.5, .55], [-5.6, 8.2, .35], [-6.2, -5.4, .45]]) {
    const stone = new THREE.SphereGeometry(1, 10, 6); stone.scale(scale, scale * .35, scale * .8); stone.translate(x, groundAt(x, z), z); stones.push(stone);
  }
  root.add(new THREE.Mesh(mergeGeometries(stones), stoneMaterial)); stones.forEach(g => g.dispose());
  const sill = new THREE.Mesh(new THREE.BoxGeometry(.28, .14, 1.45), new THREE.MeshStandardMaterial({ color: '#b9a17c', roughness: 1 }));
  sill.position.set(-1.82, .79, 1); root.add(sill);
  return root;
}
