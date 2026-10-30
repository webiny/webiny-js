# Design-compare fixes, Part A report (items 1 to 11)

Tests run from the repo root, one path at a time: `yarn test <path> 2>&1 | tail`.

| # | Change | Commit | Test (RED then GREEN) |
|---|--------|--------|-----------------------|
| 1 | Removed the per-app `description` on `Widget` in `ReviewWidgetCard`. The row's `(app)` suffix stays (the design's `{step} · {type} ({app})`). | app-workflows `fe2f101ad6` | `ReviewWidgets.test.tsx`: no "Headless CMS" / "Website Builder" subtitle. Run: `yarn test packages/app-workflows/src/review/presentation/reviewWidget` (4 RED, then 29 passed). |
| 2 | `ReviewWidgetPresenter.vm` slices the rows to `REVIEW_WIDGET_PAGE_SIZE` (5). | `fe2f101ad6` | `ReviewWidgetPresenter.test.ts` "shows at most five rows" (7 items, 5 rows). |
| 3 | `resolveRowBinding` now asks the binding for the content type label even without a model id; the WB adapter's `getContentTypeLabel` returns "Pages". | WB `b1fccb50ee`, app-workflows `fe2f101ad6` | Presenter test "model id gives the binding's label"; `WbReviewContentAdapter.test.tsx` expects "Pages". Runs: reviewWidget folder, `.../WbReviewContentAdapter`, `.../reviewList` (105 passed). |
| 4 | No code change needed: `StepCard` already passes `draggable` and `dragHandleRef`, and admin-ui renders the handle (hover only, no prop to keep it visible). Added a test that the "Drag handle" icon sits inside the element given to `handleRef`. Hover-only noted under "Needs a design-system component". | `f9e89dd467` | `StepCard.test.tsx` (29 passed). It passed at once, so there is no RED. |
| 5 | Not done: nothing in `app-workflows/src/editor` sets `max-w-2xl` or `mx-auto` any more. The flow wrapper is `w-full` inside `grow overflow-y-auto p-lg`. | n/a | n/a |
| 6 | Header: title row `data-role="title-row"` with `min-w-0`; the `grow` that pushed the Unsaved tag away is gone, so the tag sits next to the title. The title wrapper uses `-ml-sm-extra` to cancel `EditableTitle`'s own ~12px padding (the empty-name placeholder gets `px-sm-extra`). The role=button wrapper also handles `onClick`, so a single click anywhere on the trigger starts editing. | `f9e89dd467` | `EditorHeader.test.tsx` (17 passed): title-row contains title and tag, not the actions; real `userEvent` click keeps the input open (passed before, so no RED); wrapper click opens the input. |
| 7 | `getStepTypeOptions` orders People, Automation, AI; unknown types follow. | `f9e89dd467` | `getStepTypeOptions.test.ts` and `WorkflowEditorPresenter.flow.test.ts` (2 RED, then passed). |
| 8 | `NoWorkflowState`: `Create workflow` has the `add.svg` icon. | `f9e89dd467` | `EditorStates.test.tsx` icon test (RED with the old file, GREEN now). |
| 9 | Model rows show "N steps" or "No workflow". The server had no step count, so: api-headless-cms-workflows `stepCount` on `CmsEntryWorkflowModelWorkflow` (use case and schema); CMS app query selects it; WB query selects `steps { id }` and the gateway counts them; app-workflows DTO, domain type, mapper, `buildModelRowVms`, and `bindWorkflow` (after open, save, reload) carry `stepCount`. The open model still shows its draft's live count. | api `98a34a6475`, CMS app `1a0653772a`, WB `2c7cb8f3c2`, app-workflows `f9e89dd467` | `listWorkflowModels.test.ts` (RED, then 11 passed), `cmsWorkflowsSchema.test.ts` (28 passed), `buildModelRowVms.test.ts`, gateway tests in app-headless-cms-workflows and app-website-builder-workflows (35 / 33 passed). |
| 10a | Transport label "E-mail" (the title comes from the API, `MailNotificationTransport`). | api-workflows `41010ea294` | `MailNotificationTransport.test.ts` RED, then 19 passed; `ListWorkflowNotificationTransports.test.ts`, `workflowsSchema.test.ts` updated and passed. |
| 10b | "Changes content" `Tag` uses `variant="warning"`. | `f9e89dd467` | `AiToolsRenderer.test.tsx` compares with a reference warning `Tag` (RED, then 14 passed). |
| 11 | `Test routing` is enabled unless running. Click without a requester sets an "attempted" flag and shows "Choose a requester to test." as the requester picker's `error` (`WorkflowPicker` validation); it does not run. The static hint note is gone (`vm.hint` is still produced by the presenter). | `f9e89dd467` | `TestRoutingRenderer.test.tsx` (2 RED, then 23 passed); `StepDrawer.people.test.tsx` updated. |

Docs: "Needs a design-system component" gained `EditableTitle` padding and the `Accordion` drag handle visibility.

## Final runs

- `yarn test packages/app-workflows/src/editor`: 138 files, 1512 tests passed after the `StepDrawer.people.test.tsx` fix (folder `stepDrawer` re-run: 218 passed).
- `yarn test packages/app-workflows/src/review/presentation/reviewWidget`: 29 passed; `.../src/review`: 1131 passed.
- `yarn test packages/app-website-builder-workflows`: 330 passed. `yarn test packages/app-headless-cms-workflows`: 343 passed.
- api tests: see the table.
- `yarn lint` (no findings) and `yarn format:check` ("All matched files use the correct format") passed.

## Not done

- Item 5: nothing to change (no cap in the code).
- Item 4: no code change; the handle is admin-ui hover-only.

# Part B report (items 12 to 18) and corrections

| # | Change | Test |
|---|--------|------|
| C1 (item 5) | `WorkflowFlow` root (steps, Add step, empty state) is the centred column `mx-auto w-full max-w-2xl`, hook `data-role="flow-column"`. | `WorkflowFlow.test.tsx` column test (RED without the change, then 21 passed). |
| C2 | Reverted `-ml-sm-extra` in `EditorHeader`; the 12px offset stays under "Needs a design-system component". | `EditorHeader` tests unchanged. |
| 12 | The state tag already sat inline with the message in a wrapping row. The lock text moved out of the meta row onto its own line below it. | `ReviewBar.test.tsx` lock-below-meta test. |
| 13 | Popover rows no longer show the step description. The trigger wrapper now holds the `ProgressBar` (new `bar` prop) and the count button, full width, `align="start"`. Focus handling unchanged. | `ReviewBar.test.tsx` and `ReviewStepsPopover.test.tsx` (wrapper holds bar and button; no description). |
| 14 | Issue title order: severity `Tag`, field, then the text. | `ReviewDetailsDrawer.test.tsx` order. |
| 15 | The "Current step" tag content is a `Text size="sm"`. `Tag` has no size prop, so this is as far as admin-ui allows. | `ReviewListView.test.tsx` hook test (structure only). |
| 16 | Not done: `EmptyState` has no icon prop. Listed under "Needs a design-system component". | n/a |
| 17 | Rules were already in a `Card` (test exists). Visible "Filter by user" label removed (`label=""`); accessible name moved to a wrapping `role="group"`. Filter is `w-2xs shrink-0`, with the tabs next to it. | `ExclusionsPage.test.tsx`. |
| 18 | The alert already has symmetric `mx-md`. The wrapper `max-w-screen` is now `w-full min-w-0`. | Class-only change, no testable hook (existing test passes). |

Docs: "Needs a design-system component" gained `EmptyState` icon, `Tag` size and `AutoComplete` label.
