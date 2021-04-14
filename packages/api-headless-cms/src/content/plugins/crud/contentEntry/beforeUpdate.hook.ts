import { markLockedFields } from "./markLockedFields";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforeUpdateHookArgs } from "../../../../types";

export const beforeUpdateHook = async (
    args: CmsContentEntryBeforeUpdateHookArgs
): Promise<void> => {
    await markLockedFields(args);
    // if (args.storageOperations.beforeUpdate) {
    //     await args.storageOperations.beforeUpdate(args.model, args);
    // }
    await runContentEntryLifecycleHooks("beforeUpdate", args);
};
