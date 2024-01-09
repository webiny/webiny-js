import { Table } from "@webiny/db-dynamodb/toolbox";
import { inject, makeInjectable } from "@webiny/ioc";
import { executeWithRetry } from "@webiny/utils";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import {
    DataMigration,
    DataMigrationContext,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { S3 } from "@webiny/aws-sdk/client-s3";
import { batchWriteAll, ddbQueryAllWithCallback, forEachTenantLocale, queryOne } from "~/utils";
import { createDdbEntryEntity } from "../entities/createEntryEntity";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export class FileManager_5_39_0_005 implements DataMigration {
    private readonly fileEntity: ReturnType<typeof createDdbEntryEntity>;
    private readonly table: Table<string, string, string>;
    private readonly bucket: string;
    private s3: S3;

    constructor(table: Table<string, string, string>) {
        this.table = table;
        this.fileEntity = createDdbEntryEntity(table);
        this.s3 = new S3({ region: process.env.AWS_REGION });
        this.bucket = String(process.env.S3_BUCKET);
    }

    getId() {
        return "5.39.0-005";
    }

    getDescription() {
        return "Generate a metadata file for every File Manager file.";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        let shouldExecute = false;

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                const latestFile = await queryOne({
                    entity: this.fileEntity,
                    partitionKey: `T#${tenantId}#L#${localeCode}#CMS#CME#M#fmFile#L`,
                    options: {
                        index: "GSI1",
                        gt: " "
                    }
                });

                if (!latestFile) {
                    return false;
                }

                const hasMetadata = await this.fileHasMetadata(latestFile);

                if (!hasMetadata) {
                    shouldExecute = true;
                    return false;
                }

                // Continue to the next tenant/locale.
                return true;
            }
        });

        return shouldExecute;
    }

    async execute({ logger, ...context }: DataMigrationContext): Promise<void> {
        const migrationStatus = context.checkpoint || {};

        let batch = 0;

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                const groupId = `${tenantId}:${localeCode}`;
                const status = migrationStatus[groupId];

                if (isGroupMigrationCompleted(status)) {
                    return true;
                }

                await ddbQueryAllWithCallback<PbPageBlock>(
                    {
                        entity: this.oldPageBlockEntity,
                        partitionKey: `T#${tenantId}#L#${localeCode}#PB#B`,
                        options: {
                            gt: status || " "
                        }
                    },
                    async oldBlocks => {
                        batch++;

                        logger.info(
                            `Processing batch #${batch} in group ${groupId} (${oldBlocks.length} blocks).`
                        );

                        const items = await Promise.all(
                            oldBlocks.map(async oldBlock => {
                                const newPageBlock = {
                                    ...oldBlock,
                                    PK: `T#${tenantId}#L#${localeCode}#PB#BLOCK#${oldBlock.id}`,
                                    SK: "A",
                                    GSI1_PK: `T#${tenantId}#L#${localeCode}#PB#BLOCKS`,
                                    // We need the ability to filter by category slug, and `id` is for uniqueness.
                                    GSI1_SK: `${oldBlock.blockCategory}#${oldBlock.id}`,
                                    content: await compressContent(oldBlock.content)
                                };

                                // We no longer have a `preview`.
                                delete newPageBlock["preview"];

                                return this.newPageBlockEntity.putBatch(newPageBlock);
                            })
                        );

                        const execute = () => {
                            return batchWriteAll({ table: this.newPageBlockEntity.table, items });
                        };

                        await executeWithRetry(execute, {
                            onFailedAttempt: error => {
                                logger.error(
                                    `"batchWriteAll" attempt #${error.attemptNumber} failed.`
                                );
                                logger.error(error.message);
                            }
                        });

                        // Update checkpoint after every batch
                        migrationStatus[groupId] = oldBlocks[oldBlocks.length - 1]?.id;

                        // Check if we should store checkpoint and exit.
                        if (context.runningOutOfTime()) {
                            await context.createCheckpointAndExit(migrationStatus);
                        } else {
                            await context.createCheckpoint(migrationStatus);
                        }
                    }
                );

                // Mark group as completed.
                migrationStatus[groupId] = true;

                // Store checkpoint.
                await context.createCheckpoint(migrationStatus);

                // Continue processing.
                return true;
            }
        });
    }

    private async fileHasMetadata(fileEntry: Record<string, any>): Promise<boolean> {
        const fileKey = fileEntry.values["text@key"] as string;
        const metadataKey = `${fileKey}.metadata`;

        try {
            await this.s3.headObject({ Bucket: this.bucket, Key: metadataKey });
            return true;
        } catch (error) {
            console.log(JSON.stringify(error, null, 2));
            return false;
        }
    }
}

makeInjectable(FileManager_5_39_0_005, [inject(PrimaryDynamoTableSymbol)]);
