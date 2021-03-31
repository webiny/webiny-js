import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforeRequestChangesHookArgs } from "../../../../types";

export const beforeRequestChangesHook = async (
    args: CmsContentEntryBeforeRequestChangesHookArgs
): Promise<void> => {
    // if (args.storageOperations.beforeRequestChanges) {
    //     await args.storageOperations.beforeRequestChanges(args.model, args);
    // }
    await runContentEntryLifecycleHooks("beforeRequestChanges", args);
};
