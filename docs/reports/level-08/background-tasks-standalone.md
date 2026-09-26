# @webiny/background-tasks-standalone

> Level 8 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/background-tasks-standalone` is the non-AWS transport for `@webiny/background-tasks`: `WorkerService` spawns a Node `worker_threads` worker per task, the worker's `TaskOrchestrator` loops HTTP-POSTing the task event to this same server's `/background-task` route (`BackgroundTaskRoute`, guarded by a per-process `InternalToken` shared secret) until the runner reports `done`/`error`, mirroring the AWS Step-Functions continue/done/error protocol without needing SFN. `ProcessTimer` correctly tracks a real elapsed-time budget (`process.hrtime`), so — like `background-tasks-aws` — this transport does not reproduce the hardcoded-remaining-time defect flagged elsewhere in the monorepo. The one significant gap, directly relevant to the level-7 `background-tasks` finding that nothing guards a `RUNNING` task from being re-triggered: `WorkerService.send()` performs no deduplication at all — it unconditionally spawns a new `Worker` and overwrites `this.handles.get(task.id)` in its in-memory `Map`, so a second trigger for the same task both starts a second, fully concurrent worker AND silently discards the ability to `fetch()` status for the first one (its handle reference is lost).

## Public API
- `BackgroundTasksStandaloneFeature` (`src/BackgroundTasksStandaloneFeature.ts`) — DI registration entry point binding `WorkerService`, `BackgroundTaskRouteDefinition`, and a per-process `InternalToken`; the only exported symbol (`src/index.ts`).
- `WorkerService` (`src/service/WorkerTaskService.ts`) — the `TaskService.Interface` implementation; resolved wherever `background-tasks`'s `TaskService` abstraction is injected (e.g. `TriggerTaskUseCase`), analogous to `background-tasks-aws`'s `StepFunctionService`.
- `BackgroundTaskRoute`/`BackgroundTaskRouteDefinition` (`src/routes/BackgroundTaskRoute.ts`) — registers `POST /background-task` on `@webiny/event-handler-core`'s `HttpRouter`; the endpoint the spawned worker calls back into.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `src/service/WorkerTaskService.ts:37-59` (`send()`) | `send()` unconditionally does `const worker = new Worker(...)` and `this.handles.set(task.id, handle)` — there is no check for an existing, still-`running` handle for the same `task.id` before overwriting it. | If the same task is triggered twice while the first run is still in progress (the level-7-documented lack of a `RUNNING`-status guard in `TriggerTaskUseCase`), two `Worker` threads run the same task concurrently against the same CMS-entry-backed task record with no locking, and the first worker's handle is overwritten in the `Map` — `fetch(task)` from that point on only ever reports the second worker's status, so the first worker becomes an untracked "orphan" that can still write results/logs after the second one finishes. This is the standalone-side confirmation of the level-7 double-execution gap, structurally analogous to `background-tasks-aws`'s random-execution-name issue but arguably worse since it also loses status visibility into the first run. | high |
| 2 | low | `src/service/WorkerTaskService.ts:79-88` (`worker.on("exit", ...)`) | The 60-second handle-cleanup `setTimeout` after a worker exits does `this.handles.delete(task.id)` unconditionally, with no check that the handle being deleted is still the one that was scheduled to be deleted (relevant only in the double-invoke scenario above, where a second worker's handle may have replaced the first). | In the Bug #1 double-invoke scenario, the first worker's delayed cleanup can delete the second worker's live handle out from under it once 60s elapses, since both cleanups key off the same `task.id`. Low severity because it only compounds an already-broken scenario rather than being independently triggerable. | low |

## Duplication
No jscpd clones reported for this package.

## Dead code
None found — every exported class/feature has a confirmed registration point or caller within the package.

## Convention issues
None found.

## Test gaps
- `taskOrchestrator.test.ts`, `processTimer.test.ts`, and `backgroundTaskRoute.test.ts` cover the worker's continue/done/error HTTP loop, the timer budget, and the route's token check and request validation — but there is no test file for `WorkerTaskService.ts` at all, so neither the double-`send()`-for-the-same-task scenario (Bug #1) nor the handle-cleanup interaction (Bug #2) is exercised anywhere.

## Recommendations
1. In `WorkerService.send()`, check `this.handles.get(task.id)?.status === "running"` before spawning a new worker, and reject/no-op (or queue) the duplicate trigger instead of silently overwriting the tracked handle — this is the most direct transport-level mitigation for the level-7 double-execution gap, though the real fix belongs in `TriggerTaskUseCase`'s status check shared with `background-tasks-aws`.
2. Add a `WorkerTaskService` test suite, starting with the double-`send()` scenario above.
3. Guard the exit-handler's cleanup `setTimeout` so it only deletes the handle it scheduled cleanup for (e.g. compare the stored handle reference, not just the `task.id` key) to avoid Bug #2 compounding Bug #1.
