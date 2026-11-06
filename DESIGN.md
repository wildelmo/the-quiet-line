---
name: The Quiet Line
description: A tiny station in a vast painted summer ocean.
colors:
  sky: "#087eaf"
  sea: "#145970"
  ink: "#173e4b"
  paper: "#fff9e8"
  focus: "#edbc65"
  primary-hover: "#f4dcaa"
  enamel-panel: "#123f50ed"
  enamel-active: "#2d6677"
  setting-divider: "#c9d1c9"
  field-border: "#809b9e"
  secondary-ink: "#3a606b"
  loading-mist: "#dcebf0"
  weathered-timber: "#b9a585"
  station-enamel: "#42706e"
  station-brass: "#9a875d"
  rail-metal: "#8b9f99"
  distance-mist: "#a6d4dd"
typography:
  display:
    fontFamily: "QuietStory, Georgia, serif"
    fontSize: "clamp(42px, 5.3vw, 80px)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-.035em"
  title:
    fontFamily: "QuietStory, Georgia, serif"
    fontSize: "34px"
    fontWeight: 400
  body:
    fontFamily: "'Segoe UI', sans-serif"
    fontSize: "16px"
    lineHeight: 1.65
  panel-body:
    fontFamily: "'Segoe UI', sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
  label:
    fontFamily: "'Segoe UI', sans-serif"
    fontSize: "13px"
  action:
    fontFamily: "'Segoe UI', sans-serif"
    fontWeight: 600
rounded:
  field: "3px"
  action: "4px"
  panel: "5px"
  toolbar: "6px"
  circle: "50%"
spacing:
  toolbar-inset: "5px"
  action-gap: "12px"
  setting-gap: "16px"
  mobile-edge: "20px"
  panel-padding: "26px 28px"
components:
  button-primary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-text:
    backgroundColor: "transparent"
    padding: "12px 0"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    width: "44px"
    height: "44px"
  button-icon-hover:
    backgroundColor: "{colors.primary-hover}"
  toolbar:
    backgroundColor: "{colors.enamel-panel}"
    rounded: "{rounded.toolbar}"
    padding: "{spacing.toolbar-inset}"
  toolbar-action:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.field}"
    typography: "{typography.label}"
    padding: "12px 16px"
  toolbar-action-active:
    backgroundColor: "{colors.enamel-active}"
  settings-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "18px 22px 12px"
    width: "336px"
  select:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.field}"
    padding: "7px"
---

# Design System: The Quiet Line

## Overview

**Creative North Star: "A tiny station in a vast painted ocean, where one slow day passes"**

The supplied ocean storyboard is the visual authority, refined by the user's explicit direction: fewer clouds, with bright, deep blue sky dominant. Deliberately spaced ivory cloud banks with feathery edges and pale-blue/mint washes, reflected sky, and submerged rails make the world feel expansive. The little station supplies human scale without enclosing the view. The interface is sparse and welcoming, with illustrated-story lettering and small practical controls.

The feeling to protect is the quiet of a hand-painted animated film: stillness that is never empty. The wind is visible in streamers, a pinwheel, petals and a bell. Small lives respond to one another: a cat notices the distant train, a sea-glass passenger watches the dragon, and the dragon skims a painted veil before rising into a broad vertical loop. A cottage island stays beside the railway as the carriage passes; the shoreline station remains fixed. Far rain and a passing cloud shadow suggest weather beyond the station. Light is the main event. The painted noon slowly becomes a golden sunset, a blue dusk with lanterns, a starlit night, and a pale morning, and the sea reflects all of it.

The environment fills the viewport. Nearby structures are real geometry; the painted sky is the distant backdrop. The welcome overlay recedes when exploration begins, and immersive sessions use a compact menu opened only on request inside the world. Movement begins only through an explicit action; the horizon remains stable during travel.

**Key Characteristics:**
- A huge bright-blue space with a clear, distant horizon and generous cloud-free sky.
- Sparse, softly feathered painted cloud banks reflected in translucent, gently animated water.
- Warm paper, weathered timber, and subdued enamel at human scale.
- Literary display type paired with quiet, legible controls.
- Sparse screen overlays and native in-world controls for immersion.

## Colors

Bright sky and turquoise water own the image; warm paper and dark sea-blue give the interface contrast without overpowering the scene. Frontmatter values describe implemented UI colors and material base colors, not sampled colors from the painted cloud assets or final shaded pixels.

