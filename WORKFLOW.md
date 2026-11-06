# A little more wonder

## Current milestone: one rideable carriage — complete locally

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
updated. Local preview is `http://127.0.0.1:5173`; the published site was not
updated in this pass.

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
