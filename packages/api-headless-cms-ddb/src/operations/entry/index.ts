import WebinyError from "@webiny/error";
import { DataLoadersHandler } from "./dataLoaders";
import {
    CmsContentEntry,
    CmsContentEntryStorageOperations,
    CmsContentEntryStorageOperationsCreateParams,
    CmsContentEntryStorageOperationsCreateRevisionFromParams,
    CmsContentEntryStorageOperationsDeleteParams,
    CmsContentEntryStorageOperationsDeleteRevisionParams,
    CmsContentEntryStorageOperationsGetAllRevisionsParams,
    CmsContentEntryStorageOperationsGetByIdsParams,
    CmsContentEntryStorageOperationsGetLatestByIdsParams,
    CmsContentEntryStorageOperationsGetLatestRevisionParams,
    CmsContentEntryStorageOperationsGetParams,
    CmsContentEntryStorageOperationsGetPreviousRevisionParams,
    CmsContentEntryStorageOperationsGetPublishedByIdsParams,
    CmsContentEntryStorageOperationsGetRevisionParams,
    CmsContentEntryStorageOperationsGetRevisionsParams,
    CmsContentEntryStorageOperationsListParams,
    CmsContentEntryStorageOperationsPublishParams,
    CmsContentEntryStorageOperationsRequestChangesParams,
    CmsContentEntryStorageOperationsRequestReviewParams,
    CmsContentEntryStorageOperationsUnpublishParams,
    CmsContentEntryStorageOperationsUpdateParams,
    CmsContentModel,
    CONTENT_ENTRY_STATUS
} from "@webiny/api-headless-cms/types";
import { Entity } from "dynamodb-toolbox";
import { filterItems, buildModelFields, sortEntryItems } from "./utils";
import {
    createGSIPartitionKey,
    createGSISortKey,
    createLatestSortKey,
    createPartitionKey,
    createPublishedSortKey,
    createRevisionSortKey
} from "~/operations/entry/keys";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import {
    queryAll,
    QueryAllParams,
    queryOne,
    QueryOneParams
} from "@webiny/db-dynamodb/utils/query";
import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { PluginsContainer } from "@webiny/plugins";
import { decodeCursor, encodeCursor } from "@webiny/utils/cursor";
import { zeroPad } from "@webiny/utils/zeroPad";

const createType = (): string => {
    return "cms.entry";
};
const createLatestType = (): string => {
    return `${createType()}.l`;
};
const createPublishedType = (): string => {
    return `${createType()}.p`;
};

