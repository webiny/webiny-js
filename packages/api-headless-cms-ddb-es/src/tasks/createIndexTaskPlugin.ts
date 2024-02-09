import {
    createElasticsearchIndexTaskPlugin,
    CreateElasticsearchIndexTaskPluginIndex
} from "@webiny/api-elasticsearch-tasks";
import { configurations } from "~/configurations";
import { CmsContext } from "~/types";

export const createIndexTaskPluginTest = () => {
    return createElasticsearchIndexTaskPlugin<CmsContext>({
        name: "elasticsearch.cms.createIndexTaskPlugin",
        getIndexList: async ({ context, locale, tenant }) => {
            const originalTenant = context.tenancy.getCurrentTenant();
            if (!originalTenant) {
                return [];
            }
            const originalLocale = context.i18n.getCurrentLocale("content");
            if (!originalLocale) {
                return [];
            }

            const selectedTenant = await context.tenancy.getTenantById(tenant);
            if (!selectedTenant) {
                return [];
            }
            const selectedLocale = await context.i18n.getLocale(locale);
            if (!selectedLocale) {
                return [];
            }
            const models = await context.cms.listModels();
            if (models.length === 0) {
                return [];
            }

            context.tenancy.setCurrentTenant(selectedTenant);
            context.i18n.setCurrentLocale("content", selectedLocale);

            const indexes = models.map<CreateElasticsearchIndexTaskPluginIndex>(model => {
                const { index } = configurations.es({
                    model: {
                        modelId: model.modelId,
                        tenant,
                        locale
                    }
                });
                return {
                    index,
                    settings: configurations.indexSettings({
                        context,
                        model: {
                            locale
                        }
                    })
                };
            });

            context.tenancy.setCurrentTenant(originalTenant);
            context.i18n.setCurrentLocale("content", originalLocale);
            return indexes;
        }
    });
};
