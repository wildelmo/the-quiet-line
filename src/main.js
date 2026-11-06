import * as THREE from 'three';
import './style.css';
import { createWorld } from './world.js';
import { createVRMenu } from './vr-menu.js';
import { Soundscape } from './audio.js';
import { HOME, snapDirection } from './motion.js';
import { readHeadPose, snapAroundHead, placeTicket } from './xr-pose.js';
import { createExitAction } from './exit.js';
import { createTrainRide, placeTraveller } from './travel.js';
import { MOMENTS, startHourFromDate } from './daylight.js';

const $=id=>document.getElementById(id);
const canvas=$('world');
const audio=new Soundscape();
let renderer,scene,camera,rig,world,menu,ride;
let started=false,yaw=-.65,pitch=-.055,elapsed=0,lastTime=0;
let noticeTimer,lastLabelSecond=-1,sessionStarting=false,trackingPlacement=null,exiting=false;
const keys=new Set(),controllers=[],snapLatches=new Map();
const direction=new THREE.Vector3(),head=new THREE.Vector3();
const trackingHead=new THREE.Matrix4().makeTranslation(0,1.65,0);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const exitExperience=createExitAction({
  getSession:()=>renderer?.xr.getSession(),
  stop:()=>{
    exiting=true;started=false;ride?.pause();keys.clear();clearTimeout(noticeTimer);
    $('closing').hidden=false;
    renderer?.setAnimationLoop(null);
    void audio.dispose().catch(()=>{});
  },
  dispose:()=>renderer?.dispose(),
  closePage:()=>window.close(),
  leavePage:()=>window.location.replace('about:blank'),
});

