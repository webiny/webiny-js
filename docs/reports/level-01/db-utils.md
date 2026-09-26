# @webiny/db-utils

> Level 1 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/db-utils` is a small, single-purpose package that exposes one DI feature — the
value-filter registry (`ValueFilter`, `ValueFilterRegistry`, `ValueFilterFeature`) — with 11
registered filter implementations (`eq`, `gt`, `gte`, `lt`, `lte`, `between`, `in`, `and_in`,
`contains`, `fuzzy`, `startsWith`) that evaluate a single field value against a query operator
in memory. It is the low-level, storage-agnostic filtering primitive that the SQL, DynamoDB
and generic headless-CMS storage layers use to implement `where`-clause filtering outside the
database engine (~19 files import from `@webiny/db-utils`, including
`api-headless-cms-storage`, `api-headless-cms-ddb`, `api-headless-cms-sql`, and
`db-dynamodb`, which simply re-exports it). Overall health is good — the package is small,
each operator is well unit-tested for its `matches()` behavior, and it correctly declares only
`@webiny/error`/`@webiny/feature` as dependencies (no `@webiny/plugins`, no reimplementation of
lower-level utilities). The one real risk is the `canUse()`/`matches()` two-step contract on
`ValueFilter.Interface`: nothing enforces callers to check `canUse()` first, and
`StartsWithFilter` will throw on a non-string, non-empty `compareValue`.

## Public API

- `ValueFilterRegistry` (`abstractions/ValueFilterRegistry.ts`) — `get(operation)` /
  `getAll()`; resolved via DI and consumed directly by
  `api-headless-cms-storage/src/filtering/filter.ts`,
  `api-headless-cms-storage/src/filtering/expressions/createExpressions.ts`,
  `api-headless-cms-sql/src/operations/entry/*`, and `db-dynamodb`'s `FilterUtil`
  (`packages/db-dynamodb/src/feature/FilterUtil/FilterUtil.ts`, which re-exports the
  abstractions verbatim rather than duplicating them).
- `ValueFilter` abstraction + the 11 `createImplementation` filter classes
  (`valueFilter/filters/*.ts`) — never imported by name outside the package; consumers always
  go through `ValueFilterRegistry.get(operation)`.
- `ValueFilterFeature` (`valueFilter/feature.ts`) — registers all 11 filters plus the registry;
  used wherever `where`-clause filtering needs to be wired into the DI container.

## Bugs

| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|----------|----------|---------|-------------------|------------|
| 1 | medium | `packages/db-utils/src/valueFilter/filters/StartsWithFilter.ts:26` | `matches()` calls `compareValue.toLowerCase()` unconditionally. `canUse()` (lines 10-15) only rejects `compareValue === "" \| null \| undefined`; any other non-string value (e.g. a number) passes `canUse()` and then hits `.toLowerCase()`, which does not exist on it. | A "startsWith" filter reached with a non-string `compareValue` (e.g. through `api-headless-cms-storage/src/filtering/filter.ts:25`'s `filter.filter.canUse(...)` guard, which only calls `matches()` after `canUse()` returns true) throws `TypeError: compareValue.toLowerCase is not a function` instead of returning a clean `false`/no-match, crashing the whole in-memory filter pass for that page of results. | medium — reproducible from the code itself; did not trace every upstream GraphQL schema path to confirm a non-string `compareValue` can currently reach this filter for every field type it's wired to |

## Duplication

Per the jscpd report (`jscpd-db-utils/jscpd-report.json`), the `valueFilter/filters/` files
duplicate their `is()`/`canUse()` boilerplate pairwise:

- `LtFilter.ts:4-15`, `LteFilter.ts:4-15`, `GteFilter.ts:4-15`, `GtFilter.ts:4-15` — the same
  12-line `is`/`canUse` block repeated across all four comparison filters (jscpd flags
  `LteFilter` at 150% duplication since it matches all three siblings).
- `BetweenFilter.ts:5-16` ↔ `InFilter.ts:5-16` — same 12-line boilerplate.
- `ContainsFilter.ts:52-66` ↔ `FuzzyFilter.ts:5-19` — same 15-line `is`/`canUse` block.
- `AndInFilter.ts:5-27` ↔ `InFilter.ts:5-27` — a more substantial 23-line duplication: both
  filters throw an identical `WebinyError` ("must be an array!") for a non-array
  `compareValue` and differ only in `.some(...)` vs `.every(...)` in the final line.

This is largely a consequence of the project's one-class/one-file convention (each operator
needs its own file for DI registration), so it is low-priority structural duplication rather
than a functional defect. `AndInFilter`/`InFilter` are the best candidate to extract a shared
"compareValue must be an array" validation helper without breaking that convention.

## Dead code

No exports appear unused. `ValueFilterRegistry.getAll()` has no direct test coverage and no
call site was confirmed by grep (all other `getAll()` hits in the repo belong to unrelated
registries with the same method name), so it is a low-confidence dead-code candidate rather
than a confirmed one.

## Convention issues

None found. Every filter follows the one-abstraction-per-file / DI naming convention (file
name matches the exported implementation, e.g. `GtFilter.ts` exports `GtFilter` wrapping
`GtFilterImpl`), and `ValueFilterRegistry.ts`/`ValueFilter.ts` correctly separate abstraction
from implementation.

## Test gaps

- `canUse()` is never called in any test file (`__tests__/valueFilter/*.test.ts` all invoke
  `matches()` directly), so the `StartsWithFilter` bug above, and more generally the
  canUse/matches contract, has zero test coverage.
- `ValueFilterRegistry.getAll()` is not exercised by any test (only `get()`, indirectly, via
  each filter's test helper `__mocks/registry.ts`).
- No test passes a non-string `compareValue` to `StartsWithFilter`, `EqFilter` (which uses
  loose `==` and array-vs-scalar branching), or `ContainsFilter`'s `createValues`/
  `createCompareValues` helpers with unusual input shapes (e.g. nested objects).

## Recommendations

1. Guard `StartsWithFilter.matches()` (or tighten `canUse()`) so a non-string `compareValue`
   returns `false` instead of throwing, and add a test for that case.
2. Extract the shared "compareValue must be an array" validation (and the `.some`/`.every`
   branch) used by `AndInFilter` and `InFilter` into one small helper to remove the 23-line
   duplication flagged by jscpd.
3. Add direct tests for `canUse()` across the filters (especially `StartsWithFilter`, the only
   one with non-trivial `canUse` logic) and for `ValueFilterRegistry.getAll()`.
