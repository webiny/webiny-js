import type { Knex } from "knex";
import type {
    CmsEntry,
    CmsEntryStorageOperations,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { KnexInstance } from "~/features/knexInstance/abstractions.js";
import type { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import type { EntrySchemaManager } from "~/features/entrySchemaManager/abstractions.js";
import type { SqlOperatorRegistry } from "~/features/sqlOperator/abstractions/index.js";
import type {
    SqlEntryFilterRegistry,
    ModelFields
} from "~/features/sqlEntryFilter/abstractions/index.js";
import type { IEntryRow } from "./types.js";
import type { IFieldColumnEntry } from "~/utils/columnName.js";
import type { ICursorValues } from "~/utils/cursor.js";
import { ENTRY_LEVEL_META_FIELDS } from "./types.js";
import { entryToRow, rowToEntry, getFieldColumns } from "./mappers.js";
import { applyWhere, applySearch, buildModelFields } from "./whereBuilder.js";
import { parseSortField } from "~/utils/parseSortField.js";
import { encodeCursor, decodeCursor } from "~/utils/cursor.js";

interface CreateEntriesStorageOperationsParams {
    knex: KnexInstance.Interface;
    tableNameResolver: TableNameResolver.Interface;
    entrySchemaManager: EntrySchemaManager.Interface;
    operatorRegistry: SqlOperatorRegistry.Interface;
    filterRegistry: SqlEntryFilterRegistry.Interface;
    sharedTables: boolean;
}

/* Extracts the entryId portion from a composite id like "entryId#0001". */
const extractEntryId = (id: string): string => {
    const hashIdx = id.indexOf("#");
    if (hashIdx === -1) {
        return id;
    }
    return id.slice(0, hashIdx);
};

/*
 * Applies a keyset pagination condition to the query builder.
 *
 * For sort [A DESC, B ASC, id ASC] with cursor {A: va, B: vb, id: vid}:
 *   WHERE (A < va)
 *      OR (A = va AND B > vb)
 *      OR (A = va AND B = vb AND id > vid)
 */
const applyKeysetCondition = (
    qb: Knex.QueryBuilder,
    sortFields: { column: string; direction: "asc" | "desc" }[],
    cursorValues: ICursorValues
): void => {
    qb.where(function (this: Knex.QueryBuilder) {
        for (let i = 0; i < sortFields.length; i++) {
            this.orWhere(function (this: Knex.QueryBuilder) {
                for (let j = 0; j <= i; j++) {
                    const sf = sortFields[j];
                    const cv = cursorValues[sf.column];

                    if (j < i) {
                        this.andWhere(sf.column, cv as string | number);
                    } else {
                        const op = sf.direction === "asc" ? ">" : "<";
                        this.andWhere(sf.column, op, cv as string | number);
                    }
                }
            });
        }
    });
};

export const createEntriesStorageOperations = (
    params: CreateEntriesStorageOperationsParams
): CmsEntryStorageOperations => {
    const {
        knex,
        tableNameResolver,
        entrySchemaManager,
        operatorRegistry,
        filterRegistry,
        sharedTables
    } = params;

    /* Memoization caches (RC-7). */
    const modelFieldsCache = new Map<string, ModelFields>();
    const fieldColumnsCache = new Map<string, IFieldColumnEntry[]>();

    /* Builds a stable cache key from modelId + sorted field storageIds. */
    const getCacheKey = (model: CmsModel): string => {
        const modelFields = Array.isArray(model.fields) ? model.fields : [];
        const fieldIds = modelFields.map(f => f.storageId).sort().join(",");
        return `${model.modelId}:${fieldIds}`;
    };

    const getCachedModelFields = (model: CmsModel): ModelFields => {
        const key = getCacheKey(model);
        const cached = modelFieldsCache.get(key);
        if (cached) {
            return cached;
        }
        const result = buildModelFields(model);
        modelFieldsCache.set(key, result);
        return result;
    };

    const getCachedFieldColumns = (model: CmsModel): IFieldColumnEntry[] => {
        const key = getCacheKey(model);
        const cached = fieldColumnsCache.get(key);
        if (cached) {
            return cached;
        }
        const result = getFieldColumns(model);
        fieldColumnsCache.set(key, result);
        return result;
    };

    /* Resolves table name and ensures schema is synced. */
    const resolveTable = async (model: CmsModel): Promise<string> => {
        const name = tableNameResolver.resolve(model.tenant, model.modelId);
        await entrySchemaManager.sync(name, model.modelId, model.fields);
        return name;
    };

    /* Returns a base query builder for the given table. */
    const query = (tableName: string): Knex.QueryBuilder<IEntryRow> => {
        return knex<IEntryRow>(tableName);
    };

    /* Returns a query builder scoped to a tenant (for shared tables). */
    const scopedQuery = (tableName: string, tenant: string): Knex.QueryBuilder<IEntryRow> => {
        const qb = query(tableName);
        if (sharedTables) {
            qb.where("tenant", tenant);
        }
        return qb;
    };

    /* Converts a row back into a CmsEntry, including storage key conversion. */
    const convertFromStorage = <T extends CmsEntryValues = CmsEntryValues>(
        row: IEntryRow,
        model: CmsModel
    ): CmsEntry<T> => {
        const fieldColumns = getCachedFieldColumns(model);
        const entry = rowToEntry(row, model, fieldColumns) as CmsEntry<T>;

        /* Apply storage key conversion if available. */
        const storageModel = model as StorageOperationsCmsModel<T>;
        if (storageModel.convertValueKeyFromStorage) {
            const values = storageModel.convertValueKeyFromStorage({
                fields: model.fields,
                values: entry.values
            });
            return {
                ...entry,
                values
            };
        }

        return entry;
    };

    /* Extracts entry-level meta fields from a row as a plain object. */
    const getEntryLevelMeta = (row: IEntryRow): Record<string, unknown> => {
        const meta: Record<string, unknown> = {};
        for (const field of ENTRY_LEVEL_META_FIELDS) {
            meta[field] = row[field];
        }
        return meta;
    };

    return {
        /* 1. getByIds */
        getByIds: async (model, { ids }) => {
            const tableName = await resolveTable(model);

            const rows: IEntryRow[] = await scopedQuery(tableName, model.tenant).whereIn(
                "id",
                ids as string[]
            );

            return rows.map(row => convertFromStorage(row, model));
        },

        /* 2. getPublishedByIds */
        getPublishedByIds: async (model, { ids }) => {
            const tableName = await resolveTable(model);
            const entryIds = (ids as string[]).map(extractEntryId);

            const rows: IEntryRow[] = await scopedQuery(tableName, model.tenant)
                .whereIn("entryId", entryIds)
                .andWhere("isPublished", true);

            return rows.map(row => convertFromStorage(row, model));
        },

        /* 3. getLatestByIds */
        getLatestByIds: async (model, { ids }) => {
            const tableName = await resolveTable(model);
            const entryIds = (ids as string[]).map(extractEntryId);

            const rows: IEntryRow[] = await scopedQuery(tableName, model.tenant)
                .whereIn("entryId", entryIds)
                .andWhere("isLatest", true);

            return rows.map(row => convertFromStorage(row, model));
        },

        /* 4. getRevisions */
        getRevisions: async (model, { id }) => {
            const tableName = await resolveTable(model);
            const entryId = extractEntryId(id);

            const rows: IEntryRow[] = await scopedQuery(tableName, model.tenant)
                .where("entryId", entryId)
                .orderBy("version", "desc");

            return rows.map(row => convertFromStorage(row, model));
        },

        /* 5. getRevisionById */
        getRevisionById: async (model, { id }) => {
            const tableName = await resolveTable(model);

            const row = await scopedQuery(tableName, model.tenant).where("id", id).first();

            if (!row) {
                return null;
            }

            return convertFromStorage(row, model);
        },

        /* 6. getPublishedRevisionByEntryId */
        getPublishedRevisionByEntryId: async (model, { id }) => {
            const tableName = await resolveTable(model);
            const entryId = extractEntryId(id);

            const row = await scopedQuery(tableName, model.tenant)
                .where("entryId", entryId)
                .andWhere("isPublished", true)
                .first();

            if (!row) {
                return null;
            }

            return convertFromStorage(row, model);
        },

        /* 7. getLatestRevisionByEntryId */
        getLatestRevisionByEntryId: async (model, { id }) => {
            const tableName = await resolveTable(model);
            const entryId = extractEntryId(id);

            const row = await scopedQuery(tableName, model.tenant)
                .where("entryId", entryId)
                .andWhere("isLatest", true)
                .first();

            if (!row) {
                return null;
            }

            return convertFromStorage(row, model);
        },

        /* 8. getPreviousRevision */
        getPreviousRevision: async (model, { entryId, version }) => {
            const tableName = await resolveTable(model);

            const row = await scopedQuery(tableName, model.tenant)
                .where("entryId", entryId)
                .andWhere("version", "<", version)
                .orderBy("version", "desc")
                .first();

            if (!row) {
                return null;
            }

            return convertFromStorage(row, model);
        },

        /* 9. get */
        get: async (model, params) => {
            const tableName = await resolveTable(model);
            const fields = getCachedModelFields(model);

            const qb = scopedQuery(tableName, model.tenant);

            applyWhere({
                query: qb,
                where: params.where,
                model,
                operatorRegistry,
                filterRegistry,
                fields
            });

            if (params.sort && params.sort.length > 0) {
                for (const sortItem of params.sort) {
                    const [fieldId, direction] = parseSortField(sortItem);
                    const field = fields[fieldId];
                    const column = field ? field.columnName : fieldId;
                    qb.orderBy(column, direction);
                }
            }

            const row = await qb.first();

            if (!row) {
                return null;
            }

            return convertFromStorage(row, model);
        },

        /* 10. list */
        list: async (model, params) => {
            const tableName = await resolveTable(model);
            const fields = getCachedModelFields(model);
            const limit = params.limit || 50;

            /* Build sort fields. */
            const sortFields: { column: string; direction: "asc" | "desc" }[] = [];

            if (params.sort && params.sort.length > 0) {
                for (const sortItem of params.sort) {
                    const [fieldId, direction] = parseSortField(sortItem);
                    const field = fields[fieldId];
                    const column = field ? field.columnName : fieldId;
                    sortFields.push({ column, direction });
                }
            } else {
                /* Default sort: savedOn DESC. */
                sortFields.push({ column: "savedOn", direction: "desc" });
            }

            /* Always add id ASC as tiebreaker. */
            const hasIdSort = sortFields.some(sf => sf.column === "id");
            if (!hasIdSort) {
                sortFields.push({ column: "id", direction: "asc" });
            }

            /* COUNT query. */
            const countQb = scopedQuery(tableName, model.tenant);

            applyWhere({
                query: countQb,
                where: params.where,
                model,
                operatorRegistry,
                filterRegistry,
                fields
            });

            applySearch(countQb, params.search, params.fields || [], fields);

            const countResult = await countQb.count({ count: "*" }).first();
            const totalCount = Number((countResult as Record<string, unknown>)?.count ?? 0);

            /* Data query. */
            const dataQb = scopedQuery(tableName, model.tenant);

            applyWhere({
                query: dataQb,
                where: params.where,
                model,
                operatorRegistry,
                filterRegistry,
                fields
            });

            applySearch(dataQb, params.search, params.fields || [], fields);

            /* Apply sorting. */
            for (const sf of sortFields) {
                dataQb.orderBy(sf.column, sf.direction);
            }

            /* Apply keyset pagination. */
            if (params.after) {
                const cursorValues = decodeCursor(params.after);
                if (cursorValues) {
                    applyKeysetCondition(dataQb, sortFields, cursorValues);
                }
            }

            /* Fetch limit + 1 to determine hasMoreItems. */
            const rows: IEntryRow[] = await dataQb.limit(limit + 1);

            const hasMoreItems = rows.length > limit;
            const items = hasMoreItems ? rows.slice(0, limit) : rows;

            /* Build cursor from the last item. */
            let cursor: string | null = null;
            if (items.length > 0) {
                const lastRow = items[items.length - 1];
                const cursorValues: ICursorValues = {};
                for (const sf of sortFields) {
                    cursorValues[sf.column] = lastRow[sf.column] as
                        | string
                        | number
                        | boolean
                        | null;
                }
                cursor = encodeCursor(cursorValues);
            }

            const entries = items.map(row => convertFromStorage(row, model));

            return {
                items: entries,
                totalCount,
                hasMoreItems,
                cursor
            };
        },

        /* 11. create */
        create: async (model, { entry, storageEntry }) => {
            const tableName = await resolveTable(model);
            const fieldColumns = getCachedFieldColumns(model);
            const isPublished = storageEntry.status === "published";

            const row = entryToRow(storageEntry as CmsStorageEntry, fieldColumns, {
                isLatest: true,
                isPublished
            });
            row.tenant = model.tenant;

            await query(tableName).insert(row);

            return entry;
        },

        /* 12. createRevisionFrom */
        createRevisionFrom: async (model, { entry, storageEntry }) => {
            const tableName = await resolveTable(model);
            const fieldColumns = getCachedFieldColumns(model);

            /* Mark old latest as no longer latest. */
            await scopedQuery(tableName, model.tenant)
                .where("entryId", entry.entryId)
                .andWhere("isLatest", true)
                .update({ isLatest: false });

            /* Insert the new revision as latest. */
            const row = entryToRow(storageEntry as CmsStorageEntry, fieldColumns, {
                isLatest: true,
                isPublished: false
            });
            row.tenant = model.tenant;

            await query(tableName).insert(row);

            return entry;
        },

        /* 13. update */
        update: async (model, { entry, storageEntry }) => {
            const tableName = await resolveTable(model);
            const fieldColumns = getCachedFieldColumns(model);

            /* Read existing row to preserve isLatest/isPublished flags. */
            const existingRow = await scopedQuery(tableName, model.tenant)
                .where("id", storageEntry.id)
                .first();

            const isLatest = existingRow ? existingRow.isLatest : false;
            const isPublished = existingRow ? existingRow.isPublished : false;

            const row = entryToRow(storageEntry as CmsStorageEntry, fieldColumns, {
                isLatest,
                isPublished
            });
            row.tenant = model.tenant;

            await scopedQuery(tableName, model.tenant).where("id", storageEntry.id).update(row);

            /* Sync entry-level meta to ALL revisions. */
            const entryLevelMeta = getEntryLevelMeta(row);

            await scopedQuery(tableName, model.tenant)
                .where("entryId", entry.entryId)
                .update(entryLevelMeta);

            return entry;
        },

        /* 14. publish (RC-1 CRITICAL) */
        publish: async (model, { entry, storageEntry }) => {
            const tableName = await resolveTable(model);
            const fieldColumns = getCachedFieldColumns(model);

            /* Step 1: Unpublish the currently published row. */
            await scopedQuery(tableName, model.tenant)
                .where("entryId", entry.entryId)
                .andWhere("isPublished", true)
                .update({ isPublished: false, status: "unpublished" });

            /* Step 2: Read current row to get isLatest flag. */
            const currentRow = await scopedQuery(tableName, model.tenant)
                .where("id", storageEntry.id)
                .first();

            const isLatest = currentRow ? currentRow.isLatest : false;

            /* Step 3: Update target row with full storageEntry data + isPublished = true. */
            const row = entryToRow(storageEntry as CmsStorageEntry, fieldColumns, {
                isLatest,
                isPublished: true
            });
            row.tenant = model.tenant;

            await scopedQuery(tableName, model.tenant).where("id", storageEntry.id).update(row);

            /* Step 4: Update ALL rows for entryId: live + entry-level meta. */
            const entryLevelMeta = getEntryLevelMeta(row);
            const liveValue = JSON.stringify({ version: entry.version });

            await scopedQuery(tableName, model.tenant)
                .where("entryId", entry.entryId)
                .update({
                    ...entryLevelMeta,
                    live: liveValue
                });

            return entry;
        },

        /* 15. unpublish (RC-2) */
        unpublish: async (model, { entry, storageEntry }) => {
            const tableName = await resolveTable(model);
            const fieldColumns = getCachedFieldColumns(model);

            /* Update target row with storageEntry data + isPublished = false. */
            const existingRow = await scopedQuery(tableName, model.tenant)
                .where("id", storageEntry.id)
                .first();

            const isLatest = existingRow ? existingRow.isLatest : false;

            const row = entryToRow(storageEntry as CmsStorageEntry, fieldColumns, {
                isLatest,
                isPublished: false
            });
            row.tenant = model.tenant;

            await scopedQuery(tableName, model.tenant).where("id", storageEntry.id).update(row);

            /* Update ALL rows for entryId: live = null + entry-level meta. */
            const entryLevelMeta = getEntryLevelMeta(row);

            await scopedQuery(tableName, model.tenant)
                .where("entryId", entry.entryId)
                .update({
                    ...entryLevelMeta,
                    live: null
                });

            return entry;
        },

        /* 16. move */
        move: async (model, id, folderId) => {
            const tableName = await resolveTable(model);
            const entryId = extractEntryId(id);
            const locationJson = JSON.stringify({ folderId });

            await scopedQuery(tableName, model.tenant).where("entryId", entryId).update({
                location: locationJson,
                location_folderId: folderId
            });
        },

        /* 17. moveToBin */
        moveToBin: async (model, { entry, storageEntry }) => {
            const tableName = await resolveTable(model);
            const fieldColumns = getCachedFieldColumns(model);

            /* Build entry-level meta from storageEntry row. */
            const storageRow = entryToRow(storageEntry as CmsStorageEntry, fieldColumns, {
                isLatest: false,
                isPublished: false
            });
            const entryLevelMeta = getEntryLevelMeta(storageRow);

            const locationJson = storageEntry.location
                ? JSON.stringify(storageEntry.location)
                : null;
            const locationFolderId = storageEntry.location?.folderId ?? null;

            await scopedQuery(tableName, model.tenant)
                .where("entryId", entry.entryId)
                .update({
                    wbyDeleted: true,
                    isPublished: false,
                    binOriginalFolderId: storageEntry.binOriginalFolderId ?? null,
                    location_folderId: locationFolderId,
                    location: locationJson,
                    live: null,
                    ...entryLevelMeta
                });
        },

        /* 18. restoreFromBin */
        restoreFromBin: async (model, { entry, storageEntry }) => {
            const tableName = await resolveTable(model);
            const fieldColumns = getCachedFieldColumns(model);

            /* Build entry-level meta from storageEntry row. */
            const storageRow = entryToRow(storageEntry as CmsStorageEntry, fieldColumns, {
                isLatest: false,
                isPublished: false
            });
            const entryLevelMeta = getEntryLevelMeta(storageRow);

            const locationJson = storageEntry.location
                ? JSON.stringify(storageEntry.location)
                : null;
            const locationFolderId = storageEntry.location?.folderId ?? null;

            /* Update all rows: restore from bin. */
            await scopedQuery(tableName, model.tenant)
                .where("entryId", entry.entryId)
                .update({
                    wbyDeleted: false,
                    binOriginalFolderId: null,
                    location_folderId: locationFolderId,
                    location: locationJson,
                    ...entryLevelMeta
                });

            /* Find max version row and set isLatest = true on it. */
            /* First, clear all isLatest flags. */
            await scopedQuery(tableName, model.tenant)
                .where("entryId", entry.entryId)
                .update({ isLatest: false });

            const maxVersionRow = await scopedQuery(tableName, model.tenant)
                .where("entryId", entry.entryId)
                .orderBy("version", "desc")
                .first();

            if (maxVersionRow) {
                await scopedQuery(tableName, model.tenant)
                    .where("id", maxVersionRow.id)
                    .update({ isLatest: true });
            }

            return entry;
        },

        /* 19. deleteRevision (RC-4) */
        deleteRevision: async (model, { storageEntry, latestStorageEntry }) => {
            const tableName = await resolveTable(model);
            const fieldColumns = getCachedFieldColumns(model);

            /* Check if deleted row was published before deleting. */
            const deletedRow = await scopedQuery(tableName, model.tenant)
                .where("id", storageEntry.id)
                .first();

            const wasPublished = deletedRow ? deletedRow.isPublished : false;

            /* Delete the row. */
            await scopedQuery(tableName, model.tenant).where("id", storageEntry.id).delete();

            /* If deleted row was published: clear live on all remaining rows. */
            if (wasPublished) {
                await scopedQuery(tableName, model.tenant)
                    .where("entryId", storageEntry.entryId)
                    .update({ live: null });
            }

            /* If latestStorageEntry is provided: update its row with full data + isLatest = true. */
            if (latestStorageEntry) {
                const latestRow = entryToRow(latestStorageEntry as CmsStorageEntry, fieldColumns, {
                    isLatest: true,
                    isPublished: latestStorageEntry.status === "published"
                });
                latestRow.tenant = model.tenant;

                if (wasPublished) {
                    latestRow.live = null;
                }

                await scopedQuery(tableName, model.tenant)
                    .where("id", latestStorageEntry.id)
                    .update(latestRow);
            }
        },

        /* 20. delete */
        delete: async (model, { entry }) => {
            const tableName = await resolveTable(model);
            const entryId = extractEntryId(entry.id);

            await scopedQuery(tableName, model.tenant).where("entryId", entryId).delete();
        },

        /* 21. deleteMultipleEntries */
        deleteMultipleEntries: async (model, { entries }) => {
            const tableName = await resolveTable(model);

            await scopedQuery(tableName, model.tenant).whereIn("entryId", entries).delete();
        },

        /* 22. getUniqueFieldValues */
        getUniqueFieldValues: async (model, { where, fieldId }) => {
            const tableName = await resolveTable(model);
            const fields = getCachedModelFields(model);
            const field = fields[fieldId];

            if (!field) {
                return [];
            }

            const column = field.columnName;

            const qb = scopedQuery(tableName, model.tenant)
                .select(knex.raw("?? as ??", [column, "value"]))
                .count({ count: "*" })
                .groupBy(column)
                .orderBy("count", "desc")
                .orderBy(column, "asc");

            applyWhere({
                query: qb,
                where,
                model,
                operatorRegistry,
                filterRegistry,
                fields
            });

            const rows = (await qb) as Record<string, unknown>[];

            return rows.map(row => ({
                value: String(row.value ?? ""),
                count: Number(row.count ?? 0)
            }));
        }
    } as CmsEntryStorageOperations;
};
