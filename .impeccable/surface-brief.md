# World surface
Mode: Experience. User delegated creative decisions and requested a huge bright-blue space.

## Direction contract
THESIS: A tiny station in a vast painted ocean; the world occupies the entire viewport.
OWN-WORLD: Dominant bright, deep blue sky, turquoise water, sparse ivory cloud banks with feathery edges and pale-blue/mint washes, weathered timber, deep sea-blue enamel controls. Lettering feels like a quiet illustrated travel story.
STORY: Arrive at a fixed raised shoreline station, board the waiting carriage, choose a window seat and depart across the sea. Pause or return explicitly. Head tracking remains independent; no forced bobbing or camera roll.
FIRST VIEWPORT: Horizon through the middle, generous blue between deliberately placed cloud banks above, submerged rails converging below. Title and invitation at lower left; enter controls lower right. Controls recede during exploration. In VR all controls are reachable in-world.
FORM: User-pinned ocean storyboard overrides direction selection, refined by the later explicit instruction for FEWER CLOUDS and dominant bright, deep blue sky. Seed 53425ab6 ran with no remote challengers. Creative decisions are explicitly delegated. The current surface uses four softly painted banks over a procedural blue wash, with the same sky reflected in water. Their sampling occupies limited angular windows; their visible edges are soft and feathery.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Current carriage-character extension — locally reviewed

The user approved implementing a worn, cared-for carriage with upfront painting
and baking work to keep Quest 3/3S runtime costs low. The contract is
`carriage-character-brief.md`. Faded red cloth, two upward cushion repairs,
rubbed walnut and cream enamel, illustrated route/seaside notices, carriage 03,
a static scarf and parcel now extend the incumbent scene. Soft vertex shading
grounds the surfaces while changing daylight remains active. Passengers,
creatures, rear-wall closure, controls and independent gaze remain intact.

One opaque 1536 × 1024 generated atlas replaces the original embedded image;
the original remains historical source. The new exact prompt and
`assets/train/lived-in-materials.json` preserve provenance and safe UVs.
Current carriage cost: 45,097 triangles, seven primitives, five materials,
one atlas, approximately 8.00 MiB decoded with mipmaps and 5,406,204 GLB bytes.
All 13 matched draw counts are unchanged; geometry adds 2,285 triangles.
No runtime JavaScript, lights, shadow passes or motion were added.

All 95 tests and the production build pass, retaining the existing chunk warning.
`character-after-result.json` reports no browser errors; the independent
`character-finish-review.md` returns **ship**, with all 19 final captures valid
and no material fixes. The detector is empty, and seven rasters have zero
missing provenance records. `output/carriage-character.png` is the final
left-rear view. The user accepted the finished result and requested commit and
push. Physical Quest performance, stereo and comfort remain unverified.
The design system and sidecar remain unchanged.

## Earlier floor-colony extension — locally reviewed, historical evidence

Six additional quick, curious floor fuzzballs preserve the established painted
form, white eyes, silence and opacity. Nine fuzzballs and one mouse now share
the carriage. The user accepted the live colony: “Yeah I'm looking at it.
I think it looks great.” `floor-scurriers-brief.md` and the companion source
guide record independent scurrying, uneven investigations and rests, bounded
movement, actual shoe clearance and grounded distance-driven hip strides.
Existing quiet encounters, rear-wall repair, controls and camera remain.
Reduced motion holds the colony still. Four instanced draws render the six
floor actors using shared geometry, materials and the unchanged atlas.

At that milestone, all 94 tests and the production build passed, with the existing chunk advisory.
`floor-result.json` passed with no errors across eleven final captures of
boarding, both seats, scurrying, night, travel, mobile and reduced motion.
Five reframed captures replaced empty initial views; Pip's desktop sequence
shows listening, scurrying and listening with a fixed camera. The independent
`floor-finish-review.md` returned **ship** after reviewing all eleven images,
source and supplied validation evidence; no material fixes remain.
`output/floor-scurriers.png` uses the final right-seat floor view. The detector
is empty and six shipping rasters retain provenance. Live user acceptance and
this review do not establish physical Quest or subjective continuous-video
validation. Work remains local, uncommitted and unpublished; deployed main is
`07d5af8`. `DESIGN.md` and `.impeccable/design.json` remain unchanged.

