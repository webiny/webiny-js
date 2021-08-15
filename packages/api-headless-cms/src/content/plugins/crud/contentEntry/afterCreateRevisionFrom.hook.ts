import { CmsContentEntryAfterCreateFromRevisionHookArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterCreateRevisionFromHook = async (
    args: CmsContentEntryAfterCreateFromRevisionHookArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("afterCreateRevisionFrom", args);
};
