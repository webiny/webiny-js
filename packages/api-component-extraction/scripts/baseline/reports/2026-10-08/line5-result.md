# Line 5 ("Use ONLY these theme variables"): result

Predictions and outcome rules: `line5-predictions.md`, written before the run. With-arm `sp-wording`
(the current prompt), without-arm `l5-without` (the line left out), 9 runs each in dry-run mode on the
same three single-copy components.

| Measure                                               | With       | Predicted without | Without    |
| ----------------------------------------------------- | ---------- | ----------------- | ---------- |
| First attempts failing on an unknown variable         | 0/9        | 0/9               | 0/9        |
| Hex literals                                          | 1/9        | 1/9 or fewer      | 1/9        |
| Spacing variables rendering other than their fallback | 0          | 0                 | 0          |
| Mean attempts / runs passing                          | 1.00 / 9/9 | about 1.0 / 9/9   | 1.00 / 9/9 |
| Spacing fidelity (kind-matched, bounds as before)     | 0.96       |                   | 1.00       |
| Cost                                                  | $2.44      |                   | $2.47      |

**Dead at this resolution:** no failure appears without the line that does not appear with it, over 9
runs on three single-copy components. That catches a one-in-six failure about 81% of the time; it bounds
the rate on these components and does not show it is zero. The hex literal in each arm is on the same
component (Hero Intro, a white background or border written as `#ffffff`), with and without the line.

**What changed since the first ablation.** On the older prompt, removing this line raised hex literals
from 0 to 3/9, failed two runs and raised cost. On the current prompt it changes nothing. The difference
is the two fixes in between: the prompt's vocabulary now matches what the validator accepts, and the
spacing lines say what each variable renders. The line's effect in the first ablation was a symptom of
the lists disagreeing, not something the line itself did.

Not covered: the validator's retry feedback, which repeats "Use ONLY these theme CSS variables (no
others)" on a retry after a token failure, is not this line and was not measured.
