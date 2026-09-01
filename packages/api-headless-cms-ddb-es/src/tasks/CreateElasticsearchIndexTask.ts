import { OpenSearchTenantIndexFactory } from "@webiny/api-elasticsearch-tasks";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CmsModelOpenSearchIndexProvider } from "~/features/CmsModelOpenSearchIndex/index.js";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";

class CreateElasticsearchIndexTaskImpl implements OpenSearchTenantIndexFactory.Interface {
    constructor(
        private readonly indexProvider: CmsModelOpenSearchIndexProvider.Interface,
        private listModels: ListModelsUseCase.Interface
    ) {}

    async getIndexList(tenant: Tenant): Promise<OpenSearchTenantIndexFactory.IndexConfig[]> {
        const result = await this.listModels.execute();
        const models = result.value;

        if (models.length === 0) {
            return [];
        }

        const prefix = getOpenSearchIndexPrefix();
        const configs: OpenSearchTenantIndexFactory.IndexConfig[] = [];

        for (const model of models) {
            const { index, settings } = await this.indexProvider.execute({
                model: {
                    ...model,
                    tenant: tenant.id
                }
            });

            configs.push({
                index: prefix ? prefix + index : index,
                settings
            });
        }

        return configs;
    }
}

export const CreateElasticsearchIndexTask = OpenSearchTenantIndexFactory.createImplementation({
    implementation: CreateElasticsearchIndexTaskImpl,
    dependencies: [CmsModelOpenSearchIndexProvider, ListModelsUseCase]
});