### Primary
- **Summer Sky** (`sky`) is the page background behind the canvas. The world uses a procedural blue wash that deepens toward the zenith, with transparent cloud paintings supplying the ivory, pale-blue and mint brushwork. The sky's rendered blue is not a single flat token.
- **Deep Sea** (`sea`) accents native form controls and the recovery action.
- **Enamel Panel / Enamel Active** provide the translucent exploration toolbar and its hovered or pressed controls.

### Secondary
- **Weathered Timber**, **Station Enamel**, **Station Brass**, and **Rail Metal** remain the world-material palette for the station, railway, signal posts, and distant structures. The rebuilt station has a warmer local palette, described under Storybook station below. Their rendered appearance changes under the scene lighting.
- **Amber Focus** marks keyboard focus and text selection. **Primary Hover** gently warms the paper action on hover.

### Neutral
- **Warm Paper** is the welcome lettering, primary action surface, and settings panel.
- **Sea Ink** is dark text on paper. **Secondary Ink** softens explanatory settings text.
- **Setting Divider** and **Field Border** organize the settings controls with restrained strokes.
- **Loading Mist** covers loading and recovery screens. **Distance Mist** is the atmospheric scene fog.

**The Open Blue Rule.** Keep bright, deep blue sky and water dominant. Use fewer, deliberately placed clouds with broad clear intervals; interface surfaces stay compact.

### The passing day

`src/daylight.js` derives every light value from one clock-hour, which begins at the visitor's local time. Day hours pass at about (62s) each and night hours at about (28s), so an afternoon arrival sees sunset in roughly four minutes and a whole cycle in under twenty. Golden hour multiplies the painted sky by a cool violet (`#c7a8f5`-like factor) and gathers a peach band (`#ffad66`) around the sun with mauve (`#e6a3b8`) opposite; clouds take gold (`#ffe099` tint) on their sunward side and mauve shadows. Night turns open sky to indigo (`#050a1f` to `#17214d`), clouds to slate (`#1a2140` to `#4d5c85` toward the moon), adds stars and a moon. Fog moves from Distance Mist through `#efc19c` to `#1a2340`; hemisphere, sun and ground light colours follow. Lanterns, signal lamps, carriage lamps and the far house window glow with `lantern`, fireflies with `fireflies`, stars with `stars`. These are shader and light settings; perceived brightness and comfort in a headset remain unverified.

## Typography

The bundled `public/assets/story.woff2` is Alegreya Latin regular, exposed by CSS as **QuietStory**. Display and settings titles use `QuietStory, Georgia, serif`; the interface uses **Segoe UI** with a generic sans-serif fallback. Only the regular display face is bundled, and font synthesis is disabled.

The pairing reads like a quiet illustrated travel story with straightforward operating instructions. Welcome copy uses the display role with balanced wrapping. Settings titles use the title role; invitation prose uses body; settings prose uses panel-body; toolbar controls and utility labels use label. Action weight is reserved for primary and welcome actions.

On narrow screens, the display becomes (43px) with (1.02) line height and invitation prose becomes (14px). On short desktop screens, the display becomes (42px). In-world station signs deliberately use canvas-rendered Georgia, while the VR menu uses canvas-rendered sans-serif (27–44px depending on label role); these are separate world textures, not DOM font styles.

**The Quiet Lettering Rule.** Use the bundled regular story face for invitations and titles; use the interface sans-serif for actions and instructions.

## Layout

The app and canvas are fixed to all viewport edges with dynamic viewport height. There is no scrolling page or card grid. The desktop masthead uses (28px 40px) padding. The welcome overlay anchors to the bottom, pairing the invitation at left with a (292px) arrival block at right, separated by a (40px) gap. Its padding is (120px 5.5vw 7vh). A transparent-to-deep-blue gradient supports lettering over the sea.

At widths up to (650px), the masthead has (20px) padding and the welcome layout stacks vertically with (80px 26px 32px) padding. Arrival controls use the available width, capped at (330px), after a (28px) gap. The primary action minimum height changes from (58px) to (52px). At heights up to (590px) with widths from (651px), desktop welcome spacing and typography compress without changing the overall arrangement.

