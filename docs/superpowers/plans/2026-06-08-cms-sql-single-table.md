# CMS SQL Single-Table Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the entry storage layer of `@webiny/api-headless-cms-sql` from ~51 columns per row to 9 indexed columns + a JSON `data` blob.

**Architecture:** Single static table (`webiny_cms_entries`) with `id`, `entryId`, `modelId`, `tenant`, `version`, `isLatest`, `isPublished`, `wbyDeleted`, `data`. All entry data lives in the `data` blob as `JSON.stringify(entry)`. Filtering and sorting remain in-memory. Entry-level meta synced to all siblings via batched `CASE/WHEN` UPDATE.

**Tech Stack:** TypeScript, Knex.js, better-sqlite3 (test), Vitest

**Spec:** `docs/superpowers/specs/2026-06-08-cms-sql-single-table-design.md`

---

### Task 1: Rewrite IEntryRow and mappers

**Files:**
- Modify: `packages/api-headless-cms-sql/src/operations/entry/types.ts`
- Modify: `packages/api-headless-cms-sql/src/operations/entry/mappers.ts`

- [ ] **Step 1: Replace IEntryRow**

Replace the entire contents of `packages/api-headless-cms-sql/src/operations/entry/types.ts`:

```ts
export interface IEntryRow {
    id: string;
    entryId: string;
    modelId: string;
    tenant: string;
    version: number;
    isLatest: boolean;
    isPublished: boolean;
    wbyDeleted: boolean;
    data: string;
}
```

- [ ] **Step 2: Replace mappers**

Replace the entire contents of `packages/api-headless-cms-sql/src/operations/entry/mappers.ts`:

```ts
import type {
    CmsEntry,
    CmsEntryValues,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import type { IEntryRow } from "./types.js";

const IMMUTABLE_FIELDS = new Set(["createdOn", "createdBy"]);

export const entryToRow = (entry: CmsStorageEntry): IEntryRow => {
    return {
        id: entry.id,
        entryId: entry.entryId,
        modelId: entry.modelId,
        tenant: entry.tenant,
        version: entry.version,
        isLatest: entry.isLatest,
        isPublished: entry.isPublished,
        wbyDeleted: entry.wbyDeleted ?? false,
        data: JSON.stringify(entry)
    };
};

export const rowToEntry = <T extends CmsEntryValues = CmsEntryValues>(
    row: IEntryRow
): CmsEntry<T> => {
    return JSON.parse(row.data) as CmsEntry<T>;
};

/*
 * Merges entry-level meta fields from source into target.
 * Syncs all *On and *By fields except immutable ones (createdOn, createdBy)
 * and revision-level ones (revisionCreatedOn, revisionModifiedBy, etc.).
 */
export const mergeEntryLevelMeta = (
    source: CmsEntry,
    target: CmsEntry
): CmsEntry => {
    const result = structuredClone(target);

    for (const field of Object.keys(source)) {
        if (IMMUTABLE_FIELDS.has(field)) {
            continue;
        }
        if ((field.endsWith("On") || field.endsWith("By")) && !field.startsWith("revision")) {
            (result as Record<string, unknown>)[field] = (source as Record<string, unknown>)[field];
        }
    }

    return result;
};
```

- [ ] **Step 3: Build the package**

Run: `yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -10`

