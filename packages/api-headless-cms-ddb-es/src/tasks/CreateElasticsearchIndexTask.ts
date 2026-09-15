import { OpenSearchTenantIndexFactory } from "@webiny/api-elasticsearch-tasks";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CmsModelOpenSearchIndexProvider } from "~/features/CmsModelOpenSearchIndex/index.js";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";
import { Logger } from "@webiny/api-core/exports/api/logger.js";

class CreateElasticsearchIndexTaskImpl implements OpenSearchTenantIndexFactory.Interface {
    constructor(
        private readonly indexProvider: CmsModelOpenSearchIndexProvider.Interface,
        private listModels: ListModelsUseCase.Interface,
        private readonly logger: Logger.Interface
    ) {}

    async getIndexList(tenant: Tenant): Promise<OpenSearchTenantIndexFactory.IndexConfig[]> {
        const result = await this.listModels.execute();
        if (result.isFail()) {
            this.logger.error(result.error);
            return [];
        }
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
    dependencies: [CmsModelOpenSearchIndexProvider, ListModelsUseCase, Logger]
});
