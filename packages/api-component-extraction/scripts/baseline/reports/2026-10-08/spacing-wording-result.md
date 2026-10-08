# Spacing wording: result

Predictions: `spacing-wording-predictions.md`, written before the run. Change: `ea62a7b944`. Arm
`sp-wording`, 9 runs in dry-run mode on the same three components, against `sp-after`.

| Measure                                                          | sp-after  | Predicted         | sp-wording  |
| ---------------------------------------------------------------- | --------- | ----------------- | ----------- |
| Spacing variables whose theme value differs from the px fallback | 10 of 38  | about 2           | **0 of 20** |
| ... of which the fallback is a measured value                    | 8         | about 0           | 0           |
| Mean attempts per run                                            | 1.11      | about 1.1         | 1.00        |
| Spacing fidelity, kind-matched, resolved as the browser renders  | 0.96      | 0.96 or above     | 0.96        |
| Hex literal / house heading / mainly centred                     | 1 / 0 / 0 | 0, 1 within noise | 1 / 0 / 0   |
| First attempts failing on an unknown variable                    | 0/9       | 0/9               | 0/9         |
| Runs passing                                                     | 9/9       |                   | 9/9         |
| Cost                                                             | $2.80     |                   | $2.44       |

Every prediction held; the main one did better than predicted (0 against about 2). The model also
wrapped fewer spacing values in variables at all (20 declarations against 38). Every run passed on its
first attempt.

Fidelity did not move because its one remaining miss is not wrapping: FAQ Section's measured 15px
container padding appears as a margin, the right value in the wrong kind of declaration. The same
miss accounts for the 0.96 in `sp-after`.

Bounds, as on the spacing result: the fidelity check confirms the kind of declaration, not the element;
it scores the value the browser renders with the theme active, not with none.

Naming the trap as a fact about the theme ("var(--wby-space-gap) renders 30px on this theme") removed it
without a check, so no retries came back. Line 5 is now measured against this prompt.
