# Workflows design gaps: fix plan (H items + cheap batch)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the high-severity gaps and the cheap fixes found when the live workflows admin was compared with the Claude Design prototypes.

**Architecture:** Every fix is in the workflows admin packages (`app-workflows`, `app-headless-cms-workflows`) except Task 9's first half, which adds one decoration point and keeps the server error code in the base CMS model-delete dialog. Presentation rules stay in the pure view-model builders, so most tasks are test-first on a pure function.

**Tech Stack:** React, TypeScript, `@webiny/admin-ui`, `@webiny/di` features/presenters, Vitest.

**Spec:** `docs/.bruno/workflows/2026-10-27-design-vs-live.md` (findings, reviewed). Design: `docs/.bruno/workflows/design/files/` (README.md, `*.dc.html`).

## Global Constraints

- Branch: `bruno/feat/workflows-umbrella`. Never touch `bruno/refactor/workflows-flow`. Never push. Never deploy.
- Task 9 Part A changes the base package `@webiny/app-headless-cms`. Get the user's approval before starting it.
- Extend workflows code, not base Webiny; base changes only where no extension point exists (Task 9 Part A).
- Copy uses curly quotes “ ” and the ellipsis …, exactly as written in this plan.
- One abstraction/implementation per file; no `Impl` suffix on exports; no inline object types (extract named interfaces).
- Admin is desktop only: mouse and keyboard, no touch behaviour.
- Tests: run one test file at a time by path, never in parallel: `yarn test <path> 2>&1 | tail -30`.
- Before each commit: `yarn format:fix`, `yarn lint:fix`, `yarn adio`, `node scripts/generateTsConfigsInPackages.js`, `yarn build -p <changed package>`. If a step fixes something, rerun from the start.
- Commits: Conventional Commits, scope = package (`fix(app-workflows): …`), ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never amend.

## Review Focus

1. A published revision that is also unpublished (Q19, "Approved and unpublished") must keep its normal actions: Task 1 only changes the `none` status (no review at all).
2. A cancelled review whose `cancelledBy` has an empty display name must still read naturally ("A user", like `getStepOwnerLabel`). Task 2 test.
3. A pool row on a `pending` or `null` step state must stay blank, not "Team pool": only `awaiting` is a pool. Task 3 test.
4. An AI issue `fieldPath` with a nested path ("content.0.text") or an unknown field id must not crash or show `undefined`. Task 6 test.
5. The model-delete decorator must leave every other delete error unchanged (wrong confirmation text, network failure). Task 9 test.

---

### Task 1: No "Request review" on a revision published before the workflow existed (RB2)

**Files:**
- Modify: `packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.ts:96-99`
- Test: `packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts`

**Interfaces:** none new. `TargetReviewViewModelInput.isPublished` already exists.

- [ ] **Step 1: Write the failing tests** in the existing describe block:
  - `"offers no Request review on a published revision with no review (legacy)"`: input `status: "none"`, `review: null`, `canRequest: true`, `isPublished: true`, `isUnpublished: false`. Assert `vm.actions` has no entry with `kind === "request"`, and `vm.message` is "This revision was published before the workflow existed. Create a new revision to change it." (the existing copy in `getReviewMessage.ts:39`).
  - `"still offers Request review on an unpublished draft with no review"`: same with `isPublished: false`. Assert one `request` action.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/targetReview/buildTargetReviewViewModel.test.ts 2>&1 | tail -30`. Expected: the legacy test FAILS.
- [ ] **Step 3: Implement**: for `status === "none"`, pass `canRequest: input.canRequest && !input.isPublished`.
- [ ] **Step 4: Run** the same test file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): offer no review request on a revision published before its workflow`.

### Task 2: Name who cancelled in the cancelled-underneath conflict (AD6)

