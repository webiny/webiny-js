import { CmsContentEntryHookPlugin, CmsContext } from "../../../../types";

export const runContentEntryLifecycleHooks = async (
    hookName: string,
    // TODO fix this
    args: { context: CmsContext }
): Promise<void> => {
    const { context } = args;
    const hookPlugins = context.plugins.byType<CmsContentEntryHookPlugin>("cms-content-entry-hook");
    for (const hookPlugin of hookPlugins) {
        if (typeof hookPlugin[hookName] !== "function") {
            continue;
        }
        await hookPlugin[hookName](args);
    }
};
