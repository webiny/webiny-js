# @webiny/feature

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/feature` is the small foundational library that defines Webiny's "feature" composition
pattern for both backend (`@webiny/feature/api`) and admin/frontend (`@webiny/feature/admin`)
code: `createFeature` (a named `register`/`resolve` bundle used with DI), `createAbstraction` (a
thin wrapper around `@webiny/di`'s `Abstraction`), a functional `Result`/`ResultAsync` monad for
explicit success/failure handling, and an abstract `BaseError` class used as the base for
essentially all typed domain errors in the codebase. It has no internal `@webiny/*` workspace
dependency (only the external npm package `@webiny/di`), which is why it sits at level 0, but it is
extremely widely consumed — well over 2,000 files import from `@webiny/feature/api` or
`@webiny/feature/admin`. Overall health is good (clean, small, well-documented), but it ships one
real, high-impact bug in `BaseError` (see Bugs) that silently discards stack traces for every
subclass in the monorepo, and it has zero automated tests.

## Public API

- `createFeature` (`src/api/createFeature.ts`, `src/admin/createFeature.ts`) — builds a
  `{ name, register(container, ...) }` (api) or `{ name, register, resolve }` (admin) object.
  The api variant also tags the returned object with `Reflect.defineMetadata("wby:isFeature", true, …)`,
  which is read by `packages/project/src/utils/registerExtension.ts` to dispatch feature
  registration generically in backend composition roots. Consumed by ~810+ `feature.ts` files
  across nearly every `api-*` and `app-*` package (background-tasks, api-file-manager-standalone,
  api-audit-logs, app-website-builder-workflows, remote-components, webhooks, etc.).
- `createAbstraction` (`src/createAbstraction.ts`) — thin wrapper over `@webiny/di`'s
  `Abstraction`. Used alongside `createFeature` in the same files to declare DI abstractions.
- `Result` / `ResultAsync` (`src/api/Result.ts`, `src/api/ResultAsync.ts`) — a small `ok`/`fail`
  monad (`map`, `mapError`, `flatMap`, `match`) and its async counterpart. Backend-only (not
  exported from `admin`).
- `BaseError` (`src/api/BaseError.ts`, `src/admin/BaseError.ts`) — abstract base class for domain
  errors, requiring subclasses to declare a `code` and optional generic `data`. Extended by at
  least 45 error classes across the monorepo (api-mailer, background-tasks, api-file-manager,
  etc.).
- `Container`, `createDecorator`, `createImplementation` — re-exported pass-throughs from
  `@webiny/di` for convenience, both from `admin/index.ts` and `api/index.ts`.
- Note: the separate, structurally-similar `createFeature`/`FeatureDefinition` in
  `packages/app/src/shared/di/createFeature.ts` (832 callers via the `webiny/api` project alias)
  is **not** this package — see Duplication.

## Bugs

| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|----------|----------|---------|-------------------|------------|
| 1 | high | `packages/feature/src/api/BaseError.ts:15` and `packages/feature/src/admin/BaseError.ts:15` (`this.stack = options?.stack;`) | The line runs unconditionally, so when the (optional) `options` argument is omitted the native stack trace that `Error`'s own constructor just captured via `super(input.message)` is immediately overwritten with `undefined`. | Any `new SomeError(...)` call that doesn't pass `options: { stack }` (i.e. the normal case) produces an error whose `.stack` is `undefined`. Confirmed: grepping all 45 `extends BaseError` subclasses in the repo (api-mailer, background-tasks, api-file-manager, etc.) shows **none** of them ever supply `options.stack`, so every thrown domain error in the codebase currently loses its stack trace, which breaks logging/observability (pino logger fields, error trackers, GraphQL error formatters) that rely on `err.stack`. | high |
| 2 | low | `packages/feature/src/api/Result.ts:68-75` (`value` getter) | On a failed `Result`, the getter calls `console.error(this.error)` and then throws. Every unsafe `.value` access on an expected/handled failure (e.g. inside a `try { … } catch` block) unconditionally spams stderr in addition to the thrown exception, with no way for callers to opt out. | Code that intentionally uses `.value` + try/catch as a control-flow shortcut around a `Result` (rather than `match`/`isOk`) gets a duplicate, unsuppressable `console.error` for every expected failure. | medium |

## Duplication

- jscpd flags a 13-line clone between `packages/feature/src/admin/BaseError.ts:1-13` and
  `packages/feature/src/api/BaseError.ts:1-13` (the interface + conditional-data type + full
  constructor body, ~65-73% of each file). This is exactly the code that contains Bug #1 above —
  the duplication is why the bug exists twice instead of once.
- Cross-package duplication (outside jscpd's per-package scope): `packages/app/src/shared/di/createFeature.ts`
  re-implements the same `{ name, register, resolve }` `FeatureDefinition<TExports, TParams>`
  shape as `packages/feature/src/admin/createFeature.ts`, with one behavioral difference — the
  `app` version requires `resolve` and calls it directly, while the `feature/admin` version makes
  `resolve` optional and falls back to `undefined as TExports`. Two independently-typed
  "createFeature" abstractions with the same name and near-identical shape exist in the monorepo;
  they are structurally compatible (so objects from one satisfy the other's type), which invites
  accidental mixing.

## Dead code

- `packages/feature/src/Brand.ts` (`Brand<T, B>` branded-type helper) is not re-exported from
  `admin/index.ts`, `api/index.ts`, or either `exports/*.ts` file, and a repo-wide search for any
  usage of it turns up nothing outside its own declaration. It is unreachable through the
  package's public surface and unused anywhere in the monorepo.

## Convention issues

- `admin/BaseError.ts` follows the repo's "reach abstractions through the namespace" rule
  (`ai-context/code-style/reach-abstractions-through-the-namespace.md`): it declares `IErrorOptions`
  and re-exposes it as `BaseError.ErrorOptions` via a merged namespace. `api/BaseError.ts` does not
  follow the same pattern — it exports a plain, non-namespaced `ErrorOptions` interface with no `I`
  prefix, and that type isn't re-exported from `api/index.ts` at all, so it's only reachable via a
  deep import of the internal file. The two near-identical files (see Duplication) diverge in
  naming/reachability convention for no apparent reason.
- `Result.ts:70` uses `console.error` in code that is effectively backend/API-facing library code,
  rather than routing through a logger, in the spirit of `ai-context/code-style/no-console-in-backend.md`
  (the rule's literal wording targets `api-*`-named packages, so this is a soft match, not a
  direct violation).

## Test gaps

- The package has no `__tests__` directory at all — zero automated tests for `Result`, `ResultAsync`,
  `BaseError`, `createFeature` (either variant), or `createAbstraction`. Given the package is a
  level-0 dependency consumed by thousands of files, this is a significant gap; a single test
  asserting `new (class extends BaseError {...})({message: "x"}).stack` is truthy would have
  caught Bug #1 immediately.

## Recommendations

1. Fix the stack-trace bug in both `api/BaseError.ts` and `admin/BaseError.ts`: only assign
   `this.stack` when `options?.stack` is explicitly provided, e.g.
   `if (options?.stack) { this.stack = options.stack; }`, so the native captured trace survives
   the common case where callers don't pass `options`.
2. Add a minimal test suite covering `Result`/`ResultAsync` (`ok`/`fail`/`map`/`flatMap`/`match`)
   and `BaseError` (including a regression test for the stack-trace bug), given the package's huge
   blast radius and current zero test coverage.
3. Reconcile the two `BaseError.ts` copies and the two/three `createFeature` implementations
   (`feature/admin`, `feature/api`, `packages/app/shared/di`) toward one shared, namespaced
   convention, and drop or export the unused `Brand.ts`.
