import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforeRequestReviewHookArgs } from "../../../../types";

export const beforeRequestReviewHook = async (
    args: CmsContentEntryBeforeRequestReviewHookArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("beforeRequestReview", args);
};
