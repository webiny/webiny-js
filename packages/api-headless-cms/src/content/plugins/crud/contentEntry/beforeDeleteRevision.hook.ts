import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforeDeleteRevisionHookArgs } from "../../../../types";

export const beforeDeleteRevisionHook = async (
    args: CmsContentEntryBeforeDeleteRevisionHookArgs
): Promise<void> => {
    // if (args.storageOperations.beforeDeleteRevision) {
    //     await args.storageOperations.beforeDeleteRevision(args.model, args);
    // }
    await runContentEntryLifecycleHooks("beforeDeleteRevision", args);
};
