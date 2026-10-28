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
