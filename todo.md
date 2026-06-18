# TODO

## Migrate / delete `@webiny/handler`

The package is now a thin backward-compat shim — all Fastify-specific code was removed.
What remains: `RegisterExtensionPlugin`, `Request`/`Reply`/`ResponseHeaders`, and re-exports of `ContextPlugin` from `@webiny/api`.

~20 packages still import from it. Migration means:

- `ContextPlugin` / `createContextPlugin` → import directly from `@webiny/api`
- `RegisterExtensionPlugin` / `createRegisterExtensionPlugin` → move to `@webiny/api` or `@webiny/event-handler-core`
- `Request` / `Reply` / `ResponseHeaders` → move to `@webiny/event-handler-core`
- `@webiny/handler/types` (`Context` type) → 3 test files need updating
- `EventPlugin` → deleted; `handler-aws/__tests__/raw.test.ts` still imports it (update or remove the test)

Once all imports are migrated, the package can be deleted.

## Migrate / delete `@webiny/handler-aws`

Same situation. All Fastify AWS event handlers deleted. What remains: `utils/composedHandler` and `utils/timer`.

Source files still importing dead exports:

- `createHandler`, `createRawEventHandler`, `createRawHandler`, `createApiGatewayHandler` — all deleted, callers are broken and need updating
- `timerFactory` / `ITimer` — the only live exports; move to `@webiny/event-handler-aws` or `@webiny/utils`

Once all imports are migrated, the package can be deleted.

## Audit and remove `registerLegacyPlugins` call sites

`registerLegacyPlugins` is a migration escape hatch. Each call site should eventually be replaced with a proper `Feature` registration. Check all remaining callers:

- `packages/testing/src/context/useGraphQLHandler.ts`
- `packages/testing/src/context/useContextHandler.ts`
- `packages/project-utils/testing/elasticsearch/getElasticsearchClient.ts`
- `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts`

Once all callers are migrated to DI-native features, `registerLegacyPlugins` itself can be deleted from `handler-graphql`. At that point `GraphQLContextEnhancer` (the abstraction, its implementations, and the `buildContext()` loop in `GraphQLEngineImpl`) also has no reason to exist — the legacy `ctx` object assembly mechanism can be removed entirely from `handler-graphql`.

Note: migrating `getElasticsearchClient.ts` caused `@webiny/project-utils` to gain a direct `@webiny/handler-graphql` dependency. That may be wrong (project-utils is a low-level testing utility; handler-graphql is application-layer). Revisit when tackling that caller.

## Resolve `ApiCoreContext` and the legacy context object

`packages/api-core/src/types/core.ts:9` — `ApiCoreContext` is a type alias intersecting `BaseContext`, `SecurityContext`, `TenancyContext`, `WcpContext`, and `AdminUsersContext`. It is the type of the old plain context object assembled during the `GraphQLContextEnhancer` phase, kept alive purely for backward compatibility so legacy callers doing `context.security.getIdentity()` etc. still work.

Once all callers are migrated to resolve services directly from the DI container, `ApiCoreContext` and the legacy context assembly have no reason to exist. Decide when/how to remove them.

## Inspect `CreateTenantSchema` model-not-found fallback

`packages/tenant-manager/src/api/graphql/CreateTenantSchema.ts:79` — there are two early-return guards that fall back to `[{ typeDefs: "", fields: "extensions: JSON" }]`:

1. Line 67: `modelsResult.isFail()` (list models RPC failed)
2. Line 79: `models.find(m => m.modelId === TENANT_MODEL_ID)` returned undefined

The second guard was required during the migration when the `wbyTenant` CMS model might not exist yet. Now that the model is always registered, the guard may be dead code. Verify that `wbyTenant` is always present when `CreateTenantSchema.enhance()` runs, then decide whether the fallback can be removed or should become a hard error.

## Port deleted extension templates to DI-native

The following extension template `index.ts` files were deleted because they used the old `createHandler` + `createApiCore` plugin-based pattern from `@webiny/handler-aws`:

- `packages/project-aws/_templates/extensions/OpenSearch/api/graphql/src/index.ts`
- `packages/project-aws/_templates/extensions/OpenSearch/coreDdbToEsHandler/dynamoToElastic/src/index.ts`
- `packages/project-aws/_templates/extensions/sqlite/api/graphql/src/index.ts` (entire directory gone)

The surrounding scaffolding (`tsconfig.json`, `webiny.config.ts`) is still in place for the OpenSearch templates. All three need to be rewritten using `createLambdaHandler` + `Feature.register()` pattern, following the same approach as `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts`.

## Consider adding `response` as second arg to `IHttpRoute.handle`

`packages/event-handler-core/src/features/http/abstractions.ts:21` — currently `handle(request: IHttpRequest): Promise<IHttpResponse>`. Consider whether a mutable response object as a second arg makes sense (Express/Fastify style), e.g. for streaming or incremental header writing. Current return-value style is simpler and sufficient for now.

## Gzip compression of HTTP responses

The old Fastify setup had `@fastify/compress` for response compression. Not yet implemented in the DI-native HTTP layer. Needs a compressing decorator on `HttpRouter` in `event-handler-core`, similar to `SecureHeadersDecorator`.
