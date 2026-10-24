import * as THREE from 'three';
import './style.css';
import { createWorld } from './world.js';
import { createVRMenu } from './vr-menu.js';
import { Soundscape } from './audio.js';
import { WAYPOINTS, ROUTE_END, smoothSpeed, advanceJourney, snapDirection, validTeleport } from './motion.js';
import { readHeadPose, snapAroundHead, placeTicket } from './xr-pose.js';
import { createExitAction } from './exit.js';
import { boardTravelDeck, boardStation, translateTraveller } from './travel.js';

const $=id=>document.getElementById(id);
const canvas=$('world');
const audio=new Soundscape();
let renderer,scene,camera,rig,world,menu;
let started=false,moving=false,speed=0,waypoint=0,yaw=0,pitch=-.055,transitioning=false,elapsed=0,lastTime=0;
let noticeTimer,sessionStarting=false,needsMenuPlacement=false,needsDeckBoarding=false,exiting=false;
const keys=new Set(),controllers=[],snapLatches=new Map(),teleportLatches=new Map();
const temp=new THREE.Vector3(),direction=new THREE.Vector3(),head=new THREE.Vector3();
const trackingHead=new THREE.Matrix4().makeTranslation(0,1.65,0);
const raycaster=new THREE.Raycaster(),rotation=new THREE.Matrix4(),waterPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const target=new THREE.Vector3();let teleportTarget=null;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const exitExperience=createExitAction({
  getSession:()=>renderer?.xr.getSession(),
  stop:()=>{
    exiting=true;started=false;moving=false;speed=0;keys.clear();clearTimeout(noticeTimer);
    $('closing').hidden=false;
    renderer?.setAnimationLoop(null);
    void audio.dispose().catch(()=>{});
  },
  dispose:()=>renderer?.dispose(),
  closePage:()=>window.close(),
  leavePage:()=>window.location.replace('about:blank'),
});

function notice(text){$('notice').textContent=text;$('notice').classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.remove('visible'),5500);}
function failure(error){console.error(error);$('loading').hidden=true;$('fatal').hidden=false;$('fatal-message').textContent=error?.message||'Please try a browser with WebGL support.';}
function updateLabels(){
  $('journey').textContent=moving?'Pause drifting':'Begin drifting';$('journey').setAttribute('aria-pressed',String(moving));
  $('sound').textContent=audio.muted?'Sound off':'Sound on';$('sound').setAttribute('aria-pressed',String(!audio.muted));$('sound').setAttribute('aria-label',audio.muted?'Enable sound':'Mute sound');
  menu?.update(moving,!audio.muted);
}
async function startAudio(){if(exiting)return;try{await audio.start();}catch{if(!exiting)notice('Sound is unavailable. The world is still yours to explore.');}}
function explore(){started=true;document.body.classList.add('exploring');$('intro').hidden=true;$('toolbar').hidden=false;startAudio();canvas.focus();}
function boardDeck(){
  if(!renderer.xr.isPresenting){camera.updateMatrix();trackingHead.copy(camera.matrix);}
  boardTravelDeck(rig,trackingHead,world.cart);
}
function toggleJourney(){
  if(transitioning)return;
  if(!started)explore();
  if(rig.position.z<=ROUTE_END+.01&&!moving){notice('You’ve reached the far end of the line. Return home for another journey.');return;}
  moving=!moving;if(!moving)speed=0;
  if(world.cart.visible){
    if(!renderer.xr.isPresenting){camera.updateMatrix();trackingHead.copy(camera.matrix);}
    boardStation(rig,trackingHead,world.station);
    world.cart.visible=false;needsDeckBoarding=false;
  }
  updateLabels();
  if(moving){$('place-name').textContent='The drifting station';notice('The whole station travels with you. Pause whenever you like.');}
}
function toggleSound(){audio.toggle();if(!audio.muted)startAudio();updateLabels();}
let fadeMaterial;
function transitionTo(position,label,index){
  if(transitioning)return;transitioning=true;moving=false;speed=0;keys.clear();updateLabels();
  $('fade').style.opacity='1';fadeMaterial.opacity=1;
  setTimeout(()=>{
    if(exiting)return;
    temp.set(position.x,position.y,position.z).sub(rig.position);
    translateTraveller(rig,world.cart,menu.group,temp);
    if(index!==undefined)waypoint=index;
    world.cart.visible=index!==0;
    if(world.cart.visible)boardDeck();
    else world.station.position.set(0,0,0);
    $('place-name').textContent=label;
    setTimeout(()=>{$('fade').style.opacity='0';fadeMaterial.opacity=0;transitioning=false;},100);
  },160);
}
function nextViewpoint(){if(!started)explore();const i=(waypoint+1)%WAYPOINTS.length;transitionTo(WAYPOINTS[i],WAYPOINTS[i].name,i);audio.chime(660,.2,.08);}
function returnHome(){if(!started)explore();transitionTo(WAYPOINTS[0],WAYPOINTS[0].name,0);}
function settings(open){$('settings').hidden=!open;$('help-toggle').setAttribute('aria-expanded',String(open));if(open)$('close-settings').focus();else $('help-toggle').focus();}

