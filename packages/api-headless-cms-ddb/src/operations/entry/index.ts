import WebinyError from "@webiny/error";
import { DataLoadersHandler } from "./dataLoaders";
import {
    CmsEntry,
    CmsEntryListWhere,
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsCreateParams,
    CmsEntryStorageOperationsCreateRevisionFromParams,
    CmsEntryStorageOperationsDeleteParams,
    CmsEntryStorageOperationsDeleteRevisionParams,
    CmsEntryStorageOperationsGetByIdsParams,
    CmsEntryStorageOperationsGetLatestByIdsParams,
    CmsEntryStorageOperationsGetLatestRevisionParams,
    CmsEntryStorageOperationsGetParams,
    CmsEntryStorageOperationsGetPreviousRevisionParams,
    CmsEntryStorageOperationsGetPublishedByIdsParams,
    CmsEntryStorageOperationsGetRevisionParams,
    CmsEntryStorageOperationsGetRevisionsParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsPublishParams,
    CmsEntryStorageOperationsRequestChangesParams,
    CmsEntryStorageOperationsRequestReviewParams,
    CmsEntryStorageOperationsUnpublishParams,
    CmsEntryStorageOperationsUpdateParams,
    CmsModel,
    CONTENT_ENTRY_STATUS
} from "@webiny/api-headless-cms/types";
import { Entity } from "dynamodb-toolbox";
import { filterItems, buildModelFields, sortEntryItems, FilterItemFromStorage } from "./utils";
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
import { StorageTransformPlugin } from "@webiny/api-headless-cms";

const createType = (): string => {
    return "cms.entry";
};
const createLatestType = (): string => {
    return `${createType()}.l`;
};
const createPublishedType = (): string => {
    return `${createType()}.p`;
};

