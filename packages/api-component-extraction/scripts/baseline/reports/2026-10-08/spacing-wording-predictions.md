# Spacing wording: predictions, named before the run

The change: where a kind of spacing has no theme variable carrying the section's value, its prompt line
names the trap as a fact about this theme, e.g. "write 16px as a plain value, not inside a variable:
var(--wby-space-gap) renders 30px on this theme". No check is added; a check would bring back the
retries the spacing fix removed, and is held back unless the wording fails.

Arm `sp-wording`, 9 runs in dry-run mode on the same three components, compared with `sp-after`.

| Measure                                                          | sp-after  | Predicted                               |
| ---------------------------------------------------------------- | --------- | --------------------------------------- |
| Spacing variables whose theme value differs from the px fallback | 10 of 38  | about 2: the model's own fallbacks only |
| ... of which the fallback is a measured value                    | 8         | about 0                                 |
| Mean attempts per run                                            | 1.11      | about 1.1                               |
| Spacing fidelity, kind-matched, resolved as the browser renders  | 0.96      | 0.96 or above                           |
| Hex literal / house heading / mainly centred                     | 1 / 0 / 0 | 0, 1 within noise                       |
| First attempts failing on an unknown variable                    | 0/9       | 0/9                                     |

Reported against these whichever way they go.
