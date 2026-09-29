# @webiny/api-headless-cms-bulk-actions-aws

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-headless-cms-bulk-actions-aws` is a minimal AWS-specific glue package: a single EventBridge Lambda handler, `BulkActionsEventBridgeLambdaHandler`, that reacts to the scheduled `WebinyEmptyTrashBin` EventBridge rule (defined in `project-aws`'s Pulumi infrastructure) and triggers the `hcmsEntriesEmptyTrashBins` background task under the root tenant. The package is correctly wired into the production composition root (`api-event-handler-aws/src/composition/registerInboundEventTypes.ts` registers `BulkActionsEventBridgeLambdaHandlerFeature`) — unlike some other inbound transports called out as unwired in `event-handler-core`'s own report, this one is confirmed reachable in production. The one real issue is that the handler discards the result of triggering the task, so a failed trigger is invisible.

## Public API
- `BulkActionsEventBridgeLambdaHandlerFeature` (`src/index.ts`) — the only export. Consumed by exactly one file in the monorepo, `packages/api-event-handler-aws/src/composition/registerInboundEventTypes.ts:9,34`, which calls `.register(container)` on it as part of the standard AWS API composition root — confirmed via grep that this registration call exists (not just imported and unused).

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `src/BulkActionsEventBridgeLambdaHandler.ts:28-34` | `this.taskService.trigger(...)` returns a `Result<ITask, BaseError>` (see `@webiny/api-core`'s `ITaskService.trigger` signature), but the return value is never inspected — the handler `await`s it purely for its side effect, inside `tenantContext.withRootTenant`, and then unconditionally returns `{ success: true }`. | If `trigger()` fails (e.g. the `hcmsEntriesEmptyTrashBins` task definition is missing/misconfigured, input validation fails, or the underlying task-storage write errors), the failure is neither logged nor surfaced to EventBridge/Lambda — the handler still reports `success: true`, so the scheduled trash-emptying job can silently stop running indefinitely with no error, retry, or alert. | medium — the same "trigger and don't check the Result" pattern also appears in `packages/api-headless-cms-bulk-actions-standalone/src/EmptyTrashBinRoute.ts:22` and a few `api-file-manager-s3` task handlers, so this may be a broader accepted idiom in the codebase rather than a bug unique to this file; still worth confirming intent given this is the only unattended (non-request-driven) trigger path for this task. |

## Duplication
No jscpd-detected clones (the package is 2 files, 50 lines total). The specific call `taskService.trigger({ definition: "hcmsEntriesEmptyTrashBins" })` is duplicated verbatim, including the same missing-result-check, in `packages/api-headless-cms-bulk-actions-standalone/src/EmptyTrashBinRoute.ts:22` — the EventBridge-scheduled path and the standalone HTTP-route path each independently trigger the same task the same way; a shared helper (in `api-headless-cms-bulk-actions`, which already owns the task definition) would remove the duplication and let a fix to the result-handling bug above apply in one place.

## Dead code
None found — the package's single export is registered and reachable, and the handler's `DETAIL_TYPE` guard (`WebinyEmptyTrashBin`) matches the event type actually emitted by the EventBridge rule in `packages/project-aws/src/pulumi/apps/api/ApiGraphql.ts:96`, and the triggered task ID (`"hcmsEntriesEmptyTrashBins"`) matches exactly the `id` declared in `packages/api-headless-cms-bulk-actions/src/tasks/EmptyTrashBinTask.ts:140`.

## Convention issues
None found. The DI naming convention is followed correctly: the implementation class is `BulkActionsEventBridgeLambdaHandlerImpl`, the exported abstraction-bound implementation is `BulkActionsEventBridgeLambdaHandler` (matching the abstraction name, `EventBridgeEventHandler`), and the feature file (`index.ts`) contains only DI registration, one concern per file.

## Test gaps
The package has no `__tests__` directory at all — there is zero coverage for: the `detail-type` mismatch short-circuit (line 21-26), the root-tenant wrapping of the trigger call, and (most importantly, given Bug #1) the handler's behavior when `taskService.trigger` fails.

## Recommendations
1. Check the `Result` returned by `taskService.trigger` — log the error and return `{ success: false, message }` (or equivalent) on failure, so EventBridge/CloudWatch failures for the trash-emptying job are observable instead of silently swallowed.
2. Add unit tests using `@webiny/event-handler-core`'s testing feature: at minimum, a non-matching `detail-type` returns early without triggering, and a failing `taskService.trigger` result is reflected in the handler's return value once fixed.
3. Consider extracting the duplicated `taskService.trigger({ definition: "hcmsEntriesEmptyTrashBins" })` call (shared with `api-headless-cms-bulk-actions-standalone/src/EmptyTrashBinRoute.ts`) into one helper in `api-headless-cms-bulk-actions` so both entry points get the same fix and stay in sync.
