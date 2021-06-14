import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryAfterUpdateHookArgs } from "../../../../types";

export const afterUpdateHook = async (args: CmsContentEntryAfterUpdateHookArgs): Promise<void> => {
    await runContentEntryLifecycleHooks("afterUpdate", args);
};
