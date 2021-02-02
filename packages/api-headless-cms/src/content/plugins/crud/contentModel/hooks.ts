import {
    CmsContentModelHookPlugin,
    CmsContentModelHookPluginArgs,
    CmsContentModelSaveHookPluginArgs
} from "@webiny/api-headless-cms/types";

export const runContentModelLifecycleHooks = async (
    hookName: string,
    args: CmsContentModelHookPluginArgs | CmsContentModelSaveHookPluginArgs
): Promise<void> => {
    const { context } = args;
    const hookPlugins = context.plugins.byType<CmsContentModelHookPlugin>("content-model-hook");
    for (const hookPlugin of hookPlugins) {
        if (typeof hookPlugin[hookName] !== "function") {
            continue;
        }
        await hookPlugin[hookName](args);
    }
};
