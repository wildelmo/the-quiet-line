---
name: The Quiet Line
description: A tiny station in a vast painted summer ocean.
colors:
  sky: "#2098c7"
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
    padding: "15px 0"
  button-icon:
    backgroundColor: "#174956b8"
    textColor: "{colors.paper}"
    rounded: "{rounded.circle}"
    width: "44px"
    height: "44px"
  button-icon-hover:
    backgroundColor: "{colors.ink}"
  toolbar:
    backgroundColor: "{colors.enamel-panel}"
    rounded: "{rounded.toolbar}"
    padding: "{spacing.toolbar-inset}"
  toolbar-action:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.field}"
    typography: "{typography.label}"
    padding: "12px 18px"
  toolbar-action-active:
    backgroundColor: "{colors.enamel-active}"
  settings-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-padding}"
    width: "360px"
  select:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.field}"
    padding: "7px"
---

# Design System: The Quiet Line

## Overview

**Creative North Star: "A tiny station in a vast painted ocean"**

The supplied ocean storyboard is the visual authority. Brilliant summer blue, towering ivory clouds, reflected sky, and submerged rails make the world feel expansive. The little station supplies human scale without enclosing the view. The interface is sparse and welcoming, with illustrated-story lettering and small practical controls.

The environment fills the viewport. Nearby structures are real geometry; the painted sky is the distant backdrop. The welcome overlay recedes when exploration begins, and immersive sessions use a physical ticket-like menu inside the world. Movement begins only through an explicit action; the horizon remains stable during travel.

**Key Characteristics:**
- A huge bright-blue space with a clear, distant horizon.
- Painted clouds reflected in translucent, gently animated water.
- Warm paper, weathered timber, and subdued enamel at human scale.
- Literary display type paired with quiet, legible controls.
- Sparse screen overlays and native in-world controls for immersion.

## Colors

Bright sky and turquoise water own the image; warm paper and dark sea-blue give the interface contrast without overpowering the scene. Frontmatter values describe implemented UI colors and material base colors, not sampled colors from the raster sky or final shaded pixels.

### Primary
- **Summer Sky** (`sky`) is the scene fallback behind the painted sky asset. The asset supplies the full cloud and blue tonal range.
- **Deep Sea** (`sea`) accents native form controls and the recovery action.
- **Enamel Panel / Enamel Active** provide the translucent exploration toolbar and its hovered or pressed controls.

### Secondary
- **Weathered Timber**, **Station Enamel**, **Station Brass**, and **Rail Metal** belong to physical station and railway materials. Their rendered appearance changes under the scene lighting.
- **Amber Focus** marks keyboard focus and text selection. **Primary Hover** gently warms the paper action on hover.

### Neutral
- **Warm Paper** is the welcome lettering, primary action surface, and settings panel.
- **Sea Ink** is dark text on paper. **Secondary Ink** softens explanatory settings text.
- **Setting Divider** and **Field Border** organize the settings controls with restrained strokes.
- **Loading Mist** covers loading and recovery screens. **Distance Mist** is the atmospheric scene fog.

**The Open Blue Rule.** Preserve the broad blue sky and water as the dominant visual field; interface surfaces stay compact.

## Typography

The bundled `public/assets/story.woff2` is Alegreya Latin regular, exposed by CSS as **QuietStory**. Display and settings titles use `QuietStory, Georgia, serif`; the interface uses **Segoe UI** with a generic sans-serif fallback. Only the regular display face is bundled, and font synthesis is disabled.

The pairing reads like a quiet illustrated travel story with straightforward operating instructions. Welcome copy uses the display role with balanced wrapping. Settings titles use the title role; invitation prose uses body; settings prose uses panel-body; toolbar controls and utility labels use label. Action weight is reserved for primary and welcome actions.

On narrow screens, the display becomes (43px) with (1.02) line height and invitation prose becomes (14px). On short desktop screens, the display becomes (42px). In-world station signs deliberately use canvas-rendered Georgia, while the VR ticket uses canvas-rendered sans-serif (42px on its source texture); these are separate world textures, not DOM font styles.

**The Quiet Lettering Rule.** Use the bundled regular story face for invitations and titles; use the interface sans-serif for actions and instructions.

## Layout

The app and canvas are fixed to all viewport edges with dynamic viewport height. There is no scrolling page or card grid. The desktop masthead uses (28px 40px) padding. The welcome overlay anchors to the bottom, pairing the invitation at left with a (292px) arrival block at right, separated by a (40px) gap. Its padding is (120px 5.5vw 7vh). A transparent-to-deep-blue gradient supports lettering over the sea.

At widths up to (650px), the masthead has (20px) padding and the welcome layout stacks vertically with (80px 26px 32px) padding. Arrival controls use the available width, capped at (330px), after a (28px) gap. The primary action minimum height changes from (58px) to (52px). At heights up to (590px) with widths from (651px), desktop welcome spacing and typography compress without changing the overall arrangement.

