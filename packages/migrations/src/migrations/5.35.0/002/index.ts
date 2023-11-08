import { Table } from "@webiny/db-dynamodb/toolbox";
import { DataMigrationContext, PrimaryDynamoTableSymbol } from "@webiny/data-migration";
import { queryAll, queryOne } from "~/utils";
import { createTenantEntity } from "./createTenantEntity";
import {
    createLegacySettingsEntity,
    createSettingsEntity,
    getSettingsData
} from "./createSettingsEntity";
import { createLocaleEntity } from "./createLocaleEntity";
import { inject, makeInjectable } from "@webiny/ioc";
import { put } from "@webiny/db-dynamodb";

export class PageBuilder_5_35_0_002 {
    private readonly newSettingsEntity: ReturnType<typeof createSettingsEntity>;
    private readonly legacySettingsEntity: ReturnType<typeof createLegacySettingsEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;

    constructor(table: Table<string, string, string>) {
        this.newSettingsEntity = createSettingsEntity(table);
        this.legacySettingsEntity = createLegacySettingsEntity(table);
        this.tenantEntity = createTenantEntity(table);
        this.localeEntity = createLocaleEntity(table);
    }

    getId() {
        return "5.35.0-002";
    }

    getDescription() {
        return "Move PB Settings attributes to a `data` envelope.";
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
            return false;
        }

        const settings = await queryOne({
            entity: this.legacySettingsEntity,
            partitionKey: `T#root#L#${defaultLocale.code}#PB#SETTINGS`,
            options: {
                eq: "default"
            }
        });

        if (!settings) {
            logger.info(`Settings not found; system is not yet installed.`);
            return false;
        }

        const newSettings = await queryOne({
            entity: this.newSettingsEntity,
            partitionKey: `T#root#L#${defaultLocale.code}#PB#SETTINGS`,
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
            const locales = await queryAll<{ code: string }>({
                entity: this.localeEntity,
                partitionKey: `T#${tenant.id}#I18N#L`,
                options: {
                    gt: " "
                }
            });

            for (const locale of locales) {
                const settings = await queryOne({
                    entity: this.legacySettingsEntity,
                    partitionKey: `T#${tenant.id}#L#${locale.code}#PB#SETTINGS`,
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

                logger.info(`Updating PB settings for tenant ${tenant.name} (${tenant.id}).`);
                await put({
                    entity: this.newSettingsEntity,
                    item: {
                        PK: `T#${tenant.id}#L#${locale.code}#PB#SETTINGS`,
                        SK: "A",
                        TYPE: "pb.settings",
                        data: {
                            ...getSettingsData(settings),
                            tenant: tenant.id
                        }
                    }
                });
            }
        }
    }
}

makeInjectable(PageBuilder_5_35_0_002, [inject(PrimaryDynamoTableSymbol)]);
