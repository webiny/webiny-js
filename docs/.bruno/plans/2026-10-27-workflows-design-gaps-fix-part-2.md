# Workflows design gaps: fix plan, part 2 (M and L items, deferred minors, pass 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every remaining design-vs-live gap that the workflows packages can fix with admin-ui as it is. Record what is only a design-system deviation, what admin-ui owes its own design system, and what is out of bounds.

**Architecture:** All fixes are in `app-workflows`, `app-headless-cms-workflows`, `app-website-builder-workflows` and `api-workflows`. No change goes into admin-ui or the base apps. Presentation rules go into the pure view-model builders first, test-first. Components then render the new view-model fields with existing admin-ui components and props: `EmptyState type/illustration`, `Drawer title/description`, `Dialog icon/showCloseButton/size`, `Button variant/iconPosition`, `AutoComplete startIcon/displayResetAction/emptyMessage`, `Widget icon/headerActions/footerEndActions`, `EditableTitle`, `Heading level`, Tailwind theme tokens. There are two backend changes, both in `api-workflows`: skip entries for excluded people and the requester (Task 1), and team names on step candidates (Task 6). A third is in Task 31.

**Tech Stack:** React, TypeScript, `@webiny/admin-ui`, `@webiny/di` features and presenters, `@webiny/icons`, Vitest, GraphQL (api-workflows schema factory).

**Spec:** `docs/.bruno/workflows/2026-10-27-design-vs-live.md` (sections 1-11 and the Review verdict). Design: `docs/.bruno/workflows/design/files/` (README.md, `*.dc.html`). Previous plan: `docs/.bruno/plans/2026-10-27-workflows-design-gaps-fix.md`.

## Global Constraints

- Branch: `bruno/feat/workflows-umbrella`. Never touch `bruno/refactor/workflows-flow`. Never push. Never deploy.
- Never change `@webiny/admin-ui`, `app-headless-cms`, `app-website-builder`, `app-admin` or `api-headless-cms`. Anything that would need them is listed under "Needs approval".
- Extend workflows code, not base Webiny.
- Copy uses curly quotes “ ” and the ellipsis …, exactly as in the design and as quoted in this plan.
- One abstraction or implementation per file. No `Impl` suffix on exports. No inline object types: extract named interfaces.
- Admin is desktop only: mouse and keyboard, no touch behaviour.
- Tests: one file or folder at a time, by path, never in parallel: `yarn test <path> 2>&1 | tail -30`.
- Before each commit: `yarn format:fix`, `yarn lint:fix`, `yarn adio`, `node scripts/generateTsConfigsInPackages.js`, `yarn build -p <changed package>`. If a step fixes something, rerun the chain from the start.
- Commits: Conventional Commits, scope = package (`fix(app-workflows): …`), ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. One commit per package when a task spans packages. Never amend.

## Review Focus

1. **P2C-6 double records.** A member who is both the requester and excluded must get one skip entry (reason `requester`, which wins). A picked user who is excluded must not be recorded twice, because the pick branch already records them. Test in Task 1.
2. **Dialog context.** Action dialogs opened from the Review details drawer use the `editor` copy and conflict rules, even when the drawer was opened from Content Reviews. Only `ReviewListDialogs` passes `list`. Test in Task 4 (`ReviewActionDialogs.test.tsx`: drawer-mounted dialog shows "You become the owner of this step and it leaves the team pool.").
3. **Reject validation timing.** The reject hint turns into "Write at least 10 characters." only after the first edit, never when the dialog opens. Test in Task 4.
4. **No current step.** A row or review with no current step (approved, rejected, cancelled) has `stepColor: null`, renders no dot and never sets `style={{ backgroundColor: undefined }}`. Tests in Tasks 13, 16 and 25.
5. **"Today" across midnight.** The "Today" prefix follows the viewer's day boundary. Created at 23:50, viewed at 00:10 the next day, it reads "Requested: Yesterday 23:50", never "Today 23:50". Test in Task 11.

---

### Task 1 (H): Skipped by assignment lists the requester and excluded people (P2C-6)

**Files:**
- Create: `packages/api-workflows/src/domain/routing/listStrategySkips.ts`
- Modify: `packages/api-workflows/src/features/routing/RoutingEvaluatorService/RoutingEvaluatorService.ts:398-404` (before `listRoutingCandidates`)
- Test: `packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts`

**Interfaces:**
- Consumes: `RoutingCandidatesInput` (`domain/routing/listRoutingCandidates.ts:4`), `ROUTING_SKIP_REASONS` (`domain/routing/reasons.ts`), `RoutingSkippedUser`, `AssignmentDecision`.
- Produces: `listStrategySkips(input: StrategySkipsInput): StrategySkip[]`. `StrategySkipsInput extends RoutingCandidatesInput { pickedUserId: string | null }`. `StrategySkip { userId: string; displayName: string; reason: RoutingSkipReason; shownReason: string }`.

- [ ] **Step 1: Write the failing tests:**
  - `"records the requester and excluded team members as strategy skips"`: round-robin step, team members requester `u1`, `u2` excluded with reason "On leave", `u3` eligible. Expect the evaluation's `skips` to contain `{ kind: "skip", userId: "u1", source: "roundRobin", reason: "The requester cannot review." }` and `{ userId: "u2", reason: "Excluded from reviews." }`. Expect `skipped` to contain `{ userId: "u2", reason: "On leave" }`. Owner is `u3`.
  - `"adds no strategy skips for a team-pool step"`: strategy `none`; `skips` is `[]`.
  - `"records a requester who is also excluded once, as the requester"` (Review Focus 1).
  - `"does not record a picked excluded user twice"`: `pickedUserId: "u2"`; exactly one skip for `u2`.
- [ ] **Step 2: Run** `yarn test packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts 2>&1 | tail -30`. Expected: the first, third and fourth tests FAIL.
- [ ] **Step 3: Implement** `listStrategySkips`. It is pure and sorted by user id:
  ```ts
  for (const member of input.members) {
      if (!input.candidateTeamIds.some(id => member.teams?.includes(id))) continue;
      if (member.id === input.pickedUserId) continue;
      if (member.id === input.requesterId) { push(member, ROUTING_SKIP_REASONS.requester, ROUTING_SKIP_REASONS.requester); continue; }
      const exclusion = input.exclusions.find(item => item.userId === member.id);
      if (exclusion) push(member, ROUTING_SKIP_REASONS.excluded, exclusion.reason || ROUTING_SKIP_REASONS.excluded);
  }
  ```
  In `evaluate`, when `strategy !== "none"`, push each entry to `skips` (`kind: "skip"`, `source: strategy`, `ruleId`, `by: null`, `reason`) and to `skipped` (`shownReason`) before calling `listRoutingCandidates`. Records keep the fixed reason; the inspector shows the exclusion's own text (D89, D97, R129).
- [ ] **Step 4: Run** the same file. Expected: PASS. Then run `yarn test packages/api-workflows/__tests__/routing/redactStepCandidates.test.ts 2>&1 | tail -30`. Expected: PASS.
- [ ] **Step 5: Commit** `fix(api-workflows): record the requester and excluded people as skipped by assignment`.

### Task 2 (M): Shared picker: leading icon and clear only when set (RQ5, L4, S2, S3, E14, E15 parts)

