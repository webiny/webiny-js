# The fidelity signals measure the page document, not the page

> **Package:** `@webiny/api-page-composition-poc`
> **Severity:** medium as a defect, high as a framing correction. The numbers are not wrong; they
> measure less than their names suggest, and nothing has ever checked the thing they are read as
> proxies for.

## What the signals actually read

Every fidelity signal this PoC reports is computed from artifacts — the segment artifact, the assemble
artifact and the page document it just wrote:

| signal                                   | computed from                                         |
| ---------------------------------------- | ----------------------------------------------------- |
| sections in source vs instances composed | the segment artifact against the placements it made   |
| text coverage                            | source text runs against the bindings on the document |
| destination counts                       | the bindings, before and after rewriting              |
| unplaced sections                        | placements it did not make                            |

None of them loads a page. They describe **what the composition intended and wrote**, which is a real
and useful thing, but it is not what a visitor sees.

## How that was established

Every composed page across four sites renders **blank** in the website app — 0 images, 0 text, 0
sections — because the name a page references and the name a bundle registers under never match (see
[composed pages render no components](./composed-pages-render-no-components.md)).

While that was true, the signals read healthy. For a single 2424tulane page, at the moment it rendered
nothing at all:

```
sections 7, assembled 7, composed 7, text 48/59
```

Seven of seven instances placed, 81% of text carried. The image work in the same series measured 106
image bindings repointed at File Manager with all 69 urls returning HTTP 200 — also true, also
invisible, because no component was rendering to use them.

**Nothing in the pipeline disagreed with anything else**, because every check reads the same side of
the boundary.

## The correction to carry

The phrase "instances placed", "text preserved" and "destinations per page" have been used throughout
this work as though they described a migrated page. They describe a **page document**. A page document
with correct bindings, correct destinations and complete text can render nothing whatsoever, and did,
for the entire time those numbers were being reported and acted on.

That is not an argument against the signals. They caught real defects — the text-preservation validator
reading the wrong thing, invented destinations, invented images — and they remain the only cheap check
in the pipeline. It is an argument that **their names overstate them**, and that a whole class of
failure sits beyond every one of them: anything between a correct document and a rendered page.

## What closes it

Something has to render a page and look at the result. That is the visual comparison harness, and its
first job is not prettiness — it is being the only check on the far side of the boundary. Until it
exists:

- No number reported by this PoC should be described as measuring a migrated page.
- A run can report complete success while producing pages nobody can read.

Worth renaming the signals to say what they measure (`textCarriedInDocument` rather than
`textPresent`) whenever they are next touched, so the names stop doing the overstating.
