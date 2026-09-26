# @webiny/api-graphql

> Level 3 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-graphql` is the framework-level GraphQL layer: it turns registered schema pieces (the DI `GraphQLSchemaBuilder`/`GraphQLSchemaComposer` abstractions, plus the legacy `GraphQLSchemaPlugin`/`CoreGraphQLSchemaFactory`/`GraphQLSchemaFactory` mechanisms) into an executable `graphql-js` schema, exposes a DI `GraphQLEngine` + `GraphQLRoute` (registered on `@webiny/event-handler-core`'s `HttpRouter` at `POST /graphql`), and ships shared helpers used across nearly every `api-*` package: the `Response`/`ListResponse`/`ErrorResponse`/`ListErrorResponse` envelope classes, the `resolve`/`resolveList` wrappers, `NotFoundError`, `createRequestBody`/`processRequestBody` (GraphQL request validation + execution), `ResolverDecoration`/`createResolverDecorator`, and a set of built-in scalar types (`Number`, `Long`, `DateTimeZ`, `RefInput`, `Icon`, `Any`, `Json`, `Date`, `Time`). Overall health is good — the DI wiring is clean and the schema-composition/decorator path is well tested — but several downstream packages reimplement this package's own `resolve`/`Response` wrapper locally instead of reusing it, and `RefInputScalar` has an unhandled-exception edge case.

## Public API
- `Response`/`ListResponse`/`ErrorResponse`/`ListErrorResponse` (`src/responses.ts`) — the standard GraphQL resolver response envelope, used directly and via `resolve`/`resolveList` by many `api-*` packages; also reimplemented locally in a few packages (see Duplication).
- `resolve`/`resolveList` (`src/utils/resolve.ts`) — consumed directly by `api-audit-logs`, `api-workflows` (3 call sites), and `api-headless-cms-tasks`.
- `NotFoundError` (`src/errors.ts`) — consumed by `api-headless-cms`, `api-audit-logs`, `api-workflows`.
- `GraphQLEngineFeature`/`GraphQLEngine`/`GraphQLRoute` (`src/engine/*`) — the DI feature composition roots register to expose the GraphQL HTTP endpoint; `GraphQLSchemaComposer` resolves all `CoreGraphQLSchemaFactory`/`GraphQLSchemaFactory` implementations from the container to build the schema.
- `GraphQLSchemaPlugin`/`createGraphQLSchemaPlugin` (`src/plugins/GraphQLSchemaPlugin.ts`) — legacy plugin-based schema registration; subclassed directly by `api-headless-cms`'s `CmsGraphQLSchemaPlugin` (type `cms.graphql.schema`), which codegraph shows used across ~10+ CMS-related packages (`api-headless-cms-bulk-actions`, `api-headless-cms-tasks`, `api-aco`, `api-record-locking`, etc.) — actively used, not legacy dead weight.
- Built-in scalars (`src/builtInTypes/*`) — e.g. `RefInputScalar` is consumed by `api-core`'s and `api-headless-cms`'s schema factories.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | packages/api-graphql/src/builtInTypes/RefInputScalar.ts:64 | `parseValue`/`serialize` do `"id" in value` without first checking that `value` is an object. | A GraphQL variable typed `RefInput` that is a truthy non-string primitive (e.g. the number `42` or boolean `true`) reaches `"id" in value`; verified in Node that `"id" in 42` and `"id" in true` throw `TypeError: Cannot use 'in' operator...`, so the client gets graphql-js's generic variable-coercion error wrapping a raw JS TypeError instead of the scalar's intended `Error("Invalid RefInput value!")`. | high |

## Duplication
- Internal (jscpd): `packages/api-graphql/src/responses.ts` — `ErrorResponse`'s constructor (lines 32-51) and `ListErrorResponse`'s constructor (lines 74-93) are a 20-line near-verbatim clone (same `{code, message, data, stack}` building + debug-stack logic); `ListErrorResponse` could delegate to `ErrorResponse` instead of duplicating it.
- Cross-package: `packages/api-aco/src/utils/resolve.ts`, `packages/api-website-builder/src/utils/resolve.ts`, and `packages/api-record-locking/src/graphql/resolve.ts` each define their own local `resolve()`/`resolveList()`-style wrapper around this package's own `ErrorResponse`/`Response`/`ListResponse` classes, instead of importing `resolve`/`resolveList` from `@webiny/api-graphql` directly — reimplementing logic this package already exports.
- `builtInTypes/NumberScalar.ts` and `builtInTypes/LongScalar.ts` duplicate the same try/catch-then-`console.log`-then-return-`null` pattern around their respective `parseValue` calls in `serialize`.

## Dead code
None confirmed. `GraphQLSchemaPlugin` was initially suspected of being bypassed by the newer DI-based `GraphQLSchemaComposer`, but codegraph shows it is actively subclassed (`CmsGraphQLSchemaPlugin` and others) with 25+ consumers across `api-headless-cms*`, `api-aco`, and `api-record-locking`.

## Convention issues
- One-abstraction-per-file: `packages/api-graphql/src/features/GraphQLSchemaBuilder/abstractions.ts` defines two separate DI abstractions in a single file (`GraphQLSchemaBuilder` at line 29 and `GraphQLSchemaComposer` at line 41), which AGENTS.md's one-abstraction-per-file convention asks to be split into two files.
- No-inline-types: the same file's `ResolverConfig.resolver` signature (abstractions.ts:9-11) uses an inline `{ parent: TParent; args: TArgs; context: any; info: any }` object type rather than a named interface.

## Test gaps
- `builtInTypes/AnyScalar.ts`, `DateScalar.ts`, `DateTimeScalar.ts`, `IconScalar.ts`, `JsonScalar.ts`, `LongScalar.ts`, and `RefInputScalar.ts` have no dedicated test file (only `DateTimeZScalar`, `NumberScalar`, and `TimeScalar` do) — the `RefInputScalar` edge case above is untested.
- The contextual-schema merge path (`GraphQLContextualSchema`/`mergeSchemas` in `engine/GraphQLEngine.ts`) and `registerLegacyPluginsViaGqlContextEnhancer` are not exercised by the existing `__tests__` suite; `graphql.test.ts` covers the schema-composer/resolver-decorator path but not multiple contextual schemas or the legacy-plugin bridge.

## Recommendations
1. Fix `RefInputScalar`'s `serialize`/`parseValue` to check `typeof value === "object"` before doing `"id" in value`, so non-object truthy primitives raise the intended `"Invalid RefInput value!"` error instead of a raw `TypeError`.
2. Point `api-aco`/`api-website-builder`/`api-record-locking`'s local `resolve.ts` wrappers at `@webiny/api-graphql`'s `resolve`/`resolveList`, and de-duplicate `ErrorResponse`/`ListErrorResponse`'s constructor logic in `responses.ts`.
3. Split `features/GraphQLSchemaBuilder/abstractions.ts` into one file per abstraction, and add tests for the currently-untested built-in scalars (`RefInputScalar` especially).
