import { CmsContentEntryAfterRequestChangesHookArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterRequestChangesHook = async (
    args: CmsContentEntryAfterRequestChangesHookArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("afterRequestChanges", args);
};
