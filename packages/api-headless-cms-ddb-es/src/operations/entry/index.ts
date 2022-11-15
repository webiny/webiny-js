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
    CmsStorageEntry,
    CONTENT_ENTRY_STATUS,
    StorageOperationsCmsModel
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
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { DataLoadersHandler } from "~/operations/entry/dataLoaders";
import {
    createLatestSortKey,
    createPartitionKey,
    createPublishedSortKey,
    createRevisionSortKey
} from "~/operations/entry/keys";
import { queryAll, queryOne, QueryOneParams } from "@webiny/db-dynamodb/utils/query";
import { createLimit, encodeCursor, compress, decompress } from "@webiny/api-elasticsearch";
import { get as getRecord } from "@webiny/db-dynamodb/utils/get";
import { zeroPad } from "@webiny/utils";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { ElasticsearchSearchResponse } from "@webiny/api-elasticsearch/types";
import { CmsIndexEntry } from "~/types";

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

interface ConvertStorageEntryParams {
    entry: CmsStorageEntry;
    model: StorageOperationsCmsModel;
}
const convertToStorageEntry = (params: ConvertStorageEntryParams): CmsStorageEntry => {
    const { model, entry } = params;

    const values = model.convertValueKeyToStorage({
        fields: model.fields,
        values: entry.values
    });
    return {
        ...entry,
        values
    };
};

