import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { GQLHandlerCallableArgs, useGqlHandler } from "./useGqlHandler";
import cmsPlugins from "../../src/plugins";
import contentModelGroup from "../../src/content/plugins/crud/contentModelGroup.crud";

export const useAdminGqlHandler = (
    args: GQLHandlerCallableArgs = { path: "" },
    extraPlugins: any[] = []
) => {
    return useGqlHandler({
        ...args,
        plugins: [graphQLHandlerPlugins(), cmsPlugins(), contentModelGroup()].concat(extraPlugins)
    });
};
