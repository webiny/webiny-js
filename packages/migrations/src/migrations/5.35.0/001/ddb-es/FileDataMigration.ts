import chunk from "lodash/chunk";
import { Table } from "@webiny/db-dynamodb/toolbox";
import { Client } from "@elastic/elasticsearch";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { executeWithRetry } from "@webiny/utils";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import {
    createStandardEntity,
    queryOne,
    queryAll,
    batchWriteAll,
    esQueryAllWithCallback,
    esGetIndexName
} from "~/utils";
import { createFileEntity, getFileData, legacyAttributes } from "../entities/createFileEntity";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";
import { File } from "../types";

type FileMigrationCheckpoint = Record<string, PrimitiveValue[] | boolean | undefined>;

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export class FileManager_5_35_0_001_FileData implements DataMigration<FileMigrationCheckpoint> {
    private readonly elasticsearchClient: Client;
    private readonly newFileEntity: ReturnType<typeof createFileEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;

    constructor(table: Table<string, string, string>, elasticsearchClient: Client) {
        this.elasticsearchClient = elasticsearchClient;
        this.newFileEntity = createStandardEntity(table, "File", legacyAttributes);
        this.tenantEntity = createTenantEntity(table);
        this.localeEntity = createLocaleEntity(table);
    }

    getId() {
        return "FileData";
    }

    getDescription() {
        return "";
    }

    async shouldExecute({ logger, checkpoint }: DataMigrationContext): Promise<boolean> {
        if (checkpoint) {
            return true;
        }

        const defaultLocale = await queryOne<{ code: string }>({
            entity: this.localeEntity,
            partitionKey: `T#root#I18N#L#D`,
            options: {
                eq: "default"
            }
        });

        if (!defaultLocale) {
            logger.info(`Default locale not found; system is not yet installed.`);
            // The system is not yet installed, skip migration.
            return false;
        }

        // Check if there are files stored in the GSI1 index, which means files are already migrated.
        const PK = `T#root#L#${defaultLocale.code}#FM#FILES`;
        const newFile = await queryOne<{ id: string }>({
            entity: this.newFileEntity,
            partitionKey: PK,
            options: { gt: " ", index: "GSI1" }
        });

        if (newFile) {
            logger.info(`Looks like files have already been migrated. Skipping migration.`);
            return false;
        }

        return true;
    }

    async execute({
        logger,
        ...context
    }: DataMigrationContext<FileMigrationCheckpoint>): Promise<void> {
        const tenants = await queryAll<{ id: string }>({
            entity: this.tenantEntity,
            partitionKey: "TENANTS",
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        const migrationStatus: FileMigrationCheckpoint = context.checkpoint || {};

        for (const tenant of tenants) {
            const locales = await queryAll<{ code: string }>({
                entity: this.localeEntity,
                partitionKey: `T#${tenant.id}#I18N#L`,
                options: {
                    gt: " "
                }
            });

            for (const locale of locales) {
                const groupId = `${tenant.id}:${locale.code}`;
                const status = migrationStatus[groupId];

                if (isGroupMigrationCompleted(status)) {
                    continue;
                }

                let batch = 0;
                await esQueryAllWithCallback<File>({
                    elasticsearchClient: this.elasticsearchClient,
                    index: esGetIndexName({
                        tenant: tenant.id,
                        locale: locale.code,
                        type: "file-manager"
                    }),
                    body: {
                        query: {
                            bool: {
                                filter: [
                                    { term: { "tenant.keyword": tenant.id } },
                                    { term: { "locale.keyword": locale.code } }
                                ]
                            }
                        },
                        size: 10000,
                        sort: [
                            {
                                "id.keyword": "asc"
                            }
                        ],
                        search_after: status
                    },
                    callback: async (files, cursor) => {
                        batch++;
                        logger.info(
                            `Processing batch #${batch} in group ${groupId} (${files.length} files).`
                        );
                        const items = files.map(file => {
                            return this.newFileEntity.putBatch({
                                PK: `T#${tenant.id}#L#${locale.code}#FM#F${file.id}`,
                                SK: "A",
                                GSI1_PK: `T#${tenant.id}#L#${locale.code}#FM#FILES`,
                                GSI1_SK: file.id,
                                TYPE: "fm.file",
                                ...getFileData(file),
                                data: {
                                    ...getFileData(file),
                                    webinyVersion: process.env.WEBINY_VERSION
                                }
                            });
                        });

                        const execute = () => {
                            return Promise.all(
                                chunk(items, 200).map(fileChunk => {
                                    return batchWriteAll({
                                        table: this.newFileEntity.table,
                                        items: fileChunk
                                    });
                                })
                            );
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
                        migrationStatus[groupId] = cursor;

                        // Check if we should store checkpoint and exit.
                        if (context.runningOutOfTime()) {
                            await context.createCheckpointAndExit(migrationStatus);
                        } else {
                            await context.createCheckpoint(migrationStatus);
                        }
                    }
                });

                migrationStatus[groupId] = true;
                await context.createCheckpoint(migrationStatus);
            }
        }
    }
}
