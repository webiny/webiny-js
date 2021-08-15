import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryAfterPublishHookArgs } from "../../../../types";

export const afterPublishHook = async (
    args: CmsContentEntryAfterPublishHookArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("afterPublish", args);
};
