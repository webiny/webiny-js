import { CmsContentEntryHookPluginArgs } from "@webiny/api-headless-cms/types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterRequestReviewHook = async (
    args: CmsContentEntryHookPluginArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("afterRequestReview", args);
};
