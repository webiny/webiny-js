import { OpenSearchTenantIndexFactory } from "@webiny/api-elasticsearch-tasks";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { configurations } from "~/configurations.js";
import type { CmsContext } from "~/types.js";
import { CmsEntryOpenSearchIndex } from "~/features/CmsEntryOpenSearchIndex/index.js";

class CreateElasticsearchIndexTask implements OpenSearchTenantIndexFactory.Interface {
    constructor(
        private context: CmsContext,
        private listModels: ListModelsUseCase.Interface
    ) {}

    async getIndexList(tenant: Tenant): Promise<OpenSearchTenantIndexFactory.IndexConfig[]> {
        const result = await this.listModels.execute();
        const models = result.value;

        if (models.length === 0) {
            return [];
        }

        const indexConfigs = this.context.container.resolveAll(CmsEntryOpenSearchIndex);

        const indexes = models.map<OpenSearchTenantIndexFactory.IndexConfig>(model => {
            const { index } = configurations.es({
                model: {
                    modelId: model.modelId,
                    tenant: tenant.id
                }
            });
            return {
                index,
                settings: configurations.indexSettings({
                    indexConfigs,
                    model: {
                        modelId: model.modelId,
                        tenant: tenant.id,
                        group: model.group
                    }
                })
            };
        });

        return indexes;
    }
}

export const createCreateIndexTask = (context: CmsContext) => {
    context.container.registerFactory(OpenSearchTenantIndexFactory, () => {
        const listModels = context.container.resolve(ListModelsUseCase);
        return new CreateElasticsearchIndexTask(context, listModels);
    });
};
