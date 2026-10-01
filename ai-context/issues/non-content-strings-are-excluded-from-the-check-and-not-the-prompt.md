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
