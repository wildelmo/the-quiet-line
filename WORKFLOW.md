# A little more wonder

## Current extension: a carriage with a history — locally reviewed

The user approved the worn, cared-for direction with “I love it... do it,”
preferring upfront asset work to expensive runtime effects on Quest 3/3S.
`.impeccable/carriage-character-brief.md` records the contract. The local result
adds faded red cloth with two upward-facing stitched repairs, rubbed walnut
and cream enamel, an illustrated route and Lantern Pier notice, carriage 03,
a folded scarf and tied cloth parcel. Existing passengers, creatures, rear-wall
repair, controls and independent gaze remain. The user accepted the resulting
view: “I think we nailed it,” and requested adding, committing and pushing it.

`scripts/build-train.py` rebuilds the editable `assets/train/carriage.blend`,
`carriage-metadata.json` and runtime `public/assets/train/carriage.glb`. Painted
wear and static vertex colors supply permanent shading; changing daylight
remains active. Signs and belongings join the existing opaque batch. This adds
no runtime JavaScript, lights, shadow passes or animation. The floor UVs and
tint were refined in one batch before all final captures were inspected.

One built-in image-generation call produced the opaque 1536 × 1024
`carriage-lived-in-atlas.png`, with no revisions or pixel edits. Its exact prompt
is adjacent and embedded; `assets/train/lived-in-materials.json` records safe
UVs, native provenance and memory arithmetic. The original atlas and
`materials.json` remain historical source, no longer embedded in the current GLB.

| Carriage asset | Rear-wall baseline | Current |
| --- | ---: | ---: |
| Triangles | 42,812 | 45,097 |
| Primitives / materials / embedded images | 7 / 5 / 1 | 7 / 5 / 1 |
| Estimated RGBA8 with mipmaps | 7.99823 MiB | 8.00 MiB |
| GLB bytes | 3,951,092 | 5,406,204 |

The 2,285 added triangles comprise 1,936 for floor vertex shading, 177 for
notices/numbering and 172 for belongings. Texture memory rises by an estimated
1,856 bytes; download size grows by 1,455,112 bytes. All 13 matched browser views
retain their draw-call counts and add exactly 2,285 triangles. The night texture
counter is affected by preceding views uploading existing scene textures; it
is not a clean memory comparison. The export still contains one image.

`character-tests.log` records 95 passing tests; `character-build.log` passes
with the existing 732.63 kB JavaScript chunk warning. `character-after-result.json`
reports no browser errors across 19 final captures, including desktop 1440px,
mobile 390px and the user's 1354 × 849 viewport. Boarding, both seats, day/night,
departure, pause and return passed. The independent `character-finish-review.md`
returns **ship**, with all 19 captures valid and no material fixes. The feature
detector is empty; `character-provenance.log` records seven rasters and zero
missing records. `character-verification.md` consolidates evidence and limits.

`output/carriage-character.png` is the final left-rear browser view. Physical
Quest frame times, stereo quality and comfort remain unmeasured; still captures
do not certify continuous motion. The work is maintained on
`codex/newspaper-spirit`. The local preview server was stopped at the user's
request after acceptance. Earlier uncommitted-status notes below describe
their respective milestones before this acceptance and commit request.
Deployed main remains `07d5af8`. `DESIGN.md` and `.impeccable/design.json` are
preserved byte-for-byte. Documentation evidence is `character-documentation.md`.

## Earlier extension: floor scurriers — locally reviewed, historical evidence

Six additional charcoal fuzzballs bring the carriage to nine fuzzballs and one
mouse. The user accepted the live colony: “Yeah I'm looking at it. I think it
looks great.” Independent seeded decisions produce quick scurries, slower
investigations, listening and uneven pauses. `src/floor-scurriers.js` integrates
movement at 90 Hz with a 0.1s delta cap, 1.35m/s speed cap, 3.2m/s² acceleration,
4.4m/s² braking and 7rad/s turns. Actual exported shoe footprints, peer clearance
and a traveller foot-space reserve constrain movement without snapping on
seat changes. `src/train-companions.js` ties hip strides to distance and uses
the actual lowest posed foot vertex to stay on the boards. Reduced motion
holds the colony still; the existing mouse/hopper encounters, silence, opacity,
controls, camera and rear-wall repair remain intact.

The builder separates the existing legs into two hip nodes under `FuzzBody`,
preserving rest geometry and the atlas. The companion export is 3,820,316 bytes,
17,266 triangles, ten primitives, two opaque materials and one unchanged
1254 × 1254 atlas. Six floor creatures share four instanced draws; all companions
and the perch total 57,458 triangles and 22 draw primitives before culling.
These construction counts do not establish headset performance.

