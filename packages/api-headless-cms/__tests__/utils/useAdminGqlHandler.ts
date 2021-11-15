import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { GQLHandlerCallableParams, useGqlHandler } from "./useGqlHandler";
import { createAdminHeadlessCmsContext, createAdminHeadlessCmsGraphQL } from "~/index";

export const useAdminGqlHandler = (
    params: Omit<GQLHandlerCallableParams, "createHeadlessCmsApp">
) => {
    return useGqlHandler({
        ...params,
        setupTenancyAndSecurityGraphQL: true,
        plugins: [graphQLHandlerPlugins(), createAdminHeadlessCmsGraphQL()],
        createHeadlessCmsApp: createAdminHeadlessCmsContext
    });
};
