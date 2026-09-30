# Every composition leaves its pages published, so one path has many pages

> **Package:** `@webiny/api-page-composition-poc` (`ComposePagesService`), and
> `@webiny/api-website-builder` (`GetPageByPathRepository`).
> **Severity:** high — 89 published pages across 38 paths; 18 paths are claimed by more than one, and
> `/` by eleven. Which page a URL serves is unspecified, so the same URL can render a different
> composition's components with no edit in between.
> **Status:** open. Distinct from [four sites' home pages all compose to
> `/`](./home-pages-from-different-sites-collide.md), which is `toPageIdentity` folding the host —
> one path derived from many sources. This is one source deriving one path many times.

## What happens

Composing a run creates a fresh Website Builder page for every source page and publishes it. It never
unpublishes or removes the pages the previous composition of the **same run** created, so they stay
published at the same paths. Compose a run four times and four published pages claim each of its
paths.

Measured across the four demo jobs — 11 page maps:

```
distinct paths                                38
published pages across all compositions       89
paths claimed by more than one page           18
```

```
 11 claimants  /
  4 claimants  /apartments/ct/bridgeport/floor-plans
  4 claimants  /apartments/ct/bridgeport/neighborhood
  4 claimants  /apartments/ct/bridgeport/residents
  4 claimants  /apartments/ct/bridgeport/accessibility-statement
  4 claimants  /apartments/ct/bridgeport/amenities
  4 claimants  /apartments/ct/bridgeport/contact-us
  4 claimants  /apartments/ct/bridgeport/apply-now
```

The four claimants of each Park city Palace path are its four compositions — runs 1, 2, 3 and 4 — not
four different sites.

## Nothing decides which one wins

`GetPageByPathRepository` asks for one entry and does not say which:

```ts
const result = await this.getEntry.execute<CmsEntryWbPage>(pageModel, {
  where: {
    values: { properties: { path } },
    published: true
  }
});
```

No sort, no tie-break, no "latest". With one match that is correct and has always looked correct.
With four it returns whichever the store hands back first, which is not a guarantee the query makes.

Fifteen consecutive calls for `/apartments/ct/bridgeport/neighborhood` returned the same page, so it
is **stable today** rather than random on every request. What it is not is _specified_ — and it
demonstrably changes when the pool changes, which is every time a run is composed again.

## Why the URL cannot pin it

A preview URL carries `wb.id`, which looks like it names the page:

```
/apartments/ct/bridgeport/neighborhood?…&wb.id=6ab6490674489a000240efd9%230001
```

The site route ignores it. `app/(site)/[[...slug]]/page.tsx` resolves purely by path —
`getPage(normalizeSlug(slug))` — and `wb.id` is read only by the _articles_ route. So that URL served
a different page from the one it names, and no amount of reloading it would have shown the page whose
id it carries.

## What this costs the comparison harness

The harness photographs a composed page by requesting its path, so it photographs whatever the path
resolves to, which need not be the composition it is comparing.

Its preflight compares the served `<title>` against the page map, which catches a **cross-job**
collision — Freehill's home page answering for Park city Palace's — because the titles differ. It
does not catch a **cross-composition** collision, because the same job's compositions produce the
same titles. That is the hole: the check was built for the collision that was known at the time.

Checked for the composition the harness last photographed, Park city Palace run 3:

```
paths whose URL serves this run's page:  7 of 8
/  map says 6abce115edd5a3000222a8ee#0001
   url gives 6abce3fb37648100029678d3#0001     (2424 Tulane — caught by the title check)
```

Seven of eight are right at this moment. That is the current ordering being kind, not the harness
knowing.

## The fix, in two halves

**Composition should not leave its previous pages behind.** Either unpublish the pages of the
previous `composeVersion` before publishing the new ones, or reuse the same pages and create new
revisions. The second is closer to what a real migration would do and makes `composeVersion` a
revision number rather than a new set of documents. Either way this is the half that removes the
ambiguity rather than resolving it.

**`GetPageByPath` should be deterministic anyway.** A query that returns one of several matches with
no ordering is a latent defect independent of this PoC — any project with two published pages at one
path has it. It should sort, and say what it sorts by.

Until the first half lands, a path with several claimants means the harness and the admin can be
describing different pages, and the comparison for such a path is not evidence.

## How it surfaced

Someone opened a composed page twice and the components changed completely, with no edit in between.
Both facts above are needed to explain it: several published pages at that path, and nothing
specifying which one answers — plus the run being composed again between the two loads, which is what
changed the answer.
