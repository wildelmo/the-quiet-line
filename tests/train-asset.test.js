import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, Matrix4, Quaternion, Ray, Vector3 } from 'three';

// Inspect the shipped binary, rather than trusting Blender's source statistics.
function readCarriage() {
  const file = readFileSync(new URL('../public/assets/train/carriage.glb', import.meta.url));
  assert.equal(file.readUInt32LE(0), 0x46546c67, 'A valid GLB header is required.');
  assert.equal(file.readUInt32LE(4), 2);
  assert.equal(file.readUInt32LE(8), file.length, 'The GLB must not be truncated.');
  const chunks = new Map();
  for (let offset = 12; offset < file.length;) {
    const length = file.readUInt32LE(offset), type = file.readUInt32LE(offset + 4);
    assert.equal(length % 4, 0);
    assert(offset + 8 + length <= file.length);
    chunks.set(type, file.subarray(offset + 8, offset + 8 + length));
    offset += 8 + length;
  }
  const json = JSON.parse(chunks.get(0x4e4f534a).toString('utf8'));
  const bin = chunks.get(0x004e4942);
  assert(bin, 'Geometry and textures must be packaged with the GLB.');
  assert.equal(json.buffers.length, 1);
  assert.equal(json.buffers[0].uri, undefined);
  assert(json.buffers[0].byteLength <= bin.length);
  return { json, bin, file };
}

const component = {
  5120: [1, 'readInt8'], 5121: [1, 'readUInt8'],
  5122: [2, 'readInt16LE'], 5123: [2, 'readUInt16LE'],
  5125: [4, 'readUInt32LE'], 5126: [4, 'readFloatLE'],
};
const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function values(asset, index) {
  const a = asset.json.accessors[index], view = asset.json.bufferViews[a.bufferView];
  const [bytes, read] = component[a.componentType], count = components[a.type];
  assert(count, `Unsupported accessor type ${a.type}`);
  assert.equal(view.buffer, 0);
  assert.equal(a.sparse, undefined, 'Update the inspection helper before exporting sparse geometry.');
  const stride = view.byteStride ?? bytes * count;
  const offset = (view.byteOffset ?? 0) + (a.byteOffset ?? 0);
  assert((a.byteOffset ?? 0) + (a.count - 1) * stride + bytes * count <= view.byteLength,
    `Accessor ${index} must stay within its buffer view.`);
  assert((view.byteOffset ?? 0) + view.byteLength <= asset.bin.length);
  return Array.from({ length: a.count }, (_, i) =>
    Array.from({ length: count }, (_, c) => asset.bin[read](offset + i * stride + c * bytes)));
}

function sceneGeometry(asset) {
  const { json } = asset, meshes = [], nodes = [];
  const walk = (index, parent) => {
    const node = json.nodes[index];
    const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(
      new Vector3().fromArray(node.translation ?? [0, 0, 0]),
      new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
      new Vector3().fromArray(node.scale ?? [1, 1, 1]));
    const matrix = parent.clone().multiply(local);
    nodes.push({ node, position: new Vector3().setFromMatrixPosition(matrix) });
    if (node.mesh !== undefined) {
      for (const primitive of json.meshes[node.mesh].primitives) {
        assert.equal(primitive.mode ?? 4, 4, 'The carriage exports triangulated surfaces.');
        const vertices = values(asset, primitive.attributes.POSITION)
          .map(value => new Vector3().fromArray(value).applyMatrix4(matrix));
        const indices = primitive.indices === undefined ? vertices.map((_, i) => i)
          : values(asset, primitive.indices).flat();
        assert.equal(indices.length % 3, 0);
        assert(indices.every(i => Number.isInteger(i) && i >= 0 && i < vertices.length),
          `${node.name} contains an invalid triangle index.`);
        const triangles = [];
        for (let i = 0; i < indices.length; i += 3) {
          triangles.push(indices.slice(i, i + 3).map(n => vertices[n]));
        }
        meshes.push({ name: node.name, primitive, vertices, triangles, indices,
          material: json.materials[primitive.material] });
      }
    }
    for (const child of node.children ?? []) walk(child, matrix);
  };
  for (const node of json.scenes[json.scene ?? 0].nodes) walk(node, new Matrix4());
  return { meshes, nodes };
}

