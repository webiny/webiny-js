import { Table } from "dynamodb-toolbox";
import { makeInjectable, inject } from "@webiny/ioc";
import { DataMigrationContext, PrimaryDynamoTableSymbol } from "@webiny/data-migration";
import { queryOne, queryAll } from "~/utils";
import { createModelEntity } from "./createModelEntity";
import { createTenantEntity } from "./createTenantEntity";
import { createLocaleEntity } from "./createLocaleEntity";
import { Tenant, I18NLocale, CmsModel } from "./types";
import { createModelPartitionKey } from "~/migrations/5.35.0/005/createModelPartitionKey";
import { createLocalePartitionKey } from "~/migrations/5.35.0/005/createLocalePartitionKey";

interface ListLocalesParams {
    tenant: Tenant;
}

interface ListModelsParams {
    tenant: Tenant;
    locale: I18NLocale;
}

export class CmsModels_5_35_0_005 {
    private readonly modelEntity: ReturnType<typeof createModelEntity>;
    private readonly tenantEntity: ReturnType<typeof createTenantEntity>;
    private readonly localeEntity: ReturnType<typeof createLocaleEntity>;

    public constructor(table: Table) {
        this.modelEntity = createModelEntity(table);
        this.tenantEntity = createTenantEntity(table);
        this.localeEntity = createLocaleEntity(table);
    }

    public getId() {
        return "5.35.0-005";
    }

    public getDescription() {
        return "Add singular and plural API names to the CMS Model entity";
    }

    public async shouldExecute({ logger }: DataMigrationContext): Promise<boolean> {
        const tenants = await this.listTenants();
        if (tenants.length === 0) {
            logger.info(`No tenants were found; skipping migration.`);
            return false;
        }

        for (const tenant of tenants) {
            const locales = await this.listLocales({ tenant });
            if (locales.length === 0) {
                logger.info(`No locales found in tenant "${tenant.name || tenant.id}".`);
                continue;
            }
            for (const locale of locales) {
                const models = await this.listModels({
                    tenant,
                    locale
                });
                if (models.length === 0) {
                    logger.info(
                        `No models found for tenant "${tenant.name || tenant.id}" and locale "${
                            locale.code
                        }".`
                    );
                    continue;
                }
            }
        }

        const models = await queryAll<CmsModel>({
            entity: this.modelEntity,
            partitionKey: "T"
        });

        const tenant = await queryOne<{ data: any }>({
            entity: this.modelEntity,
            partitionKey: `TENANTS`,
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        if (!tenant) {
            logger.info(`No tenants were found; skipping migration.`);
            return false;
        }

        if (tenant.data) {
            logger.info(`Tenant records seems to be in order; skipping migration.`);
            return false;
        }

        return true;
    }

    public async execute({ logger }: DataMigrationContext): Promise<void> {
        const tenants = await queryAll<{ id: string; name: string }>({
            entity: this.modelEntity,
            partitionKey: "TENANTS",
            options: {
                index: "GSI1",
                gt: " "
            }
        });

        for (const tenant of tenants) {
            logger.info(`Updating tenant ${tenant.name} (${tenant.id}).`);
            await this.newTenantEntity.put({
                PK: `T#${tenant.id}`,
                SK: "A",
                GSI1_PK: tenant.GSI1_PK,
                GSI1_SK: tenant.GSI1_SK,
                TYPE: tenant.TYPE,
                ...getTenantData(tenant),
                // Move all data to a `data` envelope
                data: getTenantData(tenant)
            });
        }
    }

    private async listTenants(): Promise<Tenant[]> {
        return await queryAll<Tenant>({
            entity: this.tenantEntity,
            partitionKey: "TENANTS",
            options: {
                index: "GSI1",
                gte: " "
            }
        });
    }

    private async listLocales({ tenant }: ListLocalesParams): Promise<I18NLocale[]> {
        return await queryAll<I18NLocale>({
            entity: this.localeEntity,
            partitionKey: createLocalePartitionKey({ tenant }),
            options: {
                gte: " "
            }
        });
    }

    private async listModels({ tenant, locale }: ListModelsParams): Promise<CmsModel[]> {
        return await queryAll<CmsModel>({
            entity: this.modelEntity,
            partitionKey: createModelPartitionKey({
                tenant,
                locale
            }),
            options: {
                gte: " "
            }
        });
    }
}

makeInjectable(CmsModels_5_35_0_005, [inject(PrimaryDynamoTableSymbol)]);
