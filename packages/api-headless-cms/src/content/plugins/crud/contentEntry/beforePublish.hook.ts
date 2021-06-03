import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforePublishHookArgs } from "../../../../types";
export const beforePublishHook = async (
    args: CmsContentEntryBeforePublishHookArgs
): Promise<void> => {
    // if (args.storageOperations.beforePublish) {
    //     await args.storageOperations.beforePublish(args.model, args);
    // }
    await runContentEntryLifecycleHooks("beforePublish", args);
};
