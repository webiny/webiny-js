# A string bound to a list input takes the whole page down with a 500

> **Package:** `@webiny/api-page-composition-poc`
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

## What is established and what is not

**Established:** the component declares a list, the default is an array, the page carries a bare
string, and the page 500s as a result.

**Not established:** which composition path writes it. It should not be the scalar path —
`scalarInputNames` excludes `definition.list` precisely so "a list input handed anything other than an
array throws inside `ComponentInputTraverser`" — and the list-of-scalars branch in
`deriveCompositeInputs` assigns `collectPlainTexts(node)`, an array. Something between those two
writes a string, and finding it is the first step of the fix rather than a guess to build on.

## Why it appeared now

It did not appear before because nothing rendered. While every component was unresolvable, every page
was blank but returned 200 — see
[composed pages render no components](./composed-pages-render-no-components.md). Fixing the name
mismatch made components render, and rendering is what executes `features.map`.

That is the second defect in a row that the artifact-derived signals could not see: these five pages
report healthy section counts, text coverage and destination counts while serving a 500. See
[the fidelity signals measure the document, not the page](./fidelity-signals-measure-the-document-not-the-page.md).

## Fix sketch (not implemented)

Two layers, and both are worth having:

1. **Do not write a scalar into a list input.** Find the writer and stop it. The manifest says
   `list: true`; that is checkable at bind time, and a binding that violates it is a bug wherever it
   comes from.
2. **Do not let one component's failure destroy the page.** A component that throws should render as
   an empty slot with the reason recorded, the way an unmigrated image or an invented destination is
   recorded. A page that loses one section is a degraded migration; a page that 500s is no migration
   at all, and the difference is an error boundary.

(2) belongs in the renderer rather than here, and would have turned this from five dead pages into
five pages with one missing section and a line in the discard log.
