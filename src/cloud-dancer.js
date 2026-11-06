import * as THREE from 'three';

// A single local veil sits across the established flight path. The backdrop
// stays distant; this one painting has real depth and can occlude the dragon.
export const VEIL_CENTRE = new THREE.Vector3(74, 34, -80);
export const VEIL_RADIUS = new THREE.Vector3(24, 6, 12);

export function mistDensity(point, centre = VEIL_CENTRE) {
  const radius = Math.hypot((point.x-centre.x)/VEIL_RADIUS.x,
    (point.y-centre.y)/VEIL_RADIUS.y,(point.z-centre.z)/VEIL_RADIUS.z);
  const t = THREE.MathUtils.clamp((1-radius)/.65,0,1);
  return t*t*(3-2*t);
}

export function createCloudDancer(scene, dragon, texture, light) {
  const centre = { value: VEIL_CENTRE.clone() };
  const tint = { value: new THREE.Color('#e5e9f4') };
  const materials = new Set();
  dragon.root.traverse(object => { if(object.isMesh)materials.add(object.material); });
  for(const material of materials) {
    material.onBeforeCompile = shader => {
      shader.uniforms.veilCentre = centre;
      shader.uniforms.veilTint = tint;
      shader.vertexShader = 'varying vec3 vVeilPosition;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
        #include <project_vertex>
        vec4 veilVertex = vec4(transformed,1.0);
        #ifdef USE_INSTANCING
          veilVertex = instanceMatrix * veilVertex;
        #endif
        vVeilPosition = (modelMatrix * veilVertex).xyz;
      `);
      shader.fragmentShader = 'uniform vec3 veilCentre; uniform vec3 veilTint; varying vec3 vVeilPosition;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        float veilDistance = length((vVeilPosition-veilCentre)/vec3(24.0,6.0,12.0));
        float mist = 1.0-smoothstep(.35,1.0,veilDistance);
        outgoingLight = mix(outgoingLight,veilTint,mist*.88);
        #include <opaque_fragment>
      `);
    };
    material.customProgramCacheKey = () => 'quiet-line-cloud-veil-v1';
    material.needsUpdate = true;
  }
  const material = new THREE.MeshBasicMaterial({map:texture,transparent:true,
    depthWrite:false,side:THREE.DoubleSide,fog:true,opacity:.93});
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(53,35.33),material);
  veil.name = 'The dragon’s painted veil';
  veil.position.copy(VEIL_CENTRE);
  veil.lookAt(0,VEIL_CENTRE.y,0);
  // Opaque dragon writes depth first. Only nearer paint covers its silhouette.
  veil.renderOrder = 4;
  scene.add(veil);
  function update() {
    centre.value.copy(VEIL_CENTRE).add(dragon.root.position);
    veil.position.copy(centre.value);
    material.color.copy(light.cloudTint);
    tint.value.set('#e5e9f4').multiply(light.cloudTint);
  }
  update();
  return {veil,update};
}
