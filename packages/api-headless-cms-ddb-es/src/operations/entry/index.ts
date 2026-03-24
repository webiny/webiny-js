import WebinyError from "@webiny/error";
import type {
    CmsEntry,
    CmsEntryStorageOperationsCreateParams,
    CmsEntryStorageOperationsCreateRevisionFromParams,
    CmsEntryStorageOperationsDeleteEntriesParams,
    CmsEntryStorageOperationsDeleteParams,
    CmsEntryStorageOperationsDeleteRevisionParams,
    CmsEntryStorageOperationsGetByIdsParams,
    CmsEntryStorageOperationsGetLatestByIdsParams,
    CmsEntryStorageOperationsGetLatestRevisionParams,
    CmsEntryStorageOperationsGetParams,
    CmsEntryStorageOperationsGetPreviousRevisionParams,
    CmsEntryStorageOperationsGetPublishedByIdsParams,
    CmsEntryStorageOperationsGetPublishedRevisionParams,
    CmsEntryStorageOperationsGetRevisionParams,
    CmsEntryStorageOperationsGetRevisionsParams,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsMoveToBinParams,
    CmsEntryStorageOperationsPublishParams,
    CmsEntryStorageOperationsRestoreFromBinParams,
    CmsEntryStorageOperationsUnpublishParams,
    CmsEntryStorageOperationsUpdateParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { CONTENT_ENTRY_STATUS } from "@webiny/api-headless-cms/types/index.js";
import { extractEntriesFromIndex } from "~/helpers/index.js";
import { configurations } from "~/configurations.js";
import type { Client } from "@webiny/api-opensearch";
import type { PluginsContainer } from "@webiny/plugins";
import type { IEntityQueryAllParams } from "@webiny/db-dynamodb";
import { DataLoadersHandler } from "./dataLoaders.js";
import {
    createEntryLatestKeys,
    createEntryPublishedKeys,
    createEntryRevisionKeys,
    createLatestSortKey,
    createPartitionKey,
    createPublishedSortKey,
    createRevisionSortKey
} from "./keys.js";
import {
    compress,
    createLimit,
    decodeCursor,
    decompress,
    encodeCursor,
    type IOpenSearchEntity as IElasticsearchEntity,
    type IOpenSearchEntityAttributes as IElasticsearchEntityAttributes
} from "@webiny/api-opensearch";
import type {
    OpenSearchSearchResponse,
    SearchBody as OpenSearchSearchBody
} from "@webiny/api-opensearch/types.js";
import type { CmsEntryStorageOperations, CmsIndexEntry } from "~/types.js";
import { createElasticsearchBody } from "./elasticsearch/body.js";
import { shouldIgnoreEsResponseError } from "./elasticsearch/shouldIgnoreEsResponseError.js";
import { StorageOperationsCmsModelPlugin } from "@webiny/api-headless-cms";
import { createTransformer } from "./transformations/index.js";
import { convertEntryKeysFromStorage } from "./transformations/convertEntryKeys.js";
import {
    isDeletedEntryMetaField,
    isEntryLevelEntryMetaField,
    isRestoredEntryMetaField,
    pickEntryMetaFields
} from "@webiny/api-headless-cms/constants.js";
import type { IEntryEntity, IEntryEntityAttributes } from "~/definitions/types.js";

export interface CreateEntriesStorageOperationsParams {
    entity: IEntryEntity;
    esEntity: IElasticsearchEntity;
    elasticsearch: Client;
    plugins: PluginsContainer;
}

interface ConvertStorageEntryParams<T extends CmsEntryValues = CmsEntryValues> {
    storageEntry: CmsStorageEntry<T>;
    model: StorageOperationsCmsModel<T>;
}

const convertToStorageEntry = <T extends CmsEntryValues = CmsEntryValues>(
    params: ConvertStorageEntryParams<T>
): CmsStorageEntry<T> => {
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

    const getStorageOperationsModel = <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel
    ): StorageOperationsCmsModel<T> => {
        const plugin = getStorageOperationsCmsModelPlugin();
        return plugin.getModel(model) as StorageOperationsCmsModel<T>;
    };

    const dataLoaders = new DataLoadersHandler({
        entity
    });

    const create = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsCreateParams<T>
    ): Promise<CmsEntry<T>> => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;

        const model = getStorageOperationsModel<T>(initialModel);

        const isPublished = initialEntry.status === "published";
        const locked = isPublished ? true : initialEntry.locked;

        initialEntry.locked = locked;
        initialStorageEntry.locked = locked;

        const transformer = createTransformer<T>({
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

        const revisionKeys = createEntryRevisionKeys(entry);
        const latestKeys = createEntryLatestKeys(entry);
        const publishedKeys = createEntryPublishedKeys(entry);

        const entityBatch = entity.createEntityWriter({
            put: [
                {
                    ...revisionKeys,
                    data: {
                        ...storageEntry,
                        locked
                    }
                },
                {
                    ...latestKeys,
                    data: {
                        ...storageEntry,
                        locked
                    }
                }
            ]
        });

        if (isPublished) {
            entityBatch.put({
                ...publishedKeys,
                data: {
                    ...storageEntry,
                    locked
                }
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

        const elasticsearchEntityBatch = esEntity.createEntityWriter({
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

    const createRevisionFrom = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams<T>
    ): Promise<CmsEntry<T>> => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel<T>(initialModel);

        const transformer = createTransformer<T>({
            plugins,
            model,
            entry: initialEntry,
            storageEntry: initialStorageEntry
        });
        const { entry, storageEntry } = transformer.transformEntryKeys();

        const revisionKeys = createEntryRevisionKeys(entry);
        const latestKeys = createEntryLatestKeys(entry);
        const publishedKeys = createEntryPublishedKeys(entry);

        // We'll need this flag below.
        const isPublished = entry.status === "published";

        const esLatestData = await transformer.getElasticsearchLatestEntryData();

        const entityBatch = entity.createEntityWriter({
            put: [
                {
                    ...revisionKeys,
                    data: storageEntry
                },
                {
                    ...latestKeys,
                    data: storageEntry
                }
            ]
        });

        if (isPublished) {
            entityBatch.put({
                ...publishedKeys,
                data: storageEntry
            });

            // Unpublish previously published revision (if any).
            const [publishedRevisionStorageEntry] = await dataLoaders.getPublishedRevisionByEntryId(
                {
                    model,
                    ids: [entry.id]
                }
            );

            if (publishedRevisionStorageEntry) {
                const publishedRevisionKey = createEntryRevisionKeys(publishedRevisionStorageEntry);
                entityBatch.put({
                    ...publishedRevisionKey,
                    data: {
                        ...publishedRevisionStorageEntry,
                        status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                    }
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

        const elasticsearchEntityBatch = esEntity.createEntityWriter({
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

    const update = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ): Promise<CmsEntry<T>> => {
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

        const revisionKeys = createEntryRevisionKeys(entry);
        const latestKeys = createEntryLatestKeys(entry);
        const publishedKeys = createEntryPublishedKeys(entry);

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

        const entityBatch = entity.createEntityWriter({
            put: [
                {
                    ...revisionKeys,
                    data: {
                        ...storageEntry,
                        locked
                    }
                }
            ]
        });

        if (isPublished) {
            entityBatch.put({
                ...publishedKeys,
                data: {
                    ...storageEntry,
                    locked
                }
            });
        }

        const elasticsearchEntityBatch = esEntity.createEntityWriter();

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
                    ...latestKeys,
                    data: storageEntry
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

                const updatedLatestStorageEntry: IEntryEntityAttributes = {
                    ...latestKeys,
                    data: {
                        ...latestStorageEntry,
                        ...updatedEntryLevelMetaFields
                    }
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
                        tenant: model.tenant
                    }),
                    SK: createRevisionSortKey(latestStorageEntry)
                });

                entityBatch.put({
                    ...updatedLatestStorageEntry
                });

                /**
                 * Update the Elasticsearch table to propagate changes to the Elasticsearch.
                 */
                const latestEsEntry = await esEntity.getClean(latestKeys);

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

    const move: CmsEntryStorageOperations["move"] = async (
        initialModel: CmsModel,
        id: string,
        folderId: string
    ) => {
        const model = getStorageOperationsModel(initialModel);

        const partitionKey = createPartitionKey({
            id,
            tenant: model.tenant
        });
        /**
         * First we need to fetch all the records in the regular DynamoDB table.
         */
        const queryAllParams: IEntityQueryAllParams = {
            partitionKey,
            options: {
                gte: " "
            }
        };
        const latestSortKey = createLatestSortKey();
        const publishedSortKey = createPublishedSortKey();
        const records = await entity.queryAll(queryAllParams);
        /**
         * Then update the folderId in each record and prepare it to be stored.
         */
        let latestRecord: CmsEntry | undefined = undefined;
        let publishedRecord: CmsEntry | undefined = undefined;
        const entityBatch = entity.createEntityWriter();

        for (const record of records) {
            entityBatch.put({
                ...record,
                data: {
                    ...record.data,
                    location: {
                        ...record.data.location,
                        folderId
                    }
                }
            });

            /**
             * We need to get the published and latest records, so we can update the Elasticsearch.
             */
            if (record.SK === publishedSortKey) {
                publishedRecord = record.data;
            } else if (record.SK === latestSortKey) {
                latestRecord = record.data;
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

        const esEntityReader = esEntity.createEntityReader();

        if (publishedRecord) {
            esEntityReader.get({
                PK: partitionKey,
                SK: publishedSortKey
            });
        }
        if (latestRecord) {
            esEntityReader.get({
                PK: partitionKey,
                SK: latestSortKey
            });
        }
        if (esEntityReader.total === 0) {
            return;
        }
        const esRecords = await esEntityReader.execute();

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
        ).filter((item): item is IElasticsearchEntityAttributes => !!item);

        if (esItems.length === 0) {
            return;
        }

        try {
            const elasticsearchEntityBatch = esEntity.createEntityWriter({
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

    const moveToBin: CmsEntryStorageOperations["moveToBin"] = async (
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsMoveToBinParams
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

        const partitionKey = createPartitionKey({
            id: entry.id,
            tenant: model.tenant
        });

        /**
         * First we need to fetch all the records in the regular DynamoDB table.
         */
        const queryAllParams: IEntityQueryAllParams = {
            partitionKey,
            options: {
                gte: " "
            }
        };

        const latestSortKey = createLatestSortKey();
        const publishedSortKey = createPublishedSortKey();
        const records = await entity.queryAll(queryAllParams);

        /**
         * Let's pick the `deleted` meta fields from the entry.
         */
        const updatedEntryMetaFields = pickEntryMetaFields(entry, isDeletedEntryMetaField);

        /**
         * Then update all the records with data received.
         */
        let latestRecord: CmsEntry | undefined = undefined;
        let publishedRecord: CmsEntry | undefined = undefined;

        const entityBatch = entity.createEntityWriter();

        for (const record of records) {
            entityBatch.put({
                ...record,
                data: {
                    ...record.data,
                    ...updatedEntryMetaFields,
                    wbyDeleted: storageEntry.wbyDeleted,
                    location: storageEntry.location,
                    binOriginalFolderId: storageEntry.binOriginalFolderId
                }
            });

            /**
             * We need to get the published and latest records, so we can update the Elasticsearch.
             */
            if (record.SK === publishedSortKey) {
                publishedRecord = record.data;
            } else if (record.SK === latestSortKey) {
                latestRecord = record.data;
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
        const esEntityReader = esEntity.createEntityReader();
        if (publishedRecord) {
            esEntityReader.get({
                PK: partitionKey,
                SK: publishedSortKey
            });
        }
        if (latestRecord) {
            esEntityReader.get({
                PK: partitionKey,
                SK: latestSortKey
            });
        }
        if (esEntityReader.total === 0) {
            return;
        }

        const esRecords = await esEntityReader.execute();

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
        ).filter((item): item is IElasticsearchEntityAttributes => !!item);

        if (esItems.length === 0) {
            return;
        }

        /**
         * We update all ES records with data received.
         */
        const elasticsearchEntityBatch = esEntity.createEntityWriter();

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

    const restoreFromBin = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsRestoreFromBinParams<T>
    ): Promise<CmsEntry<T>> => {
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
            tenant: model.tenant
        });

        /**
         * First we need to fetch all the records in the regular DynamoDB table.
         */
        const queryAllParams: IEntityQueryAllParams = {
            partitionKey,
            options: {
                gte: " "
            }
        };

        const latestSortKey = createLatestSortKey();
        const publishedSortKey = createPublishedSortKey();
        const records = await entity.queryAll(queryAllParams);

        /**
         * Then update all the records with data received.
         */
        let latestRecord: CmsEntry | undefined = undefined;
        let publishedRecord: CmsEntry | undefined = undefined;

        const entityBatch = entity.createEntityWriter();

        for (const record of records) {
            entityBatch.put({
                ...record,
                data: {
                    ...record.data,
                    ...updatedEntryMetaFields,
                    wbyDeleted: storageEntry.wbyDeleted,
                    location: storageEntry.location,
                    binOriginalFolderId: storageEntry.binOriginalFolderId
                }
            });

            /**
             * We need to get the published and latest records, so we can update the Elasticsearch.
             */
            if (record.SK === publishedSortKey) {
                publishedRecord = record.data;
            } else if (record.SK === latestSortKey) {
                latestRecord = record.data;
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
        const esEntityReader = esEntity.createEntityReader();
        if (publishedRecord) {
            esEntityReader.get({
                PK: partitionKey,
                SK: publishedSortKey
            });
        }
        if (latestRecord) {
            esEntityReader.get({
                PK: partitionKey,
                SK: latestSortKey
            });
        }

        const esRecords = await esEntityReader.execute();

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
        ).filter((item): item is IElasticsearchEntityAttributes => !!item);

        if (esItems.length === 0) {
            return initialStorageEntry;
        }

        /**
         * We update all ES records with data received.
         */
        const elasticsearchEntityBatch = esEntity.createEntityWriter();
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

    const deleteEntry: CmsEntryStorageOperations["delete"] = async (
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsDeleteParams
    ) => {
        const { entry } = params;
        const id = entry.id || entry.entryId;
        const model = getStorageOperationsModel(initialModel);

        const partitionKey = createPartitionKey({
            id,
            tenant: model.tenant
        });

        const items = await entity.queryAll({
            partitionKey,
            options: {
                gte: " "
            }
        });

        const esItems = await esEntity.queryAll({
            partitionKey,
            options: {
                gte: " "
            }
        });

        const entityBatch = entity.createEntityWriter({
            delete: items.map(item => {
                return {
                    PK: item.PK,
                    SK: item.SK
                };
            })
        });

        const elasticsearchEntityBatch = esEntity.createEntityWriter({
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

    const deleteRevision = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams<T>
    ): Promise<void> => {
        const { entry, latestEntry, latestStorageEntry: initialLatestStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        const partitionKey = createPartitionKey({
            id: entry.id,
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
        const entityBatch = entity.createEntityWriter({
            delete: [
                {
                    PK: partitionKey,
                    SK: createRevisionSortKey(entry)
                }
            ]
        });

        const elasticsearchEntityBatch = esEntity.createEntityWriter();

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
            const latestStorageEntryLatestKey = createEntryLatestKeys(latestStorageEntry);
            entityBatch.put({
                ...latestStorageEntryLatestKey,
                data: latestStorageEntry
            });

            /**
             * Also perform an update on the actual revision. This is needed
             * because of updates on the entry-level meta fields.
             */
            const actualRevisionEntryKey = createEntryRevisionKeys(initialLatestStorageEntry);
            entityBatch.put({
                ...actualRevisionEntryKey,
                data: latestStorageEntry
            });

            const latestTransformer = createTransformer({
                plugins,
                model,
                entry: latestEntry,
                storageEntry: initialLatestStorageEntry
            });

            const esLatestData = await latestTransformer.getElasticsearchLatestEntryData();

            const esLatestKeys = createEntryLatestKeys(latestEntry);
            elasticsearchEntityBatch.put({
                ...esLatestKeys,
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
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsDeleteEntriesParams
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

        const entityBatch = entity.createEntityWriter();
        const elasticsearchEntityBatch = esEntity.createEntityWriter();
        for (const id of entries) {
            /**
             * Latest item.
             */
            entityBatch.delete({
                PK: createPartitionKey({
                    id,
                    tenant: model.tenant
                }),
                SK: "L"
            });

            elasticsearchEntityBatch.delete({
                PK: createPartitionKey({
                    id,
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
                    tenant: model.tenant
                }),
                SK: "P"
            });

            elasticsearchEntityBatch.delete({
                PK: createPartitionKey({
                    id,
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

    const list = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

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

        let response: OpenSearchSearchResponse<CmsIndexEntry>;
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
                return {
                    hasMoreItems: false,
                    totalCount: 0,
                    cursor: null,
                    items: []
                };
            }

            throw new WebinyError(error.message, error.code || "OPENSEARCH_ERROR", {
                error,
                index,
                body,
                model
            });
        }

        const { hits, total } = response?.body?.hits || {};

        const items = extractEntriesFromIndex<T>({
            plugins,
            model,
            entries: hits.map(item => {
                return item._source as unknown as CmsIndexEntry<T>;
            })
        }).map(item => {
            return convertEntryKeysFromStorage<T>({
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

    const get = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const { items } = await list<T>(model, {
            ...params,
            limit: 1
        });
        return items.shift() || null;
    };

    const publish = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsPublishParams<T>
    ): Promise<CmsEntry<T>> => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel(initialModel);

        const transformer = createTransformer({
            plugins,
            model,
            entry: initialEntry,
            storageEntry: initialStorageEntry
        });

        const { entry, storageEntry } = transformer.transformEntryKeys();

        const revisionKeys = createEntryRevisionKeys(entry);
        const latestKeys = createEntryLatestKeys(entry);
        const publishedKeys = createEntryPublishedKeys(entry);

        let latestEsEntry: IElasticsearchEntityAttributes | null = null;
        try {
            latestEsEntry = await esEntity.getClean(latestKeys);
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
        const entityBatch = entity.createEntityWriter({
            put: [
                {
                    ...revisionKeys,
                    data: storageEntry
                },
                {
                    ...publishedKeys,
                    data: storageEntry
                }
            ]
        });

        const elasticsearchEntityWriter = esEntity.createEntityWriter();

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
                ...latestKeys,
                data: storageEntry
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
                    const publishedStorageEntryKeys =
                        createEntryRevisionKeys(publishedStorageEntry);
                    entityBatch.put({
                        ...publishedStorageEntryKeys,
                        data: {
                            ...publishedStorageEntry,
                            status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                        }
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

            const latestStorageEntryLatestKeys = createEntryLatestKeys(latestStorageEntry);
            entityBatch.put({
                ...latestStorageEntryLatestKeys,
                data: latestStorageEntryFields
            });

            // 2.5 Update REV# record.
            const latestStorageEntryRevisionKeys = createEntryRevisionKeys(latestStorageEntry);
            entityBatch.put({
                ...latestStorageEntryRevisionKeys,
                data: latestStorageEntryFields
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
                    const publishedStorageEntryRevisionKeys =
                        createEntryRevisionKeys(publishedStorageEntry);
                    entityBatch.put({
                        ...publishedStorageEntryRevisionKeys,
                        data: {
                            ...publishedStorageEntry,
                            status: CONTENT_ENTRY_STATUS.UNPUBLISHED
                        }
                    });
                }
            }
        }

        // 3. Update records in ES -> DDB table.

        /**
         * Update the published revision entry in ES.
         */
        const esPublishedData = await transformer.getElasticsearchPublishedEntryData();
        elasticsearchEntityWriter.put({
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

            const esEntryLatestKeys = createEntryLatestKeys(latestEsEntryDataDecompressed);
            elasticsearchEntityWriter.put({
                index: esIndex,
                data: await latestTransformer.getElasticsearchLatestEntryData(),
                ...esEntryLatestKeys
            });
        } else {
            const updatedEntryLevelMetaFields = pickEntryMetaFields(
                entry,
                isEntryLevelEntryMetaField
            );

            /**
             * Update the Elasticsearch table to propagate changes to the Elasticsearch.
             */
            const latestEsEntry = await esEntity.getClean(latestKeys);

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

                elasticsearchEntityWriter.put({
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
            await elasticsearchEntityWriter.execute();
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

    const unpublish = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsUnpublishParams<T>
    ): Promise<CmsEntry<T>> => {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;
        const model = getStorageOperationsModel<T>(initialModel);

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
            tenant: model.tenant
        });

        const entryRevisionKeys = createEntryRevisionKeys(entry);

        const entityBatch = entity.createEntityWriter({
            put: [
                {
                    ...entryRevisionKeys,
                    data: storageEntry
                }
            ],
            delete: [
                {
                    PK: partitionKey,
                    SK: createPublishedSortKey()
                }
            ]
        });

        const elasticsearchEntityBatch = esEntity.createEntityWriter({
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

            const entryLatestKeys = createEntryLatestKeys(storageEntry);
            entityBatch.put({
                ...entryLatestKeys,
                data: storageEntry
            });

            const esLatestData = await transformer.getElasticsearchLatestEntryData();

            elasticsearchEntityBatch.put({
                index,
                data: esLatestData,
                ...entryLatestKeys
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

    const getLatestRevisionByEntryId = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const [entry] = await dataLoaders.getLatestRevisionByEntryId<T>({
            model,
            ids: [params.id]
        });
        if (!entry) {
            return null;
        }
        return convertEntryKeysFromStorage<T>({
            model,
            entry
        });
    };

    const getPublishedRevisionByEntryId = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedRevisionParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const [entry] = await dataLoaders.getPublishedRevisionByEntryId<T>({
            model,
            ids: [params.id]
        });
        if (!entry) {
            return null;
        }
        return convertEntryKeysFromStorage<T>({
            model,
            entry
        });
    };

    const getRevisionById = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const [entry] = await dataLoaders.getRevisionById<T>({
            model,
            ids: [params.id]
        });
        if (!entry) {
            return null;
        }
        return convertEntryKeysFromStorage<T>({
            model,
            entry
        });
    };

    const getRevisions = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionsParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const entries = await dataLoaders.getAllEntryRevisions<T>({
            model,
            ids: [params.id]
        });

        return entries.map(entry => {
            return convertEntryKeysFromStorage<T>({
                model,
                entry
            });
        });
    };

    const getByIds = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetByIdsParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const entries = await dataLoaders.getRevisionById<T>({
            model,
            ids: params.ids
        });

        return entries.map(entry => {
            return convertEntryKeysFromStorage<T>({
                model,
                entry
            });
        });
    };

    const getLatestByIds = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetLatestByIdsParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const entries = await dataLoaders.getLatestRevisionByEntryId<T>({
            model,
            ids: params.ids
        });
        return entries.map(entry => {
            return convertEntryKeysFromStorage<T>({
                model,
                entry
            });
        });
    };

    const getPublishedByIds = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const entries = await dataLoaders.getPublishedRevisionByEntryId<T>({
            model,
            ids: params.ids
        });

        return entries.map(entry => {
            return convertEntryKeysFromStorage<T>({
                model,
                entry
            });
        });
    };

    const getPreviousRevision = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ) => {
        const model = getStorageOperationsModel<T>(initialModel);

        const { tenant } = model;
        const { entryId, version } = params;

        const partitionKey = createPartitionKey({
            tenant,
            id: entryId
        });
        const options: IEntityQueryAllParams["options"] = {
            beginsWith: `REV#`,
            reverse: true
        };

        try {
            const unfilteredEntries = (
                await entity.queryAll({
                    partitionKey,
                    options
                })
            ).map(item => {
                return item.data;
            });

            const entries = unfilteredEntries.filter(item => {
                return item.version < version;
            });

            const entry = entries[0];

            if (!entry) {
                return null;
            }
            return convertEntryKeysFromStorage<T>({
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
                    partitionKey,
                    options,
                    model
                }
            );
        }
    };

    const getUniqueFieldValues = async (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetUniqueFieldValuesParams
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

        const body: OpenSearchSearchBody = {
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

        let response: OpenSearchSearchResponse<string> | undefined = undefined;

        try {
            response = await elasticsearch.search({
                index,
                body
            });
        } catch (error) {
            if (shouldIgnoreEsResponseError(error)) {
                return [];
            }

            throw new WebinyError(
                error.message || "Error in the Elasticsearch query.",
                error.code || "OPENSEARCH_ERROR",
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
