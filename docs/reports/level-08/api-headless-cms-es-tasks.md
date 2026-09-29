# @webiny/api-headless-cms-es-tasks

> Level 8 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-headless-cms-es-tasks` is not a general reindex/mapping utility despite its name — it is a self-contained pair of `@webiny/background-tasks` background tasks ("Mock Data Manager" and "Mock Data Creator") that seed a demo "Cars" CMS model with mock content entries, disabling and re-enabling the target OpenSearch index's replicas/refresh interval around the bulk-insert to speed it up. Of the ~7.6k lines, over 6,900 are a single static mock content model (`model.ts`, 5,550 lines) and a static mock values object (`mockData.ts`, 1,361 lines); actual logic is under 300 lines. The package is not consumed or declared as a dependency by any other package in the monorepo (only its own `__tests__` and a CI test-lister reference it), and it has a real tenant-scoping bug where the index is disabled for the model's actual tenant but re-enabled for a hardcoded `"root"` tenant.

## Public API
- `HeadlessCmsEsTasksFeature` (`src/HeadlessCmsEsTasksFeature.ts:5`) — registers the two `TaskDefinition`s into DI. codegraph/grep: no consumers anywhere in the monorepo outside this package's own tests and `.github/workflows/wac/utils/v5ListPackagesWithJestTests.ts` (a CI file-lister, not a runtime import). No `package.json` in the repo lists `api-headless-cms-es-tasks` as a dependency.
- `MockDataManagerTaskDefinition` / `MOCK_DATA_MANAGER_TASK_ID` (`src/tasks/MockDataManagerTask.ts:18,87`) — orchestrates model/group creation, disables indexing, fans out `MockDataCreator` child tasks, waits for them, re-enables indexing.
- `MockDataCreatorTaskDefinition` / `MOCK_DATA_CREATOR_TASK_ID` (`src/tasks/MockDataCreatorTask.ts:14,54`) — the worker task that loops `CreateEntryUseCase.execute` until `totalAmount` is reached, checking OpenSearch cluster health every 50 records.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `src/tasks/MockDataManager/MockDataManager.ts:54-61`, `src/tasks/MockDataManagerTask.ts:50-57`, `src/tasks/MockDataManagerTask.ts:60-68` | `disableIndexing` is called with the model resolved from the current tenant's context (`createModelAndGroup`, real tenant), but all three `enableIndexing` call sites hardcode `model: { modelId: input.modelId, tenant: "root" }`. `CmsModelOpenSearchIndexProvider` computes the index name from `model.tenant`, so disable and enable target different indices whenever the task runs in a non-root tenant. | Task run under any tenant other than `root` (e.g. multi-tenant deployment, or triggered from a non-root API key): `disableIndexing` sets `number_of_replicas: 0, refresh_interval: -1` on the tenant's real "cars" index. On success, error, or abort, `enableIndexing` computes the index name for tenant `root` instead and restores settings there (a different, possibly non-existent index). The real tenant's index is left with zero replicas and search-refresh disabled indefinitely — new/updated documents in that tenant's CMS entries stop becoming searchable in near-real-time until an operator manually restores the setting. | high |
| 2 | medium | `src/tasks/MockDataManager/MockDataManager.ts:35-50` | The manager only waits for child `MockDataCreator` tasks to leave `PENDING`/`RUNNING` (`taskStatus_in: [PENDING, RUNNING]`); it never checks whether they ended in `FAILED`. Once all children reach any terminal status, the manager unconditionally re-enables indexing and returns `controller.response.done()`. | If a `MockDataCreator` child task errors (e.g. `CreateEntryUseCase` fails, or the OpenSearch health check throws — see `MockDataCreator.ts:106-114`) partway through and ends `FAILED`, the parent Mock Data Manager task still reports overall success with no fewer records created and no indication in its output that a subset of the intended records is missing. | high |
| 3 | low | `src/tasks/MockDataManager/calculateAmounts.ts:60-63` | `amountOfRecords = Math.round(input / (100/percentagePerTask))` combined with `amountOfTasks = Math.ceil(100/percentagePerTask)` can overcreate records when `input` doesn't divide evenly (e.g. `input=77` → `amountOfRecords=39`, `amountOfTasks=2` → 78 records created instead of 77). | Requesting a mock-data `amount` that isn't a clean multiple of the tier's task count creates slightly more records than requested. Cosmetic for a mock-data generator. | medium |

## Duplication
jscpd report shows 0% duplication within the package (all files report `clones: 0`). No cross-package duplication of note: the disable/enable/create-index helpers correctly delegate index-name computation to `CmsModelOpenSearchIndexProvider` from `api-headless-cms-utils-os` rather than reimplementing it, consistent with that package's summary.

## Dead code
- The package as a whole is effectively unreferenced in production: `HeadlessCmsEsTasksFeature` is never registered by any app or other package (codegraph: no consumers outside this package's tests; grep for `api-headless-cms-es-tasks` across all `package.json` files in the repo returns only the package's own manifest). If this is intentionally a dev/demo-only tool it should probably live outside `packages/` (e.g. an example or scripts folder) or be documented as such; as-is it looks like dead weight shipped as a publishable package.
- `utils/createIndex.ts`'s `createIndex` is used once, from `createModelAndGroup.ts:70` — not dead, just noting it has no other consumers within the package.

## Convention issues
- None significant found. DI naming (abstraction/implementation split via `TaskDefinition.createImplementation`/`TaskHandler.createImplementation`), one-task-per-file, and barrel export (`index.ts` only exports the feature + task IDs, not internal DI wiring) all match AGENTS.md conventions.

## Test gaps
- No test covers the tenant-scoping bug (bug #1): both existing tests (`__tests__/tasks/mockDataManagerTask.test.ts`, `__tests__/tasks/mockDataCreatorTask.test.ts`) run under a single (presumably root) tenant context, so the disable/enable index mismatch never surfaces.
- No test exercises a failing/erroring `MockDataCreator` child task and asserts what the parent `MockDataManager` reports (bug #2) — existing tests only cover the happy path where all children succeed.
- `calculateAmounts` has a dedicated unit test file (`__tests__/tasks/MockDataManager/calculateAmounts.test.ts`) but it was not verified here to cover non-evenly-divisible `input` values (bug #3).
- No test covers task abort or task-runner error (`onAbort`/`onError`) behavior for `MockDataManagerTask`.

## Recommendations
1. Fix the tenant hardcoding: thread the actual `model.tenant` (or the resolved `StorageCmsModel`) through to every `enableIndexing` call site instead of hardcoding `"root"`, so disable/enable always target the same index.
2. Make `MockDataManager.execute`'s wait loop check child task status for `FAILED`/error outcomes (not just PENDING/RUNNING) and propagate a partial-failure result instead of unconditionally reporting `done()`.
3. Decide whether this package should be a published, installable Webiny package at all — given it has zero consumers/dependents monorepo-wide, either wire it into whatever app is meant to expose "generate mock CMS data" or move it out of `packages/` into a dev-tool/example location.
