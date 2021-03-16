import { CmsContentEntryHookPluginArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const beforePublishHook = async (args: CmsContentEntryHookPluginArgs): Promise<void> => {
    await runContentEntryLifecycleHooks("beforePublish", args);
};