At that milestone, all 94 tests and the production build passed in `floor-tests.log` and
`floor-build.log`, with the existing 732.63 kB JavaScript chunk advisory.
Tests cover three seeded three-minute simulations, frame-rate consistency,
bounded time and turns, actual shoe clearance, foot contact, instancing and
carriage inheritance. `floor-detector.json` is empty; six shipping rasters have
zero missing provenance records. No raster or atlas was added or repainted.

`floor-result.json` passed without errors across eleven final captures of
boarding, both seats, scurrying, night, travel, mobile and reduced motion.
Five replacements corrected empty initial framing without production changes.
The fixed desktop sequence follows Pip listening → scurrying → listening;
mobile identifies Bramble. The retained `floor-right-forward.png` filename now
holds a right-seat rear-facing floor view and supplies `output/floor-scurriers.png`.
The independent `floor-finish-review.md` returned **ship**, reviewing all eleven
final captures, source and supplied evidence with no material fixes. User live
acceptance is separate from subjective continuous-video validation and physical
Quest stereo, comfort or sustained performance, which remain unverified.

Work is local, uncommitted and unpublished on `codex/newspaper-spirit`; deployed
main/origin remains `07d5af8`. `DESIGN.md` and `.impeccable/design.json` remain
byte-for-byte unchanged. Documentation evidence is `floor-documentation.md`.
Worn carriage detail was still a future discussion at that milestone; the
subsequent approval and implementation are recorded above.

## Earlier repair: stable rear wall — locally reviewed, historical evidence

The user's `Visual.aberration.png` shows maroon tearing across the cream lower
rear door, worse as the viewpoint changes. The fresh `rear-wall-finish-review.md`
returned **fix**, overriding earlier ship verdicts for this defect. Source
coordinates and actual GLB ray intersections confirm two interior faces at
z=7.49. `scripts/build-train.py` now replaces the full-width maroon rear body
with two side panels and a sill below the cream door. The rebuilt Blender source,
metadata and runtime GLB preserve the painted atlas, five materials, enclosure
and silhouette. No runtime rendering, character, opacity, control or camera
changes belong to this repair.

The repair's export had 42,812 triangles, seven primitives, five materials, one unchanged
1254 × 1254 atlas and 3,951,092 bytes. The historical carriage export had 42,580
triangles and 3,941,940 bytes: this repair adds 232 triangles and 9,152 bytes.
Unchanged primitive count is not a measurement of actual draw calls.

At that repair milestone, all 90 tests and the production build passed in `rear-wall-tests.log` and
`rear-wall-build.log`, retaining the existing large-chunk advisory. The new
regression checks 28 opaque ray probes on the actual GLB for a closed lower wall
with one front surface. `rear-wall-regression-before.log` fails on the original
GLB with duplicate nearest depths; the rebuilt asset passes. Generation evidence
is in `rear-wall-blender.log`. `rear-wall-detector.json` is empty for the Python
builder scan only; it is not a geometry or whole-project certification. Six
shipping rasters have zero missing provenance records, with no new image.

`rear-wall-after-result.json` passed without reported errors across 19 captures:
the user's 1354 × 849 left-seat angles, 1440px right-seat and near-rear boarding
views, eye-contact/rest framing, night, 390px mobile and travel; two exterior
asset inspection cameras using the production world and GLB; and five frames
from a slow actual-time yaw/pitch sweep. The exterior cameras are not user
viewpoints. The parent inspected all 19 frames and found the wall clean. The
WebM under `rear-wall-after-video/` has not been played through by an observer,
so this evidence does not certify subjective continuous-motion quality or
physical Quest stereo, comfort or sustained performance. The original reviewer
returned **ship** in `rear-wall-verdict.md`, independently opening all 19 valid
captures and resolving both findings. No maroon breakup or repair-induced
material regression was visible. The verdict covers these two fixes only;
it does not renew approval of the whole world.

`output/rear-wall-fixed.png` is the new left-seat preview; earlier previews and
milestone counts remain historical. This repair and all preceding reader, cast,
companion and curiosity work remain local, uncommitted and unpublished on
`codex/newspaper-spirit`. Deployed main/origin remains `07d5af8`. `DESIGN.md` and
`.impeccable/design.json` remain byte-for-byte unchanged. Documentation evidence
is `.impeccable/review/rear-wall-documentation.md`.

## Earlier milestone: quiet encounters — locally reviewed, historical

The following records that extension's behavior and evidence. Its ship verdict
does not certify the rear-wall defect subsequently reported by the user.

