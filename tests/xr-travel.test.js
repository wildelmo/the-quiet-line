import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Group, PerspectiveCamera, Matrix4, Vector3 } from 'three';
import { WebXRManager } from 'three/src/renderers/webxr/WebXRManager.js';
import { advanceJourney, smoothSpeed } from '../src/motion.js';
import { readHeadPose, snapAroundHead } from '../src/xr-pose.js';
import { boardTravelDeck, translateTraveller } from '../src/travel.js';

// Exercise Three's actual stereo camera update with synthetic headset poses.
// Only the session/graphics transport is stubbed; transforms are real Three.js.
async function headset(t) {
  const originalLayer = globalThis.XRWebGLLayer;
  globalThis.XRWebGLLayer = class {
    framebufferWidth = 2048;framebufferHeight = 1024;
    getViewport(view) { return {x:view.eye==='left'?0:1024,y:0,width:1024,height:1024}; }
  };
  t.after(() => { if(originalLayer===undefined)delete globalThis.XRWebGLLayer;else globalThis.XRWebGLLayer=originalLayer; });
  let nextFrame;
  const session = {
    enabledFeatures:[],renderState:{},
    addEventListener(){},updateRenderState(){},
    requestReferenceSpace:async()=>({}),
    requestAnimationFrame:fn=>{nextFrame=fn;return 1;},cancelAnimationFrame(){},
  };
  const renderer = {
    getRenderTarget:()=>null,getPixelRatio:()=>1,getSize:v=>v.set(1280,720),
    setPixelRatio(){},setSize(){},setRenderTargetFramebuffer(){},setRenderTarget(){},
  };
  const xr = new WebXRManager(renderer,{getContextAttributes:()=>({xrCompatible:true})});
  await xr.setSession(session);
  const projection = new PerspectiveCamera(90,1,.05,16000).projectionMatrix.toArray();
  return {xr,frame(time,x=0,z=0){
    const pose = {
      transform:{matrix:new Matrix4().makeTranslation(x,1.65,z).toArray()},
      views:['left','right'].map(eye=>({eye,projectionMatrix:projection,transform:{matrix:new Matrix4().makeTranslation(x+(eye==='left'?-.032:.032),1.65,z).toArray()}})),
    };
    nextFrame(time,{getViewerPose:()=>pose});
  }};
}

test('both rendered XR eyes and the deck advance by the same journey distance',async t=>{
  const {xr,frame}=await headset(t);
  const scene=new Scene(),rig=new Group(),camera=new PerspectiveCamera(72,1,.05,16000),deck=new Group(),ticket=new Group();
  rig.position.set(0,.32,4);rig.add(camera);scene.add(rig,deck,ticket);
  const tracking=new Matrix4(),head=new Vector3(),direction=new Vector3();
  let speed=0,boarding=true;
  xr.setAnimationLoop((time,frame)=>{
    tracking.fromArray(frame.getViewerPose(xr.getReferenceSpace()).transform.matrix);
    rig.updateWorldMatrix(true,true);
    if(boarding){boardTravelDeck(rig,tracking,deck);boarding=false;}
    speed=smoothSpeed(speed,true,1/72);
    translateTraveller(rig,deck,ticket,new Vector3(0,0,advanceJourney(rig.position.z,speed,1/72)-rig.position.z));
    readHeadPose(rig,tracking,head,direction);
    // Same transform update order as WebGLRenderer.render(scene,camera).
    scene.updateMatrixWorld();xr.updateCamera(camera);
  });
  // A user several meters away from the physical room origin must still board.
  frame(0,3.4,-2.2);
  const eyes=xr.getCamera().cameras;
  const offsets=eyes.map(eye=>new Vector3().setFromMatrixPosition(eye.matrixWorld).sub(deck.position));
  offsets.forEach(offset=>{assert(Math.abs(offset.x)<.04);assert(Math.abs(offset.z)<1e-8);});
  const start=deck.position.z;
  for(let i=1;i<=720;i++)frame(i*1000/72,3.4,-2.2);
  assert(deck.position.z<start-10,'The journey must actually advance.');
  eyes.forEach((eye,i)=>{
    const offset=new Vector3().setFromMatrixPosition(eye.matrixWorld).sub(deck.position);
    assert(offset.distanceTo(offsets[i])<1e-8,'A rendered eye separated from its deck.');
  });
});

test('boarding centers on the tracked viewer after yaw, while real walking stays independent',()=>{
  const rig=new Group(),deck=new Group();rig.position.set(2,.22,-320);rig.rotation.y=.8;
  const tracking=new Matrix4().makeTranslation(3,1.3,-2);
  const head=new Vector3(),facing=new Vector3();
  boardTravelDeck(rig,tracking,deck);readHeadPose(rig,tracking,head,facing);
  assert(Math.abs(deck.position.x-head.x)<1e-8);assert(Math.abs(deck.position.z-head.z)<1e-8);
  assert.equal(deck.position.y,.22);
  const parked=deck.position.clone();
  tracking.makeTranslation(3.2,1.3,-2);readHeadPose(rig,tracking,head,facing);
  assert(Math.abs(Math.hypot(head.x-parked.x,head.z-parked.z)-.2)<1e-8);
  assert(deck.position.equals(parked),'The deck must not chase physical walking.');
  const beforeTurn=head.clone();snapAroundHead(rig,tracking,Math.PI/6);readHeadPose(rig,tracking,head,facing);
  assert(head.distanceTo(beforeTurn)<1e-8);assert(deck.position.equals(parked));
});

test('travel, pause and reposition preserve the deck and ticket offsets',()=>{
  const rig=new Group(),deck=new Group(),ticket=new Group();rig.position.set(0,.32,4);
  const tracking=new Matrix4().makeTranslation(2,1.65,-3);
  boardTravelDeck(rig,tracking,deck);ticket.position.set(2,1.3,-.25);
  const deckOffset=deck.position.clone().sub(rig.position),ticketOffset=ticket.position.clone().sub(rig.position);
  for(const delta of [new Vector3(0,0,-.04),new Vector3(),new Vector3(4,-.1,-85)]){
    translateTraveller(rig,deck,ticket,delta);
    assert(deck.position.clone().sub(rig.position).distanceTo(deckOffset)<1e-8);
    assert(ticket.position.clone().sub(rig.position).distanceTo(ticketOffset)<1e-8);
  }
  const rest=new Vector3();rig.getWorldPosition(rest);assert(rest.distanceTo(rig.position)<1e-8);
});
