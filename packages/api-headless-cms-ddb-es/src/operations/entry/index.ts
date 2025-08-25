import WebinyError from "@webiny/error";
import type {
    CmsEntry,
    CmsModel,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types";
import { CONTENT_ENTRY_STATUS } from "@webiny/api-headless-cms/types";
import { extractEntriesFromIndex } from "~/helpers";
import { configurations } from "~/configurations";
import type { Entity } from "@webiny/db-dynamodb/toolbox";
import type { Client } from "@elastic/elasticsearch";
import type { PluginsContainer } from "@webiny/plugins";
import type { BatchReadItem, QueryAllParams, QueryOneParams } from "@webiny/db-dynamodb";
import {
    batchReadAll,
    cleanupItem,
    createEntityWriteBatch,
    getClean,
    queryAll,
    queryOne
} from "@webiny/db-dynamodb";
import { DataLoadersHandler } from "./dataLoaders";
import {
    createLatestSortKey,
    createPartitionKey,
    createPublishedSortKey,
    createRevisionSortKey
} from "./keys";
import {
    compress,
    createLimit,
    decodeCursor,
    decompress,
    encodeCursor
} from "@webiny/api-elasticsearch";
import { zeroPad } from "@webiny/utils";
import type {
    ElasticsearchSearchResponse,
    SearchBody as ElasticsearchSearchBody
} from "@webiny/api-elasticsearch/types";
import type { CmsEntryStorageOperations, CmsIndexEntry } from "~/types";
import { createElasticsearchBody } from "./elasticsearch/body";
import { logIgnoredEsResponseError } from "./elasticsearch/logIgnoredEsResponseError";
import { shouldIgnoreEsResponseError } from "./elasticsearch/shouldIgnoreEsResponseError";
import { createLatestRecordType, createPublishedRecordType, createRecordType } from "./recordType";
import { StorageOperationsCmsModelPlugin } from "@webiny/api-headless-cms";
import { createTransformer } from "./transformations";
import { convertEntryKeysFromStorage } from "./transformations/convertEntryKeys";
import {
    isDeletedEntryMetaField,
    isEntryLevelEntryMetaField,
    isRestoredEntryMetaField,
    pickEntryMetaFields
} from "@webiny/api-headless-cms/constants";

interface ElasticsearchDbRecord {
    PK: string;
    SK: string;
    TYPE: string;
    index: string;
    data: Record<string, any>;
}

export interface CreateEntriesStorageOperationsParams {
    entity: Entity<any>;
    esEntity: Entity<any>;
    elasticsearch: Client;
    plugins: PluginsContainer;
}

interface ConvertStorageEntryParams {
    storageEntry: CmsStorageEntry;
    model: StorageOperationsCmsModel;
}

const convertToStorageEntry = (params: ConvertStorageEntryParams): CmsStorageEntry => {
    const { model, storageEntry } = params;

    const values = model.convertValueKeyToStorage({
        fields: model.fields,
        values: storageEntry.values
    });
    return {
        ...storageEntry,
        values
    };
};

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

        const entityBatch = createEntityWriteBatch({
            entity,
            put: [
                {
                    ...storageEntry,
                    locked,
                    ...revisionKeys,
                    TYPE: createRecordType()
                },
                {
                    ...storageEntry,
                    locked,
                    ...latestKeys,
                    TYPE: createLatestRecordType()
                }
            ]
        });

        if (isPublished) {
            entityBatch.put({
                ...storageEntry,
                locked,
                ...publishedKeys,
                TYPE: createPublishedRecordType()
            });
        }

        try {
            await entityBatch.execute();
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

        const elasticsearchEntityBatch = createEntityWriteBatch({
            entity: esEntity,
            put: [
                {
                    ...latestKeys,
                    index: esIndex,
                    data: esLatestData
                }
            ]
        });

        if (isPublished) {
            const esPublishedData = await transformer.getElasticsearchPublishedEntryData();
            elasticsearchEntityBatch.put({
                ...publishedKeys,
                index: esIndex,
                data: esPublishedData
            });
        }

        try {
            await elasticsearchEntityBatch.execute();
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

        const publishedKeys = {
            PK: createPartitionKey({
                id: entry.id,
                locale: model.locale,
                tenant: model.tenant
            }),
            SK: createPublishedSortKey()
        };

        // We'll need this flag below.
        const isPublished = entry.status === "published";

        const esLatestData = await transformer.getElasticsearchLatestEntryData();

        const entityBatch = createEntityWriteBatch({
            entity,
            put: [
                {
                    ...storageEntry,
                    TYPE: createRecordType(),
                    ...revisionKeys
                },
                {
                    ...storageEntry,
                    TYPE: createLatestRecordType(),
                    ...latestKeys
                }
            ]
        });

        if (isPublished) {
            entityBatch.put({
                ...storageEntry,
                TYPE: createPublishedRecordType(),
                ...publishedKeys
            });

            // Unpublish previously published revision (if any).
            const [publishedRevisionStorageEntry] = await dataLoaders.getPublishedRevisionByEntryId(
                {
                    model,
                    ids: [entry.id]
                }
            );

            if (publishedRevisionStorageEntry) {
                entityBatch.put({
                    ...publishedRevisionStorageEntry,
                    PK: createPartitionKey({
                        id: publishedRevisionStorageEntry.id,
                        locale: model.locale,
                        tenant: model.tenant
                    }),
                    SK: createRevisionSortKey(publishedRevisionStorageEntry),
                    TYPE: createRecordType(),
                    status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                });
            }
        }

        try {
            await entityBatch.execute();

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

        const { index: esIndex } = configurations.es({
            model
        });

        const elasticsearchEntityBatch = createEntityWriteBatch({
            entity: esEntity,
            put: [
                {
                    ...latestKeys,
                    index: esIndex,
                    data: esLatestData
                }
            ]
        });

        if (isPublished) {
            const esPublishedData = await transformer.getElasticsearchPublishedEntryData();
            elasticsearchEntityBatch.put({
                ...publishedKeys,
                index: esIndex,
                data: esPublishedData
            });
        }

        try {
            await elasticsearchEntityBatch.execute();
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

        const entityBatch = createEntityWriteBatch({
            entity,
            put: [
                {
                    ...storageEntry,
                    locked,
                    ...revisionKeys,
                    TYPE: createRecordType()
                }
            ]
        });

        if (isPublished) {
            entityBatch.put({
                ...storageEntry,
                locked,
                ...publishedKeys,
                TYPE: createPublishedRecordType()
            });
        }

        const elasticsearchEntityBatch = createEntityWriteBatch({
            entity: esEntity
        });

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
                entityBatch.put({
                    ...storageEntry,
                    ...latestKeys,
                    TYPE: createLatestRecordType()
                });

                /**
                 * And then update the Elasticsearch table to propagate changes to the Elasticsearch
                 */
                const elasticsearchLatestData = await transformer.getElasticsearchLatestEntryData();

                elasticsearchEntityBatch.put({
                    ...latestKeys,
                    index: esIndex,
                    data: elasticsearchLatestData
                });
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
                entityBatch.put({
                    ...updatedLatestStorageEntry,
                    PK: createPartitionKey({
                        id: latestStorageEntry.id,
                        locale: model.locale,
                        tenant: model.tenant
                    }),
                    SK: createRevisionSortKey(latestStorageEntry),
                    TYPE: createRecordType()
                });

                entityBatch.put({
                    ...updatedLatestStorageEntry,
                    TYPE: createLatestRecordType()
                });

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

                    elasticsearchEntityBatch.put({
                        ...latestKeys,
                        index: esIndex,
                        data: updatedLatestEntry
                    });
                }
            }
        }

        if (isPublished && publishedStorageEntry?.id === entry.id) {
            const elasticsearchPublishedData =
                await transformer.getElasticsearchPublishedEntryData();
            elasticsearchEntityBatch.put({
                ...publishedKeys,
                index: esIndex,
                data: elasticsearchPublishedData
            });
        }
        try {
            await entityBatch.execute();

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
        try {
            await elasticsearchEntityBatch.execute();
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
        const entityBatch = createEntityWriteBatch({
            entity
        });

        for (const record of records) {
            entityBatch.put({
                ...record,
                location: {
                    ...record?.location,
                    folderId
                }
            });

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
            await entityBatch.execute();
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

        const elasticsearchEntityBatch = createEntityWriteBatch({
            entity: esEntity,
            put: await Promise.all(
                esItems.map(async item => {
                    return {
                        ...item,
                        data: await compress(plugins, {
                            ...item.data,
                            location: {
                                ...item.data?.location,
                                folderId
                            }
                        })
                    };
                })
            )
        });

        try {
            await elasticsearchEntityBatch.execute();
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

    const moveToBin: CmsEntryStorageOperations["moveToBin"] = async (initialModel, params) => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        const transformer = createTransformer({
            plugins,
            model,
            entry: initialEntry,
            storageEntry: initialStorageEntry
        });

        const { entry, storageEntry } = transformer.transformEntryKeys();

        const partitionKey = createPartitionKey({
            id: entry.id,
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
         * Let's pick the `deleted` meta fields from the entry.
         */
        const updatedEntryMetaFields = pickEntryMetaFields(entry, isDeletedEntryMetaField);

        /**
         * Then update all the records with data received.
         */
        let latestRecord: CmsEntry | undefined = undefined;
        let publishedRecord: CmsEntry | undefined = undefined;

        const entityBatch = createEntityWriteBatch({
            entity
        });

        for (const record of records) {
            entityBatch.put({
                ...record,
                ...updatedEntryMetaFields,
                wbyDeleted: storageEntry.wbyDeleted,
                location: storageEntry.location,
                binOriginalFolderId: storageEntry.binOriginalFolderId
            });

            /**
             * We need to get the published and latest records, so we can update the Elasticsearch.
             */
            if (record.SK === publishedSortKey) {
                publishedRecord = record;
            } else if (record.SK === latestSortKey) {
                latestRecord = record;
            }
        }

        /**
         * We write the records back to the primary DynamoDB table.
         */
        try {
            await entityBatch.execute();

            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could mark as deleted all entry records from in the DynamoDB table.",
                ex.code || "MOVE_ENTRY_TO_BIN_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }

        /**
         * We need to get the published and latest records from Elasticsearch.
         */
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

        /**
         * We update all ES records with data received.
         */
        const elasticsearchEntityBatch = createEntityWriteBatch({
            entity: esEntity
        });

        for (const item of esItems) {
            elasticsearchEntityBatch.put({
                ...item,
                data: await compress(plugins, {
                    ...item.data,
                    ...updatedEntryMetaFields,
                    wbyDeleted: entry.wbyDeleted,
                    location: entry.location,
                    binOriginalFolderId: entry.binOriginalFolderId
                })
            });
        }

        /**
         * We write the records back to the primary DynamoDB Elasticsearch table.
         */
        try {
            await elasticsearchEntityBatch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not mark as deleted entry records from DynamoDB Elasticsearch table.",
                ex.code || "MOVE_ENTRY_TO_BIN_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }
    };

    const restoreFromBin: CmsEntryStorageOperations["restoreFromBin"] = async (
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

        /**
         * Let's pick the `restored` meta fields from the storage entry.
         */
        const updatedEntryMetaFields = pickEntryMetaFields(entry, isRestoredEntryMetaField);

        const partitionKey = createPartitionKey({
            id: entry.id,
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
         * Then update all the records with data received.
         */
        let latestRecord: CmsEntry | undefined = undefined;
        let publishedRecord: CmsEntry | undefined = undefined;

        const entityBatch = createEntityWriteBatch({
            entity
        });

        for (const record of records) {
            entityBatch.put({
                ...record,
                ...updatedEntryMetaFields,
                wbyDeleted: storageEntry.wbyDeleted,
                location: storageEntry.location,
                binOriginalFolderId: storageEntry.binOriginalFolderId
            });

            /**
             * We need to get the published and latest records, so we can update the Elasticsearch.
             */
            if (record.SK === publishedSortKey) {
                publishedRecord = record;
            } else if (record.SK === latestSortKey) {
                latestRecord = record;
            }
        }

        /**
         * We write the records back to the primary DynamoDB table.
         */
        try {
            await entityBatch.execute();

            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not restore all entry records from in the DynamoDB table.",
                ex.code || "RESTORE_ENTRY_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }

        /**
         * We need to get the published and latest records from Elasticsearch.
         */
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
            return initialStorageEntry;
        }

        /**
         * We update all ES records with data received.
         */
        const elasticsearchEntityBatch = createEntityWriteBatch({
            entity: esEntity
        });
        for (const item of esItems) {
            elasticsearchEntityBatch.put({
                ...item,
                data: await compress(plugins, {
                    ...item.data,
                    ...updatedEntryMetaFields,
                    wbyDeleted: entry.wbyDeleted,
                    location: entry.location,
                    binOriginalFolderId: entry.binOriginalFolderId
                })
            });
        }

        /**
         * We write the records back to the primary DynamoDB Elasticsearch table.
         */
        try {
            await elasticsearchEntityBatch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not restore entry records from DynamoDB Elasticsearch table.",
                ex.code || "RESTORE_ENTRY_ERROR",
                {
                    error: ex,
                    entry,
                    storageEntry
                }
            );
        }

        return initialStorageEntry;
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

        const entityBatch = createEntityWriteBatch({
            entity,
            delete: items.map(item => {
                return {
                    PK: item.PK,
                    SK: item.SK
                };
            })
        });

        const elasticsearchEntityBatch = createEntityWriteBatch({
            entity: esEntity,
            delete: esItems.map(item => {
                return {
                    PK: item.PK,
                    SK: item.SK
                };
            })
        });

        try {
            await entityBatch.execute();

            dataLoaders.clearAll({
                model
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not destroy entry records from DynamoDB table.",
                ex.code || "DELETE_ENTRY_ERROR",
                {
                    error: ex,
                    id
                }
            );
        }

        try {
            await elasticsearchEntityBatch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not destroy entry records from DynamoDB Elasticsearch table.",
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
        const { entry, latestEntry, latestStorageEntry: initialLatestStorageEntry } = params;
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
        const entityBatch = createEntityWriteBatch({
            entity,
            delete: [
                {
                    PK: partitionKey,
                    SK: createRevisionSortKey(entry)
                }
            ]
        });

        const elasticsearchEntityBatch = createEntityWriteBatch({
            entity: esEntity
        });

        /**
         * If revision we are deleting is the published one as well, we need to delete those records as well.
         */
        if (publishedStorageEntry?.id === entry.id) {
            entityBatch.delete({
                PK: partitionKey,
                SK: createPublishedSortKey()
            });

            elasticsearchEntityBatch.delete({
                PK: partitionKey,
                SK: createPublishedSortKey()
            });
        }

        if (latestEntry && initialLatestStorageEntry) {
            const latestStorageEntry = convertToStorageEntry({
                storageEntry: initialLatestStorageEntry,
                model
            });

            /**
             * In the end we need to set the new latest entry.
             */
            entityBatch.put({
                ...latestStorageEntry,
                PK: partitionKey,
                SK: createLatestSortKey(),
                TYPE: createLatestRecordType()
            });

            /**
             * Also perform an update on the actual revision. This is needed
             * because of updates on the entry-level meta fields.
             */
            entityBatch.put({
                ...latestStorageEntry,
                PK: createPartitionKey({
                    id: initialLatestStorageEntry.id,
                    locale: model.locale,
                    tenant: model.tenant
                }),
                SK: createRevisionSortKey(initialLatestStorageEntry),
                TYPE: createRecordType()
            });

            const latestTransformer = createTransformer({
                plugins,
                model,
                entry: latestEntry,
                storageEntry: initialLatestStorageEntry
            });

            const esLatestData = await latestTransformer.getElasticsearchLatestEntryData();
            elasticsearchEntityBatch.put({
                PK: partitionKey,
                SK: createLatestSortKey(),
                index,
                data: esLatestData
            });
        }

        try {
            await entityBatch.execute();

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
                    initialLatestStorageEntry
                }
            );
        }

        try {
            await elasticsearchEntityBatch.execute();
        } catch (ex) {
            throw new WebinyError(
                ex.message ||
                    "Could not batch write entry records to DynamoDB Elasticsearch table.",
                ex.code || "DELETE_REVISION_ERROR",
                {
                    error: ex,
                    entry,
                    latestEntry,
                    initialLatestStorageEntry
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
         * First we need all the revisions of the entries we want to delete.
         */
        const revisions = await dataLoaders.getAllEntryRevisions({
            model,
            ids: entries
        });
        /**
         * Then we need to construct the queries for all the revisions and entries.
         */

        const entityBatch = createEntityWriteBatch({
            entity
        });
        const elasticsearchEntityBatch = createEntityWriteBatch({
            entity: esEntity
        });
        for (const id of entries) {
            /**
             * Latest item.
             */
            entityBatch.delete({
                PK: createPartitionKey({
                    id,
                    locale: model.locale,
                    tenant: model.tenant
                }),
                SK: "L"
            });

            elasticsearchEntityBatch.delete({
                PK: createPartitionKey({
                    id,
                    locale: model.locale,
                    tenant: model.tenant
                }),
                SK: "L"
            });

            /**
             * Published item.
             */
            entityBatch.delete({
                PK: createPartitionKey({
                    id,
                    locale: model.locale,
                    tenant: model.tenant
                }),
                SK: "P"
            });

            elasticsearchEntityBatch.delete({
                PK: createPartitionKey({
                    id,
                    locale: model.locale,
                    tenant: model.tenant
                }),
                SK: "P"
            });
        }
        /**
         * Exact revisions of all the entries
         */
        for (const revision of revisions) {
            entityBatch.delete({
                PK: createPartitionKey({
                    id: revision.id,
                    locale: model.locale,
                    tenant: model.tenant
                }),
                SK: createRevisionSortKey({
                    version: revision.version
                })
            });
        }

        await entityBatch.execute();
        await elasticsearchEntityBatch.execute();
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
        } catch (error) {
            /**
             * We will silently ignore the `index_not_found_exception` error and return an empty result set.
             * This is because the index might not exist yet, and we don't want to throw an error.
             */
            if (shouldIgnoreEsResponseError(error)) {
                logIgnoredEsResponseError({
                    error,
                    model,
                    indexName: index
                });

                return {
                    hasMoreItems: false,
                    totalCount: 0,
                    cursor: null,
                    items: []
                };
            }

            throw new WebinyError(error.message, error.code || "ELASTICSEARCH_ERROR", {
                error,
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

        if (!latestEsEntry) {
            throw new WebinyError(
                `Could not publish entry. Could not load latest ("L") record (ES table).`,
                "PUBLISH_ERROR",
                { entry }
            );
        }

        /**
         * We need the latest entry to check if it needs to be updated as well in the Elasticsearch.
         */
        const [latestStorageEntry] = await dataLoaders.getLatestRevisionByEntryId({
            model,
            ids: [entry.id]
        });

        if (!latestStorageEntry) {
            throw new WebinyError(
                `Could not publish entry. Could not load latest ("L") record.`,
                "PUBLISH_ERROR",
                { entry }
            );
        }

        /**
         * We need currently published entry to check if need to remove it.
         */
        const [publishedStorageEntry] = await dataLoaders.getPublishedRevisionByEntryId({
            model,
            ids: [entry.id]
        });

        // 1. Update REV# and P records with new data.
        const entityBatch = createEntityWriteBatch({
            entity,
            put: [
                {
                    ...storageEntry,
                    ...revisionKeys,
                    TYPE: createRecordType()
                },
                {
                    ...storageEntry,
                    ...publishedKeys,
                    TYPE: createPublishedRecordType()
                }
            ]
        });

        const elasticsearchEntityBatch = createEntityWriteBatch({
            entity: esEntity
        });

        const { index: esIndex } = configurations.es({
            model
        });

        // 2. When it comes to the latest record, we need to perform a couple of different
        // updates, based on whether the entry being published is the latest revision or not.
        const publishedRevisionId = publishedStorageEntry?.id;
        const publishingLatestRevision = latestStorageEntry?.id === entry.id;

        if (publishingLatestRevision) {
            // 2.1 If we're publishing the latest revision, we first need to update the L record.
            entityBatch.put({
                ...storageEntry,
                ...latestKeys
            });

            // 2.2 Additionally, if we have a previously published entry, we need to mark it as unpublished.
            //     Note that we need to take re-publishing into account (same published revision being
            //     published again), in which case the below code does not apply. This is because the
            //     required updates were already applied above.
            if (publishedStorageEntry) {
                const isRepublishing = publishedStorageEntry.id === entry.id;
                if (!isRepublishing) {
                    /**
                     * Update currently published entry (unpublish it)
                     */
                    entityBatch.put({
                        ...publishedStorageEntry,
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED,
                        TYPE: createRecordType(),
                        PK: createPartitionKey(publishedStorageEntry),
                        SK: createRevisionSortKey(publishedStorageEntry)
                    });
                }
            }
        } else {
            // 2.3 If the published revision is not the latest one, the situation is a bit
            // more complex. We first need to update the L and REV# records with the new
            // values of *only entry-level* meta fields.
            const updatedEntryLevelMetaFields = pickEntryMetaFields(
                entry,
                isEntryLevelEntryMetaField
            );

            // 2.4 Update L record. Apart from updating the entry-level meta fields, we also need
            //    to change the status from "published" to "unpublished" (if the status is set to "published").
            let latestRevisionStatus = latestStorageEntry.status;
            if (latestRevisionStatus === CONTENT_ENTRY_STATUS.PUBLISHED) {
                latestRevisionStatus = CONTENT_ENTRY_STATUS.UNPUBLISHED;
            }

            const latestStorageEntryFields = {
                ...latestStorageEntry,
                ...updatedEntryLevelMetaFields,
                status: latestRevisionStatus
            };

            entityBatch.put({
                ...latestStorageEntryFields,
                PK: createPartitionKey(latestStorageEntry),
                SK: createLatestSortKey(),
                TYPE: createLatestRecordType()
            });

            // 2.5 Update REV# record.
            entityBatch.put({
                ...latestStorageEntryFields,
                PK: createPartitionKey(latestStorageEntry),
                SK: createRevisionSortKey(latestStorageEntry),
                TYPE: createRecordType()
            });

            // 2.6 Additionally, if we have a previously published entry, we need to mark it as unpublished.
            //     Note that we need to take re-publishing into account (same published revision being
            //     published again), in which case the below code does not apply. This is because the
            //     required updates were already applied above.
            if (publishedStorageEntry) {
                const isRepublishing = publishedStorageEntry.id === entry.id;
                const publishedRevisionDifferentFromLatest =
                    publishedRevisionId !== latestStorageEntry.id;

                if (!isRepublishing && publishedRevisionDifferentFromLatest) {
                    entityBatch.put({
                        ...publishedStorageEntry,
                        PK: createPartitionKey(publishedStorageEntry),
                        SK: createRevisionSortKey(publishedStorageEntry),
                        TYPE: createRecordType(),
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                    });
                }
            }
        }

        // 3. Update records in ES -> DDB table.

        /**
         * Update the published revision entry in ES.
         */
        const esPublishedData = await transformer.getElasticsearchPublishedEntryData();
        elasticsearchEntityBatch.put({
            ...publishedKeys,
            index: esIndex,
            data: esPublishedData
        });

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

            elasticsearchEntityBatch.put({
                index: esIndex,
                PK: createPartitionKey(latestEsEntryDataDecompressed),
                SK: createLatestSortKey(),
                data: await latestTransformer.getElasticsearchLatestEntryData()
            });
        } else {
            const updatedEntryLevelMetaFields = pickEntryMetaFields(
                entry,
                isEntryLevelEntryMetaField
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

                let latestRevisionStatus = latestEsEntryDataDecompressed.status;
                if (latestRevisionStatus === CONTENT_ENTRY_STATUS.PUBLISHED) {
                    latestRevisionStatus = CONTENT_ENTRY_STATUS.UNPUBLISHED;
                }

                const updatedLatestEntry = await compress(plugins, {
                    ...latestEsEntryDataDecompressed,
                    ...updatedEntryLevelMetaFields,
                    status: latestRevisionStatus
                });

                elasticsearchEntityBatch.put({
                    ...latestKeys,
                    index: esIndex,
                    data: updatedLatestEntry
                });
            }
        }

        /**
         * Finally, execute regular table batch.
         */
        try {
            await entityBatch.execute();

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
            await elasticsearchEntityBatch.execute();
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

        const entityBatch = createEntityWriteBatch({
            entity,
            put: [
                {
                    ...storageEntry,
                    PK: partitionKey,
                    SK: createRevisionSortKey(entry),
                    TYPE: createRecordType()
                }
            ],
            delete: [
                {
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                }
            ]
        });

        const elasticsearchEntityBatch = createEntityWriteBatch({
            entity: esEntity,
            delete: [
                {
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                }
            ]
        });

        /**
         * If we are unpublishing the latest revision, let's also update the latest revision entry's status in both DynamoDB tables.
         */
        if (latestStorageEntry?.id === entry.id) {
            const { index } = configurations.es({
                model
            });

            entityBatch.put({
                ...storageEntry,
                PK: partitionKey,
                SK: createLatestSortKey(),
                TYPE: createLatestRecordType()
            });

            const esLatestData = await transformer.getElasticsearchLatestEntryData();
            elasticsearchEntityBatch.put({
                PK: partitionKey,
                SK: createLatestSortKey(),
                index,
                data: esLatestData
            });
        }

        /**
         * Finally, execute regular table batch.
         */
        try {
            await entityBatch.execute();

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
            await elasticsearchEntityBatch.execute();
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
        } catch (error) {
            if (shouldIgnoreEsResponseError(error)) {
                logIgnoredEsResponseError({
                    error,
                    model,
                    indexName: index
                });
                return [];
            }

            throw new WebinyError(
                error.message || "Error in the Elasticsearch query.",
                error.code || "ELASTICSEARCH_ERROR",
                {
                    error,
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
        moveToBin,
        restoreFromBin,
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
