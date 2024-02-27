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
    restoreOriginalElasticsearchSettings
} from "~/utils";
import { inject, makeInjectable } from "@webiny/ioc";
import { Client } from "@elastic/elasticsearch";
import { executeWithRetry } from "@webiny/utils";
import {
    createDdbEntryEntity,
    createDdbEsEntryEntity
} from "~/migrations/5.39.0/001/entities/createEntryEntity";
import { CmsEntry } from "~/migrations/5.39.0/001/types";
import { getDecompressedData } from "~/migrations/5.39.0/001/utils/getDecompressedData";
import { getCompressedData } from "~/migrations/5.39.0/001/utils/getCompressedData";
import { assignNewMetaFields } from "~/migrations/5.39.0/001/utils/assignNewMetaFields";
import { fixTypeFieldValue } from "~/migrations/5.39.0/001/utils/fixTypeFieldValue";
import { isMigratedEntry } from "~/migrations/5.39.0/001/utils/isMigratedEntry";
import { getOldestRevisionCreatedOn } from "~/migrations/5.39.0/001/utils/getOldestRevisionCreatedOn";
import { getFirstLastPublishedOnBy } from "~/migrations/5.39.0/001/utils/getFirstLastPublishedOn";
import { hasValidTypeFieldValue } from "~/migrations/5.39.2/001/ddb-es/utils/hasValidTypeFieldValue";
import { ScanDbItem } from "@webiny/db-dynamodb";

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

export class CmsEntriesInitNewMetaFields_5_39_2_001 implements DataMigration {
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
        return "5.39.2-001";
    }

    getDescription() {
        return "Write new revision and entry-level on/by meta fields (second pass).";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        let shouldExecute = false;

        await ddbScanWithCallback<ScanDbItem<CmsEntry>>(
            {
                entity: this.ddbEntryEntity,
                options: {
                    attributes: ["TYPE", "SK"],
                    filters: [
                        {
                            attr: "_et",
                            eq: "CmsEntries"
                        }
                    ],
                    limit: 100
                }
            },
            async result => {
                if (result.error) {
                    logger.error(result.error);
                    throw new Error(result.error);
                }

                for (const item of result.items) {
                    if (!hasValidTypeFieldValue(item)) {
                        shouldExecute = true;

                        // Stop further scanning.
                        return false;
                    }
                }

                // Continue further scanning.
                return true;
            }
        );

        if (shouldExecute) {
            return true;
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
                            attr: "_et",
                            eq: "CmsEntries"
                        }
                    ],
                    startKey: migrationStatus.lastEvaluatedKey || undefined,
                    limit: 100
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
                    if (hasValidTypeFieldValue(item) && isMigratedEntry(item)) {
                        continue;
                    }

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

                    if (!isMigratedEntry(item)) {
                        // Get the oldest revision's `createdOn` value. We use that to set the entry-level `createdOn` value.
                        const createdOn = await getOldestRevisionCreatedOn({
                            entry: item,
                            entryEntity: this.ddbEntryEntity
                        });

                        const firstLastPublishedOnByFields = await getFirstLastPublishedOnBy({
                            entry: item,
                            entryEntity: this.ddbEntryEntity
                        });

                        assignNewMetaFields(item, {
                            createdOn,
                            ...firstLastPublishedOnByFields
                        });
                    }

                    // Fixes the value of the `TYPE` field, if it's not valid.
                    fixTypeFieldValue(item);

                    ddbItems.push(this.ddbEntryEntity.putBatch(item));

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
                    }

                    if (isMigratedEntry(decompressedData)) {
                        const forceExecute = context.forceExecute;
                        if (!forceExecute) {
                            logger.trace(
                                `Skipping record "${decompressedData.entryId}" as it already has meta fields defined...`
                            );
                            continue;
                        }
                    }

                    // Get the oldest revision's `createdOn` value. We use that to set the entry-level `createdOn` value.
                    const createdOn = await getOldestRevisionCreatedOn({
                        entry: { ...decompressedData, PK: esRecord.PK },
                        entryEntity: this.ddbEntryEntity
                    });

                    const firstLastPublishedOnByFields = await getFirstLastPublishedOnBy({
                        entry: { ...decompressedData, PK: esRecord.PK },
                        entryEntity: this.ddbEntryEntity
                    });

                    assignNewMetaFields(decompressedData, {
                        createdOn,
                        ...firstLastPublishedOnByFields
                    });

                    const compressedData = await getCompressedData(decompressedData);

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

makeInjectable(CmsEntriesInitNewMetaFields_5_39_2_001, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
