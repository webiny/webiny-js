import { executeWithRetry } from "@webiny/utils";
import { createPinoLogger, getLogLevel } from "@webiny/logger";
import { createTable } from "@webiny/data-migration";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { CmsEntry } from "~/migrations/5.39.0/001/types";
import {
    createDdbEntryEntity,
    createDdbEsEntryEntity
} from "~/migrations/5.39.0/001/entities/createEntryEntity";
import { batchWriteAll, BatchWriteItem, ddbScanWithCallback } from "~/utils";
import pinoPretty from "pino-pretty";

const argv = yargs(hideBin(process.argv))
    .options({
        ddbTable: { type: "string", demandOption: true },
        ddbEsTable: { type: "string", demandOption: true },
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

interface MigrationStatus {
    lastEvaluatedKey: LastEvaluatedKey;
    iterationsCount: number;
    recordsScanned: number;
    recordsUpdated: number;
    recordsSkipped: number;
}

const createInitialStatus = (): MigrationStatus => {
    return {
        lastEvaluatedKey: null,
        iterationsCount: 0,
        recordsScanned: 0,
        recordsUpdated: 0,
        recordsSkipped: 0
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

            logger.trace(`Reading ${result.items.length} record(s)...`);
            const ddbItemsToBatchDelete: BatchWriteItem[] = [];
            const ddbEsItemsToBatchDelete: BatchWriteItem[] = [];
            const ddbEsItemsToPutIntoBatchDelete: Record<string, any> = {};

            for (const item of result.items) {
                ddbItemsToBatchDelete.push(ddbEntryEntity.deleteBatch(item));

                /**
                 * Prepare the loading of DynamoDB Elasticsearch part of the records.
                 */

                const ddbEsLatestRecordKey = `${item.entryId}:L`;
                if (ddbEsItemsToPutIntoBatchDelete[ddbEsLatestRecordKey]) {
                    continue;
                }

                ddbEsItemsToPutIntoBatchDelete[ddbEsLatestRecordKey] = {
                    PK: item.PK,
                    SK: "L"
                };

                const ddbEsPublishedRecordKey = `${item.entryId}:P`;
                if (item.status === "published" || !!item.locked) {
                    ddbEsItemsToPutIntoBatchDelete[ddbEsPublishedRecordKey] = {
                        PK: item.PK,
                        SK: "P"
                    };
                }
            }

            if (Object.keys(ddbEsItemsToPutIntoBatchDelete).length > 0) {
                Object.values(ddbEsItemsToPutIntoBatchDelete).forEach(item => {
                    ddbEsItemsToBatchDelete.push(ddbEsEntryEntity.deleteBatch(item));
                });
            }

            if (ddbItemsToBatchDelete.length) {
                // Store data in primary DynamoDB table.
                const execute = () => {
                    return batchWriteAll({
                        table: ddbEntryEntity.table,
                        items: ddbItemsToBatchDelete
                    });
                };

                logger.trace(
                    `Deleting ${ddbItemsToBatchDelete.length} record(s) in primary DynamoDB table...`
                );
                await executeWithRetry(execute, {
                    onFailedAttempt: error => {
                        logger.warn(
                            `Batch delete attempt #${error.attemptNumber} failed: ${error.message}`
                        );
                    }
                });

                if (ddbEsItemsToBatchDelete.length) {
                    logger.trace(
                        `Deleting ${ddbEsItemsToBatchDelete.length} record(s) in DDB-ES DynamoDB table...`
                    );

                    // Store data in DDB-ES DynamoDB table.
                    const executeDdbEs = () => {
                        return batchWriteAll({
                            table: ddbEsEntryEntity.table,
                            items: ddbEsItemsToBatchDelete
                        });
                    };

                    await executeWithRetry(executeDdbEs, {
                        onFailedAttempt: error => {
                            logger.warn(
                                `[DDB-ES Table] Batch delete attempt #${error.attemptNumber} failed: ${error.message}`
                            );
                        }
                    });
                }

                status.recordsUpdated += ddbItemsToBatchDelete.length;
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

    logger.trace({ status }, "Segment processing completed.");
})();
