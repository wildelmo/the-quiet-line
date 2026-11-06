# The Quiet Line

A tiny station on a grassy shore in an immense painted summer sea. Board a waiting carriage, choose a window seat and travel across the water as one slow day passes: afternoon, golden sunset, blue dusk, lanterns and stars, then morning again. A static WebXR experience for Meta Quest, with an interactive desktop and mobile preview.

**[Published site](https://wildelmo.github.io/the-quiet-line/)** · [Build and deployment](https://github.com/wildelmo/the-quiet-line/actions/workflows/pages.yml)

The first rideable carriage is implemented and verified locally. Its fresh visual finish review returned **ship** for the carriage/window-seat milestone. The screenshots below show this milestone. Successful pushes to `main` test, build and deploy the updated experience through GitHub Pages.

![The current local build: a fixed station and waiting carriage above the sea](output/quiet-line-preview.png)

![Inside the carriage, looking through the framed windows](output/train-window-seat.png)

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
| Choose the left window seat, then alternate sides | Seat button or V |
| Return to the station and restore the train to its berth | Return to station or R |
| Let the day pass, or hold morning, noon, golden hour, dusk or starlight | Settings or T |
| Mute sound | Sound button or M |
| Open settings; close them | H; Escape |

Boarding, changing seats and returning use a brief fade. Choosing a seat pauses travel; **Continue journey** resumes it. The train eases toward 3 m/s, slows near the end of its 1.1 km route, and stops at **Journey complete**. Pause stops it immediately. The station and landscape stay fixed. Returning restores the original berth and platform viewpoint. There is no free-water teleport or observation deck.

```sh
npm test
npm run build
npm run preview
```

`dist/` is the complete deployable site. Relative asset URLs support the GitHub Pages project subdirectory. Public source repository: [wildelmo/the-quiet-line](https://github.com/wildelmo/the-quiet-line). There is no backend, analytics or account requirement.

## Automatic deployment

The `pages.yml` GitHub Actions workflow runs tests and builds on pushes and pull requests to `main`. Successful pushes to `main` deploy `dist/` to GitHub Pages over HTTPS. Pull requests only test and build. The workflow can also run manually from Actions. Official GitHub actions are pinned to release commits, and only the deploy job receives Pages write permission. The current carriage work has not been published in this implementation pass.

## Quest launch and controls

For a deployed version, open **https://wildelmo.github.io/the-quiet-line/** in Meta Quest Browser and select **Step inside in VR**. Allow the browser's immersive session prompt. All runtime assets and sounds are local; the loaded experience makes no third-party asset requests.

For local headset development, use Meta's USB/ADB port forwarding (`adb reverse tcp:5173 tcp:5173`) and visit `http://localhost:5173` in the headset. This requires a configured developer headset and USB debugging authorization. A plain LAN URL supports the flat preview but is not a secure context for immersive WebXR; a trusted HTTPS development host is another option.

Official references: [Meta WebXR overview](https://developers.meta.com/vr/documentation/web/webxr-overview/), [WebXR secure contexts](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Permissions_and_security), [Three.js WebXR manager](https://threejs.org/docs/pages/WebXRManager).

- Start at the fixed raised station. Boarding and seat placement preserve real tracked head height; look, lean and move naturally within your physical space. The ride adds no camera bobbing, roll or automatic orbit.
- Point either controller at the brass ticket and pull the trigger to board, depart, pause or continue, choose a window seat, turn the hour, mute or return. These use the same ride actions as the screen controls. Squeeze either grip to recall the ticket in front of you.
- Right thumbstick left/right turns by 30 degrees, once per deflection. No left-stick travel or water-target teleport is wired.
- **Exit experience** at the bottom of the ticket ends the immersive session, stops rendering, closes the audio context and attempts to close the tab. The flat page, loading screen and graphics-error screen also have an exit. If the browser refuses to close a user-opened tab, the app navigates to `about:blank`; a stalled or rejected XR shutdown cannot block leaving. See [MDN's window.close documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/close).

The desktop preview uses authored standing and seated eye heights. A real XR session retains the visitor's tracked height instead. Headset input, perceived scale and comfort still require physical-device validation.

## What is built

The visual authority is `Dreamy Ocean Sky Storyboard.png`, refined by the user's direction for fewer clouds and dominant bright, deep blue. Four sparse painted banks sit in a procedural blue sky. Two locally shipped 1536 × 1024 transparent paintings supply their feathered ivory brushwork and pale-blue/mint washes. The older panoramas and nine procedural cloud sprites are retired. Water samples the same sky and adds low-amplitude ripples, glints and shallow-water caustics. Real submerged rails, the fixed station and shoreline, islands and the carriage give the world scale.

### One rideable carriage

The original Blender model has a cream-and-maroon exterior, rounded roof, real window openings, dark substantial frames, red bench upholstery, hanging straps, floorboards, sliding boarding doors and warm interior lamps. `assets/train/carriage.blend` is the editable source; `scripts/build-train.py` rebuilds it and `public/assets/train/carriage.glb`. `src/train.js` loads the GLB; `src/travel.js` owns the ride states and placements. See [the train asset guide](assets/train/README.md) for the rebuild command, coordinates and provenance.

The GLB is 3,941,940 bytes, with 42,580 triangles, seven mesh primitives and five materials. Its one embedded 1254 × 1254 painted atlas costs about 8 MiB when decoded as RGBA8 with mipmaps. These are construction figures: transparent double-sided glass can add a render pass, and seven primitives do not promise seven actual draw calls or any headset frame rate.

### The passing day and small lives

`src/daylight.js` keeps one clock-hour for sky, water, fog, lighting, lanterns, stars, sun and moon. The world starts at the visitor's local time. Daylight hours last about a minute each and night hours pass faster; the settings, T key and ticket can hold any moment still. Reduced motion holds the daylight clock and cloud drift.

At the station, a ginger cat sleeps on the bench and briefly notices the far train whistle. A sea-glass passenger in a folded leaf cap arrives beside the suitcase, watches the dragon and leaves quietly. Lanterns, a pinwheel, streamers and butterflies bring the platform to life. Petals follow the visitor outdoors and are hidden inside the carriage. Fireflies and soft sea-lights appear after dark.

A distant four-car train and little floatplane pass periodically. Far rain and a slow cloud shadow share a breeze with the station and cottage island. A pearl-and-jade procedural dragon skims a painted veil, climbs through a vertical loop and banks into a dive. The user criticized the dragon's smooth procedural appearance; this carriage milestone does not replace it, and an earlier visual-review verdict does not establish user acceptance.

A fixed grassy island beside the route carries a cream cottage, terracotta roof, trees, bench and laundry. The moving carriage passes it while the station stays at home. Its windows warm at dusk. Audio is synthesized on-device: water, wind, bells, sparse music-box notes, birds, crickets, an evening pad, the far train whistle, plane hum and travel pulses. Sound begins only after interaction; mute and volume remain available.

Reduced motion also suppresses weather events, holds the passenger at rest, freezes the dragon's local pose and the island's moving details, and makes door placement immediate. Some existing birds, bell, distant train and plane animation continues; it is not a total world-motion pause. Hidden flat-screen pages pause rendering and world updates. Document and XR visibility loss pause the journey.

Geometry is instanced or merged where appropriate. There are no shadow maps, bloom passes or reflection render targets. Balanced desktop settings cap pixel ratio at 1.5; XR uses framebuffer scale 1 and requested foveation 1. `window.quietLine.diagnostics` exposes sampled render counts, position, train state, route distance, station anchor, session and atmosphere state. These samples are not sustained performance measurements.

## Verification and remaining checks

All 47 automated tests and the production build pass. Tests cover ride placement and state, route progress, head-tracking math, asset structure, and existing world behavior. Independent Chrome desktop and 390px mobile touch checks passed boarding, both seats, departure, pause/continue, return, rapid placement clicks, keyboard controls, sound and time settings, with no reported runtime, shader or network errors. Asset checks confirm actual window/floor geometry and exported counts. Current evidence is in `.impeccable/review/train-verify-result.json` and `train-*.png`; that review directory is local and ignored by Git.

The fresh review in `.impeccable/review/train-finish-review.md` returned **ship**, with no material fixes across 13 required actual-browser captures. It covers the first carriage/window-seat milestone: visible geometry, materials, framing, daylight/night and mobile readability. The sloped cab was additionally inspected in Blender, which is secondary evidence. This verdict does not renew approval of the dragon. The detector reports six advisories in `.impeccable/review/train-detect.json`: existing palette/type documentation drift plus a local shoreline material color. The established UI palette, typography and token schema were preserved.

No physical Quest headset was tested. Stereo appearance, controller mappings, room-scale scale/comfort, audio balance and sustained headset frame time remain unverified. On the first headset run, inspect the carriage from both seats, recall and use the ticket, test each controller, board, depart, pause, switch seats and return. Measure frame time with device developer tools using balanced detail first. Captures and synthetic XR tests do not establish continuous-motion comfort.

Asset provenance is in [ASSETS.md](ASSETS.md). The five-raster provenance scan found no missing records; exact generated-image prompts are adjacent to their PNGs and embedded in metadata. Historical work and review limits are recorded in [WORKFLOW.md](WORKFLOW.md).
