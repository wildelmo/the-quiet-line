# Little painted companions

One plump mouse and nine charcoal fuzzballs share the carriage with the five
adult spirits. The mouse mostly watches the sea from a wooden perch above
the right bench back, occasionally turning to its window friend or the traveller;
two other fuzzballs play along separate empty left-bench cushions. A steady
look can invite one of those creatures' attention, with a quiet rest between
encounters. Six more fuzzballs independently scurry and investigate on the
floor. All ten creatures and the perch remain silent and opaque. The existing
adult spirits retain 70% opacity. The floor extension adds hip articulation to
the existing legs while preserving their rest geometry and painted materials.

## Files and rebuild

| File | Role |
| --- | --- |
| `companions.blend` | Editable source with named sculpted parts and packed atlas |
| `companions-metadata.json` | Exact bounds, node pivots, materials and export counts |
| `../../scripts/build-companions.py` | Rebuilds the source, GLB and metadata |
| `../../public/assets/spirits/companions.glb` | Runtime mouse, base fuzzball and perch |
| `../../src/train-companions.js` | Placement, cloning, material handling and code-driven poses |
| `../../src/companion-attention.js` | Camera/head-direction attention and bounded encounter poses |
| `../../src/floor-scurriers.js` | Six independent floor actors, movement and avoidance |
| `../../output/little-companions.png` | Historical actual-browser mouse and hopping-friend preview |
| `../../output/curious-companions.png` | Historical actual-browser window-friend shared gaze |
| `../../output/floor-scurriers.png` | Current actual-browser right-seat floor colony |

From the repository root in PowerShell, using the verified official portable
Blender 4.5.15 LTS installation:

```powershell
& '.tools/blender/blender-4.5.15-windows-x64/blender.exe' --background --python scripts/build-companions.py
```

Another checkout can substitute its Blender executable. The builder replaces
the `.blend`, `.glb` and metadata from its authored geometry descriptions;
make durable shape changes there. It packs the existing reader atlas unchanged
and exports no camera, light or baked animation. Inspect rebuilt exports in
the actual application.

## Geometry and placement

Authored dimensions are metres, Y up and +Z facing forward. Blender uses Z up
internally; the builder converts these coordinates and exports Y up. The
`Mouse`, `Fuzz` and `Perch` roots begin at the asset origin. Mesh transforms
are baked around their named pivots with identity node rotations.

| Exported root | Width × height × depth | Triangles | Primitives |
| --- | --- | --- | --- |
| Mouse | 0.22239 × 0.23128 × 0.17448m | 11,566 | 5 |
| Fuzz | 0.08956 × 0.09144 × 0.07483m | 5,024 | 4 |
| Perch | 1.24 × 0.07454 × 0.24m | 676 | 1 |

The mouse's cupped ears, cheek and brow tufts, pink paws and curling tail are
solid geometry. The fuzz has short bent tapered wisps, skinny legs, grounded
feet and white eyeballs with dark pupils. There are no alpha fur planes or
hair simulation. The perch top is local Y=0; its underside stays within 8cm.

| Runtime object | Carriage-local resting position | Scale | Base Y rotation |
| --- | --- | --- | --- |
| Mouse | (1.215, 1.985, 0.45) | 1 | 1.42 radians, toward the sea |
| Perch | (1.24, 1.985, 0.75) | 1 | -pi/2 |
| Window friend | (1.23, 1.985, 0.86) | 1 | -pi/2 |
| Forward hopper | (-0.94, 1.35, -4.12) | 0.94 | +pi/2 |
| Doorway hopper | (-0.94, 1.35, 3.32) | 1.06 | +pi/2 |

The perch's authored width becomes carriage-local depth after its rotation.
Its top supports the mouse and window friend at y=1.985. The other fuzzballs
rest on bench cushions at y=1.35. Both visitor seats remain at z=0. Floor
creatures use the aisle while avoiding passenger shoes and reserving space
around the traveller. All rendered companions inherit carriage travel.

