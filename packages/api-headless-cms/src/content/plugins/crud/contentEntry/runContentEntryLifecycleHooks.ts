import {
    CmsContentEntryHookPlugin,
    CmsContentEntryHookPluginArgs
} from "@webiny/api-headless-cms/types";

export const runContentEntryLifecycleHooks = async (
    hookName: string,
    args: CmsContentEntryHookPluginArgs
): Promise<void> => {
    const { context } = args;
    const hookPlugins = context.plugins.byType<CmsContentEntryHookPlugin>("content-entry-hook");
    for (const hookPlugin of hookPlugins) {
        if (typeof hookPlugin[hookName] !== "function") {
            continue;
        }
        await hookPlugin[hookName](args);
    }
};
