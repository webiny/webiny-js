import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryAfterRequestReviewHookArgs } from "../../../../types";

export const afterRequestReviewHook = async (
    args: CmsContentEntryAfterRequestReviewHookArgs
): Promise<void> => {
    // if (args.storageOperations.afterRequestReview) {
    //     await args.storageOperations.afterRequestReview(args.model, args);
    // }
    await runContentEntryLifecycleHooks("afterRequestReview", args);
};
