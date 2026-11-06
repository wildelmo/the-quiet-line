// A quiet, dry train layer. Distinct, rounded wheel contacts follow distance;
// the much softer rolling bed stays underneath their paired rhythm.
const MAX_SPEED = 3;
const TRACK_LENGTH = 6;
const MAX_FRAME = .25;
const CONTACT_LATENCY = .06;

function variation(index, salt = 0) {
  let value = Math.imul((index | 0) ^ salt, 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function contactsForGroup(group) {
  const first = group * TRACK_LENGTH + .12 * (variation(group, 71) - .5);
  return [first, first + .84 + .04 * variation(group, 193)];
}

// Pure distance clock, exported so travel and discontinuities can be checked
// without an AudioContext. Returned times describe the actual track crossings.
export class TrainTrackCadence {
  constructor() {
    this.previous = null;
  }

  reset() {
    this.previous = null;
  }

  update(speed, distance, time) {
    if (!Number.isFinite(speed) || !Number.isFinite(distance) || distance < 0 ||
        distance > 1e7 || !Number.isFinite(time) || time < 0) {
      this.reset();
      return [];
    }
    const previous = this.previous;
    this.previous = { distance, time };
    if (!previous || speed <= 0) return [];
    const elapsed = time - previous.time;
    const traveled = distance - previous.distance;
    // A paused tab, teleport, route return, or invalid clock must never produce
    // a pile of overdue wheel contacts. Absolute distance retains the phase.
    if (elapsed <= 0 || elapsed > MAX_FRAME || traveled <= 0 ||
        traveled > MAX_SPEED * elapsed * 1.5 + .03) return [];

    const contacts = [];
    const start = Math.max(0, Math.floor(previous.distance / TRACK_LENGTH) - 1);
    const end = Math.floor(distance / TRACK_LENGTH) + 1;
    for (let group = start; group <= end; group++) {
      for (const [wheel, atDistance] of contactsForGroup(group).entries()) {
        if (atDistance <= previous.distance || atDistance > distance) continue;
        contacts.push({
          group, wheel, distance: atDistance,
          time: previous.time + elapsed * (atDistance - previous.distance) / traveled,
          strength: (.88 + .14 * variation(group, 491)) * (wheel ? .79 : 1),
          color: variation(group, 809),
        });
      }
    }
    return contacts;
  }
}

// The seed and sample-rate-aware pole keep offline renders reproducible. A
// bounded low-frequency noise buffer gives texture without a hiss component.
export function createTrainNoise(sampleRate, seconds, seed = 0x71a1cafe, bandwidth = 105, seamSeconds = .04) {
  const rate = Number.isFinite(sampleRate) && sampleRate > 0 ? sampleRate : 44100;
  const duration = Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 12) : 1;
  const data = new Float32Array(Math.ceil(rate * duration));
  const cutoff = Number.isFinite(bandwidth) ? Math.max(20, Math.min(rate / 4, bandwidth)) : 105;
  const pole = Math.exp(-2 * Math.PI * cutoff / rate);
  let state = seed >>> 0, last = 0, peak = 0;
  for (let index = 0; index < data.length; index++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    last = pole * last + (1 - pole) * (state / 2147483648 - 1);
    data[index] = last;
    peak = Math.max(peak, Math.abs(last));
  }
  // A short seam fade avoids a transient when the bed repeats.
  const fade = Math.min(Math.round(rate * Math.max(0, seamSeconds)), Math.floor(data.length / 2));
  for (let index = 0; index < data.length; index++) {
    const edge = fade ? Math.min(1, index / fade, (data.length - 1 - index) / fade) : 1;
    data[index] *= (peak ? .8 / peak : 0) * edge;
  }
  return data;
}

function settle(parameter, value, now, seconds) {
  if (parameter.cancelAndHoldAtTime) parameter.cancelAndHoldAtTime(now);
  else {
    const held = parameter.value;
    parameter.cancelScheduledValues(now);
    parameter.setValueAtTime(held, now);
  }
  parameter.setTargetAtTime(value, now, seconds);
}

function envelope(parameter, level, now, attack, duration) {
  parameter.setValueAtTime(0, now);
  parameter.linearRampToValueAtTime(level, now + attack);
  parameter.exponentialRampToValueAtTime(.00001, now + duration - .035);
  parameter.linearRampToValueAtTime(0, now + duration);
}

export class TrainRollingSound {
  constructor(context, destination) {
    this.context = context;
    this.cadence = new TrainTrackCadence();
    this.closed = false;
    this.moving = false;
    this.voices = new Set();
    const c = context;
    this.output = c.createGain();
    this.output.gain.value = 0;
    this.output.connect(destination);
    this.low = c.createBiquadFilter();
    this.low.type = 'lowpass';
    this.low.frequency.value = 380;
    this.low.Q.value = .45;
    this.low.connect(this.output);
    this.high = c.createBiquadFilter();
    this.high.type = 'highpass';
    this.high.frequency.value = 24;
    this.high.Q.value = .5;
    this.high.connect(this.low);

    // Contacts need a little low-mid articulation to read on normal speakers.
    // They bypass the bass-only rolling filter, but have no metallic ringing.
    this.contactLow = c.createBiquadFilter();
    this.contactLow.type = 'lowpass';
    this.contactLow.frequency.value = 750;
    this.contactLow.Q.value = .5;
    this.contactLow.connect(this.output);
    this.contactHigh = c.createBiquadFilter();
    this.contactHigh.type = 'highpass';
    this.contactHigh.frequency.value = 75;
    this.contactHigh.Q.value = .5;
    this.contactHigh.connect(this.contactLow);

    this.bedBuffer = c.createBuffer(1, Math.ceil(c.sampleRate * 8), c.sampleRate);
    this.bedBuffer.getChannelData(0).set(createTrainNoise(c.sampleRate, 8));
    this.contactBuffer = c.createBuffer(1, Math.ceil(c.sampleRate * .5), c.sampleRate);
    this.contactBuffer.getChannelData(0).set(createTrainNoise(c.sampleRate, .5, 0x74ac123, 850, .002));

    this.bed = c.createBufferSource();
    this.bed.buffer = this.bedBuffer;
    this.bed.loop = true;
    this.bed.playbackRate.value = .8;
    this.bedGain = c.createGain();
    this.bedGain.gain.value = .005;
    this.bed.connect(this.bedGain).connect(this.high);

    // No pitched oscillator or pitch glide: these read as a low whine to the
    // listener. Broad, damped noise supplies both the roll and the wheel knocks.
    this.nodes = [this.bed, this.bedGain, this.high, this.low, this.contactHigh, this.contactLow, this.output];
    this.bed.start();
  }

  update(speed, distance) {
    if (this.closed) return;
    const now = this.context.currentTime;
    const valid = Number.isFinite(speed) && Number.isFinite(distance) && distance >= 0 && distance <= 1e7;
    const velocity = valid ? Math.max(0, Math.min(MAX_SPEED, speed)) : 0;
    const contacts = this.cadence.update(velocity, distance, now);
    if (!Number.isFinite(now) || now < 0) return;
    if (velocity <= 0) {
      if (this.moving) this.fadeOut(now);
      this.moving = false;
      return;
    }
    this.moving = true;
    const amount = Math.pow(velocity / MAX_SPEED, .65);
    settle(this.output.gain, amount, now, .28);
    settle(this.bed.playbackRate, .72 + velocity * .09, now, .5);
    for (const contact of contacts) {
      this.contact(contact, Math.max(now + .003, contact.time + CONTACT_LATENCY));
    }
  }

  contact(contact, at) {
    const c = this.context;
    const noise = c.createBufferSource();
    const noiseGain = c.createGain();
    const filter = c.createBiquadFilter();
    noise.buffer = this.contactBuffer;
    noise.playbackRate.value = .9 + contact.color * .12;
    filter.type = 'lowpass';
    filter.frequency.value = 420 + contact.color * 60;
    filter.Q.value = .5;
    const duration = .16 + contact.color * .025;
    envelope(noiseGain.gain, .62 * contact.strength, at, .012, duration);
    noise.connect(filter).connect(noiseGain).connect(this.contactHigh);
    const voice = { sources: [noise], gains: [noiseGain], nodes: [noise, filter, noiseGain] };
    this.voices.add(voice);
    let ended = 0;
    const cleanup = () => {
      if (++ended < voice.sources.length || !this.voices.delete(voice)) return;
      for (const node of voice.nodes) node.disconnect();
    };
    for (const source of voice.sources) {
      source.onended = cleanup;
      source.start(at);
      source.stop(at + duration + .02);
    }
  }

  fadeOut(now) {
    settle(this.output.gain, 0, now, .09);
    for (const voice of this.voices) {
      for (const gain of voice.gains) settle(gain.gain, 0, now, .015);
      for (const source of voice.sources) source.stop(now + .08);
    }
  }

  silence() {
    if (this.closed) return;
    this.fadeOut(this.context.currentTime);
    this.moving = false;
    this.cadence.reset();
  }

  dispose() {
    if (this.closed) return;
    this.closed = true;
    this.moving = false;
    this.cadence.reset();
    const now = this.context.currentTime;
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(0, now);
    this.bed.stop(now);
    for (const voice of this.voices) {
      for (const source of voice.sources) source.stop(now);
      for (const node of voice.nodes) node.disconnect();
    }
    this.voices.clear();
    for (const node of this.nodes) node.disconnect();
  }
}
