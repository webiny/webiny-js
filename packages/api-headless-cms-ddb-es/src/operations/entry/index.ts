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
    CmsContentEntryStorageOperationsListArgs,
    CmsContentEntryStorageOperationsPublishParams,
    CmsContentEntryStorageOperationsRequestChangesParams,
    CmsContentEntryStorageOperationsRequestReviewParams,
    CmsContentEntryStorageOperationsUnpublishParams,
    CmsContentEntryStorageOperationsUpdateParams,
    CmsContentModel,
    CONTENT_ENTRY_STATUS
} from "@webiny/api-headless-cms/types";
import {
    createElasticsearchQueryBody,
    extractEntriesFromIndex,
    prepareEntryToIndex
} from "~/helpers";
import configurations from "~/configurations";
import WebinyError from "@webiny/error";
import lodashCloneDeep from "lodash.clonedeep";
import lodashOmit from "lodash.omit";
import { Entity } from "dynamodb-toolbox";
import { Client } from "@elastic/elasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import { compress, decompress } from "@webiny/api-elasticsearch/compression";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { DataLoadersHandler } from "~/operations/entry/dataLoaders";
import {
    createLatestSortKey,
    createPartitionKey,
    createPublishedSortKey,
    createRevisionSortKey
} from "~/operations/entry/keys";
import { queryAll, queryOne, QueryOneParams } from "@webiny/db-dynamodb/utils/query";
import { createLimit } from "@webiny/api-elasticsearch/limit";
import { encodeCursor } from "@webiny/api-elasticsearch/cursors";
import { get as getRecord } from "@webiny/db-dynamodb/utils/get";
import { zeroPad } from "@webiny/utils";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";

const createType = (): string => {
    return "cms.entry";
};
const createLatestType = (): string => {
    return `${createType()}.l`;
};
const createPublishedType = (): string => {
    return `${createType()}.p`;
};

const getEntryData = (plugins: PluginsContainer, entry: CmsContentEntry) => {
    return {
        ...lodashOmit(entry, ["PK", "SK", "published", "latest"]),
        TYPE: createType(),
        __type: createType()
    };
};

const getESLatestEntryData = async (plugins: PluginsContainer, entry: CmsContentEntry) => {
    return compress(plugins, {
        ...getEntryData(plugins, entry),
        latest: true,
        TYPE: createLatestType(),
        __type: createLatestType()
    });
};

const getESPublishedEntryData = async (plugins: PluginsContainer, entry: CmsContentEntry) => {
    return compress(plugins, {
        ...getEntryData(plugins, entry),
        published: true,
        TYPE: createPublishedType(),
        __type: createPublishedType()
    });
};

