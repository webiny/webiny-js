# Colour matcher and theme fit: proposed fixes

**A proposal. Nothing is built.** It follows from `parkcity-take3-background-colours.md`. Three fixes, the
exposure measured before proposing, the replay sets named, and predictions written before any replay. The
hero overlay is not here; it is a capture change, filed as
`ai-context/issues/capture-records-no-pseudo-elements-or-opacity.md`.

## Exposure, measured first

All figures are offline, over the stored Cluster artifacts and the themes the jobs pin today.

- **Runs:** 33 have a Cluster artifact. **24** store `resolvedColours` (the measured colours and their
  tokens). **9** predate the field and store none (2424 Tulane 22 and 23 Sep, The Vibe 22 and 24 Sep,
  Park City Palace 21-25 Sep ×4, Validation webiny.com 21 Sep).
- **Pinned themes: colour slots the matcher cannot read** (9 themes):

  | Value                                           | Where                         | Meant as              |
  | ----------------------------------------------- | ----------------------------- | --------------------- |
  | `#f7f7f9f2` (alpha 0.95)                        | Take 3, `surface.raised`      | a solid surface       |
  | `#000000b3` (alpha 0.70)                        | The Vibe, `surface.overlay`   | a translucent overlay |
  | `rgba(…, 0.5)`                                  | every theme, `surface.scrim`  | a modal backdrop      |
  | `rgba(…, 0.08)`, `rgba(…, 0.14)`, `transparent` | every theme, `action.ghost.*` | hover tints           |

- **Bindings to status colours:** 9 distinct, in 5 jobs, all light-grey section backgrounds:
  - Take 3: `#f7f7f9` → `feedback.info.background`, `#f2f2f2` → `feedback.danger.background`;
  - webiny.com: `#f5f5f5` and `#f8f8f8` → danger, `#f1f2f5` → info;
  - Freehill: `#f2f0eb` → danger;
  - 2424 Tulane: `#efefef` → `feedback.success.background`.

  Counted per run, 25 stored bindings: Take 3 has 5, webiny.com 4, Freehill 2 in each of 6 runs, and Tulane
  1 in each of 4.

- **How near a "fitted" token is.** Of 1,115 bindings with a token: 970 match exactly, 25 are within 6,
  and **120 are 6-24 away**.
- **Other parsers.** The matcher (`themeColourRoles`) is the only colour parser on the pipeline's side
  that accepts 6-digit hex only. Two others, in `api-theme-extraction` (`applyAssignment.ts`) and
  `theme-common` (`derive.ts`), parse hex for other purposes; they are not in scope.

## Fix 1: read near-opaque 8-digit hex

**Change.** `themeColourRoles` accepts `#rrggbbaa` when its alpha is **at least 0.9**, and uses its RGB.
Below 0.9 it is skipped, as every non-6-digit value is today. `rgba()` and `transparent` stay skipped.

**Why a cutoff, and why 0.9.** A translucent token is not the colour of its RGB. Matching The Vibe's
`#000000b3` overlay as black would bind the site's solid black sections to a translucent overlay token.
Compositing it over the page instead gives `#4d4d4d`, a grey the site does not use. 0.9 admits exactly one
slot in the nine themes, Take 3's `surface.raised` at 0.95, and nothing that is translucent by design.

## Fix 2: status colours are never candidates

**Change.**

- `color.feedback.*` leaves the matcher's candidate set for every role, not only backgrounds. A text
  colour bound to `feedback.info.foreground` (blue) is the same defect for text.
- The family check gets a `status` family. `crossesFamily` treats any role → status as a crossing. A
  status binding that arrives some other way (a Plan model's own binding) is then refused in the prompt
  and does not count in the fit.
- **Unchanged:** `surface.*` and `action.*.background` stay in a background's preferred set. A button's
  fill is legitimately `action.primary.background`.

**After both fixes, a light grey with no surface token near it lands on `surface.page` (white)** if within
24, and otherwise on no token, so the prompt says to write the hex directly. It never lands on a status
colour.

## Fix 3: the fit compares the token's value

**Change.** A colour counts as fitted only when its token is of an allowed family, not a status colour,
and resolves to **within 6** of the measured colour. Tokens 6-24 away are reported as **near**, with
their distance, in the misses, and are not fitted. Type and spacing are unchanged. Spacing already has its
own 15% rule.

**Why 6.** Of the 1,115 bindings, 970 match exactly. The 25 within 6 are rounding-level differences
between a computed colour and a written token. The 120 from 6 to 24 render a different colour. **This
threshold is a judgment, and yours to set.**

**The theme card** would show two figures instead of one, e.g. "Colours 82% · 11% near". The proposal
leaves the exact wording to you.

## Replay: offline, no model spend, no deploy

Each fix is replayed alone and then together, so every change can be attributed to the fix that made it.
Old and new matchers run on identical inputs, the measured colours against the job's pinned theme.
Cluster does not record which theme revision it ran against, so stored tokens are not the baseline. The
old matcher's output on the same theme is. Where the two differ, the pin changed since the run, and that
count is reported as a sanity check.

| Set                     | What                                                       | Input                                                                                          |
| ----------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **A: stored bindings**  | the 24 runs that store `resolvedColours`                   | each cluster representative's stored measured colours (hex, role, area)                        |
| **B: before the field** | the 9 runs that predate it                                 | measured colours recomputed from their captured trees with the current `resolveSectionColours` |
| **C: the cases**        | Take 3's 5 components, plus the 9 distinct status bindings | as in A                                                                                        |

Set B covers the plans made before these fields existed. Their Generate prompts never carried colour
lines, so the replay reports what they would get, not what they got.

## Predictions, written before the replay

- **Status bindings:** 25 before, **0 after**, in every set.
- **Fix 1 alone changes Take 3 only.**
  - Its `#f7f7f9` backgrounds (header, intro hero, contact us form, accessibility statement) bind to
    `surface.raised`, at distance 0.
  - Its footer `#f2f2f2` binds to `surface.raised` too, at about 10. Under fix 3 that reads "near", not
    fitted.
  - No other theme has a slot at 0.9 or above, so no other run changes.
- **Fix 2 alone:**
  - Take 3's greys go to `surface.page` (white; `#f7f7f9` is 12.8 away, `#f2f2f2` is 22.5).
  - webiny.com, Freehill and Tulane's status bindings go to a surface token within 24, or to none.
  - I expect most of them to go to `surface.page`.
- **No binding that matches exactly today (distance 0) changes** under fix 1 or fix 2.
- **Fit.** Take 3 has 57 bindings: 52 non-status, all exact today, and the 5 status ones.
  - **Fix 3 alone:** the fit is at most the fit before, for every run. Take 3 reads **52 of 57**, because
    the five status bindings no longer count.
  - **All three fixes:** Take 3 reads **56 exact and 1 near** (the footer at about 10). That is
    higher than 52, because the greys are then bound correctly. That is the fit now telling the truth,
    not a loosening.

## What stops the work

- **A binding changes for a reason not listed above,** meaning neither a status binding nor a colour
  newly matched by an 8-digit token.
- **Any exact binding moves.**
- **A Set B run's recomputed colours look nothing like its sibling runs' stored ones.** That would mean
  the current `resolveSectionColours` does not reproduce the old measurement, and Set B measures the new
  code, not the old plans.

## After the replay

If it holds:

1. Build the three fixes with tests from the real artifacts. Each Set C case becomes a test.
2. Re-run Generate for Take 3's five components only (a targeted run, about $1).
3. Check them in the admin.

A full run is for acceptance only, and only if you want one.