Preserve `MouseBody`, `MouseHead`, `MouseEyes`, `MouseNose`, `MouseTail`,
`FuzzBody`, `FuzzEyes`, `FuzzLeftLeg` and `FuzzRightLeg`. The mouse head is a
body child; eyes and nose are head children. The tail is a mouse-root child.
Fuzz eyes and both hip nodes are body children. Hip pivots in exported Y-up
coordinates are (-0.016, 0.027, 0.001) and (0.016, 0.027, 0.001); local X
rotates the legs forward and back. Countertranslated mesh children preserve
every rest-pose triangle. The leg split adds two primitives, no triangles.
Runtime caches original transforms and reapplies bounded deltas without drift.
Exact pivots and per-root bounds are in the metadata.

## Hops and quiet habits

`fuzzPoseAt(index, time, reducedMotion)` follows each closed three-point route
in order, returning to point A on its third hop. Coordinates below are (x, z);
all points on a route share the resting y value above.

| Fuzzball | A → B → C → A | Cycle | Burst starts |
| --- | --- | --- | --- |
| Window friend | (1.23, 0.86) → (1.23, 1.16) → (1.21, 1.02) → A | 43s | 4s, 24s |
| Forward hopper | (-0.94, -4.12) → (-0.94, -3.72) → (-0.88, -3.94) → A | 47s | 14s, 34s |
| Doorway hopper | (-0.94, 3.32) → (-0.94, 3.68) → (-0.87, 3.49) → A | 53s | 8s, 28s |

Hops begin 1.36 seconds apart within a burst. Their flight durations are
0.78, 0.825 and 0.87 seconds, with a 0.18-second anticipatory crouch and
0.25-second landing settle. Peak root lift is respectively 2.25, 2.65 and 2.9
times the measured base fuzz height multiplied by that instance's scale.
This is lift above its resting support, not the apex height of its head.
Small stretch, squash, roll and yaw accompany the arc. More than 75% of each
cycle is resting; closed routes prevent a reset snap.

`mousePoseAt` mostly faces the sea at a base yaw of 1.42 radians. Small body
shifts, head scans, breathing, blinks, tail movement and a brief nose twitch
animate its resting pose. It turns toward its friend during scheduled parts
of the 43-second ambient cycle. Resting fuzzballs sometimes turn toward the
window. The visible-frame world clock drives their habits independently of
journey progress: pausing travel does not freeze them, while hidden flat pages
skip world updates. Reduced motion fixes every companion in its resting
arrangement. No behavior adds sound, dialogue, controls or camera movement.

## Floor lives

`src/floor-scurriers.js` owns six seeded, independent actors. Their initial
carriage-local positions are (x, 0.9, z):

| Actor | x, z | Scale |
| --- | --- | --- |
| Cinder | -0.27, -4.95 | 1.05 |
| Pip | 0.18, -2.75 | 0.9 |
| Bramble | -0.30, -0.95 | 1.15 |
| Mote | 0.25, 0.75 | 1 |
| Smudge | -0.18, 3.05 | 0.82 |
| Button | 0.31, 5.5 | 1.08 |

They choose between scurrying, slower poking around, investigating and
listening, with different tempos and uneven pauses. Movement integrates at
90 Hz, caps incoming deltas at 0.1s, speed at 1.35m/s and turning at 7rad/s;
acceleration is 3.2m/s² and braking 4.4m/s². Invalid or nonpositive deltas
do not advance them. Distance travelled advances the stride, so stopped
creatures do not run in place. Floor bounds are x=-0.63…0.63 and
z=-6.35…7.18, inset by each creature's collision radius.

Goals and paths avoid conservative circles containing the actual exported
reader, sleeper, gardener and keeper shoes. The moth's feet hang above this
space. Peer avoidance and clearance checks keep the colony separated. A
0.25m reserve protects the aboard traveller's foot space; a seat transition
that places it over a creature lets that creature leave continuously rather
than snapping it elsewhere. The floor colony adds no second gaze encounter.

