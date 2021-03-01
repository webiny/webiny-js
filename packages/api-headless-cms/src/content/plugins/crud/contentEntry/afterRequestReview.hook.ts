import { CmsContentEntryHookPluginArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterRequestReviewHook = async (
    args: CmsContentEntryHookPluginArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("afterRequestReview", args);
};
