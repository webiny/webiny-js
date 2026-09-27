# @webiny/api-headless-cms-tasks

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-headless-cms-tasks` is the package that turns "delete a content model" into a resumable `@webiny/background-tasks` job: a GraphQL API (`fullyDeleteModel`/`cancelFullyDeleteModel`/`getDeleteModelProgress`) that triggers/aborts/polls a `DELETE_MODEL_TASK`, the task body itself (`DeleteModel`), and a `DisableModel` feature that blocks entry/model mutations while a model is mid-deletion. It also wires in `@webiny/api-headless-cms-bulk-actions`' `HcmsBulkActionsFeature` (see security finding SEC-40 in that package's level-8 report and private notes). Every one of this package's three GraphQL operations calls `assertModelDeletable()`, which checks `canAccessModel({ rwd: "d" })` and `canAccessEntry({ rwd: "w" })` before touching the task system.

## Public API
- `HcmsTasksFeature` (`src/HcmsTasksFeature.ts:8`) — the package's DI feature; registers `HcmsBulkActionsFeature`, `DeleteModelTaskFeature`, `DeleteModelOperationsImplementation`, `DisableModelFeature`, and the delete-model GraphQL schema factory. Sole production consumer: `packages/api-event-handler-core/src/registerApiRequestStack.ts`.
- `fullyDeleteModel`/`cancelDeleteModel`/`getDeleteModelProgress` (`src/graphql/deleteModel/*.ts`) — the three operations behind the `fullyDeleteModel`/`cancelFullyDeleteModel`/`getDeleteModelProgress` GraphQL mutation/queries, each wrapped by `DeleteModelOperationsImpl` and reached only through the `DeleteModelGraphQLSchemaFactory` (`src/graphql/deleteModel/index.ts`), which also zod-validates all inputs (including a `confirmation` string check via `validateConfirmation`) before invoking them.
- `assertModelDeletable` (`src/graphql/deleteModel/assertModelDeletable.ts:14`) — the shared pre-trigger authorization check; used by all three delete-model operations above (its own comment notes it replaced three inline copies of the same pair of checks).
- `DeleteModel` (`src/features/DeleteModelTask/DeleteModel.ts:24`) — the actual `TaskDefinition` run body: paginates and permanently deletes all entries of a model (`DeleteEntryUseCase` with `permanently: true, force: true`), then deletes the model's `cms:<modelId>` folders via `api-aco`'s `DeleteFolderUseCase`, then deletes the model itself via `DeleteModelUseCase`. Runs with authorization disabled (standard for background-tasks), which is safe here because the trigger point already authorized the whole operation.
- `BlockActionIfModelDisabled` (`src/features/DisableModel/*`) — an event-handler-driven guard registered against 8 content-entry/model lifecycle events (create, revision-create, update, publish/unpublish/republish, restore-from-bin, move, model-update, model-create-from) that rejects the action with a `WebinyError` while the model's `DeleteModelOperations.isModelBeingDeleted()` returns true; consumed only via `DisableModelFeature`'s registration.

## Bugs
None found.

## Duplication
jscpd reports two small clones (20 duplicated lines total, ~2.3% of tokens) between `fullyDeleteModel.ts`/`getDeleteModelProgress.ts` and `cancelDeleteModel.ts`/`getDeleteModelProgress.ts` — the repeated "fetch model, handle not-found, call `assertModelDeletable`" preamble. This is minor and already partially deduplicated (the shared checks were previously inline in all three files and were extracted into `assertModelDeletable`, per that file's own comment); pulling the remaining model-fetch preamble into a small shared helper would remove the rest.

## Dead code
None found — every exported feature/class traced above has a live production consumer.

## Convention issues
None meaningful. DI naming is consistent (`BlockActionIfModelDisabledImpl` implements `BlockActionIfModelDisabled.Interface`, one handler class per file for the 8 `DisableModel/handlers/*` files), and the barrel (`src/index.ts`) only exports the top-level feature.

## Test gaps
`__tests__/tasks/deleteModel/graphql/crud.test.ts` only covers the happy path (listing models being deleted, starting a delete) — there is no test that calls `fullyDeleteModel`, `cancelFullyDeleteModel`, or `getDeleteModelProgress` as a caller lacking `canAccessModel`/`canAccessEntry` permissions to confirm `assertModelDeletable` actually rejects them, which is exactly the property this focus area needed verified. There is also no test for the `DisableModel` handlers (e.g. confirming an entry create/update/restore is actually blocked while a model is mid-deletion) beyond what's implied by the CRUD test.

## Recommendations
1. Add a permission-denial test for each of `fullyDeleteModel`/`cancelFullyDeleteModel`/`getDeleteModelProgress` (caller without model-delete/entry-write access should get a `NotAuthorizedError`); these checks currently have no regression coverage.
2. Add at least one test per `DisableModel` handler (or a parametrized test over all 8 blocked events) confirming the action is rejected while `isModelBeingDeleted()` is true.
3. No production code changes needed in this package.
