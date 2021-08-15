import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforeUnpublishHookArgs } from "../../../../types";

export const beforeUnpublishHook = async (
    args: CmsContentEntryBeforeUnpublishHookArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("beforeUnpublish", args);
};
