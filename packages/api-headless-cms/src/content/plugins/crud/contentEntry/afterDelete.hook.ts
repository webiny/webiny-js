import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryAfterDeleteHookArgs } from "../../../../types";

export const afterDeleteHook = async (args: CmsContentEntryAfterDeleteHookArgs): Promise<void> => {
    await runContentEntryLifecycleHooks("afterDelete", args);
};
