# Asset provenance

## Environment reference

`Dreamy Ocean Sky Storyboard.png` was supplied by the user and remains unchanged. It is a visual reference, not loaded at runtime.

## Painted sky

`public/assets/summer-sky.png` was generated with the built-in image-generation tool, using the supplied storyboard as the style and environment reference. Its original output remains in the user's generated-images directory. The generated image is shipped locally and retained for the softer water reflections. Shader sampling aligns its painted horizon at texture V = 0.43.

Exact generation prompt:

> Create a production sky texture for a WebXR environment closely matching the attached reference storyboard. Transform the storyboard's painted atmosphere into ONE continuous 360-degree equirectangular panorama, exactly 2:1 landscape aspect ratio, ideally 3840x1920. NOT a collage. The horizon must be perfectly flat exactly halfway down image. Upper half: magnificent towering summer cumulus clouds, ivory sunlit tops, delicate pale cyan/lavender shaded lobes, small broken wisps, saturated azure blue sky, traditional hand painted Japanese animated-film background, gouache edges and soft brush texture. Cloud towers rise to 65 degrees with blue zenith. Below horizon: clear turquoise blue ocean with long soft painterly cloud reflections and quiet ripples, no foreground objects. Distant tiny blue island silhouettes at horizon. Wrap left and right edges seamlessly; top zenith a smooth blue with no objects; bottom ocean blue. Balanced varied cloud banks in all directions, one especially tall luminous bank front center. Match the provided storyboard's bright daytime colors and dreamlike vastness very closely. No rails, no train, no architecture, no people, no text, no borders, no sun disk, no lens flare. This will surround a fully 3D railway and be sampled as sky reflections in animated water.

### Cloud clarity revision

`public/assets/summer-sky-detailed.png` is an edit made with the built-in image-generation tool, using `summer-sky.png` as the edit target. The tool returned **1774 × 887**, the same dimensions as the original, despite the requested 3840 × 1920. This is a clearer-painted artwork revision, not a resolution upgrade or a 4K asset. The original generated output is `exec-950239dc-69d6-4c33-bba5-f2c89e8f2315.png` in the thread's generated-images directory.

The visible sky uses the revised texture plus a five-sample, local-range-clamped contrast correction when magnified. It fades out under minification, retains mip filtering, and retains the longitude-wrap derivative correction. Water continues to use the original texture and does not run the extra sharpening samples. Native angular detail remains limited by the source dimensions; Quest performance and clarity need headset verification.

Exact edit prompt:

> Edit target: the attached sky panorama used as the immersive 360-degree sky texture of a Quest WebXR world. Produce a genuinely HIGH RESOLUTION 3840 x 1920 pixel (2:1) replacement with freshly resolved fine painted detail, NOT a blurred enlargement. Preserve the existing composition and style closely: saturated bright summer azure, enormous ivory cumulus towers with cyan and pale lavender shaded lobes, intricate small broken wisps, luminous hand-painted Japanese animated-film background / gouache. Preserve the EXACT level horizon at 57% from the image top and low distant island silhouettes there, blue sky across top, turquoise ocean reflections below. Main request is much sharper cloud silhouettes and fine internal painted planes and brush edges, especially when magnified in VR. No soft focus, no depth of field, no haze over the near cloud towers, no blur, no crunchy sharpening halos, no noisy photographic microtexture. Paint clear small lobes within the big cloud masses so scale feels immense. Maintain softness only in far distant horizon atmosphere. Full continuous 360-degree equirectangular panorama, left/right edges MUST join seamlessly in both cloud shapes and color, avoid stretching at poles. Preserve the open blue upper area and the distribution of the original cloud towers. No buildings, no platform, no figures, no objects, no letters, no border, no sun disk or lens flare. Output the largest native resolution possible, requested 3840 x 1920.

### The passing day, stars, and moon

`src/shaders.js` grades the painted panorama at runtime from uniforms computed in `src/daylight.js`. Golden hour, dusk, night, stars and the moon are all procedural shader arithmetic over the same two shipped panoramas; no additional sky image is shipped. Stars are a hashed direction grid, the moon is a thresholded dot product, and the sun glow is a power of the sun direction. The near cumulus sprites in `src/sky-life.js` use three runtime Canvas textures (256 × 192 each) built from radial gouache puffs, seeded deterministically.

## Lettering

`public/assets/story.woff2` is Alegreya Latin regular, from the `@fontsource/alegreya` npm package. Its SIL Open Font License is included at `public/assets/FONT-LICENSE.txt`.

## Geometry, textures, and sound

All platform, shelter, railway, island, bird, dragon, deck, controller and menu geometry is authored procedurally in this project. Wood grain and station/menu lettering use local Canvas textures. Water is an original animated shader. Audio is synthesized using the Web Audio API: filtered noise and oscillator tones; no sampled recordings, music tracks, or remote sound assets.

### Sky dragon

`src/dragon.js` builds the pearl-and-jade wingless East Asian dragon entirely from local Three.js geometry and material colors. Its continuous deforming body, branched antlers, layered head, gold eyes, whiskers, four clawed feet, and swept tail are procedural. The head and feet merge details by pigment; the mane uses (58) instances of a paired tapered-lock shape. No downloaded model, image texture, rig, motion capture, or external animation asset is used.

The flight curve, spine undulation, and small whisker, mane, and foot motions are computed in code. `src/world.js` creates and updates the dragon, receiving the reduced-motion preference from `src/main.js`. That preference holds the local pose still while its region continues to ease along the travel route. Hidden flat-screen documents skip world updates and rendering. The current dragon has (20) mesh objects and (43,304) triangles including instances; this construction count does not establish actual headset frame rate or comfort.

### Living details

`src/life.js` (petals, butterflies, fireflies, sea-lights), `src/sky-life.js` (near clouds, the far train, the little plane) and the cat, lanterns, pinwheel and streamers added in `src/station.js` are all local Three.js geometry, instanced meshes and material colours. The music box, crickets, train whistle, plane hum and evening pad in `src/audio.js` are oscillator and filter synthesis. No downloaded model, texture, sample, or music track is used.

### Storybook station

`src/station.js` authors the rebuilt station locally using Three.js geometry, including its `RoundedBoxGeometry` and `mergeGeometries` helpers. `src/world.js` incorporates it through `createStation(scene)`. No downloaded station model or external prop texture is used.

The geometry includes warm worn platform boards with staggered joins and nail heads; an open cream-and-teal gabled shelter with braces, exposed-timber paint wear, a curved roof profile, overlapping rounded terracotta tiles, and cylindrical ridge caps; a slatted bench; a strapped leather suitcase with handle and latch; a knotted cloth parcel; three planted clay pots with leaves and flowers; and a watering can. The hanging station sign and separate station marker have outward-facing lettering on both sides.

Textures are generated at runtime with local Canvas drawing and deterministic variation seeded at (831): a shared grain texture (512 × 256) with long strokes, sun-bleached washes, and knots; two sign textures (1024 × 512 each) with pigment flecks, borders, fixing marks, and Georgia lettering; and one soft radial contact-wash texture (128 × 128) reused beneath the shelter, bench, and selected pots. These are procedural outputs of the project source, not additional shipping raster files. The station shares the grain across tinted timber, teal paint, terracotta, leather, and cloth materials.

Station details use matte materials and vertex-color variation. Stationary geometry is merged by material; sign faces, sign backings, and transparent contact-wash planes remain separate. The contact wash substitutes fixed soft grounding for real-time shadow maps. This documents the construction and provenance only; it does not establish Quest performance or headset validation. The painted sky, water shader, and screen UI assets retain their existing provenance.
