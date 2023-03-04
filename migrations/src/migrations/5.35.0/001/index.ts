import { Table } from "dynamodb-toolbox";
import { DataMigration, Logger, PrimaryDynamoTableSymbol } from "@webiny/data-migration";
import { makeInjectable, inject } from "@webiny/ioc";
import {
    createStandardEntity,
    queryOne,
    queryAll,
    queryAllWithCallback,
    batchWriteAll
} from "~/utils";
import { createLegacyFileEntity, getFileData } from "./createLegacyFileEntity";
import { createLocaleEntity } from "./createLocaleEntity";
import { createTenantEntity } from "./createTenantEntity";

export class FileManager_5_35_0_001 implements DataMigration {
    private readonly newFileEntity: ReturnType<typeof createStandardEntity>;
    private readonly legacyFileEntity: ReturnType<typeof createLegacyFileEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;

    constructor(table: Table) {
        this.newFileEntity = createStandardEntity(table, "File");
        this.legacyFileEntity = createLegacyFileEntity(table);
        this.tenantEntity = createTenantEntity(table);
        this.localeEntity = createLocaleEntity(table);
    }

    getId(): string {
        return "5.35.0-001";
    }

    getDescription(): string {
        return "Migrate partition key to use file ID as part of the PK";
    }

    async shouldExecute(logger: Logger): Promise<boolean> {
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
        const oldFile = await queryOne<{ id: string }>({
            entity: this.legacyFileEntity,
            partitionKey: PK,
            options: { gt: " " }
        });

        if (!oldFile) {
            logger.info(`No applicable files were found to migrate.`);
            return false;
        }

        if (oldFile) {
            // Check if there's a corresponding new file for the same file ID
            const newFile = await queryOne({
                entity: this.newFileEntity,
                partitionKey: `T#root#L#${defaultLocale.code}#FM#FILE#${oldFile.id}`,
                options: {
                    eq: "A"
                }
            });

            if (newFile) {
                logger.info(`All files seem to be in order.`);
                return false;
            }
        }

        return true;
    }

    async execute(logger: Logger): Promise<void> {
        const tenants = await queryAll<{ id: string }>({
            entity: this.tenantEntity,
            partitionKey: "TENANTS",
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        for (const tenant of tenants) {
            const locales = await queryAll<{ code: string }>({
                entity: this.localeEntity,
                partitionKey: `T#${tenant.id}#I18N#L`,
                options: {
                    gt: " "
                }
            });

            for (const locale of locales) {
                let batch = 0;
                await queryAllWithCallback<{ id: string }>(
                    {
                        entity: this.legacyFileEntity,
                        partitionKey: `T#${tenant.id}#L#${locale.code}#FM#F`,
                        options: {
                            gt: " "
                        }
                    },
                    async files => {
                        batch++;
                        logger.info(`Processing batch #${batch} (${files.length} files).`);
                        const items = files.map(file => {
                            return this.newFileEntity.putBatch({
                                PK: `T#${tenant.id}#L#${locale.code}#FM#FILE#${file.id}`,
                                SK: "A",
                                GSI1_PK: `T#${tenant.id}#L#${locale.code}#FM#FILES`,
                                GSI1_SK: file.id,
                                TYPE: "fm.file",
                                data: getFileData(file)
                            });
                        });

                        await batchWriteAll({ table: this.newFileEntity.table, items });
                    }
                );
            }
        }
    }
}

makeInjectable(FileManager_5_35_0_001, [inject(PrimaryDynamoTableSymbol)]);
