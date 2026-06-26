# CMS SQL Entry Storage Operations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 22 `CmsEntryStorageOperations` methods in `packages/api-headless-cms-sql`, replacing the current stubs that throw "Not implemented."

**Architecture:** One SQL row per entry revision with `isLatest`/`isPublished` boolean flags. Real columns per CMS field (flattened for nested objects/dynamic zones). DI-based operator and filter features mirroring the DDB-ES pattern. Keyset pagination with base64-encoded cursors. SQL WHERE/ORDER BY for filtering and sorting (no in-memory processing). Cross-dialect via Knex (no PostgreSQL-specific features).

**Tech Stack:** TypeScript, Knex.js, Webiny DI (`createAbstraction`/`createImplementation`/`createFeature`)

**Key paths (all relative to `packages/api-headless-cms-sql/src/`):**
- `features/sqlOperator/` — SQL operator abstraction, registry, and implementations (eq, in, contains, gt, etc.)
- `features/sqlEntryFilter/` — field-type-specific filter abstraction, registry, and implementations (default, object, ref)
- `features/entrySchemaManager/` — existing, needs modification for nested fields + new columns
- `operations/entry/` — entry storage operations (types, mappers, WHERE builder, 22 methods)
- `utils/` — column name mapping, cursor codec
- `index.ts` — DI wiring

**Reference implementations:**
- DDB entry ops: `packages/api-headless-cms-ddb/src/operations/entry/index.ts`
- DDB-ES filtering: `packages/api-headless-cms-ddb-es/src/operations/entry/elasticsearch/filtering/`
- DDB-ES operator plugins: `packages/api-opensearch/src/plugins/operator/`
- DDB-ES filter features: `packages/api-headless-cms-ddb-es/src/features/CmsEntryOpenSearchFilter/`

**Key types (from `packages/api-headless-cms/src/types/types.ts`):**
- `CmsEntryStorageOperations` (line 1270) — the 22-method interface
- `CmsEntry` (line 273) — entry with all meta fields
- `CmsStorageEntry` (line 460) — extends CmsEntry with `[key: string]: any`
- `CmsEntryListWhere` (line 557) — WHERE clause type with operators
- `CmsEntryStorageOperationsListResponse` (line 1240) — list return type
- `StorageOperationsCmsModel` (line 159) — model with value key converters

**Conventions:**
- Abstractions: `createAbstraction<T>("Cms/Sql/Name")` in `abstractions.ts` (or `abstractions/` folder when multiple)
- Implementations: class uses `Impl` suffix, export const matches abstraction name
- DI naming: clean names everywhere, alias with `as` only for same-file conflicts
- One named import per line
- `/* */` comment style, not `/** */`
- No `export default`
- Always `public`/`protected`/`private` + `readonly` on class properties

---

## Review Corrections (applied post-review)

The following corrections override the original task descriptions. Executing agents MUST apply these.

### RC-1: `publish` must update old published status + `live` field (affects Task 12)

When publishing a revision:
1. Old published row: set `isPublished = false` AND `status = 'unpublished'`
2. Target row: full update with `isPublished = true`, `status = 'published'`
3. ALL rows for the entryId: set `live = JSON({version: targetVersion})`
4. ALL rows for the entryId: sync entry-level meta

### RC-2: `unpublish` must clear `live` field (affects Task 12)

When unpublishing: set `live = null` on ALL rows for the entryId (in addition to updating the target row).

### RC-3: `ENTRY_LEVEL_META_FIELDS` must exclude `createdBy`/`createdOn` (affects Task 9)

`createdBy` and `createdOn` are immutable — set once at entry creation. Remove them and their sub-columns (`createdBy_id`, `createdBy_displayName`, `createdBy_type`) from `ENTRY_LEVEL_META_FIELDS`. The correct sync set is:

```typescript
export const ENTRY_LEVEL_META_FIELDS = [
    "modifiedOn", "savedOn", "deletedOn", "restoredOn",
    "firstPublishedOn", "lastPublishedOn",
    "modifiedBy_id", "modifiedBy",
    "savedBy_id", "savedBy",
    "deletedBy_id", "deletedBy",
    "restoredBy_id", "restoredBy",
    "firstPublishedBy_id", "firstPublishedBy",
    "lastPublishedBy_id", "lastPublishedBy"
] as const;
```

### RC-4: `deleteRevision` — no auto-promote of published, clear `live` (affects Task 12)

When deleting a published revision:
- The row is deleted (taking `isPublished` with it)
- No other revision is auto-promoted to published
- Set `live = null` on all remaining rows (entry is now unpublished)

### RC-5: Shared tables support — add `tenant` column and filtering (affects Tasks 3, 9, 12)

When `WEBINY_SHARED_TABLES=true`, multiple tenants share the same table. Changes needed:
- **Task 3**: Add `table.string("tenant").index()` to `applyEntryMetaColumns`
- **Task 9**: Add `tenant: string | null` to `IEntryRow` and `"tenant"` to `ENTRY_META_COLUMNS`
- **Task 12**: Every query must add `.where("tenant", model.tenant)` when shared tables is enabled. The `resolveTable` helper should return both the table name and a query builder that includes the tenant filter. The `createEntriesStorageOperations` params should include `sharedTables: boolean` (from `TableNameResolverConfig`).

### RC-6: `IModelField` needs `parents` array for deep nesting (affects Tasks 7, 11)

Add to `IModelField` in Task 7:
```typescript
parents: { fieldId: string; storageId: string }[];
```

Update `buildModelFields` in Task 11 to:
- Recursively walk object/dynamicZone fields, building the parents chain
- Key the field map by dot-joined `fieldId` paths (e.g., `values.address.city`)
- Prefix all user fields with `values.` (matching DDB/DDB-ES pattern)
- System fields have `parents: []`