`src/train-companions.js` poses six off-scene hierarchies, then writes their
four body/eye/leg transforms into shared instanced meshes. Alternating local-X
hip swings follow the stride. Each frame, the actual lowest posed foot vertex
sets the root height to the 0.9m boards with a 0.3mm clearance, including turns
and stops. Reduced motion holds all floor poses still.
`window.quietLine.diagnostics.atmosphere.companions.floor` reports each ID,
position, facing, speed, velocity, phase,
stride, eyes and opacity.

## Looking and quiet encounters

`src/main.js` passes the actual desktop camera or XR head position and forward
direction through `world.update` and `train.update` to the companions. The
runtime transforms both into carriage coordinates before passing them to
`createCompanionAttention`. This is head/camera-direction attention, not eye
tracking. It adds no gaze reticle or instruction overlay.

A visitor must be aboard, with attention enabled, and settled for over 2.2
seconds. Main disables new attention while a screen/VR menu is open or a seat
transition is underway. A resting creature must be at its home point and within
a forward-direction dot product greater than 0.975. The window and doorway
fuzzballs use a 4.5m range and 0.65-second dwell; the dreamy forward friend uses
5.5m and 1.2 seconds. The mouse uses 3m and 0.65 seconds. A passing glance,
station visit or reduced-motion session cannot start an encounter.

Only one actor, including the mouse, can be active. A fuzzball's 10.7-second
encounter contains 0.8 seconds of noticing, two approach hops over 2.4 seconds,
1.4 seconds of shared looking, two quicker retreat hops over 1.7 seconds,
a 2-second peek back and two return hops over 2.4 seconds. Encounter hop lift
is 2.3 times its scaled body height. Positions stay within the original perch
or cushion, clear of the mouse, window, aisle and visitor seats. The active
fuzzball's ambient clock freezes and resumes at the same grounded pose, avoiding
a reset snap. Other creatures continue their ambient habits.

The mouse offers a 5.4-second glance before returning to its usual view.
After either kind of encounter ends, a shared 24-second cooldown leaves a
quiet interval. An active encounter completes if gaze, menu availability or
aboard state is lost; only new starts are suppressed. The attention clock
uses rendered deltas clamped to 0–0.1 seconds; invalid time adds no progress,
and missing/invalid viewer data cannot invite a reaction.

`window.quietLine.diagnostics.atmosphere.companions` exposes the mouse phase,
facing and opacity, each fuzzball's ID, phase, position, facing, lift, scaled
body height and opacity, and the reduced-motion state. Its `attention` object
reports the engaged actor, phase and encounter age.

## Materials and cost

The GLB is 3,820,316 bytes: 17,266 triangles, ten primitives, two opaque
materials and one embedded copy of the unchanged 1254 × 1254 reader atlas.
Body pigment uses the atlas's ivory region and the perch uses its brown region.
The untextured matte `Chalk white fuzz eyes` material uses white eyeball and
dark pupil vertex colors, keeping the eyes free of the warm atlas pigment.

Runtime clones the reader's painted material, sets the clone fully opaque
with depth writing, shares the actual atlas map and disposes the redundant
embedded companion texture. It leaves the adult material unchanged. The
`keepPigmentInAmbientFill` shader hook multiplies ambient emissive fill by
vertex pigment on both companion materials, preserving charcoal and dark
pupils when the lanterns come on. It introduces no glow effect.

All nine fuzzballs share the base geometry and materials. Six floor instances
use four draw calls for body, eyes and the two legs. The whole addition—mouse,
nine fuzzballs and perch—has 57,458 triangles and 22 draw primitives before
culling: five mouse, one perch, twelve for three hoppers, four instanced floor
draws. Companions do not use the adult spirits' extra translucency pass.
The atlas still costs about 8 MiB decoded as RGBA8 with mipmaps, shared with
the adults. The companion GLB download nevertheless contains its own atlas
copy. Construction counts are not actual draw-call or headset-performance
measurements.

## Provenance and verification

The user-provided `C:/Users/joemc/Downloads/Untitled.png` informed mouse and
fuzz character form only. It is not shipped or mapped onto geometry. All
sculptures are original locally authored Blender geometry, with no downloaded
model, extracted parts, external rig or new image-generation call. Reader
atlas pixels, prompts and provenance remain unchanged; see [the spirit guide](README.md)
and [asset provenance](../../ASSETS.md).