export interface Params {
    entity: Entity<any>;
    plugins: PluginsContainer;
}
export const createEntriesStorageOperations = (
    params: Params
): CmsContentEntryStorageOperations => {
    const { entity, plugins } = params;

    const dataLoaders = new DataLoadersHandler({
        entity
    });

    const create = async (
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsCreateParams
    ) => {
        const { entry, storageEntry } = args;

        const partitionKey = createPartitionKey(entry);
        /**
         * We need to:
         *  - create new main entry item
         *  - create new or update latest entry item
         */
        const items = [
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createRevisionSortKey(entry),
                TYPE: createType(),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(storageEntry)
            }),
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createLatestSortKey(),
                TYPE: createLatestType(),
                GSI1_PK: createGSIPartitionKey(model, "L"),
                GSI1_SK: createGSISortKey(storageEntry)
            })
        ];

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not insert data into the DynamoDB.",
                ex.code || "CREATE_ENTRY_ERROR",
                {
                    error: ex,
                    entry
                }
            );
        }

        return storageEntry;
    };

    const createRevisionFrom = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsCreateRevisionFromParams
    ) => {
        const { originalEntry, entry, storageEntry, latestEntry } = params;

        const partitionKey = createPartitionKey(storageEntry);
        /**
         * We need to:
         *  - create the main entry item
         *  - update the last entry item to a current one
         */
        const items = [
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createRevisionSortKey(storageEntry),
                TYPE: createType(),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(storageEntry)
            }),
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createLatestSortKey(),
                TYPE: createLatestType(),
                GSI1_PK: createGSIPartitionKey(model, "L"),
                GSI1_SK: createGSISortKey(storageEntry)
            })
        ];
        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create revision from given entry.",
                ex.code || "CREATE_REVISION_ERROR",
                {
                    error: ex,
                    originalEntry,
                    latestEntry,
                    entry,
                    storageEntry
                }
            );
        }
        /**
         * There are no modifications on the entry created so just return the data.
         */
        return storageEntry;
    };

    const update = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsUpdateParams
    ) => {
        const { originalEntry, entry, storageEntry } = params;
        const partitionKey = createPartitionKey(originalEntry);

        const items = [];
        /**
         * We need to:
         *  - update the current entry
         *  - update the latest entry if the current entry is the latest one
         */
        items.push(
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createRevisionSortKey(storageEntry),
                TYPE: createType(),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(storageEntry)
            })
        );

        /**
         * We need the latest entry to update it as well if neccessary.
         */
        const latestStorageEntry = await getLatestRevisionByEntryId(model, entry);

        if (latestStorageEntry && latestStorageEntry.id === entry.id) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    TYPE: createLatestType(),
                    GSI1_PK: createGSIPartitionKey(model, "L"),
                    GSI1_SK: createGSISortKey(entry)
                })
            );
        }

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
            return storageEntry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update entry.",
                ex.code || "UPDATE_ERROR",
                {
                    error: ex,
                    originalEntry,
                    entry,
                    latestStorageEntry
                }
            );
        }
    };

    const deleteEntry = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsDeleteParams
    ) => {
        const { entry } = params;

        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey(entry),
            options: {
                gte: " "
            }
        };

        let records = [];
        try {
            records = await queryAll(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not load all records.",
                ex.code || "LOAD_ALL_RECORDS_ERROR",
                {
                    error: ex,
                    entry
                }
            );
        }
        const items = records.map(item => {
            return entity.deleteBatch({
                PK: item.PK,
                SK: item.SK
            });
        });

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete the entry.",
                ex.code || "DELETE_ENTRY_ERROR",
                {
                    error: ex,
                    partitionKey: queryAllParams.partitionKey,
                    entry
                }
            );
        }
    };

    const deleteRevision = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsDeleteRevisionParams
    ) => {
        const { entryToDelete, entryToSetAsLatest, storageEntryToSetAsLatest } = params;
        const partitionKey = createPartitionKey(entryToDelete);

        const items = [
            entity.deleteBatch({
                PK: partitionKey,
                SK: createRevisionSortKey(entryToDelete)
            })
        ];

        const publishedStorageEntry = await getPublishedRevisionByEntryId(model, entryToDelete);

        /**
         * If revision we are deleting is the published one as well, we need to delete those records as well.
         */
        if (publishedStorageEntry && entryToDelete.id === publishedStorageEntry.id) {
            items.push(
                entity.deleteBatch({
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                })
            );
        }
        if (storageEntryToSetAsLatest) {
            items.push(
                entity.putBatch({
                    ...storageEntryToSetAsLatest,
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    TYPE: createLatestType(),
                    GSI1_PK: createGSIPartitionKey(model, "L"),
                    GSI1_SK: createGSISortKey(storageEntryToSetAsLatest)
                })
            );
        }
        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code, {
                error: ex,
                entryToDelete,
                entryToSetAsLatest
            });
        }
    };
    const getAllRevisionsByIds = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetAllRevisionsParams
    ) => {
        return await dataLoaders.getAllEntryRevisions({
            model,
            ids: params.ids
        });
    };

    const getLatestRevisionByEntryId = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetLatestRevisionParams
    ) => {
        const result = await dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: [params.id]
        });
        if (result.length === 0) {
            return null;
        }
        return result.shift();
    };
    const getPublishedRevisionByEntryId = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetLatestRevisionParams
    ) => {
        const result = await dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: [params.id]
        });
        if (result.length === 0) {
            return null;
        }
        return result.shift();
    };

    const getRevisionById = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetRevisionParams
    ) => {
        const result = await dataLoaders.getRevisionById({
            model,
            ids: [params.id]
        });
        if (result.length === 0) {
            return null;
        }
        return result.shift();
    };

    const getRevisions = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetRevisionsParams
    ) => {
        return await dataLoaders.getAllEntryRevisions({
            model,
            ids: [params.id]
        });
    };

    const getByIds = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetByIdsParams
    ) => {
        return dataLoaders.getRevisionById({
            model,
            ids: params.ids
        });
    };

    const getLatestByIds = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetLatestByIdsParams
    ) => {
        return dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: params.ids
        });
    };

    const getPublishedByIds = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetPublishedByIdsParams
    ) => {
        return dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: params.ids
        });
    };

    const getPreviousRevision = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetPreviousRevisionParams
    ) => {
        const { tenant, locale, entryId, version } = params;
        const queryParams: QueryOneParams = {
            entity,
            partitionKey: createPartitionKey({
                tenant,
                locale,
                id: entryId
            }),
            options: {
                lt: `REV#${zeroPad(version)}`,
                /**
                 * We need to have extra checks because DynamoDB will return published or latest record if there is no REV# record.
                 */
                filters: [
                    {
                        attr: "TYPE",
                        eq: createType()
                    },
                    {
                        attr: "version",
                        lt: version
                    }
                ],
                reverse: true
            }
        };

        try {
            const result = await queryOne<CmsContentEntry>(queryParams);

            return cleanupItem(entity, result);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get previous version of given entry.",
                ex.code || "GET_PREVIOUS_VERSION_ERROR",
                {
                    ...params,
                    error: ex,
                    partitionKey: queryParams.partitionKey,
                    options: queryParams.options,
                    model
                }
            );
        }
    };

    const list = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsListParams
    ) => {
        const { limit: initialLimit = 10, where: originalWhere, after, sort } = params;
        const limit = initialLimit <= 0 || initialLimit >= 100 ? 100 : initialLimit;

        const type = originalWhere.published ? "P" : "L";

        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createGSIPartitionKey(model, type),
            options: {
                index: "GSI1",
                gte: " "
            }
        };
        let records = [];
        try {
            records = await queryAll(queryAllParams);
        } catch (ex) {
            throw new WebinyError(ex.message, "QUERY_ENTRIES_ERROR", {
                error: ex,
                partitionKey: queryAllParams.partitionKey,
                options: queryAllParams.options
            });
        }
        const where: CmsContentEntryStorageOperationsListParams["where"] = {
            ...originalWhere
        };
        delete where["published"];
        delete where["latest"];
        delete where["locale"];
        delete where["tenant"];
        /**
         * We need a object containing field, transformers and paths.
         * Just build it here and pass on into other methods that require it to avoid mapping multiple times.
         */
        const modelFields = buildModelFields({
            plugins,
            model
        });
        /**
         * Filter the read items via the code.
         * It will build the filters out of the where input and transform the values it is using.
         */
        const filteredItems = filterItems({
            items: records,
            where,
            plugins,
            fields: modelFields
        });

        const totalCount = filteredItems.length;
        /**
         * Sorting is also done via the code.
         * It takes the sort input and sorts by it via the lodash sortBy method.
         */
        const sortedItems = sortEntryItems({
            items: filteredItems,
            sort,
            fields: modelFields
        });

        const start = decodeCursor(after) || 0;
        const hasMoreItems = totalCount > start + limit;
        const end = limit > totalCount + start + limit ? undefined : start + limit;
        const slicedItems = sortedItems.slice(start, end);
        /**
         * Although we do not need a cursor here, we will use it as such to keep it standardized.
         * Number is simply encoded.
         */
        const cursor = totalCount > start + limit ? encodeCursor(start + limit) : null;
        return {
            hasMoreItems,
            totalCount,
            cursor,
            items: cleanupItems(entity, slicedItems)
        };
    };

    const get = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetParams
    ) => {
        const { items } = await list(model, {
            ...params,
            limit: 1
        });
        if (items.length === 0) {
            return null;
        }
        return items.shift();
    };

    const requestChanges = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsRequestChangesParams
    ) => {
        const { entry, storageEntry, originalEntry } = params;

        const partitionKey = createPartitionKey(entry);

        /**
         * We need to:
         *  - update the existing entry
         *  - update latest version - if existing entry is the latest version
         */
        const items = [
            entity.putBatch({
                ...storageEntry,
                TYPE: createType(),
                PK: partitionKey,
                SK: createRevisionSortKey(entry),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(entry)
            })
        ];

        /**
         * We need the latest entry to see if something needs to be updated along side the request changes one.
         */
        const latestStorageEntry = await getLatestRevisionByEntryId(model, entry);

        if (latestStorageEntry.id === entry.id) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    TYPE: createLatestType(),
                    GSI1_PK: createGSIPartitionKey(model, "L"),
                    GSI1_SK: createGSISortKey(entry)
                })
            );
        }

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute the request changes batch.",
                ex.code || "REQUEST_CHANGES_ERROR",
                {
                    entry,
                    originalEntry
                }
            );
        }
        return entry;
    };

    const requestReview = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsRequestReviewParams
    ) => {
        const { entry, storageEntry, originalEntry } = params;

        const partitionKey = createPartitionKey(entry);
        /**
         * We need to:
         *  - update existing entry
         *  - update latest entry - if existing entry is the latest entry
         */
        const items = [
            entity.putBatch({
                ...storageEntry,
                TYPE: createType(),
                PK: partitionKey,
                SK: createRevisionSortKey(entry),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(entry)
            })
        ];

        /**
         * We need the latest entry to see if something needs to be updated along side the request review one.
         */
        const latestStorageEntry = await getLatestRevisionByEntryId(model, entry);

        if (latestStorageEntry.id === entry.id) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    TYPE: createLatestType(),
                    GSI1_PK: createGSIPartitionKey(model, "L"),
                    GSI1_SK: createGSISortKey(entry)
                })
            );
        }

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
            return entry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute request review batch.",
                ex.code || "REQUEST_REVIEW_ERROR",
                {
                    entry,
                    storageEntry,
                    originalEntry
                }
            );
        }
    };

    const publish = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsPublishParams
    ) => {
        const { entry, storageEntry } = params;

        const partitionKey = createPartitionKey(entry);

        /**
         * We need the latest and published entries to see if something needs to be updated along side the publishing one.
         */
        const latestStorageEntry = await getLatestRevisionByEntryId(model, entry);
        const publishedStorageEntry = await getPublishedRevisionByEntryId(model, entry);
        /**
         * We need to update:
         *  - current entry revision sort key
         *  - published sort key
         *  - latest sort key - if entry updated is actually latest
         *  - previous published entry to unpublished status - if any previously published entry
         */
        const items = [
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createRevisionSortKey(entry),
                TYPE: createType(),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(entry)
            }),
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createPublishedSortKey(),
                TYPE: createPublishedType(),
                GSI1_PK: createGSIPartitionKey(model, "P"),
                GSI1_SK: createGSISortKey(entry)
            })
        ];
        if (entry.id === latestStorageEntry.id) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    TYPE: createLatestType(),
                    GSI1_PK: createGSIPartitionKey(model, "L"),
                    GSI1_SK: createGSISortKey(entry)
                })
            );
        }
        if (publishedStorageEntry) {
            items.push(
                entity.putBatch({
                    ...publishedStorageEntry,
                    PK: partitionKey,
                    SK: createRevisionSortKey(publishedStorageEntry),
                    TYPE: createType(),
                    status: CONTENT_ENTRY_STATUS.UNPUBLISHED,
                    GSI1_PK: createGSIPartitionKey(model, "A"),
                    GSI1_SK: createGSISortKey(publishedStorageEntry)
                })
            );
        }

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
            return entry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute the publishing batch.",
                ex.code || "PUBLISH_ERROR",
                {
                    entry,
                    latestStorageEntry,
                    publishedStorageEntry
                }
            );
        }
    };

    const unpublish = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsUnpublishParams
    ) => {
        const { entry, storageEntry } = params;

        const partitionKey = createPartitionKey(entry);
        /**
         * We need to:
         *  - delete currently published entry
         *  - update current entry revision with new data
         *  - update latest entry status - if entry being unpublished is latest
         */
        const items = [
            entity.deleteBatch({
                PK: partitionKey,
                SK: createPublishedSortKey()
            }),
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createRevisionSortKey(entry),
                TYPE: createType(),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(entry)
            })
        ];

        /**
         * We need the latest entry to see if something needs to be updated along side the unpublishing one.
         */
        const latestStorageEntry = await getLatestRevisionByEntryId(model, entry);

        if (entry.id === latestStorageEntry.id) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    TYPE: createLatestType(),
                    GSI1_PK: createGSIPartitionKey(model, "L"),
                    GSI1_SK: createGSISortKey(entry)
                })
            );
        }

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAll({
                model
            });
            return storageEntry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute unpublish batch.",
                ex.code || "UNPUBLISH_ERROR",
                {
                    entry,
                    storageEntry
                }
            );
        }
    };

    return {
        create,
        createRevisionFrom,
        update,
        delete: deleteEntry,
        deleteRevision,
        getPreviousRevision,
        getPublishedByIds,
        getLatestByIds,
        getByIds,
        getRevisionById,
        getPublishedRevisionByEntryId,
        getAllRevisionsByIds,
        getLatestRevisionByEntryId,
        get,
        getRevisions,
        requestChanges,
        requestReview,
        publish,
        list,
        unpublish
    };
};
