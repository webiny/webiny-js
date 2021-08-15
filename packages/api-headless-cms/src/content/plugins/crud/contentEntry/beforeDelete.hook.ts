import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryBeforeDeleteHookArgs } from "../../../../types";

export const beforeDeleteHook = async (
    args: CmsContentEntryBeforeDeleteHookArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("beforeDelete", args);
};