During exploration, only the journey action and Menu sit in an enamel dock at the lower right, inset at least (24px) on desktop and (16px) on mobile, respecting safe areas. The requested paper menu anchors above the dock, (66px) above its bottom inset. Its width is (336px), capped at viewport width minus (32px), with internal scrolling when height is constrained. Desktop panel padding is (18px 22px 12px); mobile padding is (16px 20px 10px), with narrower side padding below (350px). The dock stays available while the nonmodal menu is open.

Immersive WebXR hides the masthead, welcome, toolbar, and settings DOM overlays. The compact menu is world-space geometry, initially hidden and placed only when explicitly opened with either controller grip. It does not follow gaze continuously or reopen after seat placement. Maintain the distinction between flat-screen responsive layout and stereo, real-scale world layout.

## Elevation & Depth

Depth comes primarily from the world: converging submerged rails, real station geometry, shallow-water transparency, reflected clouds, low distant islands, and atmospheric fog. Water blends toward sky color at distance. Small props are rough and weathered; the railway metals have modest metalness. The station uses matte, lightly emissive materials with per-piece color variation to soften the lighting. The bell uses translucent glass-like material. The four backdrop cloud banks stay direction-based; a single local veil and a distant rain bank use world-space planes.

The station's shelter, bench, and selected plant pots sit over soft radial contact washes. These are transparent planes sharing one procedural texture, with depth writing disabled; they ground the objects without real-time shadow maps. They are fixed visual shading, not a dynamic lighting simulation or evidence of measured stereo performance.

The sky places `cloud-tower.png` and `cloud-veil.png` in four limited angular windows over a resolution-independent blue wash. Both paintings are (1536 × 1024) RGBA assets with real transparent margins. The latest reference-led repaint softens their silhouettes into feathery ivory edges and pale-blue/mint washes while retaining the four-bank composition and broad blue intervals. The limited sampling windows preserve brush detail without stretching one raster around the full sphere; “angular” describes placement, not the painted edge treatment. Sky and water sample the same painting and daylight recipe. Preserve mip filtering, explicit derivatives and faded patch edges. The old panoramas and nine procedural cloud sprites are retired. Cloud detail remains limited by the source images, and actual headset clarity is unverified.

DOM surfaces use soft, blue-tinted ambient shadows: primary action (`0 7px 24px #06334b25`), exploration toolbar (`0 6px 24px #08354a22`), and requested menu (`0 12px 40px #163d5240`). Text shadows support legibility over the image. The welcome gradient supplies contrast without an opaque content card.

Environmental motion stays unhurried: water shimmer, birds, a hanging wind bell, sparse cloud drift, petals, distant weather, the passenger's quiet visit, and the slow change of the light. The dragon's faster cloud skim, full vertical loop, banking dive and rising turn provide the user-requested aerial movement without moving the camera. Island tree crowns and laundry share the breeze. The loading indicator breathes over (1.8s); loading fades over (.8s), notices over (.3s) after a (3.2s) display, and the DOM travel fade over (.15s). Reduced-motion preference disables CSS animation/transitions, initializes quiet water, holds the daylight clock and cloud drift, disables rain/cloud-shadow/weather-gust events, keeps the passenger resting without arrival or departure, and freezes island crown and cloth motion. It holds the dragon's local pose while its region still eases along the route during travel. Existing birds, bell, train and plane animation can continue. Do not describe this as a total world-motion pause. While the flat-screen document is hidden, the frame callback skips world updates and rendering; immersive sessions retain their XR frame loop. Document and XR visibility loss pause the journey.

## Shapes

Physical forms retain human scale, with softened edges and small signs of wear. The station platform uses staggered board ends, rounded edges, and old nail heads. Its open-sided gabled shelter pairs braced posts with a gently curved roof profile, lifted eaves, overlapping rounded terracotta tiles, and cylindrical ridge caps. A slatted bench, luggage, rounded clay pots, and a watering can make it feel inhabited. These details stay clustered at the station, leaving the horizon and the view along the rails open. The screen UI uses lightly eased rectangles for actions, toolbar, and settings, and a rectangular Close icon inside the menu. Thin line icons have rounded caps and joins. Use the small radii in frontmatter rather than introducing oversized capsules or decorative containers.

## Components

### Storybook station

