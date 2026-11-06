import test from 'node:test';
import assert from 'node:assert/strict';
import { Soundscape } from '../src/audio.js';

test('the quieter default, mute and volume changes share one bounded master gain',()=>{
  const sound=new Soundscape(),changes=[];
  sound.context={currentTime:4};sound.master={gain:{setTargetAtTime:(...args)=>changes.push(args)}};
  sound.applyVolume();assert(Math.abs(changes.at(-1)[0]-.2275)<1e-8);
  sound.setVolume(.6);assert(Math.abs(changes.at(-1)[0]-.39)<1e-8);
  sound.toggle();assert.equal(changes.at(-1)[0],0);
  sound.setVolume(.3);assert.equal(changes.at(-1)[0],0,'Changing volume while muted must stay silent.');
  sound.toggle();assert(Math.abs(changes.at(-1)[0]-.195)<1e-8);
  sound.setVolume(Infinity);assert.equal(sound.volume,.3);
  sound.setVolume(-1);assert.equal(changes.at(-1)[0],0);
  sound.setVolume(4);assert.equal(changes.at(-1)[0],.65);
});

test('moving audio forwards actual route distance without the old overlapping travel bells',()=>{
  const sound=new Soundscape(),contacts=[],bells=[];
  sound.context={currentTime:10,state:'running'};sound.running=true;
  sound.surfGain=sound.windGain=sound.pad={gain:{setTargetAtTime(){}}};
  sound.rolling={update:(...args)=>contacts.push(args)};
  sound.chime=(...args)=>bells.push(args);
  sound.nextNote=sound.nextPhrase=sound.nextBird=sound.nextCricket=Infinity;
  for(let i=0;i<120;i++)sound.update(10+i/60,3,{night:0,lantern:0},200+i*.05);
  assert.equal(contacts.length,120);assert.deepEqual(contacts[0],[3,200]);assert.deepEqual(contacts.at(-1),[3,205.95]);assert.deepEqual(bells,[]);
  sound.update(12,0,{night:0,lantern:0},205.95);assert.deepEqual(contacts.at(-1),[0,205.95]);
  sound.context.state='suspended';sound.update(13,0,{night:0,lantern:0},205.95);assert.equal(contacts.length,121);
});

test('suspending the world silences rolling audio before freezing its clock',async()=>{
  const sound=new Soundscape(),calls=[];
  sound.context={suspend:async()=>calls.push('suspend')};sound.rolling={silence:()=>calls.push('silence')};
  await sound.suspend();assert.deepEqual(calls,['silence','suspend']);
});

test('the carriage shelters the listener from constant water and wind without changing master volume',()=>{
  const sound=new Soundscape(),surf=[],wind=[];
  sound.context={currentTime:4,state:'running'};sound.running=true;
  sound.surfGain={gain:{setTargetAtTime:(...args)=>surf.push(args)}};
  sound.windGain={gain:{setTargetAtTime:(...args)=>wind.push(args)}};
  sound.pad={gain:{setTargetAtTime(){}}};sound.rolling={update(){}};
  sound.nextNote=sound.nextPhrase=sound.nextBird=sound.nextCricket=Infinity;
  sound.update(4,0,{night:0,lantern:0},0,false);
  const outsideSurf=surf.at(-1)[0],outsideWind=wind.at(-1)[0],volume=sound.volume;
  sound.update(4,3,{night:0,lantern:0},30,true);
  assert(surf.at(-1)[0]<outsideSurf*.5&&surf.at(-1)[0]>0);
  assert(wind.at(-1)[0]<outsideWind*.5&&wind.at(-1)[0]>0);
  assert(surf.at(-1)[2]>=.5&&wind.at(-1)[2]>=.5,'The enclosure mix should fade rather than jump.');
  sound.update(4,0,{night:0,lantern:0},30,true);
  assert(surf.at(-1)[0]<outsideSurf*.5,'Pausing inside must not bring back the outside wash.');
  sound.update(4,0,{night:0,lantern:0},0,false);
  assert.equal(surf.at(-1)[0],outsideSurf);assert.equal(wind.at(-1)[0],outsideWind);assert.equal(sound.volume,volume);
});
