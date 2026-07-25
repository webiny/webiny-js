import { TenantIndexFactory } from "@webiny/api-search-index-tasks";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import { CmsEntryOpenSearchIndex } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";

class CreateElasticsearchIndexTaskImpl implements TenantIndexFactory.Interface {
    constructor(
        private readonly indexConfigs: CmsEntryOpenSearchIndex.Interface[],
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

        return models.map<TenantIndexFactory.IndexConfig>(model => {
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

export const CreateElasticsearchIndexTask = TenantIndexFactory.createImplementation({
    implementation: CreateElasticsearchIndexTaskImpl,
    dependencies: [[CmsEntryOpenSearchIndex, { multiple: true }], ListModelsUseCase]
});
