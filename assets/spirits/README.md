# Original carriage spirits

Five original seated spirits share The Quiet Line’s carriage: the approved
newspaper reader and four distinct fellow travellers. All geometry is editable
in Blender. The four additions reuse the reader’s unchanged painted atlas;
no new image generation, downloaded model, extracted geometry or external rig
was used for them. All five figures and belongings use 70% opacity at runtime,
following the user’s request for 30% translucency.

The later little-companion addition is documented separately in
[COMPANIONS.md](COMPANIONS.md): one solid painted mouse, three charcoal
fuzzballs and their wooden perch. That guide records their original Blender
source, shared atlas, opaque materials, placements and hopping behavior.
The five adult spirits retain the translucency and behavior documented below.

## Files

| File | Role |
| --- | --- |
| `newspaper-reader.blend` | Editable reader source with individual components and packed atlas |
| `passengers.blend` | Editable sleeper, moth, gardener and keeper sources with packed atlas |
| `../../scripts/build-reader.py` / `../../scripts/build-passengers.py` | Rebuild the respective sources, GLBs and metadata |
| `reader-metadata.json` / `passengers-metadata.json` | Exact bounds, node transforms, UV regions and export counts |
| `../../public/assets/spirits/newspaper-reader.glb` / `../../public/assets/spirits/passengers.glb` | Runtime models, each with the same embedded atlas |
| `../../public/assets/spirits/reader-material-atlas.png` | Unchanged native 1254 × 1254 generated material atlas |
| `reader-material-atlas.prompt.txt` / `reader-material-atlas.provenance.json` | Exact atlas prompt, original output path, hashes and inspection |
| `../../output/reader-concept.png` | Native 1586 × 992 generated reader study; not runtime evidence |
| `reader-concept.prompt.txt` / `reader-concept.provenance.json` | Exact study prompt, carriage reference role, hashes and inspection |
| `../../src/train-reader.js` / `../../src/train-passengers.js` | Loading, carriage attachment and code-driven gestures |
| `../../src/spirit-material.js` | Shared runtime translucency treatment |
| `../../output/newspaper-reader.png` / `../../output/spirit-passengers.png` | Final actual browser reader and boarding previews |

## Rebuild

The verified local tool is official portable Blender 4.5.15 LTS, installed
under ignored `.tools/blender/`. From the repository root in PowerShell:

```powershell
& '.tools/blender/blender-4.5.15-windows-x64/blender.exe' --background --python scripts/build-reader.py
& '.tools/blender/blender-4.5.15-windows-x64/blender.exe' --background --python scripts/build-passengers.py
```

Another checkout may substitute its Blender executable. Each script rebuilds
its `.blend`, `.glb` and metadata from authored geometry descriptions; neither
regenerates the atlas. Make durable geometry changes in the builders because
rerunning them replaces manual source edits. The reader builder accepts
`-- --render` for a secondary Blender inspection image at
`.impeccable/review/reader-model-three-quarter.png`. Always inspect rebuilt
exports in the actual application; a Blender image is not runtime evidence.

Saved sources retain named individual components. Export combines geometry
only by pose group: seven meshes for the reader and four per added passenger.
There are no baked animation clips; runtime applies bounded transform deltas
and deforms the reader’s flexible page vertices.

## Coordinates and placement

All dimensions below are runtime metres: Y up, +Z toward each figure’s front,
origin on the floor and bench cushion at y=0.45. Blender uses Z up internally;
the builders convert authored runtime coordinates and export Y up. Each new
passenger root starts at the origin in its asset; runtime positions it.

| Figure | Carriage-local position | Y rotation | Distinctive form |
| --- | --- | --- | --- |
| Reader | (1, 0.9, -1.9) | -pi/2 | Indigo coat, seedpod face, newspaper and bag |
| Sleeper | (1, 0.9, 2.4) | -pi/2 | Broad ochre coat, hat and lap satchel |
| Moth | (-1, 0.9, -2.8) | +pi/2 | Small ivory cloak, folded wings and feathery antennae |
| Gardener | (-1, 0.9, 2.1) | +pi/2 | Long ears, sage smock and potted seedling |
| Keeper | (1, 0.9, -4.5) | -pi/2 | Rust robe, deep hood and sea shell |

The carriage floor is y=0.9, so the authored 0.45m seat meets its cushion at
y=1.35. Both visitor seat anchors remain at z=0. Tests check the actual mesh
bounds through gesture phases for clearance from seats, aisle, doorway,
carriage walls, roof and other passengers. Moth feet intentionally hang above
the floor. All five figures inherit carriage movement.

| Exported figure | Approximate size (width × height × depth) | Triangles |
| --- | --- | --- |
| Reader | 1.018 × 1.723 × 0.800m | 32,672 |
| Sleeper | 0.900 × 1.464 × 0.788m | 11,852 |
| Moth | 0.565 × 1.262 × 0.624m | 14,454 |
| Gardener | 0.666 × 1.755 × 0.758m | 13,778 |
| Keeper | 0.666 × 1.506 × 0.768m | 11,912 |

These are resting model bounds including clothing and belongings, not standing
heights. Metadata is the exact numeric source for bounds and node pivots.

The reader hierarchy preserves `ReaderRoot`, `ReaderStatic`, `ReaderBody`,
`ReaderHead`, `ReaderPaper`, `ReaderTurnPage`, `ReaderLeftHand` and
`ReaderRightHand`. Each added figure has its ID root (`Sleeper`, `Moth`,
`Gardener`, `Keeper`), a `Static` and `Body` child, then `Head` and `Action`
children under its body. Prefix each suffix with the figure ID. Body pivots
are (0, 0.62, 0); head and action pivots differ by sculpture and are recorded
in `passengers-metadata.json`. Preserve names and authored transforms: runtime
caches each original position/quaternion and reapplies deltas without drift.

