# @webiny/db

> Level 3 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/db` defines the storage-driver abstraction used across the monorepo's database packages: the `IStore`/`DbDriver` interfaces (implemented per-database, e.g. `db-dynamodb`'s `DynamoDbDriver`), and a `DbRegistry` DI feature used to register and look up tagged items (e.g. CMS entities) by app/tags. Health is mixed: the type contracts (`IStore`, result types in `store/types.ts`) are genuinely load-bearing and correctly consumed by `db-dynamodb`, but the package's only two concrete runtime classes — `Db` and `Store` — have no consumers anywhere outside the package (only their types are imported), making them dead weight, and the package has zero automated tests.

## Public API
- `DbDriver<T>` / `IStore` and the `StoreValueResult`/`GetValueResult`/etc. result types (`src/index.ts`, `src/store/types.ts`) — the real, widely-depended-on part of the package; implemented by `db-dynamodb`'s `DynamoDbDriver` (confirmed via codegraph, imported as types only, no other implementers found in this audit).
- `DbRegistry` / `DbRegistryFeature` (`src/features/DbRegistry/`) — a generic tag-based registry; consumed by `api-headless-cms-ddb-es`'s `feature.ts` (1 confirmed external consumer) plus the package's own `exports/api/db.ts` re-export.
- `Db` (`src/index.ts:15`) and `Store` (`src/store/Store.ts:20`) — concrete classes; per codegraph and a repo-wide grep for `from "@webiny/db"`, the only external import of this package is `db-dynamodb/src/DynamoDbDriver.ts`, and it imports exclusively the `DbDriver` type and result types — never the `Db` or `Store` classes. `Store` is instantiated only inside `Db`'s own constructor.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | low | `src/features/DbRegistry/DbRegistry.ts:8` | `register()` builds its lookup key with `input.tags.sort().join("-")`, and `Array.prototype.sort()` mutates the array in place, so it reorders the caller-supplied `tags` array as a side effect before storing the same object reference in `this.items[key]`. | A caller that registers an item and then inspects or reuses its own `tags` array afterwards (e.g. to log it, compare it by reference order, or pass it into another API expecting the original order) will observe a silently reordered array. No currently-read call site was found to rely on the original order, so this has not yet caused an observed failure, but it is an unintended mutation of caller-owned data. | medium |

## Duplication
jscpd found no clones within the package (`jscpd-report.json` shows `clones: 0` for every source file, including `DbRegistry.ts`, `Store.ts`, and `store/types.ts`).

## Dead code
- `Db` class (`src/index.ts:15-27`) — codegraph and a repo-wide grep of `from "@webiny/db"` show the only external consumer of this package (`db-dynamodb`) imports solely the `DbDriver` interface and result types, never the `Db` class itself. Codegraph: no consumers of `Db` as a value.
- `Store` class (`src/store/Store.ts:20`) — codegraph shows its only instantiation is inside `Db`'s constructor (`src/index.ts:23`); with `Db` itself unused, `Store` is effectively unreachable from outside the package too. Codegraph: no external consumers.

## Convention issues
None found. The package follows the one-abstraction/one-feature-per-file pattern (`abstractions.ts`, `feature.ts`, `DbRegistry.ts` are cleanly separated), and the `exports/api/db.ts` barrel re-exports only `DbRegistry`/`DbRegistryFeature`, not internal DI wiring.

## Test gaps
- The package has no `__tests__` directory at all — none of `Db`, `Store`, or `DbRegistry` (including its duplicate-registration error, its "more than one item" / "item not found" error paths in `getOneItem`/`getItem`, and the `DbRegistryFeature`'s double-registration guard via `registeredContainers`) has any automated test coverage.

## Recommendations
1. Add unit tests for `DbRegistry` covering the duplicate-key error, the zero/one/many-match branches of `getItem`/`getOneItem`/`getItems`, and the `DbRegistryFeature` double-registration guard (the `registeredContainers` `WeakSet` logic is exactly the kind of subtle DI-lifetime behaviour that regresses silently without a test).
2. Confirm whether `Db`/`Store` are still intended as a public API (e.g. for future non-`db-dynamodb` drivers) or can be removed; if they're meant to stay, add at least one test and one real internal consumer, otherwise delete them to reduce surface area.
3. Fix `DbRegistry.register()` to sort a copy of `tags` (e.g. `[...input.tags].sort()`) instead of mutating the caller's array in place.
