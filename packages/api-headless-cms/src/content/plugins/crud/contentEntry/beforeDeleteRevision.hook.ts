import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforeDeleteRevisionHookArgs } from "../../../../types";

export const beforeDeleteRevisionHook = async (
    args: CmsContentEntryBeforeDeleteRevisionHookArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("beforeDeleteRevision", args);
};
