import { CmsContentEntryHookPluginArgs } from "@webiny/api-headless-cms/types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterPublishHook = async (args: CmsContentEntryHookPluginArgs): Promise<void> => {
    await runContentEntryLifecycleHooks("afterPublish", args);
};
