import * as THREE from 'three';

// A cloud skim, a broad vertical loop, then a banking dive and rising turn.
// Arc-length sampling makes the tail follow the same route without stretching
// when a manoeuvre changes direction. Frames are transported around the loop:
// crossing vertical never causes an upside-down basis flip.
const points=[
  [11,29,-55],[47,33,-63],[74,34,-80],[98,39,-113],
  [82,38,-139],[35,37,-145],
  [15,45,-145],[7,65,-145],[15,85,-145],[35,93,-145],
  [55,85,-145],[63,65,-145],[55,45,-145],[35,37,-145],
  [0,30,-141],[-46,24,-122],[-87,29,-104],[-101,46,-131],
  [-78,68,-164],[-35,72,-179],[13,59,-176],[65,43,-154],
  [85,32,-117],[57,28,-76],[0,26,-89],[-48,28,-91],
  [-55,29,-68],[-20,28,-54],
].map(p=>new THREE.Vector3(...p));
const curve=new THREE.CatmullRomCurve3(points,true,'centripetal');
curve.arcLengthDivisions=4096;
const SAMPLES=2048;
const length=curve.getLength();
const positions=curve.getSpacedPoints(SAMPLES);
const frames=curve.computeFrenetFrames(SAMPLES,true);
const desiredUp=new THREE.Vector3(0,1,0).addScaledVector(frames.tangents[0],-frames.tangents[0].y).normalize();
const turn=new THREE.Vector3().crossVectors(frames.normals[0],desiredUp);
const alignment=Math.atan2(turn.dot(frames.tangents[0]),frames.normals[0].dot(desiredUp));
for(let i=0;i<=SAMPLES;i++)frames.normals[i].applyAxisAngle(frames.tangents[i],alignment);

export const DRAGON_FLIGHT={length,speed:7.2,bodyLength:58};
export const flightDistance=time=>time*DRAGON_FLIGHT.speed+2.5*Math.sin(time*.18);

export function sampleFlight(distance,position,up) {
  const f=(((distance%length)+length)%length)/length*SAMPLES;
  const i=Math.floor(f),blend=f-i;
  position.lerpVectors(positions[i],positions[i+1],blend);
  if(up)up.lerpVectors(frames.normals[i],frames.normals[i+1],blend).normalize();
  return position;
}

const routeUp=new THREE.Vector3();
export function dragonSpine(time,along,out=new THREE.Vector3()){
  sampleFlight(flightDistance(time)-along,out,routeUp);
  const envelope=Math.sin(Math.PI*THREE.MathUtils.clamp(along/58,0,1));
  const ripple=Math.sin(along*.18-time*1.1)*envelope*1.65;
  return out.addScaledVector(routeUp,ripple);
}

const ahead=new THREE.Vector3(),routePosition=new THREE.Vector3(),turning=new THREE.Vector3();
export function dragonFrame(time,along,position,right,up,forward){
  dragonSpine(time,along,position);dragonSpine(time,along-.16,ahead);
  forward.copy(ahead).sub(position).normalize();
  const distance=flightDistance(time)-along;
  sampleFlight(distance,routePosition,up);
  right.crossVectors(up,forward).normalize();up.crossVectors(forward,right).normalize();
  // Lean into turns, then let the mane and whiskers lag behind that bank.
  sampleFlight(distance+2,routePosition);
  sampleFlight(distance-2,turning);
  turning.add(routePosition).addScaledVector(position,-2);
  const bank=THREE.MathUtils.clamp(-turning.dot(right)*1.2,-.6,.6);
  right.applyAxisAngle(forward,bank);up.crossVectors(forward,right).normalize();
}