**Files:**
- Create: `packages/app-workflows/src/components/picker/PickerFieldIcon.ts`, `packages/app-workflows/src/components/picker/PickerFieldIconView.tsx`
- Modify: `packages/app-workflows/src/components/picker/WorkflowPicker.tsx:17-35,74-78,111-125`
- Modify: callers `settings/presentation/exclusionsPage/components/ExclusionsToolbar.tsx:42` (`person`), `settings/presentation/exclusionDialog/components/ExclusionDialog.tsx:156` (`search`), `editor/presentation/stepForm/renderers/testRouting/TestRoutingInputs.tsx` (Requester `person`, Folder `folder`), `editor/presentation/stepForm/renderers/AiModelPickerRenderer.tsx` (`smart_toy`, `clearable={false}`)
- Test: `packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx`

**Interfaces:**
- Produces: `type PickerFieldIcon = "search" | "person" | "folder" | "smart_toy" | "filter_list"`.
- Produces: on `WorkflowPickerProps`: `icon?: PickerFieldIcon` (default `"search"`) and `clearable?: boolean` (default `true`).

- [ ] **Step 1: Write the failing tests:** `"shows the search icon by default"` (an svg with `data-icon="search"` sits in the field); `"shows the given icon"` (`icon="person"`); `"offers no clear button while nothing is chosen"` (value `null` with `anyLabel` set: no reset button); `"offers no clear button when not clearable"`.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement:** `startIcon` is the chosen muted option's icon when there is one (unchanged), else `<PickerFieldIconView name={icon} />`. Pass `displayResetAction={clearable && value !== null && !disabled}` to `AutoComplete`. Use the README §9 Picker icon names.
- [ ] **Step 4: Run** the same file, then `yarn test packages/app-workflows/src/components/picker 2>&1 | tail -30`. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): give workflow pickers a leading icon and clear only a chosen value`.

### Task 3 (M): Review titles without the model prefix (C9)

**Files:**
- Modify: `packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewContext.ts:13`
- Test: `packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.test.ts`

- [ ] **Step 1: Write the failing test:** model `Article`, entry title "Summer launch" → `targetTitle === "Summer launch"`. A missing title stays `"unknown"`.
- [ ] **Step 2: Run** `yarn test packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.test.ts 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement:** `targetTitle: entryTitle`. Stored review titles keep their old text; that is data, not migrated.
- [ ] **Step 4: Run** the file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-headless-cms-workflows): prefill review titles without the model name`.

### Task 4 (M): Action dialog copy: hints, validation, list and editor wording, red asterisk, white Cancel (AD1, AD2, AD3, AD4, WB2-1/P2C-8, C4 asterisk and Cancel)

**Files:**
- Create: `packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogContext.ts`
- Modify: `review/presentation/actionDialog/ReviewActionRequest.ts`, `getActionDialogCopy.ts:9-121`, `getCancelDialogBody.ts`, `abstractions.ts:25-44`, `ReviewActionDialogPresenter.ts` (touched flag), `components/ReviewActionDialog.tsx:23-78`, `components/ReassignDialog.tsx:30`, `review/presentation/requestReview/components/RequestReviewDialog.tsx:56-66,93-99`, `review/presentation/reviewList/components/ReviewListDialogs.tsx:43-47` (passes `"list"`), the bar and drawer request builders (`actionDialog/toActionRequest.ts`, `"editor"`)
- Test: `review/presentation/actionDialog/getActionDialogCopy.test.ts`, `components/ReviewActionDialogs.test.tsx`

**Interfaces:**
- Produces: `type ReviewActionDialogContext = "list" | "editor"`. `ReviewActionRequest.context: ReviewActionDialogContext`.
- Produces: `ActionDialogCopyParams` gains `context: ReviewActionDialogContext` and `touched: boolean`. `ActionDialogCopy` loses `commentCounter`, `commentLabel` becomes `"Comment"`, and it gains `commentRequired: boolean`, `commentPlaceholder: string`, `commentNote: string | null`, `commentCounter: string | null`, `commentError: string | null`.
- Produces: `getCancelDialogBody(review: Review, context: ReviewActionDialogContext): string`.

- [ ] **Step 1: Write the failing tests** (copy verbatim):
  - approve: placeholder `Anything the requester or next reviewer should know`, note `Visible to the requester and in review details.`, `commentRequired: false`.
  - reject, untouched, 3 characters: label `Comment`, `commentRequired: true`, placeholder `Explain what needs to change`, note `Required. The requester sees this.`, counter `3 / 10 min.`, `commentError: null`.
  - reject, touched, 8 characters: `commentError: "Write at least 10 characters."`, counter `8 / 10 min.`, note `null` (Review Focus 3).
  - start, list: body `You become the owner of this step on “Summer launch” and it leaves the team pool.`; editor: `You become the owner of this step and it leaves the team pool.`
  - takeOver, list: `Ivan Horvat is reviewing “Editorial check” on “Summer launch”. If you take over, you become the owner.`; editor: unchanged (`… and Ivan can no longer approve or reject it.`).
  - cancel, list: `“Summer launch”: review progress is lost. Editing is unlocked, and a new request starts again from the first step.`; with a running step it adds ` AI tone check is running and will be stopped.` Editor: unchanged.
  - `ReviewActionDialogs.test.tsx`: the Cancel button of each dialog is the tertiary variant (`data-variant="tertiary"` or class check, as existing tests do). The "Title" label in Request review carries the admin-ui required marker, not a literal `*`. Plus Review Focus 2.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/actionDialog 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement:** the copy rules above. The presenter sets `touched` on the first `setComment`. `ReviewActionDialog` passes `required`, `placeholder`, `note` (hint, or a `flex justify-between` row with hint and counter) and `validation` (`commentError`) to `Textarea`. The Cancel action is a `Button variant="tertiary"` calling `presenter.dismiss()` in place of `Dialog.CancelAction` (same in `ReassignDialog` and `RequestReviewDialog`). Request title: `label="Title"`, `required`.
- [ ] **Step 4: Run** the folder again, then `yarn test packages/app-workflows/src/review/presentation/requestReview 2>&1 | tail -30`. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): match the action dialog copy, hints and validation to the design`.

### Task 5 (M): Conflict state of the action dialogs (LS1, P2C-4, P2C-2, LS5, AI-3, P2C-3)

**Files:**
- Modify: `review/presentation/actionDialog/ReviewActionDialogPresenter.ts:378-392` (`applyConflict`, `titleOverride`), `abstractions.ts` (conflict VM), `components/ReviewActionDialog.tsx:54-85`, `review/presentation/requestReview/components/RequestReviewDialog.tsx:97`
- Test: `review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts`

**Interfaces:**
- Produces: `ReviewActionConflictVm.message` already ends with ` Your comment is kept below so you can copy it.` when a comment is kept; `commentKept` is removed. The VM gains `bodyLocked: boolean`.

