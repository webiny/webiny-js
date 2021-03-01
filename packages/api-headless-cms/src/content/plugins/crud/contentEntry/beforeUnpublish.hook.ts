import { CmsContentEntryHookPluginArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const beforeUnpublishHook = async (args: CmsContentEntryHookPluginArgs): Promise<void> => {
    await runContentEntryLifecycleHooks("beforeUnpublish", args);
};