export interface CreateEntriesStorageOperationsParams {
    entity: Entity<any>;
    plugins: PluginsContainer;
}
export const createEntriesStorageOperations = (
    params: CreateEntriesStorageOperationsParams
): CmsEntryStorageOperations => {
    const { entity, plugins } = params;

    const dataLoaders = new DataLoadersHandler({
        entity
    });

    const storageTransformPlugins = plugins
        .byType<StorageTransformPlugin>(StorageTransformPlugin.type)
        .reduce((collection, plugin) => {
            collection[plugin.fieldType] = plugin;
            return collection;
        }, {} as Record<string, StorageTransformPlugin>);

    const createStorageTransformCallable = (model: CmsModel): FilterItemFromStorage => {
        return (field, value) => {
            const plugin: StorageTransformPlugin = storageTransformPlugins[field.type];
            if (!plugin) {
                return value;
            }
            return plugin.fromStorage({
                model,
                field,
                value,
                getStoragePlugin(fieldType: string): StorageTransformPlugin {
                    return storageTransformPlugins[fieldType] || storageTransformPlugins["*"];
                },
                plugins
            });
        };
    };

    const create = async (model: CmsModel, args: CmsEntryStorageOperationsCreateParams) => {
        const { entry, storageEntry } = args;

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

        const isPublished = entry.status === "published";

        const locked = isPublished ? true : entry.locked;
        /**
         * We need to:
         *  - create new main entry item
         *  - create new or update latest entry item
         */
        const items = [
            entity.putBatch({
                ...storageEntry,
                locked,
                PK: partitionKey,
                SK: createRevisionSortKey(entry),
                TYPE: createType(),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(storageEntry)
            }),
            entity.putBatch({
                ...storageEntry,
                locked,
                PK: partitionKey,
                SK: createLatestSortKey(),
                TYPE: createLatestType(),
                GSI1_PK: createGSIPartitionKey(model, "L"),
                GSI1_SK: createGSISortKey(storageEntry)
            })
        ];

        /**
         * We need to create published entry if
         */
        if (isPublished) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    locked,
                    PK: partitionKey,
                    SK: createPublishedSortKey(),
                    TYPE: createLatestType(),
                    GSI1_PK: createGSIPartitionKey(model, "P"),
                    GSI1_SK: createGSISortKey(storageEntry)
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
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams
    ) => {
        const { entry, storageEntry } = params;

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });
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

    const update = async (model: CmsModel, params: CmsEntryStorageOperationsUpdateParams) => {
        const { entry, storageEntry } = params;
        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

        const isPublished = entry.status === "published";
        const locked = isPublished ? true : entry.locked;

        const items = [];
        /**
         * We need to:
         *  - update the current entry
         *  - update the latest entry if the current entry is the latest one
         */
        items.push(
            entity.putBatch({
                ...storageEntry,
                locked,
                PK: partitionKey,
                SK: createRevisionSortKey(storageEntry),
                TYPE: createType(),
                GSI1_PK: createGSIPartitionKey(model, "A"),
                GSI1_SK: createGSISortKey(storageEntry)
            })
        );

        if (isPublished) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    locked,
                    PK: partitionKey,
                    SK: createPublishedSortKey(),
                    TYPE: createPublishedType(),
                    GSI1_PK: createGSIPartitionKey(model, "P"),
                    GSI1_SK: createGSISortKey(storageEntry)
                })
            );
        }

        /**
         * We need the latest entry to update it as well if neccessary.
         */
        const latestStorageEntry = await getLatestRevisionByEntryId(model, entry);

        if (latestStorageEntry && latestStorageEntry.id === entry.id) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    locked,
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
                    entry,
                    latestStorageEntry
                }
            );
        }
    };

    const deleteEntry = async (model: CmsModel, params: CmsEntryStorageOperationsDeleteParams) => {
        const { entry } = params;

        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
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
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams
    ) => {
        const { entry, latestEntry, latestStorageEntry } = params;
        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

        const items = [
            entity.deleteBatch({
                PK: partitionKey,
                SK: createRevisionSortKey(entry)
            })
        ];

        const publishedStorageEntry = await getPublishedRevisionByEntryId(model, entry);

        /**
         * If revision we are deleting is the published one as well, we need to delete those records as well.
         */
        if (publishedStorageEntry && entry.id === publishedStorageEntry.id) {
            items.push(
                entity.deleteBatch({
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                })
            );
        }
        if (latestStorageEntry) {
            items.push(
                entity.putBatch({
                    ...latestStorageEntry,
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    TYPE: createLatestType(),
                    GSI1_PK: createGSIPartitionKey(model, "L"),
                    GSI1_SK: createGSISortKey(latestStorageEntry)
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
                entry,
                latestEntry
            });
        }
    };

    const getLatestRevisionByEntryId = async (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) => {
        const result = await dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: [params.id]
        });
        return result.shift() || null;
    };
    const getPublishedRevisionByEntryId = async (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) => {
        const result = await dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: [params.id]
        });
        return result.shift() || null;
    };

    const getRevisionById = async (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ) => {
        const result = await dataLoaders.getRevisionById({
            model,
            ids: [params.id]
        });
        return result.shift() || null;
    };

    const getRevisions = async (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionsParams
    ) => {
        return await dataLoaders.getAllEntryRevisions({
            model,
            ids: [params.id]
        });
    };

    const getByIds = async (model: CmsModel, params: CmsEntryStorageOperationsGetByIdsParams) => {
        return dataLoaders.getRevisionById({
            model,
            ids: params.ids
        });
    };

    const getLatestByIds = async (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestByIdsParams
    ) => {
        return dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: params.ids
        });
    };

    const getPublishedByIds = async (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ) => {
        return dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: params.ids
        });
    };

    const getPreviousRevision = async (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ) => {
        const { entryId, version } = params;
        const queryParams: QueryOneParams = {
            entity,
            partitionKey: createPartitionKey({
                tenant: model.tenant,
                locale: model.locale,
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
            const result = await queryOne<CmsEntry>(queryParams);

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

    const list = async (model: CmsModel, params: CmsEntryStorageOperationsListParams) => {
        const {
            limit: initialLimit = 10,
            where: initialWhere,
            after,
            sort,
            fields,
            search
        } = params;
        const limit = initialLimit <= 0 || initialLimit >= 10000 ? 10000 : initialLimit;

        const type = initialWhere.published ? "P" : "L";

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
        if (records.length === 0) {
            return {
                hasMoreItems: false,
                totalCount: 0,
                cursor: null,
                items: []
            };
        }
        const where: Partial<CmsEntryListWhere> = {
            ...initialWhere
        };
        delete where["published"];
        delete where["latest"];
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
        const filteredItems = await filterItems({
            items: records,
            where,
            plugins,
            fields: modelFields,
            fromStorage: createStorageTransformCallable(model),
            fullTextSearch: {
                term: search,
                fields: fields || []
            }
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

        const start = parseInt((decodeCursor(after) as string) || "0") || 0;
        const hasMoreItems = totalCount > start + limit;
        const end = limit > totalCount + start + limit ? undefined : start + limit;
        const slicedItems = sortedItems.slice(start, end);
        /**
         * Although we do not need a cursor here, we will use it as such to keep it standardized.
         * Number is simply encoded.
         */
        const cursor = totalCount > start + limit ? encodeCursor(`${start + limit}`) : null;
        return {
            hasMoreItems,
            totalCount,
            cursor,
            items: cleanupItems(entity, slicedItems)
        };
    };

    const get = async (model: CmsModel, params: CmsEntryStorageOperationsGetParams) => {
        const { items } = await list(model, {
            ...params,
            limit: 1
        });
        return items.shift() || null;
    };

    const requestChanges = async (
        model: CmsModel,
        params: CmsEntryStorageOperationsRequestChangesParams
    ) => {
        const { entry, storageEntry } = params;

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

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
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute the request changes batch.",
                ex.code || "REQUEST_CHANGES_ERROR",
                {
                    entry
                }
            );
        }
        return entry;
    };

    const requestReview = async (
        model: CmsModel,
        params: CmsEntryStorageOperationsRequestReviewParams
    ) => {
        const { entry, storageEntry } = params;

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });
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
            return entry;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not execute request review batch.",
                ex.code || "REQUEST_REVIEW_ERROR",
                {
                    entry,
                    storageEntry
                }
            );
        }
    };

    const publish = async (model: CmsModel, params: CmsEntryStorageOperationsPublishParams) => {
        const { entry, storageEntry } = params;

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

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
        if (latestStorageEntry && entry.id === latestStorageEntry.id) {
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
        if (publishedStorageEntry && publishedStorageEntry.id !== entry.id) {
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

    const unpublish = async (model: CmsModel, params: CmsEntryStorageOperationsUnpublishParams) => {
        const { entry, storageEntry } = params;

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });
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

        if (latestStorageEntry && entry.id === latestStorageEntry.id) {
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