The user approved interaction through looking: one fuzzball approaches,
shares a short gaze, retreats shyly, peeks back and returns to its own game.
The mouse mostly watches the sea, with occasional turns to its friend or the
traveller; resting fuzzballs also look outside. The original models, painted
materials, opaque companions, 70%-opaque adults, silence and controls remain.
No asset generation or remodel was needed.

`src/companion-attention.js` receives camera/head position and forward direction
through `main.js` → `world.update` → `train.update` → companions, transformed
into carriage coordinates. This is not eye tracking. Settling, dwell and range
checks permit only one active actor, including the mouse. Each 10.7-second
fuzzball encounter ends at its original support point and resumes its held
ambient clock; the mouse offers a 5.4-second glance. A shared 24-second cooldown
separates encounters. New starts are disabled at the station, during menus or
transitions, and under reduced motion. Active encounters finish safely after
attention is lost, and bounded rendered time avoids queued reactions after gaps.

The mouse now rests at (1.215, 1.985, 0.45), mostly facing the sea at yaw 1.42.
Its body shifts and head scans complement the existing breathing, blink, nose
and tail habits. Other placements, assets and exact metadata are unchanged.
The existing diagnostics expose `atmosphere.companions.attention` with the
engaged actor, phase and age. See `assets/spirits/COMPANIONS.md` for the contract.

At that milestone, all 89 tests and the production build passed in `curiosity-tests.log` and
`curiosity-build.log`; the existing large-chunk advisory remains. The new tests
cover encounter phases and continuity, single attention, rests and disabled
states, invalid/skipped time, actual-geometry clearances and carriage transforms.
Final browser QA passed without reported errors in `curiosity-result.json`,
with 15 captures covering ambient viewing, every window-friend encounter stage,
the mouse glance, both bench creatures, night, 390px mobile and reduced motion.
The final confirmation corrected capture timing for the initial notice and an
airborne return hop; no production change was needed. The new preview is
`output/curious-companions.png`, copied from the final shared-gaze frame.
The fresh `curiosity-finish-review.md` returned **ship**, with all five review
sections, all 15 captures inspected and no material fixes. Its scope is the
captured states and supplied behavioral/geometry evidence. `curiosity-detector.json` contains
only two inherited `world.js` color advisories; six shipping rasters have zero
missing provenance records. No raster or model changed in this pass.
Held poses and numerical continuity tests do not establish subjective continuous
motion approval or the user's judgment of the mouse's liveliness; physical Quest
stereo, comfort and sustained performance remain unmeasured.

This and the preceding reader, passenger and companion work remain local,
uncommitted and unpublished on `codex/newspaper-spirit`. Main/origin `07d5af8`
remains the deployed controls/audio release. `DESIGN.md` and its sidecar stay
byte-for-byte unchanged. Earlier milestone evidence and previews are historical.
Documentation evidence is `.impeccable/review/curiosity-documentation.md`.

## Earlier milestone: little window companions — locally reviewed, historical

The positions and mouse behavior in this section describe that earlier stage;
the current runtime contract is recorded above and in the companion guide.

The user approved a solid painted mouse and charcoal fuzzballs with white
eyeballs: silent, mostly entertaining each other, with a couple scattered
through the carriage and hops two to three times their own body height. One
mouse and its friend now share a shallow wooden perch above the right bench
back. Two more fuzzballs occupy separated empty left-bench cushions. The mouse
watches its friend, with small breathing, blink, nose and tail gestures.
The four creatures and perch are opaque; the five existing adult spirits
retain 70% opacity. No sound, controls or forced camera movement was added.

`scripts/build-companions.py` creates original editable Blender 4.5.15 LTS
sculptures in `assets/spirits/companions.blend`, exact metadata and the runtime
`public/assets/spirits/companions.glb`. The export has 17,266 triangles, eight
primitives, two opaque materials and one unchanged embedded reader atlas in
3,818,956 bytes. The mouse is 23.13cm tall and the base fuzzball 9.144cm tall.
Runtime fuzz scales are 1, 0.94 and 1.06; the three instances share geometry.
The full addition totals 27,314 triangles and 12 primitives before culling.
The companion material is an opaque clone sharing the reader's actual texture,
with the adult material unchanged. White eyes and dark pupils use a separate
untextured matte material. No new raster or image generation was used.

`src/train-companions.js` places the mouse at (1.24, 1.985, 0.45) and the
perch at (1.24, 1.985, 0.75). Its 1.24m width runs along the right window after
rotation. The window friend rests at (1.23, 1.985, 0.86); the two bench fuzzballs
rest at left z=-4.12 and z=3.32. Closed three-hop routes run in two brief bursts
per 43-, 47- and 53-second cycle, with peak lift ratios of 2.25, 2.65 and 2.9
times each scaled body height. More than 75% of every cycle is resting.
All companions inherit carriage travel, leave seats/aisle/doorway clear and
hold still under reduced motion. `atmosphere.companions` exposes their states.