function notice(text){$('notice').textContent=text;$('notice').classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.remove('visible'),3200);}
function failure(error){console.error(error);$('loading').hidden=true;$('fatal').hidden=false;$('fatal-message').textContent=error?.message||'Please try a browser with WebGL support.';}
function updateLabels(){
  if(!ride)return;
  $('journey').textContent=ride.journeyLabel;$('journey').setAttribute('aria-pressed',String(ride.moving));
  $('journey').disabled=ride.transitioning||ride.state==='arrived';
  $('viewpoint').textContent=ride.seatLabel;$('viewpoint').disabled=ride.transitioning||ride.state==='platform';
  $('home').disabled=ride.transitioning||ride.state==='platform';
  $('sound').textContent=audio.muted?'Sound off':'Sound on';$('sound').setAttribute('aria-pressed',String(!audio.muted));$('sound').setAttribute('aria-label',audio.muted?'Enable sound':'Mute sound');
  world.setAboard(ride.state!=='platform');
  menu?.update({journey:ride.journeyLabel,seat:ride.seatLabel,status:rideStatus(),sound:!audio.muted,moment:MOMENTS[moment].label,momentIndex:moment,busy:ride.transitioning,aboard:ride.state!=='platform',arrived:ride.state==='arrived'});
  placeLabel();
}
async function startAudio(){if(exiting)return;try{await audio.start();}catch{if(!exiting)notice('Sound is unavailable. The world is still yours to explore.');}}
function explore(){started=true;document.body.classList.add('exploring');$('intro').hidden=true;$('toolbar').hidden=false;startAudio();canvas.focus();notice('Drag to look. Open Menu for seats, time of day and sound.');}
function toggleJourney(){
  if(!ride||ride.transitioning||trackingPlacement||sessionStarting)return;
  if(!started)explore();
  if(ride.state==='platform'){transitionTo('board');return;}
  if(ride.state==='arrived'){notice('The end of the line. Return to the station whenever you like.');return;}
  closeMenus();ride.toggleJourney();
  updateLabels();
  if(ride.moving)notice('The train is leaving. Pause whenever you like.');
}
function toggleSound(){audio.toggle();if(!audio.muted)startAudio();updateLabels();}
let moment=0;
function rideStatus(){
  if(ride.state==='platform')return 'At the little station';
  const place=ride.seat?`${ride.seat==='left'?'Left':'Right'} window seat`:'Aboard the train';
  const state=ride.moving?'travelling':ride.state==='arrived'?'end of the line':ride.distance>0?'paused':'at the platform';
  return `${place} · ${state}`;
}
function placeLabel(){if(ride)$('place-name').textContent=`${rideStatus()}, ${world.light.description}`;}
function setMoment(index){
  moment=((index%MOMENTS.length)+MOMENTS.length)%MOMENTS.length;const chosen=MOMENTS[moment];
  world.setFlowing(chosen.hour===undefined);if(chosen.hour!==undefined)world.setHour(chosen.hour);
  $('moment').value=chosen.name;updateLabels();
}
function nextMoment(){if(!started)explore();setMoment(moment+1);notice(MOMENTS[moment].hour===undefined?'The day flows on at its own pace.':`${MOMENTS[moment].label}, held still for a while.`);audio.chime(528,-.2,.05);}
function visitor(kind,light){
  if(kind==='train'){audio.trainWhistle();if(started)notice(light.lantern>.5?'Far off, a lit train glides across the sea.':'Far off, a train crosses the water, in no hurry either.');}
  if(kind==='plane'){audio.planeHum();if(started)notice('A little plane hums over, going somewhere slowly.');}
}
let fadeMaterial;
function transitionTo(action){
  if(exiting||sessionStarting||trackingPlacement||!ride.request(action))return;
  closeMenus();
  keys.clear();updateLabels();
  $('fade').style.opacity='1';fadeMaterial.opacity=1;
  setTimeout(()=>{
    if(exiting)return;
    if(!renderer.xr.isPresenting){
      rig.rotation.set(0,0,0);
      camera.position.set(0,action==='seat'?1.2:1.65,0);
      yaw=action==='home'?-.65:action==='seat'?(ride.seat==='left'?1:-1):0;pitch=action==='seat'?-.10:-.035;
      camera.rotation.set(pitch,yaw,0,'YXZ');camera.updateMatrix();trackingHead.copy(camera.matrix);
    }
    ride.commitPlacement(trackingHead);
    updateLabels();
    setTimeout(()=>{
      if(exiting)return;
      $('fade').style.opacity='0';fadeMaterial.opacity=0;ride.finishTransition();updateLabels();
      if(action==='board')notice('Welcome aboard. Open Menu to choose a window seat.');
      else if(action==='seat')notice(`${ride.seat==='left'?'Left':'Right'} window seat. ${ride.state==='arrived'?'Stay awhile, or return to the station.':ride.distance>0?'Continue whenever you like.':'Depart whenever you like.'}`);
      else notice('Back at the little station. The train is waiting.');
    },100);
  },160);
}
function nextViewpoint(){if(!ride||ride.state==='platform'||ride.transitioning)return;if(!started)explore();transitionTo('seat');audio.chime(660,.2,.08);}
function returnHome(){if(!ride)return;if(!started)explore();transitionTo('home');}
function settings(open,{restoreFocus=true}={}){
  if(exiting)return;
  if(renderer?.xr.isPresenting){if(open)toggleVRMenu();else menu?.close();return;}
  if(open&&!world)return;
  if(open&&!started)explore();
  const wasOpen=!$('settings').hidden;
  $('settings').hidden=!open;$('help-toggle').setAttribute('aria-expanded',String(open));keys.clear();
  if(open){placeLabel();$('close-settings').focus({preventScroll:true});}
  else if(wasOpen){
    $('settings').querySelectorAll('details').forEach(detail=>detail.open=false);
    (restoreFocus?$('help-toggle'):canvas).focus({preventScroll:true});
  }
}
function closeMenus(){settings(false,{restoreFocus:false});menu?.close();}

