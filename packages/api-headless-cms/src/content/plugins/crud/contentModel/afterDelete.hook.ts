import { CmsContext, CmsEnvironmentUpdateInputType } from "@webiny/api-headless-cms/types";

export const afterDeleteHook = async (context: CmsContext) => {
    const environment = context.cms.getEnvironment();
    // we need to add this so onChange will update
    const data: CmsEnvironmentUpdateInputType = {
        name: environment.name
    };
    await context.cms.environments.update(environment.id, data, environment);
};
