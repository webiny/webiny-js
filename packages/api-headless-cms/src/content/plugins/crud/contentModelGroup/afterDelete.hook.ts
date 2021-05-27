import {
    CmsContentModelGroup,
    CmsContentModelGroupStorageOperations,
    CmsContentModelGroupStorageOperationsAfterDeleteArgs,
    CmsContext
} from "../../../../types";

interface Args extends CmsContentModelGroupStorageOperationsAfterDeleteArgs {
    context: CmsContext;
    group: CmsContentModelGroup;
    storageOperations: CmsContentModelGroupStorageOperations;
}
export const afterDeleteHook = async ({ group, storageOperations }: Args): Promise<void> => {
    if (!storageOperations.afterDelete) {
        return;
    }
    await storageOperations.afterDelete({
        group
    });
};
