# Sub-heading levels can differ between pages, and one input carries only the main one

> **Package:** `@webiny/api-component-extraction` (the heading instruction) and
> `@webiny/api-page-composition-poc` (`headingLevelInput.ts`)
> **Severity:** low. The main heading is right on every page. Some sub-headings come out a level off on
> some pages.
> **Status:** accepted limitation, recorded 2026-10-12. Not built around.

## If you are here because a sub-heading has the wrong level

A component is generated once for every page its section appears on, and the same section can sit at a
different heading level on different pages: a hero that is the `h1` on the home page and an `h2`
elsewhere. That is why the component takes its main heading's level from a `headingLevel` input, which
composition sets per page from that page's own source (`headingLevelInput.ts`).

**Only the main heading is set per page.** The instruction tells the component to render the other
headings at the same distance below the main one as the generating page shows them, so a section
whose page shows `h2` then `h3`s renders `headingLevel` then one level below it.

## How often that is right

Measured over 385 components in 31 runs (`scripts/baseline/reports/2026-10-12/item4-data-replay.md`):

- **180 components appear more than once. In 19 of them the main heading's level differs between
  pages.**
- **In 8 of those 19, the levels below it keep the same distance.** One input carries them correctly.
- **In the other 11 the sub-headings differ as well:** one page's sub-headings are `h2`s, another's
  `h3`s, or a page has sub-headings and another has none. Those come out at the generating page's
  distance, which is a level off on the other pages.
- In the demo runs, one component's main level differs between pages: Take 3's "Property Highlights
  Links".

## Why it is not fixed

Carrying every heading's level per page would mean one input per heading, or a list input the
component maps over. The component's structure would then follow the heading count of one page while
the others differ. That cost was not taken for a sub-heading level on 11 of 385 components.
