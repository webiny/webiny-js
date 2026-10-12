# A rebuild can unpublish a working page, and says only "N with problems"

> **Package:** `@webiny/api-page-composition-poc` (`CompositionWriter`'s retirement step), reached
> through `BuildSiteTask` and same-tenant composition alike.
> **Severity:** high — a site loses a page that was live, and the build reports success with a count.
> **Status:** open. Case 1 is being fixed in site stage MS1; case 2 is reported, not changed.
> **Found:** while scoping the site stage, 2026-10-12, by reading the code. **Not yet seen deployed.**

## What happens

Composing produces a whole new set of pages. After publishing them, the writer unpublishes every page of
this job's earlier compositions in the same tenant whose id is not in the new set (the retirement step
added by [every-composition-leaves-its-pages-published](./every-composition-leaves-its-pages-published.md)).
It decides by page id only. It does not ask whether the earlier page's path got a new page.

### Case 1: a page that composed last time and fails this time

- **Build 1** composes `/amenities` and publishes it.
- **Build 2** fails to compose `/amenities`, for any reason a page can fail: a component that cannot be
  placed, a Website Builder write that errors, a path check that fails.
- **What happens:** the earlier `/amenities` is unpublished anyway, because its id is not among build 2's
  pages, and nothing replaces it.
- **Result:** the site had a working page and now has none at that path. The build's last step reads
  "N page(s) published; 1 with problems". It does not say that a live page was taken down.

The same thing happens on a same-tenant recomposition. It needs no selection: rebuilding the same run is
enough.

### Case 2: building from a later run that assembled fewer pages

- **Run A** built `/a` to `/h`.
- **Run B** of the same job assembled `/a` to `/f`, perhaps after a page was excluded in Segment.
- **What happens:** building run B unpublishes `/g` and `/h`.
- **Is it a defect?** That is intended: a job is one site, built from its latest run. But nothing says
  it happened, so it reads exactly like case 1.

### Case 3, for MS2: a page selection

With a page selection, which the site stage design proposes for MS2, a second build with a different
selection would unpublish the first selection's pages, with no error. The design's answer is a union
of selections, recomposed whole (`scripts/baseline/reports/2026-10-12/site-stage-design.md`). MS1 has
no selection, so this case does not arise there.

## Why it went unseen

Same silent-wrong shape as the rest of this week. The failure is recorded per page in the page map's
`failed`, and the count is shown. The consequence, a live page taken down, is in neither. A reader of
"1 with problems" assumes the page is still as it was.

## Fix (MS1)

- **Case 1:** an earlier page is retired only when its path got a new page in this composition. An
  earlier page whose path is in this run's assembled pages but failed this time stays published, and the
  composition records it as **kept** in its page map. That way the next composition still sees it and
  retires it once its path composes again; without that, a kept page would drop out of every map and
  stay published beside its replacement, bringing back two pages on one path.
- **Case 2:** unchanged in behaviour, now said. The pages unpublished because the run no longer has
  them are counted and named in the composition's result and in the site build's step text.
