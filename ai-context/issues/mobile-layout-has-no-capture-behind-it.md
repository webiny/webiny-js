# The mobile layout has no capture behind it

> **Package:** `@webiny/api-component-extraction` (capture, then Generate)
> **Severity:** medium. Every generated component's mobile layout is the model's invention.
> **Status:** open. Found 2026-10-12 (`scripts/baseline/reports/2026-10-12/site-qualities-scoping.md`).
> This is the work that would make a "Mobile layout pass applied" item on the Site step true; until it
> lands, the item is not shown.

## What capture records at the narrow width

Capture loads every page twice: at 1440×900 and at 390×844 (`PageCaptureService.ts:25-26`). The narrow
pass stores one full-page screenshot and nothing else. Its evaluator returns `tree: null`
(`PageCaptureService.ts:53`), so there are no elements, no boxes and nothing linking it to the desktop
tree. No stage reads it; only the run-image route serves it.

The picture itself is good. 71 Westland's home page (rehearsal run, 2026-10-09) is 390×4,539 px, clean,
with the mobile layout plainly visible: the hamburger menu, the stacked cards, the sticky contact bar. One
stitching artefact: a blank band of about 650 px above the sticky bar.

## What Generate gets instead

A section crop from the desktop screenshot, and one generic line from the shared Webiny prompt: "Include
responsive styles using `@media` queries for smaller screens" (`buildComponentPrompt.ts:367`). The model
writes a mobile layout without having seen one.

This is the fourth measured-then-dropped finding in the project.

## What runs instead, until this lands

A generic responsiveness instruction (`quality.responsive`, proposed 2026-10-12) asks for behaviour
(fluid widths, no sideways scrolling at 320px, stacking below 768px, 44px tap targets, wrapping text)
with no capture data behind it, like the focus-outline instruction. It is the weakest of the seven and
is labelled as generic wherever it is reported. The steps below are what would make it an instruction
with data.

## The three steps that make it usable

1. **Record the tree at 390px.** Run the capture evaluator on the narrow pass and store the narrow tree
   beside the desktop one. Capture takes longer per page and stores a second tree.
2. **Match each desktop section to its narrow counterpart.** Both loads hold the same content, so a
   section's text and image sources identify it at either width. Store the match on the segment, with a
   confidence, and leave a section unmatched rather than guess.
3. **Crop the narrow section and send it beside the desktop crop.** One more reference image per
   Generate call (more tokens and model cost), with an instruction to match what it shows: stacking order,
   what collapses (the menu), type sizes at that width.

## The re-capture cost

Existing runs have no narrow tree, so **no site benefits until it is re-captured** and its components
regenerated. Re-capture changes the run's segments, so the whole chain re-runs: capture, segment,
cluster, plan, generate (model cost), approve. For a site already on the demo path, that is a new run,
not a patch.
