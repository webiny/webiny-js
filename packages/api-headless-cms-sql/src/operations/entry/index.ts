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
import { entryToRow, rowToEntry, getEntryLevelMeta } from "./mappers.js";
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
    const { getModel: getStorageOperationsModel } = createStorageModelAccessor(plugins);

    /* Returns a base query builder for the entries table. */
    const query = (): Knex.QueryBuilder<IEntryRow> => {
        return knex<IEntryRow>(entryTableManager.getTableName());
    };

    /*
     * Converts a row to a CmsEntry.
     *
     * Unlike the DDB implementation, SQL stores values with field IDs (not storage IDs),
     * so no key conversion is needed. The CMS layer's storageEntry already uses field IDs.
     */
    const convertFromStorage = <T extends CmsEntryValues = CmsEntryValues>(
        row: IEntryRow,
        _model: CmsModel
    ): CmsEntry<T> => {
        return rowToEntry(row) as CmsEntry<T>;
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
        const fromStorage = createStorageTransformCallable(storageTransformRegistry, model);

        const records = await Promise.all(
            rows.map(async row => {
                const entry = rowToEntry(row) as CmsStorageEntry;

                /* Apply fromStorage transforms (e.g., decompress rich text). */
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
        /* 1. getByIds */
        getByIds: async (model, { ids }) => {
            await entryTableManager.ensureTable();

            const idList = ids as string[];

            const rows: IEntryRow[] = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .whereIn("id", idList);

            /* Preserve input order. */
            const entries = rows.map(row => convertFromStorage(row, model));
            const byId = new Map(entries.map(e => [e.id, e]));

            return idList.map(id => byId.get(id)).filter(Boolean) as typeof entries;
        },

        /* 2. getPublishedByIds */
        getPublishedByIds: async (model, { ids }) => {
            await entryTableManager.ensureTable();

            const idList = ids as string[];
            const entryIds = idList.map(extractEntryId);

            const rows: IEntryRow[] = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .whereIn("entryId", entryIds)
                .andWhere("isPublished", true);

            /* Preserve input order by entryId. */
            const entries = rows.map(row => convertFromStorage(row, model));
            const byEntryId = new Map(entries.map(e => [e.entryId, e]));

            return entryIds.map(eid => byEntryId.get(eid)).filter(Boolean) as typeof entries;
        },

        /* 3. getLatestByIds */
        getLatestByIds: async (model, { ids }) => {
            await entryTableManager.ensureTable();

            const idList = ids as string[];
            const entryIds = idList.map(extractEntryId);

            const rows: IEntryRow[] = await query()
                .where("tenant", model.tenant)
                .andWhere("modelId", model.modelId)
                .whereIn("entryId", entryIds)
                .andWhere("isLatest", true);

            /* Preserve input order by entryId. */
            const entries = rows.map(row => convertFromStorage(row, model));
            const byEntryId = new Map(entries.map(e => [e.entryId, e]));

            return entryIds.map(eid => byEntryId.get(eid)).filter(Boolean) as typeof entries;
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

            const isPublished = entry.status === "published";

            /* Mark old latest as no longer latest. */
            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .andWhere("isLatest", true)
                .update({ isLatest: false });

            /* If new revision is published, unpublish previously published revision. */
            if (isPublished) {
                await query()
                    .where("tenant", model.tenant)
                    .andWhere("entryId", entry.entryId)
                    .andWhere("isPublished", true)
                    .update({ isPublished: false, status: "unpublished" });
            }

            /* Insert the new revision as latest. */
            const row = entryToRow(storageEntry as CmsStorageEntry, model, {
                isLatest: true,
                isPublished
            });

            await query().insert(row);

            return entry;
        },

        /* 13. update */
        update: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            const row = entryToRow(storageEntry as CmsStorageEntry, model, {
                isLatest: false,
                isPublished: false
            });

            /* Omit flags so the UPDATE preserves existing isLatest/isPublished values. */
            const { isLatest: _il, isPublished: _ip, ...rowWithoutFlags } = row;

            await query()
                .where("tenant", model.tenant)
                .andWhere("id", storageEntry.id)
                .update(rowWithoutFlags);

            /* Sync entry-level meta to the latest revision (skips self if this IS the latest). */
            const entryLevelMeta = getEntryLevelMeta(row);

            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .andWhere("isLatest", true)
                .andWhere("id", "!=", storageEntry.id)
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

            /* Step 2: Update target row — preserve isLatest, set isPublished=true. */
            const row = entryToRow(storageEntry as CmsStorageEntry, model, {
                isLatest: false,
                isPublished: true
            });

            const { isLatest: _il, ...rowWithoutIsLatest } = row;

            await query()
                .where("tenant", model.tenant)
                .andWhere("id", storageEntry.id)
                .update(rowWithoutIsLatest);

            /* Step 3: Sync entry-level meta + live to the latest revision (skips self if this IS the latest). */
            const entryLevelMeta = getEntryLevelMeta(row);
            const liveValue = JSON.stringify({ version: entry.version });

            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .andWhere("isLatest", true)
                .andWhere("id", "!=", storageEntry.id)
                .update({
                    ...entryLevelMeta,
                    live: liveValue
                });

            return entry;
        },

        /* 15. unpublish */
        unpublish: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            const row = entryToRow(storageEntry as CmsStorageEntry, model, {
                isLatest: false,
                isPublished: false
            });

            /* Preserve isLatest, force isPublished=false. */
            const { isLatest: _il, ...rowWithoutIsLatest } = row;

            await query()
                .where("tenant", model.tenant)
                .andWhere("id", storageEntry.id)
                .update(rowWithoutIsLatest);

            /* Sync entry-level meta + live=null to the latest revision (skips self if this IS the latest). */
            const entryLevelMeta = getEntryLevelMeta(row);

            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .andWhere("isLatest", true)
                .andWhere("id", "!=", storageEntry.id)
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

            /* Mark all rows as deleted. Preserve isPublished for restore. */
            await query()
                .where("tenant", model.tenant)
                .andWhere("entryId", entry.entryId)
                .update({
                    wbyDeleted: true,
                    binOriginalFolderId: storageEntry.binOriginalFolderId ?? null,
                    location_folderId: locationFolderId,
                    location: locationJson,
                    ...entryLevelMeta
                });
        },

        /* 18. restoreFromBin */
        restoreFromBin: async (model, { entry, storageEntry }) => {
            await entryTableManager.ensureTable();

            /* Build restored meta from storageEntry. */
            const storageRow = entryToRow(storageEntry as CmsStorageEntry, model, {
                isLatest: false,
                isPublished: false
            });
            const entryLevelMeta = getEntryLevelMeta(storageRow);

            const locationJson = storageEntry.location
                ? JSON.stringify(storageEntry.location)
                : null;
            const locationFolderId = storageEntry.location?.folderId ?? null;

            /* Update all rows: restore from bin. Preserve isLatest/isPublished. */
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

            return entry;
        },

        /* 19. deleteRevision */
        deleteRevision: async (model, { storageEntry, latestStorageEntry }) => {
            await entryTableManager.ensureTable();

            const wasPublished = storageEntry.status === "published";

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

            /* Extract entryId from composite IDs (e.g., "abc#0001" → "abc"). */
            const entryIds = entries.map(extractEntryId);

            await query().where("tenant", model.tenant).whereIn("entryId", entryIds).delete();
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

            return aggregateUniqueFieldValues(items, field.fieldId);
        }
    } as CmsEntryStorageOperations;
};