async function detectXR(){
  const button=$('enter-vr'),label=button.querySelector('span');
  if(!window.isSecureContext){label.textContent='Open on HTTPS for VR';$('xr-note').textContent='Headset VR needs HTTPS. Screen exploration is ready.';return;}
  if(!navigator.xr){label.textContent='Open in Meta Quest';$('xr-note').textContent='Explore here, or open this page in your headset.';return;}
  try{
    if(await navigator.xr.isSessionSupported('immersive-vr')){button.disabled=false;label.textContent='Step inside in VR';$('xr-note').textContent='Meta Quest ready · Headphones welcome';}
    else{label.textContent='Open in Meta Quest';$('xr-note').textContent='No VR headset detected. Screen exploration is ready.';}
  }catch{label.textContent='VR unavailable here';$('xr-note').textContent='Open directly in Quest Browser to enter VR.';}
}
function placeMenu(){
  readHeadPose(rig,trackingHead,head,direction);
  placeTicket(menu.group,head,direction,rig.position.y);
}
async function enterVR(){
  if(exiting||sessionStarting||renderer.xr.isPresenting)return;sessionStarting=true;$('enter-vr').disabled=true;
  let session;
  try{
    const pending=navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor']});
    startAudio();session=await pending;
    if(exiting){await session.end();return;}
    await renderer.xr.setSession(session);
  }catch(error){if(session)await session.end().catch(()=>{});notice(`VR could not start. ${error.name==='NotAllowedError'?'Allow immersive access in your headset and try again.':'Open this page directly in Quest Browser and try again.'}`);}
  finally{sessionStarting=false;$('enter-vr').disabled=false;}
}

