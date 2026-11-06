# Stable rear wall

Mode: Experience. Repair the camera-dependent maroon speckling across the cream
lower rear door shown in the user's `Visual.aberration.png`. The user image
overrides the earlier visual reviews; a fresh independent review returned fix.

The exported rear lower body and cream door both have an interior face at
z=7.49, confirmed by duplicate-depth ray intersections on the shipped GLB.
Split the maroon body into the two surrounding panels and a sill below the
door, retaining the cream door, painted materials and exterior silhouette.

Verify the actual exported geometry, both normal seat viewpoints, the user's
1354px viewport, near-rear boarding, eye-contact/rest framing, night, mobile,
travel and a slow looking sweep. Include separate exterior asset inspection
cameras. Preserve spirit translucency, companion behavior, rendering, controls,
DESIGN.md and its sidecar. No commit, publication or physical Quest claims.

Finish through the original reviewer's verdict on its two material findings
and a documentation update with source/export statistics and honest limits.

## Implemented evidence — locally reviewed

The builder now uses two maroon side panels and a sill below the cream door.
Rebuilt `carriage.blend`, `carriage-metadata.json` and `carriage.glb` contain
42,812 triangles, seven primitives, five materials, one unchanged 1254 × 1254
atlas and 3,951,092 bytes. This adds 232 triangles and 9,152 bytes to the
historical export without changing primitive, material or atlas counts.

The new exported-geometry regression casts 28 opaque rays across the lower
wall, requiring a closed enclosure and one front surface. It fails on the old
GLB with identical nearest depths and passes on the rebuild. All 90 tests and
the production build pass; the existing chunk advisory remains. The Python
builder-only detector reports no findings, which does not assess geometry.
Six shipping rasters have zero missing provenance records; no new image exists.

Post-fix browser QA passed without reported errors across 19 captures: both
seats, the user's 1354 × 849 viewport, near-rear boarding, eye-contact/rest
framing, night, 390px mobile, travel, two exterior asset inspection cameras and
five frames from a slow actual-time yaw/pitch sweep. The exterior views use
the production world/GLB and are not available user viewpoints. The parent
inspected all 19 frames and found the wall clean. The retained WebM has not
been played through by an observer; no subjective continuous-motion approval
or physical Quest claim follows. The original reviewer returned **ship** in
`rear-wall-verdict.md`, independently opening all 19 valid captures and
resolving both findings without visible repair-induced material regression.
That verdict covers these two fixes only, not the whole world.

`output/rear-wall-fixed.png` preserves the repaired left-seat view. Earlier
previews and milestone counts remain historical. This work stays local,
uncommitted and unpublished on `codex/newspaper-spirit`; deployed main/origin
remains `07d5af8`. `DESIGN.md` and its sidecar are unchanged.