async function detectXR(){
  const button=$('enter-vr'),label=button.querySelector('span');
  if(!window.isSecureContext){label.textContent='Open on HTTPS for VR';$('xr-note').textContent='Headset VR needs HTTPS. Screen exploration is ready.';return;}
  if(!navigator.xr){label.textContent='Open in Meta Quest';$('xr-note').textContent='Explore here, or open this page in your headset.';return;}
  try{
    if(await navigator.xr.isSessionSupported('immersive-vr')){button.disabled=false;label.textContent='Step inside in VR';$('xr-note').textContent='In VR, squeeze either grip to open Menu.';}
    else{label.textContent='Open in Meta Quest';$('xr-note').textContent='No VR headset detected. Screen exploration is ready.';}
  }catch{label.textContent='VR unavailable here';$('xr-note').textContent='Open directly in Quest Browser to enter VR.';}
}
function placeMenu(){
  readHeadPose(rig,trackingHead,head,direction);
  placeTicket(menu.group,head,direction,ride.floorHeight);
}
function toggleVRMenu(){
  if(exiting||!renderer?.xr.isPresenting||trackingPlacement||ride?.transitioning)return;
  if(menu.group.visible){menu.close();return;}
  placeMenu();menu.open();updateLabels();
}
async function enterVR(){
  if(exiting||sessionStarting||ride.transitioning||renderer.xr.isPresenting)return;closeMenus();sessionStarting=true;ride.pause();updateLabels();$('enter-vr').disabled=true;
  let session;
  try{
    const pending=navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor']});
    startAudio();session=await pending;
    if(exiting){await session.end();return;}
    camera.updateMatrix();trackingHead.copy(camera.matrix);readHeadPose(rig,trackingHead,head,direction);
    trackingPlacement={anchor:new THREE.Vector3(head.x,ride.floorHeight,head.z),yaw:Math.atan2(-direction.x,-direction.z)};
    await renderer.xr.setSession(session);
  }catch(error){trackingPlacement=null;if(session)await session.end().catch(()=>{});notice(`VR could not start. ${error.name==='NotAllowedError'?'Allow immersive access in your headset and try again.':'Open this page directly in Quest Browser and try again.'}`);}
  finally{sessionStarting=false;$('enter-vr').disabled=false;}
}

