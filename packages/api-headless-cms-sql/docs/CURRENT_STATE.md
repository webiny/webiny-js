# api-headless-cms-sql — Current State

Branch: `bruno/feat/api-headless-cms-sql`
Date: 2026-05-26
Test command: `yarn test:sql packages/api-headless-cms`
Test score: **820 passed / 42 failed / 16 skipped (878 total)**

## What This Package Is

SQL storage backend for Webiny Headless CMS. Alternative to `api-headless-cms-ddb` (DynamoDB). Uses Knex.js for query building. Tests run against SQLite (better-sqlite3) in-memory.

## What's Done

All 22 entry storage operations are implemented. Group and model CRUD is done. The full DI feature set is wired up: schema management, operators, filters, table name resolution, field type mapping.

## Package Structure

```
packages/api-headless-cms-sql/src/
├── index.ts                        # registerSqlStorageOperations() — main entry
├── types.ts                        # SqlStorageOperationsFactory, CmsContext
├── features/
│   ├── knexInstance/                # Knex instance abstraction + factory
│   ├── tableNameResolver/          # Tenant-scoped table naming
│   ├── fieldTypeMapper/            # CMS field type → SQL column type
│   ├── schemaRegistry/             # In-memory cache of verified tables
│   ├── groupSchemaManager/         # Group table DDL
│   ├── modelSchemaManager/         # Model table DDL
│   ├── entrySchemaManager/         # Entry table DDL (dynamic per model, ALTER for new fields)
│   ├── sqlOperator/                # 14 SQL WHERE operators (eq, not, in, contains, gt, etc.)
│   └── sqlEntryFilter/             # Filter dispatch (DefaultFilter, ObjectFilter, RefFilter)
├── operations/
│   ├── group/                      # Group CRUD + mappers
│   ├── model/                      # Model CRUD + mappers (triggers entry DDL)
│   └── entry/                      # All 22 entry methods + mappers + whereBuilder
└── utils/
    ├── parseSortField.ts           # "values_fieldName_ASC" → ["fieldName", "asc"]
    ├── parseWhereKey.ts            # "fieldName_not_in" → {fieldId, operator}
    ├── columnName.ts               # storagePathToColumnName, buildFieldColumnMap
    └── cursor.ts                   # Keyset pagination (base64 cursor encode/decode)
```

## Key Design Decisions

- **Table-per-model:** Each CMS model gets its own SQL table with real columns per field.
- **One row per revision:** Boolean `isLatest`/`isPublished` flags (no separate L/P records like DDB).
- **Nested fields flattened:** Object fields decomposed to child columns. 2+ levels deep use hash-based column names. List objects get a single JSON column (not decomposed).
- **Tenant isolation:** Table names are tenant-scoped. Shared tables add `tenant` column + WHERE filter.
- **Entry-level meta sync:** Fields like `status`, `locked`, etc. synced to ALL revisions via `UPDATE WHERE entryId = ?`.
- **Keyset pagination:** Cursor = base64(JSON of sort values + id tiebreaker).
- **Ref fields:** Companion `__entryId` column for filtering (stores just the entryId, no revision suffix).
- **JSON round-trip:** `entryToRow` JSON.stringifies objects/arrays. `rowToEntry` checks first char `{`/`[` to decide parse.
- **Null object collapse:** After reconstructing values from columns, nested objects where every property is null become null.
- **Schema ensure on each op:** Each storage op calls `resolveTable(model)` first; SchemaRegistry makes it a no-op after first call.
- **Never drop columns:** storageId format prevents reuse, columns only ever added.

## Coding Conventions (Enforced)

- Arrow functions for Knex query callbacks: `(qb) => { qb.where(...) }`, never `function(this)`.
- One named import per line.
- No `export default`, always named exports.
- Class `Impl` suffix, export const matches abstraction name.
- `/* */` comments, not `/** */`.
- `public`/`protected`/`private` + `readonly` on all class properties.
- No one-liners with `await` + `return` — assign to const, then return.
- Break chained calls across lines.

## Test Infrastructure

- `yarn test:sql` env: `WEBINY_STORAGE=sql,ddb` (DDB fallback for apiCore features).
- SQLite in-memory via `better-sqlite3` (needs `dependenciesMeta.better-sqlite3.built: true` in root `package.json`).
- `setupAfterEnv.js` drops ALL SQLite tables in `beforeEach` + bumps `globalThis.__schemaRegistryVersion` to invalidate SchemaRegistry cache.
- Knex instance created once in `setupFile.js`, shared across all test handlers.