### RC-7: Memoize field maps per model (affects Tasks 11, 12)

`buildModelFields` and `getFieldColumns` should be memoized by `modelId` within the `createEntriesStorageOperations` closure. Build once per model, reuse on every query. Use a `Map<string, ...>` cache.

### RC-8: `parseWhereKey` explicit operator ordering (affects Task 11)

Operators MUST be checked longest-first:
```typescript
const OPERATORS = [
    "not_contains", "not_startsWith", "not_between", "not_in",
    "contains", "startsWith", "between",
    "gte", "gt", "lte", "lt", "in", "not"
];
```

---

## File Structure

```
packages/api-headless-cms-sql/src/
├── utils/
│   ├── parseSortField.ts                          # (existing)
│   ├── columnName.ts                              # NEW: storageId path → SQL column name
│   └── cursor.ts                                  # NEW: keyset cursor encode/decode
├── features/
│   ├── entrySchemaManager/
│   │   ├── abstractions.ts                        # (existing, no changes)
│   │   ├── EntrySchemaManager.ts                  # MODIFY: add isLatest, isPublished, location_folderId,
│   │   │                                          #   missing identity columns, nested field walking
│   │   ├── columnBuilder.ts                       # (existing, no changes)
│   │   └── feature.ts                             # (existing, no changes)
│   ├── sqlOperator/
│   │   ├── abstractions/
│   │   │   ├── SqlOperator.ts                     # NEW: ISqlOperator abstraction
│   │   │   ├── SqlOperatorRegistry.ts             # NEW: ISqlOperatorRegistry abstraction
│   │   │   └── index.ts                           # NEW: barrel
│   │   ├── SqlOperatorRegistry.ts                 # NEW: registry implementation
│   │   ├── operators/
│   │   │   ├── EqualOperator.ts                   # NEW
│   │   │   ├── NotOperator.ts                     # NEW
│   │   │   ├── InOperator.ts                      # NEW
│   │   │   ├── NotInOperator.ts                   # NEW
│   │   │   ├── ContainsOperator.ts                # NEW
│   │   │   ├── NotContainsOperator.ts             # NEW
│   │   │   ├── GtOperator.ts                      # NEW
│   │   │   ├── GteOperator.ts                     # NEW
│   │   │   ├── LtOperator.ts                      # NEW
│   │   │   ├── LteOperator.ts                     # NEW
│   │   │   ├── BetweenOperator.ts                 # NEW
│   │   │   ├── NotBetweenOperator.ts              # NEW
│   │   │   ├── StartsWithOperator.ts              # NEW
│   │   │   └── NotStartsWithOperator.ts           # NEW
│   │   └── feature.ts                             # NEW
│   └── sqlEntryFilter/
│       ├── abstractions/
│       │   ├── SqlEntryFilter.ts                   # NEW: ISqlEntryFilter abstraction
│       │   ├── SqlEntryFilterRegistry.ts           # NEW: ISqlEntryFilterRegistry abstraction
│       │   └── index.ts                            # NEW: barrel
│       ├── SqlEntryFilterRegistry.ts               # NEW: registry implementation
│       ├── fields/
│       │   ├── DefaultFilter.ts                    # NEW
│       │   ├── ObjectFilter.ts                     # NEW
│       │   └── RefFilter.ts                        # NEW
│       └── feature.ts                              # NEW
├── operations/
│   └── entry/
│       ├── types.ts                                # NEW: IEntryRow, ENTRY_META_COLUMNS
│       ├── mappers.ts                              # NEW: entryToRow, rowToEntry
│       ├── whereBuilder.ts                         # NEW: CmsEntryListWhere → Knex WHERE
│       └── index.ts                                # MODIFY: implement all 22 methods
└── index.ts                                        # MODIFY: wire new features + entry ops params
```

---

### Task 1: Column name utility

Creates the deterministic mapping from CMS field storage paths to SQL-safe column names.

**Files:**
- Create: `src/utils/columnName.ts`

**Column naming rules:**
- Top-level field: storageId as-is (e.g., `text@title`)
- 1-level nested: `parent__leaf` (e.g., `object@addr__text@city`)
- 2+ levels nested: `topParent__{hash8}__leaf` (e.g., `dynamicZone@zone__a1b2c3d4__text@city`)
- Knex handles quoting for `@` characters

- [ ] **Step 1: Create `src/utils/columnName.ts`**

```typescript
import { createHash } from "crypto";

/* Compute an 8-char hex hash of a string. */
const hash8 = (input: string): string => {
    return createHash("sha256").update(input).digest("hex").slice(0, 8);
};

/*
 * Convert a CMS field storage path to a SQL column name.
 * - Top-level: "text@title" -> "text@title"
 * - 1 level: ["object@addr", "text@city"] -> "object@addr__text@city"
 * - 2+ levels: ["dynamicZone@z", "object@addr", "text@city"]
 *   -> "dynamicZone@z__a1b2c3d4__text@city"
 */
export const storagePathToColumnName = (segments: string[]): string => {
    if (segments.length === 1) {
        return segments[0];
    }

    if (segments.length === 2) {
        return `${segments[0]}__${segments[1]}`;
    }

    const topParent = segments[0];
    const leaf = segments[segments.length - 1];
    const intermediates = segments.slice(1, -1).join(".");
    const intermediateHash = hash8(intermediates);

    return `${topParent}__${intermediateHash}__${leaf}`;
};

export interface IFieldColumnEntry {
    columnName: string;
    storageId: string;
    fieldId: string;
    type: string;
    path: string[];
}

/*
 * Recursively walk model fields and build a map of fieldId path -> column name.
 * Handles object fields (settings.fields) and dynamic zone templates
 * (settings.templates[].fields).
 */
export const buildFieldColumnMap = (
    fields: {
        storageId: string;
        fieldId: string;
        type: string;
        settings?: Record<string, any>;
    }[],
    parentPath: string[] = []
): IFieldColumnEntry[] => {
    const entries: IFieldColumnEntry[] = [];

    for (const field of fields) {
        const currentPath = [...parentPath, field.storageId];

        if (field.type === "object" && field.settings?.fields) {
            const nested = buildFieldColumnMap(field.settings.fields, currentPath);
            entries.push(...nested);
            continue;
        }

        if (field.type === "dynamicZone" && field.settings?.templates) {
            for (const template of field.settings.templates) {
                if (template.fields) {
                    const nested = buildFieldColumnMap(template.fields, currentPath);
                    entries.push(...nested);
                }
            }
            continue;
        }

        entries.push({
            columnName: storagePathToColumnName(currentPath),
            storageId: field.storageId,
            fieldId: field.fieldId,
            type: field.type,
            path: currentPath
        });
    }

    return entries;
};
```

