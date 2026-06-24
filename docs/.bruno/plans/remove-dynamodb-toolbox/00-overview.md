# Remove dynamodb-toolbox Implementation Plan

> **Status: COMPLETED (2026-06-24)** — All 7 tasks done. Commit `404398ad9d`.

**Goal:** Replace the `dynamodb-toolbox` library with direct AWS SDK v3 `DynamoDBDocumentClient` calls, keeping all existing public interfaces (`IEntity`, `ITable`, batch classes) stable.

**Architecture:** The `dynamodb-toolbox` library is used only inside `packages/db-dynamodb/src/utils/` and accessed through `toolbox.ts`. We replace it bottom-up: first build the low-level SDK wrapper (`DynamoDocClient`), then an `EntitySchema` that handles marshalling/unmarshalling (replacing what dynamodb-toolbox's Entity does), then rewire each util file (`put.ts`, `get.ts`, `delete.ts`, `query.ts`, `scan.ts`, batch builders) to use the new primitives, and finally update the `Entity`/`Table` wrapper classes. The public `IEntity`/`ITable` interfaces remain unchanged — no consumer code changes.

**Tech Stack:** AWS SDK v3 (`@aws-sdk/lib-dynamodb` via `@webiny/aws-sdk/client-dynamodb`), TypeScript

## Global Constraints

- All imports from `@aws-sdk/*` must go through `@webiny/aws-sdk/client-dynamodb/index.js`.
- No backwards-compat shims — once dynamodb-toolbox is removed, it's removed.
- `IEntity<T>` and `ITable` interfaces must remain unchanged (these are the public API).
- Use `DynamoDBDocument` (the document client), not raw `DynamoDBClient`.
- All existing entity definition shapes (`createStandardEntity`, `createGlobalEntity`, attribute defs) must still work — callers pass the same params.
- One named import per line. No `export default`. Comments use `/* */` style.
- No `??` or `??=` operators.

## Task Sequence

| Task | File | Description |
|------|------|-------------|
| 1 | [01-dynamo-doc-client.md](01-dynamo-doc-client.md) | `DynamoDocClient` — low-level AWS SDK v3 wrapper |
| 2 | [02-entity-schema.md](02-entity-schema.md) | `EntitySchema` — attribute marshalling/unmarshalling |
| 3 | [03-rewire-table.md](03-rewire-table.md) | Rewire `Table` class to use `DynamoDocClient` |
| 4 | [04-rewire-entity-and-utils.md](04-rewire-entity-and-utils.md) | Rewire `Entity` class and low-level utils |
| 5 | [05-rewire-batch-classes.md](05-rewire-batch-classes.md) | Rewire batch classes |
| 6 | [06-external-consumers-and-remove.md](06-external-consumers-and-remove.md) | Update external consumers and remove `dynamodb-toolbox` |
| 7 | [07-clean-ientity-interface.md](07-clean-ientity-interface.md) | Update `IEntity` interface to remove `entity` property |

## Dependency Graph

```
Task 1 (DynamoDocClient) ─┐
                           ├─► Task 3 (Rewire Table) ─┐
Task 2 (EntitySchema) ────┤                           ├─► Task 4 (Rewire Entity + utils) ─► Task 5 (Batch classes) ─► Task 6 (External + remove dep) ─► Task 7 (Clean IEntity)
                           └───────────────────────────┘
```

Tasks 1 and 2 are independent of each other and can be done in parallel.
