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
    ddbScanWithCallback
} from "~/utils";
import { createWaitUntilHealthy } from "@webiny/api-elasticsearch/utils/waitUntilHealthy";
import pinoPretty from "pino-pretty";
import { EsHealthChecksParams } from "~/migrations/5.39.6/001/ddb-es/utils";
import path from "path";
import os from "os";
import fs from "fs";

const argv = yargs(hideBin(process.argv))
    .options({
        runId: { type: "string", demandOption: true },
        ddbTable: { type: "string", demandOption: true },
        ddbEsTable: { type: "string", demandOption: true },
        esEndpoint: { type: "string", demandOption: true },
        segmentIndex: { type: "number", demandOption: true },
        totalSegments: { type: "number", demandOption: true },

        // Elasticsearch health check options.
        esHealthMinClusterHealthStatus: { type: "string", demandOption: true },
        esHealthMaxProcessorPercent: { type: "number", demandOption: true },
        esHealthMaxRamPercent: { type: "number", demandOption: true },
        esHealthMaxWaitingTime: { type: "number", demandOption: true },
        esHealthWaitingTimeStep: { type: "number", demandOption: true }
    })
    .parseSync();

interface LastEvaluatedKeyObject {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
}

type LastEvaluatedKey = LastEvaluatedKeyObject | true | null;

interface MigrationStatus {
    lastEvaluatedKey: LastEvaluatedKey;
    stats: {
        iterationsCount: number;
        recordsScanned: number;
        recordsUpdated: number;
        recordsSkipped: number;
    };
}

interface DynamoDbElasticsearchRecord {
    PK: string;
    SK: string;
    data: string;
}

const createInitialStatus = (): MigrationStatus => {
    return {
        lastEvaluatedKey: null,
        stats: {
            iterationsCount: 0,
            recordsScanned: 0,
            recordsUpdated: 0,
            recordsSkipped: 0
        }
    };
};

