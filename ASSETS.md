# Asset provenance

## Environment reference

`Dreamy Ocean Sky Storyboard.png` was supplied by the user and remains unchanged. It is a visual reference, not loaded at runtime.

## Painted sky

### Open-blue sky revision (November 2026)

The current renderer uses two natively transparent painted cloud textures:

- `public/assets/cloud-tower.png`: 1536 × 1024 RGBA, an asymmetric ivory cumulus
  bank with feathery ivory edges and soft pale-blue/mint shadow washes.
- `public/assets/cloud-veil.png`: 1536 × 1024 RGBA, a low, wind-stretched shelf.

Both began as original built-in image-generation outputs. They were then
repainted with the same tool, using each existing texture as the edit target
and the cloud in the user's [cloud reference](https://wall.alphacoders.com/big.php?i=1276218)
as the style reference. Only the cloud treatment informed the edits; the
reference's foreground characters are not included. Exact final edit prompts
are the adjacent `cloud-tower.prompt.txt` and
`cloud-veil.prompt.txt` files and embedded in each PNG's metadata. Alpha was inspected: corners are transparent and
cloud bodies are substantially opaque. They are original generated assets,
not extracted frames or production artwork from an animated film. Original
generated outputs remain in the user's generated-images directory. The final
outputs are `exec-6be6cabb-843d-4712-adfe-fb64964dd8d9.png` (tower) and
`exec-f3a6f2e9-11a3-43ce-8628-9ea1f4d57953.png` (veil).

`src/shaders.js` paints four sparse angular banks over a deep-blue procedural
sky wash. Each image is sampled within a limited angular window rather than
stretched over 360 degrees. The blue is resolution-independent; each painted
cloud has more pixels per degree than the former panorama. This is not an 8K
panorama, and headset clarity remains unverified. Sky and water share the same
painting and daylight recipe. The shader fades paint at angular patch edges.

The veil is also reused once on a depth-tested world-space plane across the
dragon's flight route, and once for the distant rain bank. The dragon's
materials blend toward cloud pigment inside a local mist volume. Weather,
shadows and the tide passenger are original procedural geometry/shaders. The
passenger has a sea-glass body, folded leaf cap and small blank brass ticket;
no downloaded character, rig, audio or model is used.

The two older panoramas below are retained for provenance and comparison but
are no longer loaded by the application. The nine 256 × 192 procedural cloud
sprites have also been retired.

### Original panorama (historical)

`public/assets/summer-sky.png` was generated with the built-in image-generation tool, using the supplied storyboard as the style and environment reference. Its original output remains in the user's generated-images directory. The generated image remains in the repository for provenance and comparison. Earlier versions used it for softer water reflections, with its painted horizon aligned at texture V = 0.43; the current application does not load it.

Exact generation prompt:

> Create a production sky texture for a WebXR environment closely matching the attached reference storyboard. Transform the storyboard's painted atmosphere into ONE continuous 360-degree equirectangular panorama, exactly 2:1 landscape aspect ratio, ideally 3840x1920. NOT a collage. The horizon must be perfectly flat exactly halfway down image. Upper half: magnificent towering summer cumulus clouds, ivory sunlit tops, delicate pale cyan/lavender shaded lobes, small broken wisps, saturated azure blue sky, traditional hand painted Japanese animated-film background, gouache edges and soft brush texture. Cloud towers rise to 65 degrees with blue zenith. Below horizon: clear turquoise blue ocean with long soft painterly cloud reflections and quiet ripples, no foreground objects. Distant tiny blue island silhouettes at horizon. Wrap left and right edges seamlessly; top zenith a smooth blue with no objects; bottom ocean blue. Balanced varied cloud banks in all directions, one especially tall luminous bank front center. Match the provided storyboard's bright daytime colors and dreamlike vastness very closely. No rails, no train, no architecture, no people, no text, no borders, no sun disk, no lens flare. This will surround a fully 3D railway and be sampled as sky reflections in animated water.

### Cloud clarity revision (historical)

`public/assets/summer-sky-detailed.png` is an edit made with the built-in image-generation tool, using `summer-sky.png` as the edit target. The tool returned **1774 × 887**, the same dimensions as the original, despite the requested 3840 × 1920. This is a clearer-painted artwork revision, not a resolution upgrade or a 4K asset. The original generated output is `exec-950239dc-69d6-4c33-bba5-f2c89e8f2315.png` in the thread's generated-images directory.

That version used the revised texture for the visible sky plus a five-sample, local-range-clamped contrast correction when magnified. The correction faded out under minification and retained mip filtering and longitude-wrap derivative correction. Water used the original texture without the extra sharpening samples. Both panoramas are now retired from runtime use. The revision did not establish improved Quest clarity or performance.

Exact edit prompt:

