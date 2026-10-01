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

---

## Was the cluster over-merged? (the threshold question, measured before fixing)

Before narrowing, the alternative was to split the clusters instead — if members whose text diverges
by 30x are not really one component, the similarity threshold is the lever. Measured:

**2424 Tulane was clustered at threshold 1.0** — exact structural match under `sectionSimilarity` —
and carries the 25.5x, 15.5x and 6.0x cases. Those members are structurally identical; there is no
threshold above 1.0 to raise. For them the threshold is not a lever at all, and the divergence is
purely content.

For the other three sites (threshold 0.85), the stored threshold curve says how many clusters exact
matching would produce:

| site             | clusters at 0.85 | at 1.0 | extra splits available |
| ---------------- | ---------------- | ------ | ---------------------- |
| Park city Palace | 7                | 10     | 3                      |
| 71 Westland      | 8                | 10     | 2                      |
| Freehill         | 6                | 7      | 1                      |

Those three sites have 8 over-emitting components between them and at most 6 splits available, so
even if every split landed on an offender, **at least 2 would remain** — and with 2424 Tulane's 4,
**at least 6 of the 11 are structurally tight**. Raising the threshold cannot address them, and the
cost of doing so is 7 more near-duplicate components across three sites.

So narrowing the text had to happen regardless. Whether a threshold pass is also worth making for the
up-to-6 loose clusters is a separate question this does not settle.

**Limitation:** per-cluster tightness could not be measured directly. The cluster artifact keeps each
member's `digest` but not its `SectionShape`, the `structure` digest field is far too coarse to
substitute (every member of the worst cluster reads `div>div>div`), and the run-image route serves
images only, so the captured node trees are not reachable over HTTP. The bound above is what the
stored curves support.

## Fixed

`sourceTexts` is now the reference member's own text, so the prompt and the text-preservation
validator narrowed together. The union is retained as `clusterTexts`, and `coverMemberTexts` checks
at Plan time that the contract's props can hold every member's text — the guarantee the union used to
provide, moved to the interface where it belongs.

Re-ran Plan → Generate → render on all four sites and recomputed the height table:

| band (render height ÷ section height) | before | after |
| ------------------------------------- | ------ | ----- |
| **too tall** (>1.5x)                  | **9**  | **2** |
| too short (<0.67x)                    | 4      | 6     |
| in band                               | 21     | 26    |

The nine too-tall components, which were the whole of the evidence:

| site             | component                       | before | after     |               |
| ---------------- | ------------------------------- | ------ | --------- | ------------- |
| 71 Westland      | Explore Fenway Forward Intro    | 8.14x  | **1.64x** | still tall    |
| 71 Westland      | Accessibility Statement         | 4.55x  | **1.19x** | in band       |
| Park city Palace | Property Description            | 4.13x  | **1.25x** | in band       |
| 2424 Tulane      | Image Gallery Section           | 3.99x  | **1.40x** | in band       |
| 2424 Tulane      | Intro/About with Stats          | 3.73x  | **1.30x** | in band       |
| 2424 Tulane      | Location Description            | 2.91x  | **0.62x** | now too short |
| Park city Palace | Accessibility Statement         | 2.83x  | **1.03x** | in band       |
| 71 Westland      | Hero Intro Section              | 2.08x  | **1.72x** | still tall    |
| 2424 Tulane      | Neighborhood/Location Highlight | 1.56x  | **0.94x** | in band       |

Six moved into band, one overshot into too-short, and the two that are still tall are no longer tall
for this reason: 71 Westland's _Explore Fenway Forward Intro_ now renders exactly its section — title,
rule, two lines of body, and none of the property chooser, filter bar, floor-plan block or contact
form it used to append. Its remaining 1.64x is vertical padding and a narrower text column wrapping
the body onto three lines instead of two, which is
`nothing-tells-the-model-how-big-anything-is`, not this.

### What moved that should not have

17 of the 23 components whose union already equalled their representative moved by more than 5% in
height. **For those the prompt is byte-identical before and after** — union equals representative, so
nothing changed — which makes them a clean read of Generate's own run-to-run variance rather than an
effect of this change. Most moved by under 0.1x of ratio. Three crossed a band boundary:

- Park city Palace _Site Navigation Header_ 0.84x → 0.64x (in band → too short)
- 2424 Tulane _Specials Section_ 1.00x → 0.00x — the zero-height fixed-position tab of
  `a-section-crop-can-show-something-other-than-the-component`, not a new fault
- 71 Westland _Site Navigation Header_ 0.66x → 0.87x (too short → in band), in the other direction

That variance is the noise floor to judge the table against: the two largest intended moves are 2.9x
and 1.8x of ratio, roughly twenty times it.

### The cost, stated

**The cost of this change is 113 texts with no candidate prop.**

Narrowing removed **312 texts** from what Generate is told to preserve, across the four sites. Of
those:

|                                                                                                  | count   |
| ------------------------------------------------------------------------------------------------ | ------- |
| held by a prop in the contract                                                                   | 79      |
| **not held by any prop, and the component has no candidate prop — the cost of this change**      | **113** |
| not held by any prop, but the component has an empty `Image`/`Link`/`FormField[]`/`Point[]` prop | 120     |

The 233 total is not the cost and should not be quoted as one. The 120 are
`image-values-are-captured-and-never-derived` wearing another hat: only string props ever receive
observed values, so a nav's `navLinks: Link[]` holds every label it is given and this check cannot
see that it would. 92 of the 382 props across the four sites are list or non-scalar with no observed
value. That defect predates this change, was not caused by it, and the fix for it is expected to
reclaim most of the 120 — so judging this change by 233 charges it for a defect it did not cause.

The 113 are the real cost: content the cluster contains and the contract does not describe.

Per site, removed from the prompt → not held by any prop: Park city Palace 63 → 41, 2424 Tulane
129 → 100, 71 Westland 108 → 80, Freehill 12 → 12.

For context, the same check reports 323 uncovered texts in total, of which **41 belong to
single-member clusters** — Freehill _Privacy Policy_ (29) and 2424 Tulane _Floor Plan Filter_ (12) —
where there is no union at all. That is a pre-existing contract gap this check now surfaces, not a
cost of this change.

### The measurement was corrected before it was reported

The first version of `coverMemberTexts` checked containment in one direction only — whether an
observed value fitted inside the member text. That is the direction the text-preservation validator
needs, because it is hunting for a source fragment inside rendered output. Coverage asks the opposite
question: whether a prop can hold this text. A run the page showed on its own is frequently part of a
longer observed value, so `"Copyright ©"` was reported as having nowhere to go while the contract
observed `"Copyright © 2026 Park City Place"`.

Uncorrected it would have put the raw uncovered total at 359 instead of 323 — **inflating the cost of
this change by about a third**, in the direction that would have argued against making it. It was
caught by reading the uncovered samples before quoting the number, not by the number looking wrong.

Containment now counts in both directions, with a test for the fragment case
(`textCoverage.test.ts`). The stored `textCoverage` on plans made before that fix carries the
pre-correction figures and will agree on the next Plan run.

### Where the new failure mode shows up

Not in the composition derivation log. That log iterates `page.guesses` — props that exist and whose
value could not be evidenced — so text with no prop never reaches it and cannot appear as
`text.aligned-by-position` or `text.unmatched`.

It surfaces in two places instead: `PlannedComponent.textCoverage` at Plan time, which is new, and
the per-page `textPresent` / `textTotal` signal with its `textMissingSample`, which already existed
and is where a composed page reports source runs it does not carry.