- [ ] **Step 2: Verify build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-sql/src/utils/columnName.ts
git commit -m "feat(api-headless-cms-sql): add column name utility for nested field mapping"
```

---

### Task 2: Cursor codec utility

Keyset pagination cursor encoding/decoding.

**Files:**
- Create: `src/utils/cursor.ts`

- [ ] **Step 1: Create `src/utils/cursor.ts`**

```typescript
export interface ICursorValues {
    [column: string]: string | number | boolean | null;
}

export const encodeCursor = (values: ICursorValues): string => {
    return Buffer.from(JSON.stringify(values), "utf-8").toString("base64");
};

export const decodeCursor = (cursor: string): ICursorValues | null => {
    try {
        const json = Buffer.from(cursor, "base64").toString("utf-8");
        const parsed = JSON.parse(json);

        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
            return null;
        }

        return parsed as ICursorValues;
    } catch {
        return null;
    }
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-sql/src/utils/cursor.ts
git commit -m "feat(api-headless-cms-sql): add keyset cursor codec"
```

---

### Task 3: Update EntrySchemaManager

Add `isLatest`, `isPublished`, `location_folderId`, missing identity columns, and recursive nested field column creation.

**Files:**
- Modify: `src/features/entrySchemaManager/EntrySchemaManager.ts`

- [ ] **Step 1: Add missing meta columns to `applyEntryMetaColumns`**

After the existing `expiresAt` line (line 194), add:

```typescript
table.boolean("isLatest").defaultTo(false).index();
table.boolean("isPublished").defaultTo(false).index();
table.string("location_folderId");

table.string("revisionDeletedBy_id");
table.text("revisionDeletedBy");
table.string("revisionRestoredBy_id");
table.text("revisionRestoredBy");
table.string("revisionFirstPublishedBy_id");
table.text("revisionFirstPublishedBy");
table.string("revisionLastPublishedBy_id");
table.text("revisionLastPublishedBy");

table.string("deletedBy_id");
table.text("deletedBy");
table.string("restoredBy_id");
table.text("restoredBy");
table.string("firstPublishedBy_id");
table.text("firstPublishedBy");
table.string("lastPublishedBy_id");
table.text("lastPublishedBy");
```

- [ ] **Step 2: Update `createEntryTable` to use `buildFieldColumnMap` for nested fields**

Add import at top of file:

```typescript
import { buildFieldColumnMap } from "~/utils/columnName.js";
```

Replace the simple field loop in `createEntryTable` (lines 85-89) with:

```typescript
private async createEntryTable(tableName: string, fields: CmsModelField[]): Promise<void> {
    const fieldColumns = buildFieldColumnMap(fields);

    await this.knex.schema.createTable(tableName, table => {
        this.applyEntryMetaColumns(table);

        for (const entry of fieldColumns) {
            const columnType = this.fieldTypeMapper.mapFieldType(entry.type);

            addColumn(table, entry.columnName, columnType, true);
        }
    });
}
```

- [ ] **Step 3: Update `sync` method to diff using column names**

Update the new-fields diff logic in `sync` (around lines 50-65) to use `buildFieldColumnMap`:

```typescript
const storedFields = storedSchema
    ? (JSON.parse(storedSchema.fields) as CmsModelField[])
    : [];

const storedColumns = new Set(
    buildFieldColumnMap(storedFields).map(e => e.columnName)
);

const currentColumns = buildFieldColumnMap(fields);
const newColumns = currentColumns.filter(e => !storedColumns.has(e.columnName));

if (newColumns.length > 0) {
    await this.knex.schema.alterTable(tableName, table => {
        for (const entry of newColumns) {
            const columnType = this.fieldTypeMapper.mapFieldType(entry.type);

            addColumn(table, entry.columnName, columnType, true);
        }
    });
}
```

- [ ] **Step 4: Verify build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 5: Commit**

```bash
git add packages/api-headless-cms-sql/src/features/entrySchemaManager/EntrySchemaManager.ts
git commit -m "feat(api-headless-cms-sql): add missing entry columns and nested field support"
```

---

### Task 4: SQL operator feature — abstractions

**Files:**
- Create: `src/features/sqlOperator/abstractions/SqlOperator.ts`
- Create: `src/features/sqlOperator/abstractions/SqlOperatorRegistry.ts`
- Create: `src/features/sqlOperator/abstractions/index.ts`

- [ ] **Step 1: Create `SqlOperator.ts` abstraction**

```typescript
import type { Knex } from "knex";
import { createAbstraction } from "@webiny/feature/api/index.js";

