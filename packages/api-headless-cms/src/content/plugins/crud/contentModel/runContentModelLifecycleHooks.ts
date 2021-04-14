import {
    CmsContentModelCreateHookPluginArgs,
    CmsContentModelHookPlugin,
    CmsContentModelHookPluginArgs,
    CmsContentModelUpdateHookPluginArgs
} from "../../../../types";

export const runContentModelLifecycleHooks = async <
    T extends
        | CmsContentModelHookPluginArgs
        | CmsContentModelCreateHookPluginArgs
        | CmsContentModelUpdateHookPluginArgs
>(
    hookName: string,
    args: T
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
