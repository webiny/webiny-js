import { CmsContext } from "@webiny/api-headless-cms/types";

export const afterSaveHook = async (context: CmsContext): Promise<void> => {
    const environment = context.cms.getEnvironment();
    await context.cms.environments.updateChangedOn(environment);
};
