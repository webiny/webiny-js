# @webiny/app-website-builder-workflows

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/app-website-builder-workflows` is the Admin UI integration for content-review workflows on Website Builder pages: it decorates the page editor's top bar with a workflow status bar/tooltip and hides/shows the Publish button and autosave based on the page's `WorkflowState` view-model, adds GraphQL field selections so `system.workflow` is fetched on page get/list, registers a dedicated "Workflows" admin route/menu (reusing `@webiny/app-workflows`' generic `WorkflowsEditor`/`WorkflowStateListAppOverlay` components for a single "Pages" app), and hides the pages-list "select" checkbox / "Change Status" bulk action for pages currently under an unapproved review. All of this is client-side UX only — the real authorization boundary is `@webiny/api-website-builder-workflows`' before-publish handler, and security finding SEC-39 applies to it (see private notes), so these UI guards are not a security boundary. The package itself is small, consistently structured, and has one confirmed duplication bug; it has zero automated tests.

## Public API
- `WebsiteBuilderWorkflows` (`src/index.tsx:8`) — the package's only export. License-gated on `advancedPublishingWorkflow`; when enabled it registers `PageListWorkflowsFeature`/`PageGetWorkflowsFeature` (DI features adding the `system.workflow` GraphQL selection and a `TableRowMapper` decorator) and renders `WebsiteBuilderWorkflowsMenu`, `PageEditorConfig`, `PagesList`, and `ListOpenInNewWindow`. Confirmed external consumer: `packages/app-serverless-cms/src/Admin.tsx`, which mounts it as part of the assembled admin app.
- Internal-only pieces consumed within the package: `Components/PageEditor/*` (top-bar/layout/autosave/publish-button/tooltip decorators around `@webiny/app-website-builder`'s `PageEditorConfig.Ui`), `Components/PagesList/*` (sidebar "Content Reviews" button and `changeStatus`/select-checkbox guards around `PageListConfig`), `Components/PageWorkflows/PageWorkflowsEditorView.tsx` (the admin menu/route content, backed by `@webiny/app-workflows`' `Components.Admin.WorkflowsEditor`), `Components/OptionItem/OpenInNewWindow.tsx` (a row-options entry for the content-reviews list overlay), and `hooks/usePage.ts` (decorates `@webiny/app-website-builder`'s `usePage` with the `workflow` field).

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | low | `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorLayout.tsx:9-23` and `packages/app-website-builder-workflows/src/Components/PageEditor/ToggleEditorMode.tsx:6-20` | `PageEditorLayout`'s `ToggleReadonly` and `ToggleEditorMode` are functionally identical components (confirmed by jscpd as a 15-line clone): both read `useWorkflowState().presenter.vm.hasState` and, in a `useEffect`, call `editor.updateEditor(state => { state.isReadOnly = options.isReadOnly \|\| hasState })`. Both are mounted at once — `PageEditorLayout` decorates `Ui.Layout` and `ToggleEditorMode` is rendered directly inside `PageEditorTopBar`'s decorator — and both are wired from the same `PageEditorConfig.tsx`. | Every time `hasState` changes, the editor's `isReadOnly` flag is set twice from two independent effects (harmless today since both compute the same value), and a future edit to one copy that isn't mirrored to the other will silently reintroduce inconsistent editor-readonly behavior between the top bar and the layout. | high |

## Duplication
- The `ToggleReadonly`/`ToggleEditorMode` clone above (jscpd: `PageEditorLayout.tsx:9-23` <-> `ToggleEditorMode.tsx:6-20`, 15 lines).
- The `WB_PAGE_APP = "wb.page"` string literal is defined independently here (`src/constants.ts:1`) and in `@webiny/api-website-builder-workflows/src/utils/appName.ts` — two copy-pasted copies of the same value across the frontend/backend package pair rather than one shared constant; low severity today, drift risk if either is ever renamed.

## Dead code
No dead exports found among the files read. `WebsiteBuilderWorkflows` (the only barrel export) has a confirmed external consumer (`app-serverless-cms/src/Admin.tsx`). All other components/hooks are consumed internally by `WebsiteBuilderWorkflows` or by each other (e.g. `PageEditorConfig` wires `PageEditorTopBar`/`PageEditorLayout`/`PageEditorAutoSave`/the tooltip and publish-button decorators; `PagesList` wires `PagesListContentReviews`/`PageListChangeStatus`); this was not independently re-verified with a codegraph query per file beyond the package's own wiring, given the audit's token budget.

## Convention issues
The package follows the repo's DI/feature and one-component-per-file conventions consistently (small `feature.ts` files registering one field-selection implementation or one decorator each; component decorators each in their own file). The `WB_PAGE_APP` literal duplication noted above is the one meaningful nit — it should be imported from a single shared constant instead of being re-declared in both the frontend and backend workflows packages.

## Test gaps
No `__tests__` directory or `*.test.*` file exists anywhere in this package. There is zero automated coverage for: the top-bar workflow status bar/tooltip/publish-button visibility logic, the editor-readonly toggling (including the duplication bug above), the GraphQL field-selection decorators, the `TableRowMapper` decorator that disables row selection for pages under review, the pages-list "Change Status" guard, or the Workflows admin route/menu. Given that several of these components implement the only UI-side signal that a page is under review, this is a significant gap for a package whose entire purpose is surfacing review state correctly.

## Recommendations
1. UI guards in this package are not a security boundary; see SEC-39 in private notes for the related backend gap.
2. Remove the duplicated `ToggleReadonly`/`ToggleEditorMode` component (bug #1) — keep one and have the other consume it, to avoid future drift between the top bar and layout readonly behavior.
3. Add basic test coverage for the presenter-driven visibility logic (publish button, autosave, row-selection guard) so behavior changes here are caught before shipping; currently nothing in the package is tested.