export interface ISqlOperatorApplyParams {
    query: Knex.QueryBuilder;
    column: string;
    value: unknown;
}

export interface ISqlOperator {
    readonly operator: string;
    apply(params: ISqlOperatorApplyParams): void;
}

export const SqlOperator = createAbstraction<ISqlOperator>("Cms/Sql/Operator");

export namespace SqlOperator {
    export type Interface = ISqlOperator;
    export type ApplyParams = ISqlOperatorApplyParams;
}
```

- [ ] **Step 2: Create `SqlOperatorRegistry.ts` abstraction**

```typescript
import { createAbstraction } from "@webiny/feature/api/index.js";
import type { SqlOperator } from "./SqlOperator.js";

export interface ISqlOperatorRegistry {
    get(operator: string): SqlOperator.Interface;
}

export const SqlOperatorRegistry = createAbstraction<ISqlOperatorRegistry>(
    "Cms/Sql/OperatorRegistry"
);

export namespace SqlOperatorRegistry {
    export type Interface = ISqlOperatorRegistry;
}
```

- [ ] **Step 3: Create `index.ts` barrel**

```typescript
export { SqlOperator } from "./SqlOperator.js";
export type { ISqlOperator, ISqlOperatorApplyParams } from "./SqlOperator.js";

export { SqlOperatorRegistry } from "./SqlOperatorRegistry.js";
export type { ISqlOperatorRegistry } from "./SqlOperatorRegistry.js";
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-headless-cms-sql/src/features/sqlOperator/abstractions/
git commit -m "feat(api-headless-cms-sql): add SQL operator abstractions"
```

---

### Task 5: SQL operator implementations

Each operator translates a CMS where-clause operator to a Knex query builder call. All files live in `src/features/sqlOperator/operators/`.

**Files:** 14 operator files (see file structure above)

- [ ] **Step 1: Create `EqualOperator.ts`**

```typescript
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class EqualOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "eq";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (value === null || value === undefined) {
            query.whereNull(column);
            return;
        }

        query.where(column, value);
    }
}

export const EqualOperator = SqlOperatorAbstraction.createImplementation({
    implementation: EqualOperatorImpl,
    dependencies: []
});
```

- [ ] **Step 2: Create `NotOperator.ts`**

```typescript
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class NotOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "not";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (value === null || value === undefined) {
            query.whereNotNull(column);
            return;
        }

        query.whereNot(column, value);
    }
}

export const NotOperator = SqlOperatorAbstraction.createImplementation({
    implementation: NotOperatorImpl,
    dependencies: []
});
```

- [ ] **Step 3: Create `InOperator.ts` and `NotInOperator.ts`**

`InOperator.ts`:
```typescript
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class InOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "in";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (!Array.isArray(value) || value.length === 0) {
            return;
        }

        query.whereIn(column, value);
    }
}

export const InOperator = SqlOperatorAbstraction.createImplementation({
    implementation: InOperatorImpl,
    dependencies: []
});
```

`NotInOperator.ts`:
```typescript
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class NotInOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "not_in";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (!Array.isArray(value) || value.length === 0) {
            return;
        }

        query.whereNotIn(column, value);
    }
}

export const NotInOperator = SqlOperatorAbstraction.createImplementation({
    implementation: NotInOperatorImpl,
    dependencies: []
});
```

- [ ] **Step 4: Create `ContainsOperator.ts` and `NotContainsOperator.ts`**

`ContainsOperator.ts`:
```typescript
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class ContainsOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "contains";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (typeof value !== "string") {
            return;
        }

        query.whereRaw("LOWER(??) LIKE LOWER(?)", [column, `%${value}%`]);
    }
}

export const ContainsOperator = SqlOperatorAbstraction.createImplementation({
    implementation: ContainsOperatorImpl,
    dependencies: []
});
```

`NotContainsOperator.ts`:
```typescript
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class NotContainsOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "not_contains";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (typeof value !== "string") {
            return;
        }

        query.whereRaw("LOWER(??) NOT LIKE LOWER(?)", [column, `%${value}%`]);
    }
}

export const NotContainsOperator = SqlOperatorAbstraction.createImplementation({
    implementation: NotContainsOperatorImpl,
    dependencies: []
});
```

- [ ] **Step 5: Create comparison operators (Gt, Gte, Lt, Lte)**

All four follow the same pattern. Showing `GtOperator.ts` — replicate for Gte (`>=`), Lt (`<`), Lte (`<=`):

```typescript
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class GtOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "gt";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        params.query.where(params.column, ">", params.value);
    }
}

export const GtOperator = SqlOperatorAbstraction.createImplementation({
    implementation: GtOperatorImpl,
    dependencies: []
});
```

Operator strings and SQL operators: `gt`/`>`, `gte`/`>=`, `lt`/`<`, `lte`/`<=`.

- [ ] **Step 6: Create `BetweenOperator.ts` and `NotBetweenOperator.ts`**

`BetweenOperator.ts`:
```typescript
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class BetweenOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "between";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (!Array.isArray(value) || value.length !== 2) {
            return;
        }

        query.whereBetween(column, [value[0], value[1]]);
    }
}

export const BetweenOperator = SqlOperatorAbstraction.createImplementation({
    implementation: BetweenOperatorImpl,
    dependencies: []
});
```

`NotBetweenOperator.ts` — same but `query.whereNotBetween(...)` and operator `"not_between"`.

- [ ] **Step 7: Create `StartsWithOperator.ts` and `NotStartsWithOperator.ts`**

`StartsWithOperator.ts`:
```typescript
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class StartsWithOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "startsWith";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (typeof value !== "string") {
            return;
        }

        query.whereRaw("LOWER(??) LIKE LOWER(?)", [column, `${value}%`]);
    }
}

