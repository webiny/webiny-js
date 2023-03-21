import { Table } from "dynamodb-toolbox";
import { makeInjectable, inject } from "@webiny/ioc";
import { DataMigrationContext, PrimaryDynamoTableSymbol } from "@webiny/data-migration";
import { queryAll, batchWriteAll } from "~/utils";
import { createModelEntity } from "./createModelEntity";
import { createTenantEntity } from "./createTenantEntity";
import { createLocaleEntity } from "./createLocaleEntity";
import { Tenant, I18NLocale, CmsModel } from "./types";
import { createModelPartitionKey } from "~/migrations/5.35.0/005/createModelPartitionKey";
import { createLocalePartitionKey } from "~/migrations/5.35.0/005/createLocalePartitionKey";
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

    private models?: CmsModel[];

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
        const models = await this.listTenantAndLocaleModels();
        if (models.length === 0) {
            logger.info(`No models found in any tenant and locale; skipping migration.`);
            return false;
        }
        return true;
    }

    public async execute({ logger }: DataMigrationContext): Promise<void> {
        const models = await this.listTenantAndLocaleModels();
        if (models.length === 0) {
            logger.info(`No models to updated; skipping migration.`);
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

    private async listTenantAndLocaleModels(): Promise<CmsModel[]> {
        if (this.hasModels()) {
            return this.getModels();
        }
        const items: CmsModel[] = [];
        const tenants = await this.listTenants();
        for (const tenant of tenants) {
            const locales = await this.listLocales({ tenant });
            for (const locale of locales) {
                const models = await this.listModels({ tenant, locale });
                for (const model of models) {
                    /**
                     * Only add models which need to be updated.
                     */
                    if (!model.singularApiName || !model.pluralApiName) {
                        items.push(model);
                    }
                }
            }
        }
        this.setModels(items);
        return items;
    }

    private getModels(): CmsModel[] {
        if (!this.models) {
            throw new Error("Method should never be called without listing models first.");
        }
        return this.models;
    }

    private setModels(models: CmsModel[]): void {
        this.models = models;
    }

    private hasModels(): boolean {
        return !!this.models;
    }
}

makeInjectable(CmsModels_5_35_0_005, [inject(PrimaryDynamoTableSymbol)]);
