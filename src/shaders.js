export const skySampling = `
const float PI = 3.14159265359;
#ifdef SHARP_SKY
uniform vec2 skyTexel;
#endif
vec3 skyColor(vec3 d) {
  d = normalize(d);
  float u = atan(d.z, d.x) / (2.0 * PI) + 0.5;
  float v = 0.43 + asin(clamp(d.y, -1.0, 1.0)) / PI * 1.14;
  vec2 uv = vec2(u, clamp(v, 0.005, 0.995));
  // atan wraps longitude from 1 to 0. Implicit derivatives mistake that join
  // for a huge texture footprint and select a pale mip, producing a dashed
  // seam. Use the shortest periodic difference to keep filtering continuous.
  vec2 dx = dFdx(uv), dy = dFdy(uv);
  dx.x -= floor(dx.x + 0.5);
  dy.x -= floor(dy.x + 0.5);
  vec3 col = textureGrad(skyMap, uv, dx, dy).rgb;
#ifdef SHARP_SKY
  // Restore painted edge contrast lost when a panorama texel covers several
  // screen pixels. Limit to the local color range to avoid bright/dark halos.
  // Minified views retain normal mip filtering; water uses the original sample.
  vec3 left = textureGrad(skyMap, uv - vec2(skyTexel.x, 0.0), dx, dy).rgb;
  vec3 right = textureGrad(skyMap, uv + vec2(skyTexel.x, 0.0), dx, dy).rgb;
  vec3 above = textureGrad(skyMap, uv + vec2(0.0, skyTexel.y), dx, dy).rgb;
  vec3 below = textureGrad(skyMap, uv - vec2(0.0, skyTexel.y), dx, dy).rgb;
  vec3 low = min(col, min(min(left, right), min(above, below)));
  vec3 high = max(col, max(max(left, right), max(above, below)));
  float footprint = max(length(dx / skyTexel), length(dy / skyTexel));
  float detail = 0.65 * (1.0 - smoothstep(0.8, 1.5, footprint));
  col = clamp(col + (col - (left + right + above + below) * 0.25) * detail, low, high);
#endif
  return col;
}
`;
export const skyVertex = `varying vec3 vDirection; void main(){vDirection=position; vec4 p=projectionMatrix*mat4(mat3(viewMatrix))*vec4(position,1.0); gl_Position=p.xyww;}`;
export const skyFragment = `uniform sampler2D skyMap; varying vec3 vDirection; ${skySampling} void main(){gl_FragColor=vec4(skyColor(vDirection),1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`;
export const waterVertex = `varying vec3 vWorld; void main(){vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`;
export const waterFragment = `
uniform sampler2D skyMap; uniform float time; uniform float calm;
varying vec3 vWorld;
${skySampling}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){
 vec2 p=vWorld.xz; float t=time*calm;
 float dist=length(cameraPosition.xz-p);
 float small=1.0-smoothstep(8.0,140.0,dist);
 float n=noise(p*.48+vec2(t*.06,-t*.09));
 float wx=sin(p.x*.45+p.y*.25+t*.45)*.035+sin(p.x*1.3-p.y*.7+t*.65)*.019*small;
 float wz=cos(p.y*.55+p.x*.18+t*.36)*.045+sin(p.y*2.3+t*.9)*.018*small;
 vec3 normal=normalize(vec3(wx,1.0,wz));
 vec3 eye=normalize(cameraPosition-vWorld);
 vec3 reflection=reflect(-eye,normal);
 vec3 reflected=skyColor(reflection);
 float fresnel=.22+.78*pow(1.0-max(dot(eye,normal),0.0),3.0);
 vec3 shallow=mix(vec3(.025,.40,.49),vec3(.12,.65,.69),n);
 vec3 color=mix(shallow,reflected,clamp(fresnel*.85+.12,0.,1.));
 float streak=pow(max(0.,sin(p.y*4.0+sin(p.x*1.9+t*.23)*2.2+t*.45)),20.0);
 float streak2=pow(max(0.,sin(p.x*3.5+sin(p.y*1.6-t*.24)*2.0)),24.0);
 color+=vec3(.30,.43,.30)*(streak*streak2)*small*.44;
 float glint=pow(max(dot(reflect(-normalize(vec3(-.4,1.,-.5)),normal),eye),0.0),120.0);
 color+=vec3(1.,.91,.65)*glint*.28;
 color=mix(color,skyColor(normalize(vec3(-eye.x,0.005,-eye.z))),smoothstep(1800.,5800.,dist));
 float alpha=mix(.65,1.,smoothstep(4.,60.,dist));
 gl_FragColor=vec4(color,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
