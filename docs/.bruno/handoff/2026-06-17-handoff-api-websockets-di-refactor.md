# Session Handoff — 2026-06-17 — api-websockets DI Use Cases Refactoring

## What was done

- Designed, spec'd (4 review rounds, ~31 findings fixed), planned, and implemented a DI refactoring of `@webiny/api-websockets`
- Split the monolithic `WebsocketsContext` class into 4 independent DI-registered use cases: `ListConnections`, `SendToIdentity`, `SendToConnections`, `Disconnect`
- Removed `context.websockets` entirely — consumers resolve use cases from the DI container
- Migrated all consumers across 6 packages: `api-websockets`, `api-websockets-aws`, `api-record-locking`, `ai-powerups`, `api-file-manager-s3`, `webiny`
- 15 implementation commits this session, 38 tests passing across 2 test suites, 6 packages type check clean
- Final whole-branch review caught a critical production registration bug (WebsocketsFeature not auto-registered in `createWebsockets()`) — fixed
- Updated `ai-context/core-features-reference.md` with 4 new use case entries

## Key decisions

- **Clean break:** No backward-compat facades. `context.websockets`, `IWebsocketsContextObject`, `WebsocketService` abstraction all removed
- **`createImplementation` pattern:** Use cases wrap their class + DI token + dependencies using `createImplementation` (matching `KickOutCurrentUserUseCase` and other existing code), not the original plan's `container.register(abstraction, { implementation, dependencies })` which doesn't exist
- **Auto-registration:** `WebsocketsFeature.register()` is called inside `createWebsockets()` via `createRegisterExtensionPlugin`, matching the `createApiCore()` pattern
- **Use case dependencies:** `DisconnectUseCase` and `SendToIdentityUseCase` inject `ListConnectionsUseCase` via DI
- **Stale filter inline:** 3-hour stale connection filter stays in `ListConnectionsUseCase`
- **`IWebsocketsIdentity` rehomed to `types.ts`**
- **Errors relocated to `features/shared/errors.ts`** with new `WebsocketsError` union type

## Current state

- Branch: `bruno/refactor/api-websockets-aws`, 50 commits ahead of `next` (not pushed)
- Tests: 38 passing (25 in api-websockets, 13 in api-websockets-aws)
- Build: all 6 affected packages type check clean
- Lint/format/adio: clean
- Previous session work on this branch: AWS split (commits 1-15) and api-websockets-server package (commits 16-35)

## What might come next

- **Push and create PR** — branch has 50 commits, not pushed
- **Split into multiple PRs** — AWS split (first ~15 commits), server package (~13 commits), and DI refactoring (~15 commits) could be separate PRs
- **Runner integration for api-websockets-server** — wire `WebsocketsRunner` with shared Webiny Context so connect/message/disconnect events trigger route plugins
- **Manual testing** — deploy and test WebSocket connect/disconnect/message flow
- **api-websockets-server tests** — 37 tests from previous session, verify still passing after DI refactor
