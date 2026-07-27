import WebinyError from "@webiny/error";
import type {
    CmsEntry,
    CmsModel,
    CmsEntryStorageOperationsMoveToBinParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { MoveToBinStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveToBinStorageOperation.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsEntriesEsEntity } from "~/abstractions/CmsDdbEsEntriesEsEntity.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import {
    CmsEntryOpenSearchFieldIndexRegistry,
    CmsEntryOpenSearchValuesModifier
} from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { createTransformer } from "./transformations/index.js";
import { createLatestSortKey, createPartitionKey, createPublishedSortKey } from "./keys.js";
import {
    isDeletedEntryMetaField,
    pickEntryMetaFields
} from "@webiny/api-headless-cms/constants.js";
import type { IOpenSearchEntityAttributes as IElasticsearchEntityAttributes } from "@webiny/api-opensearch";
import type { IEntityQueryAllParams } from "@webiny/db-dynamodb";

class DdbEsMoveToBinImpl implements MoveToBinStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEsEntryEntity.Interface,
        private esEntity: CmsDdbEsEntriesEsEntity.Interface,
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface,
        private compressionHandler: CompressionHandler.Interface,
        private valuesModifiers: CmsEntryOpenSearchValuesModifier.Interface[]
    ) {}

    async execute(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsMoveToBinParams
    ): Promise<void> {
        const { entry: initialEntry, storageEntry: initialStorageEntry } = params;
        const model = this.storageModelProvider.getModel(initialModel);

        const transformer = createTransformer({
            valuesModifiers: this.valuesModifiers,
            model,
            entry: initialEntry,
            storageEntry: initialStorageEntry,
            fieldIndexRegistry: this.fieldIndexRegistry,
            compressionHandler: this.compressionHandler
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
        const records = await this.entity.queryAll(queryAllParams);

        /**
         * Let's pick the `deleted` meta fields from the entry.
         */
        const updatedEntryMetaFields = pickEntryMetaFields(entry, isDeletedEntryMetaField);

        /**
         * Then update all the records with data received.
         */
        let latestRecord: CmsEntry | undefined = undefined;
        let publishedRecord: CmsEntry | undefined = undefined;

        const entityBatch = this.entity.createEntityWriter();

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

            this.dataLoaders.clearAll({
                tenant: entry.tenant
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
        const esEntityReader = this.esEntity.createEntityReader();
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
                        data: await this.compressionHandler.decompress(record.data)
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
        const elasticsearchEntityBatch = this.esEntity.createEntityWriter();

        for (const item of esItems) {
            elasticsearchEntityBatch.put({
                ...item,
                data: await this.compressionHandler.compress({
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
    }
}

export const DdbEsMoveToBin = createImplementation({
    abstraction: MoveToBinStorageOperation,
    implementation: DdbEsMoveToBinImpl,
    dependencies: [
        CmsDdbEsEntryEntity,
        CmsDdbEsEntriesEsEntity,
        CmsDdbEsDataLoaders,
        CmsStorageModelProvider,
        CmsEntryOpenSearchFieldIndexRegistry,
        CompressionHandler,
        [CmsEntryOpenSearchValuesModifier, { multiple: true }]
    ]
});
