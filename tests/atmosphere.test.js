import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, Group, Scene } from 'three';
import { weatherAt } from '../src/weather.js';
import { passengerAt, createPassenger } from '../src/passenger.js';
import { mistDensity, VEIL_CENTRE } from '../src/cloud-dancer.js';
import { createDragon, dragonSpine } from '../src/dragon.js';

test('weather leaves long clear intervals and a breeze precedes the shadow',()=>{
  assert.equal(weatherAt(0).rain,0);assert.equal(weatherAt(0).shadow,0);
  assert(weatherAt(40).gust>0);assert.equal(weatherAt(40).shadow,0);
  assert(weatherAt(110).shadow>.9);assert.equal(weatherAt(110).rain,0);
  assert(weatherAt(260).rain>.9);assert.equal(weatherAt(260).shadow,0);
  for(let t=0;t<1000;t+=.1){
    const a=weatherAt(t),b=weatherAt(t+1/72);
    for(const key of ['rain','shadow','gust']){
      assert(a[key]>=0&&a[key]<=1);assert(Math.abs(a[key]-b[key])<.01);
    }
  }
  assert.deepEqual(weatherAt(260,true),{rain:0,shadow:0,gust:0,travel:0});
});

test('passenger arrives softly, rests, departs, and stays away between visits',()=>{
  assert.equal(passengerAt(0).visible,false);
  assert.equal(passengerAt(38).opacity,0);
  assert.equal(passengerAt(80).phase,'watching');
  assert.equal(passengerAt(128).phase,'leaving');
  assert.equal(passengerAt(138).visible,false);
  assert.equal(passengerAt(400).visible,false);
  for(let t=0;t<1000;t+=.1){
    const a=passengerAt(t),b=passengerAt(t+1/72);
    assert(Math.abs(a.opacity-b.opacity)<.01);
  }
  assert.equal(passengerAt(300,true).phase,'resting');
});

test('dragon crosses the veil smoothly and mist is absent outside it',()=>{
  assert.equal(mistDensity(VEIL_CENTRE),1);
  assert.equal(mistDensity(new Vector3(0,0,0)),0);
  let peak=0;const point=new Vector3();
  for(let t=0;t<125;t+=.1){
    const a=mistDensity(dragonSpine(t,0,point));
    const b=mistDensity(dragonSpine(t+1/72,0,point));
    peak=Math.max(peak,a);assert(Math.abs(a-b)<.04);
  }
  assert(peak>.75,'the existing flight must actually intersect the new veil');
});

test('the passenger remains finite and follows the station during travel',()=>{
  const scene=new Scene(),station=new Group();scene.add(station);
  const dragon=createDragon(scene),passenger=createPassenger(station,dragon);
  passenger.update(80,1/72,{lantern:0});
  const before=passenger.root.getWorldPosition(new Vector3());
  station.position.z=-320;passenger.update(80,1/72,{lantern:1});
  const after=passenger.root.getWorldPosition(new Vector3());
  assert(Math.abs(after.z-before.z+320)<1e-8);
  passenger.root.traverse(o=>assert(o.position.toArray().every(Number.isFinite)));
  const still=createPassenger(station,dragon,{reducedMotion:true});
  still.update(0,1/72,{lantern:0});const pose=still.root.position.clone();
  still.update(1000,1/72,{lantern:0});assert.deepEqual(still.root.position,pose);
});

test('the wake rises with speed and lingers after the train stops', async () => {
  const { wakeAmountStep } = await import('../src/shaders.js');
  let amount = 0;
  for (let i = 0; i < 72 * 3; i++) amount = wakeAmountStep(amount, 3, 1 / 72);
  assert.ok(amount > .95, `full wake at full speed: ${amount}`);
  for (let i = 0; i < 72 * 2; i++) amount = wakeAmountStep(amount, 0, 1 / 72);
  assert.ok(amount > .3 && amount < .7, `still fading two seconds after stopping: ${amount}`);
  for (let i = 0; i < 72 * 12; i++) amount = wakeAmountStep(amount, 0, 1 / 72);
  assert.ok(amount < .03, 'gone after a while');
  assert.equal(wakeAmountStep(0, 0, 1 / 72), 0);
});
