import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Group, PerspectiveCamera, Matrix4, Vector3, Quaternion, Euler } from 'three';
import { WebXRManager } from 'three/src/renderers/webxr/WebXRManager.js';
import { HOME, ROUTE_LENGTH } from '../src/motion.js';
import { readHeadPose, snapAroundHead } from '../src/xr-pose.js';
import { createTrainRide, placeTraveller } from '../src/travel.js';

const near=(a,b)=>assert(a.distanceTo(b)<1e-8,`${a.toArray()} != ${b.toArray()}`);
function pose(x=0,y=1.65,z=0,yaw=0){return new Matrix4().compose(new Vector3(x,y,z),new Quaternion().setFromEuler(new Euler(0,yaw,0)),new Vector3(1,1,1));}
function fixture(){
  const scene=new Scene(),rig=new Group(),camera=new PerspectiveCamera(72,1,.05,16000),station=new Group(),ticket=new Group();
  const root=new Group(),bench=new Group();root.position.set(0,0,-4);station.position.set(-3.4,.6,-3);bench.position.set(-.5,.77,5.4);station.add(bench);
  rig.position.set(HOME.x,HOME.y,HOME.z);rig.add(camera);scene.add(rig,root,station,ticket);
  const train={root,anchors:{boarding:new Vector3(-.55,.9,5),leftSeat:new Vector3(-.86,.9,0),rightSeat:new Vector3(.86,.9,0)},setDoorOpen(open){this.doorOpen=open;}};
  const ride=createTrainRide({rig,train,ticket});return {scene,rig,camera,train,station,bench,ticket,ride};
}
function place(ride,action,tracking,yaw){assert(ride.request(action));assert(ride.commitPlacement(tracking,yaw));ride.finishTransition();}

// Actual Three.js stereo camera composition with only session/graphics transport
// stubbed. XR camera world transforms are the ones used by the renderer.
async function headset(t){
  const originalLayer=globalThis.XRWebGLLayer;
  globalThis.XRWebGLLayer=class {framebufferWidth=2048;framebufferHeight=1024;getViewport(view){return {x:view.eye==='left'?0:1024,y:0,width:1024,height:1024};}};
  t.after(()=>{if(originalLayer===undefined)delete globalThis.XRWebGLLayer;else globalThis.XRWebGLLayer=originalLayer;});
  let nextFrame;
  const session={enabledFeatures:[],renderState:{},addEventListener(){},updateRenderState(){},requestReferenceSpace:async()=>({}),requestAnimationFrame:fn=>{nextFrame=fn;return 1;},cancelAnimationFrame(){}};
  const renderer={getRenderTarget:()=>null,getPixelRatio:()=>1,getSize:v=>v.set(1280,720),setPixelRatio(){},setSize(){},setRenderTargetFramebuffer(){},setRenderTarget(){}};
  const xr=new WebXRManager(renderer,{getContextAttributes:()=>({xrCompatible:true})});await xr.setSession(session);
  const projection=new PerspectiveCamera(90,1,.05,16000).projectionMatrix.toArray();
  return {xr,frame(time,tracking=pose()){
    const viewer={transform:{matrix:tracking.toArray()},views:['left','right'].map(eye=>({eye,projectionMatrix:projection,transform:{matrix:tracking.clone().multiply(new Matrix4().makeTranslation(eye==='left'?-.032:.032,0,0)).toArray()}}))};
    nextFrame(time,{getViewerPose:()=>viewer});
  }};
}

test('both XR eyes ride the train while the station and its furnishings stay fixed',async t=>{
  const {xr,frame}=await headset(t),f=fixture();
  const tracking=pose(3.4,1.25,-2.2,.3);f.rig.rotation.y=.8;
  place(f.ride,'board',tracking);place(f.ride,'seat',tracking);assert(f.ride.toggleJourney());
  xr.setAnimationLoop(()=>{f.ride.update(1/72);f.scene.updateMatrixWorld();xr.updateCamera(f.camera);});
  frame(0,tracking);
  const eyes=xr.getCamera().cameras;
  const eyePositions=()=>eyes.map(eye=>new Vector3().setFromMatrixPosition(eye.matrixWorld));
  const carriageOffsets=eyePositions().map(eye=>eye.sub(f.train.root.position));
  const fixedStation=f.station.position.clone(),fixedBench=f.bench.getWorldPosition(new Vector3());
  const stationOffsets=eyePositions().map(eye=>f.station.position.clone().sub(eye));
  for(let i=1;i<=720;i++)frame(i*1000/72,tracking);
  assert(f.ride.distance>20,'The train must actually travel.');
  near(f.station.position,fixedStation);near(f.bench.getWorldPosition(new Vector3()),fixedBench);
  eyePositions().forEach((eye,i)=>{
    near(eye.clone().sub(f.train.root.position),carriageOffsets[i]);
    assert(f.station.position.clone().sub(eye).distanceTo(stationOffsets[i])>20,'The fixed station should recede from each eye.');
  });
  assert.equal(f.train.doorOpen,false);
  near(f.train.root.position,new Vector3(0,0,-4-f.ride.distance));
});

