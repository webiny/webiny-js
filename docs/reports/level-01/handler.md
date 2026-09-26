# @webiny/handler

> Level 1 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/handler` is a small legacy package — its own `package.json` description ("our small wrapper around fastify to ease handling of http requests") and a two-line stub file (`src/exports/api.ts`, "Route abstraction was removed with the Fastify migration. Use IHttpRoute from @webiny/event-handler-core instead.") show it predates the newer `@webiny/event-handler-core` HTTP stack and has been mostly hollowed out by that migration. What remains and is genuinely load-bearing is `RegisterExtensionPlugin`/`createRegisterExtensionPlugin`/`registerExtensions` — the mechanism nearly every storage-operations/extension package (`db-dynamodb`, `api-core-sql`, `api-opensearch`, `api-aco-*`, `api-audit-logs-*`, `api-file-manager*`, `webhooks`, …) uses to register itself into the request DI container at `register()` time — plus a `ResponseHeaders` typed header map used by a handful of file-manager asset-delivery reply classes, and a `Reply` DI abstraction used once (a cookie-setting use case in `api-core`). The rest of the package's surface (`stringifyError`, the `Request` DI abstraction, `exports/api.ts`) has zero consumers anywhere in the monorepo. Health is otherwise fine — no bugs found, tiny surface, no jscpd clones — but the package is largely dead weight around one genuinely important export.

## Public API
- `registerExtensions` / `RegisterExtensionPlugin` / `createRegisterExtensionPlugin` (`packages/handler/src/plugins/RegisterExtensionPlugin.ts:9,21,35`) — the core extension-registration mechanism. `registerExtensions` is called directly from `packages/api-event-handler-core/src/registerApiRequestStack.ts:142` and `packages/api-event-handler-standalone-sql/src/createWebinyApiHandler.ts:57` (the two real request-stack composition points), and `createRegisterExtensionPlugin` is used to build extension plugins in roughly 15 packages (`db-dynamodb`, `api-core-sql`, `api-opensearch`, `api-aco-ddb`/`api-aco-sql`, `api-audit-logs-ddb`/`-sql`, `api-file-manager`, `api-file-manager-s3`, `webhooks`, plus generated project-template extension files). `RegisterExtensionPlugin` itself (via `instanceof` checks) is additionally consumed by ~15 test-helper `bridgeLegacyPlugins.ts` files across the API packages.
- `ResponseHeaders` (`packages/handler/src/ResponseHeaders.ts:27`) — a `Map`-backed typed header builder with a functional `set(header, value | (prev) => value)`. Used by 7 files under `api-file-manager`/`api-file-manager-s3` asset-delivery reply/redirect strategies (e.g. `S3RedirectAssetReply.ts`, `StreamAssetReply.ts`).
- `Reply` (DI abstraction, `packages/handler/src/abstractions/Reply.ts:4`) — used by exactly one consumer, `packages/api-core/src/features/security/authentication/AuthenticationContext/SetIdTokenCookie.ts` (injects `Reply.Interface` to set the auth cookie).
- `stringifyError` (`packages/handler/src/stringifyError.ts:6`) — exported from the package but has **zero** consumers anywhere in the monorepo (verified by grep for all import sites of `@webiny/handler`; only its own re-export in `index.ts` and its own test reference it).
- `Request` (DI abstraction, `packages/handler/src/abstractions/Request.ts:4`) — exported from the package but has **zero** consumers anywhere in the monorepo (no file registers or resolves it via `@webiny/handler`'s `Request`).

## Bugs
None found. The package's remaining logic (`ResponseHeaders`, `stringifyError`, `registerExtensions`'s flatten/filter/dispatch loop) is small and correct for its inputs.

## Duplication
No jscpd clones reported (`jscpd-handler/jscpd-report.json`: 0 total duplicates, 0 duplicate entries) — the package is too small/varied internally to have any.

Cross-package: `ResponseHeaders` (typed `Map`-based header collection with a functional setter) and `@webiny/event-handler-core`'s `HttpResponseBuilder` (`packages/event-handler-core/src/features/http/HttpResponseBuilder.ts`) both solve "accumulate HTTP response headers," from two different architectural eras (pre- and post-Fastify-migration). They are not literal/jscpd-detectable duplicates (different shapes — a header-only map vs. a full status/body/cookie response builder), but they are two parallel abstractions for a fully overlapping concern, kept alive only because a handful of file-manager asset-delivery classes still use the older one.

## Dead code
- `stringifyError` (`packages/handler/src/stringifyError.ts:6`, exported from `index.ts:6`) — no consumers found anywhere in the monorepo outside its own test (`packages/handler/__tests__/utils.test.ts`). Confirmed by grepping every `@webiny/handler` import site for `stringifyError`.
- `Request` DI abstraction (`packages/handler/src/abstractions/Request.ts:4`, exported from `index.ts:7`) — no file resolves or registers it via `@webiny/handler`'s `Request` anywhere in the monorepo (its sibling `Reply` abstraction does have a real consumer; `Request` does not).
- `packages/handler/src/exports/api.ts` — the entire file is two comment lines ("Route abstraction was removed with the Fastify migration. Use IHttpRoute from @webiny/event-handler-core instead.") with no exports at all, and nothing imports the `@webiny/handler/exports/api` subpath. It is inert leftover from the Fastify migration.

## Convention issues
- The package's `package.json` `"description"` ("Our small wrapper around fastify to ease handling of http requests for the system.") is stale — the Fastify wrapper it describes was removed (see `exports/api.ts` above), and the package's only heavily-used export today (`registerExtensions`) has nothing to do with HTTP/Fastify.
- No other convention violations found — DI abstractions (`Request`, `Reply`) correctly use `createAbstraction` + the `namespace { Interface }` pattern, and `RegisterExtensionPlugin` correctly extends `@webiny/plugins`' `Plugin` with a static `type` and no inline classes passed to factory helpers.

## Test gaps
- `RegisterExtensionPlugin` / `createRegisterExtensionPlugin` / `registerExtensions` — despite being the package's most consumed export — have no dedicated test file inside `packages/handler/__tests__/`. They are only exercised indirectly through consumer packages' own test suites (e.g. `packages/languages/__tests__/cmsManageRoute.test.ts`, `extensionRegistration.test.ts`). A direct unit test for `registerExtensions`'s flatten/filter/`type`-match/`apply()` dispatch logic (including the `plugin?.type !== RegisterExtensionPlugin.type` skip branch, and nested-array flattening) is missing at the package's own level.
- `Reply`/`Request` DI abstractions have no tests of their own (reasonable, since they're one-line `createAbstraction` wrappers with no logic).

## Recommendations
1. Delete the confirmed-dead exports: `stringifyError`, the `Request` abstraction, and the empty `exports/api.ts` stub — none has a single consumer in the monorepo, and keeping them adds surface area to a package that is otherwise just "the extension-registration mechanism."
2. Add a direct unit test for `registerExtensions`/`RegisterExtensionPlugin` inside `packages/handler/__tests__/` — it is the package's most widely depended-on behavior and currently has zero first-party test coverage.
3. Update `package.json`'s stale "wrapper around fastify" description, and consider whether `ResponseHeaders`'s remaining 7 consumers in `api-file-manager`/`api-file-manager-s3` should move to `@webiny/event-handler-core`'s `HttpResponseBuilder` so this package can eventually be reduced to just the extension-registration mechanism (or be merged into `@webiny/event-handler-core` outright).
