# @webiny/api-audit-logs-ddb

> Level 10 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-audit-logs-ddb` is the DynamoDB implementation of `@webiny/api-audit-logs`'s `IStorage` abstraction: a single-table design with a `Converter` (compression + date/JSON marshalling) and an `AccessPatternHandler` that dispatches `list()` calls across ten hand-written access patterns (one default query on the base table plus nine GSI-backed patterns for app/entity/action/createdBy/createdOn combinations), each computing its own partition/sort keys. It correctly derives every partition key from `T#${tenant}#...`, so tenant scoping is baked into the key design for every access pattern (consistent with the level-9 `api-audit-logs` finding that tenant is always server-derived). Health is otherwise mixed: the ten access-pattern classes are heavily copy-pasted (jscpd shows 9 clone pairs among them), and there is a real, confirmed bug — the DynamoDB entity schema never declares the `expiresAt` attribute that the `Converter` sets on every write, so `@webiny/db-dynamodb`'s `strictSchemaCheck: false` write path silently strips it before the `PutItem` call, meaning the 60-day TTL retention policy documented in `api-audit-logs` never actually takes effect for the DynamoDB backend. The package also has zero unit/integration tests beyond a test-harness scaffold.

## Public API
- `AuditLogsDdbFeature` (`src/AuditLogsDdbFeature.ts:12`) and `registerAuditLogsDdbStorageOperations` (`src/index.ts:11`) — the two composition entry points that register a `Storage` instance as `AuditLogsStorage` in the DI container; used by the AWS/standalone request-stack wiring wherever the audit-logs feature is composed with a DynamoDB backend.
- `Storage`/`createStorage` (`src/Storage.ts:24,113`) — implements `api-audit-logs`'s `IStorage` (`fetch`/`store`/`list`); the only consumer is `AuditLogsDdbFeature`/`registerAuditLogsDdbStorageOperations` above (codegraph: 2 callers).
- `createAccessPatterns` (`src/accessPatterns/index.ts:18`) and `AccessPatternHandler` (`src/AccessPatternHandler.ts:13`) — internal to `Storage`, not exported from the package barrel.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|----------|----------|---------|-------------------|------------|
| 1 | high | `src/entity.ts:70-161` vs `src/Converter.ts:77` | `createEntity`'s `attributes` map (passed to `@webiny/db-dynamodb`'s `createEntity`) declares `PK`, `SK`, `GSI_TENANT`, `GSI1_PK..GSI9_SK`, and `data`, but never declares `expiresAt`, even though `IAuditLogsEntityAttributes` types it as a required `number` and `Converter.oneToStorage` (`src/Converter.ts:77`) always sets `expiresAt: convertExpiresAtToUnixTimestamp(auditLog.expiresAt)` on the item passed to `entity.put()`. | `@webiny/db-dynamodb`'s `put()` wrapper (`packages/db-dynamodb/src/utils/put.ts:17-20`) calls `entity.put(item, { strictSchemaCheck: false })`; in `dynamodb-toolbox`, `strictSchemaCheck: false` sets `shouldFilterUnmappedFields = true`, and `normalizeData` (`node_modules/dynamodb-toolbox/dist/cjs/lib/normalizeData.js`) drops any field not present in the schema's `attributes` map before building the `PutItem` request. Because `expiresAt` is not in the schema, it is silently stripped from every audit-log item actually written to DynamoDB, so the table's native TTL (which must point at an `expiresAt` attribute) never fires — audit logs accumulate indefinitely instead of expiring after the documented 60 days, contradicting the retention policy `api-audit-logs`'s `AuditLogsContextValueImpl.createAuditLog` computes via `convertExpiresAtDaysToDate(deleteLogsAfterDays)`. | high |
| 2 | low | `src/cursorSchema.ts:6-16` | `decodeCursor` (from `@webiny/db-dynamodb`, already flagged at level-4 for its `"ascii"` base64 decode) returns an already-`JSON.parse`d value, but `cursorSchema.ts` calls `JSON.parse(decoded)` on it a second time, which throws (caught by the local `try/catch`) and falls through to `return decoded`. Functionally harmless (falls back correctly) but is dead/confusing double-parsing logic. | N/A — no observable behavior change, purely a code-clarity issue. | medium |

## Duplication
jscpd reports 9 clone pairs (18-26 duplicated lines each) among the nine GSI access-pattern classes in `src/accessPatterns/` (`EntityIdAccessPattern.ts`, `CreatedOnAccessPattern.ts`, `CreatedByAccessPattern.ts`, `AppEntityCreatedByAccessPattern.ts`, `AppEntityActionCreatedByAccessPattern.ts`, `AppEntityActionAccessPattern.ts`, `AppEntityAccessPattern.ts`, `AppCreatedByAccessPattern.ts`, `AppAccessPattern.ts`). Each class differs only in its `createPartitionKey`/`handles()` logic; the `list()`/`createKeys()` boilerplate (call `createOptions`, call `this.query`, optionally `populateResult`) is repeated near-verbatim across all nine. This is a natural candidate for a shared template-method helper in `BaseAccessPattern` (e.g. a `buildPartitionKey`-driven default `list()`), which would remove most of the ~200 duplicated lines jscpd flags.

## Dead code
None found with a single-query check — `Storage`, `AccessPatternHandler`, and all ten access patterns are reachable from `createStorage`, which is the package's sole real consumer chain.

## Convention issues
None meaningful — file names match their exported classes (`Storage.ts`/`Storage`, `Converter.ts`/`Converter`, `AccessPatternHandler.ts`/`AccessPatternHandler`), one abstraction per file, and the barrel (`src/index.ts`) exports only the two composition entry points plus the feature config type.

## Test gaps
The package has no test files at all — `__tests__/__api__/` contains only `setupFile.js`/`presets.js`/`setupAfterEnv.js` (test-harness scaffolding), with zero actual test suites. Given the package has ten hand-written access patterns, key-derivation logic, and the TTL/expiry write path described in Bug #1, this is a significant coverage gap: none of the access-pattern selection logic, cursor round-tripping, or the `expiresAt` write path is exercised by any automated test.

## Recommendations
1. Fix Bug #1: add `expiresAt: { type: "number" }` to the `attributes` map in `src/entity.ts` so the TTL field is actually persisted (and add a test asserting the raw stored item contains `expiresAt`).
2. Add unit tests for `AccessPatternHandler.find`/`getDefaultPattern` and at least one GSI access pattern's `createKeys`/`list`, since none of this logic is currently tested.
3. Deduplicate the nine GSI access-pattern classes behind a shared partition-key-builder helper in `BaseAccessPattern` to remove the ~200 duplicated lines jscpd flags.
