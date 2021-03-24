import { CmsContentEntryAfterDeleteRevisionHookArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterDeleteRevisionHook = async (
    args: CmsContentEntryAfterDeleteRevisionHookArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("afterDeleteRevision", args);
};
