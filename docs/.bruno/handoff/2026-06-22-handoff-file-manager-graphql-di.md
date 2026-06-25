# Session Handoff — 2026-06-22 — File Manager GraphQL DI

## What was done

- Refactored `api-file-manager` GraphQL layer from `GraphQLSchemaPlugin` + `ContextPlugin` pattern to `GraphQLSchemaFactory` DI pattern
- Extracted `FileUrlGenerator` feature (abstraction existed, no implementation) — replaces inline settings lookup in `FmFile.src` resolver
- Extracted `GetFileByUrlUseCase` feature — replaces two inline classes manually instantiated inside a resolver
- Consolidated all GraphQL typeDefs and resolvers into a single `FmGraphQLSchema` (`GraphQLSchemaFactory` implementation)
- Fixed auth check regression: `identity.isAnonymous()` instead of falsy check (IdentityContext always returns truthy)
- Fixed error propagation: `ListFilesUseCase` failures now surface properly instead of being masked as "not found"
- `createFileManagerGraphQL()` kept as no-op for backwards compatibility — schemas are now auto-discovered via DI
- 9 commits, 33 tests passing

## Key decisions

- Used `GraphQLSchemaFactory` pattern (same as `tenant-manager` and `webhooks`) — `builder.addResolver({ path, dependencies, resolver })` with DI-resolved deps instead of `context.container.resolve()` in each resolver
- `FileUrlGenerator.init()` is optional on the interface — called once in the schema factory's `execute()` method to load settings before resolvers run
- Security check in `GetFileByUrlUseCase` uses `IdentityContext.getIdentity().isAnonymous()` (not `context.security.getIdentity()` which has different semantics via `LegacyContext`)
- `createFileManagerGraphQL()` returns empty array rather than being removed — too many external consumers
- `modelModifier/CmsModelModifier.ts` identified as dead code (zero callers) but not yet removed

## Current state

- Branch: `bruno/refactor/api-file-manager-di`
- Tests: 33 passed (7 test files), 2 skipped
- Build: passing, type check passing
- Unpushed commits: 9

## What might come next

- Delete `modelModifier/CmsModelModifier.ts` (confirmed dead code — zero callers, only used in one test)
- Remove `createFileManagerGraphQL()` from consumers and delete the no-op export
- Refactor `src/index.ts` entry point — `createFileManagerContext` still uses `ContextPlugin` with manual container wiring
- Refactor `src/delivery/setupAssetDelivery.ts` — uses `createModifyFastifyPlugin` with manual `container.resolve()` in Fastify hooks
