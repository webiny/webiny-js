import { CmsContentEntryBeforeCreateFromRevisionHookArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const beforeCreateRevisionFromHook = async (
    args: CmsContentEntryBeforeCreateFromRevisionHookArgs
): Promise<void> => {
    // if (args.storageOperations.beforeCreateRevisionFrom) {
    //     await args.storageOperations.beforeCreateRevisionFrom(args.model, args);
    // }
    await runContentEntryLifecycleHooks("beforeCreateRevisionFrom", args);
};