All 94 tests and the production build pass in `floor-tests.log` and
`floor-build.log`; the existing 732.63 kB JavaScript chunk advisory remains.
`tests/floor-scurriers.test.js` covers three seeds over three minutes each,
bounded movement and turns, activity variation, shoe/peer/viewer clearance,
30/60/90 Hz consistency, invalid and skipped time, reduced motion, actual
instanced geometry, foot contact and carriage inheritance.

`floor-result.json` passed with no reported errors across eleven final
captures: boarding, left seat, right-seat floor, three scurry frames, right
rear, night, moving train, 390px mobile and reduced motion. Five replacements
corrected initially empty framing without changing production code. The fixed
desktop view follows Pip listening, scurrying, then listening; mobile identifies
Bramble. The final `floor-right-forward.png` is a right-seat rear-facing floor
view despite its retained filename, and supplies `output/floor-scurriers.png`.

The independent `floor-finish-review.md` returned **ship**, reviewing all eleven
final images, source and supplied validation evidence, with no material fixes.
The user separately accepted the live colony: “Yeah I'm looking at it. I think
it looks great.” That acceptance and the bounded review do not establish
physical Quest stereo, comfort, sustained performance or subjective continuous
video validation. `floor-detector.json` is empty; six shipping rasters retain
provenance with zero missing records. Work remains local, uncommitted and
unpublished on `codex/newspaper-spirit`.

### Earlier quiet-encounter milestone — historical evidence

At that stage, all 89 tests and the production build passed; the large-chunk warning
remains. `tests/companion-attention.test.js` adds encounter ordering, shared
attention, dwell/cooldown, numerical position/facing continuity, transformed
carriage coordinates, actual-geometry support clearance, mouse attention,
ambient viewing, disabled states and invalid/skipped-time checks. Those logs
are `curiosity-tests.log` and `curiosity-build.log` in `.impeccable/review/`.
Final browser QA in `curiosity-result.json` passed without reported errors.
Its 15 captures cover the mouse watching outside, a fuzzball watching the view,
every window-friend encounter stage, the mouse glance, both bench friends,
night, 390px mobile and reduced motion. `output/curious-companions.png` copies
the final shared-gaze capture. The fresh `curiosity-finish-review.md` returned
**ship**, opening all 15 captures and finding no material fixes. Its scope is
the captured states and supplied behavioral/geometry evidence.
Held poses and numerical continuity tests do not establish subjective
continuous-motion approval or physical Quest performance. That milestone's detector
records only two inherited `world.js` color advisories; six shipping rasters
had zero missing provenance records. No model or raster changed in that pass.

### Earlier companion milestone — historical evidence

At that stage, all 85 tests and the production build passed. Tests inspected
actual GLB geometry, opaque materials, untextured eyes,
identity node axes and support clearance through sampled poses. Runtime tests
check hop/body-height ratios, continuity, long rests, invalid clocks, reduced
motion, repeated-pose stability, shared materials/geometry, unchanged adult
opacity and carriage inheritance. Logs are in `.impeccable/review/` as
`companions-tests.log` and `companions-build.log`.

The original export had eight primitives and 3,818,956 bytes; mouse, three
fuzzballs and perch then totalled 27,314 triangles and twelve primitives.
The later hip split and floor colony supersede these historical counts.

The earlier actual-browser QA in `companions-result.json` passed without reported
errors and references 14 captures: boarding, both seats, mouse/blink and hop
poses, both bench friends, night, 390px mobile and reduced motion. Loading,
departure, pause and return passed. The capture harness held actual app frames
using a virtual clock, with normal boarding/seat anchors and look yaw/pitch;
it injected no model or camera. The independent `companions-finish-review.md`
returned **ship** for that extension, opening all 14 captures and finding
no material fixes. Held poses and numerical continuity tests do not establish subjective approval of
continuous motion. Physical Quest stereo, close-view scale, comfort and sustained
performance have not been measured. This work and the preceding five-spirit
stage remain local, uncommitted and unpublished on `codex/newspaper-spirit`.