The first visual round found night fill washing charcoal pale. The final
`keepPigmentInAmbientFill` hook multiplies ambient emissive fill by vertex
pigment on body and eye materials, retaining charcoal bodies and dark pupils.
The first capture attempt also missed a short hop apex while the screenshot
elapsed. The revised harness uses Playwright virtual-clock `pauseAt`/`runFor`
to hold actual application frames at the required poses. It injects no model
or camera; views use normal boarding/seat anchors and look yaw/pitch.

At that milestone, all 85 automated tests and the production build passed in
`.impeccable/review/companions-tests.log` and `companions-build.log`; the
existing large-chunk warning remains. New tests inspect actual GLB geometry,
opaque eyes/materials, node axes and support clearance, plus hop ratios,
continuity, long rests, invalid clocks, stable poses, reduced motion,
geometry/material sharing, unchanged adult opacity and inherited travel.
Final actual-browser QA passed in `companions-result.json` with no reported
errors and 14 final captures after the pigment fix. They cover boarding,
both seats, mouse/blink and crouch/hop/landing poses, both bench friends, night,
390px mobile and reduced motion. Loading, departure, pause and return also
passed; diagnostics retain companion opacity 1 and adult opacity 0.7.
The fresh independent finish review in `companions-finish-review.md` returned
**ship** for this local extension. It opened all 14 captures, reviewed the
implementation/evidence and found no material fixes. All five review sections
are present. Held frames and numerical continuity tests do not establish
subjective continuous-motion approval.

The new preview is `output/little-companions.png`; earlier reader and
five-spirit previews retain their paths. `companions-detector.json` records
only two inherited `world.js` color advisories. Six shipping rasters have zero
missing provenance records; atlas pixels and provenance are unchanged.
`DESIGN.md` and `.impeccable/design.json` are preserved byte-for-byte.
Detailed build/runtime notes are in `assets/spirits/COMPANIONS.md`; this pass's
documentation evidence is in `.impeccable/review/companions-documentation.md`.

No physical Quest stereo, comfort or sustained performance was measured.
The little-companion and preceding five-spirit work remain local, uncommitted
and unpublished on `codex/newspaper-spirit`. Main/origin `07d5af8` remains the
controls/audio release deployed by Actions run `42170566231`.

## Earlier milestone: five quiet fellow travellers — locally reviewed

The user approved the original reader’s appearance, reported that its page
turned away from its body, and requested three or four distinct additional
spirits. Four were built: an ochre-coated sleeper with a hat and satchel, an
ivory moth with antennae, a long-eared sage-smocked gardener with a seedling,
and a rust-robed keeper with a sea shell. During implementation the user asked
for 30% translucency. All five figures and their belongings now use 70% opacity.
This is an ordinary extension of the existing painted carriage, with no new
controls, dialogue, sounds, camera path or visual-world round.

`scripts/build-passengers.py` builds original editable Blender 4.5.15 LTS
geometry into `assets/spirits/passengers.blend`, `passengers-metadata.json` and
`public/assets/spirits/passengers.glb`. The four figures use the unchanged
1254 × 1254 reader atlas plus vertex pigment washes, with no new raster or
image-generation call. The export has 51,996 triangles, 16 primitives, one
material and 4,746,744 bytes. `src/train-passengers.js` places its roots at
right z=2.4 (sleeper), left z=-2.8 (moth), left z=2.1 (gardener) and right
z=-4.5 (keeper), preserving the reader at right z=-1.9. The aisle, doorway and
both visitor seats stay clear. Independent 137-, 131-, 151- and 163-second
cycles leave long rests between gentle habits; reduced motion holds all five
figures still. The `atmosphere.travellers` diagnostics expose all four states,
and both reader and traveller diagnostics now include opacity.

The reader correction flexes page vertices through the reader-facing negative-Z
half-space, with its source leaf behind the base spread and lift toward the
body. It stays clear of the coat instead of swinging a rigid sheet through it.
Reader geometry counts remain 32,672 triangles and seven primitives; the
regenerated GLB is 4,207,944 bytes. Actual-GLB tests cover turn direction and
clearance through seven phases, along with non-accumulating deformation. The
user’s defect report supersedes the earlier reader review on this behavior.

