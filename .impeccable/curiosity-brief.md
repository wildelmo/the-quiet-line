# Quiet encounters

Mode: Experience. Extend the approved painted companions inside the existing
carriage. The user accepted a curious approach, brief mutual look and shy
retreat, with the mouse mostly watching the sea. Preserve the approved models,
solid pigment, silent behavior and high hops.

THESIS: Small creatures notice the traveller, then return to their own lives.
OWN-WORLD: Inherit the charcoal silhouettes, white eyes, painted mouse, warm
wood, red cushions and blue sea. No new visual system or asset generation.
STORY: Sustained looking invites one creature's attention. It pauses, takes
tentative hops closer within its support, meets the traveller's gaze, retreats,
peeks back and resumes its quiet routine. Other creatures continue their lives.
FIRST VIEWPORT: The mouse mostly faces the window, shifting its posture and
watching the sea. Fuzzballs sometimes look outside between games. Encounters
are discovered by looking around from the normal boarding and seat positions.
FORM: Local, bounded attention controller using the actual browser/XR head
position and facing direction, not eye tracking. Distinct curious, dreamy and
shy temperaments; dwell, a shared attention limit and cooldowns prevent repeat
startles. Smooth turns and closed support routes; no camera movement or audio.
FINISH: Meaningful behavioral and geometry tests, actual-browser desktop/mobile
encounter evidence, an independent finish review and updated documentation.
Preserve DESIGN.md and its sidecar. No publication or commit in this pass.

Disable new encounters at the station, during seat transitions, with menus
open or under reduced motion. Existing encounters finish safely when attention
is lost. Treat skipped/hidden time without a queued burst of reactions. Respect
the mouse, passenger, window and seat clearances and carriage-local travel.

## Implemented contract

`src/companion-attention.js` receives the actual camera/XR head position and
direction through the existing world/train pipeline, converted into carriage
coordinates. One actor, including the mouse, can engage after a 2.2-second
settling period and a sustained look (0.65 seconds; 1.2 for the forward friend).
A fuzzball's 10.7-second encounter includes noticing, two approach hops,
1.4 seconds of shared looking, two quicker retreat hops, a peek and two hops
home. The mouse offers a 5.4-second glance. A shared 24-second cooldown follows
either encounter. Fuzzball ambient clocks freeze and resume at the same ground
pose; rendered time is bounded and invalid input cannot queue reactions.

The mouse rests at (1.215, 1.985, 0.45), mostly facing the sea at yaw 1.42, with
small body shifts and head scans. Existing sculptures and exact export metadata
remain unchanged. The existing `atmosphere.companions.attention` diagnostic
reports engaged actor, phase and age. No instruction overlay or reticle is added.

## Verification

All 89 tests and the production build pass; the existing chunk-size advisory
remains. Logs: `.impeccable/review/curiosity-tests.log` and `curiosity-build.log`.
Final browser QA in `curiosity-result.json` passed without reported errors,
with 15 captures covering ambient viewing, the complete window encounter,
mouse glance, both bench friends, night, 390px mobile and reduced motion.
`output/curious-companions.png` preserves the final shared-gaze frame. The fresh
`curiosity-finish-review.md` returned **ship**, opening all 15 captures and finding
no material fixes. Its scope is captured states and supplied behavioral/geometry
evidence. The detector retains only two inherited
color advisories; all six shipping rasters have provenance and no asset changed.
Held browser poses and numerical continuity checks do not establish subjective
continuous-motion approval or the user's judgment of the mouse's liveliness;
no physical Quest test has been performed.
This feature and the preceding spirit/companion work remain local, uncommitted
and unpublished on `codex/newspaper-spirit`. Design-system files are preserved.
