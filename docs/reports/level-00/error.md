# @webiny/error

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
A minimal custom `Error` subclass (`WError`, re-exported as `WebinyError`) that adds an optional `code` string and a generic `data` payload, with two constructor overloads (positional args or an options object) and a static `from()` helper for wrapping/annotating an existing error. It's one of the most widely used level-0 packages in the repo (~260 files import it) and is the standard error type used for structured, code-tagged errors across the codebase. Overall health is good — the code is small and correct — but it has zero test coverage despite its size of use.

## Public API
- `WError` (default export) / `WebinyError` (named export) (`packages/error/src/Error.ts:7`) and its `ErrorOptions<TData>` type — constructed either as `new WebinyError(message, code?, data?)` or `new WebinyError({ message, code, data })`.
- `WError.from(err, options?)` (`Error.ts:28`) — builds a new `WError` from a partial existing error plus optional overrides, merging `data`.
- Consumers: ~260 files import `@webiny/error` across the monorepo (grep count); codegraph confirms usage e.g. in `packages/api-core/src/features/wcp/WcpContext/WcpContext.ts` (`updateSeats`, `updateTenants`, `ensureCanUseFeature` all throw `WError`). This is a foundational, cross-cutting package — effectively every API/CRUD package uses it for typed errors.

## Bugs
None found. Both constructor overloads and `from()` were traced by hand: when `message` is `undefined` (e.g., `from()` called with no message anywhere), `super(undefined)` correctly resolves to an empty `message` string per the `Error` constructor spec — not a crash or `"undefined"` string, as might be feared from a quick read.

## Duplication
None — jscpd report shows 0 clones across the package's 2 source files (`index.ts`, `Error.ts`, 40 lines total).

## Dead code
None found — both `WError`/`WebinyError` and `.from()` are actively used by the ~260 consumer files.

## Convention issues
None meaningful — the package is a single class in its own file (`Error.ts`) with a thin barrel (`index.ts`), consistent with the one-abstraction-per-file convention, though it predates the current DI naming pattern (this is a plain class, not a DI abstraction/implementation pair, which is appropriate here since it's a data type, not an injectable service).

## Test gaps
No tests exist at all (`find packages/error -iname "*test*"` returns nothing) despite being one of the most widely depended-upon level-0 packages in the repo. The two constructor overloads and the `from()` merge-and-override logic (particularly the `data: Object.assign({}, err.data, options.data)` merge order) are the most important untested behavior — a regression here would silently corrupt error `data` payloads across every package that uses `WError.from()`.

## Recommendations
1. Add unit tests for `WError`'s two constructor overloads and for `WError.from()` (empty message, code/data precedence, data merge order) — given the ~260-file blast radius, this is the single highest-leverage test gap found across all six packages in this audit.
2. No functional changes needed otherwise; the implementation is small and correct.
3. Consider replacing the `// TODO in TS 4.6` comments (`Error.ts:14,18,22`) — the repo's TypeScript is well past 4.6 now (per `package.json` devDependencies elsewhere in the monorepo), so the deferred cleanup could actually be done, though this is a minor nit rather than a functional issue.