- [ ] **Step 1: Write the failing tests:**
  - cancelled underneath, `editor` context, kind `approve`, comment "Looks good": title `“Editorial check”`, comment label `Your comment`, note `Copy it if you need it.`, conflict message ends with `so your approval was not saved. The revision has no review now. Your comment is kept below so you can copy it.`
  - the same with an empty comment: `showComment: false`.
  - `list` context, kind `cancel`, cancelled underneath: title stays `Cancel review?` (LS1).
  - takeOver conflict: `showNotify` stays `true` (LS5).
  - restart conflict where the re-read step is now running: the body keeps the pre-conflict `Last attempt failed at …` text (AI-3).
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/actionDialog/ReviewActionDialogPresenter.test.ts 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement:** override the title only in the `editor` context, with the quoted step title. Freeze title and body at the moment of the conflict (`bodyLocked`), so a re-read does not rebuild them. Drop `vm.conflict === null` from the Notify condition. The kept-comment sentence runs on in the message (remove the separate `<div>`). In `RequestReviewDialog` the title input is no longer disabled after a conflict (P2C-3); the buttons still collapse to Close.
- [ ] **Step 4: Run** the file, then `yarn test packages/app-workflows/src/review/presentation/actionDialog 2>&1 | tail -30`. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): keep the action dialog title, body and notify option through a conflict`.

### Task 6 (M): Step candidates carry their team names (RQ5, server part)

**Files:**
- Modify: `packages/api-workflows/src/domain/routing/types.ts:216-221` (`StepCandidate`), `features/routing/ListStepCandidates/ListStepCandidatesUseCase.ts:17-32,125-130`, `domain/routing/redactStepCandidates.ts`, `graphql/WorkflowsSchemaFactory.ts:109-114` (+ resolver)
- Modify: `packages/app-workflows/src/review/gateway/reviewFields.ts` (candidate selection), `review/gateway/dto.ts`, `review/gateway/mapStepCandidate.ts`, `review/domain/types.ts:156-161`
- Test: `packages/api-workflows/__tests__/routing/ListStepCandidates.test.ts`, `packages/app-workflows/src/review/gateway/mapStepCandidate.test.ts`

**Interfaces:**
- Produces (API): `StepCandidate.teamIds: string[]`: the member's teams among the step's teams. GraphQL `WorkflowsStepCandidate.teams: [String!]!`: team names in step order, resolved through `ReviewTeamLoader.load(teamIds)` (one batched read per request, no per-candidate query).
- Produces (app): `StepCandidate.teamNames: string[]`.

- [ ] **Step 1: Write the failing tests:** a member of Marketing and Authors, on a step with teams [marketing, legal] → `teamIds: ["marketing"]`. The schema test resolves `teams: ["Marketing"]`. The mapper test maps `teams` to `teamNames`.
- [ ] **Step 2: Run** `yarn test packages/api-workflows/__tests__/routing/ListStepCandidates.test.ts 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement** as above. Redaction keeps `teamIds`; team names are not sensitive (R208).
- [ ] **Step 4: Run** the API file, `yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -30` and the mapper test. Expected: PASS.
- [ ] **Step 5: Commit** `feat(api-workflows): return the team names of step candidates` and `feat(app-workflows): read the team names of step candidates`.

### Task 7 (M): Reviewer picker: avatar and team line, error in the list, nobody box (RQ5, RQ6, AD5)

**Files:**
- Create: `review/presentation/reviewerPicker/components/renderReviewerOption.tsx`
- Modify: `review/presentation/reviewerPicker/abstractions.ts:10-25`, `getPickerOptions.ts`, `components/ReviewerPicker.tsx`, `actionDialog/components/ReassignDialog.tsx:57-63`, `actionDialog/ReassignDialogPresenter.ts:18` (nobody VM)
- Test: `review/presentation/reviewerPicker/ReviewerPickerPresenter.test.ts`, `components/ReviewerPicker.test.tsx`, `actionDialog/components/ReassignDialog.test.tsx`

**Interfaces:**
- Produces: `ReviewerPickerOptionVm { label: string; value: string; disabled: boolean; initials: string; teams: string; note: string | null }`. `ReviewerPickerProps.label` becomes optional and is used as `aria-label` only.
- Produces: `IReassignDialogViewModel.nobody: ReassignNobodyVm | null`, with `ReassignNobodyVm { text: string; detail: string }`.

- [ ] **Step 1: Write the failing tests:**
  - options: `Ivan Horvat` → `initials: "IH"`, `teams: "Marketing"`, `note: null`.
  - the current owner → `note: "Current owner"` (label without a suffix).
  - excluded with reason → `note: "Unavailable: on leave"`; without a reason → `"Unavailable"`.
  - picker with a load error: the field stays and the open list shows the error text and a `Try again` button that calls `retry()` (RQ6).
  - reassign with nobody: a dashed box with `Nobody else is eligible to review this step.` and the line `“Summer launch” · currently Ivan Horvat.`; no "Reviewer" label.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/reviewerPicker 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement:** `AutoComplete` with `startIcon` search, `displayResetAction` when a value is set, and `optionRenderer={renderReviewerOption}`. The renderer shows an admin-ui `Avatar` with initials (size sm), the name, a muted `teams` line and the right-aligned muted `note`. On error, `emptyMessage` is the error text plus `Button variant="tertiary" size="sm" text="Try again"`. The Reassign hint stays as the field `note` (below). The nobody box is a centred `border-dashed border-neutral-muted rounded-lg p-lg` block.
- [ ] **Step 4: Run** the folder and `yarn test packages/app-workflows/src/review/presentation/actionDialog/components/ReassignDialog.test.tsx 2>&1 | tail -30`. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): show reviewers with avatar and teams, and keep the picker on errors`.

### Task 8 (M): Request review dialog layout (RQ1, RQ2, RQ3, RQ4)

**Files:**
- Modify: `review/presentation/requestReview/components/RequestReviewDialog.tsx:69-178`, `requestReview/abstractions.ts` (step VM: `typeIcon`), `RequestReviewPresenter.ts:100`
- Test: `review/presentation/requestReview/components/RequestReviewDialog.test.tsx`

**Interfaces:**
- Produces: step VM `typeIcon: "group" | "auto_awesome" | "bolt"`. The editor's `getStepTypeIcon` is reused through a shared map in `review/presentation/requestReview/getStepTypeIcon.ts`.

- [ ] **Step 1: Write the failing tests:** a `Steps` label above the list. Steps sit in one bordered card with row dividers (`data-testid="request-steps"`, child rows). The step name is not muted. The description is a muted line under the name. The type tag carries its icon. A pick step shows both radios in one row. `Picks are checked again when the step is reached. If the person is no longer eligible, a reviewer is assigned automatically.` is always shown under the radios, even in Automatic mode. No "Reviewer" label.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/requestReview/components/RequestReviewDialog.test.tsx 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement:** `Dialog size="lg"` (640px is the nearest admin-ui width to the design's 600). Each row: 22px number circle, name and description column (`grow`), type tag (`icon`) and label tag pushed right. Pick block indented `ml-[32px]`. `RadioGroup className="grid-flow-col auto-cols-max gap-md"`. The hint is a muted `Text size="sm"`. The skeleton is 4 rows inside the same card.
- [ ] **Step 4: Run** the file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): lay out the request review steps as in the design`.

### Task 9 (M): Review bar failed and no-access states (RB9, P2C-9 bar part)

