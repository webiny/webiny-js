import { Table } from "@webiny/db-dynamodb/toolbox";
import { makeInjectable, inject } from "@webiny/ioc";
import { DataMigrationContext, PrimaryDynamoTableSymbol } from "@webiny/data-migration";
import { queryAll, batchWriteAll } from "~/utils";
import { createModelEntity } from "./createModelEntity";
import { createTenantEntity } from "./createTenantEntity";
import { createLocaleEntity } from "./createLocaleEntity";
import { Tenant, I18NLocale, CmsModel } from "./types";
import pluralize from "pluralize";
import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";

const createSingularApiName = (model: CmsModel) => {
    return upperFirst(camelCase(model.modelId));
};

const createPluralApiName = (model: CmsModel) => {
    return pluralize(createSingularApiName(model));
};

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

    public constructor(table: Table<string, string, string>) {
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
            logger.info(`No tenants found in the system; skipping migration.`);
            return false;
        }
        for (const tenant of tenants) {
            const locales = await this.listLocales({ tenant });
            if (locales.length === 0) {
                logger.info(`No locales found in tenant "${tenant.data.id}".`);
                continue;
            }
            for (const locale of locales) {
                const models = (await this.listModels({ tenant, locale })).filter(model => {
                    return !model.singularApiName || !model.pluralApiName;
                });
                if (models.length === 0) {
                    logger.info(
                        `No models, to be updated, found in tenant "${tenant.data.id}" and locale "${locale.code}".`
                    );
                    continue;
                }
                return true;
            }
        }
        return false;
    }

    public async execute({ logger }: DataMigrationContext): Promise<void> {
        const models: CmsModel[] = [];
        const tenants = await this.listTenants();
        for (const tenant of tenants) {
            const locales = await this.listLocales({ tenant });
            for (const locale of locales) {
                const items = (await this.listModels({ tenant, locale })).filter(model => {
                    return !model.singularApiName || !model.pluralApiName;
                });
                models.push(...items);
            }
        }
        if (models.length === 0) {
            logger.info(`No models to be updated; skipping migration.`);
            return;
        }

        const items = models.map(model => {
            return this.modelEntity.putBatch({
                ...model,
                /**
                 * Add singular and plural API names.
                 */
                singularApiName: createSingularApiName(model),
                pluralApiName: createPluralApiName(model)
            });
        });
        logger.info(`Updating total of ${items.length} models.`);

        await batchWriteAll({
            table: this.modelEntity.table,
            items
        });
        logger.info("Updated all the models.");
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
            partitionKey: `T#${tenant.data.id}#I18N#L`,
            options: {
                gte: " "
            }
        });
    }

    private async listModels({ tenant, locale }: ListModelsParams): Promise<CmsModel[]> {
        return await queryAll<CmsModel>({
            entity: this.modelEntity,
            partitionKey: `T#${tenant.data.id}#L#${locale.code}#CMS#CM`,
            options: {
                gte: " "
            }
        });
    }
}

makeInjectable(CmsModels_5_35_0_005, [inject(PrimaryDynamoTableSymbol)]);
