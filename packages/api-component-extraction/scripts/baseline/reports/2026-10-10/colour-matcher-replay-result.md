# Colour matcher replay: result

The replay that `colour-matcher-fix-proposal.md` named, run offline: no model spend, no deploy, nothing built.
Decisions recorded before it ran:

- the 0.9 alpha cutoff, set from two observed values rather than derived;
- the fit tolerance of 6, which separates same-colour from different-colour on this corpus and is not a
  perceptual threshold;
- status colours as their own family.

## How it was run

- **The old matcher is the real code.** The harness never copied it. For each colour it asked
  `resolveSectionColours` itself, with a one-node section painted that colour (in `rgb()` form, as Capture
  records it).
- **The new matcher is a copy of `nearest()` with the proposed candidate set.** Run with no fixes switched
  on, it agrees with the real code on **all 1,851 inputs**.
- **Old and new matchers ran on the same inputs**, each job's pinned theme through
  `generateManifestArtifact`, as Cluster builds it.
- **Set A:** 24 runs, 1,309 stored measured colours.
- **Set B:** 9 runs that predate `resolvedColours`, 542 colours recomputed from their captured trees with
  the current `resolveSectionColours` and `backdropColour`.
  - **Limit:** background images were treated as covering. Cluster measures from the image files which
    ones are see-through, and that was not reproduced.

## Sanity checks

- **Stored versus real code on today's pins:** 17 of 1,309 differ, all in the webiny.com run. That run
  clustered at 08:57; the theme it pins now was published at 09:45, so the pin changed after Cluster ran.
  It is not a code change.
- **Set B against the same sites' later runs:** 8 of 9 runs share 71-100% of their top-12 colours with a
  later run of the same site. The Vibe's 22 September run is at 41% against any single later run, but all
  12 of its top colours appear in The Vibe's later runs. The recomputation reproduces the measurement.

## Against the predictions

| Prediction                                                         | Result                                                                                                                                                   |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status bindings 25 → 0                                             | **27 → 0.** The 25 was my arithmetic: Freehill's runs hold 8, 4 and 2, not 2 each. Stored also holds 27.                                                 |
| Fix 1 alone changes Take 3 only                                    | **Held.** 5 bindings, all Take 3.                                                                                                                        |
| Fix 2 alone: Take 3's greys → `surface.page`                       | **Held** (12.8 and 22.5 away).                                                                                                                           |
| Fix 2: most other status bindings → `surface.page`                 | **Wrong.** Of the other 7 distinct cases, 2 go to `surface.page`, 4 to `surface.sunken` (14.9-18.7 away), and **Tulane's `#efefef` to `border.subtle`**. |
| No exact binding moves                                             | **Held**, 0 in every variant.                                                                                                                            |
| Every change is a status binding or a newly matched 8-digit colour | **Held.** Every change in every variant was a status binding.                                                                                            |
| Set B: what the older plans would get                              | **No status bindings at all, so no change** under any fix.                                                                                               |
| Fit, fix 3 alone: never higher than before                         | **Held**, in all 33 runs.                                                                                                                                |
| Take 3: 52 of 57 (fix 3 alone); 56 matched and 1 near (all three)  | **Held exactly.**                                                                                                                                        |

## The fit, old and new

All three fixes applied; "near" means a token 6-24 away.

| Run                             | Old fit    | Matched | Near |
| ------------------------------- | ---------- | ------- | ---- |
| ParkCity - Take 3               | 57 of 57   | 56      | 1    |
| Park city Palace (1 Oct)        | 42 of 42   | 39      | 3    |
| 71 Westland rehearsal           | 58 of 72   | 58      | 0    |
| 2424 Tulane (24 Sep)            | 80 of 113  | 72      | 8    |
| Freehill Street Lofts           | 18 of 25   | 15      | 3    |
| TheVibe Baseline                | 82 of 120  | 51      | 31   |
| webiny.com, theme from the site | 101 of 113 | 84      | 17   |
| Validation webiny.com (Set B)   | 80 of 118  | 36      | 44   |

The old figure overstated by 0 (71 Westland) to 44 (webiny.com validation). The near counts are where the
theme and the site actually differ, the actionable half the card will show.

## One new question, not in the proposal: a background bound to a border token

With status colours gone, Tulane's `#efefef` section background finds no surface within 24. It falls back
to any family and lands on `border.subtle`, an exact match. It renders the right colour today, but it is
the crossing the family exclusion exists for: change the theme's subtle border and that section's
background repaints. Background → border is not on the refused list (text ↔ surface, and border → text,
are), so it also passes the fit.

**The fixes do not create this crossing; they add to one that already exists.** Background → border
bindings:

- **Today:** 7, all Freehill's `#dddacd` → `border.subtle`, in every Freehill run.
- **After the fixes:** 11. Those 7, plus Tulane's `#efefef` in 4 runs (3 Fixes Check and 1 earlier run).

Refusing background → border would send both greys to "no token, use the hex", which is what the
prompt already says for a colour the theme cannot express. **Yours to decide before building.** It is
the same kind of rule as the refused crossings, so it would sit with them.

_(Corrected before commit: a first draft counted only the 4 new Tulane bindings.)_

## Not changed

Nothing is built. The harness was a throwaway test, now removed. The fit line on the theme card is
hidden (deployed), and returns with fix 3 as "N of M matched, K near".
