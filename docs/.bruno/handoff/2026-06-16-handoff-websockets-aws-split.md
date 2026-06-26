# Session Handoff — 2026-06-16 — API Websockets AWS Split

## What was done

- Wrote spec v2 (`ai-context/specs/api-websockets-split.md`) with 2 rounds of review (26 findings addressed)
- Created 25-task implementation plan (`docs/superpowers/plans/2026-06-16-api-websockets-aws-split.md`)
- Extracted all AWS-specific code from `@webiny/api-websockets` into new `@webiny/api-websockets-aws` package
- Replaced AWS event types with generic platform-agnostic types (`event.requestContext` → `event.context`, `domainName`+`stage` → `endpoint`, enums → string literals)
- Created `WebsocketsTransport` DI abstraction with `createAbstraction`/`createImplementation` pattern
- Updated `@webiny/api-websockets-ddb` and `@webiny/api-websockets-sql` storage packages for new `endpoint` field
- Added SQL migration for existing tables (`domainName`+`stage` → `endpoint`)
- Updated all 3 `project-aws` consumer templates
- Migrated all tests: 25 base package tests, 13 AWS package tests — all passing
- 13 commits, 66 files changed

## Key decisions

- **DI pattern**: `WebsocketsTransport` abstraction lives in the transport abstractions file (not a separate `features/Transport/` folder). Uses `createAbstraction` + namespace with `Interface`, `SendConnection`, `DisconnectConnection`, `SendData` type aliases. Implementations use `createImplementation` at file bottom, register via `container.register(X).inSingletonScope()` in a `createRegisterExtensionPlugin` callback. No `createFeature` wrapper needed.
- **Connection types**: Changed from `Pick<IWebsocketsConnectionRegistryData, ...>` to standalone interfaces so they can be implemented independently of registry data.
- **Validation ownership**: Moved from runner to handler. The AWS handler validates the raw event and passes a pre-validated `IWebsocketsEvent` to the runner. Runner constructor dropped from 4 args to 3 (no validator).
- **No type re-exports from AWS package**: Handler types are internal — `index.ts` only exports `createAwsWebsockets()`.

## Current state

- Branch: `bruno/refactor/api-websockets-aws`
- Tests: 38 passed (25 base + 13 AWS)
- Build: all 4 packages passing
- Unpushed commits: 13

## What might come next

- Push branch and create PR
- Manual testing: deploy to AWS and verify WebSocket connect/disconnect/message flow end-to-end
- Manual testing: verify SQL migration on existing table with `domainName`/`stage` columns
- Future: `api-websockets-server` package for Docker/EC2/self-hosted deployments (the reason this split was done)
- Consider updating `registerWebsocketsDdbStorageOperations` in `api-websockets-ddb` to use the `createImplementation` DI pattern (currently uses `registerInstance` directly — older convention)
