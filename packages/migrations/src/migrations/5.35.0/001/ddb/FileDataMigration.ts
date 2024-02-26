import { Table } from "@webiny/db-dynamodb/toolbox";
import { DataMigration, DataMigrationContext } from "@webiny/data-migration";
import { PrimitiveValue } from "@webiny/api-elasticsearch/types";
import { executeWithRetry } from "@webiny/utils";
import {
    createStandardEntity,
    queryOne,
    queryAll,
    ddbQueryAllWithCallback,
    batchWriteAll
} from "~/utils";
import {
    createFileEntity,
    getFileData,
    createLegacyFileEntity
} from "../entities/createFileEntity";
import { createLocaleEntity } from "../entities/createLocaleEntity";
import { createTenantEntity } from "../entities/createTenantEntity";

export type FileMigrationCheckpoint = Record<string, string | boolean | undefined>;

const isGroupMigrationCompleted = (
    status: PrimitiveValue[] | boolean | undefined
): status is boolean => {
    return typeof status === "boolean";
};

export class FileManager_5_35_0_001_FileData implements DataMigration<FileMigrationCheckpoint> {
    private readonly newFileEntity: ReturnType<typeof createFileEntity>;
    private readonly legacyFileEntity: ReturnType<typeof createLegacyFileEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;

    constructor(table: Table<string, string, string>) {
        this.newFileEntity = createStandardEntity(table, "File");
        this.legacyFileEntity = createLegacyFileEntity(table);
        this.tenantEntity = createTenantEntity(table);
        this.localeEntity = createLocaleEntity(table);
    }

    getId() {
        return "FileData";
    }

    getDescription() {
        return "";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
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

        // Check if there are file records using the old record structure
        const PK = `T#root#L#${defaultLocale.code}#FM#F`;
        const lastLegacyFile = await queryOne<{ id: string }>({
            entity: this.legacyFileEntity,
            partitionKey: PK,
            options: { gt: " ", reverse: true }
        });

        if (!lastLegacyFile) {
            logger.info(`No applicable files were found to migrate.`);
            return false;
        }

        if (lastLegacyFile) {
            // Check if there's a corresponding new file for the same file ID
            const lastNewFile = await queryOne({
                entity: this.newFileEntity,
                partitionKey: `T#root#L#${defaultLocale.code}#FM#FILE#${lastLegacyFile.id}`,
                options: {
                    eq: "A"
                }
            });

            if (lastNewFile) {
                logger.info(`All files seem to be in order.`);
                return false;
            }
        }

        return true;
    }

    async execute({ logger, ...context }: DataMigrationContext): Promise<void> {
        const tenants = await queryAll<{ id: string }>({
            entity: this.tenantEntity,
            partitionKey: "TENANTS",
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        const migrationStatus = context.checkpoint || {};

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
                await ddbQueryAllWithCallback<{ id: string }>(
                    {
                        entity: this.legacyFileEntity,
                        partitionKey: `T#${tenant.id}#L#${locale.code}#FM#F`,
                        options: {
                            gt: status || " "
                        }
                    },
                    async files => {
                        batch++;
                        logger.info(
                            `Processing batch #${batch} in group ${groupId} (${files.length} files).`
                        );
                        const items = files.map(file => {
                            return this.newFileEntity.putBatch({
                                PK: `T#${tenant.id}#L#${locale.code}#FM#FILE#${file.id}`,
                                SK: "A",
                                GSI1_PK: `T#${tenant.id}#L#${locale.code}#FM#FILES`,
                                GSI1_SK: file.id,
                                TYPE: "fm.file",
                                data: {
                                    ...getFileData(file),
                                    webinyVersion: process.env.WEBINY_VERSION
                                }
                            });
                        });

                        const execute = () => {
                            return batchWriteAll({ table: this.newFileEntity.table, items });
                        };

                        await executeWithRetry(execute, {
                            onFailedAttempt: error => {
                                logger.error(
                                    `"batchWriteAll" attempt #${error.attemptNumber} failed.`
                                );
                                logger.error(error.message);
                            }
                        });

                        const cursor = files[files.length - 1].id;

                        // Update checkpoint after every batch
                        migrationStatus[groupId] = cursor;

                        // Check if we should store checkpoint and exit.
                        if (context.runningOutOfTime()) {
                            await context.createCheckpointAndExit(migrationStatus);
                        } else {
                            await context.createCheckpoint(migrationStatus);
                        }
                    }
                );

                migrationStatus[groupId] = true;
                await context.createCheckpoint(migrationStatus);
            }
        }
    }
}
