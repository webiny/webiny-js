import { CmsContentEntryHookPluginArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const beforeCreateRevisionFromHook = async (
    args: CmsContentEntryHookPluginArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("beforeCreateRevisionFrom", args);
};
