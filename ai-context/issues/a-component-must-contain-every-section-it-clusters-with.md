# A component is required to contain every section it clusters with

> **Package:** `@webiny/api-component-extraction` (`PlanHandler`, `componentGeneration`, `validators`)
> **Severity:** high — the root cause of the largest visual failure in the pipeline, and of the thing
> a customer notices first. 11 of 34 components across the four sites are required to emit more text
> than their own reference image contains; 7 of those by more than 5x; the worst by 30x.
> **Status:** open. Diagnosed in `plans/component-extraction-visual-fidelity-report.md`.

## What happens

`PlanHandler` builds the generation contract's text list from the cluster, not from the member the
picture came from:

```ts
sourceTexts: cluster.cluster.observedTexts; // PlanHandler.ts:122 — the union over all members
```

The reference image is **one** member — `representativeCrop`. So `buildPrompt` emits two instructions
that contradict each other:

```
Reproduce the section shown in the reference image.
...
Preserve this text content exactly:
- <every text from every member of the cluster>
```

Only the second is enforced. `validateTextPreservation` fails a component that drops any of them, and
a failure is fed back verbatim as retry instructions. The picture is checked by nobody.

The model does the only thing it can: it reproduces the section in the image, then keeps going until
it has emitted the rest of the list.

## How widespread

Required texts ÷ the representative's own texts, per component, four sites, 34 components:

| ratio                              | components |
| ---------------------------------- | ---------- |
| 1.0x (union equals representative) | 23         |
| >1.5x                              | **11**     |
| >3x                                | 8          |
| >5x                                | 7          |

| site             | component                       | representative texts | required | ratio     |
| ---------------- | ------------------------------- | -------------------- | -------- | --------- |
| 71 Westland      | Explore Fenway Forward Intro    | 2                    | 60       | **30.0x** |
| 2424 Tulane      | Location Description            | 2                    | 51       | **25.5x** |
| 2424 Tulane      | Image Gallery Section           | 2                    | 31       | **15.5x** |
| 71 Westland      | Hero Intro Section              | 6                    | 41       | 6.8x      |
| Park city Palace | Property Description            | 7                    | 42       | 6.0x      |
| 2424 Tulane      | Intro/About with Stats          | 10                   | 60       | 6.0x      |
| 71 Westland      | Contact Section                 | 1                    | 6        | 6.0x      |
| 71 Westland      | Accessibility Statement         | 4                    | 20       | 5.0x      |
| Park city Palace | Accessibility Statement         | 7                    | 21       | 3.0x      |
| 2424 Tulane      | Neighborhood/Location Highlight | 4                    | 9        | 2.3x      |
| Freehill         | Contact Form with Map View      | 38                   | 50       | 1.3x      |

## What it does to the render

Measured as render height ÷ source section height, all 34 components:

- too tall (>1.5x): **9 (26%)**
- too short (<0.67x): 5 (15%)
- in band: 20 (59%)

Every one of the nine too-tall components is in the table above. The correspondence is direct:

| site             | component                    | source → render     | required text |
| ---------------- | ---------------------------- | ------------------- | ------------- |
| 71 Westland      | Explore Fenway Forward Intro | 202 → 1644px (8.1x) | 30.0x         |
| 71 Westland      | Accessibility Statement      | 546 → 2486px (4.6x) | 5.0x          |
| Park city Palace | Property Description         | 640 → 2642px (4.1x) | 6.0x          |
| 2424 Tulane      | Image Gallery Section        | 536 → 2141px (4.0x) | 15.5x         |
| 2424 Tulane      | Intro/About with Stats       | 570 → 2124px (3.7x) | 6.0x          |
| 2424 Tulane      | Location Description         | 826 → 2405px (2.9x) | 25.5x         |

71 Westland's _Explore Fenway Forward Intro_ is the clearest. The source is a 202px centred intro —
title, rule, two lines of body. The render reproduces exactly that in its first ~450px, and then
appends a property-chooser button row, a "Filter By" bar, a "Studio, 1 and 2 Bedroom Apartments"
block with disclaimers, and a complete "Contact Us" application block. Each one belongs to a
different member of the same cluster.

## Which clusters it spares, and why that matters

A cluster whose members are identical has a union equal to its representative, and scores 1.0x. That
is why site navigation, footers and the specials bar are untouched — and why the defect looks absent
until someone measures it. It bites exactly where members share a layout and differ in content,
which is the normal case for body sections and the case the whole component model exists to serve.

## The consequence worth recording

Text preservation and visual fidelity have been pulling against each other. The validator enforces a
superset of text the reference image does not contain, only that side is enforced, and **every retry
made the appearance worse** — the retry loop is described in the code as "the single biggest lever on
both pass rate and wasted attempts", and on this axis it is a lever pointed the wrong way. The text
preservation work strengthened the wrong half of a contradiction.

## Not to be confused with

A component being too tall because its proportions are wrong (see
`nothing-tells-the-model-how-big-anything-is`). That is a separate defect and a smaller one. Fixing
proportion without fixing this yields well-proportioned components that still contain four other
sections.
