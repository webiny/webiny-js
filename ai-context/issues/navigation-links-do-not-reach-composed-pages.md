# A promoted navigation's links mostly do not become destinations on composed pages

> **Package:** `@webiny/api-page-composition-poc` (most likely), possibly `@webiny/api-component-extraction`
> **Severity:** medium — the links exist in the tree, in the component and in the pipeline, and most
> of them still do not reach the composed page. Candidate for the next pass.

## What was fixed, and what it revealed

The sampler used to prune zero-area nodes and their whole subtree, which removed 2424tulane's
`<header role="banner">` — a zero-height `position: absolute` wrapper around a rendered 1300×60
navigation bar — from every page. Repairing that (see the capture evaluator's box repair) put the
navigation into the tree, and it now becomes a component: `2424Tulane/Site Header Navigation` is
promoted on every run.

Destinations per composed page moved, substantially:

|                                    | Before  | After   |
| ---------------------------------- | ------- | ------- |
| Destinations total                 | 14      | **44**  |
| Rewritten (internal)               | 1       | **25**  |
| External                           | 13      | 19      |
| **Destinations per composed page** | **1.3** | **4.0** |

That is a 3× move and it confirms the capture fix reached the output. It is also well short of where
it should land.

## The gap

| Site                      | Destinations per composed page |
| ------------------------- | ------------------------------ |
| parkcityplace             | **10.3**                       |
| 2424tulane, after the fix | **4.0**                        |

Both sites run the same CMS with a comparable page count (8 and 11 composed pages).

The arithmetic is what makes this worth a pass:

- The recovered `<header>` carries **16 links per page**, measured directly in the browser, on all 11
  pages. (The original measurement of the pruned subtree counted 19 links including some outside the
  nav proper; 16 is the header's own count.)
- 11 pages × 16 links is 176 link instances entering the pipeline.
- The composed pages carry **44 destinations, of which 19 are external** — so about **25 internal
  destinations across 11 pages, ~2.3 per page**.

So the navigation's links are in the tree, in a promoted component, and placed on pages, yet only a
small fraction become destinations the composed page carries.

## What this is not

- **Not the zero-area prune.** That is fixed and measured: the header is present on 11/11 pages, up
  from 1/11, and the section count moved 49 → 71 exactly as simulated.
- **Not invented destinations being dropped.** `dropped (invented)` is 0 on the run after the fix
  (it was 0 before too).
- **Not a placement failure of the nav component itself** — it is promoted and placed.

## Where to look

Between "the component has links" and "the composed page has destinations" sit the instance-props
derivation, the credibility rule that empties invented destinations, and the destination rewriting
pass (`rewriteDestinations`, `stripInventedBindings`, `recoverInventedDestinations` in the
composition PoC). One of those is the likely narrowing.

Worth checking first whether the nav component's links survive as _inputs_ on the placed instance at
all, or whether they are lost earlier — at Generate, when the model writes the component's source,
or at Assemble. That distinction decides which package the defect is in, and it is one query against
a stored run rather than an investigation.

## Reference figures

Run after the fix: `6ab5426e7c4ab700023c79b8#0001` (2424tulane, 11 pages, 71 sections, 13 components
generated, 8 promoted). Baseline: `6ab3ac9a1072ae0002c6a8c6#0001` (49 sections, 11 generated, 6
promoted, 1.3 destinations per page). parkcityplace comparison:
`6ab548f77c4ab700023c79c3#0001` (38 sections, 10.3 destinations per page).