All five share the reader’s actual material/map at runtime, disposing the
redundant passenger texture. Both GLB downloads still embed the atlas.
`src/spirit-material.js` renders a depth-only silhouette after water, then
blends the nearest visible surface at opacity 0.7. The extra pass shares
geometry and prevents cloth/limb overlaps from becoming opaque patches. This
is nearest-surface translucency, not volumetric refraction. The 23 authored
meshes can require 46 spirit submissions during a turn, or 44 at rest, before
culling. This cost and the roughly 8 MiB shared decoded atlas are construction
figures; headset performance is unmeasured.

Two bounded visual passes were completed. One refinement batch adjusted hip
fins, welts and neck construction; the later user translucency request was
included before final evidence. At that stage, all 79 tests and the production build passed in
`passengers-tests.log` and `passengers-build.log`; the existing JavaScript
chunk-size warning remains. Final actual-browser QA in
`.impeccable/review/passengers-result.json` passed with no errors and 18 final
captures, covering both seats, all habits, the corrected reader-facing turn,
travel/pause/return, night, 390px mobile and reduced motion. Recorded states
confirm the gestures and all five opacity values at 0.7.

The fresh independent review in `passengers-finish-review.md` returned **ship**:
all 18 captures were opened and no material fixes remain. It covers the four
new sculptures, corrected page pose, 70% opacity and preserved scene/controls.
The reviewer sampled runtime/tests, but did not independently inspect builder
scripts or continuous WebM footage. A natural-turn recording is retained at
`.impeccable/review/passengers-video/page@2d377ea358db061faac4fbaac4d1729f.webm`.
The recording’s existence is not subjective continuous-motion approval.
Physical Quest stereo, comfort and sustained frame time remain unverified.
No new VR target requires a new control mapping; inherited headset controls
still need physical-device validation. This pass does not reapprove the dragon.

`output/newspaper-reader.png` is the final translucent reader preview and
`output/spirit-passengers.png` is the final boarding capture. The original
opaque reader reference remains in `reader-left-reading.png`. One detector
run produced only two inherited `world.js` color advisories in
`passengers-detector.json`. The provenance scan still covers six shipping
rasters with zero missing records; atlas pixels and provenance are unchanged.
`DESIGN.md` and `.impeccable/design.json` are preserved byte-for-byte. Full
asset details are in `assets/spirits/README.md`; documentation evidence is in
`.impeccable/review/passengers-documentation.md`.

The five-passenger work remains local, uncommitted and unpublished on
`codex/newspaper-spirit`. Main/origin `07d5af8` remains the controls/audio
release deployed by Actions run `42170566231`. No commit or publish was made.

## Earlier milestone: one newspaper reader — historical review

This stage is retained as history. The user later approved the appearance but
caught a reversed page turn; the review below missed that defect. The later
five-passenger milestone above supersedes its test totals, opacity and turn
behavior.

The user approved finishing one original newspaper-reading spirit after the
proposal to start with a single passenger. It sits further along the right
bench, with a pale seedpod face, sleepy eyes, worn indigo coat, ivory hands,
warm-paper newspaper and travelling bag. Blender-authored cloth folds, seams,
fingers and paper thickness provide real geometry for close views. The reader
belongs to the existing carriage; there are no new sounds, controls, dialogue,
free walking or forced camera movement.

`scripts/build-reader.py` creates `assets/spirits/newspaper-reader.blend`,
`public/assets/spirits/newspaper-reader.glb` and `reader-metadata.json` using
Blender 4.5.15 LTS. The source retains editable components; export groups them
into seven pose meshes sharing one opaque matte material and atlas. Final
export: 32,672 triangles, seven primitives and 4,207,912 bytes. The native
1254 × 1254 atlas costs about 8 MiB decoded as RGBA8 with mipmaps. These are
construction figures, not measured Quest performance.

`src/train-reader.js` attaches the floor-origin model at carriage-local
(1, 0.9, -1.9), with Y rotation -pi/2. Its authored cushion height is 0.45m.
Both visitor seats and the boarding doorway remain clear. The reader inherits
carriage movement. A 119-second gesture cycle includes page turns at 16–20.8s
and 72–77.4s, a sea glance at 42–51s and a paper adjustment at 96–102s, separated
by reading. Reduced motion fixes the resting pose. Diagnostics expose phase,
turning, page progress and reduced-motion state at
`window.quietLine.diagnostics.atmosphere.reader`.

At that stage, all 72 automated tests and the production build passed. Actual browser QA passed
loading, both seats, page turns, sea glance, departure, pause, return, 390px
mobile and reduced motion without reported errors in
`.impeccable/review/reader-result.json`. The fresh finish review in
`reader-finish-review.md` returned **ship** for this local one-reader milestone:
all ten required captures were inspected and valid, with no material fixes.
They cover aisle, both seats, page lifting/turning/settling, sea glance, night,
mobile and reduced motion. The generated concept and secondary Blender render
were not substituted for runtime evidence. Still images do not establish
continuous-motion quality; physical Quest stereo, targeting, comfort and
sustained frame time remain unverified. The existing dragon is not reapproved.

