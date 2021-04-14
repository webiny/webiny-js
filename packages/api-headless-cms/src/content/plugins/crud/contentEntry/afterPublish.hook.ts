import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryAfterPublishHookArgs } from "../../../../types";

export const afterPublishHook = async (
    args: CmsContentEntryAfterPublishHookArgs
): Promise<void> => {
    // if (args.storageOperations.afterPublish) {
    //     await args.storageOperations.afterPublish(args.model, args);
    // }
    await runContentEntryLifecycleHooks("afterPublish", args);
};
