import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryAfterUpdateHookArgs } from "../../../../types";

export const afterUpdateHook = async (args: CmsContentEntryAfterUpdateHookArgs): Promise<void> => {
    // if (args.storageOperations.afterUpdate) {
    //     await args.storageOperations.afterUpdate(args.model, args);
    // }
    await runContentEntryLifecycleHooks("afterUpdate", args);
};
