# Fellow travellers

Mode: Experience. The user approves the newspaper reader's appearance, reports
that its page turns away from the reader, and authorizes three or four additional
different spirits. Build four, inheriting the approved sculpture and atlas.
During implementation the user requested the spirits be 30% translucent:
apply 70% opacity to all five figures, including their carried belongings.

## Direction contract

THESIS: Five unfamiliar people quietly sharing a journey make the train feel
inhabited. Each silhouette and occupation should be recognizable from a seat.

OWN-WORLD: Preserve the painted cream carriage, red cushions, timber and blue
ocean. Reuse the reader's matte cloth, ivory and leather atlas on authored
Blender meshes with folds, weighted seated bodies and small personal objects.

STORY: Board, notice the scattered travellers, choose either existing seat and
watch their unhurried habits. A newspaper page folds toward its reader; the
others nap, watch the water, tend a plant or contemplate a keepsake.

FIRST VIEWPORT: The boarding aisle stays open. The reader remains on the right
at z=-1.9; a broad sleeper sits at right z=2.4, a small moth at left z=-2.8, a
long-eared gardener at left z=2.1, and a hooded keeper at right z=-4.5. Floor
origin is y=.9. Both visitor seats at z=0 retain clearance and open water views.

FORM: Local addition to the approved 3D world, with no new visual-world or
surface concept round. Distinct original sculptures share one existing atlas.
Staggered short gestures have long rests; reduced motion holds all five still.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance. Preserve DESIGN.md and its sidecar for this ordinary extension.

## Boundaries and verification

No additional controls, camera movement, dialogue or sound. No commit or publish
in this pass. Preserve the approved reader’s form; its page-turn correction and the later
user-requested translucency are the authorized changes.
Verify page motion against the actual asset coordinates, passenger clearance,
carriage attachment, reduced motion, browser errors, both seats, mobile and night.
Review evidence must include the user's page-turn report; the previous reader
review missed that defect and cannot certify this correction.

## Completed local milestone

Four original Blender sculptures are complete in `assets/spirits/passengers.blend`:
the broad ochre sleeper with hat/satchel, small ivory moth with antennae,
long-eared sage gardener with a seedling, and rust-robed keeper with a sea shell.
`scripts/build-passengers.py` exports their GLB and exact metadata: 51,996
triangles, 16 primitives, one material/atlas and 4,746,744 bytes. All use the
unchanged reader atlas with per-vertex pigment washes; no new raster or image
generation was used. The reader’s corrected GLB is 4,207,944 bytes with its
existing 32,672 triangles and seven primitives.

`src/train-passengers.js` implements independent long-rest cycles of 137, 131,
151 and 163 seconds. All figures inherit train movement and hold still under
reduced motion. `readerPagePoint` flexes the page toward the reader’s local
negative-Z side while clearing the coat; its source leaf begins behind the
base spread. `atmosphere.reader` and `atmosphere.travellers` expose opacity.

The five figures share the reader’s actual material/map at runtime, although
both GLB downloads contain the atlas. `src/spirit-material.js` applies 0.7
opacity to figures and belongings. A shared depth-only silhouette pass follows
water and precedes the visible color pass, blending the nearest surface once.
This is surface translucency, not volumetric refraction. The extra submission
per mesh shares geometry; up to 46 spirit submissions during turns (44 at rest)
are possible before culling. No headset performance is established by these counts.

Two bounded visual passes are complete. All 79 tests and the production build
pass; the existing >500 kB JavaScript chunk warning remains. Final actual-browser
QA in `.impeccable/review/passengers-result.json` passed with no errors and 18
captures, covering both seats, all four gestures, reader-facing page motion,
night, 390px mobile, reduced motion and travel/pause/return. States confirm
all five opacity values at 0.7. The fresh independent **ship** verdict in
`passengers-finish-review.md` inspected all 18 captures with no material fixes.
Continuous WebM footage and builder scripts were not independently reviewed;
physical Quest stereo, comfort and sustained performance remain unverified.

`output/newspaper-reader.png` and `output/spirit-passengers.png` are final actual
browser previews. The approved opaque reader reference remains in
`reader-left-reading.png`. The natural-turn recording is retained under
`passengers-video/`, without claiming subjective continuous-motion approval.
The single detector run found two inherited world color advisories; six shipping
rasters retain provenance with zero missing records. `DESIGN.md` and
`.impeccable/design.json` remain byte-for-byte unchanged. This work is local,
uncommitted and unpublished on `codex/newspaper-spirit`; main/origin `07d5af8`
remains the deployed controls/audio release.
