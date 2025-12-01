import type { CreateElasticsearchIndexTaskPluginIndex } from "@webiny/api-elasticsearch-tasks";
import { createElasticsearchIndexTaskPlugin } from "@webiny/api-elasticsearch-tasks";
import { configurations } from "~/configurations.js";
import type { CmsContext } from "~/types.js";

export const createIndexTaskPluginTest = () => {
    return createElasticsearchIndexTaskPlugin<CmsContext>({
        name: "elasticsearch.cms.createIndexTaskPlugin",
        getIndexList: async ({ context, tenant }) => {
            const originalTenant = context.tenancy.getCurrentTenant();
            if (!originalTenant) {
                return [];
            }
            const selectedTenant = await context.tenancy.getTenantById(tenant);
            if (!selectedTenant) {
                return [];
            }

            const models = await context.cms.listModels();
            if (models.length === 0) {
                return [];
            }

            context.tenancy.setCurrentTenant(selectedTenant);

            const indexes = models.map<CreateElasticsearchIndexTaskPluginIndex>(model => {
                const { index } = configurations.es({
                    model: {
                        modelId: model.modelId,
                        tenant
                    }
                });
                return {
                    index,
                    settings: configurations.indexSettings({
                        context
                    })
                };
            });

            context.tenancy.setCurrentTenant(originalTenant);
            return indexes;
        }
    });
};
