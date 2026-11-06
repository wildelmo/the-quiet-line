import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Group, Vector3 } from 'three';
import { createVRMenu } from '../src/vr-menu.js';
import { MOMENTS } from '../src/daylight.js';

function fixture(t){
  const previous=globalThis.document;
  globalThis.document={createElement(tag){assert.equal(tag,'canvas');return {width:0,height:0,getContext(){return {fillRect(){},fillText(){}};}};}};
  t.after(()=>{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;});
  const calls=[];
  const actions=Object.fromEntries(['journey','viewpoint','sound','home','exit','close'].map(name=>[name,()=>calls.push(name)]));
  actions.setMoment=index=>calls.push(index);
  const menu=createVRMenu(actions);
  const find=label=>menu.buttons.find(button=>button.userData.label===label);
  const click=label=>{const button=find(label);assert(button,`Missing ${label}`);button.userData.action();};
  const hit=label=>{
    const button=find(label),controller=new Group();menu.group.updateMatrixWorld(true);
    controller.position.copy(button.getWorldPosition(new Vector3())).add(new Vector3(0,0,1));controller.updateMatrixWorld(true);
    return menu.hit(controller);
  };
  return {menu,calls,find,click,hit};
}

test('the compact menu starts hidden and open/update/close never place it',t=>{
  const {menu,hit,click,calls}=fixture(t);
  const size=new Box3().setFromObject(menu.group).getSize(new Vector3());assert(size.x<.55&&size.y<.56);
  assert.equal(menu.group.visible,false);assert.equal(hit('Board train'),null);click('Board train');assert.deepEqual(calls,[]);
  menu.group.position.set(4,1.3,-8);menu.group.rotation.y=.8;
  const position=menu.group.position.clone(),rotation=menu.group.quaternion.clone();
  menu.open();assert.equal(menu.group.visible,true);assert.equal(menu.page,'main');
  menu.update({journey:'Depart',seat:'Choose window seat',status:'Aboard the train',sound:true,aboard:true});
  menu.close();assert.equal(menu.group.visible,false);menu.update({journey:'Depart',seat:'Choose window seat',sound:true,aboard:true});
  assert.equal(menu.group.visible,false);assert(menu.group.position.equals(position));assert(menu.group.quaternion.equals(rotation));
});

test('every menu surface uses a late overlay pass after water and before the travel fade',t=>{
  const {menu}=fixture(t),surfaces=[];menu.group.traverse(object=>{if(object.isMesh)surfaces.push(object);});
  assert(surfaces.length>menu.buttons.length,'The backing and noninteractive labels must also be checked.');
  for(const mesh of surfaces){
    assert.equal(mesh.material.transparent,true,'Opaque surfaces render before transparent water regardless of renderOrder.');
    assert.equal(mesh.material.opacity,1);assert.equal(mesh.material.depthTest,false);assert.equal(mesh.material.depthWrite,false);
    assert(mesh.renderOrder>=90&&mesh.renderOrder<1000,'The overlay must remain above the world but beneath the travel fade.');
  }
  assert.equal(menu.group.children[0].renderOrder,90);
  assert(surfaces.slice(1).every(mesh=>mesh.renderOrder===91),'Labels and actions must draw after the backing.');
});

test('time choices live on a separate page, select by index, and return without repositioning',t=>{
  const {menu,find,click,hit,calls}=fixture(t);menu.open();
  assert.equal(find(MOMENTS[0].label).visible,false);click(MOMENTS[3].label);assert.deepEqual(calls,[]);
  click('Time of day');assert.equal(menu.page,'time');assert.equal(find('Board train').visible,false);
  assert.equal(hit(MOMENTS[0].label)?.object,find(MOMENTS[0].label));
  click('Board train');assert.deepEqual(calls,[],'A stale hit on a hidden page cannot depart.');
  MOMENTS.forEach((moment,index)=>{
    click(moment.label);assert.equal(calls.at(-1),index);assert.equal(menu.group.visible,true);assert.equal(menu.page,'time');
    MOMENTS.forEach((item,i)=>assert.equal(find(item.label).userData.selected,i===index));
  });
  menu.update({journey:'Depart',seat:'Choose window seat',sound:true,aboard:true,momentIndex:2});assert.equal(find(MOMENTS[2].label).userData.selected,true);
  click('Back to journey');assert.equal(menu.page,'main');assert.equal(hit('Depart')?.object,find('Depart'));
  assert(menu.group.position.equals(new Vector3()));
});

test('Close is available on both pages and reopening always starts at the main menu',t=>{
  const {menu,click,calls}=fixture(t);menu.open();click('Time of day');click('Close');
  assert.equal(menu.group.visible,false);assert.equal(menu.page,'main');assert.deepEqual(calls,['close']);
  click('Close');assert.deepEqual(calls,['close']);menu.open();assert.equal(menu.page,'main');click('Close');assert.deepEqual(calls,['close','close']);
});

test('disabled and hidden buttons cannot be hit or activate through a stale selection',t=>{
  const {menu,find,click,hit,calls}=fixture(t);menu.open();
  for(const label of ['Choose window seat','Return to station']){assert.equal(hit(label),null);click(label);}assert.deepEqual(calls,[]);
  menu.update({journey:'Depart',seat:'Choose window seat',sound:false,aboard:true,busy:false});
  assert.equal(hit('Return to station')?.object,find('Return to station'));
  const seatHit=hit('Choose window seat');assert.equal(seatHit?.object,find('Choose window seat'));menu.hover(seatHit);
  menu.update({journey:'Depart',seat:'Choose window seat',sound:false,aboard:true,busy:true});
  for(const label of ['Depart','Choose window seat','Return to station']){assert.equal(hit(label),null);click(label);}
  assert.deepEqual(calls,[]);
  menu.update({journey:'Board train',seat:'Choose window seat',sound:false,aboard:false,busy:false});assert.equal(hit('Return to station'),null);click('Return to station');assert.deepEqual(calls,[]);
  assert.equal(hit('Close')?.object,find('Close'));click('Sound off');assert.deepEqual(calls,['sound']);
  menu.close();assert.equal(hit('Sound off'),null);menu.hover(seatHit);click('Exit experience');assert.deepEqual(calls,['sound']);
});
