# @webiny/api-event-handler-standalone

> Level 11 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-event-handler-standalone` is the self-hosted Node.js composition root: it mirrors `@webiny/api-event-handler-aws` closely (same identity/tenant EXTRACT→LOAD decorator pattern, same delegation to `@webiny/api-event-handler-core`'s `registerApiRequestStack` for the transport-agnostic feature stack), but replaces AWS-managed infra with in-process singletons — a Bree-based scheduler, an in-process WebSockets connection manager, and a worker-thread-based background-task runner — each started once at server boot (`onServer`) rather than per-request. The design is intentional and well documented (in particular, the fact that the scheduler is wired as a root singleton rather than through the `transports.scheduler` per-request hook the AWS package uses was verified against the DI wiring and is a deliberate, explained choice, not drift). Overall health is good; one new security finding is tracked privately (SEC-55); the already-known SEC-3 is not re-reported.

## Public API
- `createWebinyApiHandler` (`src/createWebinyApiHandler.ts:51`) — the server composition-root factory. Consumed by the `api-event-handler-standalone-sql` variant package, which supplies SQL storage + the self-hosted JWT identity provider.
- `NodeHttpIdentityLoaderDecorator` / `NodeHttpTenantLoaderDecorator` (`src/handlers/*.ts`, re-exported from `src/index.ts`) — the Node HTTP mirrors of the AWS API Gateway decorators; used internally by this package's own `createWebinyApiHandler`.
- Internally (not exported from the package root, but part of the composed server): the scheduler routes (`ScheduledActionRunRoute`, `ScheduledActionRecoverRoute`), the bulk-actions trigger, and the WebSocket connection authenticator — all wired only through `createWebinyApiHandler`.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | — | `packages/api-event-handler-standalone/src/scheduler/ScheduledActionRunRoute.ts`, `packages/api-event-handler-standalone/src/scheduler/ScheduledActionRecoverRoute.ts` | Security finding SEC-55 — see private notes. | — | medium |

## Duplication
jscpd reports 2 clones, both within `src/scheduler/`: a ~12-line block (`ScheduledActionRunRoute.ts:24-35` / `ScheduledActionRecoverRoute.ts:29-40`, the shared route preamble) and a ~9-line block (`ScheduledActionRunRoute.ts:41-53` / `ScheduledActionRecoverRoute.ts:53-61`, the "rebuild request context: set tenant, establish it, run GraphQL context enhancers + contextual schema builders" bootstrap sequence). Both routes need this bootstrap because each is invoked outside any real HTTP request (a Bree timer firing, or the boot-time recovery step), so the duplication is a reasonable trade-off for two small, independent routes rather than a design flaw — but if a third such "wake from timer" route is ever added, this sequence is worth extracting into a shared helper.

## Dead code
None found in the files read; every exported symbol is consumed either by `createWebinyApiHandler` directly or by the variant package.

## Convention issues
None meaningful. One abstraction per file is followed throughout (`InternalToken.ts`, `SchedulerSingleton.ts`, each route in its own file), and DI naming matches the exported class/abstraction name in each case.

## Test gaps
This package has no `__tests__` directory at all — none of `createWebinyApiHandler`, the two Node HTTP decorators, the scheduler routes/singleton wiring, the bulk-actions trigger, or the WebSockets authenticator have any direct test coverage. In particular, the route guarded by SEC-55 (private notes) and the request-context-bootstrap sequence duplicated between the two scheduler routes, are both completely untested — a regression that accidentally dropped the token check (e.g. during a future refactor of the duplicated block) would not be caught by any existing test in this package.

## Recommendations
1. Address security finding SEC-55 (see private notes).
2. Add at least one test per composed route/decorator (there are currently zero), starting with the scheduler routes' rejection path and the two decorators' header-extraction logic, mirroring the test style already present in `@webiny/api-event-handler-aws`.
3. If a third "wake from timer, rebuild request context" route is ever added, extract the duplicated bootstrap sequence (Duplication) into a shared helper in `src/scheduler/` rather than copying it a third time.