## Animation and inspection

`readerPoseAt(time, reducedMotion)` owns a 119-second cycle:

| Time in cycle | Gesture |
| --- | --- |
| 16–20.8s | First page turn |
| 42–51s | Brief sea glance |
| 72–77.4s | Second page turn |
| 96–102s | Small paper adjustment |
| Other intervals | Reading with slight breathing and body movement |

The user reported that the original turn went away from the reader. The source
leaf now begins behind the base spread, is printed on both sides and remains
hidden at rest. `readerPagePoint` flexes it through the reader-facing local
negative-Z half-space (a conceptual positive Y turn) instead of rotating a
rigid sheet into the coat. Lift also goes toward negative Z. The actual-GLB
regression checks direction, coat clearance and non-accumulating deformation
across seven phases. The right hand gives a brief cue before each turn.

`passengerPoseAt(id, time, reducedMotion)` gives the four new figures independent
cycles, with long rests and three-second eased entries and exits:

| Figure | Cycle | Active interval | Habit |
| --- | --- | --- | --- |
| Sleeper | 137s | 62–74s | Small nod and head tilt into sleep |
| Moth | 131s | 12–22s | Looks toward a distant cloud |
| Gardener | 151s | 34–47s | Looks down and slightly lifts the seedling |
| Keeper | 163s | 90–102s | Looks down and gently turns the keepsake |

The existing visible-frame world clock drives these habits independently of
journey progress. Pausing travel does not freeze them; hidden flat pages skip
world updates. Reduced motion holds all five resting poses and hides the turn
leaf. No gesture adds sound, dialogue or a control.

`window.quietLine.diagnostics.atmosphere.reader` reports `phase`, `turning`,
`pageTurn`, `reducedMotion` and `opacity`. `atmosphere.travellers` is an array
of the four additions with `id`, `name`, `phase`, `reducedMotion` and `opacity`.
Check both seats, every habit, the page from the reader-facing side, night,
mobile and reduced motion after changes.

## Materials and provenance

The native 1254 × 1254 atlas is opaque 8-bit RGB sampled as sRGB. It contains
indigo cloth at image upper left, ivory skin upper right, brown bag material
lower left and **THE TIDE TIMES** lower right. Newspaper microtext is visual
texture, not editorial content. The new sculptures multiply atlas samples by
per-vertex pigment washes for their clothing, faces and objects. UVs stay in
the recorded inset regions; this atlas is not tileable.

| Material region | Blender UV rectangle (u0, v0, u1, v1) |
| --- | --- |
| Cloth | (0.025, 0.525, 0.475, 0.975) |
| Skin | (0.525, 0.525, 0.975, 0.975) |
| Bag | (0.025, 0.025, 0.475, 0.475) |
| Paper, reader only | (0.51, 0.01, 0.99, 0.49) |

The GLBs each contain one authored matte material and the same embedded atlas.
At runtime the cast shares the reader’s actual material/map, including its
small daylight/lantern emissive contribution; the redundant passenger material
and texture are disposed. This avoids a second GPU atlas allocation, but both
GLB downloads still carry the image.

`src/spirit-material.js` sets visible figures and belongings to opacity 0.7.
After water at render order 3, a depth-only silhouette pass at order 4 marks the
nearest spirit surface; the color pass at order 5 blends that surface once.
This prevents internal cloth/limb overlaps becoming opaque patches. It is
nearest-surface translucency, not volumetric refraction. Depth meshes share
visible geometry without duplicate vertex buffers. Their extra submissions
mean 23 authored meshes can require 46 spirit render submissions during a page
turn, or 44 while the turn leaf is hidden, before culling.

The original concept and atlas are separate built-in image-generation outputs.
The concept used an existing carriage browser capture only for identity, with
old UI excluded. The atlas was generated without an image reference. Native
pixels and dimensions are preserved; the exact prompt was embedded under PNG
key `impeccable:prompt` with unchanged IDAT hashes. Adjacent prompt/provenance
records retain full prompts, native output paths, hashes and inspection.
No raster was added or altered for the four-passenger extension.

Current reader GLB: 4,207,944 bytes, 32,672 triangles, seven primitives.
Current four-passenger GLB: 4,746,744 bytes, 51,996 triangles, 16 primitives.
The shared atlas uses about 8 MiB decoded as RGBA8 with mipmaps. These
construction figures do not establish sustained headset frame time.

## Verified scope

All 79 automated tests and the production build pass; the existing warning
about a JavaScript chunk over 500 kB remains. Final browser QA in
`.impeccable/review/passengers-result.json` reports passed with no errors and
references 18 captures. It covers loading, both seats, all four gestures,
reader-facing page motion, departure/pause/return, night, 390px mobile and
reduced motion, with all five opacity values at 0.7. The fresh **ship** review
in `passengers-finish-review.md` inspected all 18 captures and found no material
fixes. It did not review continuous WebM motion or independently inspect the
builder scripts. A natural-turn recording is retained under `passengers-video/`.

The earlier one-reader **ship** review is historical: the user subsequently
caught the reversed page turn, so it cannot certify this fix. The original
opaque reference remains at `.impeccable/review/reader-left-reading.png`.
No physical Quest stereo, comfort or sustained frame-time check was performed.
No new VR control target was introduced. Current work remains local,
uncommitted and unpublished on `codex/newspaper-spirit`; the deployed
controls/audio release remains `07d5af8`. Existing design-system files are
preserved. The provenance scan still covers six rasters with zero missing records.
