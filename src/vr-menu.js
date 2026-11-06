import * as THREE from 'three';

export function createVRMenu(actions){
  const group=new THREE.Group();group.visible=false;
  // A recalled control surface stays legible from a window seat even when the
  // visitor is looking toward the carriage wall. It never moves their gaze.
  const backing=new THREE.Mesh(new THREE.BoxGeometry(.94,1.04,.018),new THREE.MeshBasicMaterial({color:0xb7a372,depthTest:false,depthWrite:false}));backing.renderOrder=90;group.add(backing);
  const buttons=[];
  function panel(text,y,action,width=.84,height=.085){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d');
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshBasicMaterial({map:texture,depthTest:false,depthWrite:false});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);mesh.position.set(0,y,.012);mesh.renderOrder=91;group.add(mesh);
    function draw(label,hover=false){ctx.fillStyle=hover&&!mesh.userData.disabled?'#326574':'#183f4c';ctx.fillRect(0,0,1024,128);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=mesh.userData.disabled?'#becfc8':'#fff6dc';ctx.font='42px sans-serif';ctx.fillText(label,512,65,960);texture.needsUpdate=true;}
    mesh.userData={action,label:text,draw,disabled:false};draw(text);if(action)buttons.push(mesh);return mesh;
  }
  panel('THE QUIET LINE',.44,null,.84,.065);
  const status=panel('At the little station',.35,null,.84,.06);
  panel('Board train',.22,actions.journey);
  panel('Choose window seat',.115,actions.viewpoint);
  panel('Let the day pass',.01,actions.moment);
  panel('Sound on',-.095,actions.sound);
  panel('Return to station',-.2,actions.home);
  panel('Exit experience',-.39,actions.exit);
  const raycaster=new THREE.Raycaster();raycaster.far=6;const tempMatrix=new THREE.Matrix4();
  let highlighted=null;
  return {group,buttons,
    hit(controller){tempMatrix.identity().extractRotation(controller.matrixWorld);raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);raycaster.ray.direction.set(0,0,-1).applyMatrix4(tempMatrix);return raycaster.intersectObjects(buttons.filter(b=>!b.userData.disabled),false)[0]||null;},
    hover(hit){const next=hit?.object||null;if(highlighted===next)return;if(highlighted)highlighted.userData.draw(highlighted.userData.label);highlighted=next;if(next)next.userData.draw(next.userData.label,true);},
    update({journey,seat,status:statusText,sound,moment='Let the day pass',busy=false,aboard=false,arrived=false}){
      const labels=[journey,seat,moment,sound?'Sound on':'Sound off','Return to station','Exit experience'];
      const disabled=[busy||arrived,busy||!aboard,false,false,busy,false];
      buttons.forEach((b,i)=>{if(b.userData.label!==labels[i]||b.userData.disabled!==disabled[i]){b.userData.label=labels[i];b.userData.disabled=disabled[i];b.userData.draw(labels[i],b===highlighted);}});
      if(status.userData.label!==statusText){status.userData.label=statusText;status.userData.draw(statusText);}
    },
  };
}