**Files:**
- Modify: `review/presentation/targetReview/components/ReviewBarFailed.tsx`, `components/ReviewBarSkeleton.tsx:21`
- Test: `review/presentation/targetReview/components/ReviewBar.test.tsx`

- [ ] **Step 1: Write the failing tests:** the failed status renders inside the bar card (`data-role="review-bar"`) with a `cloud_off` tile, `Could not load the review status`, `Editing and publishing are unavailable until it loads.` and a tertiary `Try again` with the refresh icon. No-access renders an `EmptyState` (`type="content"`, illustration on) with the no-access message. The loading text `Loading review status…` has `text-neutral-muted`.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/targetReview/components/ReviewBar.test.tsx 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement** with the bar card classes from `ReviewBar.tsx:71` and the tile `bg-destructive-subtle` + `fill-destructive`.
- [ ] **Step 4: Run** the file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): keep the review bar card when its status fails to load`.

### Task 10 (M): Website Builder bar as a full-width strip (RB1)

**Files:**
- Modify: `review/presentation/targetReview/components/ReviewBar.tsx:21-27,68-73`, `review/editor/components/EditorReviewBar.tsx` (pass-through)
- Modify: `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx:75-82`
- Test: `review/presentation/targetReview/components/ReviewBar.test.tsx`, `app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.test.tsx`

**Interfaces:**
- Produces: `type ReviewBarLayout = "card" | "strip"` (own file `targetReview/components/ReviewBarLayout.ts`), `ReviewBarProps.layout?: ReviewBarLayout` (default `"card"`).

- [ ] **Step 1: Write the failing tests:** `layout="strip"` has no `mx-md`, `rounded-lg` or `shadow-sm` and has `border-b-sm`. `PageReviewBar` renders the strip without its own `p-sm` wrapper.
- [ ] **Step 2: Run** both files. Expected: FAIL.
- [ ] **Step 3: Implement:** strip = `flex flex-col gap-sm-plus bg-neutral-base px-md py-sm-extra border-b-sm border-neutral-dimmed`. The R227 read-only note stays under the strip.
- [ ] **Step 4: Run** both files. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): render the review bar as a strip on request` and `fix(app-website-builder-workflows): show the page review bar as a full-width strip`.

### Task 11 (M): Review details view model: content line, Today, attempt parts, issue order (RD2, RD4, AI-1, RD5 order)

**Files:**
- Modify: `review/presentation/reviewDetails/buildReviewDetailsViewModel.ts:31-42,184-196`, `abstractions.ts:11-32`, `getAttempts.ts:58-73`, `ReviewDetailsPresenter.ts` (init params)
- Test: `review/presentation/reviewDetails/buildReviewDetailsViewModel.test.ts`, `getAttempts.test.ts`

**Interfaces:**
- Produces: `ReviewDetailsInitParams.contentTypeLabel?: string | null` and `contentUrl?: string | null`.
- Produces: `ReviewDetailsHeaderVm.contentLabel: string` (`"Article · Summer launch (#3)"`) and `contentUrl: string | null`. `contentLine` is removed.
- Produces: `ReviewAttemptVm { number: number; numberText: string; span: string; outcome: string; outcomeTone: AttemptOutcomeTone; reason: string | null; taskId: string | null; showTaskLink: boolean }`, with `type AttemptOutcomeTone = "running" | "approved" | "failed"` in its own file. `text` is removed.

- [ ] **Step 1: Write the failing tests:** content label `Article · Summer launch (#3)` with a type label, `Summer launch (#3)` without. Created today 09:58 → `Requested: Today 09:58`. Review Focus 5 case. Attempts → `numberText: "#1"`, `outcome: "Failed"`, `outcomeTone: "failed"` (rejected → `failed`, approved → `approved`, null → `running`). A step with issues and attempts lists the issues first (the VM keeps both; the drawer order is asserted in Task 12).
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/reviewDetails 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement:** `requestedLine` is `Today ${time}` when `formatReviewTime` returns a bare time. Thread `contentTypeLabel`/`contentUrl` from init (absent = `null`).
- [ ] **Step 4: Run** the folder. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): build the review details content link, Today and attempt parts`.

### Task 12 (M): Review details drawer header, timeline and cancelled state (RD1, RD3, P2C-5, RD5 layout)

**Files:**
- Modify: `review/presentation/reviewDetails/components/ReviewDetailsDrawer.tsx:77-300`
- Modify: callers passing `contentTypeLabel`/`contentUrl`: `review/editor/components/EditorReviewBar.tsx`, `packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewBar.tsx:29` (`model.name`), `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx` (`"Pages"`), `review/presentation/reviewList/components/ReviewListDialogs.tsx:31-39` (the row's `contentTypeLabel` and `contentUrl`)
- Test: `review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx`

- [ ] **Step 1: Write the failing tests:**
  - The Drawer `title` holds the muted eyebrow `Review details`, the review title and the state tag. `description` holds `Content: ` + link `Article · Summer launch (#3)`, `Requester: …`, `Requested: …`.
  - Loading title `Loading review…`; failed title `Review details`.
  - The content link without `contentUrl` is a `Button variant="link"` that calls `onClose`; with one it is an admin-ui `Link`.
  - Each step has a 32px state circle (`data-role="step-circle"`) and a connector line except the last.
  - Issues render before Attempts, in one bordered card with the uppercase header `Issues reported by the AI` inside and divided rows.
  - `Background task` is `variant="link"` with `iconPosition="end"`.
  - A cancelled review shows an `EmptyState` (`type="content"`) with `This review was cancelled`, the cancel text, a tertiary `Open content`, and no meta line.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.test.tsx 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement** with existing tokens. Circle colours reuse the step state classes (bg + `fill-*`); the line is `w-px bg-neutral-muted`. The outcome colour is `text-destructive-primary`, `text-success-primary` or `text-accent-primary`; `#n` is muted. The skeleton is 3 rows of circle + two bars.
- [ ] **Step 4: Run** the file, then `yarn test packages/app-workflows/src/review/presentation/reviewDetails 2>&1 | tail -30`. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): give review details the design header, timeline and cancelled state`, then `fix(app-headless-cms-workflows): pass the model name to review details` and `fix(app-website-builder-workflows): pass the content type to review details`.

### Task 13 (M): Content Reviews rows: app line, step dot, Failed icon (L2, C7 list, AI-2)

**Files:**
- Modify: `review/domain/types.ts:199-214`, `review/domain/toReviewListRow.ts:7-22`, `review/presentation/targetReview/getRowStateTag.ts`, `review/presentation/reviewList/abstractions.ts:48-64`, `ReviewListPresenter.ts:735-763`, `components/ReviewListTable.tsx:35-72`
- Move: `review/presentation/reviewWidget/widgetAppLabels.ts` → `review/presentation/widgetAppLabels.ts` (shared by list and widgets; update imports)
- Test: `review/presentation/reviewList/reviewListPure.test.ts`, `review/presentation/targetReview/getRowStateTag.test.ts`, `review/presentation/reviewList/ReviewListPresenter.test.ts`

**Interfaces:**
- Produces: `ReviewListRow.stepColor: string | null`. `RowStateTag.icon?: TargetReviewTagIcon`. `ReviewListRowVm` gains `stepColor: string | null`, `stepStateIcon: TargetReviewTagIcon | null` and `contentTypeApp: string`.

- [ ] **Step 1: Write the failing tests:** `toReviewListRow` carries the current step's colour, and `null` with no current step (Review Focus 4). `getRowStateTag` for Failed → `icon: "sync_problem"`. The presenter row → `contentTypeApp: "Headless CMS"` for `app: "cms"`.
- [ ] **Step 2: Run** the three files one by one. Expected: FAIL.
- [ ] **Step 3: Implement:** the table renders an 8px dot (only when `stepColor !== null`) before the step title; the content type as name plus a muted 12px app line; the tag `icon` from `REVIEW_TAG_ICONS`.
- [ ] **Step 4: Run** the three files. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): show the app, step colour and failed icon in Content Reviews`.

