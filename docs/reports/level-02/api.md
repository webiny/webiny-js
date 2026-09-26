# @webiny/api

> Level 2 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api` is the foundational package almost every backend API package in the monorepo depends on (directly or transitively): it defines the base `Context` class/interface that all request-scoped contexts extend, a `Benchmark`/`BenchmarkPlugin` pair for optional per-request timing instrumentation, `createConditionalPluginFactory` for conditionally-loaded plugin factories, a set of compile-time-only `InterfaceGenerator` type helpers used to build GraphQL "where" filter types, and a small `testing/` toolkit (`LifecycleEventTracker`, `sleep`, `until`) used by dozens of other packages' test suites. The actively-used parts are small, simple, and well tested (`Benchmark` in particular has good coverage). However, a large fraction of the package's actual code — the `Context.waitFor` method, `Context.getResult`/`hasResult`/`setResult`, the `args` field, and the whole `decorateContext` helper — has zero consumers anywhere in the monorepo, and the `InterfaceGenerator` helpers are duplicated near-verbatim in `@webiny/app`.

## Public API
- `Context` (`packages/api/src/Context.ts:29`) — the base request context class. Codegraph/grep: dozens of `api-*` packages extend or reference its `Context`/`ContextInterface` type (e.g. `api-headless-cms`, `api-graphql`, `api-websockets`, `api-scheduler`, `api-workflows`, `db-dynamodb`, `webhooks`), making it one of the most widely depended-on types in the backend.
- `Benchmark`/`BenchmarkPlugin`/`BenchmarkAbstraction` (`packages/api/src/Benchmark.ts:31`, `packages/api/src/plugins/BenchmarkPlugin.ts:7`) — constructed unconditionally by every `Context`; exercised by `packages/api-headless-cms/__tests__/contentAPI/benchmark.test.ts` and the package's own `__tests__/benchmark.test.ts`.
- `createConditionalPluginFactory` (`packages/api/src/createConditionalPluginFactory.ts:5`) — consumed by `packages/api-file-manager-s3/src/assetDelivery/threatDetection/createThreatDetectionPluginLoader.ts`.
- `IdInterfaceGenerator`/`DateInterfaceGenerator`/`IdentityInterfaceGenerator`/`NumericInterfaceGenerator`/`TruthfulInterfaceGenerator`/`TextInterfaceGenerator` (`packages/api/src/helpers/InterfaceGenerator/*.ts`) — type-only helpers consumed by `api-headless-cms`, `api-record-locking`, `webhooks`, `background-tasks`.
- `LifecycleEventTracker`/`sleep`/`until` (`packages/api/src/testing/*.ts`) — used across `__tests__` helpers in roughly a dozen `api-*` packages (`api-core`, `api-aco`, `api-file-manager`, `api-website-builder`, `api-scheduler-aws`, etc.).
- `decorateContext` (`packages/api/src/decorateContext.ts:5`) — exported from the package barrel but, per grep across the whole monorepo, never imported or called anywhere, including inside `@webiny/api` itself. Dead code (see below).

## Bugs
None found with a confirmed, concrete failure scenario. (The unused code described under Dead code has no observable runtime effect since nothing calls it.)

## Duplication
`packages/api/src/helpers/InterfaceGenerator/{id,date,identity,numeric,truthful}.ts` are byte-for-byte identical to the same-named files in `packages/app/src/helpers/InterfaceGenerator/` (confirmed with `diff -rq`); only each directory's `index.ts` (re-export barrel) differs, and `@webiny/api` additionally has a `text.ts` that `@webiny/app` doesn't. This is the same type-generation logic (GraphQL "where"-filter operator shapes) maintained in two places with no shared source; a change to one (e.g. adding a new operator) has to be made in both by hand or they silently drift. No jscpd clones were reported within this package itself (0 duplicates in the jscpd report).

## Dead code
A large portion of `Context.ts` has no consumers anywhere in the monorepo (verified with targeted grep for `.waitFor(`, `.hasResult(`, `.getResult(`, `.setResult(`, and `.args` across all packages, excluding unrelated same-named methods from testing libraries and an unrelated React `Await` component that codegraph's name-based matching initially surfaced as false positives):
- `Context.waitFor` (`packages/api/src/Context.ts:68-158`, ~90 lines) — the dynamic-property "wait for these context properties to be set, then run a callback" mechanism. Zero callers.
- `Context.getResult`/`hasResult`/`setResult` and the backing `_result` field (`Context.ts:30,56-66`) — zero callers.
- `Context.args` field (`Context.ts:31`) — declared, never read or written anywhere, including inside `@webiny/api` itself.
- `decorateContext` (`packages/api/src/decorateContext.ts`, whole file) — exported from the package's public barrel (`src/index.ts:3`), zero callers anywhere in the monorepo (grep for `decorateContext` outside its own definition/export finds nothing).

Together these amount to roughly half of `Context.ts`'s lines and one entire additional file being unreachable, unexercised code sitting on the most widely-depended-on class in the backend.

## Convention issues
None found. Files are one-class/one-concern per file, and the DI abstraction (`BenchmarkAbstraction`) follows the naming convention (interface, `createAbstraction` call, `namespace ... Interface` type alias).

## Test gaps
`__tests__/Context.test.ts` only asserts that `new Context(...)` constructs correctly (initial `plugins`/`benchmark`/`WEBINY_VERSION` state); it does not exercise `waitFor`, `getResult`/`hasResult`/`setResult`, or `decorateContext` — though per the Dead code findings above, those are unused, so the right fix is likely removal rather than adding tests for them. `createConditionalPluginFactory` has no direct unit test (only indirect exercise through its one consumer in `api-file-manager-s3`). `Benchmark`/`BenchmarkPlugin` are well covered by `__tests__/benchmark.test.ts`.

## Recommendations
1. Remove the dead code identified above — `Context.waitFor`, `getResult`/`hasResult`/`setResult`/`_result`/`args`, and the entire `decorateContext.ts` file/export — after a final grep/codegraph check closer to removal time in case a consumer is added between audit and cleanup. This shrinks the most widely-depended-on class in the backend to just its actually-used surface.
2. De-duplicate `InterfaceGenerator` between `@webiny/api` and `@webiny/app`: move the shared operator-shape types to one package (likely `@webiny/utils`, given both `api` and `app` already depend on it) and have both re-export from there.
3. Add a direct unit test for `createConditionalPluginFactory` (condition true/false branches) — it's small, but currently only indirectly exercised through one consumer.
