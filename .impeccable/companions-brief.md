# Little window companions

Mode: Experience. The user approved solid painted bodies, silent behavior and
companions that mostly entertain each other. Add a plump mouse and three
scattered charcoal fuzzballs with prominent white eyes. Fuzzballs make small
bursts of travelling hops, rising two to three times their own body height.

## Direction contract

THESIS: Tiny companions share their own private games aboard the quiet train.
The mouse's patient attention gives the fuzzballs' little leaps a relationship.

OWN-WORLD: Inherit painted wood, red benches, matte sculpted characters and
blue ocean. The mouse has a soft taupe pear shape, rose ears, paws and a curled
tail; charcoal tufts frame the fuzzballs' white eyes. These creatures are solid.

STORY: From a seat, notice a mouse watching its small friend pop up on a window
perch. Two other fuzzballs play short hopping games along empty bench cushions.
Silent pauses separate each burst; the mouse watches its companion and blinks.

FIRST VIEWPORT: One shallow wooden perch above the right bench back near the
visitor seats holds the mouse and its friend. Two fuzzballs occupy separated
empty stretches of the left bench. Keep the door, visitor seats and aisle open.

FORM: Local 3D addition to the approved carriage. Original editable Blender
models reuse the existing painted atlas. Three instances share fuzz geometry.
Authored, closed hopping routes keep feet on their supports, with crouch,
stretch and landing squash; reduced motion holds a resting arrangement.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance. Preserve the existing design-system files for this local extension.

## Verification and scope

No new controls, sound or forced camera movement. Five adult spirits retain
their approved 70% opacity; the mouse, fuzzballs and perch are opaque. Verify
actual asset sizes, 2–3-body-height hop peaks, closed routes without snaps,
support/seat/wall clearance, carriage travel and reduced motion. Review the
mouse and hopping poses in normal seat views, boarding, mobile and night.
No commit or publication is part of this implementation pass.

## Implemented surface

The original Blender source and runtime GLB contain a 23.13cm mouse, a 9.144cm
base fuzzball and one 1.24m × 0.24m wooden perch. The mouse is at carriage-local
(1.24, 1.985, 0.45), the perch at (1.24, 1.985, 0.75), and the window friend
rests at (1.23, 1.985, 0.86). Fuzz scales 1, 0.94 and 1.06 share geometry;
the two bench friends rest at left z=-4.12 and z=3.32. Closed three-hop routes
run twice per 43-, 47- and 53-second cycle. Peak lift is 2.25, 2.65 and 2.9
times each scaled body height; more than 75% of each cycle is resting.

The GLB has 17,266 triangles, eight primitives, two opaque materials, one
unchanged embedded reader atlas and 3,818,956 bytes. Runtime clones the body
material as opaque while sharing the reader's actual map; the adult material
stays unchanged. White eyeballs and dark pupils use one untextured matte
material. The full mouse/three-fuzz/perch addition is 27,314 triangles and 12
primitives before culling. No new raster or image generation was used; the
user's `Untitled.png` reference is guidance only and is not shipped.

The first visual round caught night fill washing charcoal pale. Ambient fill
now respects vertex pigment on both companion materials. All 85 tests and
the production build pass, with the existing large-chunk warning. Final
browser QA passed without reported errors and retains 14 current captures in
`companions-result.json`: boarding, both seats, mouse/hop poses, both bench
friends, night, 390px mobile and reduced motion. Loading and
departure/pause/return passed. The independent `companions-finish-review.md`
returned **ship** for this local extension, opening all 14 captures and finding
no material fixes. Physical Quest stereo, subjective continuous-motion comfort
and sustained performance remain unmeasured. The existing
`DESIGN.md` and `.impeccable/design.json` remain byte-for-byte unchanged.
