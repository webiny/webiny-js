# Workflows UI: design vs live (2026-10-27)

Live: http://localhost:3001 (umbrella branch build, dev API, seeded data). Design: docs/.bruno/workflows/design/files, all 179 States frames rendered to SP/shots/design/.
Live screenshots: SP/shots/live/<area>/. SP = /private/tmp/claude-501/-Users-brunozoric-work-webiny-webiny-js/7f74fbf9-6e98-42ac-a9cc-71c6f2833f28/scratchpad
Every item was checked against the phase-8a answers (Q1-Q31), the rulings (R2xx), the design answers (QBZ) and decisions.md; deliberate deviations are in the last section.
Code paths are relative to packages/app-workflows/src/ unless another package is named.

Totals before review: 117 gaps, 33 deliberate, about 80 frames not reachable read-only (they need a Save, a submit, a race, an automation step, a failed AI step, a second team member or a restricted user).

## Review verdict (subagent, 2026-10-27)

Of 61 gap IDs: 33 OK, 9 partly right, 2 wrong, 3 reclassified to deliberate, 9 merged. Severity H = wrong behaviour/copy or contradicts a decision, M = visible layout gap, L = polish. Per-area IDs (CR*, ES*, CRA-*) point at agent reports that were not saved; only CRB* exists (findings-cms-review-b.md).

### Fix order
0. N1 (H) Model delete block shows the raw server error, no UI-18 dialog (section 10).
1. RB2 (H) Published-before-workflow revision offers Request review: CMS passes canRequest = canSave (app-headless-cms-workflows CmsEntryFormPresenterReviewDecorator.ts:95); buildTargetReviewViewModel.ts:97-99 never checks the revision is published.
2. AD6 (H) Cancelled-underneath conflict ignores cancelledBy (getConflictMessage.ts:63-67), which 8a added for this (Q23).
3. L3 (H) Owner blank for pool rows (getListOwnerLabel.ts:11-13); README:162 "Team pool".
4. F1 (H, new) Failed step tag has no sync_problem icon although R263 requires it (getStepStateTag.ts:24-25).
5. H1 (H) Two identical widget titles per app; one string each in ReviewDashboardWidgets.tsx:92/113.
6. RD5 field-id part (H) AI issues show the API field id instead of the field label.
7. C9 (M, compounding) Model prefix is persisted in the review title (getCmsEntryReviewContext.ts:13).
Cheap: C3 (two missing variant="ghost"), C5 (red confirm), C8 (description to note), RD1 (Drawer already has modal/headerSeparator/footerSeparator).

### Corrections
- C1: icons are workflows code (REVIEW_TAG_ICONS has only progress_activity, reviewBarAppearance.ts:40-43); the tint + border is an admin-ui Tag variant gap and changing it touches every Tag. RB6 merged into C1.
- C2: icon colour is set in ReviewBar.tsx, not reviewBarAppearance.ts:62-70.
- C3: ReviewListRowActions.tsx:59, EditorHeader.tsx:70 omit variant="ghost"; do not change the IconButton default.
- C4: dividers and grey Cancel are admin-ui Dialog defaults (CancelAction.tsx:9); workflows can pass a tertiary Button. Black asterisk is the literal "Comment *" label (getActionDialogCopy.ts:92). E9 and S3 merged into C4 (+ RQ5).
- C5: admin-ui ConfirmAction.tsx:6 forces variant="primary"; allow an override there or render a destructive Button in workflows.
- C6: admin-ui EmptyState has no icon slot; an optional icon prop is non-breaking. CRB2 belongs to RB9. S1 merged into C6.
- C8: pass note= (below) instead of description= (above); no base change.
- C10 reclassified: deliberate (task-20 plan and 8a.6 summary: "no extra button", Options menu + lock text). The legacy-published part is RB2.
- RB3/RB4/RB5 merged: one meta line with inline lock text (README:187); lines 105-116.
- RB11 wrong: CMS "Save & Publish" is base chrome and intended (decorator no-op save, lines 135-142); a WB published revision has nothing to publish.
- AD3/AD4: the "“{title}”:" and 'on “{title}”' variants are the list context only; editor copy matches. Fix is context-dependent copy (L).
- RD1: merge CRB3, CRB4, CRB7. RD2 built in buildReviewDetailsViewModel.ts:177. RD4 line comes from buildReviewDetailsViewModel.ts:188 (formatReviewTime), not formatReviewTimeFull.
- L4: the (x) comes from the ALL sentinel value; admin-ui Select has displayResetAction.
- H3: depends on what the user-arrangeable app-admin dashboard supports (widgets register column="right").
- E4: real cause CmsWorkflowEditorAppAdapter.tsx:40-58 returns null for models without an icon (no fallback).
- S4 reclassified: deliberate (9c R324/R319 minDate today; D124).
- Severity H: RB2, AD6, L3, H1, F1, RD5 (field id). M: C1, C3-C9, RB1, RB9, RQ2, RQ4-RQ6, AD1, AD2, AD5, RD1-RD4, L2, L4, L6, H2, H3, E1, E7, E8, E13, E14 (out-of-date alert), E16, E17. Everything else L.