**Files:**
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.ts:64-69`
- Test: `packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.test.ts`

**Interfaces:** consumes `Review.cancelledBy: ReviewActor | null` (`review/domain/types.ts:113`).

- [ ] **Step 1: Write the failing tests:**
  - cancelledBy `{ type: "user", displayName: "Maja Kos" }`, kind `approve`, time 14:20 → message `Maja Kos cancelled this review at 14:20, so your approval was not saved. The revision has no review now.`
  - cancelledBy `{ displayName: "  " }` → starts with `A user cancelled this review at`.
  - cancelledBy `null` → keeps today's `Someone cancelled this review at …`.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/actionDialog/getConflictMessage.test.ts 2>&1 | tail -30`. Expected: the first two FAIL.
- [ ] **Step 3: Implement** a private `getCancellerName(review: Review): string` in the same file: trimmed `cancelledBy.displayName`, `"A user"` when empty, `"Someone"` when `cancelledBy` is null. Use it in the cancelled branch.
- [ ] **Step 4: Run** the test file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): name who cancelled a review in the conflict message`.

### Task 3: "Team pool" owner for pool rows in Content Reviews (L3)

**Files:**
- Modify: `packages/app-workflows/src/review/presentation/reviewList/getListOwnerLabel.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewList/ReviewListPresenter.ts:754`
- Test: `packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts:59-63`

**Interfaces:**
- Produces: `getListOwnerLabel(owner: ReviewActor | null, stepTitle: string | null, stepState: StepStateValue | null): string | null`

- [ ] **Step 1: Update the test**: existing assertions get a third argument (`StepState.InReview` for owned rows). Add: `getListOwnerLabel(null, "Legal sign-off", StepState.Awaiting)` → `"Team pool"`; `getListOwnerLabel(null, "Legal sign-off", StepState.Pending)` → `null`; `getListOwnerLabel(null, null, null)` → `null`.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/reviewList/reviewListPure.test.ts 2>&1 | tail -30`. Expected: FAIL on "Team pool".
- [ ] **Step 3: Implement**: with no owner, return `"Team pool"` only when `stepState === StepState.Awaiting`, else `null` (README:162). The presenter passes `row.stepState`.
- [ ] **Step 4: Run** the test file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): show Team pool as the owner of pool rows`.

### Task 4: Failed step tag gets the sync_problem icon (F1, R263)

**Files:**
- Modify: `packages/app-workflows/src/review/presentation/targetReview/abstractions.ts:55` (`TargetReviewTagIcon`)
- Modify: `packages/app-workflows/src/review/presentation/targetReview/getStepStateTag.ts:24-25`
- Modify: `packages/app-workflows/src/review/presentation/targetReview/components/reviewBarAppearance.ts:40-43` (`REVIEW_TAG_ICONS`, fix its comment)
- Test: `packages/app-workflows/src/review/presentation/targetReview/stepLabels.test.ts`

**Interfaces:**
- Produces: `type TargetReviewTagIcon = "progress_activity" | "sync_problem"`

- [ ] **Step 1: Write the failing test**: `getStepStateTag(StepState.Failed)` equals `{ label: "Failed", variant: "destructive", icon: "sync_problem" }`.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/targetReview/stepLabels.test.ts 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement** the union member, the tag icon, and `sync_problem: SyncProblemIcon` in `REVIEW_TAG_ICONS` (the icon is already imported in that file).
- [ ] **Step 4: Run** the test file, then `yarn test packages/app-workflows/src/review/presentation/targetReview/runningFailedView.test.ts 2>&1 | tail -30`. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): give the Failed step tag its sync_problem icon`.

### Task 5: Tell the two apps' dashboard widgets apart (H1, H2)

**Files:**
- Modify: `packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgetCard.tsx:110`
- Test: `packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx`

**Interfaces:** consumes the card's existing `app: WorkflowAppKind` prop.

