// packages/api-headless-cms-pg-os/src/operations/entry/index.ts
import type { Knex } from "knex";
import type {
    CmsEntry,
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsDeleteEntriesParams,
    CmsEntryStorageOperationsDeleteParams,
    CmsEntryStorageOperationsDeleteRevisionParams,
    CmsEntryStorageOperationsGetParams,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsMoveToBinParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import type { Container } from "@webiny/feature/api";
import type { PluginsContainer } from "@webiny/plugins";
import type { Client as OpenSearchClient } from "@webiny/api-opensearch";
import {
    createLimit,
    decodeCursor,
    encodeCursor,
    getTotalCount,
    type OpenSearchSearchResponse
} from "@webiny/api-opensearch";
import type { OpenSearchQueryBuilderOperatorRegistry } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type { OpenSearchFieldFactory } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { createEntriesStorageOperations as createSqlEntriesStorageOperations } from "@webiny/api-headless-cms-sql/operations/entry/index.js";
import type { EntryTableManager } from "@webiny/api-headless-cms-sql/features/entryTableManager/abstractions.js";
import { createStorageModelAccessor } from "@webiny/api-headless-cms-storage";
import { createElasticsearchBody } from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/body.js";
import { shouldIgnoreEsResponseError } from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/shouldIgnoreEsResponseError.js";
import { extractEntriesFromIndex } from "@webiny/api-headless-cms-utils-os/helpers/entryIndexHelpers.js";
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import type { CmsIndexEntry } from "@webiny/api-headless-cms-utils-os/types.js";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
import type { CmsEntryOpenSearchFilterRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFilter/index.js";
import type { CmsEntryOpenSearchBodyModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchBodyModifier/index.js";
import type { CmsEntryOpenSearchSortModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchSortModifier/index.js";
import type { CmsEntryOpenSearchQueryModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchQueryModifier/index.js";
import type { CmsEntryOpenSearchValueSearchRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValueSearch/index.js";
import type { CmsEntryOpenSearchFullTextSearch } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFullTextSearch/index.js";
import type { CompressionHandler } from "@webiny/utils/features/compression/abstractions/CompressionHandler.js";
import type { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import { createSyncWriter } from "./syncWriter.js";

interface CreateEntriesStorageOperationsParams {
    knex: Knex;
    container: Container;
    plugins: PluginsContainer;
    elasticsearch: OpenSearchClient;
    entryTableManager: EntryTableManager.Interface;
    syncTableManager: SyncTableManager.Interface;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
    filterRegistry: CmsEntryOpenSearchFilterRegistry.Interface;
    compressionHandler: CompressionHandler.Interface;
    bodyModifiers: CmsEntryOpenSearchBodyModifier.Interface[];
    sortModifiers: CmsEntryOpenSearchSortModifier.Interface[];
    queryModifiers: CmsEntryOpenSearchQueryModifier.Interface[];
    valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface;
    fullTextSearches: CmsEntryOpenSearchFullTextSearch.Interface[];
    operatorRegistry: OpenSearchQueryBuilderOperatorRegistry.Interface;
    fieldFactory: OpenSearchFieldFactory.Interface;
}

/*
 * Extracts the entryId part out of a revision id ("<entryId>#<version>" -> "<entryId>").
 * Mirrors the helper of the same name in the SQL package.
 */
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
    const {
        knex,
        container,
        plugins,
        elasticsearch,
        entryTableManager,
        syncTableManager,
        fieldRegistry,
        fieldIndexRegistry,
        filterRegistry,
        compressionHandler,
        bodyModifiers,
        sortModifiers,
        queryModifiers,
        valueSearchRegistry,
        fullTextSearches,
        operatorRegistry,
        fieldFactory
    } = params;

    const sqlOps = createSqlEntriesStorageOperations({
        knex: { client: knex },
        entryTableManager,
        container,
        plugins
    });

    const { getModel: getStorageOperationsModel } = createStorageModelAccessor(container);

    const syncWriter = createSyncWriter({
        knex,
        syncTableManager,
        fieldIndexRegistry,
        compressionHandler
    });

    /* Every write op needs the sync table to exist before writing sync rows. */
    const ensureSyncTable = async (): Promise<void> => {
        await syncTableManager.ensureTable();
    };

    const writeSyncForEntry = async <T extends CmsEntryValues>(
        model: StorageOperationsCmsModel<T>,
        entry: CmsEntry<T>,
        storageEntry: CmsStorageEntry<T>
    ): Promise<void> => {
        await syncWriter.writeLatest({ model, entry, storageEntry });
        if (entry.status === "published") {
            await syncWriter.writePublished({ model, entry, storageEntry });
        }
    };

    /*
     * Re-reads the latest/published revisions straight from PG and re-syncs them.
     * Used after operations (move, moveToBin, restoreFromBin) that mutate every
     * revision's data in bulk - the params we received only carry the entry that
     * triggered the operation, not the (possibly different) latest/published ones.
     */
    const resyncLatestAndPublishedFromPg = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        model: StorageOperationsCmsModel<T>,
        id: string
    ): Promise<void> => {
        const latest = await sqlOps.getLatestRevisionByEntryId<T>(initialModel, { id });
        if (latest) {
            await syncWriter.writeLatest({ model, entry: latest, storageEntry: latest });
        }

        const published = await sqlOps.getPublishedRevisionByEntryId<T>(initialModel, { id });
        if (published) {
            await syncWriter.writePublished({ model, entry: published, storageEntry: published });
        } else {
            await syncWriter.removePublished({ model, entryId: extractEntryId(id) });
        }
    };

    // --- WRITE OPERATIONS ---

    const create: CmsEntryStorageOperations["create"] = async (initialModel, createParams) => {
        await ensureSyncTable();
        const result = await sqlOps.create(initialModel, createParams);
        const model = getStorageOperationsModel(initialModel);
        await writeSyncForEntry(model, createParams.entry, createParams.storageEntry);
        return result;
    };

    const createRevisionFrom: CmsEntryStorageOperations["createRevisionFrom"] = async (
        initialModel,
        revisionParams
    ) => {
        await ensureSyncTable();
        const result = await sqlOps.createRevisionFrom(initialModel, revisionParams);
        const model = getStorageOperationsModel(initialModel);
        await writeSyncForEntry(model, revisionParams.entry, revisionParams.storageEntry);
        return result;
    };

    const update: CmsEntryStorageOperations["update"] = async (initialModel, updateParams) => {
        await ensureSyncTable();
        const result = await sqlOps.update(initialModel, updateParams);
        const model = getStorageOperationsModel(initialModel);
        await writeSyncForEntry(model, updateParams.entry, updateParams.storageEntry);
        return result;
    };

    const publish: CmsEntryStorageOperations["publish"] = async (initialModel, publishParams) => {
        await ensureSyncTable();
        const result = await sqlOps.publish(initialModel, publishParams);
        const model = getStorageOperationsModel(initialModel);
        await syncWriter.writeLatest({
            model,
            entry: publishParams.entry,
            storageEntry: publishParams.storageEntry
        });
        await syncWriter.writePublished({
            model,
            entry: publishParams.entry,
            storageEntry: publishParams.storageEntry
        });
        return result;
    };

    const unpublish: CmsEntryStorageOperations["unpublish"] = async (
        initialModel,
        unpublishParams
    ) => {
        await ensureSyncTable();
        const result = await sqlOps.unpublish(initialModel, unpublishParams);
        const model = getStorageOperationsModel(initialModel);
        await syncWriter.writeLatest({
            model,
            entry: unpublishParams.entry,
            storageEntry: unpublishParams.storageEntry
        });
        await syncWriter.removePublished({ model, entryId: unpublishParams.entry.entryId });
        return result;
    };

    const move: CmsEntryStorageOperations["move"] = async (initialModel, id, folderId) => {
        await ensureSyncTable();
        await sqlOps.move(initialModel, id, folderId);
        /*
         * `move` patches every revision's data (location.folderId) in bulk in the SQL layer,
         * so we re-read the latest/published revisions and re-sync them.
         */
        const model = getStorageOperationsModel(initialModel);
        await resyncLatestAndPublishedFromPg(initialModel, model, id);
    };

    const moveToBin: CmsEntryStorageOperations["moveToBin"] = async (
        initialModel,
        moveToBinParams: CmsEntryStorageOperationsMoveToBinParams
    ) => {
        await ensureSyncTable();
        await sqlOps.moveToBin(initialModel, moveToBinParams);
        /* Same as `move` - every revision was patched (wbyDeleted, location) in bulk. */
        const model = getStorageOperationsModel(initialModel);
        await resyncLatestAndPublishedFromPg(initialModel, model, moveToBinParams.entry.id);
    };

    const restoreFromBin: CmsEntryStorageOperations["restoreFromBin"] = async (
        initialModel,
        restoreParams
    ) => {
        await ensureSyncTable();
        const result = await sqlOps.restoreFromBin(initialModel, restoreParams);
        /* Same as `move` - every revision was patched (wbyDeleted, location) in bulk. */
        const model = getStorageOperationsModel(initialModel);
        await resyncLatestAndPublishedFromPg(initialModel, model, restoreParams.entry.id);
        return result;
    };

    const deleteEntry: CmsEntryStorageOperations["delete"] = async (
        initialModel,
        deleteParams: CmsEntryStorageOperationsDeleteParams
    ) => {
        await ensureSyncTable();
        const model = getStorageOperationsModel(initialModel);
        const { entryId } = deleteParams.entry;
        await sqlOps.delete(initialModel, deleteParams);
        await syncWriter.removeLatest({ model, entryId });
        await syncWriter.removePublished({ model, entryId });
    };

    const deleteRevision: CmsEntryStorageOperations["deleteRevision"] = async (
        initialModel,
        deleteRevisionParams: CmsEntryStorageOperationsDeleteRevisionParams
    ) => {
        await ensureSyncTable();
        await sqlOps.deleteRevision(initialModel, deleteRevisionParams);
        const model = getStorageOperationsModel(initialModel);

        /*
         * The SQL layer promotes `latestStorageEntry` (if any) to be the new latest
         * revision, so we need to re-sync it as the new "L" record.
         */
        const { latestStorageEntry, storageEntry } = deleteRevisionParams;
        if (latestStorageEntry) {
            await syncWriter.writeLatest({
                model,
                entry: latestStorageEntry,
                storageEntry: latestStorageEntry
            });
        } else {
            await syncWriter.removeLatest({ model, entryId: storageEntry.entryId });
        }

        /* If the deleted revision was the published one, its "P" record is gone. */
        if (storageEntry.status === "published") {
            await syncWriter.removePublished({ model, entryId: storageEntry.entryId });
        }
    };

    const deleteMultipleEntries: CmsEntryStorageOperations["deleteMultipleEntries"] = async (
        initialModel,
        deleteMultipleParams: CmsEntryStorageOperationsDeleteEntriesParams
    ) => {
        await ensureSyncTable();
        const model = getStorageOperationsModel(initialModel);
        await sqlOps.deleteMultipleEntries(initialModel, deleteMultipleParams);

        for (const id of deleteMultipleParams.entries) {
            const entryId = extractEntryId(id);
            await syncWriter.removeLatest({ model, entryId });
            await syncWriter.removePublished({ model, entryId });
        }
    };

    // --- LIST / SEARCH OPERATIONS (OpenSearch) ---

    const list = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        listParams: CmsEntryStorageOperationsListParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);
        const limit = createLimit(listParams.limit);

        const { index } = configurations.es({ model });

        const body = createElasticsearchBody({
            model,
            fieldRegistry,
            fieldIndexRegistry,
            bodyModifiers,
            sortModifiers,
            queryModifiers,
            valueSearchRegistry,
            fullTextSearches,
            filterRegistry,
            fieldFactory,
            params: {
                ...listParams,
                limit,
                after: decodeCursor(listParams.after)
            },
            operatorRegistry
        });

        let response: OpenSearchSearchResponse;
        try {
            response = await elasticsearch.search({ index, body });
        } catch (error) {
            if (shouldIgnoreEsResponseError(error)) {
                return { hasMoreItems: false, totalCount: 0, cursor: null, items: [] };
            }
            throw new WebinyError(error.message, error.code || "OPENSEARCH_ERROR", {
                error,
                index,
                body,
                model
            });
        }

        const { hits, total } = response.body.hits;

        const items = extractEntriesFromIndex<T>({
            fieldRegistry,
            fieldIndexRegistry,
            model,
            entries: hits.map(item => item._source as CmsIndexEntry<T>)
        });

        const hasMoreItems = items.length > limit;
        if (hasMoreItems) {
            items.pop();
        }

        // @ts-expect-error - `sort` is present on the hit, but narrowed away by `_source: false` typing.
        const cursor = items.length > 0 ? encodeCursor(hits[items.length - 1].sort) || null : null;

        return {
            hasMoreItems,
            totalCount: getTotalCount(total),
            cursor,
            items
        };
    };

    const get = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        getParams: CmsEntryStorageOperationsGetParams
    ) => {
        const { items } = await list<T>(initialModel, { ...getParams, limit: 1 });
        return items.shift() || null;
    };

    const getUniqueFieldValues: CmsEntryStorageOperations["getUniqueFieldValues"] = async (
        model: CmsModel,
        uniqueFieldValuesParams: CmsEntryStorageOperationsGetUniqueFieldValuesParams
    ) => {
        const { where, fieldId } = uniqueFieldValuesParams;
        const { index } = configurations.es({ model });

        const field = model.fields.find(f => f.fieldId === fieldId);
        if (!field) {
            return [];
        }

        const initialBody = createElasticsearchBody({
            model,
            fieldRegistry,
            fieldIndexRegistry,
            bodyModifiers,
            sortModifiers,
            queryModifiers,
            valueSearchRegistry,
            fullTextSearches,
            filterRegistry,
            fieldFactory,
            params: { limit: 1, where },
            operatorRegistry
        });

        const body = {
            ...initialBody,
            size: 0,
            aggregations: {
                getUniqueFieldValues: {
                    terms: {
                        field: `values.${field.storageId}.keyword`,
                        size: 1000000
                    }
                }
            }
        };

        let response: OpenSearchSearchResponse;
        try {
            response = await elasticsearch.search({ index, body });
        } catch (error) {
            if (shouldIgnoreEsResponseError(error)) {
                return [];
            }
            throw new WebinyError(error.message, error.code || "OPENSEARCH_ERROR", {
                error,
                index,
                model,
                body
            });
        }

        const aggregations = response.body.aggregations || {};
        const agg = aggregations["getUniqueFieldValues"];
        const buckets = agg && "buckets" in agg && Array.isArray(agg.buckets) ? agg.buckets : [];
        return buckets.map((bucket: { key: string; doc_count: number }) => ({
            value: bucket.key,
            count: bucket.doc_count
        }));
    };

    // --- RETURN ALL OPERATIONS ---

    return {
        create,
        createRevisionFrom,
        update,
        move,
        delete: deleteEntry,
        moveToBin,
        restoreFromBin,
        deleteRevision,
        deleteMultipleEntries,
        publish,
        unpublish,
        get,
        list,
        getRevisions: sqlOps.getRevisions,
        getRevisionById: sqlOps.getRevisionById,
        getByIds: sqlOps.getByIds,
        getLatestByIds: sqlOps.getLatestByIds,
        getPublishedByIds: sqlOps.getPublishedByIds,
        getLatestRevisionByEntryId: sqlOps.getLatestRevisionByEntryId,
        getPublishedRevisionByEntryId: sqlOps.getPublishedRevisionByEntryId,
        getPreviousRevision: sqlOps.getPreviousRevision,
        getUniqueFieldValues
    };
};