async function init(){
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch{throw new Error('This browser could not create a WebGL canvas. Try Chrome, Edge, or Meta Quest Browser with hardware acceleration enabled.');}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
  renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');renderer.xr.setFramebufferScaleFactor(1);renderer.xr.setFoveation(1);
  scene=new THREE.Scene();scene.background=new THREE.Color(0x2098c7);
  camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,16000);camera.position.set(0,1.65,0);camera.rotation.order='YXZ';
  rig=new THREE.Group();rig.position.set(HOME.x,HOME.y,HOME.z);rig.add(camera);scene.add(rig);
  world=await createWorld(scene,renderer,{reducedMotion,onEvent:visitor,startHour:startHourFromDate()});
  if(exiting)return;
  world.waterMaterial.uniforms.calm.value=reducedMotion?0:1;$('still-water').checked=reducedMotion;
  menu=createVRMenu({journey:toggleJourney,viewpoint:nextViewpoint,sound:toggleSound,home:returnHome,moment:nextMoment,setMoment,close:()=>menu.close(),exit:exitExperience});scene.add(menu.group);
  ride=createTrainRide({rig,train:world.train,ticket:menu.group});updateLabels();
  fadeMaterial=new THREE.MeshBasicMaterial({color:0x122c3d,transparent:true,opacity:0,side:THREE.BackSide,depthTest:false,depthWrite:false});
  const fadeSphere=new THREE.Mesh(new THREE.SphereGeometry(.15,16,12),fadeMaterial);fadeSphere.frustumCulled=false;fadeSphere.renderOrder=1000;scene.add(fadeSphere);
  const controllerBodyGeometry=new THREE.CapsuleGeometry(.022,.075,4,8);
  const controllerBodyMaterial=new THREE.MeshStandardMaterial({color:0xd2e0d9,roughness:.7});
  for(let i=0;i<2;i++){
    const controller=renderer.xr.getController(i);controller.userData.input=null;
    controller.addEventListener('connected',event=>{controller.userData.input=event.data;});
    controller.addEventListener('disconnected',()=>{controller.userData.input=null;snapLatches.clear();});
    controller.addEventListener('selectstart',()=>{if(!exiting&&menu.group.visible){const hit=menu.hit(controller);if(hit){hit.object.userData.action();controller.userData.input?.gamepad?.hapticActuators?.[0]?.pulse(.2,35);}}});
    controller.addEventListener('squeezestart',toggleVRMenu);
    const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]);
    const line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xfff3d6,transparent:true,opacity:.55}));line.scale.z=1.6;controller.add(line);controller.userData.line=line;
    rig.add(controller);controllers.push(controller);
    const grip=renderer.xr.getControllerGrip(i);const body=new THREE.Mesh(controllerBodyGeometry,controllerBodyMaterial);body.rotation.x=-.3;grip.add(body);rig.add(grip);
  }
  renderer.xr.addEventListener('sessionstart',()=>{
    if(exiting){void renderer.xr.getSession().end().catch(()=>{});return;}
    started=true;ride.pause();keys.clear();snapLatches.clear();document.body.classList.add('immersive','exploring');$('intro').hidden=true;$('toolbar').hidden=false;$('settings').hidden=true;
    menu.close();updateLabels();
    renderer.xr.getSession().addEventListener('visibilitychange',()=>{if(renderer.xr.getSession()?.visibilityState!=='visible'){menu.close();ride.pause();updateLabels();audio.suspend();}else startAudio();});
  });
  renderer.xr.addEventListener('sessionend',()=>{
    if(exiting)return;
    document.body.classList.remove('immersive');menu.close();ride.pause();keys.clear();snapLatches.clear();
    // Preserve the last actual viewpoint, including a lean or snap turn. The
    // next XR session rebases its new room origin here once, after its first pose.
    readHeadPose(rig,trackingHead,head,direction);
    const anchor=new THREE.Vector3(head.x,ride.floorHeight,head.z);
    yaw=Math.atan2(-direction.x,-direction.z);pitch=Math.asin(THREE.MathUtils.clamp(direction.y,-1,1));
    rig.rotation.set(0,0,0);camera.position.set(0,ride.eyeHeight,0);camera.rotation.set(pitch,yaw,0,'YXZ');
    camera.updateMatrix();trackingHead.copy(camera.matrix);placeTraveller(rig,trackingHead,anchor);
    trackingPlacement=null;camera.fov=72;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();updateLabels();
  });
  await renderer.compileAsync(scene,camera);
  if(exiting)return;
  renderer.setAnimationLoop((time,frame)=>{
    if(exiting||(!renderer.xr.isPresenting&&document.hidden))return;
    const dt=Math.min((time-lastTime)/1000||.016,.05);lastTime=time;elapsed+=dt;
    if(!renderer.xr.isPresenting){
      if(started&&$('settings').hidden){if(keys.has('ArrowLeft'))yaw+=dt*.7;if(keys.has('ArrowRight'))yaw-=dt*.7;if(keys.has('ArrowUp'))pitch=Math.min(1.35,pitch+dt*.5);if(keys.has('ArrowDown'))pitch=Math.max(-1.35,pitch-dt*.5);}
      camera.rotation.set(pitch,yaw,0,'YXZ');
    }else{
      const viewerPose=frame?.getViewerPose(renderer.xr.getReferenceSpace());
      if(viewerPose)trackingHead.fromArray(viewerPose.transform.matrix);
      rig.updateWorldMatrix(true,true);
      if(trackingPlacement&&viewerPose){placeTraveller(rig,trackingHead,trackingPlacement.anchor,trackingPlacement.yaw);trackingPlacement=null;}
      let hovered=null;
      for(const controller of controllers){
        const source=controller.userData.input;if(!source)continue;
        const hit=menu.group.visible?menu.hit(controller):null;if(hit)hovered=hit;
        controller.userData.line.visible=!!hit;controller.userData.line.scale.z=hit?.distance||1.6;
        const pad=source.gamepad;if(!pad)continue;
        const ax=pad.axes.length>=4?pad.axes[2]:pad.axes[0]||0;
        if(source.handedness==='right'){
          const snap=snapDirection(ax,snapLatches.get(source)||false);snapLatches.set(source,snap.latched);
          if(snap.turn&&!ride.transitioning&&!trackingPlacement){
            menu.close();
            snapAroundHead(rig,trackingHead,snap.turn);
          }
        }
      }
      menu.hover(hovered);
    }
    if(ride.update(dt)){updateLabels();notice('The end of the line. Stay awhile, or return to the station.');}
    if(renderer.xr.isPresenting)readHeadPose(rig,trackingHead,head,direction);
    else {camera.getWorldPosition(head);camera.getWorldDirection(direction);}
    fadeSphere.position.copy(head);
    world.update(elapsed,head,dt,{position:head,direction,aboard:ride.state!=='platform',enabled:started&&!ride.transitioning&&$('settings').hidden&&!menu.group.visible});
    audio.update(elapsed,ride.speed,world.light,ride.distance,ride.state!=='platform');
    if((elapsed|0)%4===0&&lastLabelSecond!==(elapsed|0)){lastLabelSecond=elapsed|0;if(started&&!renderer.xr.isPresenting)placeLabel();}
    renderer.render(scene,camera);
  });
  $('loading').style.opacity='0';setTimeout(()=>$('loading').hidden=true,800);
  detectXR();
  // Read-only state and existing scene-inspection controls for device QA.
  window.quietLine={look(y,p){yaw=y;pitch=p;},setHour(h){world.setFlowing(false);world.setHour(h);placeLabel();},skip(seconds){elapsed+=seconds;},get diagnostics(){return {drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,immersive:renderer.xr.isPresenting,position:rig.position.toArray(),camera:head.toArray(),cameraDirection:direction.toArray(),rig:{position:rig.position.toArray(),yaw:rig.rotation.y},moving:ride.moving,speed:ride.speed,transitioning:ride.transitioning,audio:{volume:audio.volume,muted:audio.muted,context:audio.context?.state??'not-started'},controls:{screenOpen:!$('settings').hidden,xrOpen:menu.group.visible,xrPage:menu.page,xrPosition:menu.group.position.toArray()},train:{state:ride.state,distance:ride.distance,position:world.train.root.position.toArray(),doorOpen:ride.doorOpen,seat:ride.seat},station:world.station.position.toArray(),hour:world.hour,elapsed,atmosphere:world.atmosphere,ready:true};}};
}

