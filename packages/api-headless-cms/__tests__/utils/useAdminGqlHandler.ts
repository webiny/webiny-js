import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { GQLHandlerCallableArgsType, useGqlHandler } from "./useGqlHandler";
import cmsPlugins from "../../src/plugins";

export const useAdminGqlHandler = (args: GQLHandlerCallableArgsType = {}) => {
    return useGqlHandler({
        ...args,
        plugins: [graphQLHandlerPlugins(), cmsPlugins()]
    });
};
