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