The small platform is a warm, worn place to arrive in the immense blue world. `src/station.js` builds its geometry and is integrated through `createStation(scene)` in `src/world.js`. The shelter stays open on all sides; cream braces and trim surround faded teal posts with small exposed-timber patches. The bench faces into the platform and carries a leather suitcase with straps, handle, and brass latch, plus a knotted cloth parcel. Three clay plant pots, leafy stems, small yellow flowers, and a teal watering can suggest everyday care.

The station's component-local material bases are warm timber (`#bc956c`), faded teal (`#527f77`), cream trim (`#e2d7b5`), terracotta tiles (`#ae634b`), dark worn details (`#574b3d`), brass accents (`#af8d4c`), clay pots (`#b66e51`), foliage (`#5d8050`), yellow flowers (`#e6bc68`), leather (`#9a6549`), and cloth (`#7b9993`). These extend the physical scene without changing the screen UI palette. A shared procedural grain texture provides long uneven strokes, pale washes, and knots; tinted pieces vary subtly in brightness. The main station materials use full roughness (1), vertex colors, and a small matching emissive contribution (.09), including the brass-colored accents.

The two station signs use cream canvas textures with pigment variation, green framing, Georgia lettering, and small fixing marks. Separate outward-facing planes keep the text readable from either direction. Geometry for stationary boards, tiles, foliage, and props is merged by material; sign faces/backings and contact-wash planes remain separate. These choices limit per-detail draw calls, but actual Quest frame rate and comfort still require hardware testing.

### Fixed station and rideable carriage

The station remains on a raised grassy shore while an original Blender-authored carriage carries the visitor. The cream/maroon body and rounded roof frame an interior of red bench upholstery, dark substantial timber frames, floorboards and hanging straps. Real window openings keep broad views of the sea and horizon. One original painted atlas supplies the enamel, timber and upholstery; preserve its material character without promoting these asset-local pigments into UI tokens.

Explicit boarding, seat selection and return use a fade. The 1.1km journey eases toward 3m/s and stops at its end; pause stops travel immediately. Choosing a seat pauses travel, and return restores the berth. The train, visitor rig and ticket translate together while the station and landscape remain fixed. The camera adds no bobbing or roll. Desktop seat framing uses an authored eye height; XR placement preserves real tracked height and gaze.

### Living details

**Station life.** A round ginger cat (`#d99a58`, pale `#f4e4c6`, stripes `#b9773a`) sleeps curled on the bench beside the suitcase. It breathes, occasionally twitches an ear or tail, and briefly turns its head and an ear when the far train is announced. Three paper lanterns (`#f6e4bd` with `#a84f3c` bands) hang under the eaves and glow `#ffb860` at dusk with one warm point light (intensity 7, distance 11). A pinwheel with red, yellow, teal and cream vanes stands by the marker post. Three cloth streamers (`#f3d9a4`, `#9ec8c1`, `#f1b7b0`) hang from the gable and are displaced per vertex by the shared breeze. Three pale butterflies loop at the flower pots.

**Near life.** (110) instanced petals (`#ffe3ea`) tumble on the breeze inside a (26m) box that wraps around the viewer outdoors; petals are hidden inside the carriage. After dark, (70) warm fireflies (`#ffd978`) drift about the platform and (48) blue sea-lights (`#8fd8ff`) hover over the water, additive and depth-write-free.

**Far life.** A four-car train (hull `#2b3a3a`, windows `#f4e2b6` with `#ffcf7a` emissive) crosses the sea (380m) ahead of the viewer over about two minutes, first after (75s) and then every four to five minutes. A cream and yellow floatplane (`#f1e3bf`, `#e8b84d`) crosses high and far a little later, propeller turning. Each arrival is announced with a quiet notice and a sound.

**The breeze.** `wind(time)` in `src/life.js` supplies the base breeze. `src/world.js` adds the weather's preceding gust once and shares the result with the pinwheel, streamers, bell and petals, so the whole station moves to the same air.

### Weather far away

`src/weather.js` stages a soft rain curtain under a painted shelf hundreds of meters away. Its eight-minute schedule also sends a broad, cool cloud shadow over water, station and the cottage island, with a gentle increase in the shared breeze before the shade arrives. One shader field controls their shading; there are no shadow maps or extra reflection passes. Rain and shade fade with daylight and are disabled under reduced motion. Their scale and timing should preserve blue openness and quiet discovery.

### A quiet passenger