- [ ] **Step 1: Write the failing test**: rendering the For me widget with `app="cms"` shows the title "For me to review" and the muted app label "Headless CMS"; `app="wb"` shows "Website Builder".
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/reviewWidget/components/ReviewWidgets.test.tsx 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement**: a module constant `WIDGET_APP_LABELS: Record<WorkflowAppKind, string> = { cms: "Headless CMS", wb: "Website Builder" }` in its own file `reviewWidget/widgetAppLabels.ts`; the header shows the title, then the label in `text-neutral-muted` text. Give the title `whitespace-nowrap` so it never wraps next to the segment switch.
- [ ] **Step 4: Run** the test file. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): label the dashboard review widgets with their app`.

### Task 6: AI issues show the field label, not the API field id (RD5)

**Files:**
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/getAiIssues.ts`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/buildReviewDetailsViewModel.ts:31-40,142`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/abstractions.ts:8-16` (`ReviewDetailsInitParams`)
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/ReviewDetailsPresenter.ts:90-98` (keep the labels from `init`, pass them on)
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.tsx:22-29,311-320`
- Modify: `packages/app-workflows/src/review/editor/components/EditorReviewBar.tsx`
- Modify: `packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewBar.tsx:29`
- Test: `packages/app-workflows/src/review/presentation/reviewDetails/getAiIssues.test.ts` (create)

**Interfaces:**
- Produces: `type ReviewFieldLabels = Record<string, string>` in `reviewDetails/abstractions.ts` (field id → label).
- Produces: `getAiIssues(step: ReviewStep, fieldLabels: ReviewFieldLabels): ReviewAiIssueVm[]`
- Produces: optional `fieldLabels?: ReviewFieldLabels` on `ReviewDetailsInitParams`, `ReviewDetailsViewModelInput`, `ReviewDetailsDrawerProps` and `EditorReviewBarProps`; absent means `{}`.

- [ ] **Step 1: Write the failing tests** for `getAiIssues`:
  - `fieldPath: "description"`, labels `{ description: "Body" }` → `field: "Body"`.
  - `fieldPath: "content.0.text"`, labels `{ content: "Content" }` → `field: "Content › 0 › text"`.
  - `fieldPath: "slug"`, labels `{}` → `field: "slug"`.
  - `fieldPath: null` → `field: "Whole content"` (unchanged).
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/reviewDetails/getAiIssues.test.ts 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement** `getAiIssues`: split `fieldPath` on `.`, replace the first segment with its label when known, join with " › ". Thread `fieldLabels` from the drawer props through `init` and the presenter into `buildReviewDetailsViewModel` (default `{}`).
- [ ] **Step 4: Run** the test file. Expected: PASS.
- [ ] **Step 5: CMS passes the labels**: in `CmsEntryReviewBar`, build `fieldLabels` from `model.fields` (`fieldId` → `label`) with `useMemo` keyed on the model, and pass it to `EditorReviewBar`, which passes it to the drawer. Website Builder passes nothing.
- [ ] **Step 6: Run** `yarn test packages/app-workflows/src/review/presentation/reviewDetails 2>&1 | tail -30` (one folder, no other test running). Expected: PASS.
- [ ] **Step 7: Commit** two commits split by package: `fix(app-workflows): show field labels in AI issues` and `fix(app-headless-cms-workflows): pass the model's field labels to review details`.

### Task 7: Cheap batch A: ghost icon buttons, destructive confirms, drawer frame (C3, C5, RD1)

