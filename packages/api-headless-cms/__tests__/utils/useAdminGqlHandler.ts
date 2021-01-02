import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { GQLHandlerCallableArgsType, useGqlHandler } from "./useGqlHandler";
import cmsPlugins from "../../src/plugins";
import contentModelGroup from "../../src/content/plugins/crud/contentModelGroup.crud";

export const useAdminGqlHandler = (args: GQLHandlerCallableArgsType = { path: "" }) => {
    return useGqlHandler({
        ...args,
        plugins: [graphQLHandlerPlugins(), cmsPlugins(), contentModelGroup()]
    });
};
