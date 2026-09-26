# @webiny/app-headless-cms-workflows

> Level 7 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/app-headless-cms-workflows` is a small (~1k lines, no tests) glue package that wires `@webiny/app-workflows`'s generic review-workflow UI into `@webiny/app-headless-cms`'s content-entry admin screens: it decorates `ContentEntryFormPresenter` so Save/Publish are disabled while a review is pending, decorates the content-entries table so rows pending review aren't bulk-selectable, adds GraphQL field-selection plugins so entry lists/details carry the current workflow status, and registers the "Content Reviews" sidebar item, the workflows editor route, and a few entry-form menu actions (schedule, tooltip, create-new-revision, open-in-new-window). It correctly disables Save/Publish/Schedule for the specific revision a review targets, and one security finding is tracked privately (SEC-39). Health is otherwise fine for what is essentially a thin decorator layer, but there are zero automated tests anywhere in the package.

## Public API

This package has no npm-level "public API" beyond its default export: `CmsWorkflows` (`src/index.tsx:16`), a single component apps mount once at bootstrap (consumed the same way `app-website-builder-workflows`'s equivalent component is, per its sibling package) that conditionally registers everything behind the `advancedPublishingWorkflow` feature flag. Internally it registers, via DI `feature.ts` files: `ContentEntryFormPresenterWorkflowDecorator` and `TableRowMapperWorkflowDecorator` (decorate `@webiny/app-headless-cms` presenters), `WorkflowStateListEntriesFieldSelection`/`WorkflowStateGetEntryFieldSelection` (extend the GraphQL selection sets `@webiny/app-headless-cms` uses for entry list/detail queries), and `WorkflowStateCacheHandler` (keeps the entries list cache's `meta.system.workflow` in sync when a `WorkflowStateChangedEvent` fires, mirroring the pattern already flagged as buggy for the dashboard widget in `@webiny/app-workflows`, level 4). None of this is meant to be imported by other packages beyond `CmsWorkflows` itself.

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|----------|----------------------|---------|-------------------|------------|
| 1 | high | `packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryFormCreateNewRevisionButton.tsx` | Security finding SEC-39 — see private notes. | — | high |
| 2 | low | `src/Components/OptionItem/OpenInNewWindow.tsx:14-23` | The "Open in New Window" menu item always links with `folderId: "root"` (line 22, with a `// TODO figure out how to load folderId` comment on the line above), regardless of the entry's actual folder. | Clicking "Open in New Window" on a workflow state row for an entry that lives in a non-root folder opens a URL built against the wrong folder context; depending on how `@webiny/app-headless-cms`'s folder-aware entry list resolves `folderId`/`id` mismatches, this can render an empty/"not found" list view instead of the target entry. | high |

## Duplication

- `src/presentation/WorkflowStateGetEntryFieldSelection.ts` and `src/presentation/WorkflowStateListEntriesFieldSelection.ts` both hard-code the exact same multi-line GraphQL selection string (the `meta { system { workflow { workflowId stepId stepName state } } }` fragment) — one for the single-entry query, one for the list query. jscpd's 0-clone result for this package is a token-length artifact (each string is short), but the two are byte-for-byte identical; a shared constant would prevent the two selections silently drifting apart if the workflow fields are ever renamed.

## Dead code

None found — every exported feature/decorator/component is registered from `src/index.tsx`'s `CmsWorkflows` and every DI `feature.ts` is referenced there or from another `feature.ts` in the same package.

## Convention issues

None of note — the package follows the repo's DI/decorator/feature-file conventions consistently (one decorator or presenter per file, `feature.ts` per concern, minimal barrel export via `CmsWorkflows`).

## Test gaps

There are no test files anywhere in this package (confirmed: no `*.test.*` under `packages/app-headless-cms-workflows`). Nothing exercises `ContentEntryFormPresenterWorkflowDecorator`'s `canSave`/`canPublish` gating, `TableRowMapperWorkflowDecorator`'s row-selectability logic, or `WorkflowStateCacheHandler`'s cache update — all three are the mechanisms this audit had to read line-by-line to determine whether workflow gating actually holds, and none of them have a regression test that would catch the Create-New-Revision gap (Bug #1) or a similar future regression in the other gated actions.

## Recommendations

1. Address security finding SEC-39 (see private notes).
2. Add tests for `ContentEntryFormPresenterWorkflowDecorator.vm` (`canSave`/`canPublish` under `hasState`/`hasWorkflow`/`isApproved` combinations) and for `TableRowMapperWorkflowDecorator.fromEntry`, since these are the package's only enforcement points for hiding actions during an active review.
3. Fix `OpenInNewWindow.tsx`'s hard-coded `folderId: "root"` so links resolve for entries outside the root folder.
