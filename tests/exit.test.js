import test from 'node:test';
import assert from 'node:assert/strict';
import { createExitAction } from '../src/exit.js';
import { Soundscape } from '../src/audio.js';

function harness(session, overrides = {}) {
  const calls = [], timers = new Map();let id = 0, time = 0;
  const exit = createExitAction({
    getSession: () => session,
    stop: () => calls.push('stop'),
    dispose: () => calls.push('dispose'),
    closePage: () => calls.push('close'),
    leavePage: () => calls.push('blank'),
    schedule: (fn, delay) => { timers.set(++id, { fn, at: time + delay });return id; },
    cancel: key => timers.delete(key),
    ...overrides,
  });
  const advance = ms => {
    time += ms;
    for (const [key, timer] of [...timers]) if (timer.at <= time) { timers.delete(key);timer.fn(); }
  };
  return { exit, calls, timers, advance };
}

test('exit ends XR before disposal and closes, with a blank-page fallback', async () => {
  let resolveEnd;const end = new Promise(resolve => { resolveEnd = resolve; });
  const h = harness({ end: () => { h.calls.push('end');return end; } });
  h.exit();assert.deepEqual(h.calls, ['stop', 'end']);
  resolveEnd();await end;await Promise.resolve();
  assert.deepEqual(h.calls, ['stop', 'end', 'dispose', 'close']);
  h.advance(100);assert.equal(h.calls.at(-1), 'blank');assert.equal(h.timers.size, 0);
});

test('no headset still stops and unloads, and repeated exits are harmless', () => {
  const h = harness(null);h.exit();h.exit();h.advance(100);
  assert.deepEqual(h.calls, ['stop', 'dispose', 'close', 'blank']);
});

test('rejected XR shutdown cannot trap the user', async () => {
  const h = harness({ end: () => Promise.reject(new Error('Session already ended')) });
  h.exit();await Promise.resolve();h.advance(100);
  assert.deepEqual(h.calls, ['stop', 'dispose', 'close', 'blank']);
});

test('stalled XR shutdown times out and late resolution does not exit twice', async () => {
  let resolveEnd;const end = new Promise(resolve => { resolveEnd = resolve; });
  const h = harness({ end: () => end });h.exit();h.advance(1500);h.advance(100);
  assert.deepEqual(h.calls, ['stop', 'dispose', 'close', 'blank']);
  resolveEnd();await end;await Promise.resolve();assert.equal(h.calls.length, 4);
});

test('blank-page fallback survives tab-closing and renderer errors', () => {
  let left = false;
  const h = harness(null, {
    dispose: () => { throw new Error('Lost graphics context'); },
    closePage: () => { throw new Error('Closing blocked'); },
    leavePage: () => { left = true; },
  });
  h.exit();h.advance(100);assert.equal(left, true);
});

test('sound is muted immediately and cannot restart after disposal', async () => {
  const sound = new Soundscape();const calls = [];
  sound.context = { state: 'running', currentTime: 5, close: async () => calls.push('close') };
  sound.master = { gain: { cancelScheduledValues: () => calls.push('cancel'), setValueAtTime: value => calls.push(value) }, disconnect: () => calls.push('disconnect') };
  sound.running = true;
  await sound.dispose();await sound.start();await sound.dispose();
  assert.equal(sound.running, false);assert.equal(sound.closed, true);
  assert.deepEqual(calls, ['cancel', 0, 'disconnect', 'close']);
});
