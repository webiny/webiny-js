# Schema Management

How SQL tables are created, altered, and maintained throughout the lifecycle of CMS models and fields.

---

## Table Lifecycle

### Creation

Tables are created when:
1. **Application startup** — all model definitions (UI-created and plugin-registered) are collected, diffed against the current database state, and missing tables/columns are created.
2. **Model CRUD** — when a user creates a new model in the admin UI, the table is created immediately.

Entry operations never trigger table creation.

### Modification

Tables are altered (columns added) when:
1. **Application startup** — new fields detected in model definitions that don't have corresponding columns.
2. **Model field CRUD** — user adds a new field in the admin UI, ALTER TABLE ADD COLUMN runs immediately.

### Deletion

**Tables are never dropped.** Deleting a CMS model leaves the table in the database. This is intentional — data preservation over cleanup.

---

## Startup Schema Sync

At application startup, a single process collects all model definitions and ensures every model has a correctly-structured table.

### Sources

Both sources must participate:
- **UI models** — stored in the model CRUD database (model table)
- **Plugin models** — registered in code via CMS plugins

If plugin models are excluded, their tables won't exist and entry operations will fail.

### Process

1. Load all model definitions from both sources
2. For each model, resolve the table name (tenant-scoped or shared)
3. If table doesn't exist — CREATE TABLE with all meta columns + field columns
4. If table exists — diff current fields against stored schema, ADD COLUMN for new fields
5. Update stored schema record in `cms_table_schemas`
6. Mark table as verified in the in-memory SchemaRegistry

### Concurrency

Because schema changes only happen at startup (single process) and model CRUD (single request), there are no concurrent ALTER TABLE races. In containerized deployments, migrations run once.

If coordination is ever needed (e.g., multiple instances starting simultaneously), a global key-value store can be used as a lock.

---

## Dead Column Accumulation

When a user deletes a field from a model, the corresponding column is **not** dropped. It remains in the table with NULL values for all rows.

### Why Not Drop

- `storageId` is immutable and encodes the field type (`text@title`, `number@price`). A deleted field's storageId is never reused.
- Dropping columns is destructive and irreversible.
- NULL columns are cheap in all three dialects.

### Growth Pattern

A model with active content modeling (frequent field additions/deletions) accumulates dead columns over time. Example: 30 active fields + 20 dead fields after a year of iteration = 50 columns where 20 are always NULL.

### Mitigation

Later-phase **cleanup tool** that:
- Audits tables for columns not referenced by any current model field
- Reports dead columns with their creation date and NULL percentage
- Optionally drops confirmed dead columns (with user confirmation)

---

## Tables Are Never Dropped

When a user deletes a CMS model, the table persists. Same rationale as dead columns — data preservation.

### Growth Pattern

A tenant experimenting with models (create, test, delete, repeat) accumulates orphaned tables. Each table retains its data.

### Mitigation

Same cleanup tool as dead columns — detect tables with no corresponding model definition, report, optionally drop.

---

## ALTER TABLE Error Handling

ALTER TABLE can fail for various reasons. Each must be handled explicitly.

### Idempotent Errors (Swallow)

**Column already exists** — another process or a previous startup already added the column. Safe to ignore.

| Dialect | Detection |
|---|---|
| PostgreSQL | Error code `42701` |
| MySQL | Error code `1060` |
| SQLite | Error message contains `duplicate column name` |

### Real Errors (Bubble Up)

These indicate actual problems and should fail the model update operation:

| Error | Cause | User Impact |
|---|---|---|
| Disk full | No space for table modification | Model update fails; admin notified |
| Permission denied | DB user lacks ALTER privilege | Model update fails; operational issue |
| Connection lost | Network/DB failure mid-operation | Model update fails; retry on next startup |
| Lock timeout | Another long-running operation holds the lock | Model update fails; retry |

### Error Catalog

Need to build a per-dialect mapping of error codes to handling strategies. This is an implementation task — catalog all possible ALTER TABLE errors in PostgreSQL, MySQL, and SQLite documentation.

---

## Column Naming

Columns are named from the field's `storageId`, which encodes the type and field identifier:

| Nesting Level | Column Name | Example |
|---|---|---|
| Top-level | `storageId` as-is | `text@title` |
| 1 level nested | `parent__child` | `object@addr__text@city` |
| 2+ levels nested | `topParent__{hash8}__leaf` | `dynamicZone@zone__a1b2c3d4__text@city` |

The `@` character in column names requires quoting — Knex handles this via `??` identifier placeholders in raw queries and automatic quoting in query builder methods.

The 8-char SHA-256 hash for deep nesting prevents column name length issues while maintaining a deterministic mapping.

---

## Schema Registry

In-memory cache that tracks which tables have been verified (schema matches model definition) in the current process.

### Purpose

Avoid re-running the schema diff on every entry operation. Once a table is verified at startup, subsequent entry operations skip the check entirely.

### Invalidation

`globalThis.__schemaRegistryVersion` counter. Bumping the version clears the verified set, forcing re-verification on next access. Used in tests (`beforeEach` resets all tables and bumps the version).

In production, invalidation is unnecessary — startup verifies everything once, and model CRUD updates the registry inline.
