import { TenantIndexFactory } from "@webiny/api-search-index-tasks";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CmsModelOpenSearchIndexProvider } from "~/features/CmsModelOpenSearchIndex/index.js";
import { createConfigurations } from "~/configurations.js";

class CreateElasticsearchIndexTaskImpl implements TenantIndexFactory.Interface {
    constructor(
        private readonly indexProvider: CmsModelOpenSearchIndexProvider.Interface,
        private listModels: ListModelsUseCase.Interface
    ) {}

    async getIndexList(
        tenant: TenantIndexFactory.Tenant
    ): Promise<TenantIndexFactory.IndexConfig[]> {
        const result = await this.listModels.execute();
        const models = result.value;

        if (models.length === 0) {
            return [];
        }

        const configurations = createConfigurations(this.indexProvider);

        const indices: TenantIndexFactory.IndexConfig[] = [];
        for (const model of models) {
            const { index, settings } = await configurations.es({
                model: {
                    ...model,
                    tenant: tenant.id
                }
            });
            indices.push({ index, settings });
        }
        return indices;
    }
}

export const CreateElasticsearchIndexTask = TenantIndexFactory.createImplementation({
    implementation: CreateElasticsearchIndexTaskImpl,
    dependencies: [CmsModelOpenSearchIndexProvider, ListModelsUseCase]
});
