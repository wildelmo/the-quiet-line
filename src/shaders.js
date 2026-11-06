import { cloudShadowGLSL } from './weather.js';

export const skySampling = `
const float PI = 3.14159265359;
uniform float skyYaw;
uniform vec3 sunDir; uniform vec3 moonDir;
uniform float night; uniform float golden; uniform float starLight; uniform float skyTime;
uniform sampler2D cloudTower;
uniform sampler2D cloudVeil;
float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
// Each painting covers a small angular window, rather than stretching one
// low-resolution photograph around the entire sphere. Alpha preserves the
// brushwork and leaves the blue genuinely open between cloud banks.
vec4 cloudPaint(sampler2D paint, vec3 d, vec4 placement) {
  float longitude = atan(d.z, d.x) - placement.x;
  longitude = atan(sin(longitude), cos(longitude));
  vec2 uv = vec2(longitude / placement.z, (asin(clamp(d.y,-1.0,1.0))-placement.y) / placement.w) + .5;
  vec2 dx = dFdx(uv), dy = dFdy(uv);
  vec4 ink = textureGrad(paint, clamp(uv,0.001,0.999), dx, dy);
  vec2 edge = smoothstep(vec2(0.0),vec2(.045),uv) * (1.0-smoothstep(vec2(.955),vec2(1.0),uv));
  ink.a *= edge.x * edge.y * smoothstep(-.015,.025,d.y);
  return ink;
}
vec3 paintedSky(vec3 d) {
  float height = max(d.y,0.0);
  vec3 col = mix(vec3(.27,.61,.77),vec3(.003,.205,.69),smoothstep(0.0,.23,height));
  col = mix(col,vec3(.003,.115,.48),smoothstep(.20,1.0,height));
  // Barely perceptible broad wash variation, fixed in the sky rather than
  // screen-space grain that would swim with the visitor's head in VR.
  float wash = sin(d.x*17.0+d.y*8.0)*sin(d.z*13.0-d.y*11.0);
  col *= 1.0 + wash*.009;
  vec4 a = cloudPaint(cloudTower,d,vec4(-.86,.16,1.02,.66));
  vec4 b = cloudPaint(cloudVeil,d,vec4(-2.47,.12,.88,.56));
  vec4 c = cloudPaint(cloudTower,d,vec4(1.24,.12,.76,.46));
  vec4 e = cloudPaint(cloudVeil,d,vec4(2.75,.09,.65,.40));
  col = mix(col,a.rgb,a.a);
  col = mix(col,b.rgb,b.a*.94);
  col = mix(col,c.rgb,c.a*.88);
  col = mix(col,e.rgb,e.a*.82);
  return col;
}
// A handful of stars per direction cell, twinkling softly. Only the open blue
// between the painted clouds receives them, so clouds still hide the sky.
float stars(vec3 d) {
  vec3 p = d * 150.0;
  vec3 cell = floor(p);
  float h = hash3(cell);
  vec3 centre = cell + 0.5 + (vec3(hash3(cell + 1.3), hash3(cell + 7.1), hash3(cell + 3.7)) - 0.5) * 0.7;
  float dist = length(p - centre);
  float size = 0.09 + 0.16 * step(0.992, h);
  float twinkle = 0.65 + 0.35 * sin(skyTime * (1.2 + h * 2.0) + h * 40.0);
  return step(0.955, h) * smoothstep(size, 0.0, dist) * twinkle;
}
// Grade the painted noon toward golden hour and starlit night. Bright, pale
// paint is cloud; saturated paint is open sky. Each keeps its own evening colour.
vec3 gradeSky(vec3 col, vec3 d) {
  float grade = max(golden * 0.95, night);
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  float sat = max(col.r, max(col.g, col.b)) - min(col.r, min(col.g, col.b));
  float cloud = smoothstep(0.1, 0.45, l - sat * 0.9);
  float toSun = max(dot(d, sunDir), 0.0);
  float horizon = 1.0 - smoothstep(0.0, 0.45, abs(d.y));
  float band = 1.0 - smoothstep(0.0, 0.34, abs(d.y));
  float lit = smoothstep(-0.7, 0.8, dot(d, sunDir));
  // Golden hour keeps the painted brushwork, warmed: the blue deepens toward
  // violet overhead, a peach band gathers at the horizon around the sun, and
  // the clouds take gold on their sunward side and mauve in their shadows.
  vec3 gSky = col * vec3(0.78, 0.66, 0.96);
  gSky = mix(gSky, vec3(1.0, 0.68, 0.4), band * (0.3 + 0.7 * toSun) * 0.9);
  gSky = mix(gSky, vec3(0.9, 0.64, 0.72), band * (1.0 - toSun) * 0.6);
  gSky += vec3(0.5, 0.28, 0.08) * pow(toSun, 3.0) * 0.5;
  vec3 gCloud = col * mix(vec3(0.66, 0.54, 0.8), vec3(1.14, 0.88, 0.6), lit);
  gCloud += vec3(1.0, 0.6, 0.3) * pow(toSun, 4.0) * 0.5 * l;
  // Night: indigo sky, slate clouds with a faint moonlit edge, stars, a moon.
  float toMoon = max(dot(d, moonDir), 0.0);
  vec3 nSky = mix(vec3(0.02, 0.04, 0.12), vec3(0.09, 0.13, 0.30), horizon);
  nSky += vec3(0.12, 0.16, 0.24) * pow(toMoon, 18.0);
  vec3 nCloud = mix(vec3(0.1, 0.13, 0.24), vec3(0.3, 0.36, 0.52), pow(toMoon, 3.0)) * (0.5 + 0.6 * l);
  vec3 graded = mix(mix(gSky, gCloud, cloud), mix(nSky, nCloud, cloud), night);
  graded += stars(d) * starLight * (1.0 - cloud) * smoothstep(-0.02, 0.12, d.y) * vec3(0.9, 0.95, 1.0);
  float moonDisc = smoothstep(0.9993, 0.9997, dot(d, moonDir));
  graded += vec3(0.98, 0.96, 0.86) * moonDisc * (1.0 - cloud) * starLight;
  col = mix(col, graded, grade);
  // A warm sun glow sits low in the sky and spreads at sunset.
  float sunGlow = pow(toSun, 14.0) * 0.18 + pow(toSun, 70.0) * 0.35;
  col += vec3(1.0, 0.86, 0.6) * sunGlow * (1.0 - night) * (0.5 + 0.9 * golden);
  return col;
}
vec3 skyColor(vec3 d) {
  d = normalize(d);
  // The painted clouds drift: the panorama turns very slowly around the viewer.
  float cy = cos(skyYaw), sy = sin(skyYaw);
  vec3 r = vec3(d.x * cy - d.z * sy, d.y, d.x * sy + d.z * cy);
  return gradeSky(paintedSky(r), d);
}
`;
export const skyVertex = `varying vec3 vDirection; void main(){vDirection=position; vec4 p=projectionMatrix*mat4(mat3(viewMatrix))*vec4(position,1.0); gl_Position=p.xyww;}`;
export const skyFragment = `varying vec3 vDirection; ${skySampling} void main(){gl_FragColor=vec4(skyColor(vDirection),1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`;
export const waterVertex = `varying vec3 vWorld; void main(){vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`;
export const waterFragment = `
uniform float time; uniform float calm;
varying vec3 vWorld;
${skySampling}
${cloudShadowGLSL}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
// Analytic level of detail. A ripple whose wavelength spans only a few pixels
// cannot be drawn as a ripple: sampled per pixel it becomes shimmering moire,
// worst toward the horizon in a headset. Each wave settles into the flat
// surface it averages to as its wavelength approaches the pixel footprint.
float settled(float wavelength,float footprint){return 1.0-smoothstep(wavelength*.06,wavelength*.3,footprint);}
void main(){
 vec2 p=vWorld.xz; float t=time*calm;
 float dist=length(cameraPosition.xz-p);
 float small=1.0-smoothstep(8.0,140.0,dist);
 float footprint=fwidth(p.x)+fwidth(p.y);
 float broad=settled(11.0,footprint),fine=settled(4.0,footprint),grain=settled(2.2,footprint);
 float n=mix(.5,noise(p*.48+vec2(t*.06,-t*.09)),grain);
 float wx=sin(p.x*.45+p.y*.25+t*.45)*.035*broad+sin(p.x*1.3-p.y*.7+t*.65)*.019*small*fine;
 float wz=cos(p.y*.55+p.x*.18+t*.36)*.045*broad+sin(p.y*2.3+t*.9)*.018*small*grain;
 vec3 normal=normalize(vec3(wx,1.0,wz));
 vec3 eye=normalize(cameraPosition-vWorld);
 vec3 reflection=reflect(-eye,normal);
 vec3 reflected=skyColor(reflection);
 float fresnel=.22+.78*pow(1.0-max(dot(eye,normal),0.0),3.0);
 vec3 shallow=mix(vec3(.025,.40,.49),vec3(.12,.65,.69),n);
 shallow=mix(shallow,shallow*vec3(1.1,.85,.7),golden*.6);
 shallow=mix(shallow,vec3(.02,.04,.10)+n*vec3(.02,.05,.08),night);
 vec3 color=mix(shallow,reflected,clamp(fresnel*.85+.12,0.,1.));
 float streak=pow(max(0.,sin(p.y*4.0+sin(p.x*1.9+t*.23)*2.2+t*.45)),20.0);
 float streak2=pow(max(0.,sin(p.x*3.5+sin(p.y*1.6-t*.24)*2.0)),24.0);
 color+=mix(vec3(.30,.43,.30),vec3(.08,.12,.2),night)*(streak*streak2)*small*grain*.44;
 vec3 lightDir=normalize(mix(sunDir,moonDir,night));
 // Far water has no ripples left to scatter the sun, so its glitter path
 // broadens and dims rather than sharpening into a hard mirror spot.
 float glint=pow(max(dot(reflect(-lightDir,normal),eye),0.0),mix(28.0,120.0,fine));
 color+=mix(vec3(1.,.91,.65),vec3(.75,.8,1.),night)*glint*mix(.28,.45,golden)*mix(.22,1.0,fine);
 color=mix(color,skyColor(normalize(vec3(-eye.x,0.005,-eye.z))),smoothstep(1800.,5800.,dist));
 color*=mix(vec3(1.0),vec3(.76,.84,.94),cloudShade(vWorld));
 float alpha=mix(.65,1.,smoothstep(4.,60.,dist));
 gl_FragColor=vec4(color,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
