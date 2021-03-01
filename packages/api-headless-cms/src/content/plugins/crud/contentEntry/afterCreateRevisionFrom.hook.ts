import { CmsContentEntryHookPluginArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterCreateRevisionFromHook = async (
    args: CmsContentEntryHookPluginArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("afterCreateRevisionFrom", args);
};
