import { CmsContentModelType, CmsContext } from "@webiny/api-headless-cms/types";

type ArgsType = {
    context: CmsContext;
    model: CmsContentModelType;
};
export const afterSaveHook = async (args: ArgsType) => {
    const { context } = args;
    await context.cms.settings.updateContentModelLastChange();
};
