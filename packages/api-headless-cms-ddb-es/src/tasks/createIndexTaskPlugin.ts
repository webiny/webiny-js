import { OpensearchTenantIndexFactory } from "@webiny/api-elasticsearch-tasks";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CmsModelOpenSearchIndexProvider } from "~/features/CmsModelOpenSearchIndex/index.js";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";
import type { CmsContext } from "~/types.js";

class CreateElasticsearchIndexTask implements OpensearchTenantIndexFactory.Interface {
    constructor(
        private listModels: ListModelsUseCase.Interface,
        private indexProvider: CmsModelOpenSearchIndexProvider.Interface
    ) {}

    async getIndexList(_tenant: Tenant): Promise<OpensearchTenantIndexFactory.IndexConfig[]> {
        const result = await this.listModels.execute();
        const models = result.value;

        if (models.length === 0) {
            return [];
        }

        const prefix = getOpenSearchIndexPrefix();

        const indexes = await Promise.all(
            models.map(async model => {
                const { index, settings } = await this.indexProvider.execute({ model });
                return {
                    index: prefix ? prefix + index : index,
                    settings
                };
            })
        );

        return indexes;
    }
}

export const createCreateIndexTask = (context: CmsContext) => {
    context.container.registerFactory(OpensearchTenantIndexFactory, () => {
        const listModels = context.container.resolve(ListModelsUseCase);
        const indexProvider = context.container.resolve(CmsModelOpenSearchIndexProvider);
        return new CreateElasticsearchIndexTask(listModels, indexProvider);
    });
};
