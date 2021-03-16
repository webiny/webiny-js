import { CmsContentEntryHookPluginArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterUpdateHook = async (args: CmsContentEntryHookPluginArgs): Promise<void> => {
    await runContentEntryLifecycleHooks("afterUpdate", args);
};