The original tide passenger is a small sea-glass visitor beside the suitcase, with a folded leaf cap and a blank brass ticket. Its component-local palette is sea-glass (`#92bfb0`), pale cream (`#e6ebcb`), dark ink (`#244b4b`), leaf green (`#628b69`) and ticket brass (`#d5b371`). Matte procedural geometry and a little matching emission keep it within the station's painted material language; no external character model or rig is used.

`src/passenger.js` gives it a roughly (100s) visit in each (420s) cycle: it arrives after (38s), settles beside the luggage, looks toward the dragon and quietly departs. Its position belongs to the fixed shoreline station. Reduced motion keeps it resting on the bench without a timed visit or animated body pose.

### Sky dragon

The existing procedural dragon remains in the scene; the user criticized its smooth appearance, and the carriage milestone does not replace or reapprove it. A pearl-and-jade, wingless East Asian dragon adds a living silhouette above the ocean. The user's Haku reference informs its longer white muzzle, green almond eyes, tall lavender-lined ears, ivory branching antlers and fuller teal mane. Long whiskers, four clawed feet and a continuous tapering body remain readable from multiple viewpoints. Broad, cupped fur locks sweep backward from the cheeks and along the spine. It is real world-space geometry, separate from the painted clouds, and stays in the journey's region without following the viewer's gaze.

The component-local palette uses pearl (`#edf5f0`), jade (`#51a99b`), deep teal (`#35796f`), warm antler ivory (`#c5ba91`), eye green (`#84af65`), dark ink (`#203a42`), lavender ear lining (`#cbb7c9`) and pale highlights (`#f8faf1`). Vertex colors keep the body pale, with a cool belly, cream flanks and a pearl-green back. Fully rough materials and a small emissive contribution retain the painted character; the dragon adds no image textures, transparent fur cards, shadow maps, or extra render passes.

`src/dragon-flight.js` defines an approximately (1,038m) route through a cloud skim, full vertical loop, banking dive and rising turn. Arc-length sampling keeps the (58m) body following the head at a consistent distance; transported orientation frames preserve continuity through vertical flight and the repeat seam. The route speed varies gently from (6.75m/s) to (7.65m/s), averaging (7.2m/s), for a circuit of about (144s). These are authored route values; numerical tests and captured poses do not establish continuous-motion quality or headset comfort.

`src/dragon.js` deforms the continuous body along that route with a traveling undulation. Head and foot details are merged by pigment, and (64) instances of paired broad fur locks follow the spine. Whiskers, mane and feet move with the flight. Reduced motion fixes the local route position and articulated pose at time zero while the root still eases along the travel region; explicit visitor placements do not instantly snap it to the new region. The implementation totals (22) mesh objects and (47,072) triangles including instances, which is a geometry count rather than a measured Quest performance result.

`src/cloud-dancer.js` places one depth-tested painted veil across that route at local center (74m, 34m, −80m). The opaque dragon writes depth before the veil, so nearer paint can cover its silhouette. An elliptical mist field softly blends the dragon toward cloud pigment as its body crosses the cloud. The veil and mist region move with the dragon's travel region; they do not follow the viewer's gaze. This is a local painted plane and shader treatment, not a volumetric cloud simulation.

### The passing island

`src/island.js` builds a low grassy shore with a cream cottage, tiled clay gable roof, two chimneys, three wind-shaped trees, a bench, stepping stones and three pieces of laundry. Its fixed world position (−41m, 0m, −112m) sits beside the railway; traveling in the carriage brings it alongside and then leaves it behind. It does not follow the station or turn toward the viewer. The user's island reference informs its silhouette and domestic details; the image is not mapped onto geometry.

The component-local palette uses grass (`#678b39`), earth (`#7c8061`), cream plaster (`#e3d9b2`), clay roof (`#a85b3c`), muted timber (`#62664b`), foliage (`#487142`), warm trim (`#d7c89a`) and dark window glass (`#365d59`). Seeded vertex-color variation and matte materials give the small landmark a painted surface. Window emission warms at dusk. Tree crowns and laundry share the world's breeze and hold still under reduced motion; the island also receives the shared cloud shade.

Geometry is merged by material, with crowns and cloth kept separate for their small movements. The model contains (20) meshes and (38,718) triangles, with no new image textures or render passes. These construction counts and desktop captures do not establish sustained headset performance.

### Arrival actions

