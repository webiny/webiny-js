import { CmsContentEntryHookPluginArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterUnpublishHook = async (args: CmsContentEntryHookPluginArgs): Promise<void> => {
    await runContentEntryLifecycleHooks("afterUnpublish", args);
};