export const StartsWithOperator = SqlOperatorAbstraction.createImplementation({
    implementation: StartsWithOperatorImpl,
    dependencies: []
});
```

`NotStartsWithOperator.ts` — same but `NOT LIKE` and operator `"not_startsWith"`.

- [ ] **Step 8: Commit**

```bash
git add packages/api-headless-cms-sql/src/features/sqlOperator/operators/
git commit -m "feat(api-headless-cms-sql): add SQL operator implementations"
```

---

### Task 6: SQL operator registry and feature registration

**Files:**
- Create: `src/features/sqlOperator/SqlOperatorRegistry.ts`
- Create: `src/features/sqlOperator/feature.ts`

- [ ] **Step 1: Create `SqlOperatorRegistry.ts`**

```typescript
import WebinyError from "@webiny/error";
import { SqlOperatorRegistry as SqlOperatorRegistryAbstraction } from "./abstractions/index.js";
import { SqlOperator } from "./abstractions/index.js";

class SqlOperatorRegistryImpl implements SqlOperatorRegistryAbstraction.Interface {
    private readonly operators: Map<string, SqlOperator.Interface>;

    public constructor(operators: SqlOperator.Interface[]) {
        this.operators = new Map(operators.map(op => [op.operator, op]));
    }

    public get(operator: string): SqlOperator.Interface {
        const op = this.operators.get(operator);

        if (!op) {
            throw new WebinyError(
                `SQL operator "${operator}" is not registered.`,
                "SQL_OPERATOR_NOT_FOUND",
                { operator }
            );
        }

        return op;
    }
}

export const SqlOperatorRegistry = SqlOperatorRegistryAbstraction.createImplementation({
    implementation: SqlOperatorRegistryImpl,
    dependencies: [[SqlOperator, { multiple: true }]]
});
```

- [ ] **Step 2: Create `feature.ts`**

```typescript
import { createFeature } from "@webiny/feature/api/index.js";
import { SqlOperatorRegistry } from "./SqlOperatorRegistry.js";
import { EqualOperator } from "./operators/EqualOperator.js";
import { NotOperator } from "./operators/NotOperator.js";
import { InOperator } from "./operators/InOperator.js";
import { NotInOperator } from "./operators/NotInOperator.js";
import { ContainsOperator } from "./operators/ContainsOperator.js";
import { NotContainsOperator } from "./operators/NotContainsOperator.js";
import { GtOperator } from "./operators/GtOperator.js";
import { GteOperator } from "./operators/GteOperator.js";
import { LtOperator } from "./operators/LtOperator.js";
import { LteOperator } from "./operators/LteOperator.js";
import { BetweenOperator } from "./operators/BetweenOperator.js";
import { NotBetweenOperator } from "./operators/NotBetweenOperator.js";
import { StartsWithOperator } from "./operators/StartsWithOperator.js";
import { NotStartsWithOperator } from "./operators/NotStartsWithOperator.js";

export const SqlOperatorFeature = createFeature({
    name: "cms.sql.operatorFeature",
    register: container => {
        container.register(EqualOperator);
        container.register(NotOperator);
        container.register(InOperator);
        container.register(NotInOperator);
        container.register(ContainsOperator);
        container.register(NotContainsOperator);
        container.register(GtOperator);
        container.register(GteOperator);
        container.register(LtOperator);
        container.register(LteOperator);
        container.register(BetweenOperator);
        container.register(NotBetweenOperator);
        container.register(StartsWithOperator);
        container.register(NotStartsWithOperator);
        container.register(SqlOperatorRegistry);
    }
});
```

- [ ] **Step 3: Verify build, commit**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
git add packages/api-headless-cms-sql/src/features/sqlOperator/
git commit -m "feat(api-headless-cms-sql): add SQL operator registry and feature"
```

---

### Task 7: SQL entry filter feature — abstractions

**Files:**
- Create: `src/features/sqlEntryFilter/abstractions/SqlEntryFilter.ts`
- Create: `src/features/sqlEntryFilter/abstractions/SqlEntryFilterRegistry.ts`
- Create: `src/features/sqlEntryFilter/abstractions/index.ts`

- [ ] **Step 1: Create `SqlEntryFilter.ts` abstraction**

```typescript
import type { Knex } from "knex";
import { createAbstraction } from "@webiny/feature/api/index.js";

export interface IModelField {
    fieldId: string;
    storageId: string;
    type: string;
    columnName: string;
    searchable: boolean;
    sortable: boolean;
    settings?: Record<string, any>;
}

export type ModelFields = Record<string, IModelField>;

export interface IApplyFilteringParams {
    query: Knex.QueryBuilder;
    column: string;
    operator: string;
    value: unknown;
}

export type ApplyFilteringCb = (params: IApplyFilteringParams) => void;
export type GetFilterCb = (type: string) => SqlEntryFilter.Interface;

export interface ISqlEntryFilterExecParams {
    applyFiltering: ApplyFilteringCb;
    getFilter: GetFilterCb;
    key: string;
    value: unknown;
    operator: string;
    field: IModelField;
    fields: ModelFields;
    query: Knex.QueryBuilder;
}

export interface ISqlEntryFilter {
    readonly fieldType: string;
    exec(params: ISqlEntryFilterExecParams): void;
}

export const SqlEntryFilter = createAbstraction<ISqlEntryFilter>("Cms/Sql/EntryFilter");

export namespace SqlEntryFilter {
    export type Interface = ISqlEntryFilter;
    export type ExecParams = ISqlEntryFilterExecParams;
    export type ApplyFiltering = ApplyFilteringCb;
    export type GetFilter = GetFilterCb;
}
```

- [ ] **Step 2: Create `SqlEntryFilterRegistry.ts` abstraction**