### Missing from the comparison
- Notifications, Model Delete and Picker: compared afterwards, see section 10.
- F2 (L) Locked CMS form looks editable on approved revisions: the reference field buttons and the On sale switch render as enabled. Checked: they sit inside an inert, disabled fieldset, so they can't be used; only the look is off.
- WB in-review shows a second grey "Read-only…" strip on top of the bar's lock text (R227 note vs UI-7 look).

## 1. Cross-cutting (one fix covers many screens)

- C1 State tags: no icon, no 1px border; "Awaiting" is solid saturated yellow, "In review" dark on pale pink. Design: tinted fill + same-colour border + state icon (rate_review, hourglass, spinner, sync_problem, check, x). Bar, list, popover, drawer, request dialog. Code: review/presentation/targetReview/getStepStateTag.ts:11-30, getReviewStateTag.ts:9, reviewList/components/ReviewListTable.tsx:36. Same for "Unsaved changes" tag in the editor (ES6) and AI issue severity tags (CRA-25).
- C2 State tile icons are always black; design colours the icon per state (orange, amber, green, red, grey). Code: targetReview/components/reviewBarAppearance.ts:62-70.
- C3 Icon-only "more" buttons are orange filled primary (editor header "...", list row "⋮"). Design: ghost icon buttons.
- C4 Dialog frame: no divider under the header or above the footer; Cancel / Keep review / Close are grey filled instead of white outlined; required asterisk is black instead of red; close (x) gets an orange focus ring on open. All workflows dialogs.
- C5 Destructive confirms (Reject, Cancel review, Delete) are orange primary; design red destructive. Code: actionDialog/components/ReviewActionDialog.tsx:25.
- C6 Empty, loading and error states have no card and no icon (`EmptyState illustration={false}`); loading skeletons are full-width bars instead of shaped rows. List (CR7-CR9), widgets (CR24), editor (ES1-ES4), exclusions (ES27), bar failed state (CRB2).
- C7 Step colour dot missing everywhere the design shows one: bar step line, list Current step, popover rows, widget rows.
- C8 Field hints sit above the control (as the field description) instead of muted below it: step drawer, Reviewer picker in request and reassign dialogs.
- C9 Titles get the model name prefixed ("Article: …", "Product: …") in the list and in the request dialog's title prefill. Code: app-headless-cms-workflows/src/presentation/getCmsEntryReviewContext.ts:13.
- C10 "Create new revision" is missing from the CMS bar for rejected, approved and published-before-workflow revisions, and from the rejected Review details footer; it is only in the editor's "..." menu (decisions.md:120 says the bar offers it).
- C11 Pages run full width; design centres Content Reviews at about 1116px.

## 2. Review bar (CMS + Website Builder)

