# Regenerating a component gates it on fragments the model was never shown

> **Package:** `@webiny/api-component-extraction`
> **Severity:** low-medium — it cannot corrupt a component, but it can make a regenerate fail a
> component that Generate passed, with no way for the operator to satisfy it.

## The defect

Two `PRESERVED_TEXT_LIMIT` constants, declared independently and set to different values.

Generate shows the model 30 fragments and gates on the same 30 — consistent:

```ts
// componentGeneration.ts:28
const PRESERVED_TEXT_LIMIT = 30;
// :119   prompt
...component.sourceTexts.slice(0, PRESERVED_TEXT_LIMIT).map(text => `- ${text}`)
// :311   gate
planned.sourceTexts.slice(0, PRESERVED_TEXT_LIMIT),
```

The single-component regenerate gates on 40:

```ts
// RegenerateComponentTask.ts:40
const PRESERVED_TEXT_LIMIT = 40;
// :164
sourceTexts.slice(0, PRESERVED_TEXT_LIMIT),
```

So a regenerated component is judged against **10 fragments more than the component was ever built
against**. Nothing in the regenerate path shows them either: it refines from the current source and
feeds back validation failures, not the fragment list.

**Note on the direction.** This was first reported the other way round — regenerate on 20 against
Generate's 30. It is 40 against 30. The consequence is as described either way (a regenerated
component is checked against fragments the model was never shown), but the numbers above are the
measured ones.

## Why it matters

The regenerate exists so an operator can fix a component that failed. A component that passed
Generate on 30 fragments can fail regenerate on the 31st through 40th, and the operator's instruction
had nothing to do with those. The failure list then names text the operator cannot act on, because
the component was never asked to carry it.

It bites hardest on exactly the components an operator is most likely to regenerate: 17 of 71
components across the stored runs carry more than 20 captured texts, 10 carry more than 30. See
[Plan sees 20 of up to 60 captured texts](./plan-sees-twenty-of-sixty-captured-texts.md), which is
the same family of defect — independent caps on one list, chosen per call site.

## Fix sketch (not implemented)

Not simply "change 40 to 30". The three limits in play — Plan's 20, Generate's 30, Cluster's 60 —
should come from one place with a stated relationship, so that "what the model was shown" and "what
it is judged on" cannot drift apart again. The gate should be defined as _the fragments this
component was built against_, carried with the component, rather than recomputed from a constant at
each call site.

Cheap interim: have the regenerate read Generate's constant rather than declaring its own.
