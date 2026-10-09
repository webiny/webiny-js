# Every page instance of a component is given the first member's text

> **Package:** `@webiny/api-component-extraction`
> **Severity:** medium-high — it is the largest remaining fidelity loss on a composed page, it is
> customer-visible, and the data needed to fix it is already in the artifact.

## The defect

`AssembleHandler.ts:104`:

```ts
for (const component of generatedComponents) {
    const propValues: Record<string, string> = {};
    for (const prop of component.props) {
        propValues[prop.name] = prop.observedValues[0] ?? "";
    }
    for (const member of component.members) {
        list.push({ ..., propValues });   // the same object, for every member
    }
}
```

One `propValues` object is built per component and attached to every member. A cluster is a set of
sections that are structurally alike across pages — a property description on eight pages, a contact
form on nine — and they are alike in structure precisely because their text differs. Every instance
is given the first member's text.

`observedValues[0]` compounds it: the observed values are a deduped union across all members, so
index 0 is not "this instance's value", it is "the first distinct value the model listed".

## Measured

Across six stored runs, using each member's own `digest.texts` to decide whether members actually
differ:

| site                  | instances | multi-member components | with differing members | instances given another member's text |
| --------------------- | --------- | ----------------------- | ---------------------- | ------------------------------------- |
| parkcityplace         | 38        | 5                       | 3                      | 17                                    |
| parkcityplace (fresh) | 38        | 5                       | 3                      | 17                                    |
| 2424tulane            | 71        | 7                       | 4                      | 28                                    |
| thevibe               | 73        | 8                       | 2                      | 5                                     |
| 71westland            | 44        | 6                       | 4                      | 18                                    |
| freehill              | 9         | 3                       | 1                      | 1                                     |
| **total**             | **273**   | **34**                  | **17**                 | **86**                                |

**86 of 273 page instances (32%)** are handed text that is not theirs.

**Caveat on that number.** "Differing" is set-inequality over a member's captured texts, so a member
that differs by one extra link label counts the same as one whose whole body differs. 32% is the
share of instances given _something_ that is not theirs; it is not a claim that a third of instances
are wholly wrong. The magnitude per instance is not measured here and should be, as part of the fix.

## The data already exists

`ClusterMember.digest` carries that member's own `SectionDigest`, including its `texts`. It was added
for a different reason — so a `cluster.split`/`cluster.move` override can promote a member into its
own cluster — and it is populated for **every member across all six runs: 0 missing**. So a
per-member binding needs no new capture and no new stage.

What it does need is a way to decide which of a member's texts belongs to which prop. The model names
the props; the captured texts are positional. That alignment is the actual work, and it is the same
problem the abbreviated-value restore (commit `ae07ec3cbc`) solved narrowly, by using the model's own
string as the key for which captured text belongs to which prop. The general case is harder, because
there is no per-member model output to key against.

## Why it is filed rather than fixed

It is larger than it looks and wants its own measured pass. The fix changes what every composed page
renders, so the measurement is page-level fidelity per site, not a validator pass rate — the
text-preservation gate runs per component and would not move at all.

Two sub-questions to settle first:

1. Whether alignment can be positional (nth text of the member to nth text of the representative), or
   needs a per-member model call, or can reuse the structural signature the cluster was built from.
2. What happens when a member genuinely lacks a prop the representative has — an optional subtitle on
   seven of eight pages. Today it silently inherits one; it should probably be absent.

## Seen again after the fixes, upstream of them (2026-10-09)

Check-job run 3 (2424 Tulane) ran after the per-copy and alignment work. Its Footer was generated four
times from one identical prompt (`reports/2026-10-09/footer-thinking-quality.md`). All four passed every
check. Two of the three long-thinking answers render text in the wrong slot: "Copyright © 2026
Copyright ©", and "Office Hours" or "2424 Tulane Apartments" among the bottom links.

**The source of it is the Plan contract, not the model and not composition.** The run's Plan records
these observed values for the Footer's link lists:

- `legalLinks`: "2424 Tulane Apartments", ",", "Office Hours";
- `socialLinks`: "2424 Tulane Apartments", "Corporate Logo", "Copyright ©", "Privacy Policy".

The model reproduces them as the lists' defaults. The one answer that rendered the bottom links
correctly (A) did so by writing "Privacy Policy" and "Accessibility Statement" into its markup and
ignoring its own list.

**So this class:**

- **is not a thinking artefact.** It appears in long-thinking answers, and the short-thinking one has
  it too;
- **is not fixed by the per-copy and alignment work.** That work derives instance values at composition
  and binds observed scalars. This is the Plan's observed values for _Link-list_ props, which reach the
  component as its defaults and so appear on every render and every instance that falls back to them;
- **passes every check.** The texts are present, so text preservation is satisfied; the props exist,
  so the contract is satisfied.

Not yet measured: how many Link-list props across the demo runs carry observed values from outside
their own list. The Plan artifacts hold the answer offline.
