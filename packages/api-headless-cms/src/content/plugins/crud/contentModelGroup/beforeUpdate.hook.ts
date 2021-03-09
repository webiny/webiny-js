import {
    CmsContentModelGroupCrud,
    CmsContentModelGroupCrudBeforeUpdateArgs,
    CmsContext
} from "../../../../types";

interface Args extends CmsContentModelGroupCrudBeforeUpdateArgs {
    context: CmsContext;
    crud: CmsContentModelGroupCrud;
}
export const beforeUpdateHook = async ({ input, group, data, crud }: Args): Promise<void> => {
    if (!crud.beforeUpdate) {
        return;
    }
    await crud.beforeUpdate({
        data,
        group,
        input
    });
};
