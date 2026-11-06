import test from 'node:test';
import assert from 'node:assert/strict';
import { TrainTrackCadence, TrainRollingSound, createTrainNoise } from '../src/train-audio.js';

function journey(speed, step, distance = 60) {
  const clock = new TrainTrackCadence();
  const contacts = [];
  clock.update(speed, 0, 0);
  const duration = distance / speed;
  for (let frame = 1; frame * step < duration; frame++) {
    const time = frame * step;
    contacts.push(...clock.update(speed, speed * time, time));
  }
  contacts.push(...clock.update(speed, distance, duration));
  return contacts;
}

test('track contacts follow distance independently of rendering frame rate', () => {
  const slowFrames = journey(3, 1 / 20), fastFrames = journey(3, 1 / 144);
  assert(slowFrames.length >= 19);
  assert.equal(slowFrames.length, fastFrames.length);
  slowFrames.forEach((contact, index) => {
    assert.equal(contact.distance, fastFrames[index].distance);
    assert(Math.abs(contact.time - fastFrames[index].time) < 1e-9);
  });
});

test('slower travel widens paired contacts and each six-meter group', () => {
  const full = journey(3, 1 / 60), slow = journey(.75, 1 / 60);
  assert.equal(full.length, slow.length);
  full.forEach((contact, index) => assert(Math.abs(slow[index].time - contact.time * 4) < 1e-8));
  const pair = full.filter(contact => contact.group === 1);
  assert.equal(pair.length, 2);
  assert(pair[1].distance - pair[0].distance >= .84);
  assert(pair[1].distance - pair[0].distance <= .88);
  assert(pair[1].time - pair[0].time > .27);
  assert(pair[1].time - pair[0].time < .3);
  const groups = full.filter(contact => contact.wheel === 0);
  assert(groups[1].time - groups[0].time > 1.96);
  assert(groups[1].time - groups[0].time < 2.04);
  assert.notEqual(pair[0].strength, pair[1].strength);
});

test('pause preserves contact phase and produces no stationary contacts', () => {
  const cadence = new TrainTrackCadence();
  cadence.update(3, 5.9, 0);
  for (let i = 1; i <= 100; i++) assert.deepEqual(cadence.update(0, 5.9, i / 10), []);
  const resumed = cadence.update(3, 6.2, 10.1);
  assert.equal(resumed.length, 1);
  assert.equal(resumed[0].group, 1);
  assert.equal(resumed[0].wheel, 0);
});

test('route return, jumps, long frames and invalid values never catch up', () => {
  const cadence = new TrainTrackCadence();
  cadence.update(3, 5.9, 1);
  assert.deepEqual(cadence.update(3, 9, 2), []);
  assert.deepEqual(cadence.update(3, 900, 2.1), []);
  assert.deepEqual(cadence.update(3, 0, 2.2), []);
  assert.deepEqual(cadence.update(3, 6, 2.2), []);
  assert.deepEqual(cadence.update(3, NaN, 2.3), []);
  assert.deepEqual(cadence.update(Infinity, 7, 2.4), []);
  assert.deepEqual(cadence.update(3, 7, NaN), []);
  assert.deepEqual(cadence.update(3, 7, 2.5), []);
  assert.deepEqual(cadence.update(3, 7.1, 2.55), []);
  cadence.reset();
  assert.deepEqual(cadence.update(3, 20, 3), []);
});

test('procedural noise is deterministic, finite, bounded and seam faded', () => {
  for (const sampleRate of [22050, 44100, 48000]) {
    const noise = createTrainNoise(sampleRate, .5);
    assert.deepEqual(noise, createTrainNoise(sampleRate, .5));
    assert.equal(Math.abs(noise[0]), 0);
    assert.equal(Math.abs(noise.at(-1)), 0);
    assert(noise.every(value => Number.isFinite(value) && Math.abs(value) <= .800001));
    const rms = Math.sqrt(noise.reduce((sum, value) => sum + value * value, 0) / noise.length);
    assert(rms > .05 && rms < .3);
  }
});

class FakeParameter {
  constructor(value = 0) { this.value = value; this.events = []; }
  record(kind, value, time, extra) {
    assert(Number.isFinite(value));
    assert(Number.isFinite(time));
    this.events.push({ kind, value, time, extra });
    this.value = value;
  }
  setValueAtTime(value, time) { this.record('set', value, time); }
  linearRampToValueAtTime(value, time) { this.record('linear', value, time); }
  exponentialRampToValueAtTime(value, time) { assert(value > 0); this.record('exponential', value, time); }
  setTargetAtTime(value, time, constant) { assert(constant > 0); this.record('target', value, time, constant); }
  cancelScheduledValues(time) { this.events = this.events.filter(event => event.time < time); }
  cancelAndHoldAtTime(time) { this.cancelScheduledValues(time); }
}