- RB1 WB bar is the same inset card as CMS (radius, shadow, about 24px margin, about 220px tall with the note). Design UI-7: full-width strip under the editor top bar, about 115px. Code: targetReview/components/ReviewBar.tsx:69, app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx:78.
- RB2 Published-before-workflow revision shows orange "Request review" instead of "+ Create new revision", contradicting its own text. Code: targetReview/buildTargetReviewViewModel.ts:96-99.
- RB3 Approved bar adds a "Step 3 of 3: … Approved · Owner: …" line; design has message + lock line only. Code: buildTargetReviewViewModel.ts:104-110.
- RB4 Lock text is a separate third line; design puts it inline after Owner.
- RB5 Owner name not emphasised; design "Owner: **Name**". Code: ReviewBar.tsx:104.
- RB6 "Review: In progress" tag dark on pale pink; design orange on salmon.
- RB7 No divider before the progress row; "Review details" has no trend icon; progress caption darker than design.
- RB8 Action buttons 32px and top-aligned; design 36px, vertically centred.
- RB9 Status failed to load: full-width pink danger Alert; design keeps the bar card with a red cloud_off tile and secondary "Try again" (refresh icon). Loading text dark instead of muted.
- RB10 Progress popover: about 305px (design 380), tag inline instead of right-aligned, comment plain instead of a grey quote box. Code: targetReview/components/ReviewStepsPopover.tsx:37-62.
- RB11 CMS approved revision top bar shows one orange "Save & Publish" while editing is locked; design disabled Save + enabled Publish (may be base chrome). WB published revision shows no Publish, only "+ New Revision" (may be base chrome).

## 3. Request review dialog

- RQ1 520px wide; design 600px.
- RQ2 No "Steps" label, no bordered card around the steps, no row dividers; step names muted grey; tags inline after the name instead of right-aligned; no description line. Code: requestReview/components/RequestReviewDialog.tsx:131-151.
- RQ3 Type tag has no icon (People/AI/Automation); same in the drawer.
- RQ4 Automatic / Choose a person radios stacked; design on one row. The hint "Picks are checked again…" only appears after Choose a person, above the picker under an extra "Reviewer" label; design always shows it below. Code: RequestReviewDialog.tsx:152-177.
- RQ5 Reviewer picker: no search icon, no clear, options are bare names (design: initials avatar + team line, QBZ-80). Code: reviewerPicker/components/ReviewerPicker.tsx.
- RQ6 Reviewer search failure replaces the whole picker with a danger Alert; design keeps the field and shows the error and Retry in the dropdown.

## 4. Action dialogs

- AD1 Approve: no placeholder, no "Visible to the requester and in review details." hint. Code: actionDialog/getActionDialogCopy.ts:74-82.
- AD2 Reject: no inline validation (red border, "Write at least 10 characters.", red "8 / 10 min." counter); counter sits above the field; no placeholder or hint. Code: getActionDialogCopy.ts:84-96, ReviewActionDialog.tsx:66-74.
- AD3 Cancel review body leaves out the "“{title}”:" prefix. Code: actionDialog/getCancelDialogBody.ts.
- AD4 Take over body leaves out 'on “{title}”' and adds "and {name} can no longer approve or reject it." Code: getActionDialogCopy.ts (takeOver).
- AD5 Reassign: extra "Reviewer" label, hint above the field, option list overflows over the footer; nobody-eligible message plain left-aligned without the "“{title}” · currently {owner}." line (design: centred in a dashed box). Code: actionDialog/components/ReassignDialog.tsx:61, ReassignDialogPresenter.ts:18.
- AD6 Cancelled-underneath conflict always says "Someone cancelled this review…" though the review stores who cancelled; the dialog keeps its action title and comment label.

## 5. Review details drawer

- RD1 No dimmed backdrop; large "Review details" heading instead of a small eyebrow + review title (18px) with state tag; no header or footer dividers. Code: reviewDetails/components/ReviewDetailsDrawer.tsx.
- RD2 Content line is plain text without model/app and not a link; design orange link "Content: Article · title (#3)" / "Pages · title".
- RD3 No vertical timeline (32px state circles joined by a line); steps are a flat list with rules; step titles muted.
- RD4 "Requested: 11:13" has no "Today" (QBZ-54). Code: reviewDetails/formatReviewTimeFull.ts.
- RD5 AI issues: header outside the card, one box per issue, after Attempts instead of before; field shows the API id ("description") instead of the field label; Background task link icon before text, not orange. Code: ReviewDetailsDrawer.tsx:215-270, reviewDetails/getAiIssues.ts.

## 6. Content Reviews list