```typescript
import { createAbstraction } from "@webiny/feature/api/index.js";
import type { SqlEntryFilter } from "./SqlEntryFilter.js";

export interface ISqlEntryFilterRegistry {
    get(fieldType: string): SqlEntryFilter.Interface;
}

export const SqlEntryFilterRegistry = createAbstraction<ISqlEntryFilterRegistry>(
    "Cms/Sql/EntryFilterRegistry"
);

export namespace SqlEntryFilterRegistry {
    export type Interface = ISqlEntryFilterRegistry;
}
```

- [ ] **Step 3: Create `index.ts` barrel**

```typescript
export { SqlEntryFilter } from "./SqlEntryFilter.js";
export type {
    ISqlEntryFilter,
    ISqlEntryFilterExecParams,
    IModelField,
    ModelFields,
    ApplyFilteringCb,
    GetFilterCb,
    IApplyFilteringParams
} from "./SqlEntryFilter.js";

export { SqlEntryFilterRegistry } from "./SqlEntryFilterRegistry.js";
export type { ISqlEntryFilterRegistry } from "./SqlEntryFilterRegistry.js";
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-headless-cms-sql/src/features/sqlEntryFilter/abstractions/
git commit -m "feat(api-headless-cms-sql): add SQL entry filter abstractions"
```

---

### Task 8: SQL entry filter implementations + registry + feature

**Files:**
- Create: `src/features/sqlEntryFilter/fields/DefaultFilter.ts`
- Create: `src/features/sqlEntryFilter/fields/ObjectFilter.ts`
- Create: `src/features/sqlEntryFilter/fields/RefFilter.ts`
- Create: `src/features/sqlEntryFilter/SqlEntryFilterRegistry.ts`
- Create: `src/features/sqlEntryFilter/feature.ts`

- [ ] **Step 1: Create `DefaultFilter.ts`**

```typescript
import WebinyError from "@webiny/error";
import { SqlEntryFilter as SqlEntryFilterAbstraction } from "../abstractions/index.js";

export const FILTER_DEFAULT = "*";

class DefaultFilterImpl implements SqlEntryFilterAbstraction.Interface {
    public readonly fieldType = FILTER_DEFAULT;

    public exec(params: SqlEntryFilterAbstraction.ExecParams): void {
        const { applyFiltering, field, query, operator, value } = params;

        if (!field.searchable) {
            throw new WebinyError(
                `Field "${field.fieldId}" is not searchable.`,
                "FIELD_NOT_SEARCHABLE",
                { fieldId: field.fieldId }
            );
        }

        applyFiltering({ query, column: field.columnName, operator, value });
    }
}

export const DefaultFilter = SqlEntryFilterAbstraction.createImplementation({
    implementation: DefaultFilterImpl,
    dependencies: []
});
```

- [ ] **Step 2: Create `ObjectFilter.ts`**

```typescript
import WebinyError from "@webiny/error";
import { SqlEntryFilter as SqlEntryFilterAbstraction } from "../abstractions/index.js";
import { parseWhereKey } from "~/operations/entry/whereBuilder.js";

class ObjectFilterImpl implements SqlEntryFilterAbstraction.Interface {
    public readonly fieldType = "object";

    public exec(params: SqlEntryFilterAbstraction.ExecParams): void {
        const { applyFiltering, value: where, fields, field: parentField, getFilter, query } = params;

        if (typeof where !== "object" || where === null) {
            return;
        }

        for (const key of Object.keys(where as Record<string, unknown>)) {
            const childValue = (where as Record<string, unknown>)[key];

            if (childValue === undefined) {
                continue;
            }

            const { fieldId: whereFieldId, operator } = parseWhereKey(key);
            const identifier = `${parentField.fieldId}.${whereFieldId}`;
            const field = fields[identifier];

            if (!field) {
                throw new WebinyError(
                    `Cannot filter by "${identifier}". Field not found.`,
                    "FIELD_NOT_FOUND",
                    { identifier }
                );
            }

            const filter = getFilter(field.type);

            filter.exec({
                applyFiltering, getFilter, key, value: childValue,
                operator, field, fields, query
            });
        }
    }
}

export const ObjectFilter = SqlEntryFilterAbstraction.createImplementation({
    implementation: ObjectFilterImpl,
    dependencies: []
});
```

- [ ] **Step 3: Create `RefFilter.ts`**

```typescript
import WebinyError from "@webiny/error";
import { SqlEntryFilter as SqlEntryFilterAbstraction } from "../abstractions/index.js";
import { parseWhereKey } from "~/operations/entry/whereBuilder.js";

class RefFilterImpl implements SqlEntryFilterAbstraction.Interface {
    public readonly fieldType = "ref";

    public exec(params: SqlEntryFilterAbstraction.ExecParams): void {
        const { applyFiltering, query, field } = params;
        let values = params.value;

        if (typeof values !== "object") {
            throw new WebinyError(
                `Ref field "${field.fieldId}" value must be an object.`,
                "REF_FIELD_VALUE_ERROR",
                { fieldId: field.fieldId }
            );
        }

        if (values === null || values === undefined) {
            values = { entryId: null };
        }

        for (const key of Object.keys(values as Record<string, unknown>)) {
            const value = (values as Record<string, unknown>)[key];

            if (value === undefined) {
                continue;
            }

            const { operator } = parseWhereKey(key);

            applyFiltering({ query, column: field.columnName, operator, value });
        }
    }
}

export const RefFilter = SqlEntryFilterAbstraction.createImplementation({
    implementation: RefFilterImpl,
    dependencies: []
});
```

- [ ] **Step 4: Create `SqlEntryFilterRegistry.ts`**

