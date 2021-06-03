import {
    CmsContentModelGroupStorageOperations,
    CmsContentModelGroupStorageOperationsBeforeUpdateArgs,
    CmsContext
} from "../../../../types";

interface Args extends CmsContentModelGroupStorageOperationsBeforeUpdateArgs {
    context: CmsContext;
    storageOperations: CmsContentModelGroupStorageOperations;
}
export const beforeUpdateHook = async ({
    input,
    group,
    data,
    storageOperations
}: Args): Promise<void> => {
    if (!storageOperations.beforeUpdate) {
        return;
    }
    await storageOperations.beforeUpdate({
        data,
        group,
        input
    });
};
