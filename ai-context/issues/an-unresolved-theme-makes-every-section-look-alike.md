# An unresolved theme makes every section look alike

> **Package:** `@webiny/api-component-extraction` (`features/stages/cluster/similarity.ts`)
> **Severity:** high — it changed 34 components into 48 across the four demo sites with no change to
> the threshold, and it is the default state of any run made before its site's theme is published.
> **Status:** open. Found while attributing the denominator change in the colour-fix acceptance,
> `plans/component-extraction-colour-placement-background-report.md`.

## What happens

`sectionSimilarity` is a weighted sum of three terms — tree shape, geometry class, and the Jaccard
overlap of the theme tokens each section's colours resolve to:

```ts
return TREE_WEIGHT * treeSim + GEOMETRY_WEIGHT * geometrySim + TOKEN_WEIGHT * tokenSim;
```

`setJaccard` returns **1** when both token sets are empty, and its comment states the intent: "two
token-less sections don't discriminate, so they score 1."

Scoring 1 is not failing to discriminate. 1 is the maximum the term can return. When the theme
manifest fails to resolve, **every** section's token set is empty, so the term returns 1 for every
pair and adds a flat `TOKEN_WEIGHT` to every similarity — which is the same as lowering the threshold
by `TOKEN_WEIGHT` for the whole run, while the run reports clustering at the threshold it was given.

`weightedJaccard` has the same shape (`union === 0 ? 1`) for the tree term.

## What it does downstream

Measured directly: the four demo runs clustered with an unresolved manifest and produced **34
components**. Publishing the four themes — nothing else changed, same sections, same 0.85 threshold —
produced **48**.

| site      | tokens absent | tokens resolved |
| --------- | ------------: | --------------: |
| Park city |             7 |              10 |
| Tulane    |            13 |              22 |
| Westland  |             8 |               9 |
| Freehill  |             6 |               7 |

Sections that share nothing but a tree shape were merged, so one component had to serve several
different-looking sections, and the model was asked to reproduce a representative that did not
represent them.

It is silent. There is no log line, no artifact field and no report that says the token term
contributed nothing — clustering ran on two dimensions and declared three.

## What would fix it

Return `null` (or `undefined`) for a term with no input and renormalise the weighted sum over the
terms that returned a number. A missing term should leave the score where the other terms put it,
not award full marks. The same applies to `weightedJaccard`'s `union === 0` branch.

Log once per run when a term is inert for every pair, as
`an-absent-input-is-an-error-not-an-empty-result` requires.

## Why it is the sixth instance of the standing rule

`persist-what-a-later-stage-needs` has collected five cases of a value measured and then not reaching
the stage that needed it. This is the same failure in a new form: not a dropped value but a
**derivation whose absent input returns a neutral value indistinguishable from a measured one**. The
rule now carries the general form.