### Task 14 (M): Row actions menu and open-in-new button (L6, L7)

**Files:**
- Modify: `review/presentation/reviewList/components/ReviewListRowActions.tsx:33-82`
- Test: `review/presentation/reviewList/components/ReviewListView.test.tsx`

- [ ] **Step 1: Write the failing test:** the menu items in order are `Open content` (icon `edit_note`, navigates to `row.contentUrl`), `View details` (`timeline`), then `Reassign` (`swap_horiz`) and `Cancel review` (`block`) when allowed. Open in new window is a ghost `IconButton` labelled `Open in new window`.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListView.test.tsx 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement:** a fixed order map, `DropdownMenu.Item icon`, and `IconButton variant="ghost" size="sm"` opening the URL with `window.open(url, "_blank", "noopener,noreferrer")`.
- [ ] **Step 4: Run** the file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): order the Content Reviews row menu as in the design`.

### Task 15 (M): Content type filter as a Picker (L4)

**Files:**
- Modify: `review/presentation/reviewList/components/ReviewListToolbar.tsx:52-119`, `review/presentation/reviewList/IReviewContentTypeFilter.ts` (option: `app`, `icon`), `components/picker/PickerOptionIcon.ts` (+ `"web"`, `"devices_other"`), `components/picker/PickerOptionIconView.tsx`, `packages/app-headless-cms-workflows/src/presentation/contentReviews/toContentTypes.ts`
- Test: `review/presentation/reviewList/components/ReviewListToolbar.test.tsx`, `app-headless-cms-workflows/src/presentation/contentReviews/toContentTypes.test.ts`

- [ ] **Step 1: Write the failing tests:** the filter is a `WorkflowPicker` with `icon="filter_list"`, `anyLabel="All content types"` and options with description `Headless CMS` and icon `devices_other`. No clear button on "All content types". The search input has the search start icon. The review and step state selects are `w-[200px]` and show `Any review state` / `Any step state` uncut.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/reviewList/components/ReviewListToolbar.test.tsx 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement:** the picker searches client-side over the filter options. For the plain selects, no reset on the `all` value (`displayResetAction={value !== ALL}`).
- [ ] **Step 4: Run** both files. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): filter Content Reviews by content type with the picker` and `fix(app-headless-cms-workflows): give content type filter options their app and icon`.

### Task 16 (M): Dashboard widgets as admin-ui Widget cards (H3 card part, H4, C7 widgets)

**Files:**
- Modify: `review/presentation/reviewWidget/components/ReviewWidgetCard.tsx:105-126`, `ReviewWidgetRow.tsx`, `ReviewWidgetPresenter.ts:276-302`, `abstractions.ts:20-28`, `ReviewForMeWidget.tsx` / `ReviewMyRequestsWidget.tsx` (icon), `review/mounting/components/ReviewDashboardWidgets.tsx:33-73` (preview rows)
- Test: `review/presentation/reviewWidget/ReviewWidgetPresenter.test.ts`, `components/ReviewWidgets.test.tsx`

**Interfaces:**
- Produces: `ReviewWidgetRowVm` gains `stepTitle: string | null`, `stepColor: string | null`, `contentType: string | null` and `app: string`; `stepLine` is removed.

- [ ] **Step 1: Write the failing tests:**
  - The row VM for a CMS row: `stepTitle: "Legal sign-off"`, `contentType: "Article"`, `app: "Headless CMS"`.
  - The row renders the dot, `Legal sign-off · Article (Headless CMS)` and the tag with its icon for Failed.
  - The For me card renders the `rate_review` header icon; My requests renders `send`.
  - `View all` is a ghost small button with the `arrow_forward` icon at the end, routing to the tab URL.
- [ ] **Step 2: Run** the presenter test, then the component test. Expected: FAIL.
- [ ] **Step 3: Implement** with admin-ui `Widget` (`icon={<Widget.Icon …/>}`, `headerActions` = segment, `footerEndActions` = View all), like `ContentModelsWidget`.
- [ ] **Step 4: Run** both. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): show the review widgets as dashboard cards with icons and step dots`.

### Task 17 (M): Empty, error and loading states use admin-ui EmptyState illustrations (C6, S1, ED10)

**Files:**
- Modify: `review/presentation/reviewList/components/ReviewListEmpty.tsx`, `ReviewListView.tsx:30-40` (skeleton), `editor/presentation/editor/components/NoWorkflowState.tsx`, `EditorLoadError.tsx`, `EditorNoPermission.tsx`, `settings/presentation/exclusionsPage/components/ExclusionsEmpty.tsx`, `ExclusionsLoadError.tsx`, `ExclusionsNoAccess.tsx`, `settings/model/list/ExclusionsEmptyVm.ts` (drop `icon`) and its builder
- Test: `review/presentation/reviewList/components/ReviewListView.test.tsx`, `editor/presentation/editor/components/EditorStates.test.tsx`, `settings/presentation/exclusionsPage/components/ExclusionsPage.test.tsx`, `settings/presentation/exclusionsPage/ExclusionsPagePresenter.rows.test.ts`

Types (admin-ui offers `content`, `table`, `listing`, `layout`, `upload`, `select`): Content Reviews empty and error → `table`; editor no workflow and load error → `layout`; editor no permission, exclusions no access → `content`; exclusions empty and error → `listing`.

- [ ] **Step 1: Write the failing tests:** each state renders the EmptyState illustration (`svg[aria-hidden]` inside the empty state) and no hand-made `Icon` above it. `Try again` buttons carry the refresh icon. The editor no-permission state is centred in the page (`flex items-center justify-center`). The list skeleton renders 6 rows of 4 bars each (`data-testid="review-list-skeleton-row"`).
- [ ] **Step 2: Run** the four files one by one. Expected: FAIL.
- [ ] **Step 3: Implement:** remove `illustration={false}` and the icons above; pass `type`.
- [ ] **Step 4: Run** the four files. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): use the admin-ui empty state illustrations in workflows`.

### Task 18 (M): Workflow name as an editable title, Save with icon (E1, E3 Save part)

**Files:**
- Modify: `editor/presentation/editor/components/EditorHeader.tsx:45-91`
- Test: `editor/presentation/editor/components/EditorHeader.test.tsx`

