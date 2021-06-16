import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforePublishHookArgs } from "../../../../types";
export const beforePublishHook = async (
    args: CmsContentEntryBeforePublishHookArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("beforePublish", args);
};
