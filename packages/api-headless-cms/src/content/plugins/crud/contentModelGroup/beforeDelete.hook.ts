import WebinyError from "@webiny/error";
import {
    CmsContentModelGroupStorageOperations,
    CmsContentModelGroupStorageOperationsBeforeDeleteArgs,
    CmsContext
} from "../../../../types";

interface Args extends CmsContentModelGroupStorageOperationsBeforeDeleteArgs {
    context: CmsContext;
    storageOperations: CmsContentModelGroupStorageOperations;
}
export const beforeDeleteHook = async ({
    group,
    context,
    storageOperations
}: Args): Promise<void> => {
    const models = await context.cms.models.noAuth().list();
    const items = models.filter(model => {
        return model.group.id === group.id;
    });

    if (items.length > 0) {
        throw new WebinyError(
            "Cannot delete this group because there are models that belong to it.",
            "BEFORE_DELETE_ERROR",
            {
                id: group.id
            }
        );
    }
    if (!storageOperations.beforeDelete) {
        return;
    }
    await storageOperations.beforeDelete({
        group
    });
};
