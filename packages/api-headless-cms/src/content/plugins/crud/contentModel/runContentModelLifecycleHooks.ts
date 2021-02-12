import {
    CmsContentModelHookPlugin,
    CmsContentModelHookPluginArgs,
    CmsContentModelUpdateHookPluginArgs
} from "@webiny/api-headless-cms/types";

export const runContentModelLifecycleHooks = async (
    hookName: string,
    args: CmsContentModelHookPluginArgs | CmsContentModelUpdateHookPluginArgs
): Promise<void> => {
    const { context } = args;
    const hookPlugins = context.plugins.byType<CmsContentModelHookPlugin>("cms-content-model-hook");
    for (const hookPlugin of hookPlugins) {
        if (typeof hookPlugin[hookName] !== "function") {
            continue;
        }
        await hookPlugin[hookName](args);
    }
};