test('boarding cancels a rotated room-origin offset once while preserving measured height',()=>{
  const f=fixture(),tracking=pose(3,1.3,-2,.4),head=new Vector3(),direction=new Vector3();
  f.rig.rotation.y=.8;const parked=f.train.root.position.clone(),platform=f.station.position.clone();
  place(f.ride,'board',tracking);readHeadPose(f.rig,tracking,head,direction);
  near(head,new Vector3(-.55,2.2,1));assert.equal(f.rig.rotation.y,.8);near(f.train.root.position,parked);near(f.station.position,platform);
  const before=head.clone();tracking.makeTranslation(3.2,1.3,-2);readHeadPose(f.rig,tracking,head,direction);
  assert(Math.abs(head.distanceTo(before)-.2)<1e-8,'Physical leaning must remain visible.');
  near(f.train.root.position,parked);
  const beforeTurn=head.clone();snapAroundHead(f.rig,tracking,Math.PI/6);readHeadPose(f.rig,tracking,head,direction);
  near(head,beforeTurn);near(f.train.root.position,parked);assert.equal(f.ride.distance,0);
});

test('seat choices preserve tracking height and pauses never drag or recenter the traveller',()=>{
  const f=fixture(),tracking=pose(2,1.18,-3),head=new Vector3(),direction=new Vector3();
  place(f.ride,'board',tracking);place(f.ride,'seat',tracking);readHeadPose(f.rig,tracking,head,direction);
  near(head,new Vector3(-.86,2.08,-4));assert.equal(f.ride.seat,'left');assert.equal(f.ride.eyeHeight,1.2);
  f.ticket.position.set(-.86,1.4,-5.25);const ticketOffset=f.ticket.position.clone().sub(f.train.root.position);
  f.ride.toggleJourney();for(let i=0;i<200;i++)f.ride.update(1/72);
  const routeDistance=f.ride.distance;f.ride.pause();const trainPosition=f.train.root.position.clone(),rigPosition=f.rig.position.clone();
  tracking.makeTranslation(2.12,1.25,-3.08);snapAroundHead(f.rig,tracking,Math.PI/6);
  const turnPosition=f.rig.position.clone();for(let i=0;i<200;i++)f.ride.update(1/72);
  near(f.train.root.position,trainPosition);near(f.rig.position,turnPosition);assert(!turnPosition.equals(rigPosition));
  near(f.ticket.position.clone().sub(f.train.root.position),ticketOffset);assert.equal(f.ride.distance,routeDistance);
  assert.equal(f.ride.speed,0);assert.equal(f.ride.state,'paused');assert.equal(f.train.doorOpen,false);
  place(f.ride,'seat',tracking);readHeadPose(f.rig,tracking,head,direction);
  near(head,new Vector3(.86,2.15,-4-routeDistance));assert.equal(f.ride.seat,'right');assert.equal(f.ride.distance,routeDistance);assert.equal(f.ride.state,'paused');
});