async function init(){
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch{throw new Error('This browser could not create a WebGL canvas. Try Chrome, Edge, or Meta Quest Browser with hardware acceleration enabled.');}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
  renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');renderer.xr.setFramebufferScaleFactor(1);renderer.xr.setFoveation(1);
  scene=new THREE.Scene();scene.background=new THREE.Color(0x2098c7);
  camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,16000);camera.position.set(0,1.65,0);camera.rotation.order='YXZ';
  rig=new THREE.Group();rig.position.set(0,.32,4);rig.add(camera);scene.add(rig);
  world=await createWorld(scene,renderer);
  if(exiting)return;
  world.waterMaterial.uniforms.calm.value=reducedMotion?0:1;$('still-water').checked=reducedMotion;
  menu=createVRMenu({journey:toggleJourney,viewpoint:nextViewpoint,sound:toggleSound,home:returnHome,exit:exitExperience});scene.add(menu.group);
  fadeMaterial=new THREE.MeshBasicMaterial({color:0x122c3d,transparent:true,opacity:0,side:THREE.BackSide,depthTest:false,depthWrite:false});
  const fadeSphere=new THREE.Mesh(new THREE.SphereGeometry(.15,16,12),fadeMaterial);fadeSphere.frustumCulled=false;fadeSphere.renderOrder=1000;scene.add(fadeSphere);
  const reticle=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.RingGeometry(.22,.27,40),new THREE.MeshBasicMaterial({color:0xfff5cc,side:THREE.DoubleSide,depthTest:false}));ring.rotation.x=-Math.PI/2;reticle.add(ring);
  const dot=new THREE.Mesh(new THREE.CircleGeometry(.035,12),new THREE.MeshBasicMaterial({color:0xfff5cc,side:THREE.DoubleSide,depthTest:false}));dot.rotation.x=-Math.PI/2;reticle.add(dot);reticle.visible=false;reticle.renderOrder=8;scene.add(reticle);
  const controllerBodyGeometry=new THREE.CapsuleGeometry(.022,.075,4,8);
  const controllerBodyMaterial=new THREE.MeshStandardMaterial({color:0xd2e0d9,roughness:.7});
  for(let i=0;i<2;i++){
    const controller=renderer.xr.getController(i);controller.userData.input=null;
    controller.addEventListener('connected',event=>{controller.userData.input=event.data;});
    controller.addEventListener('disconnected',()=>{controller.userData.input=null;teleportLatches.clear();teleportTarget=null;});
    controller.addEventListener('selectstart',()=>{if(!exiting&&menu.group.visible){const hit=menu.hit(controller);if(hit){hit.object.userData.action();controller.userData.input?.gamepad?.hapticActuators?.[0]?.pulse(.2,35);}}});
    controller.addEventListener('squeezestart',()=>{menu.group.visible=true;placeMenu();});
    const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]);
    const line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xfff3d6,transparent:true,opacity:.55}));line.scale.z=1.6;controller.add(line);controller.userData.line=line;
    rig.add(controller);controllers.push(controller);
    const grip=renderer.xr.getControllerGrip(i);const body=new THREE.Mesh(controllerBodyGeometry,controllerBodyMaterial);body.rotation.x=-.3;grip.add(body);rig.add(grip);
  }
  renderer.xr.addEventListener('sessionstart',()=>{
    if(exiting){void renderer.xr.getSession().end().catch(()=>{});return;}
    started=true;moving=false;speed=0;keys.clear();snapLatches.clear();teleportLatches.clear();document.body.classList.add('immersive','exploring');$('intro').hidden=true;$('toolbar').hidden=false;$('settings').hidden=true;
    menu.group.visible=true;needsMenuPlacement=true;needsDeckBoarding=world.cart.visible;updateLabels();
    renderer.xr.getSession().addEventListener('visibilitychange',()=>{if(renderer.xr.getSession()?.visibilityState!=='visible'){moving=false;speed=0;updateLabels();audio.suspend();}else startAudio();});
  });
  renderer.xr.addEventListener('sessionend',()=>{
    if(exiting)return;
    document.body.classList.remove('immersive');menu.group.visible=false;moving=false;speed=0;needsDeckBoarding=false;reticle.visible=false;teleportTarget=null;keys.clear();camera.position.set(0,1.65,0);camera.rotation.set(pitch,yaw,0);camera.fov=72;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();if(world.cart.visible)boardDeck();updateLabels();
  });
  await renderer.compileAsync(scene,camera);
  if(exiting)return;
  renderer.setAnimationLoop((time,frame)=>{
    if(exiting)return;
    const dt=Math.min((time-lastTime)/1000||.016,.05);lastTime=time;elapsed+=dt;
    if(!renderer.xr.isPresenting){
      if(started&&$('settings').hidden){if(keys.has('ArrowLeft'))yaw+=dt*.7;if(keys.has('ArrowRight'))yaw-=dt*.7;if(keys.has('ArrowUp'))pitch=Math.min(1.35,pitch+dt*.5);if(keys.has('ArrowDown'))pitch=Math.max(-1.35,pitch-dt*.5);}
      camera.rotation.set(pitch,yaw,0,'YXZ');
    }else{
      const viewerPose=frame?.getViewerPose(renderer.xr.getReferenceSpace());
      if(viewerPose)trackingHead.fromArray(viewerPose.transform.matrix);
      rig.updateWorldMatrix(true,true);
      if(needsDeckBoarding&&viewerPose){boardDeck();needsDeckBoarding=false;}
      if(needsMenuPlacement){placeMenu();needsMenuPlacement=false;}
      let hovered=null,aiming=false;
      for(const controller of controllers){
        const source=controller.userData.input;if(!source)continue;
        const hit=menu.group.visible?menu.hit(controller):null;if(hit)hovered=hit;
        controller.userData.line.visible=!!hit;controller.userData.line.scale.z=hit?.distance||1.6;
        const pad=source.gamepad;if(!pad)continue;
        const ax=pad.axes.length>=4?pad.axes[2]:pad.axes[0]||0,ay=pad.axes.length>=4?pad.axes[3]:pad.axes[1]||0;
        if(source.handedness==='right'){
          const snap=snapDirection(ax,snapLatches.get(source)||false);snapLatches.set(source,snap.latched);
          if(snap.turn&&!transitioning){
            snapAroundHead(rig,trackingHead,snap.turn);
          }
        }
        if(source.handedness==='left'){
          if(ay<-.65&&!transitioning){
            aiming=true;teleportLatches.set(source,true);rotation.identity().extractRotation(controller.matrixWorld);raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);raycaster.ray.direction.set(0,0,-1).applyMatrix4(rotation);
            if(raycaster.ray.direction.y<-.05&&raycaster.ray.intersectPlane(waterPlane,target)&&validTeleport(target,rig.position)){
              teleportTarget=target.clone();reticle.position.copy(target);reticle.position.y=.035;reticle.visible=true;controller.userData.line.visible=true;controller.userData.line.scale.z=raycaster.ray.origin.distanceTo(target);
            }else{teleportTarget=null;reticle.visible=false;}
          }else if(teleportLatches.get(source)){
            teleportLatches.set(source,false);if(teleportTarget)transitionTo({x:teleportTarget.x,y:.22,z:teleportTarget.z},'A little closer to the horizon');teleportTarget=null;reticle.visible=false;
          }
        }
      }
      if(!aiming)reticle.visible=false;menu.hover(hovered);
    }
    if(!transitioning){speed=smoothSpeed(speed,moving,dt);const nextZ=advanceJourney(rig.position.z,speed,dt);temp.set(0,0,nextZ-rig.position.z);translateTraveller(rig,world.cart.visible?world.cart:world.station,menu.group,temp);if(rig.position.z<=ROUTE_END&&moving){moving=false;speed=0;updateLabels();notice('The far end of the line. A good place to stay awhile.');}}
    if(renderer.xr.isPresenting)readHeadPose(rig,trackingHead,head,direction);
    else camera.getWorldPosition(head);
    fadeSphere.position.copy(head);
    world.update(elapsed,rig.position);audio.update(elapsed,speed);
    renderer.render(scene,camera);
  });
  $('loading').style.opacity='0';setTimeout(()=>$('loading').hidden=true,800);
  detectXR();
  // Read-only metrics for real-device performance inspection.
  window.quietLine={get diagnostics(){return {drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,immersive:renderer.xr.isPresenting,position:rig.position.toArray(),moving,speed,waypoint,ready:true};}};
}

