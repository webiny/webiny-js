# @webiny/api-scheduler-standalone

> Level 8 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-scheduler-standalone` is the non-AWS transport for `@webiny/api-scheduler`'s `SchedulerService` abstraction: `BreeSchedulerService` uses the `bree` job scheduler to arm one one-shot worker-thread timer per scheduled action (mirroring EventBridge's one-schedule-per-action model), tracks live jobs in an in-memory `Map`, and exposes a `recover()` method — called from `api-event-handler-standalone` at boot — that re-arms all still-pending schedules and immediately fires any that are already overdue, explicitly covering the "missed schedule after downtime" case that EventBridge handles for free by being an external, durable AWS service. Compared to `api-scheduler-aws`, this transport preserves full `Date` (millisecond) precision instead of truncating to whole seconds, but it has no retry mechanism at all if the downstream handler throws — where EventBridge Scheduler retries a failed target invocation automatically, a thrown error from `onTrigger` here has nothing catching or re-arming it. The package is small, single-purpose, and its tests exercise the recovery and trigger paths directly.

## Public API
- `BreeSchedulerService` (`src/BreeSchedulerService.ts`) — the `SchedulerService.Interface` implementation; instantiated by `packages/api-event-handler-standalone/src/scheduler/schedulerServer.ts` (confirmed via grep — that package is not in this level's dependency set and so is out of scope here) and is the only consumer of `.recover()`.
- `IPendingAction` / `IBreeSchedulerServiceParams` (`src/index.ts`) — supporting types for the constructor and `recover()` call, re-exported for that same consumer.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `src/BreeSchedulerService.ts:53-63` (`workerMessageHandler`) | Unlike `api-scheduler-aws`'s `EventBridgeSchedulerService` (backed by EventBridge Scheduler's default retry policy, ~185 attempts over 24h, on target-invocation failure), nothing in `BreeSchedulerService` catches or retries a failure from `this.onTrigger(...)`. The job entry is deleted from `this.jobs` before `onTrigger` is awaited, so even a transient error in the publish/unpublish handler permanently drops that schedule with no retry. | A scheduled publish/unpublish that transiently fails (e.g. a DB write conflict) on the standalone transport is silently lost — no retry happens and no error surfaces beyond whatever `onTrigger`'s own caller does with the rejected promise. On the AWS transport the same transient failure would be retried automatically by EventBridge. This is a genuine behavioural drift between the two transports for the "retries" dimension called out by this audit. | high |
| 2 | low | `src/BreeSchedulerService.ts:57` (`ScheduleExpression`-equivalent: `date: scheduleFor`) vs. `api-scheduler-aws`'s `createScheduleExpression` (`EventBridgeSchedulerService.ts:142-144`) | The AWS transport truncates `scheduleFor` to whole-second precision (`.replace(/\.\d{3}Z$/, "")` before building the `at()` expression) because EventBridge Scheduler's `at()` syntax has no sub-second granularity; the standalone transport passes the full `Date` (millisecond precision) straight to `bree`. | Scheduling the same `scheduleFor` value produces a firing time that can differ by up to ~999ms between the two transports. Not a bug in either transport individually — it is an AWS API constraint — but it is a confirmed precision drift between them worth documenting since higher-level packages may assume identical firing behaviour across transports. | high |

## Duplication
No clone report for this package (jscpd found none above threshold); `create()`/`update()` in `BreeSchedulerService` are not duplicated the way `EventBridgeSchedulerService`'s are, since `update()` just calls `safeRemove()` + `create()`.

## Dead code
None found — `BreeSchedulerService`, `recover()`, and both exported types have confirmed external consumers (grep: `api-event-handler-standalone`).

## Convention issues
None found.

## Test gaps
- `BreeSchedulerService.test.ts`/`.recovery.test.ts`/`.trigger.test.ts` cover create/update/delete/exists and the `recover()` overdue-vs-future split, but there is no test for `onTrigger` throwing inside `workerMessageHandler` (the exact gap behind Bug #1) — worth adding to lock in whatever the intended behaviour should be (retry, dead-letter, or explicitly-accepted at-most-once semantics).

## Recommendations
1. Decide and implement an explicit retry (or at-least-once/dead-letter) policy for `onTrigger` failures in `BreeSchedulerService`, to close the retry-behaviour gap with the AWS transport (Bug #1) — this is the most consequential of the AWS-vs-standalone drift points found across both packages.
2. Add a test asserting current behaviour when `onTrigger` rejects, so the gap is at least visible and intentional rather than silent.
3. Document the second-vs-millisecond precision difference (Bug #2) next to the `scheduleFor`-taken-at-face-value note from the level-7 `api-scheduler` report, so consumers don't assume bit-for-bit identical firing times across transports.