export interface Params {
    entity: Entity<any>;
    esEntity: Entity<any>;
    elasticsearch: Client;
    plugins: PluginsContainer;
}
export const createEntriesStorageOperations = (
    params: Params
): CmsContentEntryStorageOperations => {
    const { entity, esEntity, elasticsearch, plugins } = params;

    const dataLoaders = new DataLoadersHandler({
        entity
    });

    const create = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsCreateParams
    ) => {
        const { entry, storageEntry } = params;

        const esEntry = prepareEntryToIndex({
            plugins,
            model,
            storageEntry: lodashCloneDeep(storageEntry)
        });

        const { index: esIndex } = configurations.es({
            model
        });

        const esLatestData = await getESLatestEntryData(plugins, esEntry);

        const revisionKeys = {
            PK: createPartitionKey(entry),
            SK: createRevisionSortKey(entry)
        };

        const latestKeys = {
            PK: createPartitionKey(entry),
            SK: createLatestSortKey()
        };

        const items = [
            entity.putBatch({
                ...storageEntry,
                ...revisionKeys,
                TYPE: createType()
            }),
            entity.putBatch({
                ...storageEntry,
                ...latestKeys,
                TYPE: createLatestType()
            })
        ];

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not insert entry data into the DynamoDB table.",
                ex.code || "CREATE_ENTRY_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }
        try {
            await esEntity.put({
                ...latestKeys,
                index: esIndex,
                data: esLatestData
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not insert entry data into the Elasticsearch DynamoDB table.",
                ex.code || "CREATE_ES_ENTRY_ERROR",
                {
                    error: ex,
                    entry,
                    esEntry
                }
            );
        }

        return storageEntry;
    };

    const createRevisionFrom = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsCreateRevisionFromParams
    ) => {
        const { originalEntry, entry, storageEntry } = params;
        const revisionKeys = {
            PK: createPartitionKey(entry),
            SK: createRevisionSortKey(entry)
        };
        const latestKeys = {
            PK: createPartitionKey(entry),
            SK: createLatestSortKey()
        };

        const esEntry = prepareEntryToIndex({
            plugins,
            model,
            storageEntry: lodashCloneDeep(storageEntry)
        });

        const esLatestData = await getESLatestEntryData(plugins, esEntry);

        const items = [
            entity.putBatch({
                ...storageEntry,
                TYPE: createType(),
                ...revisionKeys
            }),
            entity.putBatch({
                ...storageEntry,
                TYPE: createLatestType(),
                ...latestKeys
            })
        ];

        const { index } = configurations.es({
            model
        });
        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create revision from given entry in the DynamoDB table.",
                ex.code || "CREATE_REVISION_ERROR",
                {
                    error: ex,
                    originalEntry,
                    entry,
                    storageEntry
                }
            );
        }
        /**
         * Update the "latest" entry item in the Elasticsearch
         */
        try {
            await esEntity.put({
                ...latestKeys,
                index,
                data: esLatestData
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update latest entry in the DynamoDB Elasticsearch table.",
                ex.code || "CREATE_REVISION_ERROR",
                {
                    error: ex,
                    originalEntry,
                    entry
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
        const revisionKeys = {
            PK: createPartitionKey(entry),
            SK: createRevisionSortKey(entry)
        };
        const latestKeys = {
            PK: createPartitionKey(entry),
            SK: createLatestSortKey()
        };

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            tenant: originalEntry.tenant,
            locale: originalEntry.locale,
            model,
            ids: [originalEntry.id]
        });

        const items = [
            entity.putBatch({
                ...storageEntry,
                ...revisionKeys,
                TYPE: createType()
            })
        ];
        /**
         * If the latest entry is the one being updated, we need to create a new latest entry records.
         */
        let elasticsearchLatestData = null;
        if (latestStorageEntry.id === originalEntry.id) {
            /**
             * First we update the regular DynamoDB table
             */
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    ...latestKeys,
                    TYPE: createLatestSortKey()
                })
            );
            /**
             * And then update the Elasticsearch table to propagate changes to the Elasticsearch
             */
            const esEntry = prepareEntryToIndex({
                plugins,
                model,
                storageEntry: lodashCloneDeep(storageEntry)
            });

            elasticsearchLatestData = await getESLatestEntryData(plugins, esEntry);
        }
        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAllEntryRevisions({
                tenant: originalEntry.tenant,
                locale: originalEntry.locale,
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update entry DynamoDB records.",
                ex.code || "UPDATE_ENTRY_ERROR",
                {
                    error: ex,
                    originalEntry,
                    entry,
                    storageEntry
                }
            );
        }
        if (!elasticsearchLatestData) {
            return storageEntry;
        }
        const { index: esIndex } = configurations.es({ model });
        try {
            await esEntity.put({
                ...latestKeys,
                index: esIndex,
                data: elasticsearchLatestData
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update entry DynamoDB Elasticsearch record.",
                ex.code || "UPDATE_ES_ENTRY_ERROR",
                {
                    error: ex,
                    originalEntry,
                    entry
                }
            );
        }
        return storageEntry;
    };

    const deleteEntry = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsDeleteParams
    ) => {
        const { entry } = params;

        const partitionKey = createPartitionKey(entry);

        const items = await queryAll<CmsContentEntry>({
            entity,
            partitionKey,
            options: {
                gte: " "
            }
        });

        const esItems = await queryAll<CmsContentEntry>({
            entity: esEntity,
            partitionKey,
            options: {
                gte: " "
            }
        });

        const deleteItems = items.map(item => {
            return entity.deleteBatch({
                PK: item.PK,
                SK: item.SK
            });
        });

        const deleteEsItems = esItems.map(item => {
            return esEntity.deleteBatch({
                PK: item.PK,
                SK: item.SK
            });
        });

        try {
            await batchWriteAll({
                table: entity.table,
                items: deleteItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete entry records from DynamoDB table.",
                ex.code || "DELETE_ENTRY_ERROR",
                {
                    error: ex,
                    entry
                }
            );
        }

        try {
            await batchWriteAll({
                table: esEntity.table,
                items: deleteEsItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete entry records from DynamoDB Elasticsearch table.",
                ex.code || "DELETE_ENTRY_ERROR",
                {
                    error: ex,
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

        const { index } = configurations.es({
            model
        });
        /**
         * We need published entry to delete it if necessary.
         */
        const [publishedStorageEntry] = await dataLoaders.getPublishedRevisionByEntryId({
            model,
            tenant: entryToDelete.tenant,
            locale: entryToDelete.locale,
            ids: [entryToDelete.id]
        });
        /**
         * We need to delete all existing records of the given entry revision.
         */
        const items = [
            /**
             * Delete records of given entry revision.
             */
            entity.deleteBatch({
                PK: partitionKey,
                SK: createRevisionSortKey(entryToDelete)
            })
        ];

        const esItems = [];

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
            esItems.push(
                entity.deleteBatch({
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                })
            );
        }
        if (entryToSetAsLatest) {
            const esEntry = prepareEntryToIndex({
                plugins,
                model,
                storageEntry: lodashCloneDeep(storageEntryToSetAsLatest)
            });

            const esLatestData = await getESLatestEntryData(plugins, esEntry);
            /**
             * In the end we need to set the new latest entry
             */
            items.push(
                entity.putBatch({
                    ...storageEntryToSetAsLatest,
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    TYPE: createLatestType()
                })
            );
            esItems.push(
                esEntity.putBatch({
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    index,
                    data: esLatestData
                })
            );
        }

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not batch write entry records to DynamoDB table.",
                ex.code || "DELETE_REVISION_ERROR",
                {
                    error: ex,
                    entryToDelete,
                    entryToSetAsLatest,
                    storageEntryToSetAsLatest
                }
            );
        }

        if (esItems.length === 0) {
            return;
        }

        try {
            await batchWriteAll({
                table: esEntity.table,
                items: esItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not batch write entry records to DynamoDB Elasticsearch table.",
                ex.code || "DELETE_REVISION_ERROR",
                {
                    error: ex,
                    entryToDelete,
                    entryToSetAsLatest,
                    storageEntryToSetAsLatest
                }
            );
        }
    };

    const list = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsListArgs
    ) => {
        const limit = createLimit(params.limit, 50);
        const body = createElasticsearchQueryBody({
            model,
            args: {
                ...params,
                limit
            },
            plugins,
            parentPath: "values"
        });

        let response;
        const { index } = configurations.es({
            model
        });
        try {
            response = await elasticsearch.search({
                index,
                body
            });
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code || "ELASTICSEARCH_ERROR", {
                error: ex,
                index,
                body
            });
        }

        const { hits, total } = response.body.hits;
        const items = extractEntriesFromIndex({
            plugins,
            model,
            entries: hits.map(item => item._source)
        });

        const hasMoreItems = items.length > limit;
        if (hasMoreItems) {
            /**
             * Remove the last item from results, we don't want to include it.
             */
            items.pop();
        }
        /**
         * Cursor is the `sort` value of the last item in the array.
         * https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after
         */
        const cursor = items.length > 0 ? encodeCursor(hits[items.length - 1].sort) : null;
        return {
            hasMoreItems,
            totalCount: total.value,
            cursor,
            items
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

    const publish = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsPublishParams
    ) => {
        const { entry, storageEntry } = params;

        /**
         * We need currently published entry to check if need to remove it.
         */
        const [publishedStorageEntry] = await dataLoaders.getPublishedRevisionByEntryId({
            model,
            tenant: entry.tenant,
            locale: entry.locale,
            ids: [entry.id]
        });

        const revisionKeys = {
            PK: createPartitionKey(entry),
            SK: createRevisionSortKey(entry)
        };
        const latestKeys = {
            PK: createPartitionKey(entry),
            SK: createLatestSortKey()
        };
        const publishedKeys = {
            PK: createPartitionKey(entry),
            SK: createPublishedSortKey()
        };

        let latestEsEntry = null;
        try {
            latestEsEntry = await getRecord({
                entity: esEntity,
                keys: latestKeys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not read Elasticsearch latest or published data.",
                ex.code || "PUBLISH_BATCH_READ",
                {
                    error: ex,
                    latestKeys: latestKeys,
                    publishedKeys: publishedKeys
                }
            );
        }

        const items = [
            entity.putBatch({
                ...storageEntry,
                ...revisionKeys,
                TYPE: createType()
            })
        ];
        const esItems = [];

        const { index } = configurations.es({
            model
        });

        if (publishedStorageEntry) {
            /**
             * If there is a `published` entry already, we need to set it to `unpublished`. We need to
             * execute two updates: update the previously published entry's status and the published entry record.
             * DynamoDB does not support `batchUpdate` - so here we load the previously published
             * entry's data to update its status within a batch operation. If, hopefully,
             * they introduce a true update batch operation, remove this `read` call.
             */
            const [previouslyPublishedEntry] = await dataLoaders.getRevisionById({
                model,
                tenant: publishedStorageEntry.tenant,
                locale: publishedStorageEntry.locale,
                ids: [publishedStorageEntry.id]
            });

            previouslyPublishedEntry.status = CONTENT_ENTRY_STATUS.UNPUBLISHED;

            items.push(
                /**
                 * Update currently published entry (unpublish it)
                 */
                entity.putBatch({
                    ...previouslyPublishedEntry,
                    savedOn: entry.savedOn,
                    TYPE: createType(),
                    PK: createPartitionKey(publishedStorageEntry),
                    SK: createRevisionSortKey(publishedStorageEntry)
                }),
                /**
                 * Update the helper item in DB with the new published entry ID
                 */
                entity.putBatch({
                    ...storageEntry,
                    TYPE: createType(),
                    PK: createPartitionKey(storageEntry),
                    SK: createPublishedSortKey()
                })
            );
        } else {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    PK: createPartitionKey(storageEntry),
                    SK: createPublishedSortKey(),
                    TYPE: createPublishedType()
                })
            );
        }

        /**
         * We need the latest entry to check if it neds to be updated as well in the Elasticsearch.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
            tenant: storageEntry.tenant,
            locale: storageEntry.locale,
            ids: [entry.id]
        });

        /**
         * If we are publishing the latest revision, let's also update the latest revision's status in ES.
         */
        if (latestStorageEntry && latestStorageEntry.id === entry.id) {
            /**
             * Need to decompress the data from Elasticsearch DynamoDB table.
             */
            const latestEsEntryDataDecompressed = await decompress(plugins, latestEsEntry.data);

            esItems.push({
                index,
                PK: createPartitionKey(latestEsEntry),
                SK: createLatestSortKey(),
                data: {
                    ...latestEsEntryDataDecompressed,
                    status: CONTENT_ENTRY_STATUS.PUBLISHED,
                    locked: true,
                    savedOn: entry.savedOn,
                    publishedOn: entry.publishedOn
                }
            });
        }

        const preparedEntryData = prepareEntryToIndex({
            plugins,
            model,
            storageEntry: lodashCloneDeep(storageEntry)
        });
        /**
         * Update the published revision entry in ES.
         */
        const esLatestData = await getESPublishedEntryData(plugins, preparedEntryData);

        esItems.push(
            esEntity.putBatch({
                PK: createPartitionKey(entry),
                SK: createPublishedSortKey(),
                index,
                data: esLatestData
            })
        );

        /**
         * Finally, execute regular table batch.
         */
        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAllEntryRevisions({
                model,
                tenant: entry.tenant,
                locale: entry.locale,
                entry
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not store publish entry records in DynamoDB table.",
                ex.code || "PUBLISH_ERROR",
                {
                    entry,
                    latestStorageEntry,
                    publishedStorageEntry
                }
            );
        }
        /**
         * And Elasticsearch table batch.
         */
        try {
            await batchWriteAll({
                table: esEntity.table,
                items: esItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not store publish entry records in DynamoDB Elasticsearch table.",
                ex.code || "PUBLISH_ERROR",
                {
                    entry,
                    latestStorageEntry,
                    publishedStorageEntry
                }
            );
        }
        return storageEntry;
    };

    const unpublish = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsUnpublishParams
    ) => {
        const { entry, storageEntry } = params;

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
            tenant: entry.tenant,
            locale: entry.locale,
            ids: [entry.id]
        });

        const partitionKey = createPartitionKey(entry);

        const items = [
            entity.deleteBatch({
                PK: partitionKey,
                SK: createPublishedSortKey()
            }),
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createRevisionSortKey(entry),
                TYPE: createType()
            })
        ];

        const esItems = [
            esEntity.deleteBatch({
                PK: partitionKey,
                SK: createPublishedSortKey()
            })
        ];
        /**
         * If we are unpublishing the latest revision, let's also update the latest revision entry's status in ES.
         */
        if (latestStorageEntry.id === entry.id) {
            const { index } = configurations.es({
                model
            });

            const preparedEntryData = prepareEntryToIndex({
                plugins,
                model,
                storageEntry: lodashCloneDeep(storageEntry)
            });

            const esLatestData = await getESLatestEntryData(plugins, preparedEntryData);
            esItems.push(
                esEntity.putBatch({
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    index,
                    data: esLatestData
                })
            );
        }

        /**
         * Finally, execute regular table batch.
         */
        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
            dataLoaders.clearAllEntryRevisions({
                model,
                tenant: entry.tenant,
                locale: entry.locale,
                entry
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not store unpublished entry records in DynamoDB table.",
                ex.code || "UNPUBLISH_ERROR",
                {
                    entry,
                    storageEntry
                }
            );
        }
        /**
         * And Elasticsearch table batch.
         */
        try {
            await batchWriteAll({
                table: esEntity.table,
                items: esItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not store unpublished entry records in DynamoDB Elasticsearch table.",
                ex.code || "UNPUBLISH_ERROR",
                {
                    entry,
                    storageEntry
                }
            );
        }
        return storageEntry;
    };

    const requestReview = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsRequestReviewParams
    ) => {
        const { entry, storageEntry, originalEntry } = params;

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
            tenant: entry.tenant,
            locale: entry.locale,
            ids: [entry.id]
        });

        const partitionKey = createPartitionKey(entry);

        /**
         * If we updated the latest version, then make sure the changes are propagated to ES too.
         */
        let esLatestData = null;
        const { index } = configurations.es({
            model
        });
        if (latestStorageEntry && latestStorageEntry.id === entry.id) {
            const preparedEntryData = prepareEntryToIndex({
                plugins,
                model,
                storageEntry: lodashCloneDeep(storageEntry)
            });

            esLatestData = await getESLatestEntryData(plugins, preparedEntryData);
        }

        try {
            await entity.put({
                ...storageEntry,
                PK: partitionKey,
                SK: createRevisionSortKey(entry),
                TYPE: createType()
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not store request review entry record into DynamoDB table.",
                ex.code || "REQUEST_REVIEW_ERROR",
                {
                    entry,
                    latestStorageEntry,
                    originalEntry
                }
            );
        }
        /**
         * No need to proceed further if nothing to put into Elasticsearch.
         */
        if (!esLatestData) {
            return storageEntry;
        }

        try {
            await esEntity.put({
                PK: partitionKey,
                SK: createLatestSortKey(),
                index,
                data: esLatestData
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not store request review entry record into DynamoDB Elasticsearch table.",
                ex.code || "REQUEST_REVIEW_ERROR",
                {
                    entry,
                    latestStorageEntry,
                    originalEntry
                }
            );
        }
        return storageEntry;
    };

    const requestChanges = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsRequestChangesParams
    ) => {
        const { entry, storageEntry, originalEntry } = params;

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
            tenant: entry.tenant,
            locale: entry.locale,
            ids: [entry.id]
        });

        const partitionKey = createPartitionKey(entry);

        const items = [
            entity.putBatch({
                ...storageEntry,
                PK: partitionKey,
                SK: createRevisionSortKey(entry),
                TYPE: createType()
            })
        ];
        /**
         * If we updated the latest version, then make sure the changes are propagated to ES too.
         */
        const { index } = configurations.es({
            model
        });
        let esLatestData = null;
        if (latestStorageEntry && latestStorageEntry.id === entry.id) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    TYPE: createLatestType()
                })
            );

            const preparedEntryData = prepareEntryToIndex({
                plugins,
                model,
                storageEntry: lodashCloneDeep(storageEntry)
            });

            esLatestData = await getESLatestEntryData(plugins, preparedEntryData);
        }

        try {
            await batchWriteAll({
                table: entity.table,
                items
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not store request changes entry record into DynamoDB table.",
                ex.code || "REQUEST_CHANGES_ERROR",
                {
                    entry,
                    latestStorageEntry,
                    originalEntry
                }
            );
        }
        /**
         * No need to proceed further if nothing to put into Elasticsearch.
         */
        if (!esLatestData) {
            return storageEntry;
        }

        try {
            await esEntity.put({
                PK: partitionKey,
                SK: createLatestSortKey(),
                index,
                data: esLatestData
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not store request changes entry record into DynamoDB Elasticsearch table.",
                ex.code || "REQUEST_CHANGES_ERROR",
                {
                    entry,
                    latestStorageEntry,
                    originalEntry
                }
            );
        }
        return storageEntry;
    };

    const getAllRevisionsByIds = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetAllRevisionsParams
    ) => {
        return await dataLoaders.getAllEntryRevisions({
            model,
            tenant: params.tenant,
            locale: params.tenant,
            ids: params.ids
        });
    };

    const getLatestRevisionByEntryId = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetLatestRevisionParams
    ) => {
        const result = await dataLoaders.getLatestRevisionByEntryId({
            model,
            tenant: params.tenant,
            locale: params.tenant,
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
            tenant: params.tenant,
            locale: params.tenant,
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
            tenant: params.tenant,
            locale: params.tenant,
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
            tenant: params.tenant,
            locale: params.locale,
            ids: [params.id]
        });
    };

    const getByIds = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetByIdsParams
    ) => {
        return dataLoaders.getRevisionById({
            model,
            tenant: params.tenant,
            locale: params.locale,
            ids: params.ids
        });
    };

    const getLatestByIds = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetLatestByIdsParams
    ) => {
        return dataLoaders.getLatestRevisionByEntryId({
            model,
            tenant: params.tenant,
            locale: params.locale,
            ids: params.ids
        });
    };

    const getPublishedByIds = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetPublishedByIdsParams
    ) => {
        return dataLoaders.getPublishedRevisionByEntryId({
            model,
            tenant: params.tenant,
            locale: params.locale,
            ids: params.ids
        });
    };

    const getPreviousRevision = async (
        model: CmsContentModel,
        params: CmsContentEntryStorageOperationsGetPreviousRevisionParams
    ) => {
        const queryParams: QueryOneParams = {
            entity,
            partitionKey: createPartitionKey({
                tenant: params.tenant,
                locale: params.locale,
                id: params.entryId
            }),
            options: {
                lt: `REV#${zeroPad(params.version)}`,
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

    return {
        create,
        createRevisionFrom,
        update,
        delete: deleteEntry,
        deleteRevision,
        get,
        publish,
        unpublish,
        requestReview,
        requestChanges,
        list,
        getAllRevisionsByIds,
        getLatestRevisionByEntryId,
        getPublishedRevisionByEntryId,
        getRevisionById,
        getRevisions,
        getByIds,
        getLatestByIds,
        getPublishedByIds,
        getPreviousRevision
    };
};
