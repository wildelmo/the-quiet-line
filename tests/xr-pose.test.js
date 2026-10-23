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

test('recalled ticket and blackout center stay with translated rotated viewer',()=>{
  const rig=new Group();rig.position.set(-3,.22,-720);rig.rotation.y=-Math.PI/2;
  const head=new Vector3(),direction=new Vector3(),tracking=new Matrix4().makeTranslation(0,1.2,0);
  readHeadPose(rig,tracking,head,direction);
  const ticket=new Group();placeTicket(ticket,head,direction,rig.position.y);
  near(ticket.position,new Vector3(-1.75,.77,-720));
  const blackout=new Group();blackout.position.copy(head);near(blackout.position,new Vector3(-3,1.42,-720));
  assert(ticket.position.distanceTo(head)<1.5);
});
