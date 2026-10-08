# Spacing fix: result

Predictions: `spacing-fix-predictions.md`, written before the run. Fix: `4b44d93cc6`. Dry-run mode, 9
runs per arm on thevibe Hero Intro, Freehill Amenities Highlights and check-run Tulane FAQ Section.
`sp-before` is the deployed prompt before the fix, `sp-after` the fix.

| Measure                                       | Predicted                       | Before    | After     |
| --------------------------------------------- | ------------------------------- | --------- | --------- |
| First attempts failing on an unknown variable | about 9/9 to at most 1/9        | 6/9       | **0/9**   |
| Mean attempts per run                         | about 2.0 to at most 1.3        | 1.78      | **1.11**  |
| Runs passing validation                       | 9/9                             | 8/9       | 9/9       |
| Spacing fidelity, kind-matched (see below)    | higher                          | 0.59      | **0.96**  |
| Hex literal / house heading / mainly centred  | unchanged at 0 (1 within noise) | 2 / 1 / 0 | 1 / 0 / 0 |
| Cost                                          |                                 | $3.43     | $2.80     |

All predictions held except the baseline: 6/9 first attempts failed on unknown variables, not "about
9/9". The ablation's base arm, which also carried the four lines since removed, had 9/9; the two are
different arms on different prompts, so the 9/9 was not a measured baseline for this run.

The one first-attempt failure left after the fix is invented text ("New Amenity"), not a variable.

## The spacing measure was corrected before reporting

The first definition counted a measured value as reproduced if any desktop spacing declaration was
within max(2px, 15%) of it. It scored the after-arm 1.00. On inspection, FAQ Section's measured 16px
gap was being matched by a 15px padding: a different kind of spacing, within tolerance. The measure
now matches like with like (gaps against `gap` and margins, paddings against `padding`), and both arms
were re-scored on it: 0.59 before, 0.96 after. It still checks that the value appears in the right
kind of declaration, not on the right element.

## Residual: a variable carrying another value

The after-arm's one miss: FAQ Section's measured 16px gap written as `var(--wby-space-gap, 16px)`.
Tulane's theme sets `--wby-space-gap` to 30px, so the browser renders 30px; the measured value sits in
the fallback, which never applies while the theme is active. The prompt said "no theme variable
carries this value, use 16px directly".

Across the arms, runs containing a spacing variable whose theme value differs from the px written with
it: 4/9 before (19 declarations), 5/9 after (10). The fix halved the declarations but did not remove the
pattern. It is worth its own check: the model treats a variable with the right fallback as equivalent
to the value, which is true only when no theme is active.

## Line 5

The lists now agree for extraction (the prompt's vocabulary is the manifest's), which was the
condition for measuring line 5 ("Use ONLY these theme variables").
