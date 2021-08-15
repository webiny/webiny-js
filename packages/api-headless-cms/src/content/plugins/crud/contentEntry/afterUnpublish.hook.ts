import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryAfterUnpublishHookArgs } from "../../../../types";

export const afterUnpublishHook = async (
    args: CmsContentEntryAfterUnpublishHookArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("afterUnpublish", args);
};
