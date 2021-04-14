import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import { CmsContentEntryAfterCreateHookArgs } from "../../../../types";

export const afterCreateHook = async (args: CmsContentEntryAfterCreateHookArgs): Promise<void> => {
    // if (args.storageOperations.afterCreate) {
    //     await args.storageOperations.afterCreate(args.model, args);
    // }
    await runContentEntryLifecycleHooks("afterCreate", args);
};
