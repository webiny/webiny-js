import { GQLHandlerCallableParams, useGqlHandler } from "./useGqlHandler";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import {
    createAdminHeadlessCmsContext,
    createAdminHeadlessCmsGraphQL
} from "@webiny/api-headless-cms";

export const useContentGqlHandler = (
    params: Omit<GQLHandlerCallableParams, "createHeadlessCmsApp">
) => {
    return useGqlHandler({
        ...params,
        setupTenancyAndSecurityGraphQL: true,
        plugins: (params.plugins || []).concat([
            graphQLHandlerPlugins(),
            createAdminHeadlessCmsGraphQL()
        ]),
        createHeadlessCmsApp: createAdminHeadlessCmsContext
    });
};
