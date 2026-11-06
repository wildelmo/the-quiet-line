# Train asset research and implementation handoff

Status: Astra completed the focused research. Findings are saved in
[TRAIN_ASSET_RESEARCH.md](TRAIN_ASSET_RESEARCH.md). The user subsequently
authorized a fleet of agents to implement the plan. The research-only limits
below record the completed research task; they do not block the newly
authorized implementation. One original Blender carriage and its window-seat
ride are now implemented. The fresh finish review returned **ship** for that
milestone; 47 tests and the production build pass. The public site has not been
updated in this pass. Current evidence and limitations are in `WORKFLOW.md`,
and the rebuild guide is `assets/train/README.md`.

## Research-stage direction — historical

The user approved researching a Blender-based asset workflow before creating
the train. This stage is research and planning only. The current procedural
dragon looks too smooth and does not meet the user's artistic expectations;
the earlier visual-review verdict does not override that feedback.

Replace the drifting-station concept in the next implementation phase. The
station should stay fixed on a raised shoreline or small island beside the
tracks. A train carries the visitor, with a usable interior and window seats.
Preserve the bright deep-blue sky, sparse soft painted clouds, ocean, islands,
and visitor-controlled view.

## Visual references

- [Train exterior](https://images4.alphacoders.com/127/thumb-1920-1274022.jpg):
  cream upper body, maroon lower body and roof, rounded roof profile, sloping
  cab ends, two connected carriages and repeated framed windows.
- [Train interior](https://images5.alphacoders.com/501/thumbbig-501188.webp):
  red bench upholstery, dark window frames, hanging hand straps and generous
  views of the sky and water.
- Local reference copies are in `.impeccable/review/train-reference-1274022.jpg`
  and `.impeccable/review/train-reference-501188.webp`. This directory is ignored;
  use the source links if the copies are absent in another checkout.

The references guide the carriage's proportions and material character.
Passengers and recognizable film characters are outside this research task.

## Focused Astra research task

Model: `gpt-6-astra`. Reasoning effort: `xhigh`. The delegation interface exposes
no separate fast-mode switch. Use a fresh context and return a short summary;
keep the detailed evidence in `TRAIN_ASSET_RESEARCH.md`.

Find at most four credible existing train or tram models that could become a
convincing rideable carriage. Prefer a usable interior and editable materials
over exterior-only resemblance. Search primary creator or marketplace pages
and inspect each shortlisted asset's actual page. Use a bounded first pass of
roughly eight to ten targeted searches; stop when a useful decision is possible.

For each candidate record:

- Direct source URL, creator, and date checked.
- Exterior/reference fit and the specific interior evidence: seats, floor,
  ceiling, window openings, doors and cab where applicable. Label unconfirmed
  or inferred details explicitly.
- File formats, editable source availability, texture setup, mesh counts and
  material counts when published. Do not invent missing specifications.
- Listed price and currency when shown; do not purchase anything.
- Published license and attribution terms, with source links. Flag uncertainty
  about modification and redistribution as assets embedded in a public web
  application. A download button or a generic marketplace license does not
  establish that every depicted character or design is cleared.
- Adaptation work: proportions, roof/cab, window geometry, upholstery, painted
  textures, door separation and optimization for Quest.

Rank the shortlist and choose the strongest route: adapt an existing model,
author one carriage in Blender, or request an artist-created base. A finding
that no suitable model is confirmed is useful; do not force a recommendation.
Briefly assess whether image-to-3D would help, without installing or running it.

Also identify three to five engineering risks involving boarding and seats,
head tracking, materials/export, asset cost and the stationary platform. This
is a focused decision brief, not a comprehensive tool survey or a build task.

## Research boundaries and output

- Read repository source as needed; do not modify application code or assets.
- Do not generate artwork or meshes, download model archives, install tools,
  purchase assets, publish, commit, or spawn more agents.
- The only permitted research write is `TRAIN_ASSET_RESEARCH.md` in this repo.
- Report confirmed findings separately from assumptions and unresolved facts.
- Finish with a ranked shortlist, a recommended next action, and a checklist
  for accepting one carriage. Return at most about 200 words to the parent;
  detailed citations and comparisons belong in the report file.

## Proposed ride mechanics — research handoff, now implemented

These were the agreed design direction at the research handoff. The current
implementation realizes the first carriage, seat and fixed-platform behavior;
return uses an explicit faded placement back at the original station.

1. Start at a stationary, raised platform beside the track.
2. Board a stopped train with an explicit action and a brief fade.
3. Choose a window seat; maintain natural head tracking and leaning.
4. Depart smoothly. The carriage and traveller move together while the station
   and landscape remain in place. Do not force camera bobbing or rotation.
5. Provide pause and return controls. Disembarking occurs while stopped.

Begin with one convincing carriage and a window-seat view inside the actual
web experience. Judge the visual quality and scale before expanding to the
whole train, additional stations or extensive journey mechanics. A good Blender
render alone does not establish the exported browser appearance or Quest speed.

## Repository starting point — historical research snapshot

- Stack: Three.js, native WebXR, Vite, plain JavaScript.
- `src/main.js` currently translates the entire station with the traveller
  during drift. That behavior is to be replaced, not carried into the train.
- `src/travel.js` handles boarding offsets and traveller/deck/ticket translation;
  `src/xr-pose.js` preserves tracked position and snap-turn behavior.
- `src/motion.js` defines the current journey, speed and waypoints.
- `src/world.js` assembles the environment; `src/station.js` builds the station.
- Inspect the movement, travel and XR tests under `tests/` before changing the
  boarding model.
- Last implementation verification: 42 tests and production build passed.
  Actual Quest comfort, scale, stereo clarity and sustained speed remain untested.
- The working tree includes earlier uncommitted scene work. Preserve it.
- Blender was not found on PATH or in the common Program Files location during
  the initial check. Installation and integration are separate later steps.

## Resume in a new session

Read `WORKFLOW.md`, `PRODUCT.md`, `DESIGN.md` and `assets/train/README.md` for the
implemented carriage before using this historical research plan. The original
Blender route was selected; there is no outstanding model purchase decision.
The first carriage and window-seat milestone passed local functional and visual
review. Actual Quest validation and any deployment are separate next steps.
Do not treat the historical dragon review as user acceptance: its appearance
was criticized, and the carriage work leaves it unchanged.
