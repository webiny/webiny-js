import WebinyError from "@webiny/error";
import {
    CmsEntry,
    CmsModel,
    CONTENT_ENTRY_STATUS,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types";
import { extractEntriesFromIndex } from "~/helpers";
import { configurations } from "~/configurations";
import { Entity } from "@webiny/db-dynamodb/toolbox";
import { Client } from "@elastic/elasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import { batchWriteAll, BatchWriteItem } from "@webiny/db-dynamodb/utils/batchWrite";
import { DataLoadersHandler } from "./dataLoaders";
import {
    createLatestSortKey,
    createPartitionKey,
    createPublishedSortKey,
    createRevisionSortKey
} from "./keys";
import {
    queryAll,
    QueryAllParams,
    queryOne,
    QueryOneParams
} from "@webiny/db-dynamodb/utils/query";
import {
    compress,
    createLimit,
    decodeCursor,
    decompress,
    encodeCursor
} from "@webiny/api-elasticsearch";
import { getClean } from "@webiny/db-dynamodb/utils/get";
import { zeroPad } from "@webiny/utils";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import {
    ElasticsearchSearchResponse,
    SearchBody as ElasticsearchSearchBody
} from "@webiny/api-elasticsearch/types";
import { CmsEntryStorageOperations, CmsIndexEntry } from "~/types";
import { createElasticsearchBody } from "./elasticsearch/body";
import { createLatestRecordType, createPublishedRecordType, createRecordType } from "./recordType";
import { StorageOperationsCmsModelPlugin } from "@webiny/api-headless-cms";
import { WriteRequest } from "@webiny/aws-sdk/client-dynamodb";
import { batchReadAll, BatchReadItem, put } from "@webiny/db-dynamodb";
import { createTransformer } from "./transformations";
import { convertEntryKeysFromStorage } from "./transformations/convertEntryKeys";
import {
    isEntryLevelEntryMetaField,
    pickEntryMetaFields
} from "@webiny/api-headless-cms/constants";

interface ElasticsearchDbRecord {
    index: string;
    data: Record<string, any>;
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

    const getStorageOperationsModel = (model: CmsModel): StorageOperationsCmsModel => {
        const plugin = getStorageOperationsCmsModelPlugin();
        return plugin.getModel(model);
    };

    const dataLoaders = new DataLoadersHandler({
        entity
    });

    const create: CmsEntryStorageOperations["create"] = async (initialModel, params) => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;

        const model = getStorageOperationsModel(initialModel);

        const isPublished = initialEntry.status === "published";
        const locked = isPublished ? true : initialEntry.locked;

        initialEntry.locked = locked;
        initialStorageEntry.locked = locked;

        const transformer = createTransformer({
            plugins,
            model,
            entry: initialEntry,
            storageEntry: initialStorageEntry
        });

        const { entry, storageEntry } = transformer.transformEntryKeys();

        const esEntry = transformer.transformToIndex();

        const { index: esIndex } = configurations.es({
            model
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

        const items = [
            entity.putBatch({
                ...storageEntry,
                locked,
                ...revisionKeys,
                TYPE: createRecordType()
            }),
            entity.putBatch({
                ...storageEntry,
                locked,
                ...latestKeys,
                TYPE: createLatestRecordType()
            })
        ];

        if (isPublished) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    locked,
                    ...publishedKeys,
                    TYPE: createPublishedRecordType()
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

        const esLatestData = await transformer.getElasticsearchLatestEntryData();
        const esItems: BatchWriteItem[] = [
            esEntity.putBatch({
                ...latestKeys,
                index: esIndex,
                data: esLatestData
            })
        ];
        if (isPublished) {
            const esPublishedData = await transformer.getElasticsearchPublishedEntryData();
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

    const createRevisionFrom: CmsEntryStorageOperations["createRevisionFrom"] = async (
        initialModel,
        params
    ) => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        const transformer = createTransformer({
            plugins,
            model,
            entry: initialEntry,
            storageEntry: initialStorageEntry
        });
        const { entry, storageEntry } = transformer.transformEntryKeys();

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

        const esLatestData = await transformer.getElasticsearchLatestEntryData();

        const items = [
            entity.putBatch({
                ...storageEntry,
                TYPE: createRecordType(),
                ...revisionKeys
            }),
            entity.putBatch({
                ...storageEntry,
                TYPE: createLatestRecordType(),
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
            await put({
                entity: esEntity,
                item: {
                    ...latestKeys,
                    index,
                    data: esLatestData
                }
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

    const update: CmsEntryStorageOperations["update"] = async (initialModel, params) => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        const transformer = createTransformer({
            plugins,
            model,
            entry: initialEntry,
            storageEntry: initialStorageEntry
        });

        const { entry, storageEntry } = transformer.transformEntryKeys();

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
                TYPE: createRecordType()
            })
        ];
        if (isPublished) {
            items.push(
                entity.putBatch({
                    ...storageEntry,
                    locked,
                    ...publishedKeys,
                    TYPE: createPublishedRecordType()
                })
            );
        }

        const esItems: BatchWriteItem[] = [];

        const { index: esIndex } = configurations.es({
            model
        });

        /**
         * If the latest entry is the one being updated, we need to create a new latest entry records.
         */
        if (latestStorageEntry) {
            const updatingLatestRevision = latestStorageEntry.id === entry.id;
            if (updatingLatestRevision) {
                /**
                 * First we update the regular DynamoDB table.
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
                const elasticsearchLatestData = await transformer.getElasticsearchLatestEntryData();

                esItems.push(
                    esEntity.putBatch({
                        ...latestKeys,
                        index: esIndex,
                        data: elasticsearchLatestData
                    })
                );
            } else {
                /**
                 * If not updating latest revision, we still want to update the latest revision's
                 * entry-level meta fields to match the current revision's entry-level meta fields.
                 */
                const updatedEntryLevelMetaFields = pickEntryMetaFields(
                    entry,
                    isEntryLevelEntryMetaField
                );

                const updatedLatestStorageEntry = {
                    ...latestStorageEntry,
                    ...latestKeys,
                    ...updatedEntryLevelMetaFields
                };

                /**
                 * First we update the regular DynamoDB table. Two updates are needed:
                 * - one for the actual revision record
                 * - one for the latest record
                 */
                items.push(
                    entity.putBatch({
                        ...updatedLatestStorageEntry,
                        PK: createPartitionKey({
                            id: latestStorageEntry.id,
                            locale: model.locale,
                            tenant: model.tenant
                        }),
                        SK: createRevisionSortKey(latestStorageEntry),
                        TYPE: createRecordType()
                    })
                );

                items.push(
                    entity.putBatch({
                        ...updatedLatestStorageEntry,
                        TYPE: createLatestSortKey()
                    })
                );

                /**
                 * Update the Elasticsearch table to propagate changes to the Elasticsearch.
                 */
                const latestEsEntry = await getClean<ElasticsearchDbRecord>({
                    entity: esEntity,
                    keys: latestKeys
                });

                if (latestEsEntry) {
                    const latestEsEntryDataDecompressed = (await decompress(
                        plugins,
                        latestEsEntry.data
                    )) as CmsIndexEntry;

                    const updatedLatestEntry = await compress(plugins, {
                        ...latestEsEntryDataDecompressed,
                        ...updatedEntryLevelMetaFields
                    });

                    esItems.push(
                        esEntity.putBatch({
                            ...latestKeys,
                            index: esIndex,
                            data: updatedLatestEntry
                        })
                    );
                }
            }
        }

        if (isPublished && publishedStorageEntry?.id === entry.id) {
            const elasticsearchPublishedData =
                await transformer.getElasticsearchPublishedEntryData();
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

    const move: CmsEntryStorageOperations["move"] = async (initialModel, id, folderId) => {
        const model = getStorageOperationsModel(initialModel);

        const partitionKey = createPartitionKey({
            id,
            locale: model.locale,
            tenant: model.tenant
        });
        /**
         * First we need to fetch all the records in the regular DynamoDB table.
         */
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey,
            options: {
                gte: " "
            }
        };
        const latestSortKey = createLatestSortKey();
        const publishedSortKey = createPublishedSortKey();
        const records = await queryAll<CmsEntry>(queryAllParams);
        /**
         * Then update the folderId in each record and prepare it to be stored.
         */
        let latestRecord: CmsEntry | undefined = undefined;
        let publishedRecord: CmsEntry | undefined = undefined;
        const items: BatchWriteItem[] = [];
        for (const record of records) {
            items.push(
                entity.putBatch({
                    ...record,
                    location: {
                        ...record?.location,
                        folderId
                    }
                })
            );
            /**
             * We need to get the published and latest records, so we can update the Elasticsearch.
             */
            if (record.SK === publishedSortKey) {
                publishedRecord = record;
            } else if (record.SK === latestSortKey) {
                latestRecord = record;
            }
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
                ex.message || "Could not move all entry records from in the DynamoDB table.",
                ex.code || "MOVE_ENTRY_ERROR",
                {
                    error: ex,
                    id
                }
            );
        }
        const esGetItems: BatchReadItem[] = [];
        if (publishedRecord) {
            esGetItems.push(
                esEntity.getBatch({
                    PK: partitionKey,
                    SK: publishedSortKey
                })
            );
        }
        if (latestRecord) {
            esGetItems.push(
                esEntity.getBatch({
                    PK: partitionKey,
                    SK: latestSortKey
                })
            );
        }
        if (esGetItems.length === 0) {
            return;
        }
        const esRecords = await batchReadAll<ElasticsearchDbRecord>({
            table: esEntity.table,
            items: esGetItems
        });
        const esItems = (
            await Promise.all(
                esRecords.map(async record => {
                    if (!record) {
                        return null;
                    }
                    return {
                        ...record,
                        data: await decompress(plugins, record.data)
                    };
                })
            )
        ).filter(Boolean) as ElasticsearchDbRecord[];

        if (esItems.length === 0) {
            return;
        }
        const esUpdateItems: BatchWriteItem[] = [];
        for (const item of esItems) {
            esUpdateItems.push(
                esEntity.putBatch({
                    ...item,
                    data: await compress(plugins, {
                        ...item.data,
                        location: {
                            ...item.data?.location,
                            folderId
                        }
                    })
                })
            );
        }

        try {
            await batchWriteAll({
                table: esEntity.table,
                items: esUpdateItems
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not move entry DynamoDB Elasticsearch records.",
                ex.code || "MOVE_ES_ENTRY_ERROR",
                {
                    error: ex,
                    partitionKey
                }
            );
        }
    };

    const deleteEntry: CmsEntryStorageOperations["delete"] = async (initialModel, params) => {
        const { entry } = params;
        const id = entry.id || entry.entryId;
        const model = getStorageOperationsModel(initialModel);

        const partitionKey = createPartitionKey({
            id,
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
                    id
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
                    id
                }
            );
        }
    };

    const deleteRevision: CmsEntryStorageOperations["deleteRevision"] = async (
        initialModel,
        params
    ) => {
        const { entry, latestEntry, latestStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

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

        const esItems: BatchWriteItem[] = [];

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
            /**
             * In the end we need to set the new latest entry.
             */
            items.push(
                entity.putBatch({
                    ...latestStorageEntry,
                    PK: partitionKey,
                    SK: createLatestSortKey(),
                    TYPE: createLatestRecordType()
                })
            );

            /**
             * Also perform an update on the actual revision. This is needed
             * because of updates on the entry-level meta fields.
             */
            items.push(
                entity.putBatch({
                    ...latestStorageEntry,
                    PK: createPartitionKey({
                        id: latestStorageEntry.id,
                        locale: model.locale,
                        tenant: model.tenant
                    }),
                    SK: createRevisionSortKey(latestStorageEntry),
                    TYPE: createRecordType()
                })
            );

            const latestTransformer = createTransformer({
                plugins,
                model,
                entry: latestEntry,
                storageEntry: latestStorageEntry
            });

            const esLatestData = await latestTransformer.getElasticsearchLatestEntryData();
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

    const deleteMultipleEntries: CmsEntryStorageOperations["deleteMultipleEntries"] = async (
        initialModel,
        params
    ) => {
        const { entries } = params;
        const model = getStorageOperationsModel(initialModel);
        /**
         * We need to construct the queries for all the revisions and entries.
         */
        const items: Record<string, WriteRequest>[] = [];
        const esItems: Record<string, WriteRequest>[] = [];
        for (const id of entries) {
            const partitionKey = createPartitionKey({
                id,
                locale: model.locale,
                tenant: model.tenant
            });

            const entryItems = await queryAll<CmsEntry>({
                entity,
                partitionKey,
                options: {
                    gte: " "
                }
            });

            const esEntryItems = await queryAll<CmsEntry>({
                entity: esEntity,
                partitionKey,
                options: {
                    gte: " "
                }
            });

            items.push(
                ...entryItems.map(item => {
                    return entity.deleteBatch({
                        PK: item.PK,
                        SK: item.SK
                    });
                })
            );

            esItems.push(
                ...esEntryItems.map(item => {
                    return esEntity.deleteBatch({
                        PK: item.PK,
                        SK: item.SK
                    });
                })
            );
        }

        await batchWriteAll({
            table: entity.table,
            items
        });
        await batchWriteAll({
            table: esEntity.table,
            items: esItems
        });
    };

    const list: CmsEntryStorageOperations["list"] = async (initialModel, params) => {
        const model = getStorageOperationsModel(initialModel);

        const limit = createLimit(params.limit, 50);
        const { index } = configurations.es({
            model
        });

        const body = createElasticsearchBody({
            model,
            params: {
                ...params,
                limit,
                after: decodeCursor(params.after)
            },
            plugins
        });

        let response: ElasticsearchSearchResponse<CmsIndexEntry>;
        try {
            response = await elasticsearch.search({
                index,
                body
            });
        } catch (ex) {
            /**
             * We will silently ignore the `index_not_found_exception` error and return an empty result set.
             * This is because the index might not exist yet, and we don't want to throw an error.
             */
            if (ex.message === "index_not_found_exception") {
                return {
                    hasMoreItems: false,
                    totalCount: 0,
                    cursor: null,
                    items: []
                };
            }
            throw new WebinyError(ex.message, ex.code || "ELASTICSEARCH_ERROR", {
                error: ex,
                index,
                body,
                model
            });
        }

        const { hits, total } = response?.body?.hits || {};

        const items = extractEntriesFromIndex({
            plugins,
            model,
            entries: hits.map(item => item._source)
        }).map(item => {
            return convertEntryKeysFromStorage({
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

    const get: CmsEntryStorageOperations["get"] = async (initialModel, params) => {
        const model = getStorageOperationsModel(initialModel);

        const { items } = await list(model, {
            ...params,
            limit: 1
        });
        return items.shift() || null;
    };

    const publish: CmsEntryStorageOperations["publish"] = async (initialModel, params) => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        const transformer = createTransformer({
            plugins,
            model,
            entry: initialEntry,
            storageEntry: initialStorageEntry
        });

        const { entry, storageEntry } = transformer.transformEntryKeys();

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
            latestEsEntry = await getClean<ElasticsearchDbRecord>({
                entity: esEntity,
                keys: latestKeys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not read Elasticsearch latest data.",
                ex.code || "PUBLISH_LATEST_READ",
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
                TYPE: createRecordType()
            })
        ];
        const esItems: BatchWriteItem[] = [];

        const { index: esIndex } = configurations.es({
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
                    TYPE: createRecordType(),
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
                TYPE: createPublishedRecordType()
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

        if (latestEsEntry) {
            const publishingLatestRevision = latestStorageEntry?.id === entry.id;

            /**
             * Need to decompress the data from Elasticsearch DynamoDB table.
             *
             * No need to transform it for the storage because it was fetched
             * directly from the Elasticsearch table, where it sits transformed.
             */
            const latestEsEntryDataDecompressed = (await decompress(
                plugins,
                latestEsEntry.data
            )) as CmsIndexEntry;

            if (publishingLatestRevision) {
                const updatedMetaFields = pickEntryMetaFields(entry);

                const latestTransformer = createTransformer({
                    plugins,
                    model,
                    transformedToIndex: {
                        ...latestEsEntryDataDecompressed,
                        status: CONTENT_ENTRY_STATUS.PUBLISHED,
                        locked: true,
                        ...updatedMetaFields
                    }
                });

                esItems.push(
                    esEntity.putBatch({
                        index: esIndex,
                        PK: createPartitionKey(latestEsEntryDataDecompressed),
                        SK: createLatestSortKey(),
                        data: await latestTransformer.getElasticsearchLatestEntryData()
                    })
                );
            } else {
                const updatedEntryLevelMetaFields = pickEntryMetaFields(
                    entry,
                    isEntryLevelEntryMetaField
                );

                const updatedLatestStorageEntry = {
                    ...latestStorageEntry,
                    ...latestKeys,
                    ...updatedEntryLevelMetaFields
                };

                /**
                 * First we update the regular DynamoDB table. Two updates are needed:
                 * - one for the actual revision record
                 * - one for the latest record
                 */
                items.push(
                    entity.putBatch({
                        ...updatedLatestStorageEntry,
                        PK: createPartitionKey({
                            id: latestStorageEntry.id,
                            locale: model.locale,
                            tenant: model.tenant
                        }),
                        SK: createRevisionSortKey(latestStorageEntry),
                        TYPE: createRecordType()
                    })
                );

                items.push(
                    entity.putBatch({
                        ...updatedLatestStorageEntry,
                        TYPE: createLatestSortKey()
                    })
                );

                /**
                 * Update the Elasticsearch table to propagate changes to the Elasticsearch.
                 */
                const latestEsEntry = await getClean<ElasticsearchDbRecord>({
                    entity: esEntity,
                    keys: latestKeys
                });

                if (latestEsEntry) {
                    const latestEsEntryDataDecompressed = (await decompress(
                        plugins,
                        latestEsEntry.data
                    )) as CmsIndexEntry;

                    const updatedLatestEntry = await compress(plugins, {
                        ...latestEsEntryDataDecompressed,
                        ...updatedEntryLevelMetaFields
                    });

                    esItems.push(
                        esEntity.putBatch({
                            ...latestKeys,
                            index: esIndex,
                            data: updatedLatestEntry
                        })
                    );
                }
            }
        }

        /**
         * Update the published revision entry in ES.
         */
        const esPublishedData = await transformer.getElasticsearchPublishedEntryData();
        esItems.push(
            esEntity.putBatch({
                ...publishedKeys,
                index: esIndex,
                data: esPublishedData
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

    const unpublish: CmsEntryStorageOperations["unpublish"] = async (initialModel, params) => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        const transformer = createTransformer({
            plugins,
            model,
            entry: initialEntry,
            storageEntry: initialStorageEntry
        });
        const { entry, storageEntry } = await transformer.transformEntryKeys();

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
                TYPE: createRecordType()
            })
        ];

        const esItems: BatchWriteItem[] = [
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

            const esLatestData = await transformer.getElasticsearchLatestEntryData();
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

    const getLatestRevisionByEntryId: CmsEntryStorageOperations["getLatestRevisionByEntryId"] =
        async (initialModel, params) => {
            const model = getStorageOperationsModel(initialModel);

            const [entry] = await dataLoaders.getLatestRevisionByEntryId({
                model,
                ids: [params.id]
            });
            if (!entry) {
                return null;
            }
            return convertEntryKeysFromStorage({
                model,
                entry
            });
        };

    const getPublishedRevisionByEntryId: CmsEntryStorageOperations["getPublishedRevisionByEntryId"] =
        async (initialModel, params) => {
            const model = getStorageOperationsModel(initialModel);

            const [entry] = await dataLoaders.getPublishedRevisionByEntryId({
                model,
                ids: [params.id]
            });
            if (!entry) {
                return null;
            }
            return convertEntryKeysFromStorage({
                model,
                entry
            });
        };

    const getRevisionById: CmsEntryStorageOperations["getRevisionById"] = async (
        initialModel,
        params
    ) => {
        const model = getStorageOperationsModel(initialModel);

        const [entry] = await dataLoaders.getRevisionById({
            model,
            ids: [params.id]
        });
        if (!entry) {
            return null;
        }
        return convertEntryKeysFromStorage({
            model,
            entry
        });
    };

    const getRevisions: CmsEntryStorageOperations["getRevisions"] = async (
        initialModel,
        params
    ) => {
        const model = getStorageOperationsModel(initialModel);

        const entries = await dataLoaders.getAllEntryRevisions({
            model,
            ids: [params.id]
        });

        return entries.map(entry => {
            return convertEntryKeysFromStorage({
                model,
                entry
            });
        });
    };

    const getByIds: CmsEntryStorageOperations["getByIds"] = async (initialModel, params) => {
        const model = getStorageOperationsModel(initialModel);

        const entries = await dataLoaders.getRevisionById({
            model,
            ids: params.ids
        });

        return entries.map(entry => {
            return convertEntryKeysFromStorage({
                model,
                entry
            });
        });
    };

    const getLatestByIds: CmsEntryStorageOperations["getLatestByIds"] = async (
        initialModel,
        params
    ) => {
        const model = getStorageOperationsModel(initialModel);

        const entries = await dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: params.ids
        });
        return entries.map(entry => {
            return convertEntryKeysFromStorage({
                model,
                entry
            });
        });
    };

    const getPublishedByIds: CmsEntryStorageOperations["getPublishedByIds"] = async (
        initialModel,
        params
    ) => {
        const model = getStorageOperationsModel(initialModel);

        const entries = await dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: params.ids
        });

        return entries.map(entry => {
            return convertEntryKeysFromStorage({
                model,
                entry
            });
        });
    };

    const getPreviousRevision: CmsEntryStorageOperations["getPreviousRevision"] = async (
        initialModel,
        params
    ) => {
        const model = getStorageOperationsModel(initialModel);

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
                        eq: createRecordType()
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
            return convertEntryKeysFromStorage({
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

    const getUniqueFieldValues: CmsEntryStorageOperations["getUniqueFieldValues"] = async (
        model,
        params
    ) => {
        const { where, fieldId } = params;

        const { index } = configurations.es({
            model
        });

        const initialBody = createElasticsearchBody({
            model,
            params: {
                limit: 1,
                where
            },
            plugins
        });

        const field = model.fields.find(f => f.fieldId === fieldId);
        if (!field) {
            throw new WebinyError(
                `Could not find field with given "fieldId" value.`,
                "FIELD_NOT_FOUND",
                {
                    fieldId
                }
            );
        }

        const body: ElasticsearchSearchBody = {
            ...initialBody,
            /**
             * We do not need any hits returned, we only need the aggregations.
             */
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

        let response: ElasticsearchSearchResponse<string> | undefined = undefined;

        try {
            response = await elasticsearch.search({
                index,
                body
            });
        } catch (ex) {
            if (ex.message === "index_not_found_exception") {
                return [];
            }
            throw new WebinyError(
                ex.message || "Error in the Elasticsearch query.",
                ex.code || "ELASTICSEARCH_ERROR",
                {
                    error: ex,
                    index,
                    model,
                    body
                }
            );
        }

        const buckets = response.body.aggregations["getUniqueFieldValues"]?.buckets || [];
        return buckets.map(file => {
            return {
                value: file.key,
                count: file.doc_count
            };
        });
    };

    return {
        create,
        createRevisionFrom,
        update,
        move,
        delete: deleteEntry,
        deleteRevision,
        deleteMultipleEntries,
        get,
        publish,
        unpublish,
        list,
        getLatestRevisionByEntryId,
        getPublishedRevisionByEntryId,
        getRevisionById,
        getRevisions,
        getByIds,
        getLatestByIds,
        getPublishedByIds,
        getPreviousRevision,
        getUniqueFieldValues,
        dataLoaders
    };
};
