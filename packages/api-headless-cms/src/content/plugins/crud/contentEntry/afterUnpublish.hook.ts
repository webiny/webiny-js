import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryAfterUnpublishHookArgs } from "../../../../types";

export const afterUnpublishHook = async (
    args: CmsContentEntryAfterUnpublishHookArgs
): Promise<void> => {
    // if (args.storageOperations.beforeUnpublish) {
    //     await args.storageOperations.beforeUnpublish(args.model, args);
    // }
    await runContentEntryLifecycleHooks("afterUnpublish", args);
};
