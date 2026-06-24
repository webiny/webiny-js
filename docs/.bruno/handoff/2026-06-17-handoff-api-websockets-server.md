# Session Handoff — 2026-06-17 — api-websockets-server package

## What was done

- Designed, planned, and implemented `@webiny/api-websockets-server` — a Docker/self-hosted WebSocket server transport package
- 14 commits this session, 37 tests passing across 7 test files
- Extended `IWebsocketsConnectionRegistry` with `updateLastSeen` and `listStale` methods (SQL + DDB implementations)
- Added `lastSeen` nullable datetime column to SQL websockets table via lazy migration
- Created 3 DI abstractions: `WebsocketsServerAdapter`, `WebsocketsUpgradeHandler`, `WebsocketsConnectionManager`
- Implemented `NodeWsAdapter` (built-in `ws`), `DefaultUpgradeHandler`, `ServerConnectionManager`, `ServerWebsocketsEventValidator`, `ServerWebsocketsTransport`
- Built `WebsocketsServer` orchestrator with standalone + attach modes, heartbeat timer, graceful shutdown
- Ran 3 review rounds on the spec (18 findings fixed) and 1 final code review (5 findings fixed)
- Updated `ai-context/core-features-reference.md` with new package documentation

## Key decisions

- Single-server scope only — multi-server/horizontal scaling explicitly out of scope
- Node built-in `ws` as default, with `WebsocketsServerAdapter` DI abstraction for swapping libraries
- No source handler registry — server directly manages connection lifecycle
- Auth stays in route plugins (same as AWS), not at HTTP upgrade level
- `endpoint` set to server's own address (e.g. `ws://localhost:8080`)
- Upgrade handler uses `noServer: true` mode on ws, HTTP `upgrade` event checked before accepting
- Lazy cleanup (transport removes stale connections on send fail) + TTL cleanup (heartbeat with `maxAge = 5 * heartbeatInterval`)
- `connectionManager.add()` writes to local map only — `registry.register()` happens in the connect route plugin
- `connectionManager.remove()` is idempotent (swallows `CONNECTION_NOT_FOUND`)
- `listStale` returns rows with `lastSeen < threshold OR lastSeen IS NULL`; `register()` sets `lastSeen` at connect time to avoid immediate eviction
- Graceful shutdown sets `shuttingDown` flag to suppress onClose callbacks, then batch-removes all connections from registry

## Current state

- Branch: `bruno/refactor/api-websockets-aws`, 28 commits ahead of `next` (not pushed)
- Tests: 37 passing in api-websockets-server, 8 passing in api-websockets-sql
- Build: all 4 websockets packages build clean
- Lint/format/adio: clean
- PR body at `PR_BODY.md` (from previous session, covers the AWS split only — needs updating for server package)

## What might come next

- **Runner integration** — wire `WebsocketsRunner` with shared Webiny `Context` so connect/message/disconnect events trigger route plugins (auth, tenant resolution, registry writes). Deferred because context bootstrap strategy is TBD.
- **Push and create PR** — branch has 28 commits, not pushed
- **Split into two PRs** — AWS split (first 15 commits) and server package (last 13) could be separate PRs
- **Manual testing** — deploy and test WebSocket connect/disconnect/message flow
- **Future: `api-websockets-docker` template** — project template wiring for Docker deployments using the server package
