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
