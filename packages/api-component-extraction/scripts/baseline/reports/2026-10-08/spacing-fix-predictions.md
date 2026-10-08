# Spacing fix: predictions, named before the run

Written before the after-arm ran. The fix: extraction's override of the shared prompt's token catalog
with the theme manifest's vocabulary (each variable with what it is for and the site's value), the
worked examples' primitive spacing rewritten into the theme's slots, and the section's measured
spacing in the extraction prompt.

Arms, 9 runs each, dry-run mode, on thevibe Hero Intro, Freehill Amenities Highlights, check-run
Tulane FAQ Section:

- `sp-before`: the deployed prompt before the fix (the four dead lines already removed).
- `sp-after`: the fix.

## Should change

| Measure                                                                                                       | Before (expected) | After (predicted)  |
| ------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------ |
| First attempts failing on an unknown variable                                                                 | about 9/9         | at most 1/9        |
| Mean attempts per run                                                                                         | about 2.0         | at most 1.3        |
| Spacing fidelity: share of the section's measured spacing kinds the component reproduces within max(2px, 15%) | measured          | higher than before |

## Should not change

- Hex literal, house heading and mainly-centred detectors: 0/9 before and after (1/9 is within noise).
- Runs passing validation: 9/9.

## Already known before the run

- 85 of 95 components get a spacing block; of 226 measured values, 31 (14%) map to a theme variable.
  The themes' spacing slots mostly do not carry these sections' values, and `space.section` is the
  library default (`5.0625rem`) in all five themes. So spacing fidelity will come mainly from px
  values, not variables. On the three components here, none of the measured values maps to a variable.
- Spacing fidelity is measured on the desktop CSS, variables resolved as the browser would: semantic
  slots to the theme's value, primitives to the library default.
