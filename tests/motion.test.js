import test from 'node:test';
import assert from 'node:assert/strict';
import { smoothSpeed, advanceJourney, snapDirection, ROUTE_LENGTH, TRAIN_SPEED } from '../src/motion.js';
test('travel is opt-in and accelerates gently',()=>{assert.equal(smoothSpeed(0,false,.016),0);const v=smoothSpeed(0,true,.016);assert(v>0&&v<.03);assert(smoothSpeed(1,false,.016)<1);});
test('a suspended tab cannot cause a large travel jump',()=>{assert.equal(advanceJourney(0,TRAIN_SPEED,60),advanceJourney(0,TRAIN_SPEED,.05));});
test('travel distance stops at the far endpoint and never moves backwards',()=>{assert.equal(advanceJourney(ROUTE_LENGTH-.01,TRAIN_SPEED,.05),ROUTE_LENGTH);assert.equal(advanceJourney(100,TRAIN_SPEED,-1),100);});
test('the train eases toward three meters per second and slows near the route end',()=>{let speed=0;for(let i=0;i<1200;i++)speed=smoothSpeed(speed,true,1/72);assert(speed>2.99&&speed<=TRAIN_SPEED);assert(smoothSpeed(speed,true,.05,.1)<speed);});
test('snap turn fires once until the stick is centered',()=>{const first=snapDirection(.9,false);assert.equal(first.turn,-Math.PI/6);assert.equal(snapDirection(.9,first.latched).turn,0);assert.equal(snapDirection(.1,true).latched,false);});
