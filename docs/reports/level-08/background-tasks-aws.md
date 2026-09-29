# @webiny/background-tasks-aws

> Level 8 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/background-tasks-aws` is the AWS transport for `@webiny/background-tasks`'s `TaskRunner`/`TaskService` abstractions: `StepFunctionService` starts (and later polls) an AWS Step Functions execution per task via `triggerStepFunctionFactory`/`describeExecutionFactory`, `BackgroundTaskLambdaHandler` unwraps the SFN/EventBridge event shape and drives `TaskRunner.run()` inside a per-request DI container, and `LambdaTimer` correctly delegates the "how much time is left" question to the real Lambda context's `getRemainingTimeInMillis()` (with a `Date`-based fallback when there is none) — consistent with the level-7 finding that this package does not reproduce the hardcoded-900s-remaining-time bug found elsewhere. The gap that matters most, confirmed by reading this package alongside the level-7 `background-tasks` finding that nothing guards a `RUNNING` task from being re-triggered, is that `StepFunctionService.send()` itself adds no deduplication: it generates a fresh random execution name (`generateAlphaNumericId(10)`) on every call, so two `send()` calls for the same task always succeed as two independent SFN executions rather than colliding on a deterministic name. The AWS transport therefore can, and will, double-invoke `BackgroundTaskLambdaHandler` concurrently for the same task if the use-case layer triggers it twice.

## Public API
- `BackgroundTasksAwsFeature` (`src/BackgroundTasksAwsFeature.ts`) — DI registration entry point binding `BackgroundTaskLambdaHandler` and `StepFunctionService`; consumed by AWS composition roots (`packages/webiny`'s handler wiring), mirroring `background-tasks-standalone`'s feature.
- `StepFunctionService` (`src/service/StepFunctionService.ts`) — the `TaskService.Interface` implementation; the only consumer is the DI registration above (resolved wherever `background-tasks`'s `TaskService` abstraction is injected, e.g. `TriggerTaskUseCase`).
- `LambdaTimer` (`src/timer/LambdaTimer.ts`) — used only by `BackgroundTaskLambdaHandler`, not exported from `index.ts`.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `src/service/StepFunctionService.ts:52-60` (`send()`, execution `name` construction) | `send()` builds `name = \`${task.definitionId}_${task.id}_${generateAlphaNumericId(10)}\`` — a fresh random suffix every call — instead of a deterministic name derived only from `task.id`. Step Functions would naturally reject a second `StartExecution` call with a name already in use (or return the same execution per its idempotency window), but the random suffix defeats that protection entirely. | If anything triggers the same background task twice (e.g. the level-7-documented lack of a `RUNNING`-status guard in `TriggerTaskUseCase`, a retried GraphQL mutation, or a user double-clicking "run"), two independent SFN executions start and two concurrent `BackgroundTaskLambdaHandler` invocations run the same `TaskDefinition.run()` against the same CMS-entry-backed task record with no locking — this is the AWS-side confirmation of the level-7 "RUNNING tasks can be re-executed" gap. | high |
| 2 | low | `src/service/StepFunctionService.ts:30-44`, `72-91` | Every failure path (`manifest` missing, `bgTaskSfn` missing, `tenant` missing, `trigger`/`get` throwing) is swallowed and turned into a `null` return plus a `console.error`/`console.log`, with no error propagated to the caller. | A caller of `TaskService.send()` that doesn't specifically check for a `null` result (rather than a thrown error) could treat a failed trigger as if it succeeded; this is a design choice inherited from the abstraction's contract, so flagged as low severity/informational rather than a confirmed misuse (out of scope to verify every `TaskService.send()` caller here). | low |

## Duplication
No jscpd clones reported for this package.

## Dead code
None found — `BackgroundTaskLambdaHandler`, `StepFunctionService`, and `LambdaTimer` all have confirmed registration/usage within the feature's own wiring.

## Convention issues
None found.

## Test gaps
- `backgroundTaskLambdaHandler.test.ts`/`backgroundTasksAwsFeature.test.ts`/`lambdaTimer.test.ts` cover the handler's tenant-establishment and timer-fallback logic, but there is no test for `StepFunctionService.send()` being called twice for the same `task.id` (the exact scenario behind Bug #1), nor for its various `null`-returning failure branches.

## Recommendations
1. Make the SFN execution `name` deterministic (e.g. `${task.definitionId}_${task.id}` with no random suffix), so a second trigger for an already-running task collides with the first at the AWS API level instead of silently starting a duplicate execution — this is the most direct fix available at this layer for the level-7 double-execution gap, though the real fix belongs in `TriggerTaskUseCase`'s status check.
2. Add a test asserting `send()` is called with a stable, task-id-derived execution name.
3. Consider surfacing `send()`'s failure branches as a typed error/result rather than `null`, so callers can distinguish "nothing to do" from "the trigger actually failed".
