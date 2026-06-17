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

## Gzip compression of HTTP responses

The old Fastify setup had `@fastify/compress` for response compression. Not yet implemented in the DI-native HTTP layer. Needs a compressing decorator on `HttpRouter` in `event-handler-core`, similar to `SecureHeadersDecorator`.