Expected: Build succeeds (the operations file will have type errors since it still references old mappers — that's expected and fixed in Task 3).

- [ ] **Step 4: Commit**

```bash
git add packages/api-headless-cms-sql/src/operations/entry/types.ts packages/api-headless-cms-sql/src/operations/entry/mappers.ts
git commit -m "refactor(api-headless-cms-sql): rewrite IEntryRow and mappers for single-table design"
```

---

### Task 2: Rewrite EntryTableManager DDL

**Files:**
- Modify: `packages/api-headless-cms-sql/src/features/entryTableManager/EntryTableManager.ts`

- [ ] **Step 1: Replace the createTable method**

In `packages/api-headless-cms-sql/src/features/entryTableManager/EntryTableManager.ts`, replace the `createTable` method (lines 41-110) with:

```ts
    private async createTable(): Promise<void> {
        await this.knex.schema.createTable(this.tableName, (table) => {
            table.text("id").primary();
            table.text("entryId").notNullable();
            table.text("modelId").notNullable();
            table.text("tenant").notNullable();
            table.integer("version").notNullable();
            table.boolean("isLatest").defaultTo(false);
            table.boolean("isPublished").defaultTo(false);
            table.boolean("wbyDeleted").defaultTo(false);
            table.text("data").notNullable();

            table.index(["tenant", "modelId", "isLatest"]);
            table.index(["tenant", "modelId", "isPublished"]);
            table.index(["tenant", "modelId", "entryId"]);
        });
    }
```

Everything else in the class stays the same: constructor, `reset()`, `ensureTable()`, `getTableName()`.

- [ ] **Step 2: Build the package**

Run: `yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -10`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-sql/src/features/entryTableManager/EntryTableManager.ts
git commit -m "refactor(api-headless-cms-sql): simplify entry table to 9 columns + data blob"
```

---

### Task 3: Rewrite entry operations

This is the largest task. Rewrite all 22 operations in `operations/entry/index.ts` to use the new 9-column row format.

**Files:**
- Modify: `packages/api-headless-cms-sql/src/operations/entry/index.ts`

**Key changes from current code:**
- `entryToRow()` no longer takes `model` or `{ isLatest, isPublished }` options — the entry already has those flags. The caller must set them on the entry before calling `entryToRow()`.
- `rowToEntry()` replaces `convertFromStorage()` — no model param needed.
- `getEntryLevelMeta()` is replaced by `mergeEntryLevelMeta()`.
- Operations that updated flat columns (`status`, `live`, `location`, `binOriginalFolderId`) now patch the `data` blob via load-patch-save.
- Entry-level meta syncs to ALL siblings (not just latest).
- Batched `CASE/WHEN` UPDATE for sibling sync.
- `create` and `createRevisionFrom` explicitly enforce `isLatest=true` on the entry before calling `entryToRow()`.
- `update`, `publish`, `unpublish` read the current row's `isLatest`/`isPublished` from DB before building the `data` blob, ensuring indexed columns and blob stay in sync.

- [ ] **Step 1: Replace the entire operations file**

Replace the entire contents of `packages/api-headless-cms-sql/src/operations/entry/index.ts`:

```ts
import type { Knex } from "knex";
import type {
    CmsEntry,
    CmsEntryListWhere,
    CmsEntryStorageOperations,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import type { PluginsContainer } from "@webiny/plugins";
import type { CmsContext } from "~/types.js";
import type { KnexInstance } from "~/features/knexInstance/abstractions.js";
import type { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import type { IEntryRow } from "./types.js";
import { entryToRow, rowToEntry, mergeEntryLevelMeta } from "./mappers.js";
import { StorageTransformRegistry } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { decodeCursor, encodeCursor } from "@webiny/utils";
import { ValueFilterRegistry } from "@webiny/db-utils";
import {
    createFields,
    filter,
    sort,
    createStorageModelAccessor,
    createStorageTransformCallable,
    aggregateUniqueFieldValues
} from "@webiny/api-headless-cms-storage";

interface CreateEntriesStorageOperationsParams {
    knex: KnexInstance.Interface;
    entryTableManager: EntryTableManager.Interface;
    container: CmsContext["container"];
    plugins: PluginsContainer;
}

const MAX_LIST_LIMIT = 1000000;

const extractEntryId = (id: string): string => {
    const hashIdx = id.indexOf("#");

    if (hashIdx === -1) {
        return id;
    }

    return id.slice(0, hashIdx);
};

export const createEntriesStorageOperations = (
    params: CreateEntriesStorageOperationsParams
): CmsEntryStorageOperations => {
    const { knex, entryTableManager, container, plugins } = params;

    const storageTransformRegistry = container.resolve(StorageTransformRegistry);
    const { getModel: getStorageOperationsModel } = createStorageModelAccessor(plugins);

    const query = (): Knex.QueryBuilder<IEntryRow> => {
        return knex<IEntryRow>(entryTableManager.getTableName());
    };

    /*
     * Syncs entry-level meta to all sibling revisions using a batched CASE/WHEN UPDATE.
     * Also patches additional fields (e.g., live) if provided.
     */
    const syncSiblings = async (
        entry: CmsEntry,
        extraPatch?: (sibling: CmsEntry) => void
    ): Promise<void> => {
        const siblings = await query()
            .where("entryId", entry.entryId)
            .whereNot("id", entry.id);

        if (siblings.length === 0) {
            return;
        }

        const cases = siblings.map((row) => {
            const sibling = JSON.parse(row.data);
            const merged = mergeEntryLevelMeta(entry, sibling);

            if (extraPatch) {
                extraPatch(merged);
            }

            return { id: row.id, data: JSON.stringify(merged) };
        });

        await query()
            .where("entryId", entry.entryId)
            .whereNot("id", entry.id)
            .update({
                data: knex.raw(
                    `CASE id ${cases.map(() => "WHEN ? THEN ?").join(" ")} END`,
                    cases.flatMap((c) => [c.id, c.data])
                )
            });
    };

    /*
     * Patches the data blob on all revisions of an entry.
     * Used by move, moveToBin, restoreFromBin where every revision's data must be updated.
     */
    const patchAllRevisions = async (
        entryId: string,
        tenant: string,
        patch: (entry: CmsEntry) => void,
        columnUpdates?: Partial<IEntryRow>
    ): Promise<void> => {
        const rows = await query()
            .where("tenant", tenant)
            .where("entryId", entryId);

        if (rows.length === 0) {
            return;
        }

        const cases = rows.map((row) => {
            const parsed = JSON.parse(row.data);
            patch(parsed);
            return { id: row.id, data: JSON.stringify(parsed) };
        });

        const update: Record<string, unknown> = {
            data: knex.raw(
                `CASE id ${cases.map(() => "WHEN ? THEN ?").join(" ")} END`,
                cases.flatMap((c) => [c.id, c.data])
            ),
            ...columnUpdates
        };

        await query()
            .where("tenant", tenant)
            .where("entryId", entryId)
            .update(update);
    };

    const listEntries = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: {
            where: CmsEntryListWhere;
            sort?: string[];
            search?: string;
            fields?: string[];
            limit: number;
            after?: string | null;
        }
    ) => {
        await entryTableManager.ensureTable();

        const model = getStorageOperationsModel(initialModel);
        const {
            where: initialWhere,
            sort: sortBy,
            search,
            fields: searchFields,
            limit: initialLimit,
            after
        } = params;

        const limit =
            initialLimit <= 0 || initialLimit >= MAX_LIST_LIMIT ? MAX_LIST_LIMIT : initialLimit;

        const qb = query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId);

        if (initialWhere.entryId) {
            qb.andWhere("entryId", initialWhere.entryId);
        } else if (initialWhere.published === true) {
            qb.andWhere("isPublished", true);
        } else {
            qb.andWhere("isLatest", true);
        }

        if (initialWhere.wbyDeleted !== undefined) {
            qb.andWhere("wbyDeleted", initialWhere.wbyDeleted);
        } else {
            qb.andWhere("wbyDeleted", false);
        }

        const rows: IEntryRow[] = await qb;

        if (rows.length === 0) {
            return {
                hasMoreItems: false,
                totalCount: 0,
                cursor: null,
                items: [] as CmsEntry<T>[]
            };
        }

        const fromStorage = createStorageTransformCallable(storageTransformRegistry, model);

        const records = await Promise.all(
            rows.map(async (row) => {
                const entry = rowToEntry(row) as CmsStorageEntry;

                for (const field of model.fields) {
                    entry.values[field.fieldId] = await fromStorage(
                        field,
                        entry.values[field.fieldId]
                    );
                }

                return entry as CmsEntry<T>;
            })
        );

        const where: Partial<CmsEntryListWhere> = { ...initialWhere };
        delete where["published"];
        delete where["latest"];
        delete where["entryId"];
        delete where["wbyDeleted"];

        const modelFields = createFields({
            plugins,
            fields: model.fields
        });

        const valueFilterRegistry = container.resolve(ValueFilterRegistry);

        const filteredItems = filter<T>({
            items: records,
            where,
            plugins,
            fields: modelFields,
            fullTextSearch: {
                term: search,
                fields: searchFields || []
            },
            valueFilterRegistry
        });

        const totalCount = filteredItems.length;

        const sortedItems = sort<T>({
            model,
            plugins,
            items: filteredItems,
            sort: sortBy,
            fields: modelFields
        });

        const start = parseInt((decodeCursor(after) as string) || "0") || 0;
        const hasMoreItems = totalCount > start + limit;
        const slicedItems = sortedItems.slice(start, start + limit);
        const cursor = encodeCursor(`${start + limit}`);

        return {
            hasMoreItems,
            totalCount,
            cursor,
            items: slicedItems
        };
    };

    return {
        getByIds: async (model, { ids }) => {
            await entryTableManager.ensureTable();

            const idList = ids as string[];

            const rows: IEntryRow[] = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .whereIn("id", idList);

            const entries = rows.map((row) => rowToEntry(row));
            const byId = new Map(entries.map((e) => [e.id, e]));

            return idList.map((id) => byId.get(id)).filter(Boolean) as typeof entries;
        },

        getPublishedByIds: async (model, { ids }) => {
            await entryTableManager.ensureTable();

            const idList = ids as string[];
            const entryIds = idList.map(extractEntryId);

            const rows: IEntryRow[] = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .whereIn("entryId", entryIds)
                .andWhere("isPublished", true);

            const entries = rows.map((row) => rowToEntry(row));
            const byEntryId = new Map(entries.map((e) => [e.entryId, e]));

            return entryIds.map((eid) => byEntryId.get(eid)).filter(Boolean) as typeof entries;
        },

        getLatestByIds: async (model, { ids }) => {
            await entryTableManager.ensureTable();

            const idList = ids as string[];
            const entryIds = idList.map(extractEntryId);

            const rows: IEntryRow[] = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .whereIn("entryId", entryIds)
                .andWhere("isLatest", true);

            const entries = rows.map((row) => rowToEntry(row));
            const byEntryId = new Map(entries.map((e) => [e.entryId, e]));

            return entryIds.map((eid) => byEntryId.get(eid)).filter(Boolean) as typeof entries;
        },

        getRevisions: async (model, { id }) => {
            await entryTableManager.ensureTable();

            const entryId = extractEntryId(id);

            const rows: IEntryRow[] = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .where("entryId", entryId)
                .orderBy("version", "desc");

            return rows.map((row) => rowToEntry(row));
        },

        getRevisionById: async (model, { id }) => {
            await entryTableManager.ensureTable();

            const row = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .where("id", id)
                .first();

            if (!row) {
                return null;
            }

            return rowToEntry(row);
        },

        getPublishedRevisionByEntryId: async (model, { id }) => {
            await entryTableManager.ensureTable();

            const entryId = extractEntryId(id);

            const row = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .where("entryId", entryId)
                .andWhere("isPublished", true)
                .first();

            if (!row) {
                return null;
            }

            return rowToEntry(row);
        },

        getLatestRevisionByEntryId: async (model, { id }) => {
            await entryTableManager.ensureTable();

            const entryId = extractEntryId(id);

            const row = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .where("entryId", entryId)
                .andWhere("isLatest", true)
                .first();

            if (!row) {
                return null;
            }

            return rowToEntry(row);
        },

        getPreviousRevision: async (model, { entryId, version }) => {
            await entryTableManager.ensureTable();

            const row = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .where("entryId", entryId)
                .andWhere("version", "<", version)
                .orderBy("version", "desc")
                .first();

            if (!row) {
                return null;
            }

            return rowToEntry(row);
        },

        get: async (model, params) => {
            const { items } = await listEntries(model, {
                ...params,
                limit: 1
            });

            return items.shift() || null;
        },

        list: async (model, params) => {
            return listEntries(model, params);
        },

        create: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            /* Enforce invariant: newly created entries are always latest. */
            const se = storageEntry as CmsStorageEntry;
            se.isLatest = true;
            se.isPublished = se.status === "published";

            const row = entryToRow(se);

            await query().insert(row);

            return entry;
        },

        createRevisionFrom: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            const isPublished = entry.status === "published";

            /* Mark old latest as no longer latest — patch data blob too. */
            const oldLatestRows = await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .andWhere("isLatest", true);

            for (const row of oldLatestRows) {
                const parsed = JSON.parse(row.data);
                parsed.isLatest = false;

                await query()
                    .where("id", row.id)
                    .update({
                        isLatest: false,
                        data: JSON.stringify(parsed)
                    });
            }

            /* If new revision is published, unpublish old published — patch data blob too. */
            if (isPublished) {
                const oldPublishedRows = await query()
                    .where("tenant", model.tenant)
                    .andWhere("entryId", entry.entryId)
                    .andWhere("isPublished", true);

                for (const row of oldPublishedRows) {
                    const parsed = JSON.parse(row.data);
                    parsed.isPublished = false;
                    parsed.status = "unpublished";

                    await query()
                        .where("id", row.id)
                        .update({
                            isPublished: false,
                            data: JSON.stringify(parsed)
                        });
                }
            }

            /* Enforce invariant: new revision is always latest. */
            const se = storageEntry as CmsStorageEntry;
            se.isLatest = true;
            se.isPublished = isPublished;

            const row = entryToRow(se);

            await query().insert(row);

            return entry;
        },

        update: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            /* Read current DB flags so the data blob stays in sync with indexed columns. */
            const existing = await query().where("id", storageEntry.id).first();
            const se = storageEntry as CmsStorageEntry;
            se.isLatest = existing?.isLatest ?? se.isLatest;
            se.isPublished = existing?.isPublished ?? se.isPublished;

            const row = entryToRow(se);

            /* Strip flags from column update — they are already correct in DB. */
            const { isLatest: _il, isPublished: _ip, ...rowWithoutFlags } = row;

            await query()
                .where("tenant", model.tenant)
                .andWhere("id", storageEntry.id)
                .update(rowWithoutFlags);

            /* Sync entry-level meta to all siblings. */
            await syncSiblings(se as CmsEntry);

            return entry;
        },

        publish: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            /* Step 1: Unpublish old published — patch data blob (status, isPublished). */
            const oldPublishedRows = await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .andWhere("isPublished", true);

            for (const row of oldPublishedRows) {
                const parsed = JSON.parse(row.data);
                parsed.isPublished = false;
                parsed.status = "unpublished";

                await query()
                    .where("id", row.id)
                    .update({
                        isPublished: false,
                        data: JSON.stringify(parsed)
                    });
            }

            /* Step 2: Read current isLatest from DB so the data blob stays in sync. */
            const existing = await query().where("id", storageEntry.id).first();
            const se = storageEntry as CmsStorageEntry;
            se.isLatest = existing?.isLatest ?? se.isLatest;
            se.isPublished = true;

            const row = entryToRow(se);
            const { isLatest: _il, ...rowWithoutIsLatest } = row;

            await query()
                .where("tenant", model.tenant)
                .andWhere("id", storageEntry.id)
                .update(rowWithoutIsLatest);

            /* Step 3: Sync entry-level meta + live to all siblings. */
            const liveValue = { version: entry.version };

            await syncSiblings(se as CmsEntry, (sibling) => {
                sibling.live = liveValue;
            });

            return entry;
        },

        unpublish: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            /* Read current isLatest from DB so the data blob stays in sync. */
            const existing = await query().where("id", storageEntry.id).first();
            const se = storageEntry as CmsStorageEntry;
            se.isLatest = existing?.isLatest ?? se.isLatest;
            se.isPublished = false;

            const row = entryToRow(se);
            const { isLatest: _il, ...rowWithoutIsLatest } = row;

            await query()
                .where("tenant", model.tenant)
                .andWhere("id", storageEntry.id)
                .update(rowWithoutIsLatest);

            /* Sync entry-level meta + live=null to all siblings. */
            await syncSiblings(se as CmsEntry, (sibling) => {
                sibling.live = null;
            });

            return entry;
        },

        move: async (model, id, folderId) => {
            await entryTableManager.ensureTable();

            const entryId = extractEntryId(id);

            await patchAllRevisions(entryId, model.tenant, (parsed) => {
                parsed.location = { folderId };
            });
        },

        moveToBin: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            await patchAllRevisions(
                entry.entryId,
                model.tenant,
                (parsed) => {
                    parsed.wbyDeleted = true;
                    parsed.binOriginalFolderId = storageEntry.binOriginalFolderId ?? null;
                    parsed.location = storageEntry.location ?? null;

                    /* Sync entry-level meta into each revision's data. */
                    const fields = Object.keys(storageEntry);
                    for (const field of fields) {
                        if (field === "createdOn" || field === "createdBy") {
                            continue;
                        }
                        if (
                            (field.endsWith("On") || field.endsWith("By")) &&
                            !field.startsWith("revision")
                        ) {
                            parsed[field] = (storageEntry as Record<string, unknown>)[field];
                        }
                    }
                },
                { wbyDeleted: true }
            );
        },

        restoreFromBin: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            await patchAllRevisions(
                entry.entryId,
                model.tenant,
                (parsed) => {
                    parsed.wbyDeleted = false;
                    parsed.binOriginalFolderId = null;
                    parsed.location = storageEntry.location ?? null;

                    /* Sync entry-level meta into each revision's data. */
                    const fields = Object.keys(storageEntry);
                    for (const field of fields) {
                        if (field === "createdOn" || field === "createdBy") {
                            continue;
                        }
                        if (
                            (field.endsWith("On") || field.endsWith("By")) &&
                            !field.startsWith("revision")
                        ) {
                            parsed[field] = (storageEntry as Record<string, unknown>)[field];
                        }
                    }
                },
                { wbyDeleted: false }
            );

            return entry;
        },

        deleteRevision: async (model, { storageEntry, latestStorageEntry }) => {
            await entryTableManager.ensureTable();

            const wasPublished = storageEntry.status === "published";

            await query()
                .where("tenant", model.tenant)
                .andWhere("id", storageEntry.id)
                .delete();

            /* If deleted row was published: clear live on all remaining rows. */
            if (wasPublished) {
                await patchAllRevisions(
                    storageEntry.entryId,
                    model.tenant,
                    (parsed) => {
                        parsed.live = null;
                    }
                );
            }

            /* If latestStorageEntry is provided: promote it as latest. */
            if (latestStorageEntry) {
                const latestParsed = structuredClone(latestStorageEntry);
                latestParsed.isLatest = true;

                if (wasPublished) {
                    latestParsed.live = null;
                }

                const latestRow = entryToRow(latestParsed as CmsStorageEntry);

                await query()
                    .where("tenant", model.tenant)
                    .andWhere("id", latestStorageEntry.id)
                    .update(latestRow);
            }
        },

        delete: async (model, { entry }) => {
            await entryTableManager.ensureTable();

            const entryId = extractEntryId(entry.id);

            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entryId)
                .delete();
        },

        deleteMultipleEntries: async (model, { entries }) => {
            await entryTableManager.ensureTable();

            const entryIds = entries.map(extractEntryId);

            await query()
                .where("tenant", model.tenant)
                .whereIn("entryId", entryIds)
                .delete();
        },

        getUniqueFieldValues: async (model, params) => {
            const { where, fieldId } = params;

            const field = model.fields.find((f) => f.fieldId === fieldId);

            if (!field) {
                return [];
            }

            const { items } = await listEntries(model, {
                where,
                limit: MAX_LIST_LIMIT
            });

            return aggregateUniqueFieldValues(items, field.fieldId);
        }
    } as CmsEntryStorageOperations;
};
```

- [ ] **Step 2: Build the package**

Run: `yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -10`

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-sql/src/operations/entry/index.ts
git commit -m "refactor(api-headless-cms-sql): rewrite all 22 entry operations for single-table design"
```

