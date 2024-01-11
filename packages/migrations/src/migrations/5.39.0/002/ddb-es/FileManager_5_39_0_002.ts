import { Client } from "@elastic/elasticsearch";
import { inject, makeInjectable } from "@webiny/ioc";
import { executeWithRetry } from "@webiny/utils";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import {
    DataMigration,
    DataMigrationContext,
    ElasticsearchClientSymbol,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { S3 } from "@webiny/aws-sdk/client-s3";
import { Table } from "@webiny/db-dynamodb/toolbox";
import {
    esQueryAllWithCallback,
    forEachTenantLocale,
    esFindOne,
    esGetIndexExist,
    esGetIndexName
} from "~/utils";
import { FileEntry } from "../utils/createFileEntity";
import { FileMetadata } from "../utils/FileMetadata";

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export class FileManager_5_39_0_002 implements DataMigration {
    private readonly elasticsearchClient: Client;
    private readonly bucket: string;
    private readonly s3: S3;
    private readonly table: Table<string, string, string>;

    constructor(table: Table<string, string, string>, elasticsearchClient: Client) {
        this.table = table;
        this.elasticsearchClient = elasticsearchClient;
        this.s3 = new S3({ region: process.env.AWS_REGION });
        this.bucket = String(process.env.S3_BUCKET);
    }

    getId() {
        return "5.39.0-002";
    }

    getDescription() {
        return "Generate a metadata file for every File Manager file.";
    }

    private getIndexParams(tenantId: string, localeCode: string) {
        return {
            tenant: tenantId,
            locale: localeCode,
            type: "fmFile",
            isHeadlessCmsModel: true
        };
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        let shouldExecute = false;

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                const indexExists = await esGetIndexExist({
                    elasticsearchClient: this.elasticsearchClient,
                    ...this.getIndexParams(tenantId, localeCode)
                });

                if (!indexExists) {
                    logger.info(
                        `No elasticsearch index found for File Manager in tenant "${tenantId}" and locale "${localeCode}".`
                    );
                    return true;
                }

                // Fetch the latest file record from ES
                const fmIndexName = esGetIndexName(this.getIndexParams(tenantId, localeCode));

                const latestFile = await esFindOne<FileEntry>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: fmIndexName,
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "tenant.keyword": tenantId } },
                                    { term: { "locale.keyword": localeCode } }
                                ]
                            }
                        },
                        sort: [
                            {
                                "id.keyword": { order: "desc", unmapped_type: "keyword" }
                            }
                        ]
                    }
                });

                if (!latestFile) {
                    logger.info(
                        `No files found in tenant "${tenantId}" and locale "${localeCode}".`
                    );
                    return true;
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

        await forEachTenantLocale({
            table: this.table,
            logger,
            callback: async ({ tenantId, localeCode }) => {
                const groupId = `${tenantId}:${localeCode}`;
                const status = migrationStatus[groupId];

                if (isGroupMigrationCompleted(status)) {
                    return true;
                }

                const esIndexName = esGetIndexName(this.getIndexParams(tenantId, localeCode));

                let batch = 0;
                await esQueryAllWithCallback<FileEntry>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: esIndexName,
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "tenant.keyword": tenantId } },
                                    { term: { "locale.keyword": localeCode } }
                                ]
                            }
                        },
                        size: 10000,
                        sort: [
                            {
                                "id.keyword": { order: "asc", unmapped_type: "keyword" }
                            }
                        ],
                        search_after: status
                    },
                    callback: async (files, cursor) => {
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
                        migrationStatus[groupId] = cursor;

                        // Check if we should store checkpoint and exit.
                        if (context.runningOutOfTime()) {
                            await context.createCheckpointAndExit(migrationStatus);
                        } else {
                            await context.createCheckpoint(migrationStatus);
                        }
                    }
                });

                // Mark group as completed.
                migrationStatus[groupId] = true;

                // Store checkpoint.
                await context.createCheckpoint(migrationStatus);

                // Continue processing.
                return true;
            }
        });
    }
}

makeInjectable(FileManager_5_39_0_002, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
