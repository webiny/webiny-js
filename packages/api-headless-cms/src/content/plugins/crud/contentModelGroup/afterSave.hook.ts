import { CmsContext } from "@webiny/api-headless-cms/types";

export const afterSaveHook = async (context: CmsContext): Promise<void> => {
    await context.cms.settings.updateContentModelLastChange();
};
