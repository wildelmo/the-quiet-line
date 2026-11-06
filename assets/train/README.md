# Original Quiet Line carriage

One editable Blender carriage with a usable interior, exported for the local
WebXR experience. This is original geometry and an original painted atlas;
the user's exterior/interior references guide proportions and materials only.
No source image pixels, downloaded model or extracted model parts are used.

## Files

| File | Role |
| --- | --- |
| `carriage.blend` | Editable Blender source, with packed painted atlas |
| `../../scripts/build-train.py` | Rebuilds source, GLB and metadata |
| `carriage-metadata.json` | Dimensions, anchors and measured export counts |
| `lived-in-materials.json` | Current atlas regions, safe UV coordinates and provenance |
| `materials.json` | Historical original-atlas UVs and provenance |
| `../../public/assets/train/carriage.glb` | Runtime asset, with one embedded atlas |
| `../../public/assets/train/carriage-lived-in-atlas.png` | Current 1536 × 1024 native generated artwork |
| `../../public/assets/train/carriage-lived-in-atlas.exact.prompt.txt` | Current exact prompt, also embedded in the PNG |
| `../../public/assets/train/carriage-material-atlas.png` | Historical 1254 × 1254 native artwork; not embedded in the current GLB |
| `../../public/assets/train/carriage-material-atlas.exact.prompt.txt` | Preserved original prompt, also embedded in the historical PNG |
| `../../src/train.js` | GLB loader, door movement and lighting adaptation |

## Rebuild

The current verified tool is official portable Blender 4.5.15 LTS, installed
under ignored `.tools/blender/`. From the repository root in PowerShell:

```powershell
& '.tools/blender/blender-4.5.15-windows-x64/blender.exe' --background --python scripts/build-train.py
```

Append `-- --render` for secondary Blender inspection renders. Another checkout
needs Blender installed separately and may substitute its executable path.
The script rebuilds the model from source; it does not regenerate the painted
atlas. Inspect the exported asset in the actual browser after rebuilding:
Blender renders alone do not establish runtime appearance or Quest performance.

## Geometry and coordinates

Runtime coordinates use Y up and -Z forward. Home is (0, 0, -4). Body width is
2.92m, length 16.1m, floor height 0.9m and roof height 3.758m. Carriage-local
floor anchors are boarding (-0.55, 0.9, 5), left seat (-0.86, 0.9, 0), and right
seat (0.86, 0.9, 0). These place the tracked head horizontally while retaining
real XR head height. The desktop view uses authored standing/seated eye heights.

Real window openings frame the ocean. Red longitudinal bench cushions, dark
timber frames, floorboards, rounded roof, hanging straps and lamps form the
interior. `DoorLeftForward` and `DoorLeftRear` slide at the left boarding opening;
its clear width is 1.35m. Doors close on departure and reopen at the home berth.

The rear maroon lower body consists of two side panels and a sill below the
cream door. The previous full-width body and door both placed an interior face
at z=7.49, producing viewpoint-dependent maroon tearing. Splitting the body
removes that overlap while retaining the painted door and exterior enclosure.
The exported-geometry regression in `tests/train-asset.test.js` checks 28 opaque
ray probes across the lower wall for closure and one nearest front surface.

The station remains independent at (-3.4, 0.6, -3) on the raised grassy shore.
`src/travel.js` moves the train, visitor rig and ticket together along the 1.1km
route, with a 3m/s cruise. Boarding, seat changes and return use explicit faded
placements. There is no water-plane teleport or moving station.

## Material provenance and cost

The current 1536 × 1024 opaque RGB sRGB atlas supplies worn oxblood and cream
enamel, walnut, faded plain and repaired red cloth, and two illustrated notices.
It is one built-in image-generation output with no revisions or pixel edits;
only exact-prompt metadata was added. `lived-in-materials.json` records native
provenance, exact field boundaries, safe UVs and Blender's V inversion. The atlas
is not tileable; keep UV islands within their safe regions and grain aligned
to the timber. The editable Blender source packs it; the GLB embeds one copy.

Two upward cushion faces carry small stitched repairs. The upper right route
notice reads THE QUIET LINE, REED BANK, SEA GLASS and LANTERN PIER. The rear wall
carries a Lantern Pier poster and 03 plate. The rear scarf and forward tied
cloth parcel are opaque static geometry in the existing painted batch.
Soft floor/bench/trim shading is stored in vertex colors; existing day/night
lighting remains active. One refinement batch corrected floor UV stretch and
tint before final review. No runtime JavaScript, live lights, shadow passes or
animation were added for this treatment.

References: [exterior](https://images4.alphacoders.com/127/thumb-1920-1274022.jpg)
and [interior](https://images5.alphacoders.com/501/thumbbig-501188.webp). Copies in
`.impeccable/review/` are ignored local inspection aids, not runtime assets.

Current export: 45,097 triangles, seven mesh primitives, five materials and
5,406,204 bytes. The atlas is about 8.00 MiB decoded as RGBA8 with mipmaps.
Against the rear-wall export, the addition is 2,285 triangles: 1,936 for floor
vertex shading, 177 for notices/numbering and 172 for belongings. Download size
grows by 1,455,112 bytes; estimated texture memory grows by 1,856 bytes from
7.99823 MiB. All 13 matched browser views retain their draw-call counts.
Low-opacity double-sided glass uses no transmission render target but can add
a pass. Counts and desktop samples do not establish Quest performance.

All 95 tests and the production build pass in the retained `character-*` logs;
the existing 732.63 kB JavaScript chunk warning remains. The final exported-asset
checks cover rear-wall closure, upward-only repairs, inward notices, readable
UV orientation and costs. Browser checks report no errors across 19 captures,
including both seats, day/night, mobile and the user's viewport, with boarding,
departure, pause and return exercised. `character-finish-review.md` returns
**ship** with all 19 captures valid and no material fixes. The user accepted
the finished result: “I think we nailed it.” Provenance scan:
seven rasters, zero missing. See `.impeccable/review/character-verification.md`.
`output/carriage-character.png` is the final left-rear browser capture.
This extension is maintained on `codex/newspaper-spirit`.

## Historical atlas and rear-wall evidence

The original 1254 × 1254 atlas and `materials.json` remain historical source,
with their pixels, UVs and provenance retained. Its generation prompt requested
1024 square; the native 1254-square output was preserved with only prompt
metadata added. It is no longer embedded in the current GLB.

The rear-wall repair produced 42,812 triangles and a 3,951,092-byte GLB, adding
232 triangles and 9,152 bytes to the historical
42,580-triangle, 3,941,940-byte export. Materials, primitive count, atlas pixels
and provenance were unchanged at that milestone. No new image was generated.

At that repair milestone, all 90 tests and the production build passed. The regression fails
on the old GLB and passes on the rebuilt asset. Post-fix browser evidence covers
19 captures across both seats, the user's viewport, boarding, eye-contact/rest
framing, night, mobile, travel, separate exterior asset inspections and five
frames from a slow looking sweep. The original reviewer returned **ship** in
`rear-wall-verdict.md`, opening all 19 captures and resolving its two findings
without visible repair-induced material regression. The verdict covers those
two fixes only; its initial **fix** review supersedes earlier approval for this defect.
The retained WebM has not received continuous-playback visual certification.
This repair is local, uncommitted and unpublished.

At the historical first carriage milestone, the asset checks, 47-test suite and
production build passed; the then-current **ship** review covered both seats,
aisle, exterior, daylight/night and mobile controls. That train milestone was
subsequently deployed. No physical Quest stereo, comfort, controller,
audio-balance or sustained frame-time validation has been performed.