$('explore').addEventListener('click',explore);$('enter-vr').addEventListener('click',enterVR);
$('exit-experience').addEventListener('click',exitExperience);
$('fatal-exit').addEventListener('click',exitExperience);
$('loading-exit').addEventListener('click',exitExperience);
$('journey').addEventListener('click',toggleJourney);$('viewpoint').addEventListener('click',nextViewpoint);$('sound').addEventListener('click',toggleSound);$('home').addEventListener('click',returnHome);
$('help-toggle').addEventListener('click',()=>settings($('settings').hidden));$('close-settings').addEventListener('click',()=>settings(false));
$('volume').addEventListener('input',e=>{audio.setVolume(Number(e.target.value)/100);});
$('still-water').addEventListener('change',e=>{world.waterMaterial.uniforms.calm.value=e.target.checked?0:1;});
$('quality').addEventListener('change',e=>{renderer.setPixelRatio(Math.min(devicePixelRatio,e.target.value==='high'?2:1.5));if(renderer.xr.isPresenting)notice('Screen detail changed. VR keeps its headset-friendly rendering.');});
$('return-intro').addEventListener('click',()=>{settings(false);moving=false;speed=0;started=false;updateLabels();$('intro').hidden=false;$('toolbar').hidden=true;document.body.classList.remove('exploring');});
let dragging=false,previousX=0,previousY=0;
canvas.addEventListener('pointerdown',e=>{if(!world)return;dragging=true;previousX=e.clientX;previousY=e.clientY;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!dragging||renderer.xr.isPresenting)return;yaw-=(e.clientX-previousX)*.003;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-previousY)*.003,-1.35,1.35);previousX=e.clientX;previousY=e.clientY;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>dragging=false);
window.addEventListener('keydown',e=>{
  if(exiting)return;
  const focusedTag=document.activeElement?.tagName;
  if(['INPUT','SELECT','TEXTAREA'].includes(focusedTag)&&e.code!=='Escape')return;
  if(['BUTTON','A'].includes(focusedTag)&&['Space','Enter'].includes(e.code))return;
  if(!world)return;keys.add(e.code);
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.repeat)return;
  if(e.code==='Space')toggleJourney();if(e.code==='KeyV')nextViewpoint();if(e.code==='KeyR')returnHome();if(e.code==='KeyM')toggleSound();if(e.code==='KeyH')settings($('settings').hidden);if(e.code==='Escape')settings(false);
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();dragging=false;});
document.addEventListener('visibilitychange',()=>{if(exiting)return;if(document.hidden){keys.clear();moving=false;speed=0;updateLabels();audio.suspend();}else if(started)startAudio();});
window.addEventListener('resize',()=>{if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer?.setAnimationLoop(null);audio.suspend();failure(new Error('The graphics connection was interrupted. Reload to return to the sea.'));});
init().catch(failure);
