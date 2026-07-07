# Session Handoff — 2026-07-07 — Background Tasks Split

## What was done

- Split `@webiny/background-tasks` into three packages: core (platform-agnostic), `@webiny/background-tasks-aws` (SFN/EventBridge/Lambda), `@webiny/background-tasks-server` (worker threads/HTTP route)
- Extracted `ITimer` from `@webiny/handler-aws` into core as `Timer` namespace pattern
- Replaced `IStepFunctionServiceFetchResult` with generic `IServiceInfo` in core
- Converted `TaskServicePlugin` (legacy plugin pattern) to proper DI `createAbstraction` pattern (`TaskService`)
- Created `BackgroundTaskRoute` (POST `/background-task`) with runtime-generated token auth
- Created worker thread orchestrator with HTTP safety (status validation, timeouts, payload isolation)
- 20 commits, 34 tests (22 server + 12 AWS), 88 existing background-tasks tests still passing

## Key decisions

- Timer is a plain interface with namespace (`Timer.Interface`), not a DI abstraction — it's constructed at call site, not resolved from container
- Three packages compose independently at app template level: core + transport (AWS or server) + storage (DDB or OS)
- Server transport uses `child_process` → changed to `worker_threads` for lighter overhead
- Route auth uses runtime-generated UUID token shared via DI (`InternalToken`), not env var — works single-process only, documented
- `EventBridgeEventTransportPlugin` removed — only SFN transport kept for AWS

## Current state

- Branch: `bruno/refactor/background-tasks-split`
- Tests: 88 (background-tasks) + 22 (background-tasks-server) + 12 (background-tasks-aws) = 122 total
- Build: passing (all packages)
- Type check: all 5 affected packages pass
- Unpushed commits: 20

## What might come next

- Push and create PR
- Integration test with real task execution end-to-end (server transport → worker → route → TaskRunner → done)
- Multi-server token story if needed (shared secret for distributed deployments)
- Pre-existing `??` cleanup across background-tasks admin/presenters/decorators
- Consider removing `event-handler-aws` devDep from core once test helpers are refactored