**Files:**
- Modify: `packages/app-workflows/src/review/presentation/reviewList/components/ReviewListRowActions.tsx:59`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/EditorHeader.tsx:70`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/getActionDialogCopy.ts` and its view-model type in `actionDialog/abstractions.ts`
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialog.tsx:19-27`
- Modify: `packages/app-workflows/src/review/presentation/reviewDetails/components/ReviewDetailsDrawer.tsx:75-81`
- Test: `packages/app-workflows/src/review/presentation/actionDialog/getActionDialogCopy.test.ts`

**Interfaces:**
- Produces: `confirmVariant: "primary" | "destructive"` on the action dialog copy and view model.

- [ ] **Step 1: Write the failing test**: `reject` and `cancel` copy have `confirmVariant: "destructive"`; `approve`, `start`, `takeOver`, `reassign`, `restart` have `"primary"`.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/review/presentation/actionDialog/getActionDialogCopy.test.ts 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement**:
  - the copy field;
  - in `ReviewActionDialog`, render `<Button variant={vm.confirmVariant} …>` in place of `Dialog.ConfirmAction` (admin-ui `ConfirmAction` forces `primary`; do not change admin-ui);
  - `variant="ghost"` on both "More actions" `IconButton`s;
  - `modal={true}`, `headerSeparator={true}`, `footerSeparator={true}` on the Review details `Drawer`.
- [ ] **Step 4: Run** the copy test, then `yarn test packages/app-workflows/src/review/presentation/actionDialog 2>&1 | tail -30`. Expected: PASS.
- [ ] **Step 5: Commit** `fix(app-workflows): use ghost more buttons, destructive confirms and a modal details drawer`.

### Task 8: Cheap batch B: hints below the field (C8)

**Files:**
- Modify: `packages/app-workflows/src/review/presentation/actionDialog/components/ReviewActionDialog.tsx:69`
- Modify: `packages/app-workflows/src/review/presentation/reviewerPicker/components/ReviewerPicker.tsx:35`
- Modify: `packages/app-workflows/src/components/picker/WorkflowPicker.tsx:114` and `WorkflowMultiPicker.tsx:95`
- Modify: the step-form renderers that pass a hint: `editor/presentation/stepForm/renderers/TeamsPickerRenderer.tsx:49,72`, `FolderPickerRenderer.tsx:22`, `TransportCheckboxesRenderer.tsx:81`, `AiModelPickerRenderer.tsx:26`, `routingRules/RuleFields.tsx:138`, and any other renderer under `editor/presentation/stepForm/renderers/` that passes `description=` to an admin-ui form control.

**Interfaces:**
- Produces: `WorkflowPicker` and `WorkflowMultiPicker` take `note?: React.ReactNode` instead of `description?`; callers updated. `workflowPickerStub.tsx` (`editor/testing/`) renders `data-note`.

Rule: a hint under a form control uses the admin-ui `note` prop (rendered below the control); `description` (rendered above) is not used for hints. EmptyState, Widget and permission `description` props are not form hints and stay.

- [ ] **Step 1: Implement** the prop moves. Update tests that assert `data-description` on the picker stub to `data-note`.
- [ ] **Step 2: Run** `yarn test packages/app-workflows/src/editor/presentation/stepForm 2>&1 | tail -30`, then `yarn test packages/app-workflows/src/review/presentation/actionDialog 2>&1 | tail -30`, then `yarn test packages/app-workflows/src/review/presentation/reviewerPicker 2>&1 | tail -30`. Expected: PASS.
- [ ] **Step 3: Commit** `fix(app-workflows): show form hints below their fields`.

### Task 9: Model delete blocked by a workflow (N1, UI-18, QBZ-38)

**Part A: base `@webiny/app-headless-cms` (needs the user's approval first)**

**Files:**
- Modify: `packages/app-headless-cms/src/features/model/deleteModel/DeleteModelGateway.ts:45-49`
- Modify: `packages/app-headless-cms/src/presentation/contentModels/components/fullDelete/FullyDeleteModelDialog.tsx:51-56`
- Create: `packages/app-headless-cms/src/presentation/contentModels/components/fullDelete/dialog/FullyDeleteModelError.tsx`
- Modify: `packages/app-headless-cms/src/presentation/contentModels/components/fullDelete/dialog/Confirmation.tsx:30-50`
- Test: `packages/app-headless-cms/src/features/model/deleteModel/DeleteModelGateway.test.ts` (create; follow `features/contentEntry/deleteEntry/DeleteEntryGateway.test.ts`)

**Interfaces:**
- Produces: the gateway throws `GraphQLOperationError` (`@webiny/app/errors/GraphQLOperationError.js`) with the server `message`, `code` and `data`.
- Produces: `FullyDeleteModelError` — `makeDecoratable("FullyDeleteModelError", (props: FullyDeleteModelErrorProps) => …)`, props `{ model: CmsModel; error: CmsErrorResponse }`, base render = today's danger Alert with `error.message`.

- [ ] **Step 1: Write the failing gateway test**: an envelope `{ data: null, error: { message: "m", code: "Workflows/Model/BoundToWorkflow", data: { modelId: "article", workflows: [{ id: "wf1", name: "Article review" }] } } }` makes `execute` reject with a `GraphQLOperationError` carrying that `code` and `data`.
- [ ] **Step 2: Run** `yarn test packages/app-headless-cms/src/features/model/deleteModel/DeleteModelGateway.test.ts 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement**: throw the typed error; in the dialog's catch keep `code: ex.code ?? "FULLY_DELETE_MODEL_ERROR"` and `data: ex.data ?? {}`; render the error through `FullyDeleteModelError`; when an error is shown, `Confirmation` drops the "Are you sure…" line, the "If yes, please write…" line and the input, and shows only the error (QBZ-38, also better for every other final error). The error-state button reads "Close" instead of "OK".
- [ ] **Step 4: Run** the gateway test. Expected: PASS.
- [ ] **Step 5: Commit** `feat(app-headless-cms): keep the model delete error code and make its message decoratable`.

