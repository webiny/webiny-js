# The Generate stage artifact capped a run at roughly a dozen components

> **Package:** `@webiny/api-component-extraction`
> **Severity:** was **high** — it capped the product rather than degrading it. A site with more than
> about a dozen components could not complete a run at all.

> **Status: fixed.** The aggregate now references its per-component artifacts instead of inlining
> them. Kept as the record of what it cost and how it was measured.

## The defect

The Generate stage artifact carried every component's full `GeneratedComponent` inline and is stored
as a single value in the tenant KeyValueStore — a DynamoDB item, capped at 400 KB. Its size therefore
scaled with how large the components were, not with how many there were.

`domain/stage.ts` already stated the intended split: small JSON stage artifacts on the KeyValueStore,
large content in the blob store. Component source was on the wrong side of that line.

## Measured, not projected

The original estimate came from parkcityplace — 7 components at 223 KB, ~32 KB each, projecting 23
components at ~734 KB and a ceiling near 12.

The real run of thevibe, the site that exposed it, produced different numbers in both directions:

|               | Projected | Measured     |
| ------------- | --------- | ------------ |
| Components    | 23        | **30**       |
| Aggregate     | ~734 KB   | **412.2 KB** |
| Per component | ~32 KB    | **~13.7 KB** |

**"About a dozen" was the right order of magnitude for the wrong reason.** The per-component cost was
less than half the parkcityplace-derived figure, and the component count was higher than projected.
The two errors pointed opposite ways and roughly cancelled.

The 412.2 KB is reconstructed from the successful run by fetching all 30 components in full and
sizing the artifact the old shape would have written. It exceeds the 400 KB limit by 12.2 KB, so
**thevibe would have failed again even at the projected 23 components** — the original failure was
`Item size has exceeded the maximum allowed size`.

### Where the bytes were

Across those 30 components:

| Field       | Total       |
| ----------- | ----------- |
| source      | 174.4 KB    |
| css         | 117.3 KB    |
| **props**   | **55.8 KB** |
| **members** | **51.7 KB** |

This is what settled the scope. Referencing only source and css — the fix as first stated — leaves
107.5 KB of props and members, a third of the budget already consumed at 30 components, and leaves a
ceiling near 55 rather than the hundreds needed. `members` is the worst of them: it scales with
**cluster memberships across pages** (73 in this run), not with component count, so it degrades most
on exactly the large sites the change exists for.

## The fix

The aggregate holds a `GeneratedComponentRef` per component — signature, name, type, attempts,
counts, validator results, a `resultRef`, a `revision` and a `contentSha256`. Everything else lives in
the per-component artifact `generateResultKey` already wrote, already keyed by stage version.

|                                    | Before   | After       |
| ---------------------------------- | -------- | ----------- |
| Aggregate (thevibe, 30 components) | 412.2 KB | **19.4 KB** |
| Per component                      | ~13.7 KB | **0.65 KB** |
| Ceiling                            | ~12      | **~618**    |

A 21× reduction, and the aggregate's size is now a function of component count alone.

### One resolver, not eight branches

`domain/generatedComponents.ts` is the only code that knows the aggregate can hold either shape.
Every existing run carries components inline; eight consumers read this artifact, and having each
branch on `"resultRef" in entry ? fetch : inline` would have reproduced the defect this project has
shipped repeatedly — two paths answering one question with one of them exercised.

`componentsMetadata` returns a type with **no source field**, so a consumer that needs only a list
cannot fetch source by accident. That is the requirement enforced structurally rather than
remembered.

### The consumer list was incomplete twice

The brief named four consumers. There were eight: `RenderComponentsTask`, `RegenerateComponentTask`
(a **writer**), the admin Promote view and the admin refine poll were all missing. A ninth need —
`pageCount`, distinct member URLs, which both the Generate and Promote views display and which
`memberCount` does not yield — was caught by the type checker after the shape changed.

## Verified

- **thevibe**, all nine stages, 21m08s, Generate completed. 30 components, 19.4 KB aggregate, all 30
  references resolving back to source, none carrying source inline. 25 promoted, 9 pages assembled.
- **parkcityplace unchanged.** Re-running Assemble against its inline-shaped artifact produced a
  byte-identical result (`6b33a37b763d7697…`), which exercises the resolver's back-compat path on real
  data. A full re-run was deliberately not used as the comparison: Classify, Plan and Generate are
  model-backed, so it would have measured nondeterminism rather than this change.