const convertFromStorageEntry = (params: ConvertStorageEntryParams): CmsStorageEntry => {
    const { model, entry } = params;

    const values = model.convertValueKeyFromStorage({
        fields: model.fields,
        values: entry.values
    });
    return {
        ...entry,
        values
    };
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

    const create = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsCreateParams
    ) => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;
        const isPublished = initialEntry.status === "published";
        const locked = isPublished ? true : initialEntry.locked;

        const entry = convertToStorageEntry({
            model,
            entry: initialEntry
        });
        const storageEntry = convertToStorageEntry({
            model,
            entry: initialStorageEntry
        });

        const esEntry = prepareEntryToIndex({
            plugins,
            model,
            entry: lodashCloneDeep({ ...entry, locked }),
            storageEntry: lodashCloneDeep({ ...storageEntry, locked })
        });

        const { index: esIndex } = configurations.es({
            model
        });

        const esLatestData = await getESLatestEntryData(plugins, esEntry);
        const esPublishedData = await getESPublishedEntryData(plugins, esEntry);

        const revisionKeys = {
            PK: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
            SK: createRevisionSortKey(entry)
        };

        const latestKeys = {
            PK: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
            SK: createLatestSortKey()
        };

        const publishedKeys = {
            PK: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
            SK: createPublishedSortKey()
        };

        const items = [
            entity.putBatch({
                ...storageEntry,
                locked,
                ...revisionKeys,
                TYPE: createType()
            }),
            entity.putBatch({
                ...storageEntry,
                locked,
                ...latestKeys,
                TYPE: createLatestType()
            })
        ];

        if (isPublished) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    locked,
                    ...publishedKeys,
                    TYPE: createPublishedType()
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
                ex.message || "Could not insert entry data into the DynamoDB table.",
                ex.code || "CREATE_ENTRY_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }

        const esItems = [
            esEntity.putBatch({
                ...latestKeys,
                index: esIndex,
                data: esLatestData
            })
        ];
        if (isPublished) {
            esItems.push(
                esEntity.putBatch({
                    ...publishedKeys,
                    index: esIndex,
                    data: esPublishedData
                })
            );
        }

        try {
            await batchWriteAll({
                table: esEntity.table,
                items: esItems
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

        return initialStorageEntry;
    };

    const createRevisionFrom = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams
    ) => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;

        const entry = convertToStorageEntry({
            model,
            entry: initialEntry
        });
        const storageEntry = convertToStorageEntry({
            model,
            entry: initialStorageEntry
        });

        const revisionKeys = {
            PK: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
            SK: createRevisionSortKey(entry)
        };
        const latestKeys = {
            PK: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
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
        return initialStorageEntry;
    };

    const update = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsUpdateParams
    ) => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;

        const entry = convertToStorageEntry({
            model,
            entry: initialEntry
        });
        const storageEntry = convertToStorageEntry({
            model,
            entry: initialStorageEntry
        });

        const isPublished = entry.status === "published";
        const locked = isPublished ? true : entry.locked;

        const revisionKeys = {
            PK: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
            SK: createRevisionSortKey(entry)
        };
        const latestKeys = {
            PK: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
            SK: createLatestSortKey()
        };

        const publishedKeys = {
            PK: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
            SK: createPublishedSortKey()
        };

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: [entry.id]
        });

        const [publishedStorageEntry] = await dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: [entry.id]
        });

        const items = [
            entity.putBatch({
                ...storageEntry,
                locked,
                ...revisionKeys,
                TYPE: createType()
            })
        ];
        if (isPublished) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    locked,
                    ...publishedKeys,
                    TYPE: createPublishedType()
                })
            );
        }

        const esItems = [];

        const { index: esIndex } = configurations.es({
            model
        });
        /**
         * Variable for the elasticsearch entry so we do not convert it more than once
         */
        let esEntry: CmsIndexEntry | undefined = undefined;
        /**
         * If the latest entry is the one being updated, we need to create a new latest entry records.
         */
        let elasticsearchLatestData: any = null;
        if (latestStorageEntry?.id === entry.id) {
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
            esEntry = prepareEntryToIndex({
                plugins,
                model,
                entry: lodashCloneDeep({
                    ...entry,
                    locked
                }),
                storageEntry: lodashCloneDeep({
                    ...storageEntry,
                    locked
                })
            });

            elasticsearchLatestData = await getESLatestEntryData(plugins, esEntry);

            esItems.push(
                esEntity.putBatch({
                    ...latestKeys,
                    index: esIndex,
                    data: elasticsearchLatestData
                })
            );
        }
        let elasticsearchPublishedData = null;
        if (isPublished && publishedStorageEntry?.id === entry.id) {
            if (!elasticsearchLatestData) {
                /**
                 * And then update the Elasticsearch table to propagate changes to the Elasticsearch
                 */
                if (!esEntry) {
                    esEntry = prepareEntryToIndex({
                        plugins,
                        model,
                        entry: lodashCloneDeep({
                            ...entry,
                            locked
                        }),
                        storageEntry: lodashCloneDeep({
                            ...storageEntry,
                            locked
                        })
                    });
                }
                elasticsearchPublishedData = await getESPublishedEntryData(plugins, esEntry);
            } else {
                elasticsearchPublishedData = {
                    ...elasticsearchLatestData,
                    published: true,
                    TYPE: createPublishedType(),
                    __type: createPublishedType()
                };
                delete elasticsearchPublishedData.latest;
            }
            esItems.push(
                esEntity.putBatch({
                    ...publishedKeys,
                    index: esIndex,
                    data: elasticsearchPublishedData
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
                ex.message || "Could not update entry DynamoDB records.",
                ex.code || "UPDATE_ENTRY_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }
        if (esItems.length === 0) {
            return initialStorageEntry;
        }

        try {
            await batchWriteAll({
                table: esEntity.table,
                items: esItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update entry DynamoDB Elasticsearch records.",
                ex.code || "UPDATE_ES_ENTRY_ERROR",
                {
                    error: ex,
                    entry
                }
            );
        }
        return initialStorageEntry;
    };

    const deleteEntry = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsDeleteParams
    ) => {
        const { entry } = params;

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

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
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams
    ) => {
        const { entry, latestEntry, latestStorageEntry } = params;

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

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
        if (publishedStorageEntry?.id === entry.id) {
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

    const list = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsListParams
    ) => {
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
                body,
                model
            });
        }

        const { hits, total } = response.body.hits;

        const items = extractEntriesFromIndex({
            plugins,
            model,
            entries: hits.map(item => item._source)
        }).map(item => {
            return convertFromStorageEntry({
                model,
                entry: item
            });
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

    const get = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsGetParams
    ) => {
        const { items } = await list(model, {
            ...params,
            limit: 1
        });
        return items.shift() || null;
    };

    const publish = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsPublishParams
    ) => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;

        const entry = convertToStorageEntry({
            model,
            entry: initialEntry
        });
        const storageEntry = convertToStorageEntry({
            model,
            entry: initialStorageEntry
        });

        /**
         * We need currently published entry to check if need to remove it.
         */
        const [publishedStorageEntry] = await dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: [entry.id]
        });

        const revisionKeys = {
            PK: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
            SK: createRevisionSortKey(entry)
        };
        const latestKeys = {
            PK: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
            SK: createLatestSortKey()
        };
        const publishedKeys = {
            PK: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
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
            //
            // const previouslyPublishedEntry = convertToStorageEntry({
            //     model,
            //     entry: initialPreviouslyPublishedEntry
            // });

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

        if (latestStorageEntry?.id === entry.id) {
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
        if (latestEsEntry && latestStorageEntry?.id === entry.id) {
            /**
             * Need to decompress the data from Elasticsearch DynamoDB table.
             *
             * No need to transform it for the storage because it was fetched directly from the Elasticsearch table, where it sits transformed.
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
        return initialStorageEntry;
    };

    const unpublish = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsUnpublishParams
    ) => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;

        const entry = convertToStorageEntry({
            model,
            entry: initialEntry
        });
        const storageEntry = convertToStorageEntry({
            model,
            entry: initialStorageEntry
        });

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: [entry.id]
        });

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

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
        if (latestStorageEntry?.id === entry.id) {
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
        return initialStorageEntry;
    };

    const requestReview = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsRequestReviewParams
    ) => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;

        const entry = convertToStorageEntry({
            model,
            entry: initialEntry
        });
        const storageEntry = convertToStorageEntry({
            model,
            entry: initialStorageEntry
        });

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: [entry.id]
        });

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

        /**
         * If we updated the latest version, then make sure the changes are propagated to ES too.
         */
        let esLatestData = null;
        const { index } = configurations.es({
            model
        });
        if (latestStorageEntry?.id === entry.id) {
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
            return initialStorageEntry;
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
        return initialStorageEntry;
    };

    const requestChanges = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsRequestChangesParams
    ) => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;

        const entry = convertToStorageEntry({
            model,
            entry: initialEntry
        });
        const storageEntry = convertToStorageEntry({
            model,
            entry: initialStorageEntry
        });

        /**
         * We need the latest entry to check if it needs to be updated.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: [entry.id]
        });

        const partitionKey = createPartitionKey({
            id: entry.id,
            locale: model.locale,
            tenant: model.tenant
        });

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
        if (latestStorageEntry?.id === entry.id) {
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
            return initialStorageEntry;
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
        return initialStorageEntry;
    };

    const getLatestRevisionByEntryId = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) => {
        const [entry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: [params.id]
        });
        if (!entry) {
            return null;
        }
        return convertFromStorageEntry({
            model,
            entry
        });
    };
    const getPublishedRevisionByEntryId = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) => {
        const [entry] = await dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: [params.id]
        });
        if (!entry) {
            return null;
        }
        return convertFromStorageEntry({
            model,
            entry
        });
    };

    const getRevisionById = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ) => {
        const [entry] = await dataLoaders.getRevisionById({
            model,
            ids: [params.id]
        });
        if (!entry) {
            return null;
        }
        return convertFromStorageEntry({
            model,
            entry
        });
    };

    const getRevisions = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsGetRevisionsParams
    ) => {
        const entries = await dataLoaders.getAllEntryRevisions({
            model,
            ids: [params.id]
        });

        return entries.map(entry => {
            return convertFromStorageEntry({
                model,
                entry
            });
        });
    };

    const getByIds = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsGetByIdsParams
    ) => {
        const entries = await dataLoaders.getRevisionById({
            model,
            ids: params.ids
        });
        return entries.map(entry => {
            return convertFromStorageEntry({
                model,
                entry
            });
        });
    };

    const getLatestByIds = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsGetLatestByIdsParams
    ) => {
        const entries = await dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: params.ids
        });
        return entries.map(entry => {
            return convertFromStorageEntry({
                model,
                entry
            });
        });
    };

    const getPublishedByIds = async (
        model: StorageOperationsCmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ) => {
        const entries = await dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: params.ids
        });

        return entries.map(entry => {
            return convertFromStorageEntry({
                model,
                entry
            });
        });
    };

    const getPreviousRevision = async (
        model: StorageOperationsCmsModel,
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

            const entry = cleanupItem(entity, result);

            if (!entry) {
                return null;
            }
            return convertFromStorageEntry({
                entry,
                model
            });
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
