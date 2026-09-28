# ElementFactory collapses a scalar list to its last item, and the page 500s

> **Package:** `@webiny/website-builder-sdk` (`ElementFactory`)
> **Severity:** high — 5 of 2424tulane's 11 composed pages return HTTP 500 and render nothing at all.
> Surfaced the moment components started resolving; it was invisible while every page was blank.

## What happens

Five pages return `HTTP 500` with:

```
features.map is not a function
```

One generated component throws during server rendering, and because it throws during SSR the **whole
page** fails — not just that component. A visitor gets an error page.

Affected: `/apartments/la/new-orleans/` × `neighborhood`, `photo-gallery`, `amenities`, `residents`,
`floor-plans`.

## The component is not at fault

`2424Tulane/Intro/About with Stats` declares `features` correctly, as a list with an array default:

```json
{
  "type": "text",
  "list": true,
  "renderer": "Webiny/Tags",
  "name": "features",
  "label": "Features",
  "defaultValue": [
    "Sealed Concrete Floors Throughout",
    "Oversize Windows for Abundant Natural Light",
    "…"
  ]
}
```

`features.map(...)` is correct code against that declaration.

## What the page carries instead

The binding on the composed page is a **plain string**:

```
features        type=text  list=true   "Browse our floor plan options and get in touch with our friendly leasing team today…"
```

The path is `features`, the whole list, not `features/0`. For contrast, the same element's genuine
list is bound element-wise and works:

```
stats/0/value   type=text  list=false  "Beyond the Ordinary"
stats/1/label   type=text  list=false  "Schedule a tour"
```

So the composition binds lists correctly in general, and writes a scalar into this one.

## The cause: ElementFactory, not the composition

The composition is correct. Every layer that builds an instance's inputs was run against the real
manifest and each one produces an array for `features`:

```
deriveCompositeInputs   features  declared list=true  ->  array(8)
scalarInputNames        -> eyebrow, heading, body     (no list input can receive a scalar)
manifest defaults       features  -> undefined
```

`ElementFactory.createElementFromComponent` is the step after them, and it is where the array stops
being an array. Given five distinct items for a scalar-typed list input:

```
features = ["ONE", "TWO", "THREE", "FOUR", "FIVE"]

   ->  features   list=true   "FIVE"
```

**It keeps the last item and discards the rest**, writing a bare string into a binding it simultaneously
marks `list: true`. An object-typed list on the same component is handled correctly, element-wise:

```
   stats/0/value   "80"      stats/0/label   "Walk Score"
   stats/1/value   "86"      stats/1/label   "Bike Score"
```

So the defect is specific to **lists of scalars** — `text`, `longText`, `lexical`. Supplying nothing
yields `[]`, which is right; supplying a bare string throws `value.forEach is not a function`, which is
why the composition could never have produced this shape itself.

Measured across the four composed sites: 2,231 bindings, 91 declared `list: true`, **34 of them
collapsed to a scalar**. Affected inputs are `features`, `body` and `formFields` — every one a scalar
list.

## The inverse does not happen

An array bound into a scalar input would render as something odd rather than throwing, and would
therefore be invisible. Checked over the same 2,231 bindings: **0 occurrences.** The collapse goes one
way.

## Does anything validate a bound value against the declared list flag?

No — and this is the part worth arguing with, because the obvious durable fix does not work.

A check at compose time, comparing each derived value against the input's `list` flag, **would have
passed**: compose's value is a correct array. The corruption happens after compose hands it over. A
check there would have reported healthy on all 34.

The check has to be on the **bindings**, after the element is built. That is precisely the lesson
`stripInventedBindings` already encodes, in its own words: "a check placed on an intermediate only
covers the shapes that intermediate happens to carry". This is the same mistake available twice.

## Why it appeared now

It did not appear before because nothing rendered. While every component was unresolvable, every page
was blank but returned 200 — see
[composed pages render no components](./composed-pages-render-no-components.md). Fixing the name
mismatch made components render, and rendering is what executes `features.map`.

That is the second defect in a row that the artifact-derived signals could not see: these five pages
report healthy section counts, text coverage and destination counts while serving a 500. See
[the fidelity signals measure the document, not the page](./fidelity-signals-measure-the-document-not-the-page.md).

## Fix sketch (not implemented)

Three, in order of how fundamental:

1. **ElementFactory should bind a scalar list as a list.** It already handles object lists correctly,
   so the shape it should produce is not in question — either an array on one binding, or element-wise
   paths (`features/0`, `features/1`) the way object lists get them. This is the actual defect and it
   affects every Website Builder consumer, not only migrations: any component with a `createTagsInput`
   or a scalar list loses every item but the last.
2. **Assert the binding against the declared list flag**, on the bindings rather than the inputs, for
   the reason above. 34 violations would have been caught the moment they were written.
3. **Do not let one component's failure destroy the page.** A component that throws should render as
   an empty slot with the reason recorded, the way an unmigrated image or an invented destination is.
   A page that loses one section is a degraded migration; a page that 500s is no migration at all,
   and the difference is an error boundary.

(1) is the fix. (2) is what makes the next one visible. (3) is what keeps a single bad component from
costing a whole page, and would have turned this from five dead pages into five pages with one missing
section and a line in the discard log.