- [ ] **Step 1: Write the failing tests:** the name renders as admin-ui `EditableTitle`. Committing `"New name"` calls `onNameChange("New name")`. `nameError` shows below as `text-destructive-primary`. Save has the `save` icon and reads `Saving…` while saving.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/editor/presentation/editor/components/EditorHeader.test.tsx 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement:** `EditableTitle value onCommit readOnly={header.saving}`.
- [ ] **Step 4: Run** the file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): edit the workflow name in place`.

### Task 19 (M): Flow: empty steps, connectors, step card layout (E7, ED1 line part, E6, E2, E3, ED7 divider)

**Files:**
- Modify: `editor/presentation/editor/components/WorkflowFlow.tsx:46-107,219-275`, `StepCard.tsx:46-165`, `editor/presentation/editor/abstractions.ts` (flow VM: `modelName`)
- Test: `editor/presentation/editor/components/WorkflowFlow.test.tsx`, `StepCard.test.tsx`

- [ ] **Step 1: Write the failing tests:**
  - No steps: `No steps yet`, `Add the first step: who or what reviews Article content before it can be published.`, and a primary `Add step` with the `add` icon, followed by a 24px connector line before Published.
  - Each connector is line, round `+` and line (`data-role="connector-line"` twice).
  - Step card: the type tag sits in the title row right after the title; the card has `shadow-sm`; the Draft icon has `fill-neutral-strong`.
  - The step error renders as a line with the `error` icon in `text-destructive-primary` (same as pre-save errors).
  - Warning lines sit under a `border-t-sm border-neutral-subtle` divider.
- [ ] **Step 2: Run** both files one by one. Expected: FAIL.
- [ ] **Step 3: Implement** as tested. The connector buttons stay `aria-label="Add step"`.
- [ ] **Step 4: Run** both files. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): lay out the workflow flow and step cards as in the design`.

### Task 20 (M): Step type picker as three cards (E8)

**Files:**
- Modify: `editor/presentation/editor/components/StepTypePicker.tsx:18-108`
- Test: `editor/presentation/editor/components/StepTypePicker.test.tsx`

