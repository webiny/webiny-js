# The model guessed the token vocabulary for every run, and guessed right

> **Package:** `@webiny/api-component-extraction` (`componentGeneration`, `validators`)
> **Severity:** medium — nothing is broken today, which is the point. For every run across four sites
> the model invented `--wby-*` variable names with no list to work from and no check applied, and all
> 89 of them were real. That is luck holding, not correctness, and it would not survive a theme with a
> different vocabulary.
> **Status:** open. Filed as a near miss rather than a clean result.

## What happened

The themes were drafts, so no manifest resolved, so the prompt's allowed-variable list was never
supplied and the token-binding validator never ran
(`every-run-generated-against-no-theme-manifest`). Components were generated against no vocabulary
constraint at all.

After publishing the themes, the components generated **before** that — every component on every site,
33 of them — were checked against their own theme's variables:

| site             | components | referencing a variable the theme does not define |
| ---------------- | ---------: | -----------------------------------------------: |
| Park city Palace |          7 |                                            **0** |
| 2424 Tulane      |         12 |                                            **0** |
| 71 Westland      |          8 |                                            **0** |
| Freehill         |          6 |                                            **0** |

89 distinct variables across the four sites. None is a ramp primitive — every one sits in a semantic
family (`border`, `color`, `radius`, `shadow`, `space`, `text`, `type`) — so the result is not an
artefact of `tokens.css` being a superset of the bindable slots. The bound is tight.

## Why this is a near miss and not a non-event

"0 of 33 failed" reads as nothing happening. What happened is that the model reconstructed a naming
convention it had never been shown — `--wby-color-text-primary`, `--wby-type-heading-1-size`,
`--wby-radius-container` — and got all 89 right.

It got them right because this theme's names are derived mechanically from canonical slot paths, and
the model has seen that convention. Nothing in the pipeline made that happen and nothing would have
caught it going wrong:

- The prompt had no list to constrain it.
- `validateTokenBinding` recorded `passed: true` for not running.
- Nothing downstream resolves a `var()` at generation time, so an unknown variable survives as valid
  CSS and renders as the fallback — or as nothing.

A theme with custom semantic tokens, a different prefix, or renamed roles would have produced
components full of variables that silently resolve to nothing, and every signal would still have read
green.

## What to take from it

The failure the measurement was looking for did not happen. The **condition** that would have caused
it was present on every run and is now fixed by publishing the themes, which makes the list real and
the validator live — 33 of 33 checked and passed on the following run.

The record exists so the number is not read as evidence that the constraint is unnecessary. It is
evidence that the constraint was absent and the model happened not to need it.
