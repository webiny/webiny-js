import { CmsContentEntryAfterCreateFromRevisionHookArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterCreateRevisionFromHook = async (
    args: CmsContentEntryAfterCreateFromRevisionHookArgs
): Promise<void> => {
    // if (args.storageOperations.afterCreateRevisionFrom) {
    //     await args.storageOperations.afterCreateRevisionFrom(args.model, args);
    // }
    await runContentEntryLifecycleHooks("afterCreateRevisionFrom", args);
};