- L1 Title cell: no content-type icon (+ C9 prefix). Code: ReviewListTable.tsx:27.
- L2 Content type is one line; design adds the app ("Article / Headless CMS", UI-9).
- L3 Owner cell blank for pool rows; design "Team pool". Code: reviewList/getListOwnerLabel.ts:11.
- L4 Content type filter is a plain Select; design the Picker with grid icon and search (UI-3). Filters show (x) on the default value; My requests filters truncate ("Any review st…").
- L5 Table is a plain bordered table; design a rounded card with shadow and uppercase headers. Tabs about 13px; design 14px.
- L6 "⋯" menu: no "Open content", "Review details" instead of "View details", no icons, Cancel review first. Design order: Open content, View details, Reassign, Cancel review. Code: reviewList/components/ReviewListRowActions.tsx:66-82.
- L7 Inline Start about 24px tall; design 32px. Open-in-new icon black 16px; design grey ghost button. Page size 20; README §8 says 6 then Load more (low).

## 7. Home widgets

- H1 Each widget appears twice (one per app, R231) with identical titles; nothing tells them apart.
- H2 "For me to review" title wraps to three lines next to the switch.
- H3 Stacked in the right column beside the CMS/WB cards; design a full-width row above the dashboard content. No card, large empty gap before "View all".
- H4 No header icons; rows have no step dot and no app; "View all →" orange instead of grey with an arrow icon.

## 8. Workflow Editor

- E1 Workflow name is an always-visible input; design a plain title.
- E2 Step type badge at the right next to the actions; design right after the name.
- E3 Step cards bordered, no shadow; Save has no icon; Draft icon black instead of grey.
- E4 Model list: only the selected model has an icon; search has no icon; no-match text left-aligned 14px instead of centred muted 13px. Code: editor/presentation/editor/components/ModelPanel.tsx:86,100.
- E5 Breadcrumb ends at "Workflows"; design adds the model name.
- E6 Connectors are only the "+" circle; design line + circle + line so the flow reads as one chain. Code: WorkflowFlow.tsx Connector.
- E7 New workflow, no steps: no description, grey secondary "Add step" without icon; design primary "+ Add step" and connectors.
- E8 Add step picker: vertical list with black icons on grey tiles; design three side-by-side cards with orange icons. Disabled card reason in primary text without lock icon. Code: StepTypePicker.tsx:21,38,85.
- E9 Confirm dialogs (leave, delete step, delete workflow): no leading icon, extra close (x), grey filled secondary. Code: dialogs/EditorConfirmDialog.tsx.
- E10 Drawer: tabs small with a grey pill on the active tab instead of bold + underline; header title about 20px instead of 16px/600; AI drawer body has no top padding.
- E11 Colour: square native colour input instead of a round custom swatch with colorize icon; hex input inline instead of below. Code: stepForm/renderers/StepColourRenderer.tsx:80-92.
- E12 Notify via: "E-Mail · description" all in primary colour; no section divider. Code: TransportCheckboxesRenderer.tsx:67-70.
- E13 Assignment: strategy radio cards have the radio outside and are only as wide as their text; requester-pick toggle is green and right of a regular label (design orange, left, bold label, hint indented); no section dividers; disabled ↑/↓ drawn full strength. Code: AssignmentStrategyRenderer.tsx.
- E14 Test routing: no icons in Requester/Folder; result card lacks grey owner band, round avatar, uppercase TRACE / SKIPPED PEOPLE headings and the two-column grid; inputs disabled while running, skeleton not in a card; "Out of date" alert grey info instead of amber warning. Code: testRouting/TestRoutingResult.tsx:22-90, TestRoutingStale.tsx.
- E15 AI step: Model picker has no smart_toy icon, options lack "{provider} · {description}", has a clear (x); "Changes content" tool tag neutral instead of warning tint with edit_document icon.
- E16 Done with errors highlights the Colour group in a pink box instead of focusing the first invalid field.
- E17 Delete blocked dialog: no block icon, reviews as a plain list without border, dividers or open-in-new icon. Code: dialogs/BlockedDeleteDialog.tsx:12-30.

## 9. Workflow Settings (reviewer exclusions)

- S1 Empty state: no card, about 90px between the icon and "No exclusions". Code: settings/presentation/exclusionsPage/components/ExclusionsEmpty.tsx:33-45.
- S2 Page title about 20px (design 32px); rules card bordered instead of shadow; "All users" filter has no icon.
- S3 Add exclusion dialog: no dividers, no search icon in User.
- S4 Past dates are disabled in the calendar, so "Pick today or a later date." never shows (low; arguably better).

## 10. Notifications, Model Delete, Picker