---

### Task 4: Verify index.ts and run pre-commit checks

**Files:**
- Verify: `packages/api-headless-cms-sql/src/index.ts`

- [ ] **Step 1: Verify index.ts needs no changes**

Read `packages/api-headless-cms-sql/src/index.ts`. Confirm:
- No references to deleted features (entrySchemaManager, fieldTypeMapper, schemaRegistry, sqlOperator, sqlEntryFilter).
- `createLocationFolderIdPathPlugin` is still registered — this is fine, it patches in-memory filter paths, not DB columns.
- `EntryTableManagerFeature` is still registered — correct, the table manager still exists (simplified).
- No other imports or registrations reference the old column-per-field design.

If any stale references exist, remove them.

- [ ] **Step 2: Run the full pre-commit checklist**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

If any step fails, fix the issue and rerun all steps from the beginning.

- [ ] **Step 2: Build the package**

Run: `yarn build -p @webiny/api-headless-cms-sql 2>&1 | tail -10`

Expected: Clean build.

- [ ] **Step 3: Commit any formatting/lint fixes**

Only if the checks above modified any files:

```bash
git commit -m "chore(api-headless-cms-sql): format and lint fixes"
```

---

### Task 5: Run tests

**Files:** None modified — validation only.

- [ ] **Step 1: Run the SQL CMS test suite**