```typescript
import WebinyError from "@webiny/error";
import { SqlEntryFilterRegistry as SqlEntryFilterRegistryAbstraction } from "./abstractions/index.js";
import { SqlEntryFilter } from "./abstractions/index.js";
import { FILTER_DEFAULT } from "./fields/DefaultFilter.js";

class SqlEntryFilterRegistryImpl implements SqlEntryFilterRegistryAbstraction.Interface {
    private readonly filters: SqlEntryFilter.Interface[];

    public constructor(filters: SqlEntryFilter.Interface[]) {
        this.filters = filters;
    }

    public get(type: string): SqlEntryFilter.Interface {
        const filter = this.filters.find(f => f.fieldType === type);

        if (filter) {
            return filter;
        }

        const fallback = this.filters.find(f => f.fieldType === FILTER_DEFAULT);

        if (fallback) {
            return fallback;
        }

        throw new WebinyError(
            `No SQL entry filter for field type "${type}".`,
            "SQL_FILTER_NOT_FOUND",
            { type }
        );
    }
}

export const SqlEntryFilterRegistry = SqlEntryFilterRegistryAbstraction.createImplementation({
    implementation: SqlEntryFilterRegistryImpl,
    dependencies: [[SqlEntryFilter, { multiple: true }]]
});
```

- [ ] **Step 5: Create `feature.ts`**

```typescript
import { createFeature } from "@webiny/feature/api/index.js";
import { SqlEntryFilterRegistry } from "./SqlEntryFilterRegistry.js";
import { DefaultFilter } from "./fields/DefaultFilter.js";
import { ObjectFilter } from "./fields/ObjectFilter.js";
import { RefFilter } from "./fields/RefFilter.js";

export const SqlEntryFilterFeature = createFeature({
    name: "cms.sql.entryFilterFeature",
    register: container => {
        container.register(DefaultFilter);
        container.register(ObjectFilter);
        container.register(RefFilter);
        container.register(SqlEntryFilterRegistry);
    }
});
```

- [ ] **Step 6: Verify build, commit**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
git add packages/api-headless-cms-sql/src/features/sqlEntryFilter/
git commit -m "feat(api-headless-cms-sql): add SQL entry filter feature"
```

---

### Task 9: Entry types and meta column definitions

**Files:**
- Create: `src/operations/entry/types.ts`

- [ ] **Step 1: Create `types.ts`**

Define `IEntryRow` (SQL row shape), `ENTRY_META_COLUMNS` (set of meta column names for distinguishing meta from value columns), and `ENTRY_LEVEL_META_FIELDS` (fields synced to all revisions on update).

Full content: see the `IEntryRow` interface matching all columns from `applyEntryMetaColumns` (including the new ones from Task 3), plus an index signature `[key: string]: unknown` for value columns.

`ENTRY_META_COLUMNS` is a `Set<string>` containing every meta column name.

`ENTRY_LEVEL_META_FIELDS` is a readonly array of entry-level fields that get synced across revisions:
```typescript
export const ENTRY_LEVEL_META_FIELDS = [
    "createdOn", "modifiedOn", "savedOn", "deletedOn", "restoredOn",
    "firstPublishedOn", "lastPublishedOn",
    "createdBy_id", "createdBy_displayName", "createdBy_type", "createdBy",
    "modifiedBy_id", "modifiedBy",
    "savedBy_id", "savedBy",
    "deletedBy_id", "deletedBy",
    "restoredBy_id", "restoredBy",
    "firstPublishedBy_id", "firstPublishedBy",
    "lastPublishedBy_id", "lastPublishedBy"
] as const;
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-sql/src/operations/entry/types.ts
git commit -m "feat(api-headless-cms-sql): add entry row types and meta column definitions"
```

---

### Task 10: Entry mappers

**Files:**
- Create: `src/operations/entry/mappers.ts`

- [ ] **Step 1: Create `mappers.ts`**

Two main functions:
- `entryToRow(entry, fieldColumns, { isLatest, isPublished })` — flattens a `CmsStorageEntry` into an `IEntryRow`. Serializes identity fields (split into `_id`/`_displayName`/`_type` + JSON), flattens nested values via `fieldColumns`, JSON.stringify for object values.
- `rowToEntry(row, model, fieldColumns)` — reconstructs a `CmsStorageEntry` from an `IEntryRow`. Parses identity JSON, reconstructs nested values, adds `tenant`/`modelId` from model.

Helper: `getFieldColumns(model)` calls `buildFieldColumnMap(model.fields)`.

Key details:
- Uses `getNestedValue(obj, path)` to extract values from nested entry values
- Uses `setNestedValue(obj, path, value)` to reconstruct nested values from flat columns
- `JSON_FIELD_TYPES` set (`file`, `ref`, `object`, `dynamicZone`, `json`, `searchable-json`, `location`) determines which value columns need `JSON.parse` on read

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-sql/src/operations/entry/mappers.ts
git commit -m "feat(api-headless-cms-sql): add entry row mappers"
```

---

### Task 11: WHERE builder

**Files:**
- Create: `src/operations/entry/whereBuilder.ts`

- [ ] **Step 1: Create `whereBuilder.ts`**

