import {
    CmsEntry,
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
import {
    createElasticsearchQueryBody,
    extractEntriesFromIndex,
    prepareEntryToIndex
} from "~/helpers";
import { configurations } from "~/configurations";
import WebinyError from "@webiny/error";
import lodashCloneDeep from "lodash/cloneDeep";
import lodashOmit from "lodash/omit";
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
import { ElasticsearchSearchResponse } from "@webiny/api-elasticsearch/types";

const createType = (): string => {
    return "cms.entry";
};
export const createLatestType = (): string => {
    return `${createType()}.l`;
};
export const createPublishedType = (): string => {
    return `${createType()}.p`;
};

const getEntryData = (entry: CmsEntry) => {
    return {
        ...lodashOmit(entry, ["PK", "SK", "published", "latest"]),
        TYPE: createType(),
        __type: createType()
    };
};

const getESLatestEntryData = async (plugins: PluginsContainer, entry: CmsEntry) => {
    return compress(plugins, {
        ...getEntryData(entry),
        latest: true,
        TYPE: createLatestType(),
        __type: createLatestType()
    });
};

const getESPublishedEntryData = async (plugins: PluginsContainer, entry: CmsEntry) => {
    return compress(plugins, {
        ...getEntryData(entry),
        published: true,
        TYPE: createPublishedType(),
        __type: createPublishedType()
    });
};

interface ElasticsearchDbRecord {
    index: string;
    data: Record<string, string>;
}

export interface CreateEntriesStorageOperationsParams {
    entity: Entity<any>;
    esEntity: Entity<any>;
    elasticsearch: Client;
    plugins: PluginsContainer;
}
export const createEntriesStorageOperations = (
    params: CreateEntriesStorageOperationsParams
): CmsEntryStorageOperations => {
    const { entity, esEntity, elasticsearch, plugins } = params;

    const dataLoaders = new DataLoadersHandler({
        entity
    });

    const create = async (model: CmsModel, params: CmsEntryStorageOperationsCreateParams) => {
        const { entry, storageEntry } = params;

        const esEntry = prepareEntryToIndex({
            plugins,
            model,
            entry: lodashCloneDeep(entry),
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
            dataLoaders.clearAll({
                model
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
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams
    ) => {
        const { entry, storageEntry } = params;
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
            entry: lodashCloneDeep(entry),
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
            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create revision from given entry in the DynamoDB table.",
                ex.code || "CREATE_REVISION_ERROR",
                {
                    error: ex,
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
                    entry
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
            model,
            ids: [entry.id]
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
        if (latestStorageEntry.id === entry.id) {
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
                entry: lodashCloneDeep(entry),
                storageEntry: lodashCloneDeep(storageEntry)
            });

            elasticsearchLatestData = await getESLatestEntryData(plugins, esEntry);
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
                ex.message || "Could not update entry DynamoDB records.",
                ex.code || "UPDATE_ENTRY_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }
        if (!elasticsearchLatestData) {
            return storageEntry;
        }
        const { index: esIndex } = configurations.es({
            model
        });
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
                    entry
                }
            );
        }
        return storageEntry;
    };

    const deleteEntry = async (model: CmsModel, params: CmsEntryStorageOperationsDeleteParams) => {
        const { entry } = params;

        const partitionKey = createPartitionKey(entry);

        const items = await queryAll<CmsEntry>({
            entity,
            partitionKey,
            options: {
                gte: " "
            }
        });

        const esItems = await queryAll<CmsEntry>({
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
            dataLoaders.clearAll({
                model
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
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams
    ) => {
        const { entry, latestEntry, latestStorageEntry } = params;

        const partitionKey = createPartitionKey(entry);

        const { index } = configurations.es({
            model
        });
        /**
         * We need published entry to delete it if necessary.
         */
        const [publishedStorageEntry] = await dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: [entry.id]
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
                SK: createRevisionSortKey(entry)
            })
        ];

        const esItems = [];

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
            esItems.push(
                entity.deleteBatch({
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                })
            );
        }
        if (latestEntry && latestStorageEntry) {
            const esEntry = prepareEntryToIndex({
                plugins,
                model,
                entry: lodashCloneDeep(latestEntry),
                storageEntry: lodashCloneDeep(latestStorageEntry)
            });

            const esLatestData = await getESLatestEntryData(plugins, esEntry);
            /**
             * In the end we need to set the new latest entry
             */
            items.push(
                entity.putBatch({
                    ...latestStorageEntry,
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

            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not batch write entry records to DynamoDB table.",
                ex.code || "DELETE_REVISION_ERROR",
                {
                    error: ex,
                    entry,
                    latestEntry,
                    latestStorageEntry
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
                    entry,
                    latestEntry,
                    latestStorageEntry
                }
            );
        }
    };

    const list = async (model: CmsModel, params: CmsEntryStorageOperationsListParams) => {
        const limit = createLimit(params.limit, 50);
        const { index } = configurations.es({
            model
        });

        try {
            const result = await elasticsearch.indices.exists({
                index
            });
            if (!result || !result.body) {
                return {
                    hasMoreItems: false,
                    totalCount: 0,
                    cursor: null,
                    items: []
                };
            }
        } catch (ex) {
            throw new WebinyError(
                "Could not determine if Elasticsearch index exists.",
                "ELASTICSEARCH_INDEX_CHECK_ERROR",
                {
                    error: ex,
                    index
                }
            );
        }

        const body = createElasticsearchQueryBody({
            model,
            args: {
                ...params,
                limit
            },
            plugins,
            parentPath: "values"
        });

        let response: ElasticsearchSearchResponse;
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
        const cursor = items.length > 0 ? encodeCursor(hits[items.length - 1].sort) || null : null;
        return {
            hasMoreItems,
            totalCount: total.value,
            cursor,
            items
        };
    };

    const get = async (model: CmsModel, params: CmsEntryStorageOperationsGetParams) => {
        const { items } = await list(model, {
            ...params,
            limit: 1
        });
        return items.shift() || null;
    };

    const publish = async (model: CmsModel, params: CmsEntryStorageOperationsPublishParams) => {
        const { entry, storageEntry } = params;

        /**
         * We need currently published entry to check if need to remove it.
         */
        const [publishedStorageEntry] = await dataLoaders.getPublishedRevisionByEntryId({
            model,
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

        let latestEsEntry: ElasticsearchDbRecord | null = null;
        try {
            latestEsEntry = await getRecord<ElasticsearchDbRecord>({
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

        if (publishedStorageEntry && publishedStorageEntry.id !== entry.id) {
            /**
             * If there is a `published` entry already, we need to set it to `unpublished`. We need to
             * execute two updates: update the previously published entry's status and the published entry record.
             * DynamoDB does not support `batchUpdate` - so here we load the previously published
             * entry's data to update its status within a batch operation. If, hopefully,
             * they introduce a true update batch operation, remove this `read` call.
             */
            const [previouslyPublishedEntry] = await dataLoaders.getRevisionById({
                model,
                ids: [publishedStorageEntry.id]
            });

            items.push(
                /**
                 * Update currently published entry (unpublish it)
                 */
                entity.putBatch({
                    ...previouslyPublishedEntry,
                    status: CONTENT_ENTRY_STATUS.UNPUBLISHED,
                    savedOn: entry.savedOn,
                    TYPE: createType(),
                    PK: createPartitionKey(publishedStorageEntry),
                    SK: createRevisionSortKey(publishedStorageEntry)
                })
            );
        }
        /**
         * Update the helper item in DB with the new published entry
         */
        items.push(
            entity.putBatch({
                ...storageEntry,
                ...publishedKeys,
                TYPE: createPublishedType()
            })
        );

        /**
         * We need the latest entry to check if it needs to be updated as well in the Elasticsearch.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: [entry.id]
        });

        if (latestStorageEntry && latestStorageEntry.id === entry.id) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    ...latestKeys
                })
            );
        }
        /**
         * If we are publishing the latest revision, let's also update the latest revision's status in ES.
         */
        if (latestEsEntry && latestStorageEntry && latestStorageEntry.id === entry.id) {
            /**
             * Need to decompress the data from Elasticsearch DynamoDB table.
             */
            const latestEsEntryDataDecompressed: CmsEntry = (await decompress(
                plugins,
                latestEsEntry.data
            )) as any;

            esItems.push(
                esEntity.putBatch({
                    index,
                    PK: createPartitionKey(latestEsEntryDataDecompressed),
                    SK: createLatestSortKey(),
                    data: {
                        ...latestEsEntryDataDecompressed,
                        status: CONTENT_ENTRY_STATUS.PUBLISHED,
                        locked: true,
                        savedOn: entry.savedOn,
                        publishedOn: entry.publishedOn
                    }
                })
            );
        }

        const preparedEntryData = prepareEntryToIndex({
            plugins,
            model,
            entry: lodashCloneDeep(entry),
            storageEntry: lodashCloneDeep(storageEntry)
        });
        /**
         * Update the published revision entry in ES.
         */
        const esLatestData = await getESPublishedEntryData(plugins, preparedEntryData);

        esItems.push(
            esEntity.putBatch({
                ...publishedKeys,
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
            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not store publish entry records in DynamoDB table.",
                ex.code || "PUBLISH_ERROR",
                {
                    error: ex,
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
                ex.code || "PUBLISH_ES_ERROR",
                {
                    error: ex,
                    entry,
                    latestStorageEntry,
                    publishedStorageEntry
                }
            );
        }
        return storageEntry;
    };

    const unpublish = async (model: CmsModel, params: CmsEntryStorageOperationsUnpublishParams) => {
        const { entry, storageEntry } = params;

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
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
                entry: lodashCloneDeep(entry),
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
            dataLoaders.clearAll({
                model
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
        model: CmsModel,
        params: CmsEntryStorageOperationsRequestReviewParams
    ) => {
        const { entry, storageEntry } = params;

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
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
                entry: lodashCloneDeep(entry),
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
            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not store request review entry record into DynamoDB table.",
                ex.code || "REQUEST_REVIEW_ERROR",
                {
                    entry,
                    storageEntry,
                    latestStorageEntry
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
                    storageEntry,
                    latestStorageEntry
                }
            );
        }
        return storageEntry;
    };

    const requestChanges = async (
        model: CmsModel,
        params: CmsEntryStorageOperationsRequestChangesParams
    ) => {
        const { entry, storageEntry } = params;

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
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
                entry: lodashCloneDeep(entry),
                storageEntry: lodashCloneDeep(storageEntry)
            });

            esLatestData = await getESLatestEntryData(plugins, preparedEntryData);
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
                ex.message || "Could not store request changes entry record into DynamoDB table.",
                ex.code || "REQUEST_CHANGES_ERROR",
                {
                    entry,
                    latestStorageEntry
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
                    latestStorageEntry
                }
            );
        }
        return storageEntry;
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
        const { tenant, locale } = model;
        const { entryId, version } = params;
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