function intersections(meshes, origin, direction, opaqueOnly = false) {
  const ray = new Ray(origin, direction), hit = new Vector3(), distances = [];
  for (const mesh of meshes) {
    if (opaqueOnly && mesh.material.alphaMode === 'BLEND') continue;
    for (const triangle of mesh.triangles) {
      if (ray.intersectTriangle(...triangle, false, hit)) distances.push(hit.distanceTo(origin));
    }
  }
  return distances.sort((a, b) => a - b);
}

test('the shipped carriage has valid finite geometry, UVs and embedded painted materials', () => {
  const asset = readCarriage(), { json, bin } = asset;
  for (let i = 0; i < json.accessors.length; i++) {
    assert(values(asset, i).flat().every(Number.isFinite), `Accessor ${i} contains non-finite data.`);
  }
  const { meshes } = sceneGeometry(asset);
  assert(meshes.length > 0);
  for (const mesh of meshes) {
    assert(mesh.material, `${mesh.name} must reference a material.`);
    const texture = mesh.material.pbrMetallicRoughness?.baseColorTexture;
    if (texture) {
      assert(mesh.primitive.attributes.TEXCOORD_0 !== undefined, `${mesh.name} needs UVs for its paint.`);
      assert(json.textures[texture.index]);
    }
  }
  assert(json.images.length > 0, 'Painted material images must be included.');
  for (const image of json.images) {
    assert.equal(image.uri, undefined, 'The carriage must load without external texture paths.');
    const view = json.bufferViews[image.bufferView];
    assert(view && view.byteLength > 100);
    assert((view.byteOffset ?? 0) + view.byteLength <= bin.length);
    const bytes = bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
    assert.equal(image.mimeType, 'image/png', 'The painted atlas is a lossless embedded PNG.');
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert(bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0);
  }
});

test('the exported interior has a continuous aisle floor, overhead enclosure and usable window seats', () => {
  const asset = readCarriage(), { meshes, nodes } = sceneGeometry(asset);
  const bounds = new Box3();
  for (const mesh of meshes) for (const point of mesh.vertices) bounds.expandByPoint(point);
  const size = bounds.getSize(new Vector3());
  assert(size.x > 2.8 && size.x < 3.5, 'Width must remain at human carriage scale.');
  assert(size.z > 15.5 && size.z < 17.5, 'Length must remain at one carriage scale.');
  for (const z of [-6, -3, 0, 3, 6]) {
    const floor = intersections(meshes, new Vector3(0, .95, z), new Vector3(0, -1, 0), true);
    assert(Math.abs(floor[0] - .05) < .02, `The aisle needs a floor at y=.9, z=${z}.`);
    const ceiling = intersections(meshes, new Vector3(0, 2.6, z), new Vector3(0, 1, 0), true);
    assert(ceiling.length && ceiling[0] > .15 && ceiling[0] < 1.2,
      `The aisle needs a ceiling with standing clearance at z=${z}.`);
  }
  const anchors = nodes.filter(({ node }) => /anchor/i.test(node.name ?? ''));
  assert(anchors.length >= 3, 'Boarding and both seat anchors must survive export.');
  for (const name of ['DoorLeftForward', 'DoorLeftRear']) {
    const door = nodes.filter(({ node }) => node.name === name);
    assert.equal(door.length, 1, `${name} must be a unique independently movable door node.`);
    assert(door[0].node.mesh !== undefined && meshes.some(mesh => mesh.name === name && mesh.triangles.length > 0),
      `${name} must contain exported door geometry, not an empty source marker.`);
  }
  for (const side of ['left', 'right']) {
    const anchor = anchors.find(({ node }) => new RegExp(side, 'i').test(node.name));
    assert(anchor, `${side} seat anchor is missing.`);
    assert(Math.abs(anchor.position.y - .9) < .02, 'Seat anchors are floor-relative, preserving tracked head height.');
    assert(Math.abs(anchor.position.x) > .4 && Math.abs(anchor.position.x) < 1.3);
    assert(Math.abs(anchor.position.z) < 7);
    const eye = anchor.position.clone().add(new Vector3(0, 1.2, 0));
    const outward = new Vector3(Math.sign(anchor.position.x), 0, 0);
    const obstruction = intersections(meshes, eye, outward, true);
    assert(!obstruction.length || obstruction[0] > 3, `${side} seated view must look through an actual window opening.`);
  }
});

