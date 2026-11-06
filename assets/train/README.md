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
| `materials.json` | Atlas regions, safe UV coordinates and provenance |
| `../../public/assets/train/carriage.glb` | Runtime asset, with one embedded atlas |
| `../../public/assets/train/carriage-material-atlas.png` | Original 1254 × 1254 native generated artwork |
| `../../public/assets/train/carriage-material-atlas.exact.prompt.txt` | Exact generation prompt, also embedded in the PNG |
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

The station remains independent at (-3.4, 0.6, -3) on the raised grassy shore.
`src/travel.js` moves the train, visitor rig and ticket together along the 1.1km
route, with a 3m/s cruise. Boarding, seat changes and return use explicit faded
placements. There is no water-plane teleport or moving station.

## Material provenance and cost

The opaque RGB sRGB atlas has maroon enamel, cream enamel, walnut and red
moquette quadrants. The generation prompt requested 1024 square; native output
was 1254 square and is preserved at that size. Only exact-prompt metadata was
added to the project PNG; its pixels and opacity were preserved. `materials.json`
records the retained original output path and safe UVs, including Blender's V
inversion. The atlas is not tileable; keep UV islands inside their inset regions.

References: [exterior](https://images4.alphacoders.com/127/thumb-1920-1274022.jpg)
and [interior](https://images5.alphacoders.com/501/thumbbig-501188.webp). Copies in
`.impeccable/review/` are ignored local inspection aids, not runtime assets.

Current export: 42,580 triangles, seven mesh primitives, five materials and
3,941,940 bytes. The one 1254 × 1254 atlas is about 8 MiB decoded as RGBA8 with
mipmaps. Low-opacity double-sided glass uses no transmission render target but
can add a pass. Seven primitives are not a promise of seven actual draw calls.

The asset checks, 47-test suite and production build pass. Independent browser
QA and the fresh **ship** visual verdict cover the first carriage/window-seat
milestone. Captures include both seats, aisle, exterior, daylight/night and
mobile controls. No physical Quest stereo, comfort, controller, audio-balance
or sustained frame-time validation has been performed. This milestone is local;
the published site was not updated in this pass.
