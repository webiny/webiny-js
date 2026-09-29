# @webiny/api-scheduler-aws

> Level 8 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-scheduler-aws` is the AWS EventBridge Scheduler transport for `@webiny/api-scheduler`: `EventBridgeSchedulerService` creates/updates/deletes one EventBridge schedule per scheduled action (one-shot `at()` expression, `ActionAfterCompletion: DELETE`), and `LazySchedulerService` decides at first use whether to bind to that real service or to `api-scheduler`'s no-op `VoidSchedulerService`, based on whether the deployed service-discovery manifest contains scheduler info. Both `scheduleFor` handling (raw `toISOString()`, no explicit `ScheduleExpressionTimezone`) and the AWS side's reliance on EventBridge's own default retry/durability are reasonable and consistent with taking `scheduleFor` at face value (per level-7 `api-scheduler` finding). The one real gap is in `LazySchedulerService`: any failure to load the manifest — not just "scheduler not deployed", but also a transient `ServiceDiscovery.load()` error — is treated identically and silently downgrades to the no-op `VoidSchedulerService`, so a schedule creation/update/delete call can appear to succeed while doing nothing on the AWS side. The package also carries a small dead/duplicated legacy type left over from a previous plugin-based design.

## Public API
- `SchedulerAwsFeature` / `registerSchedulerAwsExtension` (`src/SchedulerAwsFeature.ts`, `src/context.ts`) — the DI registration entry point that binds `@webiny/api-scheduler`'s `SchedulerService` abstraction to the AWS-backed lazy implementation; consumed by AWS composition roots (`packages/webiny`'s AWS API handler wiring), analogous to `api-scheduler-standalone`'s equivalent registration.
- `EventBridgeSchedulerService` (`src/features/SchedulerService/EventBridgeSchedulerService.ts`) — the concrete `SchedulerService.Interface` implementation; used only via `LazySchedulerService` (no other direct consumers found).

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `src/features/SchedulerService/LazySchedulerService.ts:27-38` | `service()` treats every `getManifest()` failure the same way — it falls back to `new VoidSchedulerService()` with no callbacks, which (per `@webiny/api-scheduler`'s `VoidSchedulerService.create/update/delete`) is a pure no-op that resolves successfully. This collapses "scheduler not deployed" (a legitimate configuration state) with "service discovery had a transient error" (e.g. a DynamoDB throttling blip reading the manifest) into the same silent no-op. | If `ServiceDiscovery.load()` fails transiently at the moment a user schedules a publish/unpublish, `create()` returns normally without ever calling EventBridge, so no timer is ever registered — the CMS-side scheduled-action record exists but will never fire, and nothing surfaces an error to the caller or logs. This is a "missed schedule" bug distinct from the already-documented `scheduleFor`/timezone behaviour. | medium |
| 2 | low | `src/createEventHandler.ts:4-13` | `IScheduledActionEventPayload`/`IScheduledActionEvent` are commented as "legacy plugin-based handler types — kept for downstream compatibility", but grep across the monorepo shows no consumer of `IScheduledActionEvent` anywhere outside this file and its `dist/` output; `IScheduledActionEventPayload` is used only internally by `EventBridgeSchedulerService.ts`. Meanwhile `@webiny/event-handler-aws/src/eventTypes/ScheduledActionEventType.ts` defines an equivalent (near-identical) `IScheduledActionEventPayload`/`IScheduledActionEvent` pair that is the one actually wired into the handler chain (`ScheduledActionEventHandler`). | No functional failure — just a duplicated, unused type definition that could be deleted or merged with the one in `event-handler-aws`. | medium |

## Duplication
- Confirmed by jscpd: `EventBridgeSchedulerService.ts` has ~18% duplicated lines — `create()` and `update()` build near-identical `CreateScheduleCommand`/`UpdateScheduleCommand` payloads (`ScheduleExpression`, `FlexibleTimeWindow`, `Target`, `ActionAfterCompletion`), differing only in the AWS SDK command class. A small private helper building the shared command-input object would remove this.
- `IScheduledActionEventPayload`/`IScheduledActionEvent` in `createEventHandler.ts` duplicate the equivalent, actually-used types in `@webiny/event-handler-aws/src/eventTypes/ScheduledActionEventType.ts` (see Bug #2).

## Dead code
- `IScheduledActionEvent` (`src/createEventHandler.ts:11-13`) — codegraph/grep: no consumers outside this file and its own `dist/` build output.

## Convention issues
None found — DI feature registration, abstraction naming, and file layout follow the documented pattern.

## Test gaps
- `SchedulerService.test.ts`/`features/` tests cover `EventBridgeSchedulerService`'s happy paths and the "past date" guard, but there is no test for `LazySchedulerService` falling back to `VoidSchedulerService` on a manifest error, nor one distinguishing "manifest absent" from "manifest load threw" — the exact gap behind Bug #1.

## Recommendations
1. In `LazySchedulerService.service()`, distinguish "scheduler feature not configured" (expected, safe to no-op) from an actual thrown/unexpected error reading the manifest (should propagate or at least log loudly) rather than silently falling back to `VoidSchedulerService` in both cases.
2. Remove the unused `IScheduledActionEvent` (and consider re-exporting from `@webiny/event-handler-aws` instead of re-declaring `IScheduledActionEventPayload`) in `createEventHandler.ts`.
3. Extract the shared EventBridge command-payload construction out of `create()`/`update()` in `EventBridgeSchedulerService.ts`.