During exploration, a compact toolbar sits centered (26px) above the lower edge, or (20px) on mobile, capped at viewport width minus (30px). The settings panel anchors to the upper right, with width capped by viewport width minus (32px) and a scrollable maximum height of viewport height minus (110px). It moves inward and uses smaller padding on mobile.

Immersive WebXR hides the masthead, welcome, toolbar, and settings DOM overlays. The ticket menu is world-space geometry, placed in front of the headset and recalled with either controller grip. Maintain the distinction between flat-screen responsive layout and stereo, real-scale world layout.

## Elevation & Depth

Depth comes primarily from the world: converging submerged rails, real station geometry, shallow-water transparency, reflected clouds, low distant islands, and atmospheric fog. Water blends toward sky color at distance. Small props are rough and weathered; the brass and rails have modest metalness. The bell alone uses translucent glass-like material. The painted sky stays direction-based and does not introduce nearby parallax.

DOM surfaces use soft, blue-tinted ambient shadows: primary action (`0 7px 24px #06334b25`), exploration toolbar (`0 6px 24px #08354a22`), and settings panel (`0 16px 65px #163d5240`). Text shadows support legibility over the image. The welcome gradient supplies contrast without an opaque content card.

Motion is slow and environmental: water shimmer, birds, and a hanging wind bell. The loading indicator breathes over (1.8s); loading fades over (.8s), notices over (.3s), and the DOM travel fade over (.15s). Reduced-motion preference disables CSS animation/transitions and initializes quiet water; birds and bell still animate in the current implementation. Do not describe this as a total world-motion pause.

## Shapes

Physical forms are simple timber boards, rails, posts, a shelter, and a small traveling deck. The horizon remains unobstructed by oversized structures. The screen UI uses lightly eased rectangles for actions, toolbar, and settings, while the settings icon is circular. Thin line icons have rounded caps and joins. Use the small radii in frontmatter rather than introducing oversized capsules or decorative containers.

## Components

### Arrival actions

The primary action is a warm-paper rectangle with dark ink, a headset line icon, centered content, and a minimum height defined in Layout. Hover warms the surface; disabled state reduces opacity to (.7). The adjacent text action provides desktop exploration, with underline on hover. VR availability changes the primary label and enabled state; the screen option stays accessible.

### Settings icon

The circular control uses a translucent dark background and a pale border. Hover darkens to Sea Ink. The close control inside settings retains the icon shape but drops the background and border.

### Exploration toolbar

Four actions sit within one enamel container. Hover and `aria-pressed="true"` share the active surface. Buttons have a (44px) minimum height, with (12px 18px) desktop padding and (10px 11px) mobile padding. A small place label and interaction hint float above and below it.

### Settings panel and fields

The paper panel pairs a story-font title with native range, select, and checkbox controls. Rows use thin dividers and generous vertical separation. Range and checkbox accents use Deep Sea; the select uses a thin muted border. The panel scrolls when space is constrained. Keyboard focus is a (3px) Amber Focus outline with a (5px) offset; the canvas offsets its outline inward.

### In-world ticket

The native WebXR menu is a brass-colored backing (0.94m × 0.78m × 0.018m) carrying dark panels with warm labels. Action panels are (0.84m × 0.085m); hovering by controller ray lightens their enamel. Its five actions are drift/pause, next viewpoint, sound, return to station, and Exit experience. The exit action sits below a wider gap to separate leaving from travel. Trigger selects; grip recalls it. These are Three.js geometry and canvas textures, not a DOM overlay. The flat-screen masthead also keeps a clearly labeled Exit experience control beside settings, with equivalent exits in loading and error states.

WebXR entry requires a secure context, available XR API, and supported immersive session. The implementation requests `immersive-vr`, uses a local-floor reference space, snap turning, and limited water-plane teleportation. Movement is opt-in and pauses when visibility is lost. Screen rendering caps pixel ratio at (1.5) for balanced and (2) for high detail; XR uses framebuffer scale (1) and requested foveation (1). These are code settings, not proof of headset comfort, performance, compatibility, or hardware verification. Validate those on a real headset before making such claims.

## Do's and Don'ts

### Do:
- **Do** preserve the large bright-blue field, reflected clouds, stable horizon, and human-scale station.
- **Do** keep welcome typography literary and operating controls plain and legible.
- **Do** retain clear keyboard focus and native form semantics.
- **Do** keep movement opt-in and provide reachable controls inside immersive sessions.
- **Do** ship the sky, font, and provenance with the application.

### Don't:
- **Don't** cover the world with large opaque content panels or decorative card grids.
- **Don't** substitute DOM-only controls for the in-world VR ticket.
- **Don't** treat reduced motion as a promise that every animated world object stops.
- **Don't** claim headset validation from desktop screenshots or implementation settings.
