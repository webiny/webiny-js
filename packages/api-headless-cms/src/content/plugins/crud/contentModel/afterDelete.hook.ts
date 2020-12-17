import { CmsContext } from "@webiny/api-headless-cms/types";

export const afterDeleteHook = async (context: CmsContext) => {
    const environment = context.cms.getEnvironment();
    await context.cms.environments.updateChangedOn(environment);
};
