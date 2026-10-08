# Spacing fix: result

Predictions: `spacing-fix-predictions.md`, written before the run. Fix: `4b44d93cc6`. Dry-run mode, 9
runs per arm on thevibe Hero Intro, Freehill Amenities Highlights and check-run Tulane FAQ Section.
`sp-before` is the deployed prompt before the fix, `sp-after` the fix.

| Measure                                                     | Predicted                       | Before    | After     |
| ----------------------------------------------------------- | ------------------------------- | --------- | --------- |
| First attempts failing on an unknown variable               | about 9/9 to at most 1/9        | 6/9       | **0/9**   |
| Mean attempts per run                                       | about 2.0 to at most 1.3        | 1.78      | **1.11**  |
| Runs passing validation                                     | 9/9                             | 8/9       | 9/9       |
| Spacing fidelity, kind-matched (see below; bounds attached) | higher                          | 0.59      | **0.96**  |
| Hex literal / house heading / mainly centred                | unchanged at 0 (1 within noise) | 2 / 1 / 0 | 1 / 0 / 0 |
| Cost                                                        |                                 | $3.43     | $2.80     |

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

## Bounds on these figures

- **Spacing fidelity checks the kind of declaration, not the element.** It confirms a measured value
  appears in a declaration of the same kind (a gap in `gap` or a margin, a padding in `padding`), not
  that it sits on the element the section has it on.
- **Spacing fidelity scores what the browser renders.** Variables are resolved to the theme's value
  before matching, as the browser does with the theme active, so a wrapped declaration such as
  `var(--wby-space-gap, 16px)` on a theme where the gap is 30px scores as 30px and earns nothing against a
  measured 16px. The 0.96 is therefore not inflated by wrapping; wrapping is what costs it the rest. (It
  does not measure what renders with no theme active, when the fallbacks apply.)
- **The before figure of 6/9 is not a current baseline.** It came from the prompt deployed before the
  fix; the ablation's base arm, on an older prompt still carrying four since-removed lines, had 9/9.

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

## Diagnosis of the wrapping (2026-10-08)

For every spacing variable whose theme value differs from the px written as its fallback (it renders
the theme value; the fallback never applies with the theme active):

|                                                                             | Before | After  |
| --------------------------------------------------------------------------- | ------ | ------ |
| Spacing variables written with a px fallback                                | 48     | 38     |
| Theme value agrees with the fallback                                        | 16     | 28     |
| **Disagrees**                                                               | **32** | **10** |
| ... the prompt said "use Npx directly" for that kind (no suitable variable) | 29     | 8      |
| ... a variable for a different kind (e.g. control padding used for a gap)   | 3      | 2      |
| ... the prompt offered this variable for that kind                          | 0      | 0      |
| ... the fallback is a value this section measured                           | 17     | 8      |
| ... the fallback is the model's own value                                   | 15     | 2      |

- **Only where no suitable variable exists.** Where the prompt gives a variable, its theme value is the
  measured one, so wrapping is harmless; every disagreement is a kind the prompt said to write as px, or
  a variable meant for another kind.
- **After the fix, the fallback is mostly the measurement.** The model has the right number and puts it
  inside a variable that renders something else: it treats a variable with the right fallback as
  equivalent to the value. Before the fix half the fallbacks were its own guesses; the measured spacing
  replaced most of those.

The two cases want different fixes. A measured value wrapped in an unsuitable variable is fully
detectable: the section's measurement, the variable's theme value and the fallback are all known, so a
check can name it and the retry can say "write 16px; --wby-space-gap renders 30px here". A model's own
fallback (2 of 10 after) is not a measured value, and no check can say what it should have been.
