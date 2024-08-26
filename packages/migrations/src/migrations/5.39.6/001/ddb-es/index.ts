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
import { getOldestRevisionCreatedOn } from "~/migrations/5.39.0/001/utils/getOldestRevisionCreatedOn";
import { getFirstLastPublishedOnBy } from "~/migrations/5.39.0/001/utils/getFirstLastPublishedOn";
import { hasValidTypeFieldValue } from "~/migrations/5.39.0/001/utils/hasValidTypeFieldValue";
import { hasAllNonNullableValues } from "~/migrations/5.39.0/001/utils/hasAllNonNullableValues";
import { isMigratedEntry } from "~/migrations/5.39.0/001/utils/isMigratedEntry";
import { getFallbackIdentity } from "~/migrations/5.39.0/001/utils/getFallbackIdentity";
import { ensureAllNonNullableValues } from "~/migrations/5.39.0/001/utils/ensureAllNonNullableValues";
import { ScanDbItem } from "@webiny/db-dynamodb";

interface LastEvaluatedKey {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
}

interface IndexSettings {
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

export class CmsEntriesInitNewMetaFields_5_39_6_001 implements DataMigration {
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
        return "5.39.6-001";
    }

    getDescription() {
        return "Write new revision and entry-level on/by meta fields.";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        let shouldExecute = false;

        await ddbScanWithCallback<ScanDbItem<CmsEntry>>(
            {
                entity: this.ddbEntryEntity,
                options: {
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
                    const isFullyMigrated =
                        isMigratedEntry(item) &&
                        hasValidTypeFieldValue(item) &&
                        hasAllNonNullableValues(item);

                    if (!isFullyMigrated) {
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

        logger.info(`CMS entries already upgraded. Skipping...`);
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

        logger.trace(`Scanning primary DynamoDB table.`, {
            usingKey
        });

        let currentDdbScanIteration = 0;

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
                currentDdbScanIteration++;

                logger.trace(`Primary DynamoDB table scan iteration: ${currentDdbScanIteration}.`);
                logger.trace(`Analyzing ${result.items.length} record(s)...`);

                const ddbItems: BatchWriteItem[] = [];
                const ddbEsItems: BatchWriteItem[] = [];
                const ddbEsGetItems: Record<string, BatchReadItem> = {};

                const fallbackDateTime = new Date().toISOString();

                // Update records in primary DynamoDB table. Also do preparations for
                // subsequent updates on DDB-ES DynamoDB table, and in Elasticsearch.
                for (const item of result.items) {
                    const isFullyMigrated =
                        isMigratedEntry(item) &&
                        hasValidTypeFieldValue(item) &&
                        hasAllNonNullableValues(item);

                    if (isFullyMigrated) {
                        continue;
                    }

                    const index = esGetIndexName({
                        tenant: item.tenant,
                        locale: item.locale,
                        type: item.modelId,
                        isHeadlessCmsModel: true
                    });

                    // Check ES index settings.
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

                    // 1. Check if the data migration was ever performed. If not, let's perform it.
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

                    // 2. We've noticed some of the records had an invalid `TYPE` field value
                    //    in the database. This step addresses this issue.
                    if (!hasValidTypeFieldValue(item)) {
                        // Fixes the value of the `TYPE` field, if it's not valid.
                        fixTypeFieldValue(item);
                    }

                    // 3. Finally, once both of the steps were performed, ensure that all
                    //    new non-nullable meta fields have a value and nothing is missing.
                    if (!hasAllNonNullableValues(item)) {
                        logger.trace(
                            `Detected an entry with missing values for non-nullable meta fields (${item.modelId}/${item.id}).`
                        );

                        try {
                            const fallbackIdentity = await getFallbackIdentity({
                                entity: this.ddbEntryEntity,
                                tenant: item.tenant
                            });

                            ensureAllNonNullableValues(item, {
                                dateTime: fallbackDateTime,
                                identity: fallbackIdentity
                            });

                            logger.trace(
                                `Successfully ensured all non-nullable meta fields have values (${item.modelId}/${item.id}). Will be saving into the database soon.`
                            );
                        } catch (e) {
                            logger.debug(
                                `Failed to ensure all non-nullable meta fields have values (${item.modelId}/${item.id}): ${e.message}`
                            );
                        }
                    }

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
                const ddbEsRecords = await batchReadAll<DynamoDbElasticsearchRecord>({
                    table: this.ddbEsEntryEntity.table,
                    items: Object.values(ddbEsGetItems)
                });

                for (const ddbEsRecord of ddbEsRecords) {
                    const decompressedData = await getDecompressedData<CmsEntry>(ddbEsRecord.data);
                    if (!decompressedData) {
                        logger.trace(
                            `[DDB-ES Table] Skipping record "${ddbEsRecord.PK}" as it is not a valid CMS entry...`
                        );
                        continue;
                    }

                    // 1. Check if the data migration was ever performed. If not, let's perform it.
                    if (!isMigratedEntry(decompressedData)) {
                        // Get the oldest revision's `createdOn` value. We use that to set the entry-level `createdOn` value.
                        const createdOn = await getOldestRevisionCreatedOn({
                            entry: { ...decompressedData, PK: ddbEsRecord.PK },
                            entryEntity: this.ddbEntryEntity
                        });

                        const firstLastPublishedOnByFields = await getFirstLastPublishedOnBy({
                            entry: { ...decompressedData, PK: ddbEsRecord.PK },
                            entryEntity: this.ddbEntryEntity
                        });

                        assignNewMetaFields(decompressedData, {
                            createdOn,
                            ...firstLastPublishedOnByFields
                        });
                    }

                    // 2. Ensure new non-nullable meta fields have a value and nothing is missing.
                    if (!hasAllNonNullableValues(decompressedData)) {
                        logger.trace(
                            [
                                "[DDB-ES Table] Detected an entry with missing values for non-nullable meta fields",
                                `(${decompressedData.modelId}/${decompressedData.id}).`
                            ].join(" ")
                        );

                        try {
                            const fallbackIdentity = await getFallbackIdentity({
                                entity: this.ddbEntryEntity,
                                tenant: decompressedData.tenant
                            });

                            ensureAllNonNullableValues(decompressedData, {
                                dateTime: fallbackDateTime,
                                identity: fallbackIdentity
                            });

                            logger.trace(
                                [
                                    "[DDB-ES Table] Successfully ensured all non-nullable meta fields",
                                    `have values (${decompressedData.modelId}/${decompressedData.id}).`,
                                    "Will be saving the changes soon."
                                ].join(" ")
                            );
                        } catch (e) {
                            logger.debug(
                                [
                                    "[DDB-ES Table] Failed to ensure all non-nullable meta fields have values",
                                    `(${decompressedData.modelId}/${decompressedData.id}): ${e.message}`
                                ].join(" ")
                            );
                        }
                    }

                    const compressedData = await getCompressedData(decompressedData);

                    ddbEsItems.push(
                        this.ddbEsEntryEntity.putBatch({
                            ...ddbEsRecord,
                            data: compressedData
                        })
                    );
                }

                // Store data in primary DynamoDB table.
                const execute = () => {
                    return batchWriteAll({
                        table: this.ddbEntryEntity.table,
                        items: ddbItems
                    });
                };

                logger.trace("Storing records in primary DynamoDB table...");
                await executeWithRetry(execute, {
                    onFailedAttempt: error => {
                        logger.error(
                            `"batchWriteAll" attempt #${error.attemptNumber} failed: ${error.message}`
                        );
                    }
                });
                logger.trace("...stored.");

                // Store data in DDB-ES DynamoDB table.
                const executeDdbEs = () => {
                    return batchWriteAll({
                        table: this.ddbEsEntryEntity.table,
                        items: ddbEsItems
                    });
                };

                logger.trace("Storing records in DDB-ES DynamoDB table...");
                await executeWithRetry(executeDdbEs, {
                    onFailedAttempt: error => {
                        logger.error(
                            `"batchWriteAll ddb-es" attempt #${error.attemptNumber} failed: ${error.message}`
                        );
                    }
                });
                logger.trace("...stored.");

                // Update checkpoint after every batch.
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

makeInjectable(CmsEntriesInitNewMetaFields_5_39_6_001, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
