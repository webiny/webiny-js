# Line 5 ("Use ONLY these theme variables"): predictions, named before the run

The line: "Use ONLY these theme CSS variables — any other var(--wby-*) fails validation; for anything
without a suitable variable, use a plain CSS value:" followed by the theme's variables. Ablated, the
list is introduced as "The theme's CSS variables:". Measured now that the prompt's vocabulary is the
manifest's (`4b44d93cc6`) and the spacing wrapping is understood (`ea62a7b944`).

With-arm: `sp-wording` (9 runs, the current prompt). Without-arm: `l5-without`, 9 runs, the line left
out, same three single-copy components.

In the first ablation (`ablation-result.md`), on the older prompt, its target failure (an invented
variable on the first attempt) was 9/9 with and without it, and removing it raised hex literals (0 to
3/9), failed runs (0 to 2) and cost. Both may have been the lists disagreeing, which is now fixed.

## Outcome rules (as in the ablation design)

- **Load-bearing:** a failure appears without the line and not with it: an invented variable on a
  first attempt, a hex literal, a spacing variable rendering other than its fallback, a failed run.
- **Dead at this resolution:** none of those appears more without it than with it, over 9 runs. That
  bounds a one-in-six failure about 81% of the time, on three single-copy components; it does not show
  the rate is zero.

## Predictions

| Measure                                               | With (sp-wording) | Without (predicted)                                               |
| ----------------------------------------------------- | ----------------- | ----------------------------------------------------------------- |
| First attempts failing on an unknown variable         | 0/9               | 0/9: the lists agree, so nothing is left to invent                |
| Hex literals                                          | 1/9               | 1/9 or fewer, if the earlier rise came from the disagreeing lists |
| Spacing variables rendering other than their fallback | 0                 | 0: the spacing lines carry that now                               |
| Mean attempts / runs passing                          | 1.00 / 9/9        | about 1.0 / 9/9                                                   |

Prediction overall: dead at this resolution. If hex literals rise again without it, the second clause
("use a plain CSS value") is doing something the vocabulary fix did not take over.
