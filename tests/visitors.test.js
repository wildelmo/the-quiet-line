import test from 'node:test';
import assert from 'node:assert/strict';
import { crossingProgress, nextCrossing, TRAIN_CROSSING, PLANE_CROSSING } from '../src/sky-life.js';
import { wind, wrapAround } from '../src/life.js';
import { composePhrase, SCALE } from '../src/audio.js';

test('a crossing reports progress from zero to one and nothing before or after', () => {
  assert.equal(crossingProgress(10, null, 100), null);
  assert.equal(crossingProgress(5, 10, 100), null);
  assert.equal(crossingProgress(10, 10, 100), 0);
  assert.ok(Math.abs(crossingProgress(60, 10, 100) - .5) < 1e-9);
  assert.equal(crossingProgress(110, 10, 100), null);
});

test('visitors keep a calm schedule and never arrive together at first', () => {
  const steady = () => .5;
  const trainAgain = nextCrossing(TRAIN_CROSSING.first + TRAIN_CROSSING.seconds, TRAIN_CROSSING.every, steady);
  assert.ok(trainAgain - TRAIN_CROSSING.first > 240, 'the train waits a few minutes between crossings');
  assert.ok(PLANE_CROSSING.first > TRAIN_CROSSING.first + 60, 'the plane comes after the first train has gone');
  assert.ok(TRAIN_CROSSING.first < 120, 'the first train arrives within two minutes');
  const low = nextCrossing(0, [10, 20], () => 0), high = nextCrossing(0, [10, 20], () => 1);
  assert.equal(low, 10);assert.equal(high, 20);
});

test('the breeze is always a gentle onshore wind with gusts that stay bounded', () => {
  for (let t = 0; t < 600; t += .5) {
    const breeze = wind(t);
    assert.ok(breeze.x > 0 && breeze.x < 3, `wind x at ${t}`);
    assert.ok(breeze.gust >= 0 && breeze.gust <= 1.01, `gust at ${t}`);
  }
});

test('drifting things wrap around the viewer instead of being lost', () => {
  assert.equal(wrapAround(31, 0, 26), -21);
  assert.equal(wrapAround(-30, 0, 26), 22);
  assert.equal(wrapAround(5, 0, 26), 5);
  assert.equal(wrapAround(-96, -80, 26), -96);
  assert.equal(wrapAround(-40, -80, 26), -92);
});

test('the music box plays only notes of its scale, in order, stepwise', () => {
  let i = 0;const fixed = [.1, .6, .2, .7, .9, .3, .5, .8, .4, .6, .1, .2];
  const notes = composePhrase(() => fixed[i++ % fixed.length]);
  assert.ok(notes.length >= 5 && notes.length <= 8);
  let last = -1;
  for (const note of notes) {
    assert.ok(SCALE.includes(note.frequency));
    assert.ok(note.at > last);last = note.at;
  }
});
