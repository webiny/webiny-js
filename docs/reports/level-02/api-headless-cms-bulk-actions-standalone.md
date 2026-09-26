# @webiny/api-headless-cms-bulk-actions-standalone

> Level 2 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
A tiny, single-purpose package (3 files, ~80 lines) that exposes one HTTP route, `POST /empty-trash-bins`, for the standalone server so an internal process can trigger the `hcmsEntriesEmptyTrashBins` background task; it protects the route with a per-process random token (`BulkActionsInternalToken`) that must be echoed back in an `x-webiny-bulk-actions-token` header, the same pattern used by `SchedulerInternalToken` in `@webiny/api-event-handler-standalone`. The code is small, correct, and well isolated; its only real gap is the total absence of automated tests.

## Public API
- `EmptyTrashBinRouteFeature` (`packages/api-headless-cms-bulk-actions-standalone/src/index.ts:8`) — DI feature that registers the internal token instance and the route definition. Consumed by `packages/api-event-handler-standalone/src/createWebinyApiHandler.ts` (the standalone server composition root).
- `BulkActionsInternalToken` (`packages/api-headless-cms-bulk-actions-standalone/src/BulkActionsInternalToken.ts:7`) — DI abstraction for the shared secret. Its value is read by `packages/api-event-handler-standalone/src/bulkActions/bulkActionsServer.ts`, which sends it as the `x-webiny-bulk-actions-token` header when it wants to trigger the trash-bin empty task (confirmed by grep — this is the only other place in the monorepo that references the token or the header name, so the route is reachable and not dead code).
- `EmptyTrashBinRoute` / `EmptyTrashBinRouteDefinition` (`packages/api-headless-cms-bulk-actions-standalone/src/EmptyTrashBinRoute.ts:34,47`) — internal HTTP route handler/definition, not intended for external consumers.

## Bugs
None found.

## Duplication
No jscpd clones reported for this package. The internal-token-header pattern (`BulkActionsInternalToken` here vs. `SchedulerInternalToken` in `api-event-handler-standalone` vs. `IInternalToken` in `background-tasks-standalone`) is duplicated conceptually across three packages — each defines its own near-identical "per-process random secret shared via DI, checked against a request header" abstraction rather than a shared helper. Not a code clone (different token shapes/names), but a candidate for a small shared utility if a fourth consumer appears.

## Dead code
None found — both exports are consumed (see Public API).

## Convention issues
None found. The package follows the DI naming convention (abstraction file named for the class, implementation classes suffixed `Impl`, namespace `Interface` type) and keeps one abstraction/implementation per concern.

## Test gaps
The package has no `__tests__` directory at all, so there is no coverage for: the 403 rejection path when the token header is missing/wrong, the success path invoking `taskService.trigger`, or the 500 path when `taskService.trigger` throws. Given the route is a security boundary (token check gates triggering a tenant-wide bulk-delete task), a missing-or-wrong-token test would be worth adding.

## Recommendations
1. Add unit tests for `EmptyTrashBinRouteImpl.handle` covering the forbidden, success, and error branches (currently zero coverage on a security-relevant route).
2. Consider extracting the repeated "per-process internal token" DI pattern (this package, `api-event-handler-standalone`'s `SchedulerInternalToken`, `background-tasks-standalone`'s `IInternalToken`) into one shared helper in `@webiny/utils` or `@webiny/event-handler-core` if a fourth use case shows up, to avoid drift between the three near-identical implementations.
3. No action needed on functionality itself — the feature is small, correctly wired, and free of bugs found during this audit.
