import { CmsModel, CmsContext, ModelManagerPlugin, CmsModelManager } from "~/types";

const defaultName = "content-model-manager-default";

export const contentModelManagerFactory = async (
    context: CmsContext,
    model: CmsModel
): Promise<CmsModelManager> => {
    const pluginsByType = context.plugins
        .byType<ModelManagerPlugin>("cms-content-model-manager")
        .reverse();
    for (const plugin of pluginsByType) {
        const target = Array.isArray(plugin.modelId) ? plugin.modelId : [plugin.modelId];
        if (target.includes(model.modelId) === true && plugin.name !== defaultName) {
            return await plugin.create(context, model);
        }
    }
    const plugin = pluginsByType.find(plugin => plugin.name === defaultName);
    if (!plugin) {
        throw new Error("There is no default plugin to create CmsModelManager");
    }
    return await plugin.create(context, model);
};
