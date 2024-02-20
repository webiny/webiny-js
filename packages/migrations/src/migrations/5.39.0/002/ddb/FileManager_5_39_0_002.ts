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
import { QueryAllParams } from "@webiny/db-dynamodb";
import { ddbQueryAllWithCallback, forEachTenantLocale, queryOne } from "~/utils";
import { createFileEntity, FileEntry } from "../utils/createFileEntity";
import { FileMetadata } from "../utils/FileMetadata";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export class FileManager_5_39_0_002 implements DataMigration {
    private readonly fileEntity: ReturnType<typeof createFileEntity>;
    private readonly table: Table<string, string, string>;
    private readonly bucket: string;
    private readonly s3: S3;

    constructor(table: Table<string, string, string>) {
        this.table = table;
        this.fileEntity = createFileEntity(table);
        this.s3 = new S3({ region: process.env.AWS_REGION });
        this.bucket = String(process.env.S3_BUCKET);
    }

    getId() {
        return "5.39.0-002";
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
                const latestFile = await queryOne<FileEntry>(
                    this.getFileQuery(tenantId, localeCode)
                );

                if (!latestFile) {
                    return false;
                }

                const fileMetadata = new FileMetadata(this.s3, this.bucket, latestFile);

                const hasMetadata = await fileMetadata.exists();

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

                await ddbQueryAllWithCallback<FileEntry>(
                    this.getFileQuery(tenantId, localeCode, { gt: status || " ", limit: 1000 }),
                    async files => {
                        batch++;

                        logger.info(
                            `Processing batch #${batch} in group ${groupId} (${files.length} files).`
                        );

                        const writers = files.map(file => {
                            const fileMetadata = new FileMetadata(this.s3, this.bucket, file);
                            const writeMetadata = () => fileMetadata.create();

                            return executeWithRetry(writeMetadata, {
                                onFailedAttempt: error => {
                                    logger.error(
                                        `"batchWriteAll" attempt #${error.attemptNumber} failed.`
                                    );
                                    logger.error(error.message);
                                }
                            });
                        });

                        await Promise.all(writers);

                        // Update checkpoint after every batch
                        migrationStatus[groupId] = files[files.length - 1]?.id;

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

    private getFileQuery(
        tenantId: string,
        localeCode: string,
        options: QueryAllParams["options"] = {}
    ) {
        return {
            entity: this.fileEntity,
            partitionKey: `T#${tenantId}#L#${localeCode}#CMS#CME#M#fmFile#L`,
            options: {
                index: "GSI1",
                gt: " ",
                ...options
            }
        };
    }
}

makeInjectable(FileManager_5_39_0_002, [inject(PrimaryDynamoTableSymbol)]);
