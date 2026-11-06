# Train asset decision brief

Checked **5 November 2026**. Scope: ten targeted web searches, primary creator/marketplace pages, public preview images and metadata, the two supplied references, and a read-only review of the movement/XR code. No model archives, purchases, installations, generated artwork, or application changes. This brief follows [TRAIN_RESEARCH_PLAN.md](TRAIN_RESEARCH_PLAN.md).

## Decision

**No high-quality, ready-to-adapt base is fully confirmed for this particular carriage and public Three.js/GLB delivery.** Real interiors exist, but the best lightweight candidates need substantial visual redesign; the more detailed candidates introduce optimization and distribution questions. A marketplace render does not establish close-up quality inside a headset.

**Strongest route: author one original carriage in Blender, with deliberate texture painting, preferably by an environment artist.** Begin with one finished window-seat bay and a simple complete shell. The important work is the carriage's proportions, soft upholstery, dark timber frames, believable window depth, and painted surface treatment. None of the reviewed purchases clearly removes that work.

If retaining an asset-first workflow, **candidate 1 is the only recommended first geometry inspection**: free, small, and explicitly CC BY. Treat it as a possible geometry donor, not an accepted visual base. Inspect its native download and topology in a later authorized step before committing. If the roof, windows, benches, UVs and door construction all need replacing, proceed with the original carriage rather than accumulating more donor assets. Do not purchase candidates 2–4 on the evidence here alone.

## Ranked shortlist

Ranking reflects usefulness to this project, including public-web delivery, rather than marketplace polish. All counts are published claims/metadata, not measurements from downloaded files. No candidate's object/mesh count has been confirmed; triangle, polygon and material counts below are separate quantities.

### 1. Train with Interior Low Poly — 00amza

