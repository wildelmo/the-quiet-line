# The Quiet Line

A tiny station on a grassy shore in an immense painted summer sea. Board a waiting carriage, choose a window seat and travel across the water as one slow day passes: afternoon, golden sunset, blue dusk, lanterns and stars, then morning again. A static WebXR experience for Meta Quest, with an interactive desktop and mobile preview.

**[Published site](https://wildelmo.github.io/the-quiet-line/)** · [Build and deployment](https://github.com/wildelmo/the-quiet-line/actions/workflows/pages.yml)

This release adds compact controls and quieter train audio to the rideable carriage introduced in commit `7c04a1f`. Functional checks pass; the visual finish review returned **ship** for the controls refinement. Deployment status is available in the workflow linked above.

![A fixed station and waiting carriage above the sea](output/quiet-line-preview.png)

![The local carriage view with only Journey and Menu controls](output/train-window-seat.png)

![The compact menu, opened when needed](output/controls-menu-preview.png)

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the printed local address, currently `http://127.0.0.1:5173`, and select **Explore on this screen**. Drag to look; arrow keys also turn the camera. The controls work by mouse, keyboard or touch:

| Action | Control |
| --- | --- |
| Board, then depart; pause or continue while aboard | Journey button or Space |
| Choose the left window seat, then alternate sides | Menu → Choose window seat, or V |
| Return to the station and restore the train to its berth | Menu → Return to station, or R |
| Let the day pass, or choose a named time | Menu → Time of day; T cycles times |
| Mute sound | Menu → Sound, or M |
| Open or close the menu | Menu button, H or Escape |

Only the journey button and **Menu** remain visible at the lower right during screen exploration. The menu opens above them with seats, return, named time choices and sound; **More options & controls** reveals volume, detail, quiet water, help and the welcome-screen action. **Exit experience** is in the menu. The Close button, H, Escape or a click on the world dismisses it; keyboard closing returns focus to Menu. Opening the menu and changing time or sound preserve the journey and view. Travel actions close it. Notices disappear after 3.2 seconds.

Boarding, changing seats and returning use a brief fade. Choosing a seat pauses travel; **Continue journey** resumes it. The train eases toward 3 m/s, slows near the end of its 1.1 km route, and stops at **Journey complete**. Pause stops it immediately. The station and landscape stay fixed. Returning restores the original berth and platform viewpoint. There is no free-water teleport or observation deck.

```sh
npm test
npm run build
npm run preview
```

`dist/` is the complete deployable site. Relative asset URLs support the GitHub Pages project subdirectory. Public source repository: [wildelmo/the-quiet-line](https://github.com/wildelmo/the-quiet-line). There is no backend, analytics or account requirement.

## Automatic deployment

The `pages.yml` GitHub Actions workflow runs tests and builds on pushes and pull requests to `main`. Successful pushes to `main` deploy `dist/` to GitHub Pages over HTTPS. Pull requests only test and build. The workflow can also run manually from Actions. Official GitHub actions are pinned to release commits, and only the deploy job receives Pages write permission.

## Quest launch and controls

For a deployed version, open **https://wildelmo.github.io/the-quiet-line/** in Meta Quest Browser and select **Step inside in VR**. Allow the browser's immersive session prompt. All runtime assets and sounds are local; the loaded experience makes no third-party asset requests.

For local headset development, use Meta's USB/ADB port forwarding (`adb reverse tcp:5173 tcp:5173`) and visit `http://localhost:5173` in the headset. This requires a configured developer headset and USB debugging authorization. A plain LAN URL supports the flat preview but is not a secure context for immersive WebXR; a trusted HTTPS development host is another option.

Official references: [Meta WebXR overview](https://developers.meta.com/vr/documentation/web/webxr-overview/), [WebXR secure contexts](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Permissions_and_security), [Three.js WebXR manager](https://threejs.org/docs/pages/WebXRManager).

- Start at the fixed raised station. Boarding and seat placement preserve real tracked head height; look, lean and move naturally within your physical space. The ride adds no camera bobbing, roll or automatic orbit.
- The compact VR menu starts closed. Squeeze either grip to open or close it, then point and pull the trigger to choose. It offers the same ride actions as the screen controls, sound, return and exit. **Time of day** opens six named choices with **Back to journey**; **Close** dismisses either page.
- The menu appears only when requested, 0.9m ahead and 0.22m below your actual head, without a floor-height clamp. It does not reopen after boarding or seat changes. Travel actions, snap turns and XR visibility loss close it. Opening it or choosing time/sound preserves journey progress and gaze.
- Right thumbstick left/right turns by 30 degrees, once per deflection. No left-stick travel or water-target teleport is wired.
- **Exit experience** in the VR menu ends the immersive session, stops rendering, closes the audio context and attempts to close the tab. Screen exploration keeps Exit in its menu; the welcome header, loading screen and graphics-error screen also have an exit. If the browser refuses to close a user-opened tab, the app navigates to `about:blank`; a stalled or rejected XR shutdown cannot block leaving. See [MDN's window.close documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/close).

The desktop preview uses authored standing and seated eye heights. A real XR session retains the visitor's tracked height instead. Headset input, perceived scale and comfort still require physical-device validation.

## What is built

The visual authority is `Dreamy Ocean Sky Storyboard.png`, refined by the user's direction for fewer clouds and dominant bright, deep blue. Four sparse painted banks sit in a procedural blue sky. Two locally shipped 1536 × 1024 transparent paintings supply their feathered ivory brushwork and pale-blue/mint washes. The older panoramas and nine procedural cloud sprites are retired. Water samples the same sky and adds low-amplitude ripples, glints and shallow-water caustics. Real submerged rails, the fixed station and shoreline, islands and the carriage give the world scale.

### One rideable carriage

The original Blender model has a cream-and-maroon exterior, rounded roof, real window openings, dark substantial frames, red bench upholstery, hanging straps, floorboards, sliding boarding doors and warm interior lamps. `assets/train/carriage.blend` is the editable source; `scripts/build-train.py` rebuilds it and `public/assets/train/carriage.glb`. `src/train.js` loads the GLB; `src/travel.js` owns the ride states and placements. See [the train asset guide](assets/train/README.md) for the rebuild command, coordinates and provenance.

The GLB is 3,941,940 bytes, with 42,580 triangles, seven mesh primitives and five materials. Its one embedded 1254 × 1254 painted atlas costs about 8 MiB when decoded as RGBA8 with mipmaps. These are construction figures: transparent double-sided glass can add a render pass, and seven primitives do not promise seven actual draw calls or any headset frame rate.

### The passing day and small lives

`src/daylight.js` keeps one clock-hour for sky, water, fog, lighting, lanterns, stars, sun and moon. The world starts at the visitor's local time. Daylight hours last about a minute each and night hours pass faster; the menu, T key and VR time choices can hold any moment still. Reduced motion holds the daylight clock and cloud drift.

At the station, a ginger cat sleeps on the bench and briefly notices the far train whistle. A sea-glass passenger in a folded leaf cap arrives beside the suitcase, watches the dragon and leaves quietly. Lanterns, a pinwheel, streamers and butterflies bring the platform to life. Petals follow the visitor outdoors and are hidden inside the carriage. Fireflies and soft sea-lights appear after dark.

A distant four-car train and little floatplane pass periodically. Far rain and a slow cloud shadow share a breeze with the station and cottage island. A pearl-and-jade procedural dragon skims a painted veil, climbs through a vertical loop and banks into a dive. The user criticized the dragon's smooth procedural appearance; this carriage milestone does not replace it, and an earlier visual-review verdict does not establish user acceptance.

A fixed grassy island beside the route carries a cream cottage, terracotta roof, trees, bench and laundry. The moving carriage passes it while the station stays at home. Its windows warm at dusk. Audio is synthesized on-device: water, wind, bells, sparse music-box notes, birds, crickets, an evening pad, the far train whistle and plane hum remain. The default volume is now 35%. Low filtered rolling noise and soft, rounded paired track contacts replace the former repeated travel chimes. Contact groups follow distance about every 6m, so they slow with the train; soft attack/release avoids abrupt starts and settles the train layer to silence when paused. Sound begins only after interaction; mute and volume remain available.

The first audio pass sounded like a constant whoosh to the user. The revision reduces the continuous rolling bed, gives each paired contact a short, rounded low-mid tap, and softens water and wind inside the carriage. Following feedback about a low screech, the latest tuning removes sustained and sliding train tones and raises the bumps about 3dB. The default volume remains 35%.

[Listen to the revised 12-second soft knocks](output/train-track-soft-knocks.wav), or the [36-second journey sample](output/quiet-train-preview.wav) with acceleration, slowing, pause and resume. Both use the actual default gain without normalization and contain the train layer only. The latest tuning is retained for this release; actual Quest listening remains unverified.

Reduced motion also suppresses weather events, holds the passenger at rest, freezes the dragon's local pose and the island's moving details, and makes door placement immediate. Some existing birds, bell, distant train and plane animation continues; it is not a total world-motion pause. Hidden flat-screen pages pause rendering and world updates. Document and XR visibility loss pause the journey.

Geometry is instanced or merged where appropriate. There are no shadow maps, bloom passes or reflection render targets. Balanced desktop settings cap pixel ratio at 1.5; XR uses framebuffer scale 1 and requested foveation 1. `window.quietLine.diagnostics` exposes sampled render counts, position, train state, route distance, station anchor, session and atmosphere state. These samples are not sustained performance measurements.

## Verification and remaining checks

All 66 automated tests and the production build pass. Current desktop (1440px), mobile touch (390px) and narrow reduced-motion (320px) browser checks passed menu dismissal, focus, boarding, both seats, departure/pause, named time selection, return and exit, with no reported errors. Opening the menu and changing time or sound preserve journey progress and gaze. Evidence is in `.impeccable/review/controls-result.json` and ten fresh `controls-*.png` captures; that review directory is local and ignored by Git.

Audio checks rendered the production train layer through Web Audio's `OfflineAudioContext` and exercised actual browser volume, mute, departure and pause; `.impeccable/review/audio-result.json` passed with no reported errors. The rendered stationary and settled paused sections were silent. Signal measurements do not establish physical headphone loudness or listening approval.

The fresh review in `.impeccable/review/controls-finish-review.md` returned **ship** for the compact-controls refinement, with all ten captures valid and no material fixes. Its projected VR captures use the production menu meshes in a monoscopic browser inspection scene; they establish layout only, not actual headset or controller behavior. The prior carriage review in `.impeccable/review/train-finish-review.md` returned **ship** for that milestone. Neither pass renews approval of the dragon. `.impeccable/review/controls-detect.json` reports 12 advisory findings, including inherited palette/type documentation drift and false positives for the CSS `#fade` selector and computed HTML black. Existing palette and font choices remain unchanged.

No physical Quest headset was tested. Stereo appearance, controller mappings, room-scale scale/comfort, audio balance and sustained headset frame time remain unverified. On the first headset run, inspect the carriage from both seats, open and close the compact menu, test each controller, board, depart, pause, switch seats and return. Measure frame time with device developer tools using balanced detail first. Captures and synthetic XR tests do not establish continuous-motion comfort.

Asset provenance is in [ASSETS.md](ASSETS.md). This controls pass adds no raster assets. The five-raster provenance scan found no missing records; exact generated-image prompts are adjacent to their PNGs and embedded in metadata. Historical work and review limits are recorded in [WORKFLOW.md](WORKFLOW.md).
