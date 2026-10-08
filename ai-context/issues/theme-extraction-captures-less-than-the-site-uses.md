# Theme extraction captures less than the site uses: colour, type and spacing

> **Package:** theme extraction (the pipeline that produces a site's theme), observed from
> `@webiny/api-component-extraction`
> **Severity:** high as one finding. Each instance makes generated components fall back to plain
> values, or to variables carrying another value, for things the site plainly has.
> **Status:** open. One finding with three instances; read them together, not as three bugs.

## The finding

The extracted theme is narrower than the site it was extracted from, in each dimension measured so far.
Component extraction then has to express the site in a vocabulary that lacks it, and every downstream
fix has worked around that rather than removed it.

| Dimension | What the site uses                                                  | What the theme holds                                                                                                                                                          | Issue                                                                                                                          |
| --------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Colour    | 206 measured colours across four sites                              | 26 have no token within 24 in RGB; some exist only under another family (a dark background only as `color.text.primary`)                                                      | [an extracted theme cannot express its own site's colours](./an-extracted-theme-cannot-express-its-own-sites-colours.md)       |
| Type      | display headings at 52-72px on three of four sites                  | every theme tops out at 43-45px; body and heading roles share sizes (thevibe: body = `heading.3` = 22px), so a size cannot say which role it is                               | [theme extraction stops short of the site's own display headings](./theme-extraction-stops-short-of-the-sites-own-headings.md) |
| Spacing   | each section's paddings and gaps, measured from the captured styles | five semantic slots; 31 of 226 measured section values (14%) match one, and `space.section` is the library default (`5.0625rem`) in all five themes, so it was never measured | this issue (below)                                                                                                             |

## Spacing, the third instance

Measured 2026-10-08 over the 95 planned components of the five demo runs
(`packages/api-component-extraction/scripts/baseline/reports/2026-10-08/spacing-diagnosis.md`,
`spacing-fix-result.md`):

- 85 components have measurable spacing; of 226 values, 31 match the theme slot for their kind.
- The slots that exist hold one site-wide value each (`--wby-space-gap` 14-30px), while sections use
  several; container paddings of 10-50px were measured against a single container slot.
- `space.section` is `5.0625rem` in every extracted theme: the default, not a measurement.

The generator now gives the measured px where no slot carries it, and says what the slot renders
instead. That keeps the components faithful and leaves the theme no richer.

## What it means downstream

Several fixes in component extraction work around this: cross-family colour tokens refused (#6), ties
between heading and body sizes broken by role (#5), px given where no spacing slot carries the value.
Each was right, and none makes the theme express the site. A theme that measured the site's own colours,
type steps and spacing would remove the need for all three.
