import type { Knex } from "knex";
import type {
    CmsEntry,
    CmsEntryListWhere,
    CmsEntryStorageOperations,
    CmsEntryUniqueValue,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { PluginsContainer } from "@webiny/plugins";
import type { CmsContext } from "~/types.js";
import type { KnexInstance } from "~/features/knexInstance/abstractions.js";
import type { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import type { IEntryRow } from "./types.js";
import { entryToRow, rowToEntry, getEntryLevelMeta } from "./mappers.js";
import { StorageOperationsCmsModelPlugin } from "@webiny/api-headless-cms";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";
import { StorageTransformRegistry } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { decodeCursor, encodeCursor } from "@webiny/utils";
import { createFields, filter, sort, ValueFilterRegistry } from "@webiny/db-utils";
import type { FilterItemFromStorage } from "@webiny/db-utils";

interface CreateEntriesStorageOperationsParams {
    knex: KnexInstance.Interface;
    entryTableManager: EntryTableManager.Interface;
    container: CmsContext["container"];
    plugins: PluginsContainer;
}

const MAX_LIST_LIMIT = 1000000;

/* Extracts the entryId portion from a composite id like "entryId#0001". */
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

    let storageOperationsCmsModelPlugin: StorageOperationsCmsModelPlugin | undefined;

    const getStorageOperationsCmsModelPlugin = () => {
        if (storageOperationsCmsModelPlugin) {
            return storageOperationsCmsModelPlugin;
        }
        storageOperationsCmsModelPlugin = plugins.oneByType<StorageOperationsCmsModelPlugin>(
            StorageOperationsCmsModelPlugin.type
        );
        return storageOperationsCmsModelPlugin;
    };

    const getStorageOperationsModel = <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel
    ): StorageOperationsCmsModel<T> => {
        const plugin = getStorageOperationsCmsModelPlugin();
        return plugin.getModel<T>(model);
    };

    const createStorageTransformCallable = (
        model: StorageOperationsCmsModel
    ): FilterItemFromStorage => {
        return (field, value) => {
            const fieldType = getBaseFieldType(field);
            const storageTransform = storageTransformRegistry.get(fieldType);

            if (!storageTransform) {
                return value;
            }

            return storageTransform.fromStorage({
                model,
                field,
                value,
                getStorageTransform(ft: string) {
                    return storageTransformRegistry.get(ft) || storageTransformRegistry.get("*")!;
                }
            });
        };
    };

    /* Returns a base query builder for the entries table. */
    const query = (): Knex.QueryBuilder<IEntryRow> => {
        return knex<IEntryRow>(entryTableManager.getTableName());
    };

    /* Converts a row to a CmsEntry, applying storage key conversion. */
    const convertFromStorage = <T extends CmsEntryValues = CmsEntryValues>(
        row: IEntryRow,
        model: CmsModel
    ): CmsEntry<T> => {
        const entry = rowToEntry(row) as CmsEntry<T>;

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

    /* Shared list implementation used by both list and get operations. */
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

        /* Step 1: Build base SQL query by mode. */
        const qb = query().where("tenant", model.tenant).andWhere("modelId", model.modelId);

        /* Determine list mode from where clause. */
        if (initialWhere.entryId) {
            /* Revision listing for one entry. */
            qb.andWhere("entryId", initialWhere.entryId);
        } else if (initialWhere.published === true) {
            qb.andWhere("isPublished", true);
        } else {
            /* Default: latest entries. */
            qb.andWhere("isLatest", true);
        }

        /* Apply wbyDeleted filter. */
        if (initialWhere.wbyDeleted !== undefined) {
            qb.andWhere("wbyDeleted", initialWhere.wbyDeleted);
        } else {
            qb.andWhere("wbyDeleted", false);
        }

        /* Step 2: Load all rows and map to entries. */
        const rows: IEntryRow[] = await qb;

        if (rows.length === 0) {
            return {
                hasMoreItems: false,
                totalCount: 0,
                cursor: null,
                items: [] as CmsEntry<T>[]
            };
        }

        /* Step 3: Apply CMS fromStorage transforms. */
        const fromStorage = createStorageTransformCallable(model);

        const records = await Promise.all(
            rows.map(async row => {
                const entry = rowToEntry(row) as CmsStorageEntry;

                /* Apply storage key conversion if available. */
                const storageModel = model as StorageOperationsCmsModel;

                if (storageModel.convertValueKeyFromStorage) {
                    entry.values = storageModel.convertValueKeyFromStorage({
                        fields: model.fields,
                        values: entry.values
                    });
                }

                for (const field of model.fields) {
                    entry.values[field.fieldId] = await fromStorage(
                        field,
                        entry.values[field.fieldId]
                    );
                }

                return entry as CmsEntry<T>;
            })
        );

        /* Step 4: In-memory filtering via db-utils. */
        const where: Partial<CmsEntryListWhere> = { ...initialWhere };
        delete where["published"];
        delete where["latest"];

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

        /* Step 5: Total count. */
        const totalCount = filteredItems.length;

        /* Step 6: Sort via db-utils. */
        const sortedItems = sort<T>({
            model,
            plugins,
            items: filteredItems,
            sort: sortBy,
            fields: modelFields
        });

        /* Step 7: Offset pagination. */
        const start = parseInt((decodeCursor(after) as string) || "0") || 0;
        const hasMoreItems = totalCount > start + limit;
        const end = limit > totalCount + start + limit ? undefined : start + limit;
        const slicedItems = sortedItems.slice(start, end);
        const cursor = encodeCursor(`${start + limit}`);

        return {
            hasMoreItems,
            totalCount,
            cursor,
            items: slicedItems
        };
    };

    return {
        /* 1. getByIds */
        getByIds: async (model, { ids }) => {
            await entryTableManager.ensureTable();

            const rows: IEntryRow[] = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .whereIn("id", ids as string[]);

            return rows.map(row => convertFromStorage(row, model));
        },

        /* 2. getPublishedByIds */
        getPublishedByIds: async (model, { ids }) => {
            await entryTableManager.ensureTable();

            const entryIds = (ids as string[]).map(extractEntryId);

            const rows: IEntryRow[] = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .whereIn("entryId", entryIds)
                .andWhere("isPublished", true);

            return rows.map(row => convertFromStorage(row, model));
        },

        /* 3. getLatestByIds */
        getLatestByIds: async (model, { ids }) => {
            await entryTableManager.ensureTable();

            const entryIds = (ids as string[]).map(extractEntryId);

            const rows: IEntryRow[] = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .whereIn("entryId", entryIds)
                .andWhere("isLatest", true);

            return rows.map(row => convertFromStorage(row, model));
        },

        /* 4. getRevisions */
        getRevisions: async (model, { id }) => {
            await entryTableManager.ensureTable();

            const entryId = extractEntryId(id);

            const rows: IEntryRow[] = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .where("entryId", entryId)
                .orderBy("version", "desc");

            return rows.map(row => convertFromStorage(row, model));
        },

        /* 5. getRevisionById */
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

            return convertFromStorage(row, model);
        },

        /* 6. getPublishedRevisionByEntryId */
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

            return convertFromStorage(row, model);
        },

        /* 7. getLatestRevisionByEntryId */
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

            return convertFromStorage(row, model);
        },

        /* 8. getPreviousRevision */
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

            return convertFromStorage(row, model);
        },

        /* 9. get */
        get: async (model, params) => {
            const { items } = await listEntries(model, {
                ...params,
                limit: 1
            });

            return items.shift() || null;
        },

        /* 10. list */
        list: async (model, params) => {
            return listEntries(model, params);
        },

        /* 11. create */
        create: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            const isPublished = storageEntry.status === "published";

            const row = entryToRow(storageEntry as CmsStorageEntry, model, {
                isLatest: true,
                isPublished
            });

            await query().insert(row);

            return entry;
        },

        /* 12. createRevisionFrom */
        createRevisionFrom: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            /* Mark old latest as no longer latest. */
            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .andWhere("isLatest", true)
                .update({ isLatest: false });

            /* Insert the new revision as latest. */
            const row = entryToRow(storageEntry as CmsStorageEntry, model, {
                isLatest: true,
                isPublished: false
            });

            await query().insert(row);

            return entry;
        },

        /* 13. update */
        update: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            /* Read existing row to preserve isLatest/isPublished flags. */
            const existingRow = await query()
                .where("tenant", model.tenant)
                .andWhere("id", storageEntry.id)
                .first();

            const isLatest = existingRow ? existingRow.isLatest : false;
            const isPublished = existingRow ? existingRow.isPublished : false;

            const row = entryToRow(storageEntry as CmsStorageEntry, model, {
                isLatest,
                isPublished
            });

            await query().where("tenant", model.tenant).andWhere("id", storageEntry.id).update(row);

            /* Sync entry-level meta to ALL revisions. */
            const entryLevelMeta = getEntryLevelMeta(row);

            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .update(entryLevelMeta);

            return entry;
        },

        /* 14. publish */
        publish: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            /* Step 1: Unpublish the currently published row. */
            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .andWhere("isPublished", true)
                .update({ isPublished: false, status: "unpublished" });

            /* Step 2: Read current row to get isLatest flag. */
            const currentRow = await query()
                .where("tenant", model.tenant)
                .andWhere("id", storageEntry.id)
                .first();

            const isLatest = currentRow ? currentRow.isLatest : false;

            /* Step 3: Update target row with full storageEntry data + isPublished=true. */
            const row = entryToRow(storageEntry as CmsStorageEntry, model, {
                isLatest,
                isPublished: true
            });

            await query().where("tenant", model.tenant).andWhere("id", storageEntry.id).update(row);

            /* Step 4: Update ALL rows for entryId: live + entry-level meta. */
            const entryLevelMeta = getEntryLevelMeta(row);
            const liveValue = JSON.stringify({ version: entry.version });

            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .update({
                    ...entryLevelMeta,
                    live: liveValue
                });

            return entry;
        },

        /* 15. unpublish */
        unpublish: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            /* Read current row to get isLatest flag. */
            const existingRow = await query()
                .where("tenant", model.tenant)
                .andWhere("id", storageEntry.id)
                .first();

            const isLatest = existingRow ? existingRow.isLatest : false;

            const row = entryToRow(storageEntry as CmsStorageEntry, model, {
                isLatest,
                isPublished: false
            });

            await query().where("tenant", model.tenant).andWhere("id", storageEntry.id).update(row);

            /* Update ALL rows for entryId: live=null + entry-level meta. */
            const entryLevelMeta = getEntryLevelMeta(row);

            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .update({
                    ...entryLevelMeta,
                    live: null
                });

            return entry;
        },

        /* 16. move */
        move: async (model, id, folderId) => {
            await entryTableManager.ensureTable();

            const entryId = extractEntryId(id);
            const locationJson = JSON.stringify({ folderId });

            await query().where("tenant", model.tenant).andWhere("entryId", entryId).update({
                location: locationJson,
                location_folderId: folderId
            });
        },

        /* 17. moveToBin */
        moveToBin: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            /* Build entry-level meta from storageEntry row. */
            const storageRow = entryToRow(storageEntry as CmsStorageEntry, model, {
                isLatest: false,
                isPublished: false
            });
            const entryLevelMeta = getEntryLevelMeta(storageRow);

            const locationJson = storageEntry.location
                ? JSON.stringify(storageEntry.location)
                : null;
            const locationFolderId = storageEntry.location?.folderId ?? null;

            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
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
            await entryTableManager.ensureTable();

            /* Build entry-level meta from storageEntry row. */
            const storageRow = entryToRow(storageEntry as CmsStorageEntry, model, {
                isLatest: false,
                isPublished: false
            });
            const entryLevelMeta = getEntryLevelMeta(storageRow);

            const locationJson = storageEntry.location
                ? JSON.stringify(storageEntry.location)
                : null;
            const locationFolderId = storageEntry.location?.folderId ?? null;

            /* Update all rows: restore from bin. */
            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .update({
                    wbyDeleted: false,
                    binOriginalFolderId: null,
                    location_folderId: locationFolderId,
                    location: locationJson,
                    ...entryLevelMeta
                });

            /* Clear all isLatest flags. */
            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .update({ isLatest: false });

            /* Find highest version and set isLatest=true. */
            const maxVersionRow = await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .orderBy("version", "desc")
                .first();

            if (maxVersionRow) {
                await query()
                    .where("tenant", model.tenant)
                    .andWhere("id", maxVersionRow.id)
                    .update({ isLatest: true });
            }

            return entry;
        },

        /* 19. deleteRevision */
        deleteRevision: async (model, { storageEntry, latestStorageEntry }) => {
            await entryTableManager.ensureTable();

            /* Check if deleted row was published before deleting. */
            const deletedRow = await query()
                .where("tenant", model.tenant)
                .andWhere("id", storageEntry.id)
                .first();

            const wasPublished = deletedRow ? deletedRow.isPublished : false;

            /* Delete the row. */
            await query().where("tenant", model.tenant).andWhere("id", storageEntry.id).delete();

            /* If deleted row was published: clear live on all remaining rows. */
            if (wasPublished) {
                await query()
                    .where("tenant", model.tenant)
                    .andWhere("entryId", storageEntry.entryId)
                    .update({ live: null });
            }

            /* If latestStorageEntry is provided: update its row with isLatest=true. */
            if (latestStorageEntry) {
                const latestRow = entryToRow(latestStorageEntry as CmsStorageEntry, model, {
                    isLatest: true,
                    isPublished: latestStorageEntry.status === "published"
                });

                if (wasPublished) {
                    latestRow.live = null;
                }

                await query()
                    .where("tenant", model.tenant)
                    .andWhere("id", latestStorageEntry.id)
                    .update(latestRow);
            }
        },

        /* 20. delete */
        delete: async (model, { entry }) => {
            await entryTableManager.ensureTable();

            const entryId = extractEntryId(entry.id);

            await query().where("tenant", model.tenant).andWhere("entryId", entryId).delete();
        },

        /* 21. deleteMultipleEntries */
        deleteMultipleEntries: async (model, { entries }) => {
            await entryTableManager.ensureTable();

            await query().where("tenant", model.tenant).whereIn("entryId", entries).delete();
        },

        /* 22. getUniqueFieldValues */
        getUniqueFieldValues: async (model, params) => {
            const { where, fieldId } = params;

            const field = model.fields.find(f => f.fieldId === fieldId);

            if (!field) {
                return [];
            }

            const { items } = await listEntries(model, {
                where,
                limit: MAX_LIST_LIMIT
            });

            const result: Record<string, CmsEntryUniqueValue> = {};

            for (const item of items) {
                const fieldValue = item.values[field.fieldId] as string[] | string | undefined;

                if (!fieldValue) {
                    continue;
                }

                const values = Array.isArray(fieldValue) ? fieldValue : [fieldValue];

                if (values.length === 0) {
                    continue;
                }

                for (const value of values) {
                    result[value] = {
                        value,
                        count: (result[value]?.count || 0) + 1
                    };
                }
            }

            return Object.values(result)
                .sort((a, b) => (a.value > b.value ? 1 : b.value > a.value ? -1 : 0))
                .sort((a, b) => b.count - a.count);
        }
    } as CmsEntryStorageOperations;
};
