# The newspaper reader

This is the historical one-reader direction and its first review. The current
cast and completion evidence are in `passengers-brief.md`. The user approved
this reader’s appearance but later caught its reversed page turn; the original
review below missed that defect. The turn is now corrected and the user’s later
30% translucency request applies 70% opacity to all five figures and belongings.

Mode: Experience. Local extension of the existing painted carriage, authorized
by the user's “okay let's do it” after the proposal to finish one newspaper
reader before building a larger cast. Assume sparse, self-absorbed commuters;
the optional interaction/density questions were not answered individually.

## Direction contract

THESIS: A strange fellow traveller absorbed in an ordinary newspaper makes the
carriage feel inhabited. Character silhouette, cloth folds and quiet gestures
carry the scene at close range.

OWN-WORLD: Inherit the cream carriage, red benches, warm timber and painted
summer ocean. The original reader has an elongated pale seedpod face, small
sleepy eyes, a worn indigo coat with real folds, small ivory hands and a warm
paper newspaper. Matte painted texture, asymmetry and readable construction.

STORY: Board the existing carriage, notice a passenger further along the right
bench, sit in either existing window seat and watch it quietly read. Long idle
intervals separate a page turn, a paper adjustment and a brief look outside.

FIRST VIEWPORT: One seated reader around carriage-local (1.0, 0.9, -1.9), facing
the aisle. Keep both visitor seat anchors at z=0 and the boarding doorway clear.
The figure travels with the carriage; the current view and controls stay intact.
Its gently bowed head and newspaper form one legible silhouette down the aisle.

FORM: User-selected newspaper-reader concept inside an established world; no
new world or concept seed applies. Generated art is a character/material study,
not a replacement UI comp or a flat figure substituted for world-space geometry.
Blender authors the editable 3D asset. Runtime gestures use independently named
nodes with bounded motion and a still reading pose under reduced motion.

FINISH: unreviewed and undocumented is unfinished. This ordinary character extension preserves the existing DESIGN.md and .impeccable/design.json; completion requires a fresh finish verdict, factual project/asset documentation and provenance for every shipping raster.

## Boundaries

One original seated passenger with a newspaper and a small travelling bag.
No new control panel, forced camera movement, dialogue, navigation AI, boarding
simulation, added sound, changes to the dragon or new publication in this pass.
Keep the live release intact until this local milestone is inspected.

## Asset interface

`public/assets/spirits/newspaper-reader.glb`, source under `assets/spirits/`,
builder `scripts/build-reader.py`. Y up, +Z faces the aisle before placement;
origin is floor level, seat cushion is y=0.45. Measured export bounds are
x=-0.436 to +0.582m, y=0.015 to 1.738m, z=-0.187 to +0.614m (about 1.018m
wide, including paper and bag). Runtime placement rotates
the figure -pi/2 around Y. Named pose nodes: ReaderBody, ReaderHead, ReaderPaper,
ReaderTurnPage, ReaderLeftHand and ReaderRightHand. Preserve authored transforms;
runtime applies only small deltas. The turn leaf is hidden when inactive.

## Original local milestone — historical

The editable source, builder, metadata and runtime export are complete.
`src/train-reader.js` loads the model through `src/train.js`; it inherits
carriage movement and exposes reader state through the existing atmosphere
diagnostics. The 119-second gesture cycle turns pages at 16–20.8s and
72–77.4s, looks toward the sea at 42–51s, and settles the paper at 96–102s.
Reduced motion holds the reading pose. Export: 32,672 triangles, seven
primitives, one opaque matte material/atlas, 4,207,912 bytes.

At that stage, all 72 tests and the production build passed. Actual browser QA in
`.impeccable/review/reader-result.json` passed without reported errors. The
fresh review in `reader-finish-review.md` returned **ship**, with all ten
required captures valid and inspected and no material fixes. It covers aisle,
both seats, lifting/turning/settled pages, sea glance, night, 390px mobile and
reduced-motion poses. This verdict is scoped to the local one-reader milestone;
still captures do not prove continuous-motion quality, and physical Quest
stereo, targeting, comfort and sustained frame time remain unverified.

The original opaque capture remains at
`.impeccable/review/reader-left-reading.png`; `output/newspaper-reader.png` now
shows the final translucent reader. The separate
1586 × 992 `output/reader-concept.png` is generated character/material reference,
not an approved pixel comp or runtime result. The 1254 × 1254 atlas and concept
retain native pixels, exact prompts and provenance. The `public/assets` scan
found six rasters and zero missing records. The two detector advisories are
inherited `world.js` colors; neither design-system file was changed.

Rebuild, coordinates, node hierarchy and animation guidance are in
`assets/spirits/README.md`. Work is local, uncommitted and unpublished on
`codex/newspaper-spirit`; the deployed controls/audio release remains
`07d5af8` (successful Actions run `42170566231`).

## Current correction and cast

`readerPagePoint` now curls the leaf toward the reader’s local negative-Z side,
with the source leaf behind the base spread and negative-Z lift. Actual-GLB
regression checks verify direction, coat clearance and no accumulated deformation
across seven phases. The corrected export remains 32,672 triangles and seven
primitives, now 4,207,944 bytes. Shared runtime material treatment gives the
reader and all four additions 70% opacity, including belongings. The original
atlas pixels and provenance are unchanged.

All 79 tests and the production build pass. Final browser QA in
`passengers-result.json` reports passed with no errors and 18 final captures.
The fresh **ship** verdict in `passengers-finish-review.md` inspected all 18,
including the reader-facing page view, and found no material fixes. The earlier
review does not certify this correction. Continuous WebM motion and physical
Quest stereo, comfort and sustained performance remain unreviewed. Current
work remains local, uncommitted and unpublished; the deployed release is still
`07d5af8`. `DESIGN.md` and its sidecar are unchanged.
