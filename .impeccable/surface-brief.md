# World surface
Mode: Experience. User delegated creative decisions and requested a huge bright-blue space.

## Direction contract
THESIS: A tiny station in a vast painted ocean; the world occupies the entire viewport.
OWN-WORLD: Dominant bright, deep blue sky, turquoise water, sparse ivory cloud banks with feathery edges and pale-blue/mint washes, weathered timber, deep sea-blue enamel controls. Lettering feels like a quiet illustrated travel story.
STORY: Arrive at a fixed raised shoreline station, board the waiting carriage, choose a window seat and depart across the sea. Pause or return explicitly. Head tracking remains independent; no forced bobbing or camera roll.
FIRST VIEWPORT: Horizon through the middle, generous blue between deliberately placed cloud banks above, submerged rails converging below. Title and invitation at lower left; enter controls lower right. Controls recede during exploration. In VR all controls are reachable in-world.
FORM: User-pinned ocean storyboard overrides direction selection, refined by the later explicit instruction for FEWER CLOUDS and dominant bright, deep blue sky. Seed 53425ab6 ran with no remote challengers. Creative decisions are explicitly delegated. The current surface uses four softly painted banks over a procedural blue wash, with the same sky reflected in water. Their sampling occupies limited angular windows; their visible edges are soft and feathery.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Current quiet-train audio extension

Default volume is now 35%. Original low rolling noise and rounded paired
track contacts follow train distance and speed, replacing repeated travel
chimes while preserving existing ambience. Pausing settles the train layer to
silence. The user reported that the first pass sounded like a constant whoosh.
The revision reduces the rolling bed, sharpens the definition of the rounded
paired taps and lowers water/wind inside the carriage. After the user heard the
bumps but reported a low screech, sustained and sliding sine tones were removed
and contact-window levels raised about 3dB. All 66 tests/build pass;
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