Run: `yarn test:sql packages/api-headless-cms 2>&1 | tail -50`

This runs all CMS tests with `WEBINY_STORAGE=sql,ddb`. The test suite is sharded into 12 shards and takes 30-40 minutes per shard. Run sequentially, never in parallel.

Expected: Compare pass/fail counts against the baseline documented in `packages/api-headless-cms-sql/docs/CURRENT_STATE.md` (820 passed / 42 failed / 16 skipped). The rewrite should not introduce new failures. Some existing failures may be fixed (the simpler data path removes some edge cases).

- [ ] **Step 2: Investigate any new failures**

If any new tests fail that were passing before:
1. Check if the failure is a type mismatch (e.g., `isLatest`/`isPublished` stored as `0`/`1` in SQLite but expected as `boolean` — `rowToEntry` via `JSON.parse` should handle this since the entry was serialized with proper booleans).
2. Check if the failure is a missing field — the `data` blob should contain everything, but `fromStorage` transforms may expect fields in a specific format.
3. Check if the indexed columns (`isLatest`, `isPublished`, `wbyDeleted`) are out of sync with what's in `data` — every write operation must keep both in sync.

- [ ] **Step 3: Commit test fixes if any**

```bash
git add .
git commit -m "fix(api-headless-cms-sql): fix test failures from single-table rewrite"
```

---

### Task 6: Update documentation

**Files:**
- Modify: `packages/api-headless-cms-sql/docs/CURRENT_STATE.md`

- [ ] **Step 1: Update CURRENT_STATE.md**

Update the test score, package structure, and key design decisions sections to reflect the new single-table design. Key changes:
- Package structure: remove references to deleted features (entrySchemaManager, fieldTypeMapper, schemaRegistry, sqlOperator, sqlEntryFilter, utils/).
- Key design decisions: replace "Table-per-model" with "Single table, 9 columns + data blob".
- Remove the "Biggest Blocker: Storage Transforms" section if it no longer applies (the data blob stores whatever the CMS layer sends, including compressed values).
- Update test score with the new pass/fail/skip counts from Task 5.
- Update the "Remaining failures" section based on new test results.

- [ ] **Step 2: Run pre-commit checks and commit**

```bash
git add .
yarn format > /dev/null 2>&1
yarn lint
git add .
git commit -m "docs(api-headless-cms-sql): update CURRENT_STATE.md for single-table design"
```
