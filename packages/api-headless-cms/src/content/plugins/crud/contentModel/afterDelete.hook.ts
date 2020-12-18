import { CmsContext } from "@webiny/api-headless-cms/types";

export const afterDeleteHook = async (context: CmsContext) => {
    await context.cms.settings.updateContentModelLastChange();
};
