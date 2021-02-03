import { CmsContentEntryHookPluginArgs } from "@webiny/api-headless-cms/types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const afterDeleteRevisionHook = async (
    args: CmsContentEntryHookPluginArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("afterDeleteRevision", args);
};