Three exports:
- `parseWhereKey(key)` — splits `"fieldName_not_in"` into `{ fieldId: "fieldName", operator: "not_in" }`. Checks longest operators first to avoid ambiguity.
- `buildModelFields(model)` — builds a `ModelFields` map from system fields + CMS value fields. System fields map to their column names (identity fields map to `_id` columns). Value fields map via `buildFieldColumnMap`.
- `applyWhere({ query, where, model, operatorRegistry, filterRegistry, fields })` — recursive function that walks `CmsEntryListWhere` and applies Knex conditions. Handles: `published`/`latest` (boolean flags), `wbyDeleted`, `location`/`wbyAco_location`, `values` namespace, `AND`/`OR` nesting, and regular field filters via the filter registry.
- `applySearch(query, search, searchFields, fields)` — applies `LOWER(column) LIKE LOWER('%term%')` with OR across specified fields.

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-sql/src/operations/entry/whereBuilder.ts
git commit -m "feat(api-headless-cms-sql): add WHERE clause builder"
```

---

### Task 12: Implement all 22 entry storage methods

**Files:**
- Modify: `src/operations/entry/index.ts`

- [ ] **Step 1: Rewrite `index.ts`**

Update `CreateEntriesStorageOperationsParams` to include `entrySchemaManager`, `operatorRegistry`, `filterRegistry` (remove `plugins`).

Helper functions:
- `resolveTable(model)` — resolves table name + ensures schema
- `query(tableName)` — returns `knex<IEntryRow>(tableName)`
- `convertFromStorage(row, model)` — calls `rowToEntry` then `model.convertValueKeyFromStorage`
- `getEntryLevelMeta(row)` — extracts `ENTRY_LEVEL_META_FIELDS` from a row for syncing
- `extractEntryId(id)` — splits `"entryId#version"` to get entryId
- `applyKeysetCondition(qb, sortFields, cursorValues)` — builds compound OR condition for keyset pagination

**Read operations (8):**
- `getByIds` — `SELECT * WHERE id IN (?)`
- `getPublishedByIds` — `SELECT * WHERE entryId IN (?) AND isPublished = true`
- `getLatestByIds` — `SELECT * WHERE entryId IN (?) AND isLatest = true`
- `getRevisions` — `SELECT * WHERE entryId = ? ORDER BY version DESC`
- `getRevisionById` — `SELECT * WHERE id = ? LIMIT 1`
- `getPublishedRevisionByEntryId` — `SELECT * WHERE entryId = ? AND isPublished = true LIMIT 1`
- `getLatestRevisionByEntryId` — `SELECT * WHERE entryId = ? AND isLatest = true LIMIT 1`
- `getPreviousRevision` — `SELECT * WHERE entryId = ? AND version < ? ORDER BY version DESC LIMIT 1`

**Get + List (2):**
- `get` — calls `list` with `limit: 1`, returns first item
- `list` — COUNT query + data query with `applyWhere` + `applySearch` + sorting + keyset pagination + cursor encoding

**Write operations (3):**
- `create` — INSERT with `isLatest: true`, `isPublished: status === "published"`
- `createRevisionFrom` — UPDATE old latest `isLatest = false`, INSERT new with `isLatest: true`
- `update` — UPDATE by id, sync entry-level meta to all revisions

**Lifecycle (7):**
- `publish` — clear old `isPublished`, UPDATE target with `isPublished: true`, sync entry-level meta
- `unpublish` — UPDATE target with `isPublished: false`, sync entry-level meta
- `move` — `UPDATE SET location, location_folderId WHERE entryId = ?`
- `moveToBin` — `UPDATE SET wbyDeleted = true, ... WHERE entryId = ?`, clear `isPublished`
- `restoreFromBin` — `UPDATE SET wbyDeleted = false, ... WHERE entryId = ?`, restore `isLatest` on max version
- `deleteRevision` — DELETE by id, optionally update new latest
- `delete` — `DELETE WHERE entryId = ?`
- `deleteMultipleEntries` — `DELETE WHERE entryId IN (?)`

**Aggregate (1):**
- `getUniqueFieldValues` — `SELECT column, COUNT(*) GROUP BY column ORDER BY COUNT(*) DESC` with `applyWhere`

- [ ] **Step 2: Verify build**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-sql/src/operations/entry/
git commit -m "feat(api-headless-cms-sql): implement all 22 entry storage operations"
```

---

### Task 13: Wire new features into DI registration

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Add imports for new features and abstractions**

```typescript
import { SqlOperatorFeature } from "~/features/sqlOperator/feature.js";
import { SqlEntryFilterFeature } from "~/features/sqlEntryFilter/feature.js";
import { SqlOperatorRegistry } from "~/features/sqlOperator/abstractions/index.js";
import { SqlEntryFilterRegistry } from "~/features/sqlEntryFilter/abstractions/index.js";
```

- [ ] **Step 2: Register features in `registerSqlStorageOperations`**

After `EntrySchemaManagerFeature.register(container)`:

```typescript
SqlOperatorFeature.register(container);
SqlEntryFilterFeature.register(container);
```

- [ ] **Step 3: Update `createSqlStorageOperations` to resolve and pass new dependencies**

Resolve `SqlOperatorRegistry` and `SqlEntryFilterRegistry` from the container. Pass `entrySchemaManager`, `operatorRegistry`, and `filterRegistry` to `createEntriesStorageOperations`. Remove `plugins` from the entry ops params.

- [ ] **Step 4: Verify build, commit**

```bash
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
git add packages/api-headless-cms-sql/src/index.ts
git commit -m "feat(api-headless-cms-sql): wire operator and filter features into DI"
```

---

### Task 14: Pre-commit checks and final build

Run the full pre-commit checklist from CLAUDE.md.

- [ ] **Step 1: Stage, install, update configs**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
```

- [ ] **Step 2: Format and lint**

```bash
yarn format > /dev/null 2>&1
yarn lint 2>&1 | tail -30
```

- [ ] **Step 3: Sync dependencies and build**

```bash
yarn webiny sync-dependencies 2>&1 | tail -20
yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -30
```

- [ ] **Step 4: Fix any errors, re-run all steps if needed**

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore(api-headless-cms-sql): pre-commit checks pass"
```
