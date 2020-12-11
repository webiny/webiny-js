import { GQLHandlerCallableArgsType, useGqlHandler } from "./useGqlHandler";
import cmsPlugins from "@webiny/api-headless-cms/plugins";
import graphQLHandlerPlugins from "@webiny/handler-graphql";

export const useAdminGqlHandler = (args: GQLHandlerCallableArgsType = {}) => {
    return useGqlHandler({
        ...args,
        plugins: [graphQLHandlerPlugins(), cmsPlugins()]
    });
};