> Edit target: the attached sky panorama used as the immersive 360-degree sky texture of a Quest WebXR world. Produce a genuinely HIGH RESOLUTION 3840 x 1920 pixel (2:1) replacement with freshly resolved fine painted detail, NOT a blurred enlargement. Preserve the existing composition and style closely: saturated bright summer azure, enormous ivory cumulus towers with cyan and pale lavender shaded lobes, intricate small broken wisps, luminous hand-painted Japanese animated-film background / gouache. Preserve the EXACT level horizon at 57% from the image top and low distant island silhouettes there, blue sky across top, turquoise ocean reflections below. Main request is much sharper cloud silhouettes and fine internal painted planes and brush edges, especially when magnified in VR. No soft focus, no depth of field, no haze over the near cloud towers, no blur, no crunchy sharpening halos, no noisy photographic microtexture. Paint clear small lobes within the big cloud masses so scale feels immense. Maintain softness only in far distant horizon atmosphere. Full continuous 360-degree equirectangular panorama, left/right edges MUST join seamlessly in both cloud shapes and color, avoid stretching at poles. Preserve the open blue upper area and the distribution of the original cloud towers. No buildings, no platform, no figures, no objects, no letters, no border, no sun disk or lens flare. Output the largest native resolution possible, requested 3840 x 1920.

### The passing day, stars, and moon

`src/shaders.js` grades the procedural blue wash and the four painted cloud banks at runtime from uniforms computed in `src/daylight.js`. Golden hour, dusk, night, stars and the moon use shader arithmetic; they require no additional time-of-day image assets. Stars are a hashed direction grid, the moon is a thresholded dot product, and the sun glow is a power of the sun direction. The former nine near cumulus sprites used three runtime Canvas textures (256 × 192 each) built from seeded radial gouache puffs; that layer has been removed.

## Lettering

`public/assets/story.woff2` is Alegreya Latin regular, from the `@fontsource/alegreya` npm package. Its SIL Open Font License is included at `public/assets/FONT-LICENSE.txt`.

## Geometry, textures, and sound

Platform, shelter, shoreline, railway, island, bird, dragon, controller and menu geometry is authored locally in Three.js. The rideable carriage is original Blender geometry exported to GLB, as documented below. Wood grain and station/menu lettering use local Canvas textures. Water is an original animated shader. Audio is synthesized using the Web Audio API: filtered noise and oscillator tones; no sampled recordings, music tracks, or remote sound assets. The former observation deck is retired.

### Rideable carriage — November 2026

`assets/train/carriage.blend` is the original editable carriage source, generated by `scripts/build-train.py` with official portable Blender 4.5.15 LTS. `public/assets/train/carriage.glb` is the runtime export loaded by `src/train.js`. The source includes real window openings, rounded roof and cab forms, segmented red seating, timber frames and floor, hanging straps, lamps, wheels and separate sliding door leaves. No downloaded model or extracted model parts are used.

The user's [exterior reference](https://images4.alphacoders.com/127/thumb-1920-1274022.jpg) informed the cream/maroon body and rounded profile; the [interior reference](https://images5.alphacoders.com/501/thumbbig-501188.webp) informed red upholstery, substantial dark frames and hanging straps. Local reference copies are in the ignored `.impeccable/review/` directory. These images guided proportion and materials only; no source image pixels are copied into the asset.

`public/assets/train/carriage-material-atlas.png` is an original native built-in image-generation output: 1254 × 1254, opaque 8-bit RGB, sRGB. Four fields provide maroon enamel, cream enamel, walnut timber and red moquette. The prompt requested 1024 square; the actual native output was preserved at 1254 square, with no resizing or repainting after generation. The exact prompt is adjacent at `carriage-material-atlas.exact.prompt.txt` and embedded under PNG metadata key `impeccable:prompt`. The preserved original is `$CODEX_HOME/generated_images/01a1af27-75ff-7110-b6f0-cc36c3cfd3f6/exec-5a708fb9-f4f1-4ce0-93ca-4988e6fffe75.png`. Only prompt metadata was added to the project copy; pixel data and opacity remain intact.

`assets/train/materials.json` records generation provenance and safe UV regions, including the Blender V inversion. The atlas is not tileable; islands remain inset from quadrant edges to protect mip sampling. The GLB embeds one copy of this atlas. Current metadata records 42,580 triangles, seven mesh primitives, five materials and a 3,941,940-byte GLB. Estimated decoded RGBA8 memory with mipmaps is about 8 MiB. Transparent double-sided glass can add a render pass; primitive count is not an actual draw-call or headset-performance promise. See [the train source guide](assets/train/README.md) for rebuilding and coordinate details.

The current raster provenance scan covers five files and reports zero missing records. The fresh visual finish review returned **ship** for the first carriage/window-seat milestone, using actual browser captures; neither provenance nor desktop review establishes Quest clarity, comfort or sustained frame rate.

