# @webiny/api-audit-logs-sql

> Level 10 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-audit-logs-sql` is the Knex/SQL implementation of `@webiny/api-audit-logs`'s `IStorage` abstraction: a single flat `webiny_audit_logs` table (created lazily via `@webiny/api-core-sql`'s `TableManager`) with straightforward `fetch`/`store`/`list` methods and simple string-column filters (`app`, `entity`, `action`, `entityId` prefix match, `createdBy` substring match on a JSON blob, `createdOn` range, offset-free `id`-based keyset pagination). It is small (266 lines, 2 files) with zero jscpd duplication. `fetch()` and `list()` both correctly scope every query with `.where("tenant", ...)`, but one security finding was identified in the `store()` upsert path — see private notes. Compared to the DynamoDB backend, filtering here is done with plain SQL predicates (including a `LIKE` substring match against a JSON-stringified `createdBy` column, which is a correctness compromise rather than a data-model concept shared with the DDB backend) and pagination uses the raw record `id` as the cursor rather than an encoded composite key — a legitimate, if less generic, design divergence rather than a bug.

## Public API
- `registerAuditLogsSqlStorageOperations` (`src/index.ts:12`) — the composition entry point that registers a `SqliteStorage` instance as `AuditLogsStorage` in the DI container; used by the SQL/standalone request-stack wiring wherever the audit-logs feature is composed with a SQL backend (codegraph: consumed by project templates using `@webiny/api-event-handler-standalone-sql`).
- `SqliteStorage` (`src/SqliteStorage.ts:67`) — implements `api-audit-logs`'s `IStorage`; only consumer is `registerAuditLogsSqlStorageOperations` above.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|----------|----------|---------|-------------------|------------|
| 1 | high | `packages/api-audit-logs-sql/src/SqliteStorage.ts` | Security finding SEC-56 — see private notes. | — | medium |
| 2 | low | `src/SqliteStorage.ts:165-166` | `createdBy` filtering matches via `LIKE '%"id":"<createdBy>"%'` against the JSON-stringified `createdBy` column instead of a real structured-data query. | If a `createdBy` id value happens to be a substring of another user's serialized `createdBy` object (e.g. one id is a prefix of another, or the JSON key ordering changes), the filter can match unintended rows or miss the intended one; this is a correctness footgun inherent to storing structured data as an opaque string column and filtering it with `LIKE`. | low |

## Duplication
None found — jscpd reports zero clones in this package, and no logic here duplicates the DynamoDB backend's key-derivation scheme (the two backends intentionally use different pagination/filtering strategies appropriate to their storage engines).

## Dead code
None found — both exports (`registerAuditLogsSqlStorageOperations`, `SqliteStorage`) are reachable from the package's sole composition path.

## Convention issues
None meaningful — `SqliteStorage.ts` matches its exported class name, one abstraction per file, and the barrel exports only the single registration function.

## Test gaps
The package has no test files at all — `__tests__/__api__/` contains only harness scaffolding (`setupFile.js`, `presets.js`, `setupAfterEnv.js`), with zero actual test suites covering `fetch`/`store`/`list`, the tenant-scoping behavior, or the upsert path described in Bug #1.

## Recommendations
1. Address security finding SEC-56 (see private notes).
2. Add tests for `list()`'s filter combinations (especially the `entityId` prefix match and `createdBy` substring match) and for `store()`.
3. Consider storing `createdBy` as a normalized column (or a small side table) rather than filtering a JSON blob with `LIKE`, to remove the correctness risk in Bug #2.
