# Plan writes a component's prop values from 20 of up to 60 captured texts

> **Package:** `@webiny/api-component-extraction`
> **Severity:** medium — it caps fidelity for the components that carry the most text, and the
> components it caps hardest are the ones already failing text preservation.

## The defect

Cluster keeps up to 60 texts per cluster (`ClusterHandler.ts:26`, `MAX_OBSERVED_TEXTS = 60`) and Plan
shows the model the first 20 of them (`planContract.ts:71`, and again at `:144` for the refine
prompt):

```ts
"Text observed across instances:",
...cluster.cluster.observedTexts.slice(0, 20).map(text => `- ${text}`),
```

`PlanHandler.ts:118` then stores **all** of them as the component's `sourceTexts`, and Generate shows
and checks 30 of that list (`componentGeneration.ts:119` and `:311`, both `PRESERVED_TEXT_LIMIT`).

So the three stages disagree about how much of a section's text exists: Plan writes the prop values
from 20, Generate is shown 30 and gates on those 30, and the artifact carries 60. Text between the
20th and the 30th is checked but was never available when the contract that carries it was designed.

## Measured

Across six stored runs, **17 of 71 components (24%)** carry captured text Plan never saw:

| site                  | components | over 20 | over 30 | max texts |
| --------------------- | ---------- | ------- | ------- | --------- |
| parkcityplace         | 7          | 2       | 1       | 37        |
| parkcityplace (fresh) | 7          | 3       | 1       | 42        |
| 2424tulane            | 13         | 5       | 3       | 55        |
| thevibe               | 30         | 3       | 1       | 40        |
| 71westland            | 8          | 2       | 2       | 60        |
| freehill              | 6          | 2       | 2       | 49        |

The widest gaps are not a random subset — they are the components that fail text preservation:

- **71westland / Explore Fenway Forward Intro** — 60 texts, 40 unseen by Plan
- **2424tulane / Property Description with Stats** — 55 texts, 35 unseen
- **2424tulane / Neighborhood Description** — 50 texts, 30 unseen

Three of the six components still failing the text check after the validator rewrite are in that
list.

## Why it is filed rather than fixed

Raising 20 is one line, and that is exactly why it should not ride along with an unrelated change.
The number trades fidelity against prompt size on the components that already have the most text, so
it wants its own measured pass: contract quality and text preservation before and after, per site,
with the token cost of the Plan stage recorded alongside. A bigger window may also change how the
model groups props, which is a contract-shape change and not only a values change.

The three limits (20, 30, 60) should probably be derived from one constant with a stated relationship
rather than three independent numbers, whatever value is chosen.

Related: [the retry prompt truncates the fragments it feeds
back](./retry-prompt-truncates-the-fragments-it-feeds-back.md) is the same class of defect — a cap
that is reasonable for storage applied to a prompt.
