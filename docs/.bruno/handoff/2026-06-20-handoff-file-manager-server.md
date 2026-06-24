# Session Handoff — 2026-06-20 — api-file-manager-server Design

## What was done

- Explored `api-file-manager-s3` architecture via codegraph (GraphQL schema, DI features, upload flow, asset delivery, frontend strategies)
- Designed `api-file-manager-server` as a drop-in replacement storing files on local disk instead of S3
- Wrote comprehensive design spec with identical GraphQL API shape
- Iterated through 5 subagent review rounds, fixing 20 issues covering: schema parity, event handler types, asset delivery pipeline, multipart upload ordering, token expiry, abandoned upload cleanup, file size validation, ServiceManifest URL resolution, and more
- 5 commits, 1 spec file (285 lines)

## Key decisions

- GraphQL API shape is identical to S3 — clients don't change
- Storage path (`WEBINY_LOCAL_STORAGE_PATH`) is required, no default — boot fails if missing
- Upload security uses HMAC-SHA256 tokens (60s for simple uploads, 24h for multipart parts)
- Server URL resolved from `ServiceManifest` (`manifest.api.cloudfront.domain`) with Fastify request fallback
- `FlushCacheFeature` exists as noop (correct event hooks wired) for future cache invalidation
- Local filesystem deletion is inline (`fs.rm`), no background task needed (unlike S3's paginated delete)
- Abandoned multipart uploads cleaned up by a background task (24h TTL)
- Asset delivery requires 4 local implementations: `LocalContentsReader`, `LocalAssetResolver`, `LocalOutputStrategy`, `LocalSharpTransform`
- `FileUploadModifierPlugin` type string changed to `"fm.server.uploadModifier"` to avoid collisions

## Current state

- Branch: `bruno/feat/api-file-manager-server`
- Tests: N/A (spec only, no code)
- Build: passing (no code changes)
- Unpushed commits: 5

## What might come next

- Write implementation plan from the approved spec (invoke `writing-plans` skill)
- Implement the `api-file-manager-server` package
- Create corresponding frontend package (`app-file-manager-server`) if needed, or verify the existing `app-file-manager-s3` works unchanged
- Pulumi infrastructure for self-hosted deployment (ServiceManifest registration)
- Integration tests