[Creator listing](https://sketchfab.com/3d-models/train-with-interior-low-poly-c59afdd9e83b4eaa805bd3f657ad8803) · [public model metadata](https://api.sketchfab.com/v3/models/c59afdd9e83b4eaa805bd3f657ad8803)

- **Evidence:** The creator's preview shows an open doorway, a floor, blue bench seating, inner walls and framed see-through windows. Rounded roof, rectangular windows and repeated bays offer useful structure. It is a weathered blue commuter carriage, with upright ends rather than the reference's sloping cab. Ceiling completeness, cab detail and independent door objects remain unconfirmed.
- **Published specification:** Free download; 9,251 triangles and 6,325 vertices for the uploaded model, three materials, three textures, zero animation clips in the API. Per-car allocation, texture dimensions, UV quality, native source format and downloadable format options are unconfirmed. Do not mistake the description's animation wording for an included rig.
- **Adaptation:** Reshape ends, adjust window rhythm, simplify roof details, soften/redesign benches, add straps and repaint the entire carriage. The supplied preview is not the requested painted finish.
- **License:** Metadata identifies **CC BY 4.0**, including commercial use. This is the clearest published redistribution basis here, subject to provenance and attribution; uploader ownership is not independently established.

The [CC BY 4.0 terms](https://creativecommons.org/licenses/by/4.0/) permit adaptation and redistribution with credit, a license link and disclosure of changes. Preserve those notices in the application and asset provenance. That license does not establish rights the uploader did not hold.

### 2. Japan Subway Train + Tunnel — BitSoft

[Creator store and license](https://bitsoft.itch.io/japan-subway-train)

- **Evidence:** Inspected creator images show an actual interior: longitudinal benches, floor, ceiling, doors, window frames, poles, overhead racks and hanging straps. Exterior images show views through the windows. The modern silver/blue Meijo Line exterior and green interior are far from the vintage reference.
- **Published specification:** **US$3.05 minimum** at checking. Blender and FBX archive plus a separate Unity package. Middle car: 3,772 triangles; end car: 3,314. One 512×512 texture with lighting already painted/baked into it. Doors can slide. Exact mesh/material totals and cab completeness are unconfirmed; the Unity screenshot shows three material slots on one selected car object.
- **Adaptation:** Strong low-cost structural donor, but requires a new cab/roof treatment, reduced signage, new red upholstery and higher-resolution painted textures for near-eye inspection. Tiny baked textures could work against the desired artistry and changing daylight.
- **License:** Creator permits personal/commercial projects and forbids redistribution as an asset, including modifications. Modification and public delivery of an accessible converted GLB are **not explicitly clarified**. Obtain written clarification for that delivery before selecting it.

### 3. Historical tram — blenderman_cz

[Creator's TurboSquid listing](https://www.turbosquid.com/3d-models/3d-tram-historical-1673458)

- **Evidence:** Listing explicitly includes exterior and interior. Inspected renders show seating and inner walls through transparent windows. Close inspection of floor, ceiling, doorway clearance and seat-side finish is still missing. Cream/red coloring and a rounded roof help; arched windows, upright rounded cab, clerestory and trolley poles differ substantially from the references.
- **Published specification:** **US$9.90**. Native Blender 2.83/Cycles, FBX and OBJ; 107,458 polygons, 110,675 vertices, materials, and n-gons. Not subdivision-ready. Texture maps, UV quality, material count, triangulated cost and separate doors are unconfirmed.
- **Adaptation:** Rebuild window tops and cab, remove roof apparatus, revise seating/straps, paint new surfaces and simplify running gear. This is not demonstrably less work than an original shell.
- **License:** Standard TurboSquid license, with a material public-WebGL restriction described below. Do not interpret the price or included interior as evidence of suitability for deployment.

The [TurboSquid license page](https://www.turbosquid.com/licensing), under Game Uses, restricts accessible model distribution and addresses approval for additional WebGL uses. Plain GLB delivery in this Three.js project is **not confirmed by the default license**. This is a concrete licensing question for TurboSquid, not a conclusion that all browser use is prohibited.

### 4. Japanese Train Interior — MeshHarbor

[Creator's CGTrader listing](https://www.cgtrader.com/3d-models/interior/other/japanese-train-0792c4fc-1aa8-43b8-9ee0-274b3c73e4a6)

- **Evidence:** Inspected interior render shows modeled blue benches, floor, ceiling, doors, window frames, racks and straps, with exterior views through windows. It has the strongest close-up interior presentation of this shortlist, but is modern and visually busy. A usable exterior shell/cab and door separation are unconfirmed.
- **Published specification:** **US$38**. Native Blender/Cycles 5.0, FBX, OBJ and JPG/PNG textures. 224,842 polygons, 229,902 vertices; PBR and overlapping UVs. Texture resolutions, material/object counts and triangulated cost are unpublished. The low-poly label is not a Quest performance result.
- **Adaptation:** Remove advertising and excess fittings, remodel benches/frames, create the exterior and heavily simplify/re-UV/repaint. Likely poor value as a whole-carriage base.
- **License:** Royalty Free. Seller states the advertisements/stickers have cleared rights; this claim was not independently verified. Public GLB delivery remains unresolved under the marketplace terms.

The [CGTrader terms](https://www.cgtrader.com/pages/terms-and-conditions), sections 21A.2–21A.4, address incorporated products, modifications and measures against end-user access to model data. Confirm permission for the specific public GLB delivery rather than treating a royalty-free label as unrestricted asset redistribution.

### Excluded resemblance shortcut

The closely named [Train from Spirited Away by Zefear](https://free3d.com/3d-model/train-from-spirited-away-1940.html) displays **Editorial Only**. Its page does not establish a usable interior or rights for this public experience. It is not shortlisted. A fan model's download/purchase button does not resolve underlying rights.

## Next tool decision

Keep **Blender → image textures → GLB → existing Three.js application** as the pipeline. Blender handles geometry, UVs, separate doors and paintable materials; the browser remains the final appearance test. Choose an actual painting pass, with intentional edge wear, uneven pigment, upholstery variation and soft contact shading. Merely changing solid colors or adding procedural noise would repeat the weakness the user identified.

Image-to-3D is not the recommended carriage route. This is an engineering judgment: repeated window spacing, a continuous usable interior, door clearance and human-scale seating need precise control. Generated geometry would still require verification and likely rebuilding. It could be explored later for isolated decorative props; it is not necessary for this decision. No local AI setup is proposed.

## Five engineering risks

1. **The station currently moves by design, including in tests.** In [src/main.js](src/main.js), the animation loop passes either the cart or station to `translateTraveller`; `toggleJourney` calls `boardStation`, which relocates the station to the user. [src/travel.js](src/travel.js) therefore cannot be reused unchanged. Keep the island/platform fixed in world space, and give the train a separate route-distance value and transform. Travel distance should not be inferred from the viewer rig's position after seating or snap turns. Replace the drifting-station assertions in [tests/xr-travel.test.js](tests/xr-travel.test.js) with fixed-station/moving-train assertions; retain meaningful stereo and tracking-offset coverage.

2. **Boarding, seating and departure need explicit state.** Use stopped-at-platform → boarded → seated → travelling → stopped. Boarding and seat changes place the visitor once at a named carriage anchor with a brief fade; departure moves the train and rig together. Do not relocate the carriage to follow physical head motion. Disembark only at a valid stopped platform. Restrict the present water-plane teleport mechanic while aboard. The current 1.35 m/s and 1,100 m route are existing scene settings, not an accepted train speed or timing specification.

3. **Tracked head pose must remain independent.** [src/xr-pose.js](src/xr-pose.js) composes the rig and tracking-local pose, and its snap-turn correction assumes a direct scene-parent rig. Reparenting beneath the train without revisiting this math can double-transform motion or misapply world-space corrections. For the first straight route, separate scene-root train and rig objects receiving the same travel delta preserve that assumption. Respect measured seated height and room-origin offsets; any seat-height calibration must be an explicit one-time placement. Do not animate headset orientation, clamp leaning, or add camera bob. Test both eyes after sitting, leaning, snapping, pausing and re-entering XR.

4. **Blender appearance is not the exported material.** The [Blender glTF material documentation](https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html) describes supported shader/texture connections. Use an export-compatible material setup with image textures and bake unsupported artistic effects. Check color space, normals, UV seams and interior-facing surfaces in the app's actual lighting and `NoToneMapping` setup. Painted contact shading should not bake a contradictory sun direction into a day/night scene. Start with restrained single-layer window glass; judge sorting and sky visibility in both eyes before adding reflective effects.

5. **Quest cost includes draws, transparency and texture memory.** Proposed starting budget for the first carriage: **≤50,000 exported triangles, ≤12 visible draw calls per eye, and ≤32 MiB resident texture memory including mipmaps**. These are project design caps, not Meta guarantees. Share atlases/materials and merge static repeated pieces while preserving doors and sensible culling boundaries. Profile the whole ocean scene on the intended headset at its selected refresh rate, including night lighting; desktop FPS and GLB file size are insufficient. Meta's [WebXR optimization workflow](https://developers.meta.com/vr/documentation/web/webxr-perf-workflow/) explains why draw calls can dominate independently of triangle count. Measure frame time and sustained behavior before expanding the train.

## One-carriage acceptance checklist

- [ ] A single carriage is shown in the **actual browser scene**, with a chosen window-seat view, an aisle view and an exterior three-quarter view. The user judges the painted quality before another carriage or journey content is added.
- [ ] The seat view has red bench upholstery, dark substantial window frames, visible wall/window depth, hanging straps and an unobstructed blue-sky/water view. Surfaces show intentional painting and soft wear rather than glossy plastic or uniform procedural noise.
- [ ] Exterior proportions read as cream/maroon vintage rail: rounded roof, coherent repeated windows, sloping cab treatment. No film characters are included.
- [ ] Floor, ceiling, seat backs, thresholds and both sides of visible walls are complete. Windows are actual openings with appropriate glass, not opaque pictures. Leaning and nearby stereo views reveal no missing faces, floating surfaces or obvious texture stretching.
- [ ] Metre scale, doorway clearance, seat height and seat-to-window relationship are believable in headset. Named boarding/seat anchors and independently movable doors exist; UVs and source `.blend` remain editable.
- [ ] The exported GLB reproduces the agreed painting in daylight and dusk. Texture files are embedded or correctly packaged; materials need no Blender-only effects. Source, license, credit and modification records accompany it.
- [ ] Boarding and departure leave the raised station fixed. Train/rig offsets remain stable through pause and return; physical leaning and both rendered eyes behave naturally. No forced head rotation or camera bob is introduced.
- [ ] Exported geometry, draws and resident textures are recorded against the proposed caps. Actual target-headset frame-time and comfort checks pass at the selected refresh rate before duplicating the carriage or extending the ride.

Research is complete; implementation and physical-headset validation have not begun.
