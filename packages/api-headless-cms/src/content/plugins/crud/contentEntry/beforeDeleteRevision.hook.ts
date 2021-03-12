import { runContentEntryLifecycleHooks } from "./runContentEntryLifecycleHooks";
import {
    CmsContentEntryStorageOperations,
    CmsContentEntryStorageOperationsBeforeDeleteRevisionArgs, CmsContentModel, CmsContext
} from "../../../../types";

interface Args extends CmsContentEntryStorageOperationsBeforeDeleteRevisionArgs {
    context: CmsContext;
    model: CmsContentModel;
    storageOperations: CmsContentEntryStorageOperations;
}
export const beforeDeleteRevisionHook = async (
    args: Args
): Promise<void> => {
    if (args.storageOperations.beforeDeleteRevision) {
        await args.storageOperations.beforeDeleteRevision(args.model, args);
    }
    await runContentEntryLifecycleHooks("beforeDeleteRevision", args);
};
