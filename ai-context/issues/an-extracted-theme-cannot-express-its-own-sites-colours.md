# An extracted theme cannot express its own site's colours

> **Package:** `@webiny/api-theme-extraction`
> **Severity:** medium — 26 of 206 measured colours across the four sites have no token near them,
> and every one of those becomes a hardcoded hex in a generated component.
> **Status:** open. Measured in the colour-fix acceptance,
> **Planned resolution (2026-10-09):** closed by option B of the in-pipeline theme work: a theme built
> from the pipeline's own measurements of type, colour and spacing, across more pages than extraction
> reads (`packages/api-component-extraction/scripts/baseline/reports/2026-10-09/theme-extraction-in-pipeline-investigation.md`).
> Not patched in extraction.
> `plans/component-extraction-colour-placement-background-report.md`.
> **Part of:** [theme extraction captures less than the site uses](./theme-extraction-captures-less-than-the-site-uses.md), with the type and spacing instances.

## What happens

Cluster now resolves each section's measured colours against the published theme and records the
token expressing each one. Where nothing in the theme is within 24 in RGB, the token is `null`, the
Generate prompt says so, and the model is told to write the hex directly — which is the right
instruction, because inventing a nearby token would render the wrong colour while looking tokenised.

Measured on the four demo sites:

| site      | measured colours with no theme token |
| --------- | -----------------------------------: |
| Park city |                         0 of 42 (0%) |
| Tulane    |                      17 of 100 (17%) |
| Westland  |                         2 of 39 (5%) |
| Freehill  |                        7 of 25 (28%) |

The colours that fall through are not incidental. Tulane's are `#366748` (its green), `#e0e299` (its
specials yellow) and `#e08b81` (its pink) — the site's own palette. Freehill's are near-black.

## What it does downstream

**26 of the 38 bare hex values in the generated code are this**, and they are the only bare hexes the
prompt sanctions. A hardcoded colour survives no theme change: the customer rethemes and those
sections stay the old colour. Freehill's bare-hex rate is the highest of the four sites — 1.3 per
component against 0.2 for Westland — purely because its theme carries no near-black.

It also distorts the fidelity measures. Four of the six "invented" dominant colours in the acceptance
run are quantised shades of `#e0e299`, a colour the section genuinely has and the theme cannot name.

## Why it is the same shape as the type ceiling

`theme-extraction-stops-short-of-the-sites-own-headings` is this defect in the type scale: the
extracted scale topped out below the site's display headings, so the model had nothing to bind the
largest text to. Same cause — the extractor produces a plausible, well-formed theme that does not
span what its own source site uses — and the same symptom, which is a generated component reaching
for a literal because the vocabulary it was given is short.

## What would fix it

Extraction should be driven by what the captured pages actually paint, not only by what a
conventional palette contains: harvest the distinct `backgroundColor` / `color` / `borderColor`
values across the captured trees, weight them by painted area, and ensure the emitted slots cover the
ones that carry real area. The pipeline already computes exactly this list — `resolveSectionColours`
produces it per section — so the input exists.

Until then the `null` token is the honest answer and should stay. It is the measurement that makes
the gap visible; suppressing it would hide the defect rather than fix it.

## One finding, seen twice

`theme-extraction-stops-short-of-the-sites-own-headings` is this issue in the type scale: every
extracted theme tops out at 43–45px while three of the four sites set display headings at 52–72px,
so the largest heading on the page falls back to a plain `font-size` exactly as these colours fall
back to a hex.

**Theme extraction captures less than its own site uses.** Type and colour are two appearances of
that one defect, found by two independent passes, and it should be expected to surface in every
appearance pass that follows. Both are measured on the same four sites, and both have the same
remedy — extraction driven by what the captured pages actually paint.
