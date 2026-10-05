# Theme extraction stops short of the site's own display headings

> **Package:** theme extraction (the pipeline that produces a site's theme), observed from
> `@webiny/api-component-extraction`
> **Severity:** high — every one of the four extracted themes tops out at 43–45px while three of the
> four sites set display headings at 52–72px. A migrated component cannot express its own section's
> largest type in the theme's vocabulary, so it falls back to a plain value and the theme stops being
> the single place that type is defined.
> **Status:** open.

## What happens

These are migrations onto the site's **own** extracted theme, so a size the site uses should have a
typography role. Measured across the four demo sites, the largest role in each extracted theme is
smaller than the site's largest heading.

| site             | theme's type scale (px)                    | largest role | sizes the section used that it cannot express |
| ---------------- | ------------------------------------------ | -----------: | --------------------------------------------- |
| Park city Palace | 45, 45, 27, 22, 18, 16, 16, 15, 15, 15, 13 |       **45** | 60, 52, 52                                    |
| 2424 Tulane      | 45, 45, 31, 25, 20, 20, 16, 16, 15, 15, 14 |       **45** | 72, 60, 60, 40, 38.7                          |
| 71 Westland      | 43, 24, 20, 18, 16, 16, 14, 14, 14, 13, 12 |       **43** | — none                                        |
| Freehill         | 45, 32, 24, 20, 20, 17, 17, 14, 14, 14, 14 |       **45** | 52.5                                          |

Every theme has exactly 11 typography roles — the canonical set (`type.body`, `type.bodySmall`,
`type.caption`, `type.lead`, `type.code`, `type.heading.1`–`type.heading.6`) — and in three of four
the heading roles stop well below what the pages actually render.

Two of the four themes also carry a **duplicate 45px** as their two largest roles, so `heading.1` and
`heading.2` are the same size. The scale has fewer distinct steps than it appears to.

## How it surfaces

Plan now measures each section's type scale and attaches the typography role nearest each size, so a
generated component expresses type through the theme where it can and a plain value where it cannot
(`nothing-tells-the-model-how-big-anything-is`).

**10 of 86 measured sizes (12%) fall back to a plain value, and nine of the ten are headings above
the theme's largest role.** The tenth is a 12px caption on 2424 Tulane, below its smallest.

That fallback rate is the symptom, and it is the reason the fallback was instrumented: the plain value
is a legitimate escape the contract already permits, but every use of it is a place where the theme
is no longer the single definition of the site's type.

## Why it matters beyond tidiness

A component that writes `font-size: 60px` directly is correct today and unmanaged tomorrow. Retheming
the site, adjusting the scale, or editing `heading.1` moves every heading except the ones that were
too large for the theme to hold — which are the most prominent ones on the page.

## What it is not

Not a conflict between fidelity and the theme. The fidelity target and the theme are supposed to be
the same thing here, because the theme came from this site. A size the site uses and the theme cannot
express is a gap in extraction, not a disagreement about what the component should look like.

Not the model's doing either: it is given the measured size and the nearest role, and it uses the role
whenever one is offered.

## One finding, seen twice

`an-extracted-theme-cannot-express-its-own-sites-colours` is this issue in the colour slots: 26 of
206 measured colours across the same four sites have no token within reach, and each one becomes a
hardcoded hex for the same reason a too-large heading becomes a hardcoded `font-size`.

**Theme extraction captures less than its own site uses.** Type and colour are two appearances of
that one defect, found by two independent passes, and it should be expected to surface in every
appearance pass that follows — spacing, radius, shadow, border width. Each pass makes it countable in
its own dimension; none of them is the fix. The fix is extraction driven by what the captured pages
actually use, and the pipeline already derives those lists per section.