The historical opaque left-seat preview is retained at
`.impeccable/review/reader-left-reading.png`; `output/newspaper-reader.png` now
shows the final translucent reader.
`output/reader-concept.png` is a separate 1586 × 992 generated character study.
Both that study and the shipping atlas preserve native generated pixels; their
exact prompts, embedded PNG metadata and provenance JSON are retained. The
`public/assets` provenance scan covers six rasters with zero missing records.
The detector has only two inherited `src/world.js` color advisories.
`DESIGN.md` and `.impeccable/design.json` are preserved unchanged; this ordinary
character extension introduces no system tokens. Rebuild and pose details are
in `assets/spirits/README.md`.

The reader is local, uncommitted and unpublished on `codex/newspaper-spirit`.
The published controls/audio release remains main commit `07d5af8`, deployed
successfully by GitHub Actions run `42170566231`. No commit or push belongs to
this reader pass.

## Earlier milestone: quieter train audio — deployed

Default volume is reduced from 55% to 35%, retaining the existing 0.65 master
multiplier. `src/train-audio.js` replaces the repeated 70Hz travel chimes with
dry filtered rolling noise and rounded paired track contacts. The
layer follows ride speed and distance: groups occur about every 6m, with a
roughly 0.86m paired offset and slight deterministic variation. That is about
2s per group at cruise or 5s at 1.2m/s. Soft envelopes settle the train layer to
silence when paused; route resets and long gaps do not create catch-up bursts.
The user rejected the first pass because only a constant whoosh was audible.
The revision lowers the continuous train noise sixfold, gives contacts a
12ms rounded onset and separate low-mid filtering, and shortens their tails
to keep the two wheel contacts distinct. Water and wind fade down inside the
carriage and restore outside, without changing the visitor's volume setting.
The user could then hear the bumps but wanted them slightly louder and reported
an unpleasant low screech. The latest tuning removes both the sustained sine
hum and each contact's falling sine tone, softens the noise filters and raises
the contact-window level by about 3dB. The train layer now uses noise alone.

All 66 tests and the production build pass, including eight train-audio tests
and four audio integration tests. Actual OfflineAudioContext rendering and
browser volume/mute/depart/pause checks passed with no errors in
`.impeccable/review/audio-result.json`. The unnormalized 36-second
`output/quiet-train-preview.wav` uses actual 35% default gain and demonstrates
acceleration, cruise, slowing, pause and resume for the train layer only.
The 12-second `output/train-track-soft-knocks.wav` isolates steady cruise;
`output/train-track-rhythm.wav` is also refreshed with this render.
It measured peak −29.16dBFS and RMS −57.42dBFS, with the weaker median contact
window 22.09dB above the intervening rolling bed. Stationary and settled paused
sections were zero. These signal metrics do not establish headphone SPL or
listening approval. The latest tuning is retained for this release; actual Quest
audio/comfort validation remains outstanding.

The controls layout is unchanged from its **ship** review; only the initial
volume value and read-only audio diagnostics changed. No second visual review
was needed, and no design tokens or raster assets changed. The user authorized
committing the controls/audio release, merging to main and pushing to remote.
GitHub Actions tests and deploys each main push; its run is the deployment record.

## Earlier milestone: compact controls — reviewed

The user found the floating VR board too large and asked for less obstructive
controls, while retaining the station, boarding and seat actions without free
walking. Screen exploration now keeps only the journey button and Menu at the
lower right. The requested menu contains seats, return, named time selection,
sound and exit; volume, detail, quiet water, help and welcome-screen navigation
sit inside More options & controls. H/Escape toggle it, Close or an outside world
click dismisses it, and focus returns appropriately. Notices last 3.2 seconds.
Opening the menu or changing time/sound preserves the journey and view; travel
actions close it.

The VR menu starts closed and toggles with either grip. Its 0.54m × 0.55m panel
opens 0.9m ahead and 0.22m below the actual head, only on request and without a
floor clamp. Trigger selects; Close dismisses; Time of day opens six named
choices with Back to journey. It does not reopen on entry or after seat changes,
and closes on travel actions, snap turn and XR visibility loss. Late full-opacity
rendering keeps water and glass from cutting holes through the panel.

