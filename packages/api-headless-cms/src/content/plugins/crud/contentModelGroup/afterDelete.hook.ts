import {
    CmsContentModelGroup,
    CmsContentModelGroupCrud,
    CmsContentModelGroupCrudAfterDeleteArgs,
    CmsContext
} from "../../../../types";

interface Args extends CmsContentModelGroupCrudAfterDeleteArgs {
    context: CmsContext;
    group: CmsContentModelGroup;
    crud: CmsContentModelGroupCrud;
}
export const afterDeleteHook = async ({ group, crud }: Args): Promise<void> => {
    if (!crud.afterDelete) {
        return;
    }
    await crud.afterDelete({
        group
    });
};
