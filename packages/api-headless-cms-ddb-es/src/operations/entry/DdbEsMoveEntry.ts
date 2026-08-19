import WebinyError from "@webiny/error";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { MoveEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveEntryStorageOperation.js";
import { CmsDdbEsEntryEntity } from "~/abstractions/CmsDdbEsEntryEntity.js";
import { CmsDdbEsEntriesEsEntity } from "~/abstractions/CmsDdbEsEntriesEsEntity.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import type { IOpenSearchEntityAttributes as IElasticsearchEntityAttributes } from "@webiny/api-opensearch-aws";
import type { IEntityQueryAllParams } from "@webiny/db-dynamodb";
import { createLatestSortKey, createPartitionKey, createPublishedSortKey } from "./keys.js";

class DdbEsMoveEntryImpl implements MoveEntryStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEsEntryEntity.Interface,
        private esEntity: CmsDdbEsEntriesEsEntity.Interface,
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private compressionHandler: CompressionHandler.Interface
    ) {}

    async execute(initialModel: CmsModel, id: string, folderId: string) {
        const model = this.storageModelProvider.getModel(initialModel);

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
        const records = await this.entity.queryAll(queryAllParams);
        /**
         * Then update the folderId in each record and prepare it to be stored.
         */
        let latestRecord: CmsEntry | undefined = undefined;
        let publishedRecord: CmsEntry | undefined = undefined;
        const entityBatch = this.entity.createEntityWriter();

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
            this.dataLoaders.clearAll({
                tenant: initialModel.tenant
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

        try {
            const elasticsearchEntityBatch = this.esEntity.createEntityWriter({
                put: await Promise.all(
                    esItems.map(async item => {
                        return {
                            ...item,
                            data: await this.compressionHandler.compress({
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
    }
}

export const DdbEsMoveEntry = MoveEntryStorageOperation.createImplementation({
    implementation: DdbEsMoveEntryImpl,
    dependencies: [
        CmsDdbEsEntryEntity,
        CmsDdbEsEntriesEsEntity,
        CmsDdbEsDataLoaders,
        CmsStorageModelProvider,
        CompressionHandler
    ]
});
