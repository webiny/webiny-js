import {
    CmsContentEntryStorageOperations,
    CmsContentEntryStorageOperationsAfterDeleteRevisionArgs, CmsContentModel, CmsContext
} from "../../../../types";
import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";

interface Args extends CmsContentEntryStorageOperationsAfterDeleteRevisionArgs {
    context: CmsContext;
    model: CmsContentModel;
    storageOperations: CmsContentEntryStorageOperations;
}

export const afterDeleteRevisionHook = async (
    args: Args
): Promise<void> => {
    if (args.storageOperations.afterDeleteRevision) {
        await args.storageOperations.afterDeleteRevision(args.model, args);
    }
    await runContentEntryLifecycleHooks("afterDeleteRevision", args);
};
