# The visual-similarity score rewarded the failures it should have caught

> **Package:** `@webiny/app-component-extraction` (`GenerateView`),
> `@webiny/api-component-extraction` (`ComponentRenderService`)
> **Severity:** high while it was on screen — it sat directly beneath the three real assertions and
> was coloured green above 0.85, so it certified the worst components in the set.
> **Status:** **fixed.** The score is gone from the view and no longer computed; the card now states
> the render's height against its section's. See _The replacement_ below.

## What it was

```ts
sharp(bytes).resize(64, 64, { fit: "fill" }).greyscale(); // both images
// then 1 - (mean absolute difference / 255)
```

Both images are forced to the same 64x64 greyscale grid. That destroys aspect ratio, discards colour
entirely, and reduces each image to coarse average brightness. What survives is "are these two
pictures about equally bright", which is not a question anyone was asking.

## What it did on real components

Measured across 34 components on four sites:

| component                                   | what is wrong with it                                                     | score                                          |
| ------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------- |
| 71 Westland · Explore Fenway Forward Intro  | rendered **8.1x taller** than its section — contains four other sections  | **0.97**                                       |
| Park city Palace · Site Footer              | 2.4x too short, **every image missing** — logo, both icons, the W3C badge | **0.97** — highest on its site                 |
| 71 Westland · Accessibility Statement       | 4.6x too tall                                                             | 0.96                                           |
| Park city Palace · Property Highlights Grid | **the most faithful component in the set**                                | **0.80**                                       |
| 2424 Tulane · Specials Section              | a Segment defect, not a generation one                                    | 0.34 — lowest, and pointing at the wrong stage |

Mean by band: too tall 0.73, too short 0.81, in band 0.86. The bands barely separate, and within them
the ordering is close to inverted. A component that renders almost entirely blank scores well against
a light source crop, because blank and light are the same thing to this measure.

## Why relabelling was not enough

It was drawn in the right-hand column of the Generate card, immediately below `Text preserved`,
`Contract conformant` and `Token binding` — three assertions that are real — in the same bordered
block style, with a progress bar and a green/amber/red threshold. Everything about its placement said
"fourth assertion". A reviewer scanning the column for red saw three greens and a green, and moved on
past a component containing four other sections.

A number in that position is read as a verdict whatever its label says, and a wrong verdict beside
three right ones is worse than no verdict: it is the one that decides the scan.

## The replacement

Two measured heights and no derived number:

```
Section height    202px
Render height    1644px
8.1x taller than its section
```

- **Measured, not derived.** The section height is the crop's own, recorded where the score used to
  be computed; the render height is the document height already captured.
- **No bar and no threshold colour**, so it cannot be scanned as a pass/fail. The ratio is stated in
  words only when it leaves the 0.67–1.5x band, which is the band the report found meaningful.
- It also states a **width mismatch** when the crop and the render are different layout widths — see
  `three-components-were-compared-at-mismatched-widths`.

Height is not a fidelity measure either, and is not presented as one. It is the one quantity that
separated the failure families in the diagnosis, it is checkable against the two images directly
above it, and being obviously partial it does not invite anyone to stop looking.

This also brings Generate into line with the composed-pages view, which had already reached the same
conclusion for whole pages and recorded it in `PageSignals`:

> There is no similarity score here and there should not be one. A whole-page number is worse than
> nothing.
