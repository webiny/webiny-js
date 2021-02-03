import { CmsContentEntryHookPluginArgs } from "@webiny/api-headless-cms/types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterSaveHook = async (args: CmsContentEntryHookPluginArgs): Promise<void> => {
    await runContentEntryLifecycleHooks("afterSave", args);
};
