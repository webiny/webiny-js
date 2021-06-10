import { CmsContentEntryBeforeCreateFromRevisionHookArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const beforeCreateRevisionFromHook = async (
    args: CmsContentEntryBeforeCreateFromRevisionHookArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("beforeCreateRevisionFrom", args);
};
