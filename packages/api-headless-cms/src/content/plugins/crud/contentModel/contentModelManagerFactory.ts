import {
    CmsContentModel,
    CmsContext,
    ContentModelManagerPlugin
} from "@webiny/api-headless-cms/types";

const defaultName = "content-model-manager-default";

export const contentModelManagerFactory = async (context: CmsContext, model: CmsContentModel) => {
    const pluginsByType = context.plugins.byType<ContentModelManagerPlugin>(
        "content-model-manager"
    );
    for (const plugin of pluginsByType) {
        const target = Array.isArray(plugin.targetCode) ? plugin.targetCode : [plugin.targetCode];
        if (target.includes(model.modelId) === true && plugin.name !== defaultName) {
            return await plugin.create(context, model);
        }
    }
    const plugin = pluginsByType.find(plugin => plugin.name === defaultName);
    if (!plugin) {
        throw new Error("There is no default plugin to create ContentModelManager");
    }
    return await plugin.create(context, model);
};