At that milestone, worn carriage detail and baked lighting were still a future
discussion. The subsequent approval and implementation are recorded above.

## Earlier rear-wall repair — locally reviewed, historical evidence

The user's screenshot reopens a defect missed by earlier ship reviews: maroon
tearing across the cream lower rear door as the viewpoint changes. The fresh
`rear-wall-finish-review.md` returned **fix**. Duplicate-depth intersections on
the actual GLB confirm that the maroon body and cream door shared interior
z=7.49. The builder now uses two maroon side panels and a sill below the door,
preserving the painted materials, exterior enclosure and established world.
`rear-wall-brief.md` records this narrow repair; adults remain 70% opaque and
companions solid, with their behavior, rendering, controls and camera unchanged.

The rebuilt export has 42,812 triangles, seven primitives, five materials, the
unchanged 1254 × 1254 atlas and 3,951,092 bytes. At that milestone, all 90 tests and the production
build passed; a new 28-probe actual-GLB regression fails on the old asset and
passes on the repair. `rear-wall-after-result.json` passed without reported
errors across 19 captures of both seats, the user's viewport, boarding,
eye-contact/rest framing, night, mobile, travel, two separate exterior asset
inspection views and five slow-sweep frames. The original reviewer returned
**ship** in `rear-wall-verdict.md`, independently opening all 19 captures and
resolving both findings without visible repair-induced material regression.
The verdict covers only those two fixes, not the whole world. The retained WebM was not
played through by an observer, so no subjective continuous-motion or physical
Quest certification follows. The builder-only detector is empty, and six
shipping rasters retain provenance with no new image. The new preview is
`output/rear-wall-fixed.png`; historical previews remain. Work is local,
uncommitted and unpublished, with deployed main/origin at `07d5af8`.
`DESIGN.md` and `.impeccable/design.json` remain byte-for-byte unchanged.

## Earlier quiet-encounter extension — locally reviewed, historical

Its evidence and counts below describe that milestone. The user's later
rear-wall report supersedes the earlier ship result for that specific defect.

The approved extension lets sustained looking invite one creature's attention:
notice, two tentative approach hops, a short shared look, a quicker shy retreat,
a peek back and a return to its own game. The mouse mostly watches the sea,
occasionally turning to its friend or the traveller; fuzzballs also watch the
view between games. Existing models, assets, pigment, silence, controls and
camera behavior remain. The companions stay opaque and the adults at 70% opacity.

`curiosity-brief.md` records the direction; `assets/spirits/COMPANIONS.md`
records the implementation. Camera/head direction, not eye tracking, drives
bounded carriage-local attention. One active actor, a settling period, dwell
and a 24-second post-encounter cooldown keep reactions sparse. Menus,
transitions, station visits and reduced motion suppress new encounters.
Active encounters finish safely, returning to the same grounded ambient pose.

At that milestone, all 89 tests and the production build passed in `curiosity-tests.log` and
`curiosity-build.log`, with the existing chunk advisory. Final browser QA in
`curiosity-result.json` passed without reported errors across 15 captures of
ambient viewing, the encounter stages, mouse glance, both bench friends, night,
390px mobile and reduced motion. The fresh `curiosity-finish-review.md` returned
**ship**, opening all 15 captures and finding no material fixes; its scope is
the captured states and supplied behavioral/geometry evidence.
`output/curious-companions.png` is the final shared-gaze capture; earlier previews
are preserved. The detector retains only two inherited color advisories and
all six shipping rasters have provenance. Held poses and numerical
continuity checks do not establish subjective continuous-motion approval or
physical Quest stereo, comfort or performance. No commit or publication is part
of this pass; `DESIGN.md` and `.impeccable/design.json` remain unchanged.

