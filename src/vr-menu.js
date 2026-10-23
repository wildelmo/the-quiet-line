import * as THREE from 'three';

export function createVRMenu(actions){
  const group=new THREE.Group();group.visible=false;
  const backing=new THREE.Mesh(new THREE.BoxGeometry(.94,.78,.018),new THREE.MeshBasicMaterial({color:0xb7a372}));group.add(backing);
  const buttons=[];
  function panel(text,y,action,width=.84,height=.085){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d');
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshBasicMaterial({map:texture});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);mesh.position.set(0,y,.012);group.add(mesh);
    function draw(label,hover=false){ctx.fillStyle=hover?'#326574':'#183f4c';ctx.fillRect(0,0,1024,128);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff6dc';ctx.font='42px sans-serif';ctx.fillText(label,512,65);texture.needsUpdate=true;}
    draw(text);if(action){mesh.userData={action,label:text,draw};buttons.push(mesh);}return mesh;
  }
  panel('THE QUIET LINE',.305,null,.84,.065);
  panel('Begin drifting',.19,actions.journey);
  panel('Next viewpoint',.085,actions.viewpoint);
  panel('Sound on',-.02,actions.sound);
  panel('Return to station',-.125,actions.home);
  panel('Exit experience',-.28,actions.exit);
  const raycaster=new THREE.Raycaster();raycaster.far=6;const tempMatrix=new THREE.Matrix4();
  let highlighted=null;
  return {group,buttons,
    hit(controller){tempMatrix.identity().extractRotation(controller.matrixWorld);raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);raycaster.ray.direction.set(0,0,-1).applyMatrix4(tempMatrix);return raycaster.intersectObjects(buttons,false)[0]||null;},
    hover(hit){const next=hit?.object||null;if(highlighted===next)return;if(highlighted)highlighted.userData.draw(highlighted.userData.label);highlighted=next;if(next)next.userData.draw(next.userData.label,true);},
    update(moving,sound){const labels=[moving?'Pause drifting':'Begin drifting','Next viewpoint',sound?'Sound on':'Sound off','Return to station','Exit experience'];buttons.forEach((b,i)=>{if(b.userData.label!==labels[i]){b.userData.label=labels[i];b.userData.draw(labels[i],b===highlighted);}});},
  };
}
