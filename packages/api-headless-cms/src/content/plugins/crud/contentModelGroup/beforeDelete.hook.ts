import WebinyError from "@webiny/error";
import {
    CmsContentModelGroupCrud,
    CmsContentModelGroupCrudBeforeDeleteArgs,
    CmsContext
} from "../../../../types";

interface Args extends CmsContentModelGroupCrudBeforeDeleteArgs {
    context: CmsContext;
    crud: CmsContentModelGroupCrud;
}
export const beforeDeleteHook = async ({ group, context, crud }: Args): Promise<void> => {
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
    if (!crud.beforeDelete) {
        return;
    }
    await crud.beforeDelete({
        group
    });
};
