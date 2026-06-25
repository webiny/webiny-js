# db-dynamodb DI Features — Implementation Plan

> **Status: COMPLETED (2026-06-25)** — All 11 tasks done. Plus bonus: api-aco-ddb converted to full DI feature, toolbox.ts deleted.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `packages/db-dynamodb` internals into DI features (DynamoDbDocumentClient, DynamoDbTableFactory, DynamoDbEntityFactory, DynamoDbBatchFactory) so consumers resolve factories from DI instead of manually wiring `documentClient` and calling `createTable()`/`createStandardEntity()`.

**Architecture:** Four layered DI abstractions — table factory creates document clients, entity factory creates entities via batch factory delegation. All share one `DynamoDBDocument` connection resolved from the existing `DynamoDBClient` DI abstraction.

**Tech Stack:** TypeScript, `@webiny/di` (`createAbstraction`), `@webiny/feature/api` (`createFeature`), AWS SDK v3 (`@webiny/aws-sdk/client-dynamodb`)

**Spec:** `docs/.bruno/specs/2026-06-25-db-dynamodb-di-features-design.md`

## Global Constraints

- ES modules only (no CommonJS/require)
- One class per file
- One named import per line (one identifier per import statement)
- `import { createAbstraction } from "@webiny/feature/api"` for abstractions
- `createFeature` for internal package feature registration; `Abstraction.createImplementation` for consumer-side wiring
- Namespace pattern: `export namespace Foo { export type Interface = IFoo }`
- No `export default` — always named exports
- No `??` or `??=` operators — use `||` and explicit if-checks
- No JSDoc-style `/** */` — use `/* */` for multi-line comments
- Comments end with period
- Class properties always use `public`/`protected`/`private` + `readonly` where applicable
- Run full before-commit checklist after code changes
- Existing 203 tests in `packages/db-dynamodb` must keep passing throughout

## Task Sequence

| Task | File | Parallel? | Description |
|------|------|-----------|-------------|
| 1 | [01-document-client-feature.md](01-document-client-feature.md) | Yes (1-4) | DynamoDbDocumentClient — interface + class |
| 2 | [02-batch-factory-feature.md](02-batch-factory-feature.md) | Yes (1-4) | DynamoDbBatchFactory — abstraction + impl + feature |
| 3 | [03-entity-factory-feature.md](03-entity-factory-feature.md) | Yes (1-4) | DynamoDbEntityFactory — abstraction + attributes + impl + feature |
| 4 | [04-table-factory-feature.md](04-table-factory-feature.md) | Yes (1-4) | DynamoDbTableFactory — abstraction + impl + feature |
| 5 | [05-internal-rewiring.md](05-internal-rewiring.md) | No | Move folders, update Entity/utils, wire registration, delete old files |
| 6 | [06-migrate-webiny-core-ddb.md](06-migrate-webiny-core-ddb.md) | Yes (6-11) | Migrate `webiny` + `api-core-ddb` |
| 7 | [07-migrate-cms-ddb.md](07-migrate-cms-ddb.md) | Yes (6-11) | Migrate `api-headless-cms-ddb` |
| 8 | [08-migrate-cms-ddb-es.md](08-migrate-cms-ddb-es.md) | Yes (6-11) | Migrate `api-headless-cms-ddb-es` |
| 9 | [09-migrate-opensearch.md](09-migrate-opensearch.md) | Yes (6-11) | Migrate `api-opensearch` + `api-elasticsearch-tasks` |
| 10 | [10-migrate-remaining.md](10-migrate-remaining.md) | Yes (6-11) | Migrate `api-aco-ddb`, `api-audit-logs-ddb`, `api-websockets-ddb`, `api-file-manager` |
| 11 | [11-verification.md](11-verification.md) | No | Full build + test verification |