---

## Biggest Blocker: Storage Transforms

### The Problem

The CMS applies `EntryToStorageTransform` BEFORE values reach our SQL storage operations. Two transforms break SQL queries:

1. **`LongTextStorageTransform`** — compresses text into `{ compression: "gzip", value: "base64..." }`.
2. **`RichTextStorageTransform`** — same compression on rich text (structured JSON, e.g., Lexical nodes).

Our `entryToRow` mapper receives already-compressed values and JSON-stringifies them into columns. SQL `LIKE`/`contains` queries on these columns match against the base64 gibberish, not the actual text.

Also affected: **`JsonStorageTransform`** — compresses JSON objects. Worth checking if any tests rely on JSON field querying.

### Where Transforms Live

```
packages/api-headless-cms/src/features/storage/
├── abstractions/
│   ├── StorageTransform.ts             # IStorageTransform interface + createAbstraction("Cms/Storage/Transform/Field")
│   └── StorageTransformRegistry.ts     # IStorageTransformRegistry + createAbstraction("Cms/Storage/Transform/Registry")
├── StorageTransformRegistry.ts         # Impl: collects all transforms via { multiple: true }, finds by fieldType
├── feature.ts                          # StorageFeature: registers all 9 transforms + registry
└── fields/
    ├── DefaultStorageTransform.ts      # fieldType "*" — pass-through (no-op)
    ├── LongTextStorageTransform.ts     # fieldType "long-text" — gzip compress
    ├── RichTextStorageTransform.ts     # fieldType "rich-text" — gzip compress
    ├── JsonStorageTransform.ts         # fieldType "json" — gzip compress
    ├── DateStorageTransform.ts         # fieldType "datetime" — Date → ISO string (fine for SQL)
    ├── ObjectStorageTransform.ts       # fieldType "object" — recursive child transforms
    ├── DynamicZoneStorageTransform.ts  # fieldType "dynamic-zone" — recursive child transforms
    ├── CompressedTextStorageTransform.ts  # fieldType "compressed"
    └── EncryptedTextStorageTransform.ts   # fieldType "encrypted"
```

### How the Registry Works

`StorageTransformRegistry` constructor receives all `StorageTransform.Interface` instances via `{ multiple: true }` DI resolution. Its `.get(fieldType)` method does `Array.find()` — **first match wins**.

The CMS `StorageFeature` registers the default transforms. Our SQL feature (`cms.storageOperations.sql`) registers AFTER the CMS features. So if we add more `StorageTransform` implementations, they'd appear AFTER the defaults in the `{ multiple: true }` array, meaning `Array.find()` would still return the default (compressed) one.

### Override Strategy — Not Yet Decided

Options discussed:

1. **Register SQL-specific transforms** in the SQL feature. Problem: `Array.find()` returns the first match (the default compressed one). Would need the registry to be aware of ordering, or we'd need to re-register with a higher-priority mechanism.

2. **Decorate the `StorageTransformRegistry`** to intercept `.get("long-text")` and `.get("rich-text")` and return our pass-through versions instead. This is clean and doesn't fight the DI ordering.

3. **Replace the entire registry** — register a custom `StorageTransformRegistry` implementation in the SQL feature that filters out the compressed transforms before delegating to the default logic.

### Rich Text — Open Question

Rich text fields contain structured data (array of Lexical editor nodes). Storing uncompressed JSON is straightforward, but:
- Should we extract a plain-text representation for full-text search?
- Or just store the raw JSON and rely on JSON column queries?
- This was flagged as "we'll discuss the specifics" — decision pending.

### Long Text — Straightforward

Pass-through (no-op) transform. Store the plain string. SQL LIKE works.

---

## Remaining 42 Test Failures (Categorized)

### Category 1: Compressed Text Search (~8 failures)
Files: `contentEntries.test.ts`, `filtering.test.ts`, `search.test.ts`, `sdkGraphql/cmsSearch.test.ts`
Cause: `description_contains` and similar queries on gzip-compressed long-text fields.
Fix: Storage transform override (the blocker above).

### Category 2: Entry Ordering (~5 failures)
Files: `contentEntries.test.ts`, `entryPagination.test.ts`
Cause: Multi-entry list queries return entries in wrong order. Likely sort/cursor issues.

