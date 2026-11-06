import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Matrix4, Vector3, Quaternion, Euler } from 'three';
import { readHeadPose, snapAroundHead, placeTicket } from '../src/xr-pose.js';

const near=(a,b)=>assert(a.distanceTo(b)<1e-8,`${a.toArray()} != ${b.toArray()}`);

test('tracking-local pose includes distant rig translation and yaw',()=>{
  const rig=new Group();rig.position.set(5,.22,-320);rig.rotation.y=Math.PI/2;
  const tracking=new Matrix4().makeTranslation(.4,1.65,.2);
  const position=new Vector3(),direction=new Vector3();
  readHeadPose(rig,tracking,position,direction);
  near(position,new Vector3(5.2,1.87,-320.4));near(direction,new Vector3(-1,0,0));
});

test('snap turns preserve the head position at every travel distance',()=>{
  for(const z of [4,-85,-320,-1100])for(const yaw of [0,.7,-2.1]){
    const rig=new Group();rig.position.set(2,.22,z);rig.rotation.y=yaw;
    const tracking=new Matrix4().compose(new Vector3(.45,1.3,-.2),new Quaternion().setFromEuler(new Euler(.1,.3,0)),new Vector3(1,1,1));
    const before=new Vector3(),after=new Vector3(),direction=new Vector3();
    readHeadPose(rig,tracking,before,direction);const origin=rig.position.clone();
    snapAroundHead(rig,tracking,Math.PI/6);readHeadPose(rig,tracking,after,direction);
    near(before,after);assert(rig.position.distanceTo(origin)<.3);
  }
});

test('explicit ticket placement follows the actual tracked head without changing its pose',()=>{
  const rig=new Group();rig.position.set(-3,.22,-720);rig.rotation.y=-Math.PI/2;
  const head=new Vector3(),direction=new Vector3(),tracking=new Matrix4().makeTranslation(0,1.2,0);
  readHeadPose(rig,tracking,head,direction);
  const originalHead=head.clone(),originalDirection=direction.clone(),originalRig=rig.matrixWorld.clone(),originalTracking=tracking.clone();
  const ticket=new Group();placeTicket(ticket,head,direction,rig.position.y);
  near(ticket.position,new Vector3(-2.1,1.2,-720));
  const blackout=new Group();blackout.position.copy(head);near(blackout.position,new Vector3(-3,1.42,-720));
  near(head,originalHead);near(direction,originalDirection);assert(rig.matrixWorld.equals(originalRig));assert(tracking.equals(originalTracking));
  assert.equal(ticket.rotation.x,0);assert.equal(ticket.rotation.z,0);
});

test('standing, seated and short visitors get the same head-relative menu offset',()=>{
  for(const height of [.3,.8,1.2,1.65,2.4])for(const pitch of [-1,-.3,0,.7,1]){
    const head=new Vector3(6,height,-700),facing=new Vector3(0,0,-1).applyEuler(new Euler(pitch,.7,0,'YXZ'));
    const ticket=new Group();placeTicket(ticket,head,facing,20);
    const offset=ticket.position.clone().sub(head);
    assert(Math.abs(Math.hypot(offset.x,offset.z)-.9)<1e-8);assert(Math.abs(offset.y+.22)<1e-8);
    assert(Math.abs(ticket.rotation.y-.7)<1e-8);assert.equal(ticket.rotation.x,0);
  }
});

test('vertical gaze reuses the last horizontal placement yaw without jumping to a floor clamp',()=>{
  const ticket=new Group(),head=new Vector3(-4,.35,-80),facing=new Vector3(-1,0,0);
  placeTicket(ticket,head,facing);const previous=ticket.position.clone(),yaw=ticket.rotation.y;
  for(const vertical of [new Vector3(0,1,0),new Vector3(0,-1,0),new Vector3(.000001,1,.000002)]){
    placeTicket(ticket,head,vertical,4);near(ticket.position,previous);assert.equal(ticket.rotation.y,yaw);
  }
  assert(Math.abs(ticket.position.y-.13)<1e-8);
  const firstOpen=new Group();placeTicket(firstOpen,head,new Vector3(0,1,0));near(firstOpen.position,new Vector3(-4,.13,-80.9));
});

test('an impossible tracked head height is treated as a wrong headset floor and levelled away', async () => {
  const { levelCorrection, STANDING_EYE_HEIGHT } = await import('../src/xr-pose.js');
  let correction = 0;
  for (let i = 0; i < 72 * 8; i++) correction = levelCorrection(2.85, correction, 1 / 72);
  assert.ok(Math.abs(correction - (STANDING_EYE_HEIGHT - 2.85)) < .01, `floating visitor is brought down: ${correction}`);
  for (let i = 0; i < 72 * 8; i++) correction = levelCorrection(.2, correction, 1 / 72);
  assert.ok(Math.abs(correction - (STANDING_EYE_HEIGHT - .2)) < .01, 'a sunken visitor is lifted');
  for (let i = 0; i < 72 * 8; i++) correction = levelCorrection(1.7, correction, 1 / 72);
  assert.ok(Math.abs(correction) < .005, 'a believable height restores the real floor');
  let glitch = 0;
  for (let i = 0; i < 3; i++) glitch = levelCorrection(9, glitch, 1 / 72);
  assert.ok(Math.abs(glitch) < .3, 'a momentary tracking glitch barely moves the visitor');
  assert.equal(levelCorrection(NaN, .4, 1 / 72), .4, 'an unreadable pose changes nothing');
  assert.equal(levelCorrection(1.0, 0, 1 / 72), 0, 'a seated visitor is left alone');
});
