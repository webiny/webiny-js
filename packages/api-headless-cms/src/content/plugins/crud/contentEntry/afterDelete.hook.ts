import { CmsContentEntryHookPluginArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterDeleteHook = async (args: CmsContentEntryHookPluginArgs): Promise<void> => {
    await runContentEntryLifecycleHooks("afterDelete", args);
};
