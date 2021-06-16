import { markLockedFields } from "./markLockedFields";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforeUpdateHookArgs } from "../../../../types";

export const beforeUpdateHook = async (
    args: CmsContentEntryBeforeUpdateHookArgs
): Promise<void> => {
    await markLockedFields(args);
    await runContentEntryLifecycleHooks("beforeUpdate", args);
};
