# A section crop can show something other than the component

> **Package:** `@webiny/api-component-extraction` (`SegmentHandler`, `boundaries`)
> **Severity:** medium — at least 1 of 34 components across the four sites. The failure arrives in the
> Generate view wearing a generation defect's clothes, and is recorded as a successful render.
> **Status:** open. Diagnosed in `plans/component-extraction-visual-fidelity-report.md`.

## What happens

2424 Tulane's _Specials Section_ has a **1440x900 crop of the entire homepage hero** — building
photo, logo, phone number, "LIVE YOUR MOMENT", the CTA and a strip of gallery thumbnails.

The component it describes is the small vertical **"SPECIALS"** tab fixed to the left edge of the
viewport. That tab is the only thing in the region with its own direct text, which is why the
representative's digest has exactly one text where the crop shows a dozen.

Segment drew the boundary around a **fixed-position overlay** and took in everything behind it.

## What it does downstream

- The model is handed a photograph of a hero and asked to build a component whose one preserved
  string is "Specials". It builds the tab. That is the right answer to the contract it was given.
- The render has a **document height of 0**, because the tab is absolutely positioned and contributes
  no document height. The screenshot falls back to the full viewport, so the stored render is a
  1440x900 image that is almost entirely blank.
- It is recorded `ok: true`. `pageErrors` is empty. `bodyPreview` was captured (it only is at zero
  height) and shows the component's own CSS present and the body holding a Suspense marker.
- The old visual-similarity score gave it **0.34**, the lowest of all 34 components — the one place
  the score looked informative, and it was pointing at Segment rather than at Generate.

## Why it matters beyond one component

Three separate signals agreed on the wrong subject. A reviewer looking at the Generate card sees a
rich source crop beside an almost-blank render and concludes the generation failed. The generation
did not fail; the reference image does not depict the component.

Two things to separate when this is fixed:

1. A fixed or sticky element should not become a section whose box is the viewport behind it.
2. A render whose document height is 0 should not be recorded as a success. The `bodyPreview` field
   exists for exactly this case and currently only informs a reader who goes looking for it.

## It also corrupts the colour measures (added from the colour-fix acceptance)

The same component is the largest single contributor to both colour numbers in the acceptance run,
and in neither case is colour the cause:

- It reads as "a theme colour the section does not have" at a background distance of 268. The render
  is the yellow SPECIALS tab in the section's own `#e0e299`; the crop is the building photograph.
- It contributes **four of the six "invented" dominant colours**, all quantised shades of that same
  `#e0e299`.

Because the hero's background is an `<img>`, it has no `backgroundColor` to measure, so
`resolveSectionColours` correctly reports the tab's colour as the section's only painted background.
Every stage is doing the right thing with the boundary it was given.

**Any measure that compares a render against its section crop inherits this.** Where a component is
scoped narrower than the section its crop shows, the comparison measures the scoping.
