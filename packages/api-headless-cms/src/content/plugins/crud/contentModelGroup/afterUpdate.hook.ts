import {
    CmsContentModelGroupCrud,
    CmsContentModelGroupCrudAfterUpdateArgs,
    CmsContext
} from "../../../../types";

interface Args extends CmsContentModelGroupCrudAfterUpdateArgs {
    context: CmsContext;
    crud: CmsContentModelGroupCrud;
}
export const afterUpdateHook = async ({ input, group, data, crud }: Args): Promise<void> => {
    if (!crud.afterUpdate) {
        return;
    }
    await crud.afterUpdate({
        data,
        group,
        input
    });
};
