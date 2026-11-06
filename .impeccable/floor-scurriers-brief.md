# Little lives on the floor

Mode: Experience. Local extension of the approved charcoal creatures, within
the existing painted train. The user wants five or six quick, curious floor
creatures with irregular scurrying rather than repetitive mechanical hops.

THESIS: A small colony goes about its own business at the traveller's feet.
OWN-WORLD: Keep the exact approved fuzzy silhouettes, white eyes, opaque
painted materials and silent behavior. Add six floor creatures alongside the
three existing perch/bench companions. Preserve the mouse, adult passengers,
quiet encounters, rear wall repair, controls and camera.
STORY: Independent little dashes, slower investigations and uneven pauses.
They notice neighbors, change their minds, turn before running and give feet
and each other room. No shared repeating choreography or random teleports.
FIRST VIEWPORT: Discover them by looking down from the existing boarding and
window seats. No new UI or instructions. They inhabit the carriage floor.
FORM: Seeded autonomous decisions and bounded physical movement in carriage
coordinates. Acceleration, braking, turn limits, obstacle clearance and peer
avoidance; grounded alternating leg strides tied to distance travelled. Rest
under reduced motion. No sound, camera effects, new texture or dependency.
FINISH: Actual exported geometry clearance, long motion simulations, frame
rate/pause checks and browser desktop/mobile/night evidence. Independent
finish review and documentation. Preserve DESIGN.md and its sidecar.

Motion budget: six floor creatures share the existing geometry and materials;
four instanced draws cover their body, eyes and two legs. The rig change must
preserve every rest-pose triangle and the shared atlas. Test results and capture
evidence establish only their stated scope; physical Quest testing is separate.
No commit, publication or remote push in this pass.

## Implemented and locally reviewed

The user accepted the live colony: “Yeah I'm looking at it. I think it looks
great.” Six floor actors bring the total to nine fuzzballs and one mouse.
`src/floor-scurriers.js` owns independent seeded choices, 90 Hz integration,
0.1s delta cap, 1.35m/s speed cap, 3.2m/s² acceleration, 4.4m/s² braking and
7rad/s turns. Conservative footprints contain the actual exported adult shoes;
peer clearance and a traveller foot-space reserve avoid overlap without
snapping on seat transitions. The original mouse and three hoppers retain
their attention behavior.

`src/train-companions.js` poses distance-driven hip strides and aligns the
actual lowest posed foot vertex to the boards. The builder splits existing
legs into `FuzzLeftLeg` and `FuzzRightLeg` under `FuzzBody`, with unchanged
rest geometry and materials. The export is 3,820,316 bytes, 17,266 triangles,
ten primitives, two materials and one unchanged 1254 × 1254 atlas. Four
instanced floor draws bring the complete companion cost to 57,458 triangles
and 22 draw primitives before culling, not a measured device-performance claim.

All 94 tests and the production build pass in `floor-tests.log` and
`floor-build.log`, retaining the 732.63 kB chunk advisory. `floor-result.json`
passed without errors across eleven final captures; five replacements correct
empty initial framing. The fixed desktop sequence follows Pip listening,
scurrying and listening; mobile identifies Bramble. `floor-finish-review.md`
returned **ship**, reviewing all final images, source and supplied evidence
with no material fixes. The final right-seat floor capture supplies
`output/floor-scurriers.png`. The detector is empty and six shipping rasters
have complete provenance. Live user acceptance remains distinct from
subjective continuous-video validation or physical Quest stereo, comfort and
sustained performance, which remain unverified. Work remains local and
unpublished; both design files and historical previews are preserved.
