import { CmsContentEntryHookPluginArgs } from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

export const beforeDeleteRevisionHook = async (
    args: CmsContentEntryHookPluginArgs
): Promise<void> => {
    await runContentEntryLifecycleHooks("beforeDeleteRevision", args);
};
