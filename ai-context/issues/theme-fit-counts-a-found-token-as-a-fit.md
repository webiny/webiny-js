# Theme fit counts a found token as a fit

> **Package:** `@webiny/api-component-extraction` (`features/theme/themeFit.ts`)
> **Severity:** high. The figure was meant to be shown to customers as the honest measure of how well the
> theme covers their site. It overstates exactly when the theme is wrong: **57 of 57 colours "fitted"** on
> ParkCity - Take 3, where five components render visibly the wrong colour.
> **Status:** open, 2026-10-10. A fix is proposed in
> `packages/api-component-extraction/scripts/baseline/reports/2026-10-10/colour-matcher-fix-proposal.md`.

## What happens

`themeFit` counts a measured colour as fitted when Cluster bound it to a token that does not cross
families (`colour.token && !crossesFamily(...)`). It never compares the token's value with the colour
that was measured. Two things therefore pass as a fit:

1. **A token that is near, not equal.** Cluster binds anything within 24 in RGB. Across the 24 stored
   runs with bindings, 1,115 measured colours have a token:
   - 970 match exactly;
   - 25 are within 6;
   - **120 are 6-24 away**, a visibly different colour.

   All 1,115 count as fitted.

2. **A token from the wrong family that the family check does not see.** `crossesFamily` treats any path
   containing `background` as a surface, so a section background bound to
   `color.feedback.info.background` (pale blue) counts as a fit. Take 3's header, intro hero, contact
   form, accessibility statement and footer are all bound this way, and the fit reads 100%.

## Where the figure has been shown or recorded

- **The run view's theme card** shows it under "Fits what was measured". Since 2026-10-10 it sits
  directly under the palette, as the measure the palette is read against.
- **`reports/2026-10-09/theme-in-pipeline-build-plan.md`:** "colours 69-93%" on the stored runs. Corrected
  in place.
- **`reports/2026-10-10/parkcity-take3-background-colours.md`:** the 57 of 57. Corrected in place.
- **`an-extracted-theme-cannot-express-its-own-sites-colours.md`:** "0 of 42 with no token" for Park City
  uses the same "any token within 24" definition. Corrected in place.

Every figure above is an upper bound, not a fit.

## Related

- [`parkcity-take3-background-colours.md`](../../packages/api-component-extraction/scripts/baseline/reports/2026-10-10/parkcity-take3-background-colours.md):
  the diagnosis that found it.
- The matcher defects that produce the wrong bindings (8-digit hex unread, status colours as surfaces)
  are separate, and are in the same proposal.