- N1 (H) Model delete block (UI-18, QBZ-38) has no admin UI. Server blocks correctly (Workflows/Model/BoundToWorkflow), but the stock CMS dialog shows the raw message ("The model \"zzDeleteTest\" is used by the workflow …", model id not name) in a generic Alert under the still-visible confirm text, button "OK". Missing: "{Model} has a workflow" title, account_tree icon, design body, "Open workflow →" link, the no-Manage-workflows variant, the error replacing the "Are you sure…" line, "Close". No plan scheduled UI-18. Code: app-headless-cms/src/presentation/contentModels/components/fullDelete/FullyDeleteModelDialog.tsx:51-56,96, dialog/Confirmation.tsx:46-49; server message api-headless-cms-workflows/src/domain/errors.ts:23-27 (data.workflows has id and name). Screenshot: shots/live/model-delete/03-blocked-error.png.
- N2 (L) Toasts pause on hover but not on keyboard focus (sonner 2.0.8); D125 and QBZ-24 say hovered or focused.
- N3 (L) A rejection with a null comment would read '{D}: “”.'; D126 wants "Rejected at {step}." Unreachable while comments are required (R189, D100). Code: api-workflows/src/features/notifications/handlers/ReviewStepRejectedNotifications.ts:49.
- Matches: recipients for all 8 events; toast and e-mail subjects and most bodies word for word; toast behaviour (bottom right, 8 s, close, 3 visible, newest at the bottom); normal model delete unchanged; server blocks both delete paths.
- Deliberate: no {team} or {rule} names in copy, every link opens the content (no review-details deep link), plain-paragraph e-mail without header/greeting/details table/footer, "Step failed" wording, no per-event toast icons (QBZ-93, R207), sonner hides the oldest 4th toast — phase 7 A62, R189, 8a R223, R207, Q6, A70, D102, D103.
- Picker: no separate pass; its states were covered through the reviewer picker (RQ5, RQ6), content-type filter (L4) and AI model picker (E15).
- Test data: the agent created and then removed a throwaway model "Zz delete test" and its workflow; nothing else was touched.

## Deliberate (not gaps)

- Content Reviews and its menu item per app, not global (Q5, R206); no Content type column/filter in WB (R206, D113).
- Rejected tags neutral-dark, only Failed red; progress segment stays red (Q29, Q30).
- Home widgets one pair per app (R231); only the identical titles (H1) stay open.
- WB: "New Revision" comes from base WB top bar, not the bar (R227, D24); read-only reason is a strip under the bar (R227); top bar shows the WB status, not "Revision #n · state" (R227).
- "Last change" is a sort toggle (R229).
- Editor: model rows show the workflow name (R280, QBZ-20); type order People/AI/Automation (R269); new rule targets the first team's pool (R296).
- Settings: no paging (R322); visible "Filter by user" label (R340); admin-ui DatePicker (R324); Workflows permission accordion layout (R333); toast style (R327, D125).
- C10 "Create new revision" only in the Options menu (task-20 plan, 8a.6 summary). S4 past dates disabled (R324, R319, D124). RB11 CMS Save & Publish on approved drafts (decorator no-op save).
- AI/automation rejection copy "Rejected at {step}." (decisions.md:727).

## Removed from Deliberate by the review (now gaps)
- G1 (M) Developer mode "remove review request" is not built; D25 (decisions.md:128) keeps it, 8a deferred it and no later phase built it.
- G2 (L) Progress popover opens on click only; README:189 says hovering or clicking. No ruling behind the code comment.
- Not deviations (design matches): Failed steps tab for operators (QBZ-29), AI owner = step title (QBZ-79); every seeded user is an operator, so Cancel review and Reassign show for all (seeding artefact).
- Running/failed messages and Restart are built (8b); those frames were only unreachable read-only.

## Done

- Removed the icon from the Content Reviews menu item (baa52ac901 on bruno/feat/workflows-umbrella).

## Notes

- Seeded data on dev: WB "Page review" workflow + 10 pages, CMS "Product review" workflow + 11 Product entries (see compare-brief.md). A rejection without a comment can't be created (API requires 10 characters).
- One agent wrote its report with a shell heredoc after the harness blocked subagent report writes; the four others returned text. Per-area reports: findings-cms-review-b.md; the others are merged here only.