test('the carriage stays inside its proposed geometry, draw and texture budgets', () => {
  const asset = readCarriage(), { meshes } = sceneGeometry(asset);
  const triangles = meshes.reduce((total, mesh) => total + mesh.triangles.length, 0);
  assert(triangles <= 50000, `Export has ${triangles} triangles; proposed cap is 50,000.`);
  assert(meshes.length <= 7, `Painted details must fit the original seven primitive draws, got ${meshes.length}.`);
  assert(asset.json.materials.length <= 5, 'Static decorations reuse the original five material batches.');
  assert.equal(asset.json.images.length, 1, 'Surfaces and illustrated notices share one atlas.');
  let textureBytes = 0;
  for (const image of asset.json.images) {
    const view = asset.json.bufferViews[image.bufferView];
    const start = view.byteOffset ?? 0;
    textureBytes += asset.bin.readUInt32BE(start + 16) * asset.bin.readUInt32BE(start + 20) * 4 * 4 / 3;
  }
  assert(textureBytes <= 8.05 * 1024 * 1024, 'The painted extension must keep the atlas close to its original 8 MiB footprint.');
});

test('repairs are confined to two cushion tops and illustrated notices face inward with upright UVs', () => {
  const asset = readCarriage(), { meshes } = sceneGeometry(asset);
  const repairs = new Set(), notices = { route: 0, pier: 0 };
  const normal = new Vector3(), ab = new Vector3(), ac = new Vector3();
  for (const mesh of meshes) {
    if (!mesh.material.pbrMetallicRoughness?.baseColorTexture) continue;
    const uv = values(asset, mesh.primitive.attributes.TEXCOORD_0);
    for (let start = 0; start < mesh.indices.length; start += 3) {
      // glTF image coordinates invert Blender's lower-left V convention.
      const ids = mesh.indices.slice(start, start + 3), points = ids.map(i => mesh.vertices[i]), coords = ids.map(i => [uv[i][0], 1 - uv[i][1]]);
      const meanU = coords.reduce((n, p) => n + p[0] / 3, 0), meanV = coords.reduce((n, p) => n + p[1] / 3, 0);
      normal.crossVectors(ab.subVectors(points[1], points[0]), ac.subVectors(points[2], points[0])).normalize();
      if (meanU > 1 / 3 && meanU < 2 / 3 && meanV > 0 && meanV < .5) {
        assert(normal.y > .84, 'Repair artwork must stay on upward-facing fabric.');
        for (const p of points) assert(p.y > 1.325 && p.y < 1.351, `Repair leaves seat top: y=${p.y}`);
        const side = Math.sign(points[0].x), center = side < 0 ? -1.60125 : .88375;
        assert(points.every(p => Math.sign(p.x) === side && Math.abs(p.z - center) < .63));
        repairs.add(side);
      }
      if (meanU > 2 / 3 && meanV > 0 && meanV < .5) {
        const role = meanV > .25 ? 'route' : 'pier'; notices[role]++;
        const horizontal = p => role === 'route' ? p.z : -p.x;
        const centerH = points.reduce((n, p) => n + horizontal(p) / 3, 0), centerY = points.reduce((n, p) => n + p.y / 3, 0);
        assert(coords.reduce((sum, p, i) => sum + (p[0] - meanU) * (horizontal(points[i]) - centerH), 0) > 0,
          `${role} lettering must not be horizontally mirrored.`);
        assert(coords.reduce((sum, p, i) => sum + (p[1] - meanV) * (points[i].y - centerY), 0) > 0,
          `${role} artwork must be upright.`);
        assert(role === 'route' ? normal.x < -.99 : normal.z < -.99, `${role} paper must face the traveller.`);
      }
    }
  }
  assert.deepEqual([...repairs].sort(), [-1, 1]);
  assert(notices.route >= 2 && notices.pier >= 2, 'Both illustrated notices must survive export.');
});

test('the rear lower wall has one visible painted surface at each point, without competing coplanar panels', () => {
  const { meshes } = sceneGeometry(readCarriage());
  // These non-edge sample points cover the doorway and both surrounding panels.
  // The old maroon body and cream door shared z=7.49 across this region, causing
  // camera-dependent speckling. Check the exported triangles, not source names.
  for (const x of [-1.1, -.63, -.31, .11, .48, .69, 1.1]) {
    for (const y of [1.04, 1.17, 1.34, 1.48]) {
      const hits = intersections(meshes, new Vector3(x, y, 7.3), new Vector3(0, 0, 1), true);
      assert(hits.length >= 2, `The rear wall must remain closed at (${x}, ${y}).`);
      const frontSurfaces = hits.filter(distance => distance - hits[0] < .001);
      assert.equal(frontSurfaces.length, 1,
        `Competing rear-wall faces at (${x}, ${y}): depths ${frontSurfaces.join(', ')}`);
    }
  }
});