test('XR re-entry rebases a new tracking origin at the last seated viewpoint for both eyes',async t=>{
  const {xr,frame}=await headset(t),f=fixture(),tracking=pose(2.2,1.2,-3,.2);
  const head=new Vector3(),facing=new Vector3();place(f.ride,'board',tracking);place(f.ride,'seat',tracking);
  f.ride.toggleJourney();for(let i=0;i<100;i++)f.ride.update(1/72);f.ride.pause();
  const leaned=pose(2.35,1.23,-2.92,.4);snapAroundHead(f.rig,leaned,Math.PI/6);readHeadPose(f.rig,leaned,head,facing);
  const lastHead=head.clone(),lastFacing=facing.clone(),trainPosition=f.train.root.position.clone(),distance=f.ride.distance;
  // Same one-time horizontal rebase used by main.js on the first new XR frame.
  const resumed=pose(-2.7,1.18,4.1,-1.1);
  placeTraveller(f.rig,resumed,new Vector3(head.x,f.ride.floorHeight,head.z),Math.atan2(-facing.x,-facing.z));
  readHeadPose(f.rig,resumed,head,facing);
  assert(Math.abs(head.x-lastHead.x)<1e-8&&Math.abs(head.z-lastHead.z)<1e-8);assert(Math.abs(head.y-2.08)<1e-8);near(facing,lastFacing);
  xr.setAnimationLoop(()=>{f.scene.updateMatrixWorld();xr.updateCamera(f.camera);});frame(0,resumed);
  const eyes=xr.getCamera().cameras.map(eye=>new Vector3().setFromMatrixPosition(eye.matrixWorld));
  near(eyes[0].clone().add(eyes[1]).multiplyScalar(.5),head);assert(Math.abs(eyes[0].distanceTo(eyes[1])-.064)<1e-8);
  frame(1,pose(-2.6,1.18,4.1,-1.1));
  const nextEyes=xr.getCamera().cameras.map(eye=>new Vector3().setFromMatrixPosition(eye.matrixWorld));
  nextEyes.forEach((eye,i)=>assert(Math.abs(eye.distanceTo(eyes[i])-.1)<1e-8,'Leaning after re-entry must remain natural.'));
  near(f.train.root.position,trainPosition);assert.equal(f.ride.distance,distance);assert.equal(f.ride.state,'paused');
});

test('route completion is bounded independently of rig position and returns only to the platform',()=>{
  const f=fixture(),tracking=pose(4,1.65,-6);place(f.ride,'board',tracking);place(f.ride,'seat',tracking);f.ride.toggleJourney();
  // Room offsets or a snap-turn pivot are not the train route coordinate.
  f.rig.position.z-=9000;
  let reached=false;for(let i=0;i<15000&&!reached;i++)reached=f.ride.update(.05);
  assert(reached);assert.equal(f.ride.distance,ROUTE_LENGTH);assert.equal(f.ride.state,'arrived');assert.equal(f.ride.speed,0);assert.equal(f.train.doorOpen,false);
  near(f.train.root.position,new Vector3(0,0,-4-ROUTE_LENGTH));assert.equal(f.ride.toggleJourney(),false);
  const platform=f.station.position.clone();place(f.ride,'home',tracking);
  const head=new Vector3();readHeadPose(f.rig,tracking,head,new Vector3());near(head,new Vector3(HOME.x,HOME.y+1.65,HOME.z));
  near(f.train.root.position,new Vector3(0,0,-4));near(f.station.position,platform);
  assert.equal(f.ride.state,'platform');assert.equal(f.ride.distance,0);assert.equal(f.ride.seat,null);assert.equal(f.train.doorOpen,true);assert.equal(f.ride.moving,false);
});

test('rapid actions cannot skip boarding, double-place a seat or start during a fade',()=>{
  const f=fixture(),tracking=pose(2,1.4,-1);
  assert.equal(f.ride.request('seat'),false);assert.equal(f.ride.toggleJourney(),false);
  assert(f.ride.request('board'));assert.equal(f.ride.request('board'),false);assert.equal(f.ride.request('home'),false);assert.equal(f.ride.toggleJourney(),false);
  f.ride.finishTransition();assert(f.ride.transitioning,'A transition cannot finish before placement.');
  assert(f.ride.commitPlacement(tracking));const position=f.rig.position.clone();assert.equal(f.ride.commitPlacement(tracking),false);near(f.rig.position,position);
  assert.equal(f.ride.request('seat'),false);assert.equal(f.ride.toggleJourney(),false);f.ride.update(10);assert.equal(f.ride.distance,0);
  f.ride.finishTransition();assert.equal(f.ride.state,'boarded');assert.equal(f.ride.journeyLabel,'Depart');
  assert(f.ride.request('seat'));assert(f.ride.commitPlacement(tracking));assert.equal(f.ride.request('seat'),false);assert.equal(f.ride.seat,'left');f.ride.finishTransition();
  assert(f.ride.toggleJourney());f.ride.update(.05);assert(f.ride.moving);assert.equal(f.ride.journeyLabel,'Pause journey');
  assert(f.ride.request('home'));assert.equal(f.ride.moving,false);assert.equal(f.ride.toggleJourney(),false);assert.equal(f.ride.speed,0);
});
