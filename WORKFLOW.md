# A little more wonder

## Current milestone: quieter train audio — implemented

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
earlier carriage milestone, not the current controls verification above.

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
