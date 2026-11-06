# A carriage with a history

Mode: Experience. The user approved the proposed worn, cared-for carriage and
asked to implement it, targeting Quest 3/3S. Extend the existing painted world;
preserve its structure, passengers, companions, controls and independent gaze.

THESIS: Years of quiet journeys are visible in the surfaces and small belongings.
OWN-WORLD: Butter-cream enamel, oxblood coachwork, warm walnut, faded brick-red
cushions, handmade railway notices and a clear blue view. Wear follows use:
polished armrests, sun-faded fabric, a few careful repairs and doorway scuffs.
STORY: The traveller discovers an illustrated route, a faded seaside notice,
small carriage lettering and a forgotten fabric bundle. Surfaces have variation
without becoming dirty or abandoned. Keep breathing room around these details.
FIRST VIEWPORT: The normal boarding and seated views feel less uniform; the
changed upholstery, timber and notices are visible within the existing scene.
FORM: Generated painted atlas plus offline Blender geometry/UV/vertex shading.
Bake permanent creases, wear and soft contact shading at creation time; retain
changing daylight separately. Static belongings and signs join existing opaque
material batches. No new per-frame animation, live lights, shadow passes,
transparent effects or UI. Aim to keep seven carriage primitives, five
materials and one atlas, below the existing 50k triangle/32 MiB texture caps.
FINISH: Before/after browser views and draw/triangle/texture counters; exported
geometry, loading and existing regressions; desktop/mobile/day/night review.
The headset remains the authority for actual frame-time and comfort limits.
Independent finish review and documentation; preserve DESIGN.md and its sidecar.

This is a local feature extension of an approved world, not a new composition
or visual identity. The user explicitly delegated execution with “I love it...
do it.” No additional concept approval is necessary. No commit or publication.

## Implemented result and review

The local asset now has faded red cloth with two repairs restricted to upward
cushion faces, rubbed walnut/cream enamel, a right-header route notice reading
THE QUIET LINE / REED BANK / SEA GLASS / LANTERN PIER, a rear Lantern Pier poster
and 03 plate, a folded rear scarf and forward cloth parcel. Static vertex
shading grounds floor, benches and trim. Signs and belongings join the existing
opaque batch; changing daylight, inhabitants, controls and gaze remain intact.

One native opaque 1536 × 1024 built-in image-generation output supplies all new
paint. `assets/train/lived-in-materials.json` and the adjacent exact-prompt file
record provenance and UVs. The original atlas remains historical source.
Floor UV stretch/tint was corrected in one batch before final review.

The export has 45,097 triangles, seven primitives, five materials and one atlas
at approximately 8.00 MiB decoded with mipmaps. Against the rear-wall baseline,
geometry adds 2,285 triangles, estimated texture memory 1,856 bytes, and the
5,406,204-byte GLB adds 1,455,112 download bytes. All 13 matched browser views
retain their draw-call counts. No new runtime JavaScript, lights, shadows or
animation are required.

`review/character-verification.md` records 95 passing tests, a successful build
with the existing chunk warning, error-free browser checks and seven rasters
with complete provenance. The independent `review/character-finish-review.md`
returns **ship**: all 19 final captures are valid and no material fixes remain.
`output/carriage-character.png` is the final left-rear browser capture.
The user accepted the finished result: “I think we nailed it,” and requested
adding, committing and pushing the work. The local preview server was stopped
at their request. Physical Quest frame time, stereo and comfort remain
unmeasured; DESIGN.md and its sidecar are preserved.