At this controls milestone, all 54 tests and the production build passed. Functional browser checks at 1440px,
390px touch and 320px with reduced motion cover menu/focus, boarding, both seats,
pause, time, return and exit without reported errors. Evidence is in the ignored
`.impeccable/review/controls-result.json` and ten fresh `controls-*.png` captures.
The fresh review in `.impeccable/review/controls-finish-review.md` returned **ship**
for this controls refinement, with all ten captures valid and no material fixes. Projected VR captures use
production meshes in a monoscopic browser inspection scene; they are layout
evidence, not headset or controller proof. Quest stereo/readability, physical
controller behavior, comfort, audio and sustained frame time remain unverified.

The detector recorded 12 advisory findings, including inherited palette/type
documentation drift and false positives for the `#fade` selector and computed
HTML black. Palette and font choices remain. No new raster assets were added;
the five-file provenance scan reports zero missing records. This pass does not
renew the rejected dragon's art review.

The earlier train commit `7c04a1f` deployed successfully via GitHub Actions run
`42166060991`. The compact-controls changes are included in the controls/audio release.
Local preview remains `http://127.0.0.1:5173`. Updated local images are
`output/train-window-seat.png` and `output/controls-menu-preview.png`.

## Earlier milestone: one rideable carriage — deployed

The user authorized implementation by a coordinated fleet of agents. The
first milestone is implemented: one original Blender-authored carriage with a
window-seat interior, fixed raised station, boarding, left/right seats,
departure, pause/continue and return. The existing ocean, sparse blue sky and UI
tokens remain. The fresh finish review returned **ship** for this first
carriage/window-seat milestone, with no material fixes across 13 valid actual
browser captures. This is a local implementation and review result, not a
deployment or physical-headset verdict.

Work is divided between carriage geometry/export, painted materials, ride
mechanics/UI, and independent functional/asset verification. The parent owns
the fixed shoreline, integration, visual review and documentation. All agents
share the checkout with explicit file boundaries. No purchases or publication
are included in this implementation pass.

### Result and reproducibility

- The station is fixed at (-3.4, 0.6, -3) on a raised grassy shore. The carriage
  starts at (0, 0, -4), with a 0.9m floor, and travels up to 1,100m at a gentle
  3m/s cruise. Return restores its berth and the platform viewpoint.
- Screen buttons, keyboard and the VR ticket use the same board, seat, depart,
  pause/continue and return actions. Changing seats pauses progress. Room-scale
  head height and independent gaze are preserved; no forced camera roll or
  bobbing is added. The former water teleport and observation deck are retired.
  Hidden documents and XR visibility loss pause travel; petals hide indoors.
- `assets/train/carriage.blend` and `scripts/build-train.py` produce the runtime
  `public/assets/train/carriage.glb`; `src/train.js` loads it. Official portable
  Blender 4.5.15 LTS was verified and installed under ignored `.tools/blender/`.
  The rebuild command and coordinates are in `assets/train/README.md`.
- The original generated 1254 × 1254 painted atlas is preserved, with its exact
  prompt adjacent and embedded in PNG metadata. `assets/train/materials.json`
  records safe UV regions and provenance. No reference pixels or model parts
  were copied. Export: 42,580 triangles, seven primitives, five materials,
  3,941,940 bytes and about 8 MiB decoded atlas memory with mipmaps. Glass may
  add a pass; primitive counts do not establish actual draw calls or frame rate.

### Verification and limits

All 47 automated tests and the production build pass. Independent desktop and
390px mobile touch QA passed boarding, rapid placement clicks, both seats,
departure, pause/continue, return, keyboard, sound and time controls. It reported
no runtime, shader or network errors. Evidence is in the ignored local
`.impeccable/review/train-verify-result.json` and `train-*.png` captures.
The raster provenance scan found zero missing records across five files.

`.impeccable/review/train-finish-review.md` records the **ship** verdict for
visible carriage geometry, materials, framing, daylight/night and desktop/mobile
readability. Supplied tests support state and translation behavior. Secondary
Blender inspection confirms the sloped cab; it is not runtime evidence.
Continuous-motion quality, audio balance, Quest stereo clarity, controls,
room-scale comfort and sustained frame rate remain unverified on hardware.
The current dragon is not replaced or reapproved by this review.

`.impeccable/review/train-detect.json` has six advisory findings: inherited
palette/type documentation drift and the new shoreline's local material color.
No palette, typography or token-schema changes were made to chase the detector.
Boundary docs, current controls, preview captures and asset provenance are
updated. The implementation pass itself did not publish; commit `7c04a1f`
was subsequently deployed successfully. These 47-test checks describe the
earlier carriage milestone; later verification is recorded above.

## Completed train research