## Earlier little-companion extension — locally reviewed, historical

The mouse behavior and verification below describe that original companion
milestone. The later encounter and floor extensions above supersede its runtime behavior and counts.

The user approved solid painted creatures: a plump taupe mouse and charcoal
fuzzballs with white eyes, silent and mostly entertaining each other. One
mouse watches its friend from a shallow wooden perch above the right bench
back; two other fuzzballs occupy separate empty left-bench cushions. Their
closed travelling hops rise two to three body heights, with long rests.
Detailed direction and implementation are in `companions-brief.md` and
`assets/spirits/COMPANIONS.md`. All four creatures and the perch are opaque;
the five adult spirits retain 70% opacity. Both visitor seats, doorway, aisle,
camera behavior, controls and sound remain intact. Reduced motion holds the
companions still and carriage travel carries them.

The original Blender export contains 17,266 triangles, eight primitives, two
opaque materials and one unchanged reader atlas, in 3,818,956 bytes. Three
runtime fuzz instances share geometry; the complete addition has 27,314
triangles and 12 primitives before culling. The body uses an opaque clone
sharing the adult atlas without changing its material. White eyes/dark pupils
use an untextured matte material. A pigment-aware ambient-fill hook preserves
charcoal and pupils at night. No new generated raster was used.

At that milestone, all 85 tests and the production build passed, with the existing chunk warning.
Final browser QA passed without reported errors in `companions-result.json`,
with 14 final captures covering boarding, both seats, mouse/hop poses, both
bench friends, night, 390px mobile and reduced motion. Loading and
departure/pause/return passed. The fresh independent **ship** verdict in
`companions-finish-review.md` opened all 14 captures and found no material
fixes. Held poses do not establish subjective continuous-motion approval. The new
preview is `output/little-companions.png`; previous previews are preserved.
Six shipping rasters have zero missing provenance records, and the detector
reports only two inherited `world.js` color advisories. `DESIGN.md` and
`.impeccable/design.json` remain unchanged. Physical Quest stereo, comfort and
sustained performance remain unmeasured.

The little-companion and five-spirit extensions are local, uncommitted and
unpublished on `codex/newspaper-spirit`. Main/origin `07d5af8` remains the
deployed controls/audio release (Actions run `42170566231`). Earlier stages
below retain their own historical evidence and counts.

## Earlier five-passenger extension — locally reviewed

The user approved the original reader’s appearance, reported its reversed page
turn and requested three or four additional distinct spirits. Four original
Blender sculptures now share the carriage: an ochre sleeper with a hat/satchel,
a small ivory moth, a long-eared sage gardener with a seedling and a hooded rust
keeper with a sea shell. The reader remains at right z=-1.9; the new figures
occupy right z=2.4, left z=-2.8, left z=2.1 and right z=-4.5 respectively.
The aisle, doorway and visitor seats stay clear. Independent long-rest habits
inherit train movement and hold still under reduced motion. The page now curls
toward the reader’s local negative-Z side, clear of its coat. The original
one-reader review missed this defect and is historical, not proof of the fix.

The user’s later request for 30% translucency gives all five figures and their
belongings 70% opacity. A depth-only silhouette pass followed by the color pass
blends the nearest spirit surface once. This adds submissions while sharing
geometry; 23 authored meshes can require 46 spirit submissions during a turn
or 44 at rest, before culling. Both GLBs embed the same atlas, but runtime shares
one actual material/map and disposes the redundant texture. This is surface
translucency, not volumetric refraction. No UI, sound, forced view or new VR
control target is introduced. Detailed direction is in `passengers-brief.md`.

The four-passenger GLB has 51,996 triangles, 16 primitives, one material/atlas
and 4,746,744 bytes. The corrected reader has 32,672 triangles, seven primitives
and 4,207,944 bytes. The original 1254 × 1254 atlas and provenance are unchanged;
no new raster or image generation was used. Six shipping rasters have zero
missing provenance records. The detector reports two inherited `world.js`
color advisories. `DESIGN.md` and `.impeccable/design.json` remain unchanged.

