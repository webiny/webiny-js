# Non-content strings are excluded from the check and not from the prompt

> **Package:** `@webiny/api-component-extraction` (`validators.isNonContentText`, `componentGeneration`)
> **Severity:** medium — 16 of 34 components across the four sites are instructed to reproduce
> strings the page never displays as words. 27 strings in total. They render as literal words.
> **Status:** open. Diagnosed in `plans/component-extraction-visual-fidelity-report.md`.

## What happens

`isNonContentText` exists precisely because these strings are not content, and its own comment says
what requiring them would mean:

> Excluding these is not weakening the gate. They are not text the page displays, so requiring a
> component to reproduce them **measures nothing about fidelity** — and under a rendered check they
> fail for a reason unrelated to dropped content.

**The exclusion was applied to the validator and not to the prompt.** `buildPrompt` emits the list
unfiltered:

```ts
"Preserve this text content exactly:",
...component.sourceTexts.slice(0, PRESERVED_TEXT_LIMIT).map(text => `- ${text}`)
```

So the model is told to reproduce exactly the strings the validator has already decided prove
nothing — and, being unchecked, it is never told it was wrong to.

## How widespread

16 of 34 components (47%), 27 strings:

| site        | component                    | strings                                                                 |
| ----------- | ---------------------------- | ----------------------------------------------------------------------- |
| Freehill    | Contact Form with Map View   | `.` `keyboard_arrow_down` `attach_money` `chevron_left` `chevron_right` |
| 2424 Tulane | Floor Plan Filter            | `keyboard_arrow_down` `attach_money` `chevron_left` `chevron_right`     |
| 71 Westland | Explore Fenway Forward Intro | `keyboard_arrow_down` `attach_money` `.`                                |
| 2424 Tulane | Image Gallery Section        | `,` `.`                                                                 |
| 71 Westland | Hero Intro Section           | `.` `,`                                                                 |
| 10 others   | —                            | a single `.` or `,` each                                                |

Four components carry real icon-font ligatures; the rest carry bare punctuation.

## What it looks like

71 Westland's rendered filter bar reads:

```
Filter By:   [ Bedrooms keyboard_arrow_down ]   [ Bathrooms attach_money ]   refresh Reset Filters
```

The ligature names are drawn as text because the generated component has no icon font and was told
the strings were content to preserve. `attach_money` is attached to a **Bathrooms** control, which is
what an icon ligature looks like once it has been copied as a word rather than resolved as a glyph.

## Interaction with the bigger defect

The ligatures reach these components through the cluster union
(`a-component-must-contain-every-section-it-clusters-with`) — 71 Westland's intro has no filter bar
of its own. Narrowing the text list to the reference member would remove most of these as a side
effect. Filtering `isNonContentText` out of the prompt is still worth doing on its own: it is one
line, it is already the project's stated position, and it covers the cases where the ligature is in
the reference member.

---

## Fixed

`textsToPreserve` is now the single definition of what a component is asked to reproduce, applied by
the generation prompt and by both text-preservation call sites (Generate and Regenerate), so the
prompt and the check cannot drift apart again.

Re-ran Generate and render on all four sites (Plan was untouched, so its derived values stand).

**Components whose generated source still contains an underscore ligature: 0 of 33, from 4 of 34.**

Freehill's filter panel, which read "Bedrooms keyboard_arrow_down" and "Bathrooms attach_money", now
renders a pair of proper selects, and `attach_money` has become a `$` prefix on the price fields —
the model used the glyph's meaning once it was no longer being told to reproduce its name.

### The count was already half-fixed by the narrowing

The diagnosis measured 16 of 34 components carrying 27 such strings. Against the current plans it is
**8 of 34 carrying 11**, because `sourceTexts` is now the reference member's rather than the cluster
union (`a-component-must-contain-every-section-it-clusters-with`), which removed roughly half of them
as a side effect — as this issue predicted it would.

It did not remove the two that mattered. 2424 Tulane's _Floor Plan Filter_ is a single-member cluster
and Freehill's _Contact Form with Map View_ has two, so narrowing could not touch their ligatures.
Those were the only two components rendering ligature names as words, which is why the filter was
still worth doing on its own.

### What remains, by design

**3 of 34 components are still told to preserve a bare-word ligature** — `refresh` and `add` (2424
Tulane, Floor Plan Filter), `event`, `refresh` and `add` (Freehill), `Menu` (71 Westland). `event` and
`refresh` are visible as words in Freehill's rendered filter panel.

`isNonContentText` excludes a lowercase token **containing an underscore**, and its comment already
argued this exact residue:

> It also leaves `refresh`, `add` and `event` checked, which are probably ligatures too; a handful of
> false failures is the better side to err on, because the other side deletes an address from what
> the gate protects.

That holds. The wider rule was measured against the five sites and would have excluded ZIP codes
(70119, 02115), years (2026) and unit numbers (578, 644, 650). `Menu` in the list above is itself
plausibly a real button label. Widening the rule on three instances would trade a visible cosmetic
fault for an invisible content one, so the rule is unchanged.

### A side effect worth stating: one component now fails

Filtering **before** the `PRESERVED_TEXT_LIMIT` cap means a component whose text list exceeds the
limit is now held to more REAL texts than before, because the cap is no longer partly spent on
punctuation and ligature names.

Exactly two components are over the limit, and they are the same two that carried ligatures:

| component                             | total texts | real texts required, before → after |
| ------------------------------------- | ----------- | ----------------------------------- |
| 2424 Tulane · Floor Plan Filter       | 35          | 28 → **30**                         |
| Freehill · Contact Form with Map View | 38          | 27 → **30**                         |

Freehill's passed. **2424 Tulane's _Floor Plan Filter_ exhausted its attempts and did not generate**,
where it had generated in each of the two previous passes — Tulane produced 12 components rather than 13. Every model call succeeded, so it failed validation rather than generation.

This is a true negative rather than a regression in the filter: the component genuinely does not
reproduce all 30 of its content texts, and previously two of its thirty slots were spent on strings
the validator ignored anyway, so it was being graded on 28. Whether to raise `PRESERVED_TEXT_LIMIT`
so the cap stops being the binding constraint on large components is a separate decision, and is not
taken here.