**Part B: `@webiny/app-headless-cms-workflows`**

**Files:**
- Create: `packages/app-headless-cms-workflows/src/Components/ModelDelete/ModelDeleteWorkflowError.tsx`
- Create: `packages/app-headless-cms-workflows/src/Components/ModelDelete/getModelDeleteWorkflowCopy.ts`
- Modify: `packages/app-headless-cms-workflows/src/index.tsx` (mount the decorator next to the other CMS decorators)
- Test: `packages/app-headless-cms-workflows/src/Components/ModelDelete/getModelDeleteWorkflowCopy.test.ts` (create)

**Interfaces:**
- Consumes: `FullyDeleteModelError` from Part A; `useWorkflowsPermission` (`@webiny/app-workflows/presentation/permissions/useWorkflowsPermission.js`, `editor` flag); `Routes.ContentModels.Workflows`.
- Produces: `getModelDeleteWorkflowCopy(params: ModelDeleteWorkflowCopyParams): ModelDeleteWorkflowCopy` with params `{ modelName: string; workflowName: string; canManage: boolean }` and result `{ title: string; body: string; showLink: boolean }`.

- [ ] **Step 1: Write the failing tests:**
  - `canManage: true` → title `Article has a workflow`, body `Delete the workflow “Article review” first, then delete the model.`, `showLink: true`.
  - `canManage: false` → body `Ask someone with Manage workflows to delete the workflow “Article review” first, then delete the model.`, `showLink: false`.
- [ ] **Step 2: Run** `yarn test packages/app-headless-cms-workflows/src/Components/ModelDelete/getModelDeleteWorkflowCopy.test.ts 2>&1 | tail -30`. Expected: FAIL.
- [ ] **Step 3: Implement** the copy function, then the decorator: when `error.code === "Workflows/Model/BoundToWorkflow"`, render the design box (danger Alert with the `account_tree` icon, bold title, body, and an "Open workflow →" link to `Routes.ContentModels.Workflows` when `showLink`); the model name is `model.name`, the workflow name is `error.data.workflows[0].name` (a model has one workflow). Any other error renders `<Original {...props} />`.
- [ ] **Step 4: Run** the copy test. Expected: PASS.
- [ ] **Step 5: Commit** `feat(app-headless-cms-workflows): explain a model delete blocked by its workflow`.

---

## Not in this plan

The findings' M and L items: the shared styling causes C1 (tag tints and borders, admin-ui Tag variants), C2, C4, C6, C7, C9 (model prefix persisted in review titles), C11, the WB full-width bar (RB1), the request dialog layout (RQ*), the drawer header and timeline (RD1 header part, RD2, RD3), the Content Reviews list and menu (L*), the editor items (E*), the exclusions page (S*), G1 (Developer mode remove review request) and G2 (popover on hover). They need a separate plan, and several need a decision about admin-ui defaults.
