import * as THREE from 'three';

export const SPIRIT_OPACITY = .7;

// Water is composited at order 3. First mark the nearest spirit surface in
// depth, then blend that surface once over the completed carriage and ocean.
// This keeps coat seams and hidden limbs from accumulating into opaque patches.
const spiritDepth = new THREE.MeshBasicMaterial({
  colorWrite: false, depthWrite: true, depthTest: true,
  transparent: true, opacity: 1, side: THREE.FrontSide,
});
spiritDepth.name = 'Spirit silhouette depth';

export function makeSpiritsTranslucent(root) {
  const meshes = [];
  root.traverse(object => { if (object.isMesh && !object.userData.spiritDepth) meshes.push(object); });
  for (const mesh of meshes) {
    mesh.renderOrder = 5;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      material.transparent = true;
      material.opacity = SPIRIT_OPACITY;
      material.depthWrite = false;
    }
    if (mesh.children.some(child => child.userData.spiritDepth)) continue;
    const depth = new THREE.Mesh(mesh.geometry, spiritDepth);
    depth.name = `${mesh.name} silhouette depth`;
    depth.userData.spiritDepth = true;
    depth.renderOrder = 4;
    mesh.add(depth);
  }
}
