# Live check fixes report (fixes 1, 2, 3, 4, 5, 8, 9)

Test command pattern: `yarn test <path> 2>&1 | tail -30`. Each new test was RED before the change, then green.

1. Steps popover: `ReviewStepsPopover` wraps content in `[data-role=review-steps-content]` with `max-w-sm`. Commit 77229fad0f. Test: ReviewBar.test.tsx "caps the popover content width...". Final: 48 passed.
2. Progress: `ReviewProgress` passes `Math.round(approved/total*100)`, bar `grow`. Commit 77229fad0f. Test: 4 of 5 gives aria-valuenow 80.
3. Message clamp: removed the 80-char clamp in `getRejectionText`; bar message `min-w-0 break-words`. Commit 77229fad0f. Tests: stepLabels "shows a long comment in full", ReviewBar 300-char message.
4. Colour picker: value is the stored colour (empty gives none), placeholder removed; the RadioGroup stays (no presets prop). Commit ebce6d70f7. Tests in StepColourRenderer.test.tsx (11 passed). Docs commit 270af1fa77 (Design deviates and "Needs a design-system component").
5. Bar rows: meta row only with content, progress row only when total > 0, row `items-center`. Commit 77229fad0f. Tests: no empty meta row, no progress row at 0 steps.
8. Rejected tag: all tags already come from one helper (neutral-dark); step tag and tooltip hidden when the review is rejected (buildTargetReviewViewModel). Commit 77229fad0f. Test updated in buildTargetReviewViewModel.test.ts.
9. Request dialog: owner tag hidden when equal to type label, number column `w-xl shrink-0` with `data-role=request-step-number`, `pb-md` above the footer. Commit 9b72d14bfc. Tests in RequestReviewDialog.test.tsx (14 passed).

Final: `packages/app-workflows/src/review` 100 files / 1123 passed; `.../editor/presentation/stepForm` 33 files / 345 passed; `yarn lint` clean; `yarn format:check` clean; adio ok; build ok.

# Fixes 6, 7, 10, 11, 12, 13, 14, 15 (second implementer)

Test pattern: `yarn test <path> 2>&1 | tail -30`, RED shown before the change where behaviour changed.

- 6 + 10 (9606f4be23): StepCard no longer sets `interactive={hasDetails}`, so every step gets the chevron and separator; a step with nothing to expand shows its meta line in the body. The number sits in `[data-role=step-number]` (`w-xl shrink-0`). Tests in StepCard.test.tsx (indicator on every card, meta line body, number slot); RED 2 failed, then 28 passed.
- 11 (c512452b94): hint moved under the applies-to line (`[data-role=changes-hint]`); actions in their own `[data-role=header-actions]` column, `items-start`. Test in EditorHeader.test.tsx RED (stash), then 14 passed.
- 12 (458d923c76): transport label is a flex-col with title and `Text sm` description, like tools. TransportCheckboxesRenderer.test.tsx RED 3 failed, then 10 passed.
- 13 (967803c467): result `Card` gets `variant="accent"` (only admin-ui variant with a border). Class-only, no RED possible; listed under "Needs a design-system component".
- 7 (a37094ecf1): issue severity tag moved into the title row next to the field (`[data-role=issue-title]`), Error maps to `destructive`, Warning `warning`; comment, headings px-md to line up with List rows; attempt outcome "Rejected" gets a `rejected` tone mapped via `getStepStateTag(StepState.Rejected).variant` (neutral-dark). Tests: getAiIssues, getAttempts (RED), ReviewDetailsDrawer. reviewDetails folder 162 passed.
- 14 (c3919294f9): toolbar cells `data-role` hooks; search `grow min-w-0`, each filter `w-2xs shrink-0`. Test RED then 9 passed.
- 15 (3e2b1c38f0): other widgets use `variant="accent"` or `"light"`; ours had the default `base`. Both review widgets now `variant="light"`. Class-only, no RED.
- Extra (fc615251cd): fix 1's `max-w-sm` compiles to 8px (`--spacing-sm` shadows `--container-sm`; verified by compiling theme.css with Tailwind). Changed to `max-w-2xl` (672px). Docs commit 72409ea253 records the width-token collision.

Final: editor 138 files / 1505 passed; review 100 / 1125; settings 45 / 295; lint and format:check clean; adio ok; build ok.
