import * as THREE from 'three';

const smooth = (a,b,x) => { const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
export function weatherAt(time, reducedMotion=false) {
  if(reducedMotion)return {rain:0,shadow:0,gust:0,travel:0};
  const phase=((time%480)+480)%480;
  return {
    rain:smooth(195,230,phase)*(1-smooth(305,345,phase)),
    shadow:smooth(40,65,phase)*(1-smooth(155,185,phase)),
    gust:smooth(25,40,phase)*(1-smooth(65,85,phase)),
    travel:(phase-110)*1.7,
  };
}

export const cloudShadowGLSL = `
uniform vec2 shadowCentre;
uniform float shadowStrength;
float cloudShade(vec3 point) {
  vec2 p=point.xz-shadowCentre;
  float edge=p.x*.94+p.y*.34+sin(p.y*.026)*9.0+sin(p.y*.071)*3.0;
  float bank=1.0-smoothstep(24.0,65.0,abs(edge));
  return bank*shadowStrength*(1.0-smoothstep(8.0,30.0,point.y));
}
`;

export function createWeather(scene, {reducedMotion=false,cloudTexture}={}) {
  const uniforms={shadowCentre:{value:new THREE.Vector2()},shadowStrength:{value:0}};
  const rainMaterial=new THREE.ShaderMaterial({
    uniforms:{time:{value:0},amount:{value:0},tint:{value:new THREE.Color('#9db4ce')}},
    vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`
      uniform float time; uniform float amount; uniform vec3 tint; varying vec2 vUv;
      void main(){
        float x=vUv.x+vUv.y*.055;
        float fibres=.45+.22*sin(x*280.0+sin(vUv.y*5.0))+ .16*sin(x*547.0+time*.25);
        float drift=.83+.17*sin(vUv.y*18.0+time*.4+x*40.0);
        float edge=smoothstep(0.0,.18,vUv.x)*(1.0-smoothstep(.82,1.0,vUv.x));
        float height=smoothstep(0.0,.16,vUv.y)*(1.0-smoothstep(.83,1.0,vUv.y));
        gl_FragColor=vec4(tint,amount*edge*height*fibres*drift*.38);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,transparent:true,depthWrite:false,side:THREE.DoubleSide,
  });
  const rain=new THREE.Mesh(new THREE.PlaneGeometry(210,110),rainMaterial);
  rain.name='Rain somewhere far away';rain.renderOrder=2;scene.add(rain);
  const bank=new THREE.Mesh(new THREE.PlaneGeometry(260,173.33),
    new THREE.MeshBasicMaterial({map:cloudTexture,color:'#cad3e1',transparent:true,opacity:0,depthWrite:false,fog:true,side:THREE.DoubleSide}));
  bank.name='The passing rain cloud';bank.renderOrder=2;scene.add(bank);

  function shadeStation(station) {
    const materials=new Set();
    station.traverse(object=>{if(object.isMesh&&object.material.isMeshStandardMaterial)materials.add(object.material);});
    for(const material of materials){
      const previous=material.onBeforeCompile;
      material.onBeforeCompile=shader=>{
        previous.call(material,shader);
        Object.assign(shader.uniforms,uniforms);
        shader.vertexShader='varying vec3 vWeatherPosition;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
          #include <project_vertex>
          vec4 weatherVertex=vec4(transformed,1.0);
          #ifdef USE_INSTANCING
            weatherVertex=instanceMatrix*weatherVertex;
          #endif
          vWeatherPosition=(modelMatrix*weatherVertex).xyz;
        `);
        shader.fragmentShader='varying vec3 vWeatherPosition;\n'+cloudShadowGLSL+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
          outgoingLight*=mix(vec3(1.0),vec3(.71,.79,.89),cloudShade(vWeatherPosition));
          #include <opaque_fragment>
        `);
      };
      material.customProgramCacheKey=()=> 'quiet-line-moving-shade-v1';
      material.needsUpdate=true;
    }
  }
  let state=weatherAt(0,reducedMotion);
  function update(time,viewer,light){
    state=weatherAt(time,reducedMotion);
    uniforms.shadowCentre.value.set(viewer.x+state.travel,viewer.z-12);
    uniforms.shadowStrength.value=state.shadow*(1-light.night)*.85;
    const amount=state.rain*(1-light.night);
    const drift=state.rain?Math.sin(time*.002)*45:0;
    rain.position.set(viewer.x-430+drift,49,viewer.z-780);
    rain.rotation.y=.50;
    bank.position.set(rain.position.x,111,rain.position.z-5);bank.rotation.y=.50;
    rainMaterial.uniforms.time.value=reducedMotion?0:time;
    rainMaterial.uniforms.amount.value=amount;
    rainMaterial.uniforms.tint.value.set('#9db4ce').multiply(light.cloudTint);
    bank.material.color.set('#cad3e1').multiply(light.cloudTint);
    bank.material.opacity=amount*.72;
    rain.visible=bank.visible=amount>.001;
    return state;
  }
  return {uniforms,update,shadeStation,rain,bank,get state(){return state;}};
}