- [ ] **Step 1: Write the failing test:** the dialog is `size="lg"` with a 3-column grid. Each card shows the icon on top (`fill-accent-default`; disabled `fill-neutral-disabled`), the name and the description. A disabled card's reason has the `lock` icon and `text-neutral-strong` text, and stays its `aria-describedby`.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/editor/presentation/editor/components/StepTypePicker.test.tsx 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement** with `grid grid-cols-3 gap-sm-extra`.
- [ ] **Step 4: Run** the file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): show the step types as three cards`.

### Task 21 (M): Editor confirm dialogs: icon, no close button, white Cancel, red discard, blocked list (E9, ED3, E17, ED11)

**Files:**
- Modify: `editor/presentation/editor/components/dialogs/EditorConfirmDialog.tsx:28-91`, `BlockedDeleteDialog.tsx`, `editor/presentation/editor/abstractions.ts` (`WorkflowEditorDialogVm.icon`), `editor/presentation/editor/dialogs/*.ts`, `dialogs/blockedDeleteDialog.ts:18-35`
- Test: `editor/presentation/editor/dialogs/dialogs.test.ts`, `components/dialogs/WorkflowEditorDialogs.test.tsx`

**Interfaces:**
- Produces: `type EditorDialogIcon = "warning" | "delete" | "delete_forever" | "sync_problem" | "block" | "refresh" | "swap_horiz"` (own file). `WorkflowEditorDialogVm.icon: EditorDialogIcon`.

- [ ] **Step 1: Write the failing tests:**
  - icons: discard changes `warning`, deleted `delete_forever`, conflict `sync_problem`, blocked `block`, delete workflow and delete step `delete`, reload `refresh`.
  - blocked body: `2 reviews using “Article review” are in progress. Wait for them to finish, or open each one and cancel it. Then try again.` with `note: null`.
  - The dialog renders no close button, Cancel is tertiary, and a `cancelDestructive` button is `variant="destructive"`.
  - The blocked reviews sit in a bordered, divided list, each row with an `open_in_new` icon.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/editor/presentation/editor/dialogs/dialogs.test.ts 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement** with `Dialog icon={…}` (`fill-warning` for warning, `fill-destructive` otherwise) and `showCloseButton={false}`; Escape and overlay keep `dismissible`.
- [ ] **Step 4: Run** both files. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): give editor dialogs their icon, white cancel and red discard`.

### Task 22 (M): AI step form: hints below, model message first, model sub line (ED2, E15)

**Files:**
- Modify: `editor/presentation/stepForm/buildAiStepForm.ts:31,40` (`.description` → `.note`), `renderers/AiModelPickerRenderer.tsx`, `editor/presentation/stepForm/getAiModelOptions.ts`
- Test: `editor/presentation/stepForm/renderers/AiModelPickerRenderer.test.tsx`

- [ ] **Step 1: Write the failing tests:** the instructions hint renders after the textarea. With the models failed, the order is field, `Could not load AI models.` + Retry, then `Models available through AI Power-Ups.` An option's description reads `Anthropic · Fast, low-cost checks` (`{provider} · {description}`). The picker has the `smart_toy` icon and no clear button.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AiModelPickerRenderer.test.tsx 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement:** the renderer passes no note to the picker and renders `field.note` as a muted `Text size="sm"` after the messages.
- [ ] **Step 4: Run** the file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): show AI step hints below their fields`.

### Task 23 (M): People step sections and Notify via (E13 structure, E12)

**Files:**
- Modify: `editor/presentation/stepForm/renderers/AssignmentStrategyRenderer.tsx:39-60`, `RoutingRulesRenderer.tsx` (top divider), `TransportCheckboxesRenderer.tsx:67-90`, `editor/presentation/stepForm/buildPeopleStepForm.ts:47` (requester-pick label weight)
- Test: `renderers/AssignmentStrategyRenderer.test.tsx`, `renderers/TransportCheckboxesRenderer.test.tsx`

- [ ] **Step 1: Write the failing tests:** Strategy, Let the requester pick a reviewer, Routing rules and Notify via each start with a `border-t-sm border-neutral-subtle pt-md` section, except the first in its tab. The transport label renders the title, then the description in a separate `text-neutral-muted` span (`· {description}`). The requester-pick hint is indented under the label.
- [ ] **Step 2: Run** both files one by one. Expected: FAIL.
- [ ] **Step 3: Implement** as tested.
- [ ] **Step 4: Run** both files. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): divide the people step sections and mute transport descriptions`.

### Task 24 (M): Test routing result card and stale alert (E14)

**Files:**
- Modify: `editor/presentation/stepForm/renderers/testRouting/TestRoutingResult.tsx:22-90`, `TestRoutingStale.tsx:14-16`, `TestRoutingInputs.tsx` (inputs stay enabled while running), `TestRoutingRenderer.tsx` (skeleton inside the card)
- Test: `editor/presentation/stepForm/renderers/TestRoutingRenderer.test.tsx`

- [ ] **Step 1: Write the failing tests:**
  - The result is one bordered card. The top band is `bg-neutral-subtle` with a 36px round icon (`person` or `groups`), the muted `Owner` label, the owner (16px semibold) and the reason.
  - The uppercase headings are `Trace` and `Skipped people`; trace rows sit in a `grid-cols-[92px_1fr]` grid, and the Strategy row has a top divider.
  - The stale alert is `type="warning"` with `Out of date: the configuration or test inputs changed since this result.` and `Test again`.
  - The inputs are not disabled while the test runs.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/TestRoutingRenderer.test.tsx 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement** as tested.
- [ ] **Step 4: Run** the file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): lay out the test routing result as in the design`.

### Task 25 (L): Review bar meta line, tile icons and progress row (RB3, RB4, RB5, RB7, RB8, C2, C7 bar, AI-5)

**Files:**
- Modify: `review/presentation/targetReview/buildTargetReviewViewModel.ts:39-66,108-119`, `abstractions.ts:110-130`, `components/ReviewBar.tsx:74-141`, `components/reviewBarAppearance.ts:62-71`, `components/ReviewProgress.tsx:29`
- Test: `review/presentation/targetReview/buildTargetReviewViewModel.test.ts`, `runningFailedView.test.ts`, `components/ReviewBar.test.tsx`

**Interfaces:**
- Produces: VM `stepColor: string | null` and `ownerName: string | null` (replaces `ownerMeta`).

- [ ] **Step 1: Write the failing tests:**
  - An approved review → `stepMeta: null`, `stepStateTag: null`, `ownerName: null`.
  - A rejected review keeps its step line.
  - A running AI step → `tile: "rate_review"`.
  - An in-review step → `stepColor` equals the step colour.
  - Component: one meta row with dot, step text, tag, `Owner: ` + `<b>` name, and the lock text inline in the same row. Tile icon classes are `fill-accent-default` / `fill-warning` / `fill-success` / `fill-destructive` / `fill-neutral-xstrong`. The progress row has `border-t-sm border-neutral-subtle`. Review details has the `timeline` icon. The caption is `text-neutral-muted`. The actions column is `items-center`.
- [ ] **Step 2: Run** the three files one by one. Expected: FAIL.
- [ ] **Step 3: Implement:** drop `progress_activity` from `getTile` (R263 rules only the tag), and add `fill-*` to `REVIEW_TILE_CLASSES`.
- [ ] **Step 4: Run** the three files. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): put the review bar meta and lock text on one line`.

### Task 26 (L): Steps popover layout (RB10, C7 popover)

**Files:**
- Modify: `review/presentation/targetReview/components/ReviewStepsPopover.tsx:35-63`, `getReviewProgress.ts` and the segment VM (`color`, `description`)
- Test: `review/presentation/targetReview/runningFailedView.test.ts` (segment VM), `components/ReviewBar.test.tsx` (popover)

- [ ] **Step 1: Write the failing tests:** the segment VM carries `color` and `description`. The popover content is `w-[380px]`; each row has the dot, the title and muted description, the tag right-aligned (`ml-auto`), the owner line, and the comment in a `bg-neutral-light rounded-sm px-sm py-xs` quote box (`“…”`).
- [ ] **Step 2: Run** both files. Expected: FAIL.
- [ ] **Step 3: Implement** as tested.
- [ ] **Step 4: Run** both. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): lay out the review steps popover as in the design`.

### Task 27 (L): Content type icon in the Content Reviews title cell (L1)

**Files:**
- Modify: `review/presentation/reviewList/abstractions.ts:15-18` (`IReviewRowBinding.renderContentTypeIcon(contentTypeId: string): React.ReactNode`), `components/ReviewListTable.tsx:25-33`, `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewContentAdapter/CmsReviewContentAdapter.ts`, `packages/app-website-builder-workflows/src/features/gateway/WbReviewContentAdapter/WbReviewContentAdapter.ts`
- Test: `review/presentation/reviewList/components/ReviewListView.test.tsx`

- [ ] **Step 1: Write the failing test:** the title cell renders the binding's icon before the title.
- [ ] **Step 2: Run** the file. Expected: FAIL.
- [ ] **Step 3: Implement:** CMS returns the model icon (the `normalizeIcon` path of `CmsWorkflowEditorAppAdapter.renderModelIcon`) with a `devices_other` fallback. WB returns `web`.
- [ ] **Step 4: Run** the file. Expected: PASS.
- [ ] **Step 5: Commit** one per package: `fix(app-workflows): show the content type icon in Content Reviews`, `fix(app-headless-cms-workflows): render model icons for review rows`, `fix(app-website-builder-workflows): render the pages icon for review rows`.

### Task 28 (L): Model panel icons and breadcrumb (E4, E5)

**Files:**
- Modify: `packages/app-headless-cms-workflows/src/…/CmsWorkflowEditorAppAdapter.tsx:40-58` (fallback `devices_other` icon), `editor/presentation/editor/components/ModelPanel.tsx:84-104`, `editor/mounting/components/WorkflowEditorRoute.tsx:44`, `editor/presentation/editor/components/WorkflowEditorView.tsx` (third breadcrumb)
- Test: `editor/presentation/editor/components/ModelPanel.test.tsx`, `WorkflowEditorView.test.tsx`

- [ ] **Step 1: Write the failing tests:** the search input has the search start icon. The no-match text is `text-sm text-neutral-muted text-center`. With a model open, the breadcrumb list ends with the model name.
- [ ] **Step 2: Run** both files. Expected: FAIL.
- [ ] **Step 3: Implement:** `AdminConfig.Breadcrumb name={`${breadcrumbName}.model`} label={modelName}`, rendered while a model is open.
- [ ] **Step 4: Run** both. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): add the model to the editor breadcrumb and polish the model panel` and `fix(app-headless-cms-workflows): give models without an icon a fallback icon`.

### Task 29 (L): Colour hex below the swatches and AI drawer padding (E11 structure, E10 padding)

**Files:**
- Modify: `editor/presentation/stepForm/renderers/StepColourRenderer.tsx:39-92`, `editor/presentation/stepDrawer/StepDrawer.tsx:114`
- Test: `renderers/StepColourRenderer.test.tsx`

- [ ] **Step 1: Write the failing test:** the hex input renders in its own row below the swatches.
- [ ] **Step 2: Run** the file. Expected: FAIL.
- [ ] **Step 3: Implement:** wrap the swatches, divider and custom input in one row and the hex input in a second row. The drawer body gets `pt-md` when the form has no tabs (`activeTabId === null`).
- [ ] **Step 4: Run** the file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): put the hex colour field below the swatches`.

### Task 30 (L): Page frame and settings polish (C11, S2, ES1 parts)

**Files:**
- Modify: `review/presentation/reviewList/components/ReviewListView.tsx:103`, `settings/presentation/exclusionsPage/components/ExclusionsPage.tsx` (container), `ExclusionsHeader.tsx` (`Heading level={3}`), `ExclusionsRulesCard.tsx:31` (admin-ui `Card`), `settings/presentation/exclusionDialog/components/ExclusionDialog.tsx:105-120,156-165`
- Test: `settings/presentation/exclusionsPage/components/ExclusionsPage.test.tsx`, `exclusionDialog/components/ExclusionDialog.test.tsx`, `review/presentation/reviewList/components/ReviewListView.test.tsx`

- [ ] **Step 1: Write the failing tests:** both pages wrap content in `mx-auto max-w-[1180px]` (kit `.page`). The exclusions title is an `h3`. The rules card is an admin-ui Card. `Clear` aligns with the date input (`items-end` row). The locked User picker shows no clear button.
- [ ] **Step 2: Run** the three files one by one. Expected: FAIL.
- [ ] **Step 3: Implement** as tested (locked picker: `clearable={false}` from Task 2).
- [ ] **Step 4: Run** the three files. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): centre the workflows pages and polish the exclusions page`.

### Task 31 (L): Rejection notification without a comment (N3, D126)

**Files:**
- Modify: `packages/api-workflows/src/domain/notifications/messages/buildRejectedMessage.ts`, `features/notifications/handlers/ReviewStepRejectedNotifications.ts:49`
- Test: `packages/api-workflows/__tests__/notifications/messages.test.ts`

**Interfaces:**
- Produces: `RejectedMessageParams.comment: string | null`.

- [ ] **Step 1: Write the failing tests:** comment `null`, decider `AI tone check` = step title → `body` and `text` are `Rejected at AI tone check.`. Decider `Ana Kovač` → `Rejected at Legal sign-off by Ana Kovač.`. A blank comment behaves like `null`. The title and subject stay as they are.
- [ ] **Step 2: Run** `yarn test packages/api-workflows/__tests__/notifications/messages.test.ts 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement:** `const line = decider === stepTitle ? `Rejected at ${stepTitle}.` : `Rejected at ${stepTitle} by ${decider}.``. The handler passes `fact.comment` as it is.
- [ ] **Step 4: Run** the file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(api-workflows): word rejection notifications without a comment as D126 says`.

---

## Not a gap: design deviates from the design system

- **C1** (with RB6, ES6 Unsaved changes tag, CRA-25 AI severity tags): the design's bordered, iconed, tinted state tags. The design system and admin-ui `Tag` have filled variants only.
- **LS4**: the highlighted row hides the In review tag. This follows from C1 (borderless tag on a primary-subtle row).
- **AI-4**: the full-width green "Content updated" strip with green text and icon. There is no admin-ui notice style for it.
- **ED1** strip look: the full-width tinted strip with a top border. Task 19 keeps the icon and the red line.
- **ED7**: amber text on warning lines, and the alert icons per type. admin-ui `Alert` icons are fixed per type.
- **P2C-1 / LS2**: alert borders, coloured text and custom icons (`error`, `sync_problem`).
- **LS3**: the "New reviews are available." notice with primary-subtle fill, border and `fiber_new` icon.
- **CR1**: the nobody note as plain amber text with an info icon, where the admin-ui Alert is filled.
- **E14** stale alert: the custom `update` icon colour and border. The type is fixed in Task 24.
- **E15**: the `edit_document` icon on the "Changes content" tag. It is not in `@webiny/icons` either.
- **AD2**: the red counter colour. admin-ui `note` text has one colour.
- **ED5**: the triangle icon of the save-failure banner (admin-ui Alert danger icon).
- **ED8**: the error icon in front of "Could not load AI models."
- **ES1**: dark alert text in the exclusions dialog (admin-ui Alert text colour).
- **E11**: the round custom swatch with the `colorize` icon. This styles a native colour input in a way admin-ui does not.

## admin-ui vs design system (for the admin-ui owner)

- **L5 / ES1 tables**: the kit `.tablewrap` card (radius, shadow) and small, muted, uppercase headers. admin-ui `Table bordered` has neither.
- **Tabs (L5, E10)**: the kit uses 14px labels with a bold label and a 2px underline. admin-ui Tabs use about 13px labels with a grey pill.
- **Dialog frame (C4, S3)**: the kit has header and footer dividers. admin-ui `Dialog` has no separators, and its close (x) shows a focus ring on open. `Dialog.CancelAction` is secondary (grey) where the kit Cancel is tertiary; workflows passes a tertiary Button in Task 4.
- **Button heights (RB8, L7)**: the kit `.btn` is 36px and `.btn-sm` 30px. admin-ui `md` is 32px, `lg` 40px and `sm` 28px.
- **Drawer title (E10)**: the kit drawer title is 16px/600. admin-ui `DrawerHeader` is larger.
- **Switch (E13)**: the kit toggle is primary orange. The admin-ui `Switch` checked colour is green.
- **RadioGroup (E13)**: the kit has radio cards with the radio inside a full-width card. admin-ui `RadioGroup` has no card variant.
- **Ghost IconButton disabled state (E13)**: the kit mutes disabled ↑/↓. The admin-ui ghost variant draws them at full strength.
- **AutoComplete (ES1)**: a disabled field still shows the chevron.
- **Alert action (ED5)**: the kit centres the action button vertically. The admin-ui `Alert.Action` sits small and top-aligned.
- **EmptyState (C6)**: the kit `.empty` uses an icon and sits in a card. admin-ui uses illustrations without a card.

## Needs approval / out of bounds

- **H3 full-width widget row**: `AdminConfig.Dashboard.Widget` only knows `column: "left" | "right"` (`app-admin/src/config/AdminConfig/Widget.tsx:4`). A full-width row needs app-admin. Task 16 covers the card.
- **E16 / ED12**: the pink highlight around the Colour group and the Routing rules group is app-admin `FormView`'s `focusField` styling for a custom renderer. Workflows already focuses the right field.
- **ED6**: banners above the tabs. The tabs are rendered inside app-admin `FormView`, which has no slot between the tabs and the body. The "error shown twice" part is dropped below.
- **G2**: the progress popover opening on hover. admin-ui `Popover` does not forward `onOpenAutoFocus`, so opening on hover would take the focus out of the editor.
- **N2**: toasts pausing on keyboard focus. This is admin-ui toast (sonner 2.0.8) behaviour.
- **P2C-9 form part**: hiding the CMS entry form for a no-access viewer needs `app-headless-cms`. Task 9 does the bar.
- **F2**: the locked CMS form looks editable. The fields are inert inside a disabled fieldset; only the base CMS field renderers' look is off.
- **G1**: developer-mode "Remove review request". It needs a new engine operation, mutations in `api-workflows`, `api-headless-cms-workflows` and `api-website-builder-workflows`, and the app-admin `DeveloperMode` hook. This is too large for a gap fix; approve the scope for its own plan.
- **LS6**: an own second session taking over reads as "someone else" with the viewer's own name. The design has no copy for this; a copy decision is needed.
- **WB second read-only strip (deferred minor)**: R227 rules the strip under the bar. Removing the in-review note (which duplicates the bar's lock text) needs a ruling change.

## Dropped (already fixed or wrong)

- **H2**: fixed in 8f547da765 (the title no longer wraps next to the segment switch).
- **RD1 modal and separators part**: fixed in 9e58a6e6cb. The header is in Task 12.
- **ED4**: wrong. The design dialogs also quote the unsaved draft name (`name = s.draft.name`, Workflow Editor.dc.html:812).
- **ED9**: wrong. The design disables the model picker whenever models fail or are empty (`modelDisabled: ro || aiModels !== 'ok'`).
- **P2C-7**: wrong. The design sets only the 5-character minimum; `serverTitleError` serves any server title error.
- **L7 page size**: deliberate. `REVIEW_LIST_PAGE_SIZE = 20` (8a 00-shared).
- **ED6 "same rule error shown twice"**: deliberate. README §3/§4 shows warnings on the card, at the top of the drawer and below the rule fields.
- **ED8 Retry inline and raw model id**: the design also has Retry inline. Without a loaded list there is no name to show in either version.
- **ED5 banner width**: README §3 places it "under the header", which the live banner matches.