class FakeNode {
  constructor(type) {
    this.kind = type;
    this.gain = new FakeParameter(1);
    this.frequency = new FakeParameter(440);
    this.Q = new FakeParameter(1);
    this.playbackRate = new FakeParameter(1);
    this.connections = [];
    this.starts = [];
    this.stops = [];
    this.disconnected = false;
  }
  connect(destination) { this.connections.push(destination); return destination; }
  disconnect() { this.disconnected = true; this.connections = []; }
  start(time = 0) { this.starts.push(time); }
  stop(time = 0) { this.stops.push(time); }
}

class FakeContext {
  constructor() { this.currentTime = 0; this.sampleRate = 22050; this.nodes = []; this.destination = {}; }
  node(type) { const node = new FakeNode(type); this.nodes.push(node); return node; }
  createGain() { return this.node('gain'); }
  createBiquadFilter() { return this.node('filter'); }
  createBufferSource() { return this.node('buffer'); }
  createOscillator() { return this.node('oscillator'); }
  createBuffer(channels, length) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { getChannelData: channel => data[channel] };
  }
}

test('train remains silent at rest and fades/cancels contacts on pause', () => {
  const context = new FakeContext(), train = new TrainRollingSound(context, context.destination);
  assert.equal(train.output.gain.value, 0);
  train.update(0, 0);
  assert.equal(train.output.gain.value, 0);
  assert.equal(train.voices.size, 0);
  context.currentTime = 1;
  train.update(3, 5.9);
  context.currentTime = 1.1;
  train.update(3, 6.2);
  assert.equal(train.voices.size, 1);
  assert.equal(train.output.gain.value, 1);
  const [voice] = train.voices;
  assert(voice.sources.every(source => source.starts[0] >= context.currentTime));
  for (const gain of voice.gains) {
    const peak = gain.gain.events.find(event => event.kind === 'linear' && event.value > .001);
    const attack = peak.time - voice.sources[0].starts[0];
    assert(attack >= .01 && attack <= .025, 'Contacts need a rounded but distinct onset.');
    const end = gain.gain.events.find(event => event.kind === 'linear' && event.value === 0);
    assert(end.time - voice.sources[0].starts[0] < .2, 'Paired wheel contacts must not blur together.');
  }
  context.currentTime = 1.12;
  train.silence();
  assert.equal(train.output.gain.value, 0);
  assert(voice.sources.every(source => source.stops.at(-1) <= 1.2 + 1e-9));
  assert(voice.gains.every(node => node.gain.value === 0));
  voice.sources.forEach(source => source.onended());
  assert.equal(train.voices.size, 0);
  assert(voice.nodes.every(node => node.disconnected));
});

test('rolling and wheel contacts avoid pitched oscillators and resonant filter ringing', () => {
  const context = new FakeContext(), train = new TrainRollingSound(context, context.destination);
  train.update(3, 5.9);context.currentTime=.1;train.update(3,6.2);
  assert.equal(train.voices.size,1);
  assert.equal(context.nodes.filter(node=>node.kind==='oscillator').length,0,
    'The rejected low whine and falling pitch must not return to the train layer.');
  assert(context.nodes.filter(node=>node.kind==='filter').every(node=>node.Q.value<=.5));
  train.dispose();
});

test('invalid motion silences safely and disposal releases all owned nodes', () => {
  const context = new FakeContext(), train = new TrainRollingSound(context, context.destination);
  train.update(3, 5.9);
  context.currentTime = .1;
  train.update(3, 6.2);
  assert.equal(train.voices.size, 1);
  context.currentTime = .12;
  train.update(NaN, Infinity);
  assert.equal(train.output.gain.value, 0);
  train.dispose();
  assert.equal(train.voices.size, 0);
  assert(context.nodes.every(node => node.disconnected));
  assert(context.nodes.filter(node => ['buffer', 'oscillator'].includes(node.kind)).every(node => node.stops.length > 0));
  const count = context.nodes.length;
  train.update(3, 8);
  train.silence();
  train.dispose();
  assert.equal(context.nodes.length, count);
});
