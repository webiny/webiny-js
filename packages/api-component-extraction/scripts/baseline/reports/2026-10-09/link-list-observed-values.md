# How widespread is wrong text in link lists?

> **Correction, 2026-10-10: this report measured labels, not links, and its "clean" verdict is
> withdrawn.** The page sweep counts a composed link as wrong only by its label, so a right label
> pointing at the wrong place passes. It called 71 Westland clean; measured on destinations, the
> rehearsal site has **48 of 110 links wrong or dead**, including "View Floor Plans" going to Facebook and,
> in the footer on every page, the address and property name going to a 404
> (`2026-10-10/link-targets-71-westland.md`).
>
> **2424 Tulane, Freehill Street Lofts, The Vibe and webiny.com are unproven on targets, not clean.** The
> "0" rows below are zero wrong labels and nothing more. The finding about Plans' wrong link text stands;
> what is withdrawn is the conclusion that composed pages are clean.

The measurement asked for in `footer-thinking-quality.md`, finding 1. It is offline over stored Plan
artifacts and captured page trees, with no model spend. Scope: every Plan prop typed `Link`, in the latest
planned run of all 19 jobs.

## Method

- **Ground truth** is the captured page tree of each component's member sections, read from blob
  storage. A section's link labels are the text of its `<a>` elements, plus the alt text and icon labels
  of what each link shows. Images-only links are labelled by their alt, as "Corporate Logo" is.
- **Each observed value of a `Link` prop is classed against its own component's member sections:**
  - **link label:** exact, or a partial match;
  - **button label:** text of a `<button>` or button-type input;
  - **non-link text:** in the section, but not in any link or button;
  - **punctuation:** no letters or digits, never a real label;
  - **absent:** not found in the section.
- **Corrections made to the measure before reporting:**
  - Alt text and icon labels were added after "Corporate Logo" read as absent; it is a logo link's alt.
  - Punctuation was split out after "," read as a link label; it matched a comma inside some link's text.
  - Button labels were split out.
- **"Absent" (80 values) is reported as unverifiable, not counted.** Nearly all are header navigation
  labels ("Floor Plans", "Amenities", "FAQ"), real links in collapsed or off-canvas menus whose boxes sit
  outside the header section's box.
- **I read all 66 flagged props** (any non-link-text or punctuation value) and sorted them into three
  groups. Many clickable tabs are not `<button>`s, so no structural rule separates controls from wrong
  text. The sort is my judgment, made prop by prop.

## In the Plans

| Group                                                 | Examples                                                                                                                                                | All 19 runs | The 5 demo jobs |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------- |
| Link props measured                                   |                                                                                                                                                         | 203         | 55              |
| **Wrong text in a link list**                         | "Copyright ©", "Office Hours", headings ("Your Future Looks Bright", "Welcome To"), form labels ("Last Name", "Your Name"), paragraphs, lone "," labels | **49**      | **15**          |
| Right text, typed as a link where the source has none | amenity names, the property name, an address, an eyebrow                                                                                                | 7           | 2               |
| Legitimate controls, not defects                      | floor-plan tabs "A1-A3", map category tabs, "Submit", a slideshow dot                                                                                   | 9           | 3               |
| Ambiguous                                             | a map's view options                                                                                                                                    | 1           | 0               |

**Per demo job** (wrong-text props / link props):

| Job                    | Wrong-text props |
| ---------------------- | ---------------- |
| 2424 Tulane            | 7 / 23           |
| Park city Palace       | 5 / 12           |
| 71 Westland Apartments | 2 / 9            |
| Freehill Street Lofts  | 1 / 7            |
| The Vibe Apartments    | 0 / 4            |

**About a quarter of link-list props carry wrong text** (49 of 203; 15 of 55 on the demo jobs), and every
site but The Vibe has some. It is widespread in the Plans.

## In what a demo shows

Composition re-derives link lists from each page's own captured links, so a Plan's wrong values reach a
composed page only where that derivation falls back to the component's defaults. Swept page by page: a
composed link counts only if its label is one of the wrong values and is not a link label anywhere on
the same source page.

| Composed site                                            | Pages   | With a wrong link label                                             | Link destinations (added 2026-10-10)                                   |
| -------------------------------------------------------- | ------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Park City, site tenant** (`parkcityplacebaseline6a3d`) | 8       | **8: "Copyright ©" in every footer**; "& Relax" also on floor plans | not measured                                                           |
| **Park city Palace, root** (run 5)                       | 7 live  | **4: "Explore"** (amenities, neighborhood, contact-us, floor-plans) | not measured                                                           |
| 71 Westland, site tenant                                 | 10      | 0                                                                   | not measured                                                           |
| **71 Westland, rehearsal tenant** (measured 2026-10-10)  | 10      | not swept                                                           | **48 of 110 wrong or dead**; footer address and name 404 on every page |
| webiny.com, site tenant                                  | 3       | 0                                                                   | **unproven**                                                           |
| 2424 Tulane, root (run 4)                                | 10 live | 0                                                                   | **unproven**                                                           |
| Freehill Street Lofts, root                              | 1 live  | 0                                                                   | **unproven**                                                           |
| The Vibe, root                                           | 8 live  | 0                                                                   | **unproven**                                                           |
| 71 Westland, root                                        | 9 live  | 0                                                                   | not measured                                                           |

**So wrong link text is widespread in the Plans and narrow in composed labels: today it shows on Park
City.** Composition masks the wrong labels elsewhere. It does not make the links right: where destinations
were measured, on 71 Westland, nearly half are wrong. _(Corrected 2026-10-10; this line said "narrow on
composed pages".)_

**Where it is not masked:** the generated components' own defaults. Every render on the Generate card,
the Library preview, and a component dropped fresh into the editor show the Plan's values. That is where
the 2424 Tulane Footer's "Copyright © 2026 Copyright ©" was seen, though the composed Tulane pages carry
no wrong labels (their destinations are unproven).

## What it changes for choosing demo pages

- **Park City is the site to avoid or fix.** In its own tenant every page's footer has a "Copyright ©"
  link. In root, four of its pages have an "Explore" link that is a heading fragment.
- ~~71 Westland, 2424 Tulane, Freehill Street Lofts, The Vibe and webiny.com composed pages are clean on
  this measure.~~ **Withdrawn 2026-10-10.** They carry no wrong labels. 71 Westland has 48 of 110 links
  wrong or dead when destinations are checked; the other four are unproven on destinations, not clean.
  The footer is the risk area: on 71 Westland, two of the four links not to click live are in the footer
  on every page.
- **Do not show a component's Library preview or Generate render** as "the migrated footer" for Tulane or
  Park City; those show the defaults.

## Limits

- **Matching is exact text**, after whitespace and case normalisation. A wrong value that happens to
  equal a real link label elsewhere on the page is not counted. That is why the page sweep checks each
  label against the source page's own links.
- **The page sweep reads `<a>` labels in the rendered HTML only.** Wrong text rendered as plain text (not
  as a link) is not counted here.
- **The 80 "absent" values are unverifiable** by this method. A few are clearly wrong ("Monday -
  Friday:" as a header nav link) and are not in the totals.
- **The sort of the 66 flagged props is my judgment.** The per-prop list is in the scratchpad
  (`linkprops/results.json`).
