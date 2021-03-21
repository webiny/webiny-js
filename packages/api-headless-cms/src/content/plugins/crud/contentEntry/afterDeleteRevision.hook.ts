import { CmsContentEntryAfterDeleteRevisionHookArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterDeleteRevisionHook = async (
    args: CmsContentEntryAfterDeleteRevisionHookArgs
): Promise<void> => {
    if (args.storageOperations.afterDeleteRevision) {
        await args.storageOperations.afterDeleteRevision(args.model, args);
    }
    await runContentEntryLifecycleHooks("afterDeleteRevision", args);
};
