# @webiny/logger

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
A thin wrapper around `pino` that re-exports its types/helpers and adds a `getLogLevel`/`createPinoLogger`/`configureLogger`/`getLogger` singleton-logger convenience API with `LOG_LEVEL`-env-var support. The code itself is fine, but the package appears to have **no consumers anywhere in the monorepo** — the CLI's actual logging (`packages/cli-core/src/services/LoggerService/LoggerService.ts`) reimplements the same "wrap pino + resolve a log level" logic independently, using `pino` directly rather than this package.

## Public API
- `getLogLevel`, `createPinoLogger`, `configureLogger`, `getLogger`, `RedactOptions`, plus re-exports of most of `pino`'s runtime and type exports (`packages/logger/src/index.ts`).
- Consumers: **0**. A repo-wide search for `@webiny/logger` (import or `package.json` dependency) outside the package itself returns nothing — no other package imports it or declares it as a dependency.

## Bugs
None found. `getLogLevel` correctly validates against a fixed `levels` list and falls back to the default; `getLogger`/`configureLogger` implement a straightforward module-level singleton.

## Duplication
No internal clones (jscpd report: 0 duplicated lines across the single 102-line `src/index.ts`). Cross-package duplication of *concept*, not exact code: `packages/cli-core/src/services/LoggerService/LoggerService.ts` independently wraps `pino` and resolves a log level from an env var + fallback (`DEFAULT_LOG_LEVEL`), duplicating what `createPinoLogger`/`getLogLevel` already do here, but with a different env var name (`WEBINY_CLI_LOG_LEVEL` vs. this package's `LOG_LEVEL`) and no validation against the known pino levels list.

## Dead code
The entire package is effectively unused: no file in the repo imports `@webiny/logger`, and no `package.json` outside `packages/logger` itself lists it as a dependency (verified by grep across `packages/**` for both import statements and `package.json` entries). This is the most significant finding for this package.

## Convention issues
`export interface RedactOptions` (`packages/logger/src/index.ts:58`) is unused dead code within an already-unused package — it was defined for a commented-out `LoggerOptions` override (`index.ts:64-66`) that was never applied, so `RedactOptions` has no reference anywhere.

## Test gaps
No tests exist. Given the package has no consumers, this is low priority unless/until something starts depending on it.

## Recommendations
1. Decide whether `@webiny/logger` is meant to be the CLI's standard logging entrypoint going forward; if so, migrate `cli-core`'s `LoggerService` to build on `createPinoLogger`/`getLogLevel` instead of duplicating that logic with a different env var and no level validation.
2. If there's no plan to adopt it, consider removing the package (or marking it clearly experimental/unused) — it's currently pure maintenance overhead with zero blast radius.
3. Remove the dead `RedactOptions` interface (and the commented-out `LoggerOptions` override above it) regardless of the above decision — it references a feature that was never wired up.