The primary action is a warm-paper rectangle with dark ink, a headset line icon, centered content, and a minimum height defined in Layout. Hover warms the surface; disabled state reduces opacity to (.55). The adjacent text action provides desktop exploration, with underline on hover. VR availability changes the primary label and enabled state; the screen option stays accessible.

### Menu close action

The (44px) close target has a thin line X, transparent background, Sea Ink lettering and the existing small action radius. Hover warms the paper surface. It replaces the former circular header settings icon; Menu is now a labeled dock action.

### Exploration toolbar

Two actions sit in the lower-right enamel dock: the stateful journey action and Menu. The journey label follows board, depart, pause/continue and completion. Buttons retain a (44px) minimum height, with (12px 16px) desktop padding and (12px) mobile padding. The journey action uses Enamel Active; hover and expanded Menu use Deep Sea. Ride status and instructions live in the requested menu, with only brief notices outside it. Header Exit is visible on the welcome screen; exploration places Exit inside the menu.

### Requested menu and fields

The paper panel pairs the story-font “Your journey” title and current ride status with seat selection, return, a native Time of day select, sound and Exit experience. More options & controls is a native disclosure for volume, detail, quiet water, help and welcome-screen navigation. It collapses again when the menu closes. Rows use thin dividers; range and checkbox accents use Deep Sea, and selects retain a muted border and (44px) minimum height. Keyboard focus is a (3px) Amber Focus outline with a (4px) offset; the canvas offsets its outline inward.

Menu, H or Escape toggles the panel. Close and outside world clicks dismiss it; keyboard closing restores Menu focus, while outside clicks and travel actions return focus to the canvas. Opening the panel or selecting time/sound preserves journey progress and gaze. Boarding, seat changes, departure/pause and return close it. The visible journey action remains available while the panel is open.

### Compact in-world menu

The VR menu begins closed. Either grip toggles it and trigger selects. Its brass backing is (0.54m × 0.55m × 0.012m), placed only on explicit opening (0.9m) ahead and (0.22m) below the actual head. No floor clamp raises it for a seated visitor. It retains the established enamel and warm-label treatment. Full-width journey and seat actions are (0.504m × 0.08m); paired actions and named times are (0.244m × 0.08m). Close is always visible. Time of day opens a separate six-choice page with selected state and Back to journey.

Opening or choosing time/sound preserves the journey and view. The menu closes on travel actions, snap turning and XR visibility loss; it does not automatically appear on XR entry or after a seat change. Busy placements disable travel actions, seat/return are unavailable on the platform, and the journey action disables at route completion. The panels use full-opacity late rendering with depth tests/writes disabled so water and carriage glass do not cut through them. These are Three.js geometry and canvas textures, not DOM overlays. Monoscopic browser projections establish layout and layering only; headset stereo readability, controller targeting and placement comfort remain unverified.

WebXR entry requires a secure context, available XR API, and supported immersive session. The implementation requests `immersive-vr`, uses a local-floor reference space, right-stick snap turning, and explicit boarding/seat/return placements. Water-plane teleportation is retired. Real tracked head height and gaze remain independent of the train. Movement is opt-in and pauses when visibility is lost. Screen rendering caps pixel ratio at (1.5) for balanced and (2) for high detail; XR uses framebuffer scale (1) and requested foveation (1). These are code settings, not proof of headset comfort, performance, compatibility, or hardware verification. Validate those on a real headset before making such claims.

## Do's and Don'ts

### Do:
- **Do** preserve the dominant bright-blue field, sparse painted clouds, stable horizon, and human-scale station.
- **Do** keep welcome typography literary and operating controls plain and legible.
- **Do** retain clear keyboard focus and native form semantics.
- **Do** keep movement opt-in and provide reachable controls inside immersive sessions.
- **Do** ship the sky, font, and provenance with the application.
- **Do** keep nearby living details small and slow: a cat that briefly notices the train, a quiet passenger, petals and wind-touched laundry.

### Don't:
- **Don't** cover the world with large opaque content panels or decorative card grids.
- **Don't** substitute DOM-only controls for the in-world VR ticket.
- **Don't** treat reduced motion as a promise that every animated world object stops.
- **Don't** claim headset validation from desktop screenshots or implementation settings.
- **Don't** let the day race: sunsets take minutes, and nothing in the sky should startle.
