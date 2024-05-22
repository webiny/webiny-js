import { executeWithRetry } from "@webiny/utils";
import { createPinoLogger, getLogLevel } from "@webiny/logger";
import { createTable } from "@webiny/data-migration";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createElasticsearchClient } from "@webiny/api-elasticsearch";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { isMigratedEntry } from "~/migrations/5.39.0/001/utils/isMigratedEntry";
import { hasValidTypeFieldValue } from "~/migrations/5.39.0/001/utils/hasValidTypeFieldValue";
import { hasAllNonNullableValues } from "~/migrations/5.39.0/001/utils/hasAllNonNullableValues";
import { getOldestRevisionCreatedOn } from "~/migrations/5.39.0/001/utils/getOldestRevisionCreatedOn";
import { getFirstLastPublishedOnBy } from "~/migrations/5.39.0/001/utils/getFirstLastPublishedOn";
import { assignNewMetaFields } from "~/migrations/5.39.0/001/utils/assignNewMetaFields";
import { fixTypeFieldValue } from "~/migrations/5.39.0/001/utils/fixTypeFieldValue";
import { getFallbackIdentity } from "~/migrations/5.39.0/001/utils/getFallbackIdentity";
import { ensureAllNonNullableValues } from "~/migrations/5.39.0/001/utils/ensureAllNonNullableValues";
import { getDecompressedData } from "~/migrations/5.39.0/001/utils/getDecompressedData";
import { getCompressedData } from "~/migrations/5.39.0/001/utils/getCompressedData";
import { CmsEntry } from "~/migrations/5.39.0/001/types";
import {
    createDdbEntryEntity,
    createDdbEsEntryEntity
} from "~/migrations/5.39.0/001/entities/createEntryEntity";
import {
    batchReadAll,
    BatchReadItem,
    batchWriteAll,
    BatchWriteItem,
    ddbScanWithCallback,
    disableElasticsearchIndexing,
    esGetIndexName,
    fetchOriginalElasticsearchSettings
} from "~/utils";
import pinoPretty from "pino-pretty";

const argv = yargs(hideBin(process.argv))
    .options({
        region: { type: "string", demandOption: true },
        primaryDynamoDbTable: { type: "string", demandOption: true },
        ddbEsTable: { type: "string", demandOption: true },
        elasticsearchEndpoint: { type: "string", demandOption: true },
        segmentIndex: { type: "number", demandOption: true },
        totalSegments: { type: "number", demandOption: true }
    })
    .parseSync();

interface LastEvaluatedKeyObject {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
}

type LastEvaluatedKey = LastEvaluatedKeyObject | true | null;

interface IndexSettings {
    number_of_replicas: number;
    refresh_interval: `${number}s`;
}

interface MigrationStatus {
    lastEvaluatedKey: LastEvaluatedKey;
    iterationsCount: number;
    recordsScanned: number;
    indexes: {
        [index: string]: IndexSettings | null;
    };
}

interface DynamoDbElasticsearchRecord {
    PK: string;
    SK: string;
    data: string;
}

const createInitialCheckpoint = (): MigrationStatus => {
    return {
        lastEvaluatedKey: null,
        iterationsCount: 0,
        recordsScanned: 0,
        indexes: {}
    };
};

