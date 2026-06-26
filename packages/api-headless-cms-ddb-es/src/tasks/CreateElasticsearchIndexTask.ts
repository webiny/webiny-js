import { OpenSearchTenantIndexFactory } from "@webiny/api-elasticsearch-tasks";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { configurations } from "~/configurations.js";
import { CmsEntryOpenSearchIndex } from "~/features/CmsEntryOpenSearchIndex/index.js";

class CreateElasticsearchIndexTaskImpl implements OpenSearchTenantIndexFactory.Interface {
    constructor(
        private readonly indexConfigs: CmsEntryOpenSearchIndex.Interface[],
        private listModels: ListModelsUseCase.Interface
    ) {}

    async getIndexList(tenant: Tenant): Promise<OpenSearchTenantIndexFactory.IndexConfig[]> {
        const result = await this.listModels.execute();
        const models = result.value;

        if (models.length === 0) {
            return [];
        }

        return models.map<OpenSearchTenantIndexFactory.IndexConfig>(model => {
            const { index } = configurations.es({
                model: {
                    modelId: model.modelId,
                    tenant: tenant.id
                }
            });
            return {
                index,
                settings: configurations.indexSettings({
                    indexConfigs: this.indexConfigs,
                    model: {
                        modelId: model.modelId,
                        tenant: tenant.id,
                        group: model.group
                    }
                })
            };
        });
    }
}

export const CreateElasticsearchIndexTask = OpenSearchTenantIndexFactory.createImplementation({
    implementation: CreateElasticsearchIndexTaskImpl,
    dependencies: [[CmsEntryOpenSearchIndex, { multiple: true }], ListModelsUseCase]
});
