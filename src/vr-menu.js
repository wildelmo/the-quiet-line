import * as THREE from 'three';
import { MOMENTS } from './daylight.js';

export function createVRMenu(actions){
  const group=new THREE.Group();group.visible=false;
  // A compact, explicitly opened control surface. Depth-free drawing keeps its
  // buttons usable at a window seat without changing the visitor's viewpoint.
  // Use the transparent pass at full opacity: renderOrder alone cannot keep an
  // opaque UI surface above the world's later water and glass passes.
  const backing=new THREE.Mesh(new THREE.BoxGeometry(.54,.55,.012),new THREE.MeshBasicMaterial({color:0xb7a372,transparent:true,opacity:1,depthTest:false,depthWrite:false}));
  backing.renderOrder=90;group.add(backing);
  const buttons=[],pagePanels={main:[],time:[]};
  const raycaster=new THREE.Raycaster();raycaster.far=4;
  const tempMatrix=new THREE.Matrix4();
  let page='main',highlighted=null,mainStatus='At the little station',selectedMoment=0;

  function panel(label,x,y,width,height,action=null,pageName=null,fontSize=40){
    const canvas=document.createElement('canvas');canvas.width=Math.round(width*2000);canvas.height=Math.round(height*2000);
    const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:1,depthTest:false,depthWrite:false});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);mesh.position.set(x,y,.009);mesh.renderOrder=91;group.add(mesh);
    function draw(){
      const {selected,disabled,label}=mesh.userData,hover=mesh===highlighted&&!disabled;
      ctx.fillStyle=selected?(hover?'#f1dfba':'#fff6dc'):(hover?'#326574':'#183f4c');ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=selected?'#183f4c':disabled?'#becfc8':'#fff6dc';ctx.font=`${fontSize}px sans-serif`;
      ctx.fillText(label,canvas.width/2,canvas.height/2,canvas.width-28);texture.needsUpdate=true;
    }
    mesh.userData={label,disabled:false,selected:false,draw,action:action?()=>{
      if(group.visible&&mesh.visible&&!mesh.userData.disabled)action();
    }:null};
    if(action)buttons.push(mesh);
    if(pageName){pagePanels[pageName].push(mesh);mesh.visible=pageName===page;}
    draw();return mesh;
  }
  function change(mesh,values){
    let dirty=false;for(const [key,value] of Object.entries(values)){if(mesh.userData[key]!==value){mesh.userData[key]=value;dirty=true;}}
    if(dirty)mesh.userData.draw();
  }
  function clearHover(){if(highlighted){const previous=highlighted;highlighted=null;previous.userData.draw();}}
  function showPage(next){
    clearHover();page=next;
    for(const [name,panels] of Object.entries(pagePanels))for(const mesh of panels)mesh.visible=name===page;
    change(title,{label:page==='main'?'The Quiet Line':'Time of day'});
    change(status,{label:page==='main'?mainStatus:'Choose a moment'});
  }
  function close(){group.visible=false;showPage('main');}
  function selectMoment(index){
    selectedMoment=index;
    momentButtons.forEach((button,i)=>change(button,{selected:i===index}));
    actions.setMoment?.(index);
  }

  const title=panel('The Quiet Line',-.068,.222,.354,.056,null,null,37);
  panel('Close',.192,.222,.12,.056,()=>{close();actions.close?.();},null,34);
  const status=panel(mainStatus,0,.168,.504,.026,null,null,27);
  const journey=panel('Board train',0,.096,.504,.08,actions.journey,'main',44);
  const seat=panel('Choose window seat',-.075,.002,.354,.08,actions.viewpoint,'main',36);
  const roof=panel('Roof',.19,.002,.12,.08,actions.roof,'main',36);
  panel('Time of day',-.13,-.092,.244,.08,()=>showPage('time'),'main',36);
  const sound=panel('Sound on',.13,-.092,.244,.08,actions.sound,'main',36);
  const home=panel('Return to station',-.13,-.186,.244,.08,actions.home,'main',34);
  panel('Exit experience',.13,-.186,.244,.08,actions.exit,'main',34);
  const momentButtons=MOMENTS.map((moment,index)=>panel(moment.label,index%2===0?-.13:.13,.096-Math.floor(index/2)*.094,.244,.08,()=>selectMoment(index),'time',34));
  panel('Back to journey',0,-.186,.504,.08,()=>showPage('main'),'time',38);
  change(seat,{disabled:true});change(roof,{disabled:true});change(home,{disabled:true});change(momentButtons[0],{selected:true});

  return {group,buttons,
    get page(){return page;},
    open(){showPage('main');group.visible=true;},
    close,
    hit(controller){
      if(!group.visible)return null;
      tempMatrix.identity().extractRotation(controller.matrixWorld);raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);raycaster.ray.direction.set(0,0,-1).applyMatrix4(tempMatrix);
      return raycaster.intersectObjects(buttons.filter(button=>button.visible&&!button.userData.disabled),false)[0]||null;
    },
    hover(hit){
      const candidate=hit?.object,next=group.visible&&candidate?.visible&&!candidate.userData.disabled?candidate:null;
      if(highlighted===next)return;clearHover();highlighted=next;if(next)next.userData.draw();
    },
    update({journey:journeyLabel,seat:seatLabel,roof:roofLabel='Stand on the roof',onRoof=false,status:statusText,sound:enabled,moment='Let the day pass',momentIndex,busy=false,aboard=false,arrived=false}){
      mainStatus=statusText||'At the little station';
      change(journey,{label:journeyLabel,disabled:busy||arrived});change(seat,{label:seatLabel,disabled:busy||!aboard});
      change(roof,{label:onRoof?'On roof':'Roof',disabled:busy||!aboard||onRoof,selected:onRoof});void roofLabel;
      change(sound,{label:enabled?'Sound on':'Sound off'});change(home,{disabled:busy||!aboard});
      const index=Number.isInteger(momentIndex)&&momentIndex>=0&&momentIndex<MOMENTS.length?momentIndex:MOMENTS.findIndex(item=>item.label===moment||item.name===moment);
      if(index>=0)selectedMoment=index;
      momentButtons.forEach((button,i)=>change(button,{selected:i===selectedMoment}));
      if(page==='main')change(status,{label:mainStatus});
      if(highlighted?.userData.disabled)clearHover();
    },
  };
}
