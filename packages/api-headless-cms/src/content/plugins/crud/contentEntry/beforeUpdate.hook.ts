import { CmsContentEntryHookPluginArgs } from "@webiny/api-headless-cms/types";
import { markLockedFields } from "./markLockedFields";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const beforeUpdateHook = async (args: CmsContentEntryHookPluginArgs): Promise<void> => {
    await markLockedFields(args);
    await runContentEntryLifecycleHooks("beforeUpdate", args);
};