At that stage, all 79 tests and the production build passed, with the existing bundle-size
warning. Final browser QA in `passengers-result.json` passed without errors
and references 18 captures, covering both seats, every new habit, reader-facing
page motion, night, 390px mobile, reduced motion and travel/pause/return. The
fresh **ship** verdict in `passengers-finish-review.md` inspected all 18 and
found no material fixes. Continuous WebM motion and physical Quest stereo,
comfort and sustained performance remain unreviewed. That stage's previews are
`output/newspaper-reader.png` and `output/spirit-passengers.png`; the original
opaque reader reference stays in `reader-left-reading.png`.

The five-passenger extension is local, uncommitted and unpublished on
`codex/newspaper-spirit`. Main/origin `07d5af8` remains the deployed controls/audio
release (Actions run `42170566231`). Earlier stages below retain their own
historical evidence and counts.

## Earlier quiet-train audio extension

Default volume is now 35%. Original low rolling noise and rounded paired
track contacts follow train distance and speed, replacing repeated travel
chimes while preserving existing ambience. Pausing settles the train layer to
silence. The user reported that the first pass sounded like a constant whoosh.
The revision reduces the rolling bed, sharpens the definition of the rounded
paired taps and lowers water/wind inside the carriage. After the user heard the
bumps but reported a low screech, sustained and sliding sine tones were removed
and contact-window levels raised about 3dB. At that audio stage, all 66 tests/build passed;
offline Web Audio and real-browser checks
passed in `.impeccable/review/audio-result.json`. The 36-second
`output/quiet-train-preview.wav` is the train layer at actual default gain,
unnormalized. `output/train-track-soft-knocks.wav` is the latest 12-second
steady-cruise sample; `output/train-track-rhythm.wav` also contains this revision.
Signal metrics are not headphone loudness or listening approval;
the latest tuning is retained for this release and Quest listening remains unverified.
The reviewed controls layout and visual world are unchanged. The user authorized
committing the controls/audio release, merging to main and pushing to remote.

## Compact-controls extension — reviewed

The user rejected the giant floating VR board and retained station, boarding and
seat actions without free walking. Screen exploration now shows only Journey
and Menu at the lower right. The requested menu holds seats, return, named time
choices, sound and exit; More options & controls holds secondary settings/help.
H/Escape toggle it; Close or a world click dismisses it. Opening or changing
time/sound preserves journey and gaze; travel actions close it. Notices last 3.2s.

The VR menu starts closed. Either grip toggles a 0.54m × 0.55m panel, placed only
on request 0.9m ahead and 0.22m below the actual head with no floor clamp.
Trigger selects; Close and Back are explicit; six named time choices have their
own page. No auto-open on entry or seat changes. Travel actions, snap turns and
XR visibility loss close it. Late full-opacity rendering prevents water/glass
holes. Preserve the existing palette, lettering and world.

At that controls milestone, all 54 tests/build passed; desktop1440, touch390 and reduced-motion320 checks
report no errors in `.impeccable/review/controls-result.json`. Ten fresh
`controls-*.png` captures support the fresh **ship** finish review in `controls-finish-review.md`,
with all ten captures valid and no material fixes. Projected VR views
are production meshes in a monoscopic inspection scene, not headset/controller
validation. Twelve detector advisories include inherited token drift and
selector/computed-color false positives; no retokenizing was performed. Five
rasters retain provenance, zero missing; none were added. Actual Quest, motion,
audio and frame-time limits remain; the dragon is not reapproved.

Train commit `7c04a1f` deployed successfully. These compact-controls changes and
their preview images are included in the controls/audio release.

