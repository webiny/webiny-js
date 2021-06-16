import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforeRequestChangesHookArgs } from "../../../../types";

export const beforeRequestChangesHook = async (
    args: CmsContentEntryBeforeRequestChangesHookArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("beforeRequestChanges", args);
};