The focused Astra extra-high research is complete. See
[the research plan and handoff](TRAIN_RESEARCH_PLAN.md) and
[the asset decision brief](TRAIN_ASSET_RESEARCH.md). Four candidates were
reviewed; none is fully confirmed as a ready-to-use match. The report recommends
one carefully authored Blender carriage, with a free existing model as an
optional first geometry inspection. The original-carriage route was selected
for implementation, using portable Blender and an original painted atlas.
The implemented design uses a stationary raised
platform and a rideable train with a window-seat interior. The user rejected
the current dragon's smooth procedural appearance; historical review approval
below does not establish their acceptance. Preserve the open blue sky and soft
clouds. The research stage changed documentation only.

## Earlier atmosphere work — historical

Approved direction: bright, deep blue sky dominates. Fewer, deliberately placed
painted clouds, gentle discoveries, and a world whose small lives respond to one
another. Keep the open ocean, submerged railway, stable horizon and existing
desktop/WebXR controls.

Work sequentially:

1. **Open summer sky — complete.** Four sparse angular painted banks replace the
   crowded panorama and nine procedural puffs. A deep-blue procedural wash and
   the same painted sky feed water reflections. Both generated textures are
   1536 × 1024 RGBA; dimensions and transparent margins were inspected.
2. **Cloud dancer — complete.** One painted veil crosses the dragon's existing
   flight route, with depth-tested occlusion and gentle mist through its body.
3. **Weather far away — complete.** A distant rain curtain and shared moving
   cloud shade affect water and station; a common breeze precedes the shade.
4. **A quiet passenger — complete.** An original sea-glass visitor with a folded
   leaf cap and brass ticket sits beside the suitcase, watches the dragon and
   departs. The cat briefly responds to the train whistle.
5. **Verify and document — complete for local implementation and automated checks.**
   All 39 tests and the production build pass. Final automated Chrome desktop
   and mobile rendering report no runtime or shader errors. Drift, pause,
   return and time settings pass. Review covered daylight and reduced motion,
   dragon before/during/after the veil, clear/shaded views, and rear/zenith views.
   The desktop preview and design/provenance documentation are updated. Exact
   cloud prompts are adjacent `.prompt.txt` files and embedded PNG metadata.

Status: local implementation and automated verification complete. The finish
review approved the corrected compositing and captured states. Continuous
motion quality remains unverified by those snapshots. Actual Quest clarity,
controller behavior, audio balance, comfort and sustained frame rate still
require a physical-headset check. Render counts vary by view and scene state;
diagnostic snapshots are illustrative, not performance guarantees.

Reduced motion disables the new weather events and keeps the passenger resting;
existing birds, bell, train and plane animation can continue. It is not a total
world-motion pause. New assets remain local to this application; no publishing
is part of this pass.

## Reference refinement — November 2026, historical

This section records the prior implementation and its then-current checks.
Moving-station behavior and the 42-test count below are historical. The later
user criticism of the smooth procedural dragon supersedes any implication of
user acceptance from that earlier reviewer verdict.

The subsequent requests extend the approved sequence:

1. **Livelier dragon — implemented.** A faster cruise, cloud skim, broad
   vertical loop, banking dive and rising turn. Arc-length sampling and
   transported frames preserve continuous orientation, including the repeat
   seam. Camera motion remains under visitor control.
2. **Dragon appearance — implemented.** Longer white muzzle, green almond
   eyes, tall lavender-lined ears, ivory horns and fuller teal fur, informed
   by the supplied dragon reference. Geometry remains local and procedural.
3. **Passing island — implemented.** A fixed grassy island beside the route
   with a cream cottage, clay roof, trees, bench, stepping stones and laundry.
   Trees and cloth share the breeze; windows warm at dusk. The station passes
   the island during travel. Reduced motion holds its moving details still.
4. **Softer clouds — implemented.** The two 1536 × 1024 RGBA paintings are
   repainted using the latest reference for feathered edges and pale-blue/mint
   washes. Four background banks and dominant deep blue are preserved. Exact
   prompts are saved beside the PNGs and embedded in them.
5. **Verification — passed locally.** All 42 tests and the production build
   pass. Updated automated Chrome captures cover desktop/mobile arrival,
   loop stages, cloud crossing, a close-up of the dragon, island daylight/dusk
   and reduced motion. Travel, pause, return and time settings work, with no
   runtime or shader errors. Vite retains its bundle-size advisory. Fresh
   visual review returned **ship** for all ten submitted captures, with no
   material visual fixes owed. The reviewer accepted the reference adaptations
   and preserved blue openness. Fine geometric forms remain visible in the
   separate close-up inspection; headset and continuous-motion validation are
   still outside the evidence. Documentation and asset provenance are updated.
