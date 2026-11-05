import test from 'node:test';
import assert from 'node:assert/strict';
import { daylight, advanceHour, sunElevation, describeHour, START_HOUR, DAWN_HOUR, DUSK_HOUR, MOMENTS, DAY_SECONDS_PER_HOUR, NIGHT_SECONDS_PER_HOUR } from '../src/daylight.js';

test('the sun stands high at noon and sits on the horizon at dawn and dusk', () => {
  assert.ok(sunElevation(12) > .95);
  assert.ok(Math.abs(sunElevation(DAWN_HOUR)) < 1e-9);
  assert.ok(Math.abs(sunElevation(DUSK_HOUR)) < 1e-9);
  assert.ok(sunElevation(23) < -.8);
});

test('noon keeps the painted sky untouched; golden hour and night grade it', () => {
  const noon = daylight(13), golden = daylight(18.2), night = daylight(23);
  assert.equal(noon.night, 0);assert.equal(noon.golden, 0);assert.equal(noon.lantern, 0);assert.equal(noon.stars, 0);
  assert.ok(golden.golden > .95 && golden.night < .05);
  assert.equal(night.night, 1);assert.equal(night.stars, 1);assert.equal(night.lantern, 1);assert.equal(night.golden, 0);
});

test('lanterns and fireflies wake before the stars and sleep after them', () => {
  let lanternOn = null, starsOn = null;
  for (let hour = 17; hour < 21; hour += .05) {
    const light = daylight(hour);
    if (lanternOn === null && light.lantern > .5) lanternOn = hour;
    if (starsOn === null && light.stars > .5) starsOn = hour;
  }
  assert.ok(lanternOn < starsOn, `lanterns at ${lanternOn}, stars at ${starsOn}`);
});

test('the sun direction is a unit vector that travels from east to west and dips below the horizon', () => {
  const morning = daylight(8), evening = daylight(18), night = daylight(23);
  for (const light of [morning, evening, night]) assert.ok(Math.abs(light.sunDirection.length() - 1) < 1e-6);
  assert.ok(morning.sunDirection.x > 0 && evening.sunDirection.x < 0);
  assert.ok(night.sunDirection.y < 0 && night.moonDirection.y > 0);
});

test('colours stay within range at every hour', () => {
  for (let hour = 0; hour < 24; hour += .25) {
    const light = daylight(hour);
    for (const colour of [light.fog, light.skyLight, light.groundLight, light.sunLight, light.cloudTint]) {
      for (const channel of [colour.r, colour.g, colour.b]) assert.ok(channel >= 0 && channel <= 1, `hour ${hour}`);
    }
    assert.ok(light.hemisphereIntensity > 0 && light.sunIntensity > 0);
  }
});

test('an afternoon start reaches sunset within a few minutes and the night passes faster than the day', () => {
  let hour = START_HOUR, seconds = 0;
  while (daylight(hour).golden < .9) { hour = advanceHour(hour, 1 / 60); seconds += 1 / 60; if (seconds > 1200) break; }
  assert.ok(seconds > 120 && seconds < 420, `sunset after ${seconds.toFixed(0)} s`);
  assert.ok(Math.abs(advanceHour(13, .05) - 13 - .05 / DAY_SECONDS_PER_HOUR) < 1e-9);
  assert.ok(Math.abs(advanceHour(23, .05) - 23 - .05 / NIGHT_SECONDS_PER_HOUR) < 1e-9);
  assert.ok(advanceHour(13, 5) - 13 < .002, 'a long stalled frame never jumps the clock');
  assert.ok(advanceHour(23.999, 1) < 1, 'the clock wraps past midnight');
});

test('a full cycle of the day stays under twenty minutes of real time', () => {
  let hour = START_HOUR, seconds = 0;
  do { hour = advanceHour(hour, .1); seconds += .1; } while (!(hour >= START_HOUR && hour < START_HOUR + .2 && seconds > 60));
  assert.ok(seconds < 20 * 60, `cycle took ${seconds.toFixed(0)} s`);
});

test('hours are described in words and the chosen moments cover the day', () => {
  assert.equal(describeHour(13), 'at high noon');
  assert.equal(describeHour(18.2), 'at golden hour');
  assert.equal(describeHour(23), 'under the stars');
  assert.equal(MOMENTS[0].hour, undefined);
  for (const moment of MOMENTS.slice(1)) assert.ok(moment.hour >= 0 && moment.hour < 24);
  assert.ok(daylight(MOMENTS.find(m => m.name === 'night').hour).stars > .99);
  assert.ok(daylight(MOMENTS.find(m => m.name === 'golden').hour).golden > .9);
});
