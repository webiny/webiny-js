import { CmsContentEntryBeforeCreateHookArgs } from "../../../../types";
import { markLockedFields } from "./markLockedFields";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const beforeCreateHook = async (
    args: CmsContentEntryBeforeCreateHookArgs
): Promise<void> => {
    await markLockedFields(args);
    // if (args.storageOperations.beforeCreate) {
    //     await args.storageOperations.beforeCreate(args.model, args);
    // }
    await runContentEntryLifecycleHooks("beforeCreate", args);
};