$('explore').addEventListener('click',explore);$('enter-vr').addEventListener('click',enterVR);
$('exit-experience').addEventListener('click',exitExperience);
$('menu-exit').addEventListener('click',exitExperience);
$('fatal-exit').addEventListener('click',exitExperience);
$('loading-exit').addEventListener('click',exitExperience);
$('journey').addEventListener('click',toggleJourney);$('viewpoint').addEventListener('click',nextViewpoint);$('sound').addEventListener('click',toggleSound);$('home').addEventListener('click',returnHome);
$('help-toggle').addEventListener('click',()=>settings($('settings').hidden));$('close-settings').addEventListener('click',()=>settings(false));
$('volume').addEventListener('input',e=>{audio.setVolume(Number(e.target.value)/100);});
$('volume').value=String(Math.round(audio.volume*100));
$('still-water').addEventListener('change',e=>{world.waterMaterial.uniforms.calm.value=e.target.checked?0:1;});
$('moment').addEventListener('change',e=>{setMoment(MOMENTS.findIndex(m=>m.name===e.target.value));});
$('quality').addEventListener('change',e=>{renderer.setPixelRatio(Math.min(devicePixelRatio,e.target.value==='high'?2:1.5));if(renderer.xr.isPresenting)notice('Screen detail changed. VR keeps its headset-friendly rendering.');});
$('return-intro').addEventListener('click',()=>{settings(false);ride.pause();started=false;updateLabels();$('intro').hidden=false;$('toolbar').hidden=true;document.body.classList.remove('exploring');});
let dragging=false,previousX=0,previousY=0;
canvas.addEventListener('pointerdown',e=>{if(!world)return;if(!$('settings').hidden){settings(false,{restoreFocus:false});return;}dragging=true;previousX=e.clientX;previousY=e.clientY;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!dragging||renderer.xr.isPresenting)return;yaw-=(e.clientX-previousX)*.003;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-previousY)*.003,-1.35,1.35);previousX=e.clientX;previousY=e.clientY;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>dragging=false);
window.addEventListener('keydown',e=>{
  if(exiting||sessionStarting)return;
  const focusedTag=document.activeElement?.tagName;
  if(['INPUT','SELECT','TEXTAREA'].includes(focusedTag)&&e.code!=='Escape')return;
  if(['BUTTON','A'].includes(focusedTag)&&['Space','Enter'].includes(e.code))return;
  if(!world)return;keys.add(e.code);
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.repeat)return;
  if(e.code==='Space')toggleJourney();if(e.code==='KeyV')nextViewpoint();if(e.code==='KeyR')returnHome();if(e.code==='KeyM')toggleSound();if(e.code==='KeyT')nextMoment();if(e.code==='KeyH'||e.code==='Escape'){e.preventDefault();if(renderer.xr.isPresenting)toggleVRMenu();else if(started||e.code==='KeyH')settings($('settings').hidden);}
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();dragging=false;});
document.addEventListener('visibilitychange',()=>{if(exiting)return;if(document.hidden){keys.clear();ride?.pause();updateLabels();audio.suspend();}else if(started)startAudio();});
window.addEventListener('resize',()=>{if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer?.setAnimationLoop(null);audio.suspend();failure(new Error('The graphics connection was interrupted. Reload to return to the sea.'));});
init().catch(failure);
