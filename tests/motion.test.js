import test from 'node:test';
import assert from 'node:assert/strict';
import { smoothSpeed, advanceJourney, snapDirection, validTeleport, ROUTE_END } from '../src/motion.js';
test('travel is opt-in and accelerates gently',()=>{assert.equal(smoothSpeed(0,false,.016),0);const v=smoothSpeed(0,true,.016);assert(v>0&&v<.03);assert(smoothSpeed(1,false,.016)<1);});
test('a suspended tab cannot cause a large travel jump',()=>{assert.equal(advanceJourney(0,1.35,60),advanceJourney(0,1.35,.05));});
test('travel stops at the far endpoint',()=>{assert.equal(advanceJourney(ROUTE_END+.01,1.35,.05),ROUTE_END);});
test('snap turn fires once until the stick is centered',()=>{const first=snapDirection(.9,false);assert.equal(first.turn,-Math.PI/6);assert.equal(snapDirection(.9,first.latched).turn,0);assert.equal(snapDirection(.1,true).latched,false);});
test('teleport rejects outside route, nonfinite, and distant points',()=>{const o={x:0,z:0};assert(validTeleport({x:1,z:-20},o));for(const p of [{x:NaN,z:0},{x:0,z:Infinity},{x:25,z:0},{x:0,z:-50},{x:0,z:20},{x:0,z:-1200}])assert.equal(validTeleport(p,o),false);});
