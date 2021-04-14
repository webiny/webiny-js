import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforeDeleteHookArgs } from "../../../../types";

export const beforeDeleteHook = async (
    args: CmsContentEntryBeforeDeleteHookArgs
): Promise<void> => {
    // if (args.storageOperations.beforeDelete) {
    //     await args.storageOperations.beforeDelete(args.model, args);
    // }
    await runContentEntryLifecycleHooks("beforeDelete", args);
};