(async () => {
    const logger = createPinoLogger(
        {
            level: getLogLevel(process.env.MIGRATIONS_LOG_LEVEL, "trace"),
            msgPrefix: `[segment index ${argv.segmentIndex}] `
        },
        pinoPretty({
            ignore: "pid,hostname"
        })
    );

    const documentClient = getDocumentClient();
    const elasticsearchClient = createElasticsearchClient({
        endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}`
    });

    const primaryTable = createTable({
        name: argv.primaryDynamoDbTable,
        documentClient
    });
    const dynamoToEsTable = createTable({
        name: argv.ddbEsTable,
        documentClient
    });

    const ddbEntryEntity = createDdbEntryEntity(primaryTable);
    const ddbEsEntryEntity = createDdbEsEntryEntity(dynamoToEsTable);

    const status = createInitialCheckpoint();

    await ddbScanWithCallback<CmsEntry>(
        {
            entity: ddbEntryEntity,
            options: {
                segment: argv.segmentIndex,
                segments: argv.totalSegments,
                filters: [
                    {
                        attr: "_et",
                        eq: "CmsEntries"
                    }
                ],
                startKey: status.lastEvaluatedKey || undefined,
                limit: 100
            }
        },
        async result => {
            status.iterationsCount++;
            status.recordsScanned += result.items.length;

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
                if (!status.indexes[index]) {
                    // We need to fetch the index settings first
                    const settings = await fetchOriginalElasticsearchSettings({
                        index,
                        logger,
                        elasticsearchClient: elasticsearchClient
                    });

                    // ... add it to the checkpoint...
                    status.indexes[index] = settings;

                    // and then set not to index
                    await disableElasticsearchIndexing({
                        elasticsearchClient: elasticsearchClient,
                        index,
                        logger
                    });
                }

                // 1. Check if the data migration was ever performed. If not, let's perform it.
                if (!isMigratedEntry(item)) {
                    // Get the oldest revision's `createdOn` value. We use that to set the entry-level `createdOn` value.
                    const createdOn = await getOldestRevisionCreatedOn({
                        entry: item,
                        entryEntity: ddbEntryEntity
                    });

                    const firstLastPublishedOnByFields = await getFirstLastPublishedOnBy({
                        entry: item,
                        entryEntity: ddbEntryEntity
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
                            entity: ddbEntryEntity,
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

                ddbItems.push(ddbEntryEntity.putBatch(item));

                /**
                 * Prepare the loading of DynamoDB Elasticsearch part of the records.
                 */
                if (ddbEsGetItems[`${item.entryId}:L`]) {
                    continue;
                }

                ddbEsGetItems[`${item.entryId}:L`] = ddbEsEntryEntity.getBatch({
                    PK: item.PK,
                    SK: "L"
                });

                if (item.status === "published" || !!item.locked) {
                    ddbEsGetItems[`${item.entryId}:P`] = ddbEsEntryEntity.getBatch({
                        PK: item.PK,
                        SK: "P"
                    });
                }
            }

            /**
             * Get all the records from DynamoDB Elasticsearch.
             */
            const ddbEsRecords = await batchReadAll<DynamoDbElasticsearchRecord>({
                table: ddbEsEntryEntity.table,
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
                        entryEntity: ddbEntryEntity
                    });

                    const firstLastPublishedOnByFields = await getFirstLastPublishedOnBy({
                        entry: { ...decompressedData, PK: ddbEsRecord.PK },
                        entryEntity: ddbEntryEntity
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
                            `[DDB-ES Table] Detected an entry with missing values for non-nullable meta fields`,
                            `(${decompressedData.modelId}/${decompressedData.id}).`
                        ].join(" ")
                    );

                    try {
                        const fallbackIdentity = await getFallbackIdentity({
                            entity: ddbEntryEntity,
                            tenant: decompressedData.tenant
                        });

                        ensureAllNonNullableValues(decompressedData, {
                            dateTime: fallbackDateTime,
                            identity: fallbackIdentity
                        });

                        logger.trace(
                            [
                                `[DDB-ES Table] Successfully ensured all non-nullable meta fields`,
                                `have values (${decompressedData.modelId}/${decompressedData.id}).`,
                                "Will be saving the changes soon."
                            ].join(" ")
                        );
                    } catch (e) {
                        logger.error(
                            [
                                "[DDB-ES Table] Failed to ensure all non-nullable meta fields have values",
                                `(${decompressedData.modelId}/${decompressedData.id}): ${e.message}`
                            ].join(" ")
                        );
                    }
                }

                const compressedData = await getCompressedData(decompressedData);

                ddbEsItems.push(
                    ddbEsEntryEntity.putBatch({
                        ...ddbEsRecord,
                        data: compressedData
                    })
                );
            }

            if (ddbItems.length) {
                // Store data in primary DynamoDB table.
                const execute = () => {
                    return batchWriteAll({
                        table: ddbEntryEntity.table,
                        items: ddbItems
                    });
                };

                logger.trace(`Storing records in primary DynamoDB table...`);
                await executeWithRetry(execute, {
                    onFailedAttempt: error => {
                        logger.error(
                            `Batch write attempt #${error.attemptNumber} failed: ${error.message}`
                        );
                    }
                });

                // Store data in DDB-ES DynamoDB table.
                const executeDdbEs = () => {
                    return batchWriteAll({
                        table: ddbEsEntryEntity.table,
                        items: ddbEsItems
                    });
                };

                logger.trace(`Storing records in DDB-ES DynamoDB table...`);
                await executeWithRetry(executeDdbEs, {
                    onFailedAttempt: error => {
                        logger.error(
                            `[DDB-ES Table] Batch write attempt #${error.attemptNumber} failed: ${error.message}`
                        );
                    }
                });
            }


            // Update checkpoint after every batch.
            let lastEvaluatedKey: LastEvaluatedKey = true;
            if (result.lastEvaluatedKey) {
                lastEvaluatedKey = result.lastEvaluatedKey as unknown as LastEvaluatedKeyObject;
            }

            status.lastEvaluatedKey = lastEvaluatedKey;

            if (lastEvaluatedKey === true) {
                return false;
            }

            // Continue further scanning.
            return true;
        }
    );

    logger.trace(status)
})();
