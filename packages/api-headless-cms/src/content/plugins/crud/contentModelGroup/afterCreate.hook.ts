import {
    CmsContentModelGroupStorageOperations,
    CmsContext,
    CmsContentModelGroupStorageOperationsAfterCreateArgs
} from "../../../../types";

interface Args extends CmsContentModelGroupStorageOperationsAfterCreateArgs {
    context: CmsContext;
    storageOperations: CmsContentModelGroupStorageOperations;
}
export const afterCreateHook = async ({ input, group, storageOperations }: Args): Promise<void> => {
    if (!storageOperations.afterCreate) {
        return;
    }
    await storageOperations.afterCreate({
        group,
        input
    });
};
