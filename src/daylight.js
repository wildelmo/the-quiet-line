import { Color, Vector3 } from 'three';

// One slow day over the sea. Hours advance at a gentle pace through daylight and
// a little faster through the night, so a sunset arrives within a few minutes and
// a dawn follows soon after. Everything is derived from a single clock-hour.
export const DAWN_HOUR = 5.6, DUSK_HOUR = 18.6;
export const START_HOUR = 14.2;

// The world keeps the visitor's own clock: arrive in the evening and the
// lanterns are already lit. Hours in the dead of night are not pushed toward
// daylight; the day flows on from wherever it is.
export function startHourFromDate(date = new Date()) {
  const hour = date.getHours() + date.getMinutes() / 60;
  return Number.isFinite(hour) ? hour : START_HOUR;
}
export const DAY_SECONDS_PER_HOUR = 62, NIGHT_SECONDS_PER_HOUR = 28;
export const MOMENTS = [
  { name: 'flowing', label: 'Let the day pass' },
  { name: 'morning', label: 'Morning', hour: 8.4 },
  { name: 'noon', label: 'High summer noon', hour: 13 },
  { name: 'golden', label: 'Golden hour', hour: 18.2 },
  { name: 'dusk', label: 'Blue dusk', hour: 19.35 },
  { name: 'night', label: 'Starlight', hour: 23 },
];

export function advanceHour(hour, dt) {
  const daytime = hour > DAWN_HOUR - .4 && hour < DUSK_HOUR + .9;
  const next = hour + Math.min(dt, .1) / (daytime ? DAY_SECONDS_PER_HOUR : NIGHT_SECONDS_PER_HOUR);
  return next >= 24 ? next - 24 : next;
}

export function sunElevation(hour) {
  // Zero at dawn and dusk, one at a high summer noon.
  return Math.sin((hour - DAWN_HOUR) / (DUSK_HOUR - DAWN_HOUR) * Math.PI);
}

const palette = {
  dayFog: new Color('#a6d4dd'), goldenFog: new Color('#efc19c'), nightFog: new Color('#1a2340'),
  daySky: new Color('#e1f6ff'), goldenSky: new Color('#ffcda4'), nightSky: new Color('#4b5f9c'),
  dayGround: new Color('#7e8f70'), goldenGround: new Color('#9d7a62'), nightGround: new Color('#1c2438'),
  daySun: new Color('#fff0ca'), lowSun: new Color('#ffb46a'), moonSun: new Color('#7f93cf'),
  dayCloud: new Color('#ffffff'), goldenCloud: new Color('#ffdcc0'), nightCloud: new Color('#6c7698'), duskCloud: new Color('#9a8ca6'),
};
const scratch = new Color();
const smooth = (edge0, edge1, x) => { const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

export function describeHour(hour) {
  if (hour < DAWN_HOUR - .3) return 'before dawn';
  if (hour < 8) return 'at first light';
  if (hour < 11) return 'in the morning';
  if (hour < 15.5) return 'at high noon';
  if (hour < 17.8) return 'in the afternoon';
  if (hour < DUSK_HOUR + .3) return 'at golden hour';
  if (hour < 20.2) return 'in the blue dusk';
  return 'under the stars';
}

// Colour and light recipe for one moment of the day. Pure data; the world
// applies it to fog, lights, shaders and lanterns.
export function daylight(hour, out = {}) {
  const elevation = sunElevation(hour);
  const night = smooth(.06, -.34, elevation);
  const golden = smooth(.42, .1, elevation) * smooth(-.28, -.05, elevation);
  const lowSun = smooth(.5, 0, elevation);
  const azimuth = (hour - 12) / 12 * Math.PI;
  const sun = out.sunDirection || new Vector3();
  const lift = Math.max(-.32, elevation);
  sun.set(-Math.sin(azimuth) * .9, lift, -.45 - .25 * Math.cos(azimuth)).normalize();
  const moon = out.moonDirection || new Vector3();
  moon.set(.55, Math.max(.2, .35 - elevation * .8), -.7).normalize();
  const fog = (out.fog || new Color()).copy(palette.dayFog).lerp(palette.goldenFog, golden).lerp(palette.nightFog, night);
  const skyLight = (out.skyLight || new Color()).copy(palette.daySky).lerp(palette.goldenSky, golden).lerp(palette.nightSky, night);
  const groundLight = (out.groundLight || new Color()).copy(palette.dayGround).lerp(palette.goldenGround, golden).lerp(palette.nightGround, night);
  const sunLight = (out.sunLight || new Color()).copy(palette.daySun).lerp(palette.lowSun, lowSun).lerp(palette.moonSun, night);
  scratch.copy(palette.nightCloud).lerp(palette.duskCloud, golden);
  const cloudTint = (out.cloudTint || new Color()).copy(palette.dayCloud).lerp(palette.goldenCloud, golden).lerp(scratch, night);
  Object.assign(out, {
    hour, elevation, night, golden,
    sunDirection: sun, moonDirection: moon, fog, skyLight, groundLight, sunLight, cloudTint,
    hemisphereIntensity: lerp(2.5, .55, night),
    sunIntensity: lerp(lerp(2.4, 1.7, lowSun), .5, night),
    lantern: smooth(.18, -.12, elevation),
    stars: smooth(-.02, -.3, elevation),
    fireflies: smooth(.1, -.2, elevation),
    description: describeHour(hour),
  });
  return out;
}
