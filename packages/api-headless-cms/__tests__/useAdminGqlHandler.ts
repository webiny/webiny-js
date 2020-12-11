import { GQLHandlerCallableArgsType, useGqlHandler } from "./useGqlHandler";
import cmsPlugins from "@webiny/api-headless-cms/plugins";

export const useAdminGqlHandler = (args: GQLHandlerCallableArgsType = {}) => {
    return useGqlHandler({
        ...args,
        plugins: [cmsPlugins()]
    });
};
