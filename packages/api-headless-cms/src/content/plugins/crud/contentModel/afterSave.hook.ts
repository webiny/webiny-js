import { CmsContext } from "@webiny/api-headless-cms/types";

export const afterSaveHook = async (context: CmsContext) => {
    await context.cms.settings.updateContentModelLastChange();
};