(async () => {
    const logger = createPinoLogger(
        {
            level: getLogLevel(process.env.MIGRATIONS_LOG_LEVEL, "trace"),
            msgPrefix: `[segment #${argv.segmentIndex}] `
        },
        pinoPretty({ ignore: "pid,hostname" })
    );

    const documentClient = getDocumentClient();
    const elasticsearchClient = createElasticsearchClient({
        endpoint: `https://${argv.esEndpoint}`
    });

    const primaryTable = createTable({
        name: argv.ddbTable,
        documentClient
    });
    const dynamoToEsTable = createTable({
        name: argv.ddbEsTable,
        documentClient
    });

    const ddbEntryEntity = createDdbEntryEntity(primaryTable);
    const ddbEsEntryEntity = createDdbEsEntryEntity(dynamoToEsTable);

    const status = createInitialStatus();

    const waitUntilHealthy = createWaitUntilHealthy(elasticsearchClient, {
        minClusterHealthStatus:
            argv.esHealthMinClusterHealthStatus as EsHealthChecksParams["minClusterHealthStatus"],
        maxProcessorPercent: argv.esHealthMaxProcessorPercent,
        maxRamPercent: argv.esHealthMaxRamPercent,
        maxWaitingTime: argv.esHealthMaxWaitingTime,
        waitingTimeStep: argv.esHealthWaitingTimeStep
    });

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
            status.stats.iterationsCount++;
            status.stats.recordsScanned += result.items.length;

            if (status.stats.iterationsCount % 5 === 0) {
                // We log every 5th iteration.
                logger.trace(`[iteration #${status.stats.iterationsCount}] Reading ${result.items.length} record(s)...`);
            }

            const ddbItemsToBatchWrite: BatchWriteItem[] = [];
            const ddbEsItemsToBatchWrite: BatchWriteItem[] = [];
            const ddbEsItemsToBatchRead: Record<string, BatchReadItem> = {};

            const fallbackDateTime = new Date().toISOString();

            // Update records in primary DynamoDB table. Also do preparations for
            // subsequent updates on DDB-ES DynamoDB table, and in Elasticsearch.
            for (const item of result.items) {
                const isFullyMigrated =
                    isMigratedEntry(item) &&
                    hasValidTypeFieldValue(item) &&
                    hasAllNonNullableValues(item);

                if (isFullyMigrated) {
                    status.stats.recordsSkipped++;
                    continue;
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

                ddbItemsToBatchWrite.push(ddbEntryEntity.putBatch(item));

                /**
                 * Prepare the loading of DynamoDB Elasticsearch part of the records.
                 */

                const ddbEsLatestRecordKey = `${item.entryId}:L`;
                if (ddbEsItemsToBatchRead[ddbEsLatestRecordKey]) {
                    continue;
                }

                ddbEsItemsToBatchRead[ddbEsLatestRecordKey] = ddbEsEntryEntity.getBatch({
                    PK: item.PK,
                    SK: "L"
                });

                const ddbEsPublishedRecordKey = `${item.entryId}:P`;
                if (item.status === "published" || !!item.locked) {
                    ddbEsItemsToBatchRead[ddbEsPublishedRecordKey] = ddbEsEntryEntity.getBatch({
                        PK: item.PK,
                        SK: "P"
                    });
                }
            }

            if (Object.keys(ddbEsItemsToBatchRead).length > 0) {
                /**
                 * Get all the records from DynamoDB Elasticsearch.
                 */
                const ddbEsRecords = await batchReadAll<DynamoDbElasticsearchRecord>({
                    table: ddbEsEntryEntity.table,
                    items: Object.values(ddbEsItemsToBatchRead)
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

                    ddbEsItemsToBatchWrite.push(
                        ddbEsEntryEntity.putBatch({
                            ...ddbEsRecord,
                            data: compressedData
                        })
                    );
                }
            }

            if (ddbItemsToBatchWrite.length) {
                // Store data in primary DynamoDB table.
                const execute = () => {
                    return batchWriteAll({
                        table: ddbEntryEntity.table,
                        items: ddbItemsToBatchWrite
                    });
                };

                logger.trace(
                    `Storing ${ddbItemsToBatchWrite.length} record(s) in primary DynamoDB table...`
                );
                await executeWithRetry(execute, {
                    onFailedAttempt: error => {
                        logger.warn(
                            `Batch write attempt #${error.attemptNumber} failed: ${error.message}`
                        );
                    }
                });

                if (ddbEsItemsToBatchWrite.length) {
                    logger.trace(
                        `Storing ${ddbEsItemsToBatchWrite.length} record(s) in DDB-ES DynamoDB table...`
                    );
                    await waitUntilHealthy.wait({
                        async onUnhealthy(params) {
                            logger.warn(
                                `Cluster is unhealthy (${params.shouldWaitReason}). Waiting for the cluster to become healthy...`,
                                params
                            );
                        }
                    });

                    // Store data in DDB-ES DynamoDB table.
                    const executeDdbEs = () => {
                        return batchWriteAll({
                            table: ddbEsEntryEntity.table,
                            items: ddbEsItemsToBatchWrite
                        });
                    };

                    await executeWithRetry(executeDdbEs, {
                        onFailedAttempt: error => {
                            logger.warn(
                                `[DDB-ES Table] Batch write attempt #${error.attemptNumber} failed: ${error.message}`
                            );
                        }
                    });
                }

                status.stats.recordsUpdated += ddbItemsToBatchWrite.length;
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

    // Store status in tmp file.
    logger.trace({ status }, "Segment processing completed. Saving status to tmp file...");
    const logFilePath = path.join(
        os.tmpdir(),
        `webiny-5-39-6-meta-fields-data-migration-log-${argv.runId}-${argv.segmentIndex}.log`
    );

    // Save segment processing stats to a file.
    fs.writeFileSync(logFilePath, JSON.stringify(status.stats, null, 2));

    logger.trace(`Segment processing stats saved in ${logFilePath}.`);
})();
