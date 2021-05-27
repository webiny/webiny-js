import { CmsContentEntryAfterRequestChangesHookArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterRequestChangesHook = async (
    args: CmsContentEntryAfterRequestChangesHookArgs
): Promise<void> => {
    // if (args.storageOperations.beforeRequestChanges) {
    //     await args.storageOperations.beforeRequestChanges(args.model, args);
    // }
    await runContentEntryLifecycleHooks("afterRequestChanges", args);
};
