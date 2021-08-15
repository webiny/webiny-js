import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryAfterRequestReviewHookArgs } from "../../../../types";

export const afterRequestReviewHook = async (
    args: CmsContentEntryAfterRequestReviewHookArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("afterRequestReview", args);
};
