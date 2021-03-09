import {
    CmsContentModelGroupCrud,
    CmsContext,
    CmsContentModelGroupCrudAfterCreateArgs
} from "../../../../types";

interface Args extends CmsContentModelGroupCrudAfterCreateArgs {
    context: CmsContext;
    crud: CmsContentModelGroupCrud;
}
export const afterCreateHook = async ({ input, group, crud }: Args): Promise<void> => {
    if (!crud.afterCreate) {
        return;
    }
    await crud.afterCreate({
        group,
        input
    });
};
