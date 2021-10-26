import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { GQLHandlerCallableArgs, useGqlHandler } from "./useGqlHandler";
import cmsPlugins from "../../src/plugins";
import contentModelGroup from "../../src/content/plugins/crud/contentModelGroup.crud";

export const useAdminGqlHandler = (args: GQLHandlerCallableArgs) => {
    return useGqlHandler({
        ...args,
        path: args.path || "",
        setupTenancyAndSecurityGraphQL: true,
        plugins: [graphQLHandlerPlugins(), cmsPlugins(), contentModelGroup()]
    });
};
