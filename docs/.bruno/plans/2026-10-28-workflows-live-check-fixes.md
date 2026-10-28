# Workflows live check fixes (2026-10-28)

Source: the visual check of the deployed admin after the design system alignment. Screenshots are in the session scratchpad `uicheck/`.

## Rules (binding)

- admin-ui is the source of truth for every component.
- Workflows code defines no colours and no other visual styling: no colour, border, radius, shadow, opacity, font or arbitrary `[...]` classes, and no inline styles. The only exception is the step-colour data, passed through admin-ui props such as `colorMark`, `swatchColor` or a `ColorPicker` value.
- Layout utilities and design-system spacing and size tokens are allowed: `flex`/`grid`/`gap-*`/`p-*`/`m-*`, `w-*`/`max-w-*` from the theme scale, `min-w-0`, `truncate`, `break-words`.
- If a needed component or variant is missing from admin-ui, do not build it in workflows. Leave the gap and list it under "Needs a design-system component" at the end of this file. It goes to the designer.
- Never change `@webiny/admin-ui`, `app-admin`, `app-headless-cms`, `app-website-builder` or `api-headless-cms`.
- Tests: behaviour and structure assertions with `data-*` hooks. Never assert Tailwind or admin-ui classes. Run one file or folder at a time, never in parallel.
- Before each commit, run the pre-commit chain. One commit per package, Conventional Commits, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never amend, never push.

## Fixes

1. **Steps popover off-screen (Critical).** In `review/presentation/targetReview/components/ReviewStepsPopover.tsx`, a long comment stretches the popover to 2356px, and Radix places it off-screen.
   - Cap the content width with a theme `max-w-*` token. Pick the token from `packages/admin-ui/src/theme.css` closest to 380px, for example `max-w-sm` if defined. Let text wrap with `break-words`.
   - Test: a 600-character comment renders inside the popover, and the content carries the width cap via a `data-*` hook.
2. **Progress shows 4% (Critical).** `ReviewProgress.tsx` / `ReviewBar.tsx`: admin-ui `ProgressBar` reads `value` as a percent and ignores `max`.
   - Pass `value={Math.round(approved / total * 100)}`. With `total === 0`, pass 0 or render no bar.
   - Let the bar take the available row width: `w-full` or `grow`, not `w-xxl`.
   - Test: 4 of 5 gives a value of 80.
3. **Bar message clipped in text.** The rejection or step message is clamped to 111 characters with "…" in the view model (`getRejectionText.ts` or `getReviewMessage.ts`; find the clamp).
   - In the bar, show the full message and let it wrap with `min-w-0 break-words`.
   - Keep any server-side clamp. Remove only the client-side display clamp.
   - Test: a 300-character rejection comment shows in full.
4. **Custom colour picker wrong.** `editor/presentation/stepForm/renderers/StepColourRenderer.tsx`:
   - The `ColorPicker` value must be the step's current colour.
   - If `ColorPicker` supports presets (check `packages/admin-ui/src/ColorPicker`, for example a presets/swatches prop), pass our 10 step colours as its presets and remove our separate RadioGroup swatch list. If it does not, keep the list.
   - The hex input shows the current value. Its placeholder is the current colour, or empty, never an unrelated colour.
   - Update the "Design deviates" line in `2026-10-28-workflows-design-system-alignment.md` to match.
   - Test: the picker receives the current colour, and choosing a preset updates the field.
5. **Review bar empty bottom space and Request review not centred.** In `ReviewBar.tsx` and `ReviewBarFrame`:
   - Remove the extra bottom spacing, for example an empty progress row or meta row rendered with no content, or padding stacked on the Card's own.
   - Centre the actions column against the content with `items-center` on the row.
   - Render no empty rows.
6. **Editor step actions misaligned.** In `StepCard.tsx`, non-expandable items lack the chevron and separator, so their actions sit further right.
   - Make actions line up for every step, using admin-ui means only. Options: keep every item interactive so each gets the same chevron (a non-expanding item shows its meta line), or use an Accordion prop that keeps the indicator slot. Pick the one admin-ui supports.
   - Test: every step renders the same trigger structure (data hook).
7. **Error severity tag.** In the Review details issues list, `Error` uses the `Tag` destructive variant and `Warning` uses warning, matching the variants the editor uses.
   - Put the tag where text starts at the same position for every row (for example as the item's leading content, not in the icon slot, if `List.Item` allows).
   - Align left edges inside an expanded step: the List rows and the comment/headings.
8. **"Rejected" state colour consistency.** Use one `Tag` variant for the rejected state everywhere: bar, drawer header, widget, attempts and list. Use the same mapping helper (`getReviewStateTag`/`REVIEW_TAG_*`).
   - The bar shows "Review: Rejected" and the step "Rejected" twice. When the review is rejected, hide the step-level state tag, since the review tag already says it.
9. **Request dialog repeats "AI".** On AI steps, the owner tag duplicates the type tag. Do not render the owner tag when it equals the type label.
   - Step titles shift with the number Tag width. Make the number column fixed using a theme width token on a layout wrapper.
   - Add spacing between the last step and the footer with a spacing token.
10. **Step title x-shift in the editor** (number width). Use the same fixed-width layout wrapper for the number in the Accordion icon slot, with a theme width token.
11. **Editor header hint baseline and More actions overlap.** Put the subtitle and the "Changes apply…" hint on one aligned row, or each on its own line, using layout utilities. The hint must not sit under the More actions menu trigger area: give the actions their own column with `items-start`.
12. **Notify via vs tool checkboxes.** Render transport checkboxes like the tool checkboxes, with the label on line 1 and the description on line 2, using the same admin-ui `Checkbox`/`CheckboxGroup` label and description props.
13. **Test routing result unframed.** Wrap the result in admin-ui `Card`, which was already used there. Check that it renders with its own surface. If `Card` needs a variant prop for a border or surface, use the variant admin-ui offers.
14. **Content Reviews toolbar changes between tabs.** On tabs without the state selects, keep the search and type filter widths consistent: the same layout grid with fixed theme width tokens for the selects, and the search taking the remaining space. The type select must not stretch to about 680px.
15. **Dashboard review widgets have no card background.** The other dashboard widgets have one. Use the same admin-ui `Widget` usage or props as `ContentModelsWidget` and the other widgets: compare their props and match them. Do not add a background class. If the difference is a prop, use the prop.

## Needs a design-system component (for the designer)

(Filled in during the fix: anything admin-ui cannot express.)

## Admin-ui owner (not ours)

- Accordion title weight: frames show semibold, admin-ui renders regular.
- Drawer close buttons have no accessible name.
- ColorPicker R/G/B and hex fields are clipped.
