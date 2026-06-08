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

        const cases: Array<{ id: string; data: string }> = siblings.map((row: IEntryRow) => {
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
                    cases.flatMap((c: { id: string; data: string }) => [c.id, c.data])
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

        const cases: Array<{ id: string; data: string }> = rows.map((row: IEntryRow) => {
            const parsed = JSON.parse(row.data);
            patch(parsed);
            return { id: row.id, data: JSON.stringify(parsed) };
        });

        const update: Record<string, unknown> = {
            data: knex.raw(
                `CASE id ${cases.map(() => "WHEN ? THEN ?").join(" ")} END`,
                cases.flatMap((c: { id: string; data: string }) => [c.id, c.data])
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
                    const p = parsed as unknown as Record<string, unknown>;
                    p["wbyDeleted"] = true;
                    p["binOriginalFolderId"] = storageEntry.binOriginalFolderId ?? null;
                    p["location"] = storageEntry.location ?? null;

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
                            p[field] = (storageEntry as Record<string, unknown>)[field];
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
                    const p = parsed as unknown as Record<string, unknown>;
                    p["wbyDeleted"] = false;
                    p["binOriginalFolderId"] = null;
                    p["location"] = storageEntry.location ?? null;

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
                            p[field] = (storageEntry as Record<string, unknown>)[field];
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
