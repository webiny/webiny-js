import { CmsContentModel, CmsContext } from "@webiny/api-headless-cms/types";

interface Args {
    context: CmsContext;
    model: CmsContentModel;
}
export const afterDeleteHook = async (args: Args) => {
    const { context } = args;
    await context.cms.settings.updateContentModelLastChange();
};