### Category 3: Meta Field Timestamps (~4 failures)
Files: `contentEntriesOnByMetaFields*.test.ts`
Cause: `modifiedOn` timestamp identical between revisions; publish/unpublish timing.

### Category 4: Reference Field Resolution (~3 failures)
Files: `references.test.ts`
Cause: Wrong revision of referenced entry returned. Ref filter uses `__entryId` companion column but latest-revision resolution may be off.

### Category 5: Model Clone / Private (~3 failures)
Files: `contentModel.clone.test.ts`, `contentModel.crud.private.test.ts`
Cause: Likely entry schema not created for cloned model, or private model visibility issue.

### Category 6: Group Slug Collision (~2 failures)
File: `contentModelGroup.crud.test.ts`
Cause: Test isolation — slug collision between test runs. Table cleanup may not fully reset.

### Category 7: Plugin Content Models (~10 failures)
File: `pluginsContentModels.test.ts`
Cause: Largest failure cluster. Plugin-registered models may not trigger schema creation, or field mapping issues.

### Category 8: Searchable JSON (~6 failures)
Files: `fields/searchableJson.manage.test.ts`, `fields/searchableJson.read.test.ts`
Cause: JSON field searching — likely the `JsonStorageTransform` compression issue.

### Category 9: Misc (1-2 each)
- `dynamicZoneField.test.ts` — dynamic zone storage/retrieval
- `predefinedValues.test.ts` — predefined value filtering
- `sorting.test.ts` — customSorter column doesn't exist
- `export.structure.test.ts` / `import.structure.test.ts` — structure export/import
- `contentEntry.deleteMultiple.test.ts` — deleted entry still returns
- `contentEntry.publishOldPublishedRevisions.test.ts`
- `contentEntry.restore.test.ts`
- `security/basePermissions.test.ts`

---

## DI Registration Flow

```
registerSqlStorageOperations(config)
  → createFeature("cms.storageOperations.sql")
    → KnexInstanceFeature.register(container, knex)
    → TableNameResolverFeature.register(container)
    → SchemaRegistryFeature.register(container)
    → FieldTypeMapperFeature.register(container)
    → GroupSchemaManagerFeature.register(container)
    → ModelSchemaManagerFeature.register(container)
    → EntrySchemaManagerFeature.register(container)
    → SqlOperatorFeature.register(container)
    → SqlEntryFilterFeature.register(container)
    → container.registerFactory(StorageOperationsFactory, ...)
```

The SQL feature registers AFTER the CMS `StorageFeature` (which registers the default transforms). This matters for the override strategy.

## Entry Transform Flow (How Values Reach SQL Ops)

```
CMS Use Case (e.g., CreateEntry)
  → CreateEntryRepository.execute()
    → entryToStorageTransform(context, model, entry)
      → For each field: registry.get(field.type).toStorage({ value })
        → LongTextStorageTransform compresses text → { compression, value }
        → RichTextStorageTransform compresses rich text → { compression, value }
    → storageOperations.entries.create(model, { entry, storageEntry })
      → Our SQL code receives `storageEntry` with compressed values
        → entryToRow() JSON-stringifies the compressed object into a column
```

The `storageEntry` that arrives at our SQL ops is already transformed. We don't control what happens inside `entryToStorageTransform` unless we override the transforms in the registry.

## Files to Know

| File | Why |
|------|-----|
| `api-headless-cms/src/features/storage/feature.ts` | Where default transforms are registered |
| `api-headless-cms/src/features/storage/StorageTransformRegistry.ts` | Registry impl — `Array.find()` by fieldType |
| `api-headless-cms/src/features/storage/abstractions/StorageTransform.ts` | Transform interface + abstraction token |
| `api-headless-cms/src/utils/entryStorage.ts` | `entryToStorageTransform` / `entryFromStorageTransform` |
| `api-headless-cms-sql/src/index.ts` | SQL feature registration — where overrides would go |
| `api-headless-cms-sql/src/operations/entry/mappers.ts` | `entryToRow` / `rowToEntry` — SQL row mapping |
| `api-headless-cms-sql/src/operations/entry/whereBuilder.ts` | `applyWhere` / `applySearch` — SQL query filters |

## Next Steps

1. **Decide on rich text storage format** with Bruno.
2. **Implement storage transform overrides** for long-text, rich-text (and possibly json).
3. **Run tests** to see how many of the 42 failures are fixed by uncompressed storage.
4. **Work through remaining failures** by category.
