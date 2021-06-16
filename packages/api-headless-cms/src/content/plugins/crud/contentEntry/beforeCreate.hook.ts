import { CmsContentEntryBeforeCreateHookArgs } from "../../../../types";
import { markLockedFields } from "./markLockedFields";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const beforeCreateHook = async (
    args: CmsContentEntryBeforeCreateHookArgs
): Promise<void> => {
    await markLockedFields(args);
    await runContentEntryLifecycleHooks("beforeCreate", args);
};
