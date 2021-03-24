import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforeUnpublishHookArgs } from "../../../../types";

export const beforeUnpublishHook = async (
    args: CmsContentEntryBeforeUnpublishHookArgs
): Promise<void> => {
    // if (args.storageOperations.beforeUnpublish) {
    //     await args.storageOperations.beforeUnpublish(args.model, args);
    // }
    await runContentEntryLifecycleHooks("beforeUnpublish", args);
};
