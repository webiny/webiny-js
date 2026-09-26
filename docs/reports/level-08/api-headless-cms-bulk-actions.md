# @webiny/api-headless-cms-bulk-actions

> Level 8 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/api-headless-cms-bulk-actions` adds bulk `publish`/`unpublish`/`delete` (permanent)/`moveToTrash`/`moveToFolder`/`restore` GraphQL mutations for content entries, plus a scheduled "empty trash bin" maintenance task, all built on `@webiny/background-tasks`'s list-then-process task pattern (a "list" task paginates matching entries and fans out batches to "process" sub-tasks, which are themselves polled to completion before the list task moves on). Each bulk-action implementation correctly reuses the real, single-entry `api-headless-cms` use case (`PublishEntryUseCase`, `DeleteEntryUseCase`, `MoveEntryUseCase`, etc.) rather than reimplementing entry mutation logic, which is good design. However, the audit found a confirmed security issue in how (and whether) permissions are enforced for these bulk operations — see Bugs. Failed per-entry operations are recorded and reported back (`done`/`failed` id lists) rather than aborting the whole batch, which is a reasonable partial-failure design, but one real correctness bug was found in continuation/child-task bookkeeping (see Bugs). Two internal GraphQL-schema-builder modules (`createBulkActionGraphQL.ts`, `createDefaultGraphQL.ts`) are entirely dead code, superseded by `BulkActionsGraphQLSchema.ts`.

## Public API

- `HcmsBulkActionsFeature` (`src/HcmsBulkActionsFeature.ts:20`) — the DI feature that registers all six bulk-action implementations, the two background-task definitions (`BulkActionListTaskDefinition`/`BulkActionProcessTaskDefinition`), the `EmptyTrashBinTaskDefinition`, and `BulkActionsGraphQLSchema`. This is the package's sole real entry point, consumed by whatever project composition registers Headless CMS features (not traced further; out of scope per cost rules).
- `EntriesBulkAction` abstraction (`src/features/EntriesBulkAction/abstractions.ts`) — the `loadData`/`processData` interface each of the six bulk-action classes implements; resolved via `container.resolveAll(EntriesBulkAction)` in `createBulkActionTasks.ts` and `BulkActionsGraphQLSchema.ts`.
- `BulkActionsGraphQLSchema` (`src/graphql/BulkActionsGraphQLSchema.ts:133`) — the actually-registered `CmsGraphQLSchemaFactory` implementation that builds the `bulkAction<Model>` mutations. `createBulkActionGraphQL`/`registerDefaultBulkActionGraphQL` (`src/graphql/createBulkActionGraphQL.ts`, `src/graphql/createDefaultGraphQL.ts`) implement an alternative/older schema-building approach but are never called from `HcmsBulkActionsFeature.ts` or anywhere else in the repo — codegraph/grep: no consumers besides their own `dist/*.d.ts`.
- `PublishEntriesBulkAction`/`UnpublishEntriesBulkAction`/`DeleteEntriesBulkAction`/`MoveToTrashBulkAction`/`MoveToFolderBulkAction`/`RestoreEntriesBulkAction` — one `EntriesBulkAction.Interface` implementation per action, each wired through its own `feature.ts`; only consumed internally by this package's task/GraphQL wiring.

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `packages/api-headless-cms-bulk-actions/src/graphql/BulkActionsGraphQLSchema.ts` | Security finding SEC-40 — see private notes. | — | high |
| 2 | medium | `packages/api-headless-cms-bulk-actions/src/features/EntriesBulkAction/internals/ChildTasksCleanup.ts:42-63` | When a bulk action's child (process) tasks all have zero logs, `deleteTasks(tasksCrud, childTaskIdList)` is called, but execution then falls through into the loop that builds `deletedChildTaskLogIdList` from `childLogs` (empty in this branch) and calls `deleteTasks` again with that empty list. The second call is a harmless no-op today, but the control flow has no early `return` after the first branch, so any future edit to the loop below risks accidentally re-processing/re-deleting the same `childTaskIdList` a second time via a different (and differently-scoped) variable that happens to share a similar name. | Currently benign (second `deleteTasks` call is always a no-op when `childLogs.length === 0`), but the missing `return` is a latent bug: a maintenance edit to the code below the first branch (e.g. widening what `deletedChildTaskLogIdList` collects) would silently start operating on tasks already deleted in the first branch. | low |

## Duplication

jscpd reports zero clones within `api-headless-cms-bulk-actions` (all files scanned show `clones: 0`). The six bulk-action classes (`PublishEntriesBulkAction.ts`, `UnpublishEntriesBulkAction.ts`, `DeleteEntriesBulkAction.ts`, `MoveToTrashBulkAction.ts`, `MoveToFolderBulkAction.ts`, `RestoreEntriesBulkAction.ts`) are structurally near-identical (same `loadData`/`processData` shape, same `parseIdentifier` call) but jscpd's token threshold does not flag them as clones since each delegates to a different use case; this is acceptable, intentional repetition for a small, stable interface rather than something worth abstracting further.

## Dead code

- `createBulkActionGraphQL` (`src/graphql/createBulkActionGraphQL.ts:16`) and `registerDefaultBulkActionGraphQL` (`src/graphql/createDefaultGraphQL.ts:18`) — grep across the whole monorepo shows no importer of either export outside their own compiled `.d.ts` files. `BulkActionsGraphQLSchema.ts` is the only schema-builder actually registered by `HcmsBulkActionsFeature.ts`. Both files (and `createDefaultGraphQL.ts` in full) can likely be deleted.

## Convention issues

- `packages/api-headless-cms-bulk-actions/package.json` lists `@webiny/api-core` only under `devDependencies`, yet `src/tasks/EmptyTrashBinTask.ts`, `src/features/EntriesBulkAction/createBulkActionTasks.ts`, `src/features/EntriesBulkAction/internals/TaskCache.ts`, and all three `src/graphql/*.ts` files import directly from `@webiny/api-core/features/...` in runtime (non-test) source. Per the project's dependency-configuration conventions this should be a `dependencies` entry, not `devDependencies` — `yarn adio` would be expected to flag this.
- Minor DI/naming nit: `ChildTasksCleanup.deletedChildTaskLogIdList` (`internals/ChildTasksCleanup.ts:46`) actually holds task ids (`log.task`), not log ids — the name is misleading, though not incorrect (see Bugs #2 for the associated control-flow risk).

## Test gaps

- No test exercises or verifies authorization/permissions for any bulk action. `__tests__/tasks/createBulkAction.test.ts` (134 lines, the package's only test file) contains no reference to `identity`, `permission`, or `security` at all. Given the security finding above, this is the most consequential gap: there is no regression test that would catch a user without entry permissions successfully triggering (or having executed) a bulk action.
- No test covers the `EmptyTrashBinTask` retention-based cleanup, `ChildTasksCleanup`, or the multi-tenant (`withEachTenant`) fan-out path.
- No test exercises the `MAX_TASK_LIST_LENGTH`/pagination-continuation logic in `CreateTasksByModel` beyond the single happy path implied by the one existing test file (not fully verified beyond a scan of its size/name — kept within cost budget).

## Recommendations

1. Add a permission/access-control check to the `bulkAction<Model>` resolver in `BulkActionsGraphQLSchema.ts` before triggering the task, and ensure bulk-action task processing enforces the triggering identity's real per-entry permissions (either by not disabling authorization for this task type in `background-tasks`, or by having `ProcessTask`/each bulk action re-check `accessControl.canAccessEntry` explicitly using the `identity` already threaded through the task input). This is the critical fix — see private security notes for full detail.
2. Delete the dead `createBulkActionGraphQL.ts`/`createDefaultGraphQL.ts` files (and `registerDefaultBulkActionGraphQL`), since `BulkActionsGraphQLSchema.ts` is the only path actually wired up.
3. Move `@webiny/api-core` from `devDependencies` to `dependencies` in `package.json`, and add a test asserting that a low-privilege/scoped identity cannot bulk-modify entries outside its permission scope.
