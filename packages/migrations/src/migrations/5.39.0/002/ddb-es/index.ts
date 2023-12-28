import { Table } from "@webiny/db-dynamodb/toolbox";
import {
    DataMigration,
    DataMigrationContext,
    ElasticsearchClientSymbol,
    ElasticsearchDynamoTableSymbol,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import {
    batchReadAll,
    BatchReadItem,
    batchWriteAll,
    BatchWriteItem,
    ddbScanWithCallback,
    disableElasticsearchIndexing,
    esGetIndexName,
    fetchOriginalElasticsearchSettings,
    restoreOriginalElasticsearchSettings,
    scan
} from "~/utils";
import { inject, makeInjectable } from "@webiny/ioc";
import { Client } from "@elastic/elasticsearch";
import { executeWithRetry } from "@webiny/utils";
import { createDdbEntryEntity, createDdbEsEntryEntity } from "../entities/createEntryEntity";
import { getDecompressedData } from "~/migrations/5.37.0/002/utils/getDecompressedData";
import { CmsEntry } from "../types";
import { getCompressedData } from "~/migrations/5.37.0/002/utils/getCompressedData";

interface LastEvaluatedKey {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
}

interface IndexSettings {
    number_of_replicas: number;
    refresh_interval: `${number}s`;
}

interface CmsEntriesRootFolderDataMigrationCheckpoint {
    lastEvaluatedKey?: LastEvaluatedKey | boolean;
    indexes: {
        [index: string]: IndexSettings | null;
    };
}

interface DynamoDbElasticsearchRecord {
    PK: string;
    SK: string;
    data: string;
}

const REVISION_CREATED_ON_FIELD = "revisionCreatedOn";

export class CmsEntriesInitNewMetaFields_5_39_0_002 implements DataMigration {
    private readonly elasticsearchClient: Client;
    private readonly ddbEntryEntity: ReturnType<typeof createDdbEntryEntity>;
    private readonly ddbEsEntryEntity: ReturnType<typeof createDdbEsEntryEntity>;

    public constructor(
        table: Table<string, string, string>,
        esTable: Table<string, string, string>,
        elasticsearchClient: Client
    ) {
        this.elasticsearchClient = elasticsearchClient;
        this.ddbEntryEntity = createDdbEntryEntity(table);
        this.ddbEsEntryEntity = createDdbEsEntryEntity(esTable);
    }

    getId() {
        return "5.39.0-002";
    }

    getDescription() {
        return "Write new revision and entry-level on/by meta fields.";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        const result = await scan<DynamoDbElasticsearchRecord>({
            entity: this.ddbEsEntryEntity,
            options: {
                filters: [
                    {
                        attr: "PK",
                        contains: "#CMS#CME#"
                    }
                ],
                limit: 100
            }
        });

        if (result.items.length === 0) {
            logger.info(`No CMS entries found in the system; skipping migration.`);
            return false;
        } else if (result.error) {
            logger.error(result.error);
            throw new Error(result.error);
        }

        for (const item of result.items) {
            const data = await getDecompressedData<CmsEntry>(item.data);
            if (!data) {
                continue;
            }

            // If no `revisionCreatedOn` was set, we need to push the upgrade.
            if (!data[REVISION_CREATED_ON_FIELD]) {
                return true;
            }
        }
        logger.info(`CMS entries already upgraded. skipping...`);
        return false;
    }

    async execute({
        logger,
        ...context
    }: DataMigrationContext<CmsEntriesRootFolderDataMigrationCheckpoint>): Promise<void> {
        const migrationStatus =
            context.checkpoint || ({} as CmsEntriesRootFolderDataMigrationCheckpoint);

        if (migrationStatus.lastEvaluatedKey === true) {
            await restoreOriginalElasticsearchSettings({
                indexSettings: migrationStatus.indexes,
                logger,
                elasticsearchClient: this.elasticsearchClient
            });
            logger.info(`Migration completed, no need to start again.`);
            return;
        }

        let usingKey = "";
        if (migrationStatus?.lastEvaluatedKey) {
            usingKey = JSON.stringify(migrationStatus.lastEvaluatedKey);
        }

        logger.debug(`Scanning DynamoDB Elasticsearch table... ${usingKey}`);
        await ddbScanWithCallback<CmsEntry>(
            {
                entity: this.ddbEntryEntity,
                options: {
                    filters: [
                        {
                            attr: "TYPE",
                            beginsWith: "cms.entry"
                        }
                    ],
                    startKey: migrationStatus.lastEvaluatedKey || undefined,
                    limit: 500
                }
            },
            async result => {
                logger.debug(`Processing ${result.items.length} items...`);
                const ddbItems: BatchWriteItem[] = [];
                const ddbEsItems: BatchWriteItem[] = [];

                const ddbEsGetItems: Record<string, BatchReadItem> = {};
                /**
                 * Update the DynamoDB part of the records.
                 */
                for (const item of result.items) {
                    const index = esGetIndexName({
                        tenant: item.tenant,
                        locale: item.locale,
                        type: item.modelId,
                        isHeadlessCmsModel: true
                    });

                    // Check for the elasticsearch index settings
                    if (!migrationStatus.indexes || migrationStatus.indexes[index] === undefined) {
                        // We need to fetch the index settings first
                        const settings = await fetchOriginalElasticsearchSettings({
                            index,
                            logger,
                            elasticsearchClient: this.elasticsearchClient
                        });

                        // ... add it to the checkpoint...
                        migrationStatus.indexes = {
                            ...migrationStatus.indexes,
                            [index]: settings
                        };
                        // and then set not to index
                        await disableElasticsearchIndexing({
                            elasticsearchClient: this.elasticsearchClient,
                            index,
                            logger
                        });
                    }

                    ddbItems.push(
                        this.ddbEntryEntity.putBatch({
                            ...item,

                            // Revision-level meta fields.
                            revisionCreatedOn: item.createdOn,

                            // `modifiedOn` does not exist, that's why we're using `savedOn`.
                            revisionModifiedOn: item.savedOn,

                            revisionSavedOn: item.savedOn,
                            revisionCreatedBy: item.createdBy,
                            revisionModifiedBy: item.modifiedBy || null,
                            revisionSavedBy: item.modifiedBy || item.createdBy,

                            // Entry-level meta fields.
                            entryCreatedOn: item.createdOn,

                            // `modifiedOn` does not exist, that's why we're using `savedOn`.
                            entryModifiedOn: item.savedOn,

                            entrySavedOn: item.savedOn,
                            entryCreatedBy: item.createdBy,
                            entryModifiedBy: item.modifiedBy || null,
                            entrySavedBy: item.modifiedBy || item.createdBy
                        })
                    );
                    /**
                     * Prepare the loading of DynamoDB Elasticsearch part of the records.
                     */
                    if (ddbEsGetItems[`${item.entryId}:L`]) {
                        continue;
                    }
                    ddbEsGetItems[`${item.entryId}:L`] = this.ddbEsEntryEntity.getBatch({
                        PK: item.PK,
                        SK: "L"
                    });
                    if (item.status === "published" || !!item.locked) {
                        ddbEsGetItems[`${item.entryId}:P`] = this.ddbEsEntryEntity.getBatch({
                            PK: item.PK,
                            SK: "P"
                        });
                    }
                }

                /**
                 * Get all the records from DynamoDB Elasticsearch.
                 */
                const esRecords = await batchReadAll<DynamoDbElasticsearchRecord>({
                    table: this.ddbEsEntryEntity.table,
                    items: Object.values(ddbEsGetItems)
                });

                for (const esRecord of esRecords) {
                    const decompressedData = await getDecompressedData<CmsEntry>(esRecord.data);
                    if (!decompressedData) {
                        logger.trace(
                            `Skipping record "${esRecord.PK}" as it is not a valid CMS entry...`
                        );
                        continue;
                    } else if (
                        !context.forceExecute &&
                        decompressedData[REVISION_CREATED_ON_FIELD]
                    ) {
                        logger.trace(
                            `Skipping record "${decompressedData.entryId}" as it already has meta fields defined...`
                        );
                        continue;
                    }

                    const compressedData = await getCompressedData({
                        ...decompressedData,
                        // Revision-level meta fields.
                        revisionCreatedOn: decompressedData.createdOn,

                        // `modifiedOn` does not exist, that's why we're using `savedOn`.
                        revisionModifiedOn: decompressedData.savedOn,

                        revisionSavedOn: decompressedData.savedOn,
                        revisionCreatedBy: decompressedData.createdBy,
                        revisionModifiedBy: decompressedData.modifiedBy || null,
                        revisionSavedBy: decompressedData.modifiedBy || decompressedData.createdBy,

                        // Entry-level meta fields.
                        entryCreatedOn: decompressedData.createdOn,

                        // `modifiedOn` does not exist, that's why we're using `savedOn`.
                        entryModifiedOn: decompressedData.savedOn,

                        entrySavedOn: decompressedData.savedOn,
                        entryCreatedBy: decompressedData.createdBy,
                        entryModifiedBy: decompressedData.modifiedBy || null,
                        entrySavedBy: decompressedData.modifiedBy || decompressedData.createdBy
                    });

                    ddbEsItems.push(
                        this.ddbEsEntryEntity.putBatch({
                            ...esRecord,
                            data: compressedData
                        })
                    );
                }

                const execute = () => {
                    return batchWriteAll({
                        table: this.ddbEntryEntity.table,
                        items: ddbItems
                    });
                };

                const executeDdbEs = () => {
                    return batchWriteAll({
                        table: this.ddbEsEntryEntity.table,
                        items: ddbEsItems
                    });
                };

                logger.trace("Storing the DynamoDB records...");
                await executeWithRetry(execute, {
                    onFailedAttempt: error => {
                        logger.error(
                            `"batchWriteAll" attempt #${error.attemptNumber} failed: ${error.message}`
                        );
                    }
                });
                logger.trace("...stored.");

                logger.trace("Storing the DynamoDB Elasticsearch records...");
                await executeWithRetry(executeDdbEs, {
                    onFailedAttempt: error => {
                        logger.error(
                            `"batchWriteAll ddb + es" attempt #${error.attemptNumber} failed: ${error.message}`
                        );
                    }
                });
                logger.trace("...stored.");

                // Update checkpoint after every batch
                migrationStatus.lastEvaluatedKey = result.lastEvaluatedKey?.PK
                    ? (result.lastEvaluatedKey as unknown as LastEvaluatedKey)
                    : true;

                // Check if we should store checkpoint and exit.
                if (context.runningOutOfTime()) {
                    await context.createCheckpointAndExit(migrationStatus);
                } else {
                    await context.createCheckpoint(migrationStatus);
                }
            }
        );

        /**
         * This is the end of the migration.
         */
        await restoreOriginalElasticsearchSettings({
            indexSettings: migrationStatus.indexes,
            logger,
            elasticsearchClient: this.elasticsearchClient
        });

        migrationStatus.lastEvaluatedKey = true;
        migrationStatus.indexes = {};
        context.createCheckpoint(migrationStatus);
    }
}

makeInjectable(CmsEntriesInitNewMetaFields_5_39_0_002, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