## Earlier carriage milestone
The user superseded the moving-station design with a stationary platform on raised ground and a train one can ride while looking through the windows. The approved process uses Blender geometry plus painted textures and GLB export; references show a cream/maroon vintage carriage, rounded roof, red bench upholstery, dark substantial window frames and hanging straps. Build one complete carriage and window-seat experience before extending the journey. User criticism of the smooth procedural dragon overrides its earlier visual acceptance; do not use that earlier verdict to claim the new art is accepted. Evaluate the actual exported carriage in the browser, including both seat views, aisle, exterior, daylight/dusk and mobile controls. The existing full-viewport visual world and UI tokens remain.

The first carriage is implemented and locally reviewed. The station stays at (-3.4, 0.6, -3) on raised grass; the train starts at (0, 0, -4) with a 0.9m floor. Board train → Depart → Pause/Continue → Journey complete shares actions across screen, keyboard and VR ticket. Left/right seat selection pauses travel; Return restores the berth. The train carries the visitor over 1.1km with a 3m/s cruise. Gaze and real tracked height remain independent; no forced roll/bobbing or generic water teleport remains. Petals hide indoors; visibility loss pauses travel.

The fresh review in `.impeccable/review/train-finish-review.md` returned **ship** with no material fixes across 13 valid actual-browser captures. It covers the first carriage/window-seat geometry, materials, framing, daylight/night and mobile readability; the sloped cab also has secondary Blender inspection. At that milestone, all 47 tests and the production build passed. Independent functional/asset evidence is in `train-verify-result.json`; provenance scan: five rasters, zero missing records. The 1254 × 1254 original painted atlas, exact prompt and editable Blender source are retained. Detector advisories record inherited palette/type documentation drift and a shoreline material color; existing UI tokens and schema remain. Continuous motion, audio balance and actual Quest stereo, controls, comfort and sustained frame rate remain unverified. The dragon is not reapproved. That implementation pass did not publish; its train commit was subsequently deployed. Current controls status is recorded above.

## Earlier approved atmospheric sequence — historical
1. Open summer sky: four sparse painted banks using two 1536 × 1024 transparent paintings; the panorama and nine procedural cloud sprites are retired.
2. Cloud dancer: one world-space veil across the dragon's route, with depth-tested paint and local body mist.
3. Weather far away: a distant rain curtain and shared water/station cloud shade, preceded by a common breeze.
4. A quiet passenger: an original sea-glass visitor beside the suitcase watches the dragon; the cat notices the train whistle.

Stages 1–4 are implemented as recorded in `WORKFLOW.md`. Keep existing UI tokens and controls. Captured states do not establish continuous motion quality or Quest clarity, comfort or frame rate.

## Earlier reference refinement — historical
The user additionally requested a more dynamic, faster dragon with a loop, a refined white/teal appearance following the supplied Haku reference, and a little passing island with a house and trees. The latest cloud reference calls for softer feathery edges and pale-blue/mint washes. It does not revoke the sparse, dominant deep-blue sky direction. The four sky banks and single local veil remain; their two 1536 × 1024 paintings are repainted. The dragon follows an approximately 1,038m arc-length route through a cloud skim, full vertical loop, banking dive and rising turn, with transported orientation tested through the seam. Its longer muzzle, green eyes, lavender-lined ears and broad teal fur locks carry the revised appearance. A cream cottage with clay roof, two chimneys, three trees, bench and clothesline stays fixed at (−41, 0, −112) beside the railway while the station passes. Camera motion remains visitor-controlled.

That reference refinement was implemented and documented with a then-current **ship** review, 42 passing tests and four-raster provenance scan. Its moving-station behavior, counts and verdict are historical; the user later criticized the dragon's smooth procedural appearance. Earlier captures and diagnostics remain in `.impeccable/review/reference-result.json`. The current carriage milestone above supersedes those travel mechanics and verification totals, without replacing or reapproving the dragon. Exact cloud edit prompts remain adjacent to the PNGs and embedded in metadata. Captures and numerical continuity tests do not establish continuous-motion quality or Quest comfort and frame rate.
