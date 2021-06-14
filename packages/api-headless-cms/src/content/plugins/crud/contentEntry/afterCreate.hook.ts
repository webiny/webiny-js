import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryAfterCreateHookArgs } from "../../../../types";

export const afterCreateHook = async (args: CmsContentEntryAfterCreateHookArgs): Promise<void> => {
    await runContentEntryLifecycleHooks("afterCreate", args);
};
