import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BufferAttribute, BufferGeometry, Group, Matrix4, Mesh } from 'three';

// Decode real exported positions and pose transforms without a browser/image
// decoder. This lets clearance tests exercise the same geometry the app loads.
export function readGlb(url) {
  const file = readFileSync(url);
  assert.equal(file.readUInt32LE(0), 0x46546c67);
  assert.equal(file.readUInt32LE(4), 2);
  assert.equal(file.readUInt32LE(8), file.length);
  const chunks = new Map();
  for (let offset = 12; offset < file.length;) {
    const length = file.readUInt32LE(offset), type = file.readUInt32LE(offset + 4);
    assert.equal(length % 4, 0);
    assert(offset + 8 + length <= file.length);
    chunks.set(type, file.subarray(offset + 8, offset + 8 + length));
    offset += length + 8;
  }
  const json = JSON.parse(chunks.get(0x4e4f534a).toString('utf8'));
  const bin = chunks.get(0x004e4942);
  assert(bin && json.buffers.length === 1 && json.buffers[0].uri === undefined);
  assert(json.buffers[0].byteLength <= bin.length);
  const dimensions = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const types = { 5121: [1, 'readUInt8'], 5123: [2, 'readUInt16LE'], 5125: [4, 'readUInt32LE'], 5126: [4, 'readFloatLE'] };
  const values = index => {
    const a = json.accessors[index], view = json.bufferViews[a.bufferView];
    assert.equal(a.sparse, undefined);
    assert.equal(view.buffer, 0);
    const [bytes, read] = types[a.componentType], size = dimensions[a.type];
    const stride = view.byteStride ?? bytes * size;
    const offset = (view.byteOffset ?? 0) + (a.byteOffset ?? 0);
    assert((a.byteOffset ?? 0) + (a.count - 1) * stride + bytes * size <= view.byteLength);
    return Array.from({ length: a.count }, (_, row) => Array.from({ length: size }, (_, column) => {
      const value = bin[read](offset + row * stride + column * bytes);
      assert(Number.isFinite(value));
      return value;
    }));
  };
  const objects = json.nodes.map(node => {
    const object = new Group(); object.name = node.name ?? '';
    if (node.matrix) new Matrix4().fromArray(node.matrix).decompose(object.position, object.quaternion, object.scale);
    else {
      object.position.fromArray(node.translation ?? [0, 0, 0]);
      object.quaternion.fromArray(node.rotation ?? [0, 0, 0, 1]);
      object.scale.fromArray(node.scale ?? [1, 1, 1]);
    }
    if (node.mesh !== undefined) for (const primitive of json.meshes[node.mesh].primitives) {
      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(new Float32Array(values(primitive.attributes.POSITION).flat()), 3));
      if (primitive.indices !== undefined) geometry.setIndex(values(primitive.indices).flat());
      object.add(new Mesh(geometry));
    }
    return object;
  });
  json.nodes.forEach((node, index) => (node.children ?? []).forEach(child => objects[index].add(objects[child])));
  const model = new Group();
  for (const index of json.scenes[json.scene ?? 0].nodes) model.add(objects[index]);
  return { file, json, bin, values, model };
}
