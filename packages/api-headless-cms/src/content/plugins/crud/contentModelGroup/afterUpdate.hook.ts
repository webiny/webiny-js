import {
    CmsContentModelGroupStorageOperations,
    CmsContentModelGroupStorageOperationsAfterUpdateArgs,
    CmsContext
} from "../../../../types";

interface Args extends CmsContentModelGroupStorageOperationsAfterUpdateArgs {
    context: CmsContext;
    storageOperations: CmsContentModelGroupStorageOperations;
}
export const afterUpdateHook = async ({
    input,
    group,
    data,
    storageOperations
}: Args): Promise<void> => {
    if (!storageOperations.afterUpdate) {
        return;
    }
    await storageOperations.afterUpdate({
        data,
        group,
        input
    });
};
