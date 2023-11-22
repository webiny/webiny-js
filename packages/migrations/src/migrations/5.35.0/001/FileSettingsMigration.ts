import { Table } from "@webiny/db-dynamodb/toolbox";
import { DataMigrationContext } from "@webiny/data-migration";
import { createStandardEntity, queryAll, queryOne } from "~/utils";
import { createTenantEntity } from "./entities/createTenantEntity";
import {
    createLegacySettingsEntity,
    createSettingsEntity,
    getSettingsData
} from "./entities/createSettingsEntity";
import { put } from "@webiny/db-dynamodb";

export class FileManager_5_35_0_001_FileManagerSettings {
    private readonly newSettingsEntity: ReturnType<typeof createSettingsEntity>;
    private readonly legacySettingsEntity: ReturnType<typeof createLegacySettingsEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;

    constructor(table: Table<string, string, string>) {
        this.newSettingsEntity = createStandardEntity(table, "FM.Settings");
        this.legacySettingsEntity = createLegacySettingsEntity(table);
        this.tenantEntity = createTenantEntity(table);
    }

    getId() {
        return "FM Settings";
    }

    getDescription() {
        return "";
    }

    async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        const settings = await queryOne({
            entity: this.legacySettingsEntity,
            partitionKey: `T#root#FM#SETTINGS`,
            options: {
                eq: "default"
            }
        });

        if (!settings) {
            logger.info(`Settings not found; system is not yet installed.`);
            // The system is not yet installed, skip migration.
            return false;
        }

        const newSettings = await queryOne({
            entity: this.newSettingsEntity,
            partitionKey: `T#root#FM#SETTINGS`,
            options: {
                eq: "A"
            }
        });

        if (newSettings) {
            logger.info(`Settings record seems to be in order.`);
            return false;
        }

        return true;
    }

    async execute({ logger }: DataMigrationContext): Promise<void> {
        const tenants = await queryAll<{ id: string; name: string }>({
            entity: this.tenantEntity,
            partitionKey: "TENANTS",
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        for (const tenant of tenants) {
            const settings = await queryOne({
                entity: this.legacySettingsEntity,
                partitionKey: `T#${tenant.id}#FM#SETTINGS`,
                options: {
                    eq: "default"
                }
            });

            if (!settings) {
                // It's possible that a tenant exists, but it was not yet installed.
                logger.info(
                    `Tenant ${tenant.name} (${tenant.id}) is not installed. Skipping migration of settings.`
                );
                continue;
            }

            logger.info(`Updating FM settings for tenant ${tenant.name} (${tenant.id}).`);
            await put({
                entity: this.newSettingsEntity,
                item: {
                    PK: `T#${tenant.id}#FM#SETTINGS`,
                    SK: "A",
                    TYPE: "fm.settings",
                    data: {
                        ...getSettingsData(settings),
                        tenant: tenant.id
                    }
                }
            });
        }
    }
}
