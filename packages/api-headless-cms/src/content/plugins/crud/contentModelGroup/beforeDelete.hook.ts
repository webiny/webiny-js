import { CmsContext } from "@webiny/api-headless-cms/types";

export const beforeDeleteHook = async (context: CmsContext, id: string): Promise<void> => {
    const items = await context.cms.models.list({
        where: {
            groupId: id
        },
        limit: 1
    });

    if (items.length === 0) {
        return;
    }
    throw new Error("Cannot delete this group because there are models that belong to it.");
};
