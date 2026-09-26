# @webiny/app-website-builder-scheduler

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/app-website-builder-scheduler` is a small admin-UI glue package (9 source files, no tests) that adds "Schedule publish/unpublish" entry points for Website Builder pages and redirects by composing `@webiny/app-scheduler`'s generic dialog/list components: a page-list options-menu item, a page-list sidebar "Schedule" button, a page-editor top-bar menu item, and a redirect-list options-menu item, each gated by a local `usePermissions()` wrapper around `@webiny/app-website-builder`'s own `canPublish`/`canUnpublish`/`canEdit`. It renders no `DateTimePicker` of its own — every "Schedule On" dialog is `@webiny/app-scheduler`'s `useScheduleDialog`/`Scheduler`, so the confirmed timezone bug documented in that package's level-6/7 reports (a local wall-clock pick sent to the server mislabeled as UTC) applies unchanged to every page and redirect scheduling action here, with no `dateTimeLocal`-mode override or local date-handling code in this package to check separately. Code quality is otherwise solid and conventional, but coverage is zero.

## Public API
- `WbScheduler` (`src/index.tsx`) — the package's sole top-level export, composing all four config components; codegraph confirms it is rendered by the project's `App` composition root (the standard `packages/webiny`-generated admin app entry point) as its one real external consumer.
- Internal-only (not exported from the package root, consumed only within `WbScheduler`): `PageEditorScheduleConfig`/`PageEditorScheduleMenuItem`, `PagesConfig`/`PageMenuItem`, `PagesSidebarConfig`/`SchedulerButton`, `RedirectsConfig`/`RedirectMenuItem`, and the `usePermissions` hook.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | low | `src/components/editor/PageEditorScheduleMenuItem.tsx:14,32` | `status` is computed as `(state.status || "draft") as string` (line 14), so it is always a non-empty string; it is then passed straight into `disabled={!status}` (line 32) on the "Schedule" dropdown item. `!status` can never be true once `status` has gone through the `|| "draft"` fallback, so the `disabled` prop is dead logic. | The page editor's "Schedule" menu item is never disabled by this check regardless of document state (e.g. an unsaved/new document with no real status) — if the intent was to gate scheduling on some document precondition, that gate silently never fires. No crash or data-loss results; it is a no-op guard. | high |

## Duplication
No clones reported by jscpd for this package (0 duplicates). Manually, `PageMenuItem.tsx` and `RedirectMenuItem.tsx` follow the identical shape (resolve target from list config → `usePermissions()` → `useScheduleDialog({ namespace, target })` → gate on permission → render `OptionsMenuItem`), differing only in the target type and namespace constant; this is below jscpd's detection threshold but is the same "one skeleton, four copies" pattern noted in `@webiny/app-scheduler`'s own report for its consumers. Not a package-owned utility being reimplemented — the package correctly delegates all scheduling UI/state to `@webiny/app-scheduler` rather than reimplementing any of it, which is the important comparison point against the CMS counterpart (`@webiny/app-headless-cms-scheduler`, which uses the same `useScheduleDialog`/`Scheduler` composition per `app-scheduler`'s report).

## Dead code
None found — `WbScheduler` and all four config components have a confirmed render path (codegraph: `App → WbScheduler → {PageEditorScheduleConfig, PagesConfig, PagesSidebarConfig, RedirectsConfig}`), and `usePermissions` is used by three of the four leaf components.

## Convention issues
None found — one component per file, DI-free simple hook/component composition (no MVP/presenter machinery needed at this size), and the barrel (`src/components/index.ts`) exports only what `index.tsx` needs.

## Test gaps
The package has no `__tests__` directory at all. Nothing is tested: the four permission-gated menu/button components, `usePermissions`'s mapping of `canPublish("page")`/`canUnpublish("page")`/`canEdit("redirect")`, or the namespace constants that must stay in lockstep with the backend's own `createNamespace()` output in `@webiny/api-website-builder-scheduler`.

## Recommendations
1. Add a test (or at least a type-level/runtime assertion) that keeps `WB_PAGE_NAMESPACE`/`WB_REDIRECT_NAMESPACE` in `src/utils/namespace.ts` in sync with the backend's `createNamespace()` output in `@webiny/api-website-builder-scheduler`, since the comment on those constants already flags this as a manual, easy-to-break contract.
2. Fix or remove the dead `disabled={!status}` guard in `PageEditorScheduleMenuItem.tsx`, replacing it with a real precondition (e.g. gating on `state.id` being defined) if one was intended.
3. Add basic render/permission-gating tests for the four menu/button components, given the package currently has zero automated coverage.