### Sky dragon

`src/dragon.js` builds the pearl-and-jade wingless East Asian dragon entirely from local Three.js geometry and material colors. The user's [dragon reference](https://wall.alphacoders.com/big.php?i=81999) informed its longer white muzzle, green almond eyes, tall lavender-lined ears, ivory antlers and fuller teal mane. Its continuous deforming body, whiskers, four clawed feet, and swept tail are procedural. The head and feet merge details by pigment; the mane uses (64) instances of paired broad, cupped fur locks. No downloaded model, image texture, rig, motion capture, or external animation asset is used.

This records provenance, not user acceptance: the user criticized its smooth procedural appearance. The carriage milestone leaves this dragon in place and does not renew its earlier visual-review approval.

`src/dragon-flight.js` authors the flight path with a cloud skim, broad vertical loop, banking dive and rising turn. Arc-length sampling keeps the body following the head at a consistent distance, and transported frames keep its orientation continuous through vertical flight and the repeat seam. Cruise varies gently between 6.75 and 7.65 m/s; the approximately 1,038m route repeats in about 144 seconds. Spine undulation and small whisker, mane and foot motions are computed in code. `src/world.js` creates and updates the dragon, receiving the reduced-motion preference from `src/main.js`. That preference holds the local pose still while its region continues to ease along the travel route. Hidden flat-screen documents skip world updates and rendering. The current dragon has (22) mesh objects and (47,072) triangles including instances; this construction count does not establish actual headset frame rate or comfort.

### The passing island

`src/island.js` is original local Three.js geometry informed by the user's
[island reference](https://wall.alphacoders.com/big.php?i=661705). A low grassy
shore carries a cream cottage, tiled terracotta gable roof, two chimneys,
wind-shaped trees, bench, stepping stones and three pieces of laundry. The
reference image is not shipped or mapped onto geometry. Material batches,
seeded vertex-color variation and merged foliage use no new image textures.
Trees and laundry share the world's breeze, windows light at dusk, and the
island receives the same cloud shade as the station. Its world position is
fixed at (-41, 0, -112), beside the railway, so the travelling
carriage passes it while the station stays at home. Reduced motion holds the crowns and cloth still. The model
contains (20) meshes and (38,718) triangles, with no new render passes.

### Living details

`src/life.js` (petals, butterflies, fireflies, sea-lights), `src/sky-life.js` (the far train and little plane), `src/passenger.js` (the original tide passenger), and the cat, lanterns, pinwheel and streamers in `src/station.js` use local Three.js geometry, instanced meshes and material colours. The music box, crickets, train whistle, plane hum and evening pad in `src/audio.js` are oscillator and filter synthesis. These characters and sounds use no downloaded model, texture, sample, or music track. `src/weather.js` adds procedural rain and cloud-shade shaders, reusing the generated veil painting for its distant bank; `src/cloud-dancer.js` reuses that same painting for the dragon's local veil.

### Storybook station

`src/station.js` authors the rebuilt station locally using Three.js geometry, including its `RoundedBoxGeometry` and `mergeGeometries` helpers. `src/world.js` incorporates it through `createStation(scene)`. No downloaded station model or external prop texture is used.

The current station root stays at (-3.4, 0.6, -3) on the raised grassy shoreline authored in `src/shore.js`. It is independent of the moving carriage; its platform floor aligns with the carriage's 0.9m floor. The shoreline uses original local geometry and material colors, with no additional image texture.

The geometry includes warm worn platform boards with staggered joins and nail heads; an open cream-and-teal gabled shelter with braces, exposed-timber paint wear, a curved roof profile, overlapping rounded terracotta tiles, and cylindrical ridge caps; a slatted bench; a strapped leather suitcase with handle and latch; a knotted cloth parcel; three planted clay pots with leaves and flowers; and a watering can. The hanging station sign and separate station marker have outward-facing lettering on both sides.

Textures are generated at runtime with local Canvas drawing and deterministic variation seeded at (831): a shared grain texture (512 × 256) with long strokes, sun-bleached washes, and knots; two sign textures (1024 × 512 each) with pigment flecks, borders, fixing marks, and Georgia lettering; and one soft radial contact-wash texture (128 × 128) reused beneath the shelter, bench, and selected pots. These are procedural outputs of the project source, not additional shipping raster files. The station shares the grain across tinted timber, teal paint, terracotta, leather, and cloth materials.

Station details use matte materials and vertex-color variation. Stationary geometry is merged by material; sign faces, sign backings, and transparent contact-wash planes remain separate. The contact wash substitutes fixed soft grounding for real-time shadow maps. This documents the construction and provenance only; it does not establish Quest performance or headset validation. The painted sky, water shader, and screen UI assets retain their existing provenance.
