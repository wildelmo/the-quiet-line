# Asset provenance

## Environment reference

`Dreamy Ocean Sky Storyboard.png` was supplied by the user and remains unchanged. It is a visual reference, not loaded at runtime.

## Painted sky

`public/assets/summer-sky.png` was generated with the built-in image-generation tool, using the supplied storyboard as the style and environment reference. Its original output remains in the user's generated-images directory. The generated image is shipped locally. Shader sampling aligns its painted horizon at texture V = 0.43.

Exact generation prompt:

> Create a production sky texture for a WebXR environment closely matching the attached reference storyboard. Transform the storyboard's painted atmosphere into ONE continuous 360-degree equirectangular panorama, exactly 2:1 landscape aspect ratio, ideally 3840x1920. NOT a collage. The horizon must be perfectly flat exactly halfway down image. Upper half: magnificent towering summer cumulus clouds, ivory sunlit tops, delicate pale cyan/lavender shaded lobes, small broken wisps, saturated azure blue sky, traditional hand painted Japanese animated-film background, gouache edges and soft brush texture. Cloud towers rise to 65 degrees with blue zenith. Below horizon: clear turquoise blue ocean with long soft painterly cloud reflections and quiet ripples, no foreground objects. Distant tiny blue island silhouettes at horizon. Wrap left and right edges seamlessly; top zenith a smooth blue with no objects; bottom ocean blue. Balanced varied cloud banks in all directions, one especially tall luminous bank front center. Match the provided storyboard's bright daytime colors and dreamlike vastness very closely. No rails, no train, no architecture, no people, no text, no borders, no sun disk, no lens flare. This will surround a fully 3D railway and be sampled as sky reflections in animated water.

## Lettering

`public/assets/story.woff2` is Alegreya Latin regular, from the `@fontsource/alegreya` npm package. Its SIL Open Font License is included at `public/assets/FONT-LICENSE.txt`.

## Geometry, textures, and sound

All platform, shelter, railway, island, bird, deck, controller and menu geometry is authored procedurally in this project. Wood grain and station/menu lettering use local Canvas textures. Water is an original animated shader. Audio is synthesized using the Web Audio API: filtered noise and oscillator tones; no sampled recordings, music tracks, or remote sound assets.

### Storybook station

`src/station.js` authors the rebuilt station locally using Three.js geometry, including its `RoundedBoxGeometry` and `mergeGeometries` helpers. `src/world.js` incorporates it through `createStation(scene)`. No downloaded station model or external prop texture is used.

The geometry includes warm worn platform boards with staggered joins and nail heads; an open cream-and-teal gabled shelter with braces, exposed-timber paint wear, a curved roof profile, overlapping rounded terracotta tiles, and cylindrical ridge caps; a slatted bench; a strapped leather suitcase with handle and latch; a knotted cloth parcel; three planted clay pots with leaves and flowers; and a watering can. The hanging station sign and separate station marker have outward-facing lettering on both sides.

Textures are generated at runtime with local Canvas drawing and deterministic variation seeded at (831): a shared grain texture (512 × 256) with long strokes, sun-bleached washes, and knots; two sign textures (1024 × 512 each) with pigment flecks, borders, fixing marks, and Georgia lettering; and one soft radial contact-wash texture (128 × 128) reused beneath the shelter, bench, and selected pots. These are procedural outputs of the project source, not additional shipping raster files. The station shares the grain across tinted timber, teal paint, terracotta, leather, and cloth materials.

Station details use matte materials and vertex-color variation. Stationary geometry is merged by material; sign faces, sign backings, and transparent contact-wash planes remain separate. The contact wash substitutes fixed soft grounding for real-time shadow maps. This documents the construction and provenance only; it does not establish Quest performance or headset validation. The painted sky, water shader, and screen UI assets retain their existing provenance.
