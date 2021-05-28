import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforeRequestReviewHookArgs } from "../../../../types";

export const beforeRequestReviewHook = async (
    args: CmsContentEntryBeforeRequestReviewHookArgs
): Promise<void> => {
    // if (args.storageOperations.beforeRequestReview) {
    //     await args.storageOperations.beforeRequestReview(args.model, args);
    // }
    await runContentEntryLifecycleHooks("beforeRequestReview", args);
};
